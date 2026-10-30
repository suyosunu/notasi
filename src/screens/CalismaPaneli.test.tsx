import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCalismaCode } from '../audio/calisma'
import type { CalismaSecenek } from '../audio/calisma'
import { setKayitSession, setPlaybackSession } from '../audio/ios'
import { MIC_HATA_METINLERI, MicError, startPitchStream } from '../audio/mic'
import type { PitchSample } from '../audio/mic'
import { playCode, sesSaatiSimdi, stopAudio, unlockAudio } from '../audio/player'
import { sonIsaret } from '../audio/sesSaati'
import { SHAKUHACHI_SOUND } from '../audio/shakuhachi'
import { acquireWakeLock, releaseWakeLock } from '../audio/wakeLock'
import { ETUTLER } from '../content/etutler'
import { NEY_PERDELER } from '../content/ney-perdeler'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { USULLER } from '../content/usuller'
import { ANALIZ_PENCERESI_S } from '../learning/takip'
import type { TakipDurumu, TakipSonucu } from '../learning/takip'
import { DEFAULT_TUNING, soundingHz } from '../music/ahenk'
import { beats } from '../music/notation'
import type { MusicEvent } from '../music/notation'
import { resetDbForTests, saveSettings } from '../store/db'
import { CalismaPaneli, takipOzeti } from './CalismaPaneli'

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

vi.mock('../audio/mic', async (orig) => ({
  ...(await orig<typeof import('../audio/mic')>()),
  startPitchStream: vi.fn(),
}))

vi.mock('../audio/ios', async (orig) => ({
  ...(await orig<typeof import('../audio/ios')>()),
  setKayitSession: vi.fn(),
  setPlaybackSession: vi.fn(),
}))

vi.mock('../audio/wakeLock', () => ({
  acquireWakeLock: vi.fn(() => Promise.resolve()),
  releaseWakeLock: vi.fn(),
}))

/** Bekleyen (son) çalımı bitirir. */
let finishPlay: () => void = () => {}
/** Sahte mikrofon: son `startPitchStream` çağrısının örnek işlevi ve iptal sinyali; durdurucu `micDurdur`. */
let micOrnek: ((s: PitchSample) => void) | null = null
let micSinyal: AbortSignal | undefined
const micDurdur = vi.fn()

