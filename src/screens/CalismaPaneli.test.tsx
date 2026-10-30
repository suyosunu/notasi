import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCalismaCode } from '../audio/calisma'
import type { CalismaSecenek } from '../audio/calisma'
import { playCode, sesSaatiSimdi, stopAudio, unlockAudio } from '../audio/player'
import { sonIsaret } from '../audio/sesSaati'
import { SHAKUHACHI_SOUND } from '../audio/shakuhachi'
import { acquireWakeLock, releaseWakeLock } from '../audio/wakeLock'
import { ETUTLER } from '../content/etutler'
import { USULLER } from '../content/usuller'
import { DEFAULT_TUNING } from '../music/ahenk'
import { beats } from '../music/notation'
import type { MusicEvent } from '../music/notation'
import { resetDbForTests } from '../store/db'
import { CalismaPaneli } from './CalismaPaneli'

vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playCode: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
  getNeySesi: vi.fn(() => 'shakuhachi'),
  sesSaatiSimdi: vi.fn(() => null),
}))

vi.mock('../audio/sesSaati', async (orig) => ({
  ...(await orig<typeof import('../audio/sesSaati')>()),
  sonIsaret: vi.fn(() => null),
}))

vi.mock('../audio/wakeLock', () => ({
  acquireWakeLock: vi.fn(() => Promise.resolve()),
  releaseWakeLock: vi.fn(),
}))

/** Bekleyen (son) çalımı bitirir. */
let finishPlay: () => void = () => {}

beforeEach(async () => {
  await resetDbForTests()
  vi.mocked(unlockAudio).mockReset().mockImplementation(() => Promise.resolve())
  vi.mocked(stopAudio).mockReset()
  vi.mocked(sonIsaret).mockReset().mockReturnValue(null)
  vi.mocked(sesSaatiSimdi).mockReset().mockReturnValue(null)
  vi.mocked(acquireWakeLock).mockClear()
  vi.mocked(releaseWakeLock).mockClear()
  vi.mocked(playCode)
    .mockReset()
    .mockImplementation(() => new Promise<void>((r) => (finishPlay = r)))
})
afterEach(() => cleanup())

const IKI = ETUTLER.find((e) => e.id === 'iki-neva-cargah')!
const SOFYAN = USULLER.find((u) => u.id === 'sofyan')!
const DOLAP = USULLER.find((u) => u.id === 'dolap')!
const SES: CalismaSecenek = { melodi: true, eslik: 'usul', voice: 'shakuhachi' }
const q = (step: 'G' | 'A' | 'B' | 'C'): MusicEvent => ({ kind: 'note', pitch: { step, octave: 4, acc: 0 }, dur: 'quarter' })
/** Dört ölçü, her biri dört dörtlük. */
const DORTLUK: MusicEvent[][] = Array.from({ length: 4 }, () => [q('G'), q('A'), q('B'), q('C')])
const toplam = (olcu: MusicEvent[][]) => olcu.flat().reduce((t, e) => t + beats(e), 0)

function panel(p: Partial<Parameters<typeof CalismaPaneli>[0]> = {}) {
  return render(<CalismaPaneli olcu={IKI.olcu} varsayilanBpm={60} bpmMin={40} bpmMax={90} olcuPerSatir={2} {...p} />)
}
async function dinleBtn() {
  const btn = (await screen.findByRole('button', { name: '▶ Dinle' })) as HTMLButtonElement
  await waitFor(() => expect(btn.disabled).toBe(false))
  return btn
}
const satirlar = () => [...document.querySelectorAll('[data-testid="score-row"]')] as HTMLElement[]
const slider = () => screen.getByRole('slider') as HTMLInputElement
const tekrarBox = () => screen.getByRole('checkbox', { name: '🔁 Tekrarla' }) as HTMLInputElement
const hizlanBox = () => screen.getByRole('checkbox', { name: '⏫ Her turda hızlan (♩ +5)' }) as HTMLInputElement
const sureler = () => vi.mocked(playCode).mock.calls.map((c) => c[1])
/** Bekleyen söz zincirleri (tur sonu, finally) işlensin. */
const bekle = () => new Promise((r) => setTimeout(r, 20))

