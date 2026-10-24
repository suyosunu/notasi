import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MicError } from '../audio/mic'
import type { PitchSample } from '../audio/mic'
import { NEY_PERDELER } from '../content/ney-perdeler'
import { BASPARE_ID, BASPARE_TOLERANS } from '../learning/baspare'
import { DEFAULT_TUNING, soundingHz } from '../music/ahenk'
import { addLongTone, isaretEkle, listLongTones, listSessions, resetDbForTests, saveSettings } from '../store/db'

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
vi.mock('../store/db', async (orig) => {
  const actual = await orig<typeof import('../store/db')>()
  return { ...actual, addLongTone: vi.fn(actual.addLongTone) }
})
vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playWritten: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
}))

import { BaspareAlistirma } from './BaspareAlistirma'

const NEVA_HZ = soundingHz(NEY_PERDELER.find((p) => p.id === 'neva')!.written, DEFAULT_TUNING)
/** Nevâ'dan tolerans dışı (+100 sent). */
const UZAK_HZ = NEVA_HZ * 2 ** (100 / 1200)

beforeEach(async () => {
  await resetDbForTests()
  emit = null
  stopper.mockClear()
  startPitchStream.mockClear()
  startPitchStream.mockImplementation(async (cb) => {
    emit = cb
    return stopper
  })
  location.hash = ''
})
afterEach(() => {
  cleanup()
  location.hash = ''
})

/** `ms` boyunca 50 ms arayla aynı frekans (null = sessizlik); t0'dan başlar, bitiş zamanını döner. */
function blow(hz: number | null, t0: number, ms: number): number {
  act(() => {
    for (let t = 0; t <= ms; t += 50) emit!({ t: t0 + t, hz, clarity: hz === null ? 0.2 : 0.99 })
  })
  return t0 + ms + 50
}

/** Bir deneme: 800 ms sessizlik, `bulMs` kadar uzak ses, sonra 500 ms Nevâ. */
function deneme(t: number, bulMs = 0): number {
  t = blow(null, t, 800)
  if (bulMs > 0) t = blow(UZAK_HZ, t, bulMs - 50)
  return blow(NEVA_HZ, t, 500)
}

async function hazir() {
  await saveSettings({ calibrated: true })
  await isaretEkle('okunanDersler', 's0:baspare')
}

async function basla() {
  const btn = await screen.findByRole('button', { name: 'Başla' })
  emit = null
  fireEvent.click(btn)
  await waitFor(() => expect(emit).not.toBeNull())
}

