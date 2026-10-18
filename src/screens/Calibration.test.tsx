import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PitchSample } from '../audio/mic'
import { komaToHz } from '../music/pitch'
import { getSettings, resetDbForTests, saveSettings } from '../store/db'
import { seededRng } from '../util/rng'

let emit: ((s: PitchSample) => void) | null = null
const stopper = vi.fn()
const startPitchStream = vi.fn(async (cb: (s: PitchSample) => void) => {
  emit = cb
  return stopper
})
vi.mock('../audio/mic', async (orig) => {
  const actual = await orig<typeof import('../audio/mic')>()
  return { ...actual, startPitchStream: (cb: (s: PitchSample) => void) => startPitchStream(cb) }
})

import { Calibration } from './Calibration'

beforeEach(async () => {
  await resetDbForTests()
  emit = null
  stopper.mockClear()
  startPitchStream.mockClear()
})
afterEach(() => {
  cleanup()
  location.hash = ''
})

const REF_KOMA = 62 // Re5 (Nevâ), yazılı

/** 100 ms arayla örnek gönderir (±2 sent tohumlu saçılma); varsayılan 3,1 sn sürer. */
function blow(hz: number, opts: { count?: number; t0?: number; nullEvery?: number } = {}) {
  const { count = 32, t0 = 5000, nullEvery = 0 } = opts
  const rng = seededRng(3)
  act(() => {
    for (let i = 0; i < count; i++) {
      const isNull = nullEvery > 0 && i % nullEvery === 0
      const h = hz * 2 ** (((rng() * 2 - 1) * 2) / 1200)
      emit!({ t: t0 + i * 100, hz: isNull ? null : h, clarity: isNull ? 0.2 : 0.99 })
    }
  })
}

async function begin(onDone = vi.fn()) {
  render(<Calibration onDone={onDone} />)
  const btn = await screen.findByRole('button', { name: 'Başla' })
  await waitFor(() => expect((btn as HTMLButtonElement).disabled).toBe(false))
  fireEvent.click(btn)
  await waitFor(() => expect(emit).not.toBeNull())
  return onDone
}