describe('CalismaPaneli: bölüm seçimi', () => {
  it('ipucu görünür; satıra dokununca bölüm etiketi ve "Tümü" çıkar, Dinle yalnız seçili ölçüleri çalar', async () => {
    panel()
    expect(
      screen.getByText('Bir satıra dokun: yalnız o bölüm çalar. Başka bir satıra da dokunursan aradaki bölüm seçilir.'),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Tümü' })).toBeNull()
    fireEvent.click(satirlar()[1]!)
    expect(screen.getByText('Bölüm: 3–4. ölçüler')).toBeTruthy()
    fireEvent.click(await dinleBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    const secili = IKI.olcu.slice(2, 4)
    const expected = buildCalismaCode(secili, DEFAULT_TUNING, 60, SES)
    expect(vi.mocked(playCode).mock.calls[0]).toEqual([expected.code, expected.durationMs])
    expect(expected.durationMs).toBe((4 + toplam(secili)) * 1000) // 2 ölçülük süre + giriş
  })

  it('başka bir satıra dokununca aradaki bölüm seçilir; tek ölçülük satırda "N. ölçü"; "Tümü" seçimi kaldırır', async () => {
    panel({ olcu: DORTLUK, olcuPerSatir: 1 })
    fireEvent.click(satirlar()[2]!)
    expect(screen.getByText('Bölüm: 3. ölçü')).toBeTruthy()
    fireEvent.click(satirlar()[0]!)
    expect(screen.getByText('Bölüm: 1–3. ölçüler')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tümü' }))
    expect(screen.queryByText(/^Bölüm:/)).toBeNull()
    fireEvent.click(await dinleBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    expect(vi.mocked(playCode).mock.calls[0]![0]).toBe(buildCalismaCode(DORTLUK, DEFAULT_TUNING, 60, SES).code)
  })

  it('çalarken satıra dokunmak ya da "Tümü" çalmayı durdurur ve döngü biter', async () => {
    panel()
    fireEvent.click(tekrarBox())
    fireEvent.click(await dinleBtn())
    await screen.findByRole('button', { name: '⏹ Durdur' })
    vi.mocked(stopAudio).mockClear()
    fireEvent.click(satirlar()[0]!)
    expect(stopAudio).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: '▶ Dinle' })).toBeTruthy()
    finishPlay()
    await bekle()
    expect(playCode).toHaveBeenCalledTimes(1)

    fireEvent.click(await dinleBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(2))
    vi.mocked(stopAudio).mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'Tümü' }))
    expect(stopAudio).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: '▶ Dinle' })).toBeTruthy()
  })
})