beforeEach(async () => {
  await resetDbForTests()
  vi.mocked(unlockAudio).mockReset().mockImplementation(() => Promise.resolve())
  vi.mocked(stopAudio).mockReset()
  vi.mocked(sonIsaret).mockReset().mockReturnValue(null)
  vi.mocked(sesSaatiSimdi).mockReset().mockReturnValue(null)
  vi.mocked(acquireWakeLock).mockClear()
  vi.mocked(releaseWakeLock).mockClear()
  vi.mocked(setKayitSession).mockClear()
  vi.mocked(setPlaybackSession).mockClear()
  micDurdur.mockReset()
  micOrnek = null
  micSinyal = undefined
  vi.mocked(startPitchStream)
    .mockReset()
    .mockImplementation((cb, signal) => {
      micOrnek = cb
      micSinyal = signal
      return Promise.resolve(micDurdur)
    })
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

describe('CalismaPaneli: yapışkan çalma çubuğu', () => {
  const cubuk = () => document.querySelector('.calisma-cubugu') as HTMLElement

  it('notanın hemen ardından gelir; çalma düğmeleri ve bölüm satırı ("Tümü") içindedir, ipucu ve kaydırıcı dışındadır', async () => {
    panel({ olcu: DORTLUK, usul: SOFYAN })
    const c = cubuk()
    expect(c.previousElementSibling!.classList.contains('score')).toBe(true)
    await dinleBtn()
    expect(within(c).getByRole('button', { name: '▶ Dinle' })).toBeTruthy()
    expect(within(c).getByRole('button', { name: '🥁 Usulle çal' })).toBeTruthy()
    expect(within(c).queryByText(/^Bölüm:/)).toBeNull()
    fireEvent.click(satirlar()[0]!)
    expect(within(c).getByText('Bölüm: 1–2. ölçüler')).toBeTruthy()
    expect(within(c).getByRole('button', { name: 'Tümü' })).toBeTruthy()
    expect(c.contains(slider())).toBe(false)
    expect(c.contains(screen.getByText(/^Bir satıra dokun/))).toBe(false)
    expect(c.contains(tekrarBox())).toBe(false)
    // Kaydırıcı ve anahtarlar çubuğun ardından, normal akışta.
    expect(c.compareDocumentPosition(slider()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('çalarken Durdur ve tur durumu çubuktadır', async () => {
    panel()
    fireEvent.click(tekrarBox())
    fireEvent.click(await dinleBtn())
    await screen.findByRole('button', { name: '⏹ Durdur' })
    expect(within(cubuk()).getByRole('button', { name: '⏹ Durdur' })).toBeTruthy()
    expect(within(cubuk()).getByRole('status').textContent).toBe('Tur 1 · ♩ = 60')
  })
})

describe('CalismaPaneli: çalan satıra kaydırma', () => {
  let saat = 1_000_000
  const kaydirilan: Element[] = []
  const asil = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView')
  beforeEach(() => {
    saat = 1_000_000
    kaydirilan.length = 0
    vi.spyOn(Date, 'now').mockImplementation(() => saat)
    Element.prototype.scrollIntoView = vi.fn(function (this: Element, arg?: boolean | ScrollIntoViewOptions) {
      expect(arg).toEqual({ block: 'nearest', behavior: 'smooth' })
      kaydirilan.push(this)
    })
  })
  afterEach(() => {
    vi.mocked(Date.now).mockRestore()
    if (asil) Object.defineProperty(Element.prototype, 'scrollIntoView', asil)
    else delete (Element.prototype as Partial<Element>).scrollIntoView
  })
  /** DORTLUK, satır başına bir ölçü, ♩ = 60, giriş 4: `satir`. satırın ikinci olayı çalar. */
  const calSatir = (satir: number) => vi.mocked(sesSaatiSimdi).mockReturnValue(10 + 4 + 4 * satir + 1.5)
  const vurguSatirda = (satir: number) =>
    waitFor(() => expect(satirlar()[satir]!.querySelector('[data-highlight]')).not.toBeNull())

  it('vurgu yeni satıra geçince o satır görünüme kaydırılır; kullanıcı son 2 sn içinde kaydırdıysa kaydırılmaz', async () => {
    panel({ olcu: DORTLUK, olcuPerSatir: 1 })
    fireEvent.click(await dinleBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    vi.mocked(sonIsaret).mockReturnValue(10)
    calSatir(0)
    await vurguSatirda(0)
    await waitFor(() => expect(kaydirilan).toEqual([satirlar()[0]]))

    // Kendi kaydırmamızın hemen ardından gelen scroll olayı kullanıcıdan sayılmaz.
    fireEvent.scroll(window)
    calSatir(1)
    await vurguSatirda(1)
    await waitFor(() => expect(kaydirilan).toEqual([satirlar()[0], satirlar()[1]]))

    // Kullanıcı kaydırdı: 2 sn boyunca otomatik kaydırma yok.
    saat += 1500
    fireEvent.scroll(window)
    saat += 1000
    calSatir(2)
    await vurguSatirda(2)
    await bekle()
    expect(kaydirilan).toHaveLength(2)

    // 2 sn geçti: sonraki satır yine kaydırılır.
    saat += 1500
    calSatir(3)
    await vurguSatirda(3)
    await waitFor(() => expect(kaydirilan.at(-1)).toBe(satirlar()[3]))

    // Dokunarak kaydırma (touchmove) da bastırır.
    fireEvent.touchMove(window)
    calSatir(0)
    await vurguSatirda(0)
    await bekle()
    expect(kaydirilan.map((k) => satirlar().indexOf(k as HTMLElement))).toEqual([0, 1, 3])
  })

  it('aynı satırda vurgu ilerlerken yeniden kaydırılmaz; scrollIntoView yoksa hata yok', async () => {
    panel({ olcu: DORTLUK, olcuPerSatir: 1 })
    fireEvent.click(await dinleBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    vi.mocked(sonIsaret).mockReturnValue(10)
    calSatir(0)
    await vurguSatirda(0)
    vi.mocked(sesSaatiSimdi).mockReturnValue(10 + 4 + 2.5)
    await waitFor(() => expect(satirlar()[0]!.querySelector('[data-highlight]')!.getAttribute('data-event')).toBe('2'))
    expect(kaydirilan).toHaveLength(1)
    delete (Element.prototype as Partial<Element>).scrollIntoView
    calSatir(1)
    await vurguSatirda(1)
    await bekle()
    expect(kaydirilan).toHaveLength(1)
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

  it('durdurRef: üst ekran çalmayı durdurabilir; panel kalkınca durdurRef boşalır', async () => {
    const durdurRef = { current: null as (() => void) | null }
    const { unmount } = panel({ durdurRef })
    fireEvent.click(await dinleBtn())
    await screen.findByRole('button', { name: '⏹ Durdur' })
    vi.mocked(stopAudio).mockClear()
    durdurRef.current!()
    expect(stopAudio).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: '▶ Dinle' })).toBeTruthy()
    unmount()
    expect(durdurRef.current).toBeNull()
  })
})

describe('CalismaPaneli: mikrofonla takip', () => {
  const NOT = 'Deneme: telefonu neyin önüne koy. Eşlik çalar, sen neyle çalarsın; sonunda her nota için sonuç çıkar.'
  const cubuk = () => document.querySelector('.calisma-cubugu') as HTMLElement
  const takipBtn = () => screen.getByRole('button', { name: '🎤 Çal, dinlesin' }) as HTMLButtonElement
  const sonucYok = () => {
    expect(screen.queryByText(/ notadan /)).toBeNull()
    expect(document.querySelector('[data-durum]')).toBeNull()
  }
  /** Takibi başlatır ve eşlik çalımı başlayana dek bekler. */
  async function takipBaslat() {
    const n = vi.mocked(playCode).mock.calls.length
    await dinleBtn()
    fireEvent.click(takipBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(n + 1))
  }
  /** Hiç çalınmadan biten bir takip: sonuç özeti çıkar. */
  async function sonucUret() {
    await takipBaslat()
    vi.mocked(sonIsaret).mockReturnValue(10)
    finishPlay()
    await screen.findByText(/^16 notadan /)
  }

  it('düğme ve deneme notu yalnız takip açıkken; düğme çubukta, not çubuğun ardında akışta', async () => {
    panel()
    await dinleBtn()
    expect(screen.queryByRole('button', { name: '🎤 Çal, dinlesin' })).toBeNull()
    expect(screen.queryByText(NOT)).toBeNull()
    cleanup()
    panel({ takip: true })
    await dinleBtn()
    expect(within(cubuk()).getByRole('button', { name: '🎤 Çal, dinlesin' })).toBeTruthy()
    const not = screen.getByText(NOT)
    expect(cubuk().contains(not)).toBe(false)
    expect(cubuk().compareDocumentPosition(not) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it("dokunuşta unlockAudio, setKayitSession ve startPitchStream bu sırayla, ilk await'ten önce çağrılır", async () => {
    panel({ takip: true })
    await dinleBtn()
    fireEvent.click(takipBtn())
    expect(unlockAudio).toHaveBeenCalledTimes(1)
    expect(setKayitSession).toHaveBeenCalledTimes(1)
    expect(startPitchStream).toHaveBeenCalledTimes(1)
    const sira = [unlockAudio, setKayitSession, startPitchStream].map((f) => vi.mocked(f).mock.invocationCallOrder[0]!)
    expect(sira).toEqual([...sira].sort((a, b) => a - b))
    expect(micSinyal?.aborted).toBe(false)
    expect(playCode).not.toHaveBeenCalled()
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    expect(setPlaybackSession).not.toHaveBeenCalled()
    expect(within(cubuk()).getByRole('button', { name: '⏹ Durdur' })).toBeTruthy()
    expect(within(cubuk()).getByRole('status').textContent).toBe('🎤 Dinliyorum…')
  })

  it('melodi çalmaz; Tekrarla açık olsa da tek tur; eşlik açıksa usul, kapalıysa yalnız giriş sayımı', async () => {
    panel({ olcu: DORTLUK, usul: SOFYAN, takip: true })
    fireEvent.click(tekrarBox())
    await takipBaslat()
    const usullu = buildCalismaCode(DORTLUK, DEFAULT_TUNING, 60, { ...SES, melodi: false, usul: SOFYAN })
    expect(vi.mocked(playCode).mock.calls[0]).toEqual([usullu.code, usullu.durationMs])
    expect(usullu.code).not.toContain(SHAKUHACHI_SOUND)
    finishPlay()
    expect(await screen.findByRole('button', { name: '🎤 Çal, dinlesin' })).toBeTruthy()
    await bekle()
    expect(playCode).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('checkbox', { name: '🥁 Usul eşliği (Sofyan)' }))
    await takipBaslat()
    const sayim = buildCalismaCode(DORTLUK, DEFAULT_TUNING, 60, { ...SES, melodi: false, eslik: 'yok', usul: SOFYAN })
    expect(vi.mocked(playCode).mock.calls[1]).toEqual([sayim.code, sayim.durationMs])
  })

  it('tur doğal bitince mikrofon durur, oturum playback; çubuğun altında özet ve notada her notanın durumu', async () => {
    panel({ olcu: DORTLUK, olcuPerSatir: 1, takip: true })
    await takipBaslat()
    vi.mocked(sonIsaret).mockReturnValue(10)
    const hedef = DORTLUK.flat().map((e) => soundingHz((e as Extract<MusicEvent, { kind: 'note' }>).pitch, DEFAULT_TUNING))
    const cargah = soundingHz(NEY_PERDELER.find((p) => p.id === 'cargah')!.written, DEFAULT_TUNING)
    const sent = (hz: number, c: number) => hz * 2 ** (c / 1200)
    // ♩ = 60, giriş 4: k. nota 14 + k ile 15 + k sn arasında. 0 pes, 1 sessiz, 2 başka perde, 3 tiz, 4 kısa tutuldu.
    for (let i = 0; i < 800; i++) {
      const k = Math.floor(i / 50)
      let hz: number | null = hedef[k]!
      if (k === 0) hz = sent(hz, -40)
      else if (k === 1) hz = null
      else if (k === 2) hz = cargah
      else if (k === 3) hz = sent(hz, 40)
      else if (k === 4 && i % 50 > 30) hz = null
      // Örnek, analiz penceresinin yarısı kadar önce çalınan sese aittir.
      vi.mocked(sesSaatiSimdi).mockReturnValue(14 + i * 0.02 + ANALIZ_PENCERESI_S)
      micOrnek!({ t: 0, hz, clarity: 1 })
    }
    vi.mocked(sesSaatiSimdi).mockReturnValue(null)
    micOrnek!({ t: 0, hz: 440, clarity: 1 }) // ses saati yokken gelen örnek atlanır
    expect(micDurdur).not.toHaveBeenCalled()
    sonucYok()
    finishPlay()
    const baslik = await screen.findByText("16 notadan 11'i doğru.")
    expect(micDurdur).toHaveBeenCalledTimes(1)
    expect(micSinyal!.aborted).toBe(true)
    expect(setPlaybackSession).toHaveBeenCalledTimes(1)
    const kutu = baslik.closest('[role="status"]') as HTMLElement
    expect(cubuk().contains(kutu)).toBe(false)
    expect(cubuk().compareDocumentPosition(kutu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    for (const satir of [
      'Pes: Rast (1)',
      'Tiz: Do (1)',
      'Başka perde: Bûselik yerine Çârgâh',
      'Duyulmadı: 1 nota',
      'Kısa tutuldu: 1 nota',
    ]) {
      expect(within(kutu).getByText(satir)).toBeTruthy()
    }
    expect(within(kutu).getByText(/^Gecikme -?\d+ ms · ses duyulan kare %\d+$/)).toBeTruthy()
    const durumlar = [...document.querySelectorAll('[data-durum]')].map((e) => e.getAttribute('data-durum'))
    expect(durumlar).toEqual(['pes', 'yok', 'yanlis', 'tiz', 'kisa', ...Array<string>(11).fill('dogru')])

    fireEvent.click(within(kutu).getByRole('button', { name: 'Sonucu temizle' }))
    sonucYok()
  })

  it('hiç çalınmazsa bütün notalar duyulmadı, gecikme varsayılan; yeni çalım ya da yeni seçim sonucu temizler', async () => {
    panel({ olcu: DORTLUK, olcuPerSatir: 1, takip: true })
    await sonucUret()
    expect(screen.getByText("16 notadan 0'ı doğru.")).toBeTruthy()
    expect(screen.getByText('Duyulmadı: 16 nota')).toBeTruthy()
    expect(screen.getByText('Gecikme 120 ms · ses duyulan kare %0')).toBeTruthy()
    expect(document.querySelectorAll('[data-durum="yok"]')).toHaveLength(16)
    fireEvent.click(await dinleBtn())
    sonucYok()
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(2))
    fireEvent.click(screen.getByRole('button', { name: '⏹ Durdur' }))

    await sonucUret()
    fireEvent.click(satirlar()[1]!)
    sonucYok()
  })

  it('işaret yoksa (ses başlamadı) sonuç yerine uyarı; mikrofon yine durur', async () => {
    panel({ olcu: DORTLUK, takip: true })
    await takipBaslat()
    finishPlay()
    expect(await screen.findByText('Ses başlamadı, sonuç çıkarılamadı.')).toBeTruthy()
    sonucYok()
    expect(micDurdur).toHaveBeenCalledTimes(1)
    expect(setPlaybackSession).toHaveBeenCalledTimes(1)
  })

  it('mikrofon açılamazsa Türkçe uyarı ve ayrıntı; eşlik çalmaz, oturum playback, düğmeler geri gelir', async () => {
    vi.mocked(startPitchStream).mockImplementation(() => Promise.reject(new MicError('izin-yok', 'NotAllowedError: x')))
    panel({ takip: true })
    await dinleBtn()
    fireEvent.click(takipBtn())
    expect(await screen.findByText(MIC_HATA_METINLERI['izin-yok'])).toBeTruthy()
    expect(within(cubuk()).getByText('Ayrıntı: NotAllowedError: x')).toBeTruthy()
    expect(setPlaybackSession).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: '🎤 Çal, dinlesin' })).toBeTruthy()
    expect(releaseWakeLock).toHaveBeenCalled()
    await bekle()
    expect(playCode).not.toHaveBeenCalled()
    // Yeni çalım uyarıyı kaldırır.
    fireEvent.click(await dinleBtn())
    expect(screen.queryByText(MIC_HATA_METINLERI['izin-yok'])).toBeNull()
    expect(screen.queryByText(/^Ayrıntı:/)).toBeNull()
  })

  it('eşlik çalınamazsa ses uyarısı; mikrofon durur, oturum playback', async () => {
    vi.mocked(playCode).mockImplementation(() => Promise.reject(new Error('strudel yok')))
    panel({ takip: true })
    await dinleBtn()
    fireEvent.click(takipBtn())
    expect(await screen.findByText(SOUND_WARNING)).toBeTruthy()
    expect(micDurdur).toHaveBeenCalledTimes(1)
    expect(setPlaybackSession).toHaveBeenCalledTimes(1)
    sonucYok()
  })

  it('ses kapalıyken uyarır; mikrofonu açmaz', async () => {
    await saveSettings({ soundOn: false })
    panel({ takip: true })
    await dinleBtn()
    fireEvent.click(takipBtn())
    expect(await screen.findByText(SOUND_OFF)).toBeTruthy()
    expect(startPitchStream).not.toHaveBeenCalled()
    expect(setKayitSession).not.toHaveBeenCalled()
    expect(unlockAudio).not.toHaveBeenCalled()
  })

  it('Durdur: mikrofon durur ve iptal edilir, oturum playback; tur sonra bitse de sonuç çıkmaz', async () => {
    panel({ olcu: DORTLUK, takip: true })
    await takipBaslat()
    vi.mocked(sonIsaret).mockReturnValue(10)
    vi.mocked(stopAudio).mockClear()
    fireEvent.click(screen.getByRole('button', { name: '⏹ Durdur' }))
    expect(stopAudio).toHaveBeenCalledTimes(1)
    expect(micDurdur).toHaveBeenCalledTimes(1)
    expect(micSinyal!.aborted).toBe(true)
    expect(setPlaybackSession).toHaveBeenCalledTimes(1)
    finishPlay()
    await bekle()
    sonucYok()
    expect(micDurdur).toHaveBeenCalledTimes(1)
    expect(setPlaybackSession).toHaveBeenCalledTimes(1)
  })

  it('mikrofon açılırken Durdur: iptal sinyali; geç açılan mikrofon hemen kapanır, eşlik çalmaz, uyarı yok', async () => {
    let ac: (d: () => void) => void = () => {}
    vi.mocked(startPitchStream).mockImplementation((_cb, signal) => {
      micSinyal = signal
      return new Promise((r) => (ac = r))
    })
    panel({ takip: true })
    await dinleBtn()
    fireEvent.click(takipBtn())
    fireEvent.click(await screen.findByRole('button', { name: '⏹ Durdur' }))
    expect(micSinyal!.aborted).toBe(true)
    expect(setPlaybackSession).toHaveBeenCalledTimes(1)
    ac(micDurdur)
    await bekle()
    expect(micDurdur).toHaveBeenCalledTimes(1)
    expect(playCode).not.toHaveBeenCalled()
    expect(document.querySelector('.calisma-cubugu .notice')).toBeNull()
  })

  it('takip sürerken satır, hız ya da eşlik değişince mikrofon durur', async () => {
    panel({ olcu: DORTLUK, olcuPerSatir: 1, takip: true })
    const degisimler = [
      () => fireEvent.click(satirlar()[1]!),
      () => fireEvent.change(slider(), { target: { value: '70' } }),
      () => fireEvent.click(screen.getByRole('checkbox', { name: '🥁 Metronom' })),
    ]
    for (const [i, degis] of degisimler.entries()) {
      await takipBaslat()
      degis()
      expect(micDurdur).toHaveBeenCalledTimes(i + 1)
      expect(setPlaybackSession).toHaveBeenCalledTimes(i + 1)
      expect(await screen.findByRole('button', { name: '🎤 Çal, dinlesin' })).toBeTruthy()
    }
  })

  it('sayfadan çıkınca mikrofon durur, oturum playback; bekleyen tur bir şey yapmaz', async () => {
    const { unmount } = panel({ olcu: DORTLUK, takip: true })
    await takipBaslat()
    vi.mocked(sonIsaret).mockReturnValue(10)
    unmount()
    expect(micDurdur).toHaveBeenCalledTimes(1)
    expect(micSinyal!.aborted).toBe(true)
    expect(setPlaybackSession).toHaveBeenCalledTimes(1)
    finishPlay()
    await bekle()
    expect(setPlaybackSession).toHaveBeenCalledTimes(1)
  })
})

describe('takipOzeti', () => {
  const not = (step: 'G' | 'A' | 'B' | 'C' | 'D', octave: number, acc: -1 | 0 = 0): MusicEvent => ({
    kind: 'note',
    pitch: { step, octave, acc },
    dur: 'quarter',
  })
  /** Segâh, Dügâh, Çârgâh, Nevâ | Segâh, Rast, Do (perde listesinde yok), sus. */
  const OLCU: MusicEvent[][] = [
    [not('B', 4, -1), not('A', 4), not('C', 5), not('D', 5)],
    [not('B', 4, -1), not('G', 4), not('C', 4), { kind: 'rest', dur: 'quarter' }],
  ]
  const sonuc = (notalar: TakipSonucu['notalar'], ek: Partial<TakipSonucu> = {}): TakipSonucu => ({
    notalar,
    gecikmeMs: 130,
    sesliOran: 0.734,
    atlanan: 0,
    ...ek,
  })
  const n = (olcu: number, nota: number, durum: TakipDurumu, calinan?: string) => ({
    olcu,
    nota,
    durum,
    sent: null,
    ...(calinan ? { calinan } : {}),
  })

  it('başlık, pes/tiz perde sayıları (çoktan aza), başka perde, duyulmadı, kısa, atlanan ve tanılama', () => {
    const o = takipOzeti(
      sonuc(
        [
          n(0, 1, 'pes'),
          n(0, 0, 'pes'),
          n(1, 0, 'pes'),
          n(0, 2, 'yanlis', 'Nevâ'),
          n(0, 3, 'tiz'),
          n(1, 1, 'yok'),
          n(1, 2, 'kisa'),
          n(1, 1, 'yok'),
          n(0, 2, 'yanlis', 'Nevâ'),
          n(1, 1, 'yanlis', 'Dügâh'),
          n(0, 0, 'dogru'),
          n(0, 1, 'dogru'),
        ],
        { atlanan: 3 },
      ),
      OLCU,
    )
    expect(o.baslik).toBe("12 notadan 2'si doğru.")
    expect(o.satirlar).toEqual([
      'Pes: Segâh (2), Dügâh (1)',
      'Tiz: Nevâ (1)',
      'Başka perde: Çârgâh yerine Nevâ (2), Rast yerine Dügâh',
      'Duyulmadı: 2 nota',
      'Kısa tutuldu: 1 nota',
      '3 nota çok kısa olduğu için değerlendirilmedi.',
    ])
    expect(o.tani).toBe('Gecikme 130 ms · ses duyulan kare %73')
  })

  it('hepsi doğruysa ek satır yok; listede olmayan perde solfej adıyla', () => {
    expect(takipOzeti(sonuc([n(0, 0, 'dogru'), n(0, 1, 'dogru')]), OLCU).satirlar).toEqual([])
    expect(takipOzeti(sonuc([n(1, 2, 'pes')]), OLCU).satirlar).toEqual(['Pes: Do (1)'])
  })

  it.each([
    [0, "0'ı"],
    [1, "1'i"],
    [2, "2'si"],
    [3, "3'ü"],
    [4, "4'ü"],
    [5, "5'i"],
    [6, "6'sı"],
    [7, "7'si"],
    [8, "8'i"],
    [9, "9'u"],
    [10, "10'u"],
    [12, "12'si"],
    [16, "16'sı"],
    [20, "20'si"],
    [30, "30'u"],
    [40, "40'ı"],
    [50, "50'si"],
    [60, "60'ı"],
    [70, "70'i"],
    [80, "80'i"],
    [90, "90'ı"],
    [100, "100'ü"],
  ])('%i doğru: "%s"', (k, ek) => {
    const notalar = [...Array.from({ length: k }, () => n(0, 0, 'dogru')), n(0, 1, 'yok')]
    expect(takipOzeti(sonuc(notalar), OLCU).baslik).toBe(`${k + 1} notadan ${ek} doğru.`)
  })
})