describe('BaspareAlistirma', () => {
  it('yönerge, "Deneme 0/10" ve geri bağlantısı görünür', async () => {
    await hazir()
    render(<BaspareAlistirma />)
    await screen.findByRole('button', { name: 'Başla' })
    expect(screen.getByText(/Neyi dudağından çek, sonra koy ve üfle/)).toBeTruthy()
    expect(screen.getByText('Deneme 0/10')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Öğren bölümüne dön' }).getAttribute('href')).toBe('#/ogren')
  })

  it('deneme sayacı yalnız sessizlikten sonraki ses başlangıcında artar; son deneme süresi gösterilir', async () => {
    await hazir()
    render(<BaspareAlistirma />)
    await basla()
    // Hiç susmadan üflemek deneme başlatmaz.
    let t = blow(NEVA_HZ, 0, 2000)
    expect(screen.getByText('Deneme 0/10')).toBeTruthy()
    t = deneme(t, 300)
    expect(screen.getByText('Deneme 1/10')).toBeTruthy()
    expect(screen.getByText(/Son deneme: 0,[3-5] sn/)).toBeTruthy()
    // Üflemeye devam etmek (susmamak) ikinci denemeyi başlatmaz.
    t = blow(UZAK_HZ, t, 1500)
    t = blow(NEVA_HZ, t, 1500)
    expect(screen.getByText('Deneme 1/10')).toBeTruthy()
    t = deneme(t)
    expect(screen.getByText('Deneme 2/10')).toBeTruthy()
    expect(screen.getByText('Son deneme: 0,0 sn')).toBeTruthy()
    expect(startPitchStream).toHaveBeenCalledTimes(1)
  })

  it('bulunamayan deneme "bulunamadı" olarak gösterilir', async () => {
    await hazir()
    render(<BaspareAlistirma />)
    await basla()
    let t = blow(null, 0, 800)
    t = blow(UZAK_HZ, t, 4300)
    expect(screen.getByText('Son deneme: bulunamadı')).toBeTruthy()
    expect(t).toBeGreaterThan(0)
  })

  it('"Bitir" erken basılınca kayıt yazılır, mikrofon durur ve ekran takılmaz', async () => {
    await hazir()
    render(<BaspareAlistirma />)
    await basla()
    let t = deneme(0, 300)
    t = deneme(t, 0)
    t = deneme(t, 0)
    expect(t).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    expect(await screen.findByText("3 denemenin 3'ünde anında")).toBeTruthy()
    expect(stopper).toHaveBeenCalled()
    await waitFor(async () => expect(await listLongTones(BASPARE_ID)).toHaveLength(1))
    const [rec] = await listLongTones(BASPARE_ID)
    expect(rec).toMatchObject({ perdeId: BASPARE_ID, passed: false, toleranceCents: BASPARE_TOLERANS })
    expect(rec!.durationMs).toBe(0) // ortanca: 300, 0, 0
    expect(await listSessions()).toHaveLength(0)
    fireEvent.click(await screen.findByRole('button', { name: 'Tekrar dene' }))
    expect(await screen.findByRole('button', { name: 'Başla' })).toBeTruthy()
    expect(screen.getByText('Deneme 0/10')).toBeTruthy()
  })

  it('hiç ses vermeden "Bitir" süre 0 ve geçilmemiş kayıt yazar', async () => {
    await hazir()
    render(<BaspareAlistirma />)
    await basla()
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    expect(await screen.findByText('Henüz deneme yapılmadı.')).toBeTruthy()
    await waitFor(async () => expect(await listLongTones(BASPARE_ID)).toHaveLength(1))
    expect((await listLongTones(BASPARE_ID))[0]).toMatchObject({ durationMs: 0, passed: false })
  })

  it('10 denemenin 8\'i anında olunca otomatik biter, geçti kaydı yazılır', async () => {
    await hazir()
    render(<BaspareAlistirma />)
    await basla()
    let t = 0
    for (let i = 0; i < 10; i++) t = deneme(t, i < 2 ? 1500 : 300) // 1500 ms: anında değil
    expect(await screen.findByText(/Geçtin/)).toBeTruthy()
    expect(screen.getByText("10 denemenin 8'inde anında")).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Bitir' })).toBeNull()
    await waitFor(async () => expect(await listLongTones(BASPARE_ID)).toHaveLength(1))
    const [rec] = await listLongTones(BASPARE_ID)
    expect(rec).toMatchObject({ passed: true, toleranceCents: BASPARE_TOLERANS })
    expect(rec!.durationMs).toBeGreaterThanOrEqual(200)
    expect(rec!.durationMs).toBeLessThanOrEqual(700)
  })

  it('mikrofon hatasında "Bitir" ve geri bağlantısı görünür kalır; Bitir kaydı yazar, MicGate kalkar, mikrofon yeniden açılamaz', async () => {
    await hazir()
    startPitchStream.mockImplementation(() => Promise.reject(new MicError('izin-yok')))
    render(<BaspareAlistirma />)
    fireEvent.click(await screen.findByRole('button', { name: 'Başla' }))
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Öğren bölümüne dön' })).toBeTruthy()
    expect(startPitchStream).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    expect(await screen.findByText('Henüz deneme yapılmadı.')).toBeTruthy()
    await waitFor(async () => expect(await listLongTones(BASPARE_ID)).toHaveLength(1))
    expect((await listLongTones(BASPARE_ID))[0]).toMatchObject({ durationMs: 0, passed: false })
    // MicGate'in hata uyarısı ve kendi "Tekrar dene"si kalkar; sonuç ekranında tek "Tekrar dene" (yeni tur) vardır.
    expect(screen.queryByRole('alert')).toBeNull()
    const tekrar = await screen.findAllByRole('button', { name: 'Tekrar dene' })
    expect(tekrar).toHaveLength(1)
    expect(startPitchStream).toHaveBeenCalledTimes(1)
    // Yeni tur temiz başlar ve mikrofonu yalnız yeniden "Başla"yla açar.
    fireEvent.click(tekrar[0]!)
    expect(await screen.findByRole('button', { name: 'Başla' })).toBeTruthy()
    expect(startPitchStream).toHaveBeenCalledTimes(1)
  })

  it('kayıt yazılamazsa sonuç ve kısa uyarı görünür, yine de "Tekrar dene" çıkar (akış takılmaz)', async () => {
    await hazir()
    vi.mocked(addLongTone).mockRejectedValueOnce(new Error('idb yok'))
    render(<BaspareAlistirma />)
    await basla()
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    expect(await screen.findByText('Sonuç kaydedilemedi.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tekrar dene' })).toBeTruthy()
    expect(await listLongTones(BASPARE_ID)).toHaveLength(0)
  })

  it('sayfadan çıkınca mikrofon akışı durdurulur', async () => {
    await hazir()
    const view = render(<BaspareAlistirma />)
    await basla()
    view.unmount()
    await waitFor(() => expect(stopper).toHaveBeenCalled())
  })

  it('kalibre değilse ders değil önce kalibrasyon gelir; "Şimdi değil" Öğren bölümüne döner', async () => {
    location.hash = '#/hazirlik/baspare'
    render(<BaspareAlistirma />)
    expect(await screen.findByRole('heading', { name: 'Kalibrasyon' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Başpâreyi koy, çek/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Şimdi değil' }))
    expect(location.hash).toBe('#/ogren')
  })

  it('ders okunmamışsa önce ders gelir, "Anladım"dan sonra alıştırma açılır', async () => {
    await saveSettings({ calibrated: true })
    render(<BaspareAlistirma />)
    expect(await screen.findByRole('heading', { name: /Başpâreyi koy, çek/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Başla' })).toBeNull()
    expect(startPitchStream).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    expect(await screen.findByRole('button', { name: 'Başla' })).toBeTruthy()
  })
})