describe('CalismaPaneli: tekrar ve hızlanma', () => {
  it('Hızlan anahtarı yalnız Tekrarla açıkken görünür', () => {
    panel()
    expect(tekrarBox().checked).toBe(false)
    expect(screen.queryByRole('checkbox', { name: /Her turda hızlan/ })).toBeNull()
    fireEvent.click(tekrarBox())
    expect(hizlanBox().checked).toBe(false)
  })

  it('tekrar + hızlan: her tur ♩ +5 (60, 65, 70); kaydırıcı ve tur durumu güncel; Durdur sonrası yeni tur yok', async () => {
    vi.mocked(playCode)
      .mockImplementationOnce(() => Promise.resolve())
      .mockImplementationOnce(() => Promise.resolve())
    panel()
    fireEvent.click(tekrarBox())
    fireEvent.click(hizlanBox())
    fireEvent.click(await dinleBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(3))
    expect(sureler()).toEqual([60, 65, 70].map((t) => buildCalismaCode(IKI.olcu, DEFAULT_TUNING, t, SES).durationMs))
    expect(vi.mocked(playCode).mock.calls[2]![0]).toBe(buildCalismaCode(IKI.olcu, DEFAULT_TUNING, 70, SES).code)
    await waitFor(() => expect(slider().value).toBe('70'))
    expect(screen.getByRole('status').textContent).toBe('Tur 3 · ♩ = 70')
    expect(unlockAudio).toHaveBeenCalledTimes(1) // yalnız ilk turda
    fireEvent.click(screen.getByRole('button', { name: '⏹ Durdur' }))
    finishPlay()
    await bekle()
    expect(playCode).toHaveBeenCalledTimes(3)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('hızlanma bpmMax\'ta durur', async () => {
    vi.mocked(playCode)
      .mockImplementationOnce(() => Promise.resolve())
      .mockImplementationOnce(() => Promise.resolve())
    panel({ varsayilanBpm: 85 })
    fireEvent.click(tekrarBox())
    fireEvent.click(hizlanBox())
    fireEvent.click(await dinleBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(3))
    expect(sureler()).toEqual([85, 90, 90].map((t) => buildCalismaCode(IKI.olcu, DEFAULT_TUNING, t, SES).durationMs))
    expect(slider().value).toBe('90')
  })

  it('tekrar kapalıyken tek tur çalar; bitince Dinle geri gelir ve ekran kilidi bırakılır', async () => {
    panel()
    fireEvent.click(await dinleBtn())
    await screen.findByRole('button', { name: '⏹ Durdur' })
    expect(acquireWakeLock).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/^Tur /)).toBeNull()
    finishPlay()
    expect(await screen.findByRole('button', { name: '▶ Dinle' })).toBeTruthy()
    expect(playCode).toHaveBeenCalledTimes(1)
    expect(releaseWakeLock).toHaveBeenCalled()
  })

  it('tekrar çalarken açılıp kapatılabilir, çalmayı durdurmaz; tur sonunda okunur', async () => {
    panel()
    fireEvent.click(await dinleBtn())
    await screen.findByRole('button', { name: '⏹ Durdur' })
    vi.mocked(stopAudio).mockClear()
    fireEvent.click(tekrarBox())
    fireEvent.click(hizlanBox())
    expect(stopAudio).not.toHaveBeenCalled()
    expect(screen.getByRole('status').textContent).toBe('Tur 1 · ♩ = 60')
    finishPlay()
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(2))
    expect(sureler()[1]).toBe(buildCalismaCode(IKI.olcu, DEFAULT_TUNING, 65, SES).durationMs)
    fireEvent.click(tekrarBox()) // kapat: bu tur son tur
    expect(stopAudio).not.toHaveBeenCalled()
    finishPlay()
    expect(await screen.findByRole('button', { name: '▶ Dinle' })).toBeTruthy()
    expect(playCode).toHaveBeenCalledTimes(2)
  })

  it('unlockAudio tıklamayla aynı eşzamanlı akışta, ilk await\'ten önce çağrılır', async () => {
    panel()
    const btn = await dinleBtn()
    fireEvent.click(btn)
    expect(unlockAudio).toHaveBeenCalledTimes(1)
    expect(playCode).not.toHaveBeenCalled()
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
  })
})