describe('Calibration çıkış yolları', () => {
  it('"← Geri" bağlantısı ve "Şimdi değil" varsayılan olarak ana ekrana döner', async () => {
    location.hash = '#/kalibrasyon'
    render(<Calibration />)
    const back = await screen.findByRole('link', { name: '← Geri' })
    expect(back.getAttribute('href')).toBe('#/')
    fireEvent.click(screen.getByRole('button', { name: 'Şimdi değil' }))
    expect(location.hash).toBe('#/')
  })

  it('onCancel verilince "← Geri" ve "Şimdi değil" onu çağırır', async () => {
    const onCancel = vi.fn()
    location.hash = '#/kalibrasyon'
    render(<Calibration onDone={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(await screen.findByRole('link', { name: '← Geri' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Şimdi değil' }))
    expect(onCancel).toHaveBeenCalledTimes(2)
    expect(location.hash).toBe('#/kalibrasyon')
  })

  it('dinlerken "Vazgeç" mikrofonu kapatır ve başa döner; geç gelen örnekler sonuç üretmez', async () => {
    await begin()
    expect(screen.getByText('Dinleniyor…')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Vazgeç' }))
    expect(stopper).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: 'Başla' })).toBeTruthy()
    blow(komaToHz(REF_KOMA + 9))
    expect(screen.queryByText(/Neyiniz/)).toBeNull()
  })
})

describe('Calibration', () => {
  it('Nevâ şemasını ve yönergeyi gösterir', async () => {
    render(<Calibration onDone={vi.fn()} />)
    expect(await screen.findByText('Nevâ perdesini (şemadaki gibi) rahatça 3 saniye üfleyin.')).toBeTruthy()
    expect(screen.getByRole('img')).toBeTruthy()
  })

  it('3 sn sonra mikrofonu kapatır; ayarı tam ise Kaydet kalibre eder ve onDone çağrılır', async () => {
    const onDone = await begin()
    blow(komaToHz(REF_KOMA + 9))
    expect(await screen.findByText('Neyiniz Kız ahenginde, ayarı tam')).toBeTruthy()
    expect(stopper).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }))
    await waitFor(() => expect(onDone).toHaveBeenCalled())
    const s = await getSettings()
    expect(s.calibrated).toBe(true)
    expect(s.tuning).toMatchObject({ ahenk: 'kiz', octaveOffset: 0 })
  })

  it('3 saniye dolmadan sonuç göstermez', async () => {
    await begin()
    blow(komaToHz(REF_KOMA + 9), { count: 20 }) // 1,9 sn
    expect(screen.queryByText(/Neyiniz/)).toBeNull()
    expect(stopper).not.toHaveBeenCalled()
  })

  it('sapma varsa sent ve yönü yazar (tiz / pes)', async () => {
    await begin()
    blow(komaToHz(REF_KOMA + 9) * 2 ** (12 / 1200))
    expect(await screen.findByText(/Neyiniz Kız ahenginde, (11|12|13) sent tiz/)).toBeTruthy()
    cleanup()
    emit = null
    await begin()
    blow(komaToHz(REF_KOMA + 9) * 2 ** (-12 / 1200))
    expect(await screen.findByText(/Neyiniz Kız ahenginde, (11|12|13) sent pes/)).toBeTruthy()
  })

  it('null örnekleri yok sayar ama süre onlarla da işler', async () => {
    await begin()
    blow(komaToHz(REF_KOMA + 9), { nullEvery: 4, count: 40 })
    expect(await screen.findByText('Neyiniz Kız ahenginde, ayarı tam')).toBeTruthy()
  })

  it('seçili ahengden farklıysa sorar; Evet algılananı kaydeder', async () => {
    const onDone = await begin()
    blow(586.69)
    expect(await screen.findByText('Neyiniz Mansur ahengi gibi görünüyor. Ayarı Mansur yapayım mı?')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Evet' }))
    await waitFor(() => expect(onDone).toHaveBeenCalled())
    const s = await getSettings()
    expect(s.tuning.ahenk).toBe('mansur')
    expect(s.calibrated).toBe(true)
  })

  it('Hayır kaydetmez; Tekrar dene ile yeniden başlar', async () => {
    const onDone = await begin()
    blow(586.69)
    fireEvent.click(await screen.findByRole('button', { name: 'Hayır' }))
    expect(onDone).not.toHaveBeenCalled()
    expect((await getSettings()).calibrated).toBe(false)
    expect((await getSettings()).tuning.ahenk).toBe('kiz')
    expect(screen.queryByText(/yapayım mı/)).toBeNull()
    emit = null
    fireEvent.click(await screen.findByRole('button', { name: 'Tekrar dene' }))
    await waitFor(() => expect(emit).not.toBeNull())
    expect(startPitchStream).toHaveBeenCalledTimes(2)
  })

  it('seçili ahenk ayarlardan okunur', async () => {
    await saveSettings({ tuning: { ahenk: 'mansur', octaveOffset: 0, tuningCents: 0 } })
    await begin()
    blow(586.69)
    expect(await screen.findByText('Neyiniz Mansur ahenginde, ayarı tam')).toBeTruthy()
  })

  it('kararsız (oktav sıçramalı) giriş kabul edilmez', async () => {
    await begin()
    act(() => {
      for (let i = 0; i < 32; i++) {
        emit!({ t: 5000 + i * 100, hz: i % 2 ? 660 : 330, clarity: 0.99 })
      }
    })
    expect(await screen.findByText('Ses kararlı gelmedi, biraz daha uzun ve sabit üfleyin.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Kaydet' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Tekrar dene' })).toBeTruthy()
    expect((await getSettings()).calibrated).toBe(false)
  })

  it('sessizlik (az veri) için aynı mesajı gösterir', async () => {
    await begin()
    blow(440, { nullEvery: 1 })
    expect(await screen.findByText('Ses kararlı gelmedi, biraz daha uzun ve sabit üfleyin.')).toBeTruthy()
  })

  it('tanınamayan ahenk için tanimsiz mesajı', async () => {
    await begin()
    blow(komaToHz(REF_KOMA + 26.5))
    expect(await screen.findByText('Neyinizin ahengini tanıyamadım, tekrar deneyelim.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tekrar dene' })).toBeTruthy()
  })

  it('onDone verilmezse ana ekrana gider', async () => {
    render(<Calibration />)
    const btn = await screen.findByRole('button', { name: 'Başla' })
    await waitFor(() => expect((btn as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(btn)
    await waitFor(() => expect(emit).not.toBeNull())
    blow(komaToHz(REF_KOMA + 9))
    fireEvent.click(await screen.findByRole('button', { name: 'Kaydet' }))
    await waitFor(() => expect(location.hash).toBe('#/'))
  })
})