describe('CalismaPaneli: çalan nota vurgusu', () => {
  const vurgulu = () => [...document.querySelectorAll('[data-highlight]')]

  it('ses saati işaretinden çalan olayı vurgular; işaret yokken hiçbir olay vurgulu değil', async () => {
    panel({ olcu: DORTLUK })
    fireEvent.click(await dinleBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    await bekle()
    expect(vurgulu()).toHaveLength(0) // sonIsaret null
    const { girisVurus } = buildCalismaCode(DORTLUK, DEFAULT_TUNING, 60, SES)
    vi.mocked(sonIsaret).mockReturnValue(10)
    vi.mocked(sesSaatiSimdi).mockReturnValue(10 + ((girisVurus + 1.5) * 60) / 60)
    await waitFor(() => expect(vurgulu()).toHaveLength(1))
    expect(satirlar()[0]!.querySelector('[data-highlight]')!.getAttribute('data-event')).toBe('1')
    vi.mocked(sonIsaret).mockReturnValue(null)
    await waitFor(() => expect(vurgulu()).toHaveLength(0))
  })

  it('seçimde vurgu seçimin başından sayılır; seçimin sonrası vurgulanmaz; durunca vurgu kalkar', async () => {
    panel({ olcu: DORTLUK, varsayilanBpm: 80, olcuPerSatir: 1 })
    fireEvent.click(satirlar()[1]!)
    fireEvent.click(satirlar()[2]!) // ölçü 1–2 (indis); sonrasında ölçü 3 kalır
    fireEvent.click(await dinleBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    const giris = 4
    vi.mocked(sonIsaret).mockReturnValue(10)
    vi.mocked(sesSaatiSimdi).mockReturnValue(10 + ((giris + 5.5) * 60) / 80) // seçimin 2. ölçüsü, 2. olay
    await waitFor(() => expect(vurgulu()).toHaveLength(1))
    expect(satirlar()[2]!.querySelector('[data-highlight]')!.getAttribute('data-event')).toBe('1')
    vi.mocked(sesSaatiSimdi).mockReturnValue(10 + ((giris + 8.5) * 60) / 80) // seçimden sonrası (4. ölçü)
    await waitFor(() => expect(vurgulu()).toHaveLength(0))
    vi.mocked(sesSaatiSimdi).mockReturnValue(10 + ((giris + 0.5) * 60) / 80)
    await waitFor(() => expect(vurgulu()).toHaveLength(1))
    fireEvent.click(screen.getByRole('button', { name: '⏹ Durdur' }))
    await waitFor(() => expect(vurgulu()).toHaveLength(0))
  })
})

describe('CalismaPaneli: eşlik', () => {
  it('usullüde anahtar "Usul eşliği (ad)" ve "🥁 Usulle çal" melodisiz kod üretir', async () => {
    panel({ olcu: DORTLUK, usul: SOFYAN })
    const box = screen.getByRole('checkbox', { name: '🥁 Usul eşliği (Sofyan)' }) as HTMLInputElement
    expect(box.checked).toBe(true)
    expect(screen.queryByRole('button', { name: '🎵 Metronomla çal' })).toBeNull()
    await dinleBtn()
    fireEvent.click(screen.getByRole('button', { name: '🥁 Usulle çal' }))
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    const expected = buildCalismaCode(DORTLUK, DEFAULT_TUNING, 60, { ...SES, melodi: false, usul: SOFYAN })
    const [code, durationMs] = vi.mocked(playCode).mock.calls[0]!
    expect([code, durationMs]).toEqual([expected.code, expected.durationMs])
    expect(code).not.toContain(SHAKUHACHI_SOUND)
  })

  it('eşlik kapalıyken Dinle yalnız giriş sayımını tıklar; çalarken değişince durur', async () => {
    panel({ olcu: DORTLUK, usul: SOFYAN })
    fireEvent.click(screen.getByRole('checkbox', { name: '🥁 Usul eşliği (Sofyan)' }))
    fireEvent.click(await dinleBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    expect(vi.mocked(playCode).mock.calls[0]![0]).toBe(
      buildCalismaCode(DORTLUK, DEFAULT_TUNING, 60, { ...SES, eslik: 'yok', usul: SOFYAN }).code,
    )
    vi.mocked(stopAudio).mockClear()
    fireEvent.click(screen.getByRole('checkbox', { name: '🥁 Usul eşliği (Sofyan)' }))
    expect(stopAudio).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: '▶ Dinle' })).toBeTruthy()
  })

  it('vuruş kalıbı olmayan usulde eşlik açıkken metronom notu görünür', () => {
    panel({ olcu: DORTLUK, usul: DOLAP })
    const not = 'Bu usulün vuruş kalıbı bilinmediği için eşlik metronomla yapılır.'
    expect(screen.getByText(not)).toBeTruthy()
    fireEvent.click(screen.getByRole('checkbox', { name: '🥁 Usul eşliği (Dolap)' }))
    expect(screen.queryByText(not)).toBeNull()
  })

  it('usulsüzde anahtar "Metronom" ve "🎵 Metronomla çal"', () => {
    panel()
    expect(screen.getByRole('checkbox', { name: '🥁 Metronom' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '🎵 Metronomla çal' })).toBeTruthy()
  })
})

describe('CalismaPaneli: çıkış', () => {
  it('sayfadan çıkınca stopAudio çağrılır, ekran kilidi bırakılır ve bekleyen tur başlamaz', async () => {
    const { unmount } = panel()
    fireEvent.click(tekrarBox())
    fireEvent.click(await dinleBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    vi.mocked(stopAudio).mockClear()
    vi.mocked(releaseWakeLock).mockClear()
    unmount()
    expect(stopAudio).toHaveBeenCalledTimes(1)
    expect(releaseWakeLock).toHaveBeenCalledTimes(1)
    finishPlay()
    await bekle()
    expect(playCode).toHaveBeenCalledTimes(1)
  })

  it('durdurRef: üst ekran çalmayı durdurabilir', async () => {
    const durdurRef = { current: null as (() => void) | null }
    panel({ durdurRef })
    fireEvent.click(await dinleBtn())
    await screen.findByRole('button', { name: '⏹ Durdur' })
    vi.mocked(stopAudio).mockClear()
    durdurRef.current!()
    expect(stopAudio).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: '▶ Dinle' })).toBeTruthy()
  })
})
