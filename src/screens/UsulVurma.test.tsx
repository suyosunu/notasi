import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildVurmaCode } from '../audio/usul'
import { playCode, stopAudio, unlockAudio } from '../audio/player'
import { acquireWakeLock, releaseWakeLock } from '../audio/wakeLock'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { USULLER } from '../content/usuller'
import { getSettings, isaretEkle, resetDbForTests, saveSettings } from '../store/db'
import { UsulVurma } from './UsulVurma'

vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playCode: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
}))

vi.mock('../audio/wakeLock', () => ({
  acquireWakeLock: vi.fn(() => Promise.resolve()),
  releaseWakeLock: vi.fn(),
}))

vi.mock('../store/db', async (importOriginal) => {
  const gercek = await importOriginal<typeof import('../store/db')>()
  return { ...gercek, isaretEkle: vi.fn(gercek.isaretEkle) }
})

const NIM = USULLER.find((u) => u.id === 'nim-sofyan')!
/** Gecikme payı 100 ms + Nim Sofyan ♩ = 60 giriş ölçüsü 2000 ms: ilk vuruş onStart'tan 2100 ms sonra. */
const SIFIR = 2100
const NIM_SURE = 10_000

/** Sahte saat: performance.now bu değeri döner; çalmanın sonu sahte zamanlayıcıyla gelir. */
let now = 0
/** Çalan sahte playCode'u (durdurulunca) bitirir. */
let finishPlay: () => void = () => {}

beforeEach(async () => {
  await resetDbForTests()
  await isaretEkle('okunanDersler', 'usul:giris')
  await isaretEkle('okunanDersler', 'usul:nim-sofyan')
  vi.mocked(isaretEkle).mockClear()
  now = 50_000
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  // Vurgu döngüsünün kareleri çalıştırılmaz (vurgu ayrı testte elle ilerletilir).
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.mocked(unlockAudio).mockReset().mockImplementation(() => Promise.resolve())
  vi.mocked(stopAudio).mockReset().mockImplementation(() => finishPlay())
  vi.mocked(acquireWakeLock).mockClear()
  vi.mocked(releaseWakeLock).mockClear()
  // Sahte playCode: onStart'ı hemen çağırır, durationMs sonra (ya da durdurulunca) çözülür.
  vi.mocked(playCode)
    .mockReset()
    .mockImplementation(
      (_code: string, durationMs: number, onStart?: () => void) =>
        new Promise<void>((resolve) => {
          const id = setTimeout(resolve, durationMs)
          finishPlay = () => {
            clearTimeout(id)
            resolve()
          }
          onStart?.()
        }),
    )
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function ac(): Promise<HTMLButtonElement> {
  render(<UsulVurma usulId="nim-sofyan" />)
  const btn = (await screen.findByRole('button', { name: '▶ Başla' })) as HTMLButtonElement
  await waitFor(() => expect(btn.disabled).toBe(false))
  return btn
}
const usulSesiKutusu = () => screen.getByRole('checkbox', { name: '🥁 Usul sesiyle (öğrenirken)' }) as HTMLInputElement
const dumBtn = () => screen.getByRole('button', { name: 'Düm' })
const tekBtn = () => screen.getByRole('button', { name: 'Tek' })

/** Başla'ya dokunur; sahte zamanlayıcılar burada açılır (ayar okuma gerçek zamanlıdır). */
async function basla(btn: HTMLButtonElement) {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  fireEvent.click(btn)
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0)
  })
  expect(playCode).toHaveBeenCalledTimes(1)
}
/** onStart anından `ms` sonra düğmeye basar. */
function bas(btn: HTMLElement, ms: number, baslangic: number) {
  now = baslangic + ms
  fireEvent.pointerDown(btn)
}
async function bitir() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(NIM_SURE + 1000)
  })
  vi.useRealTimers()
}
/** Nim Sofyan'ın 8 vuruşu (düm, tek, ...) `sapma` ms kaydırılmış olarak. */
function sekizVurus(baslangic: number, sapma = 0) {
  for (let k = 0; k < 8; k++) bas(k % 2 === 0 ? dumBtn() : tekBtn(), SIFIR + k * 1000 + sapma, baslangic)
}

describe('UsulVurma', () => {
  it('ders okunmadıysa önce usul:giris', async () => {
    await resetDbForTests()
    render(<UsulVurma usulId="nim-sofyan" />)
    expect(await screen.findByRole('heading', { name: /Usul nedir\?/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Düm' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    // Sonra usulün kendi dersi, ardından alıştırma.
    expect(await screen.findByRole('heading', { name: /Nim Sofyan/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    expect(await screen.findByRole('heading', { name: '👏 Nim Sofyan · 2/4' })).toBeTruthy()
  })

  it('ekran öğeleri: başlık, vuruş şeması, hız 40–90 (60), usul sesi açık, Başla, Düm ve Tek, geri bağlantısı', async () => {
    await ac()
    expect(screen.getByRole('heading', { name: '👏 Nim Sofyan · 2/4' })).toBeTruthy()
    expect(screen.getAllByTestId('vurus').map((b) => b.textContent)).toEqual(['düm', 'tek'])
    const slider = screen.getByRole('slider') as HTMLInputElement
    expect([slider.min, slider.max, slider.value]).toEqual(['40', '90', '60'])
    expect(usulSesiKutusu().checked).toBe(true)
    expect(dumBtn()).toBeTruthy()
    expect(tekBtn()).toBeTruthy()
    // Düm solda: belge sırasında önce gelir.
    expect(dumBtn().compareDocumentPosition(tekBtn()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Usul bölümüne dön' }).getAttribute('href')).toBe('#/usul')
  })

  it('doğru zamanlı 8 pointerdown → "8/8 vuruş doğru" ve "✓ Geçtin"; usul sesi kapalıyken vurulanUsuller\'e yazılır', async () => {
    const btn = await ac()
    fireEvent.click(usulSesiKutusu())
    expect(usulSesiKutusu().checked).toBe(false)
    const baslangic = now
    await basla(btn)
    expect(vi.mocked(playCode).mock.calls[0]![0]).toBe(buildVurmaCode(NIM, 60, { usulSesi: false }).code)
    expect(vi.mocked(playCode).mock.calls[0]![1]).toBe(NIM_SURE)
    expect(unlockAudio).toHaveBeenCalledTimes(1)
    expect(acquireWakeLock).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '⏹ Durdur' })).toBeTruthy()
    // Giriş ölçüsündeki dokunuş atılır.
    bas(dumBtn(), 500, baslangic)
    sekizVurus(baslangic, 20)
    await bitir()
    expect(await screen.findByText('8/8 vuruş doğru')).toBeTruthy()
    expect(screen.getByText(/Kaçan: 0 · Yanlış: 0 · Fazla: 0/)).toBeTruthy()
    expect(screen.getByText('✓ Geçtin')).toBeTruthy()
    expect(screen.queryByText(/Biraz (erken|geç) vuruyorsun/)).toBeNull()
    await waitFor(async () => expect((await getSettings()).vurulanUsuller).toEqual(['nim-sofyan']))
    expect(screen.getByRole('button', { name: '▶ Başla' })).toBeTruthy()
    expect(releaseWakeLock).toHaveBeenCalled()
  })

  it('usul sesi açıkken geçince yazılmaz, not görünür', async () => {
    const btn = await ac()
    const baslangic = now
    await basla(btn)
    expect(vi.mocked(playCode).mock.calls[0]![0]).toBe(buildVurmaCode(NIM, 60, { usulSesi: true }).code)
    sekizVurus(baslangic)
    await bitir()
    expect(await screen.findByText('✓ Geçtin')).toBeTruthy()
    expect(screen.getByText('Usul sesini kapatıp yalnız metronomla geçersen sayılır.')).toBeTruthy()
    expect(isaretEkle).not.toHaveBeenCalledWith('vurulanUsuller', expect.anything())
    expect((await getSettings()).vurulanUsuller).toEqual([])
  })

  it('click olayı dokunuş sayılmaz', async () => {
    const btn = await ac()
    const baslangic = now
    await basla(btn)
    for (let k = 0; k < 8; k++) {
      now = baslangic + SIFIR + k * 1000
      fireEvent.click(k % 2 === 0 ? dumBtn() : tekBtn())
    }
    await bitir()
    expect(await screen.findByText('0/8 vuruş doğru')).toBeTruthy()
    expect(screen.getByText(/Kaçan: 8 · Yanlış: 0 · Fazla: 0/)).toBeTruthy()
  })

  it('hiç dokunmadan bitince "0/8" ve "Bir daha dene"', async () => {
    const btn = await ac()
    await basla(btn)
    await bitir()
    expect(await screen.findByText('0/8 vuruş doğru')).toBeTruthy()
    expect(screen.getByText('Bir daha dene')).toBeTruthy()
    expect(screen.queryByText('✓ Geçtin')).toBeNull()
    expect(screen.queryByText(/vuruyorsun/)).toBeNull()
  })

  it('geç vuruş uyarısı ve yanlış düğme sayımı; çok hızlı rastgele dokunuşta çökmez', async () => {
    let btn = await ac()
    let baslangic = now
    await basla(btn)
    sekizVurus(baslangic, 90)
    await bitir()
    expect(await screen.findByText('Biraz geç vuruyorsun')).toBeTruthy()

    btn = screen.getByRole('button', { name: '▶ Başla' }) as HTMLButtonElement
    baslangic = now
    vi.mocked(playCode).mockClear()
    await basla(btn)
    // Sonuç yeni çalmada kalkar.
    expect(screen.queryByText(/vuruş doğru/)).toBeNull()
    for (let k = 0; k < 8; k++) bas(tekBtn(), SIFIR + k * 1000 - 80, baslangic) // hep Tek, erken
    for (let i = 0; i < 200; i++) bas(i % 2 ? dumBtn() : tekBtn(), SIFIR + 8000 + i * 3, baslangic)
    await bitir()
    expect(await screen.findByText('4/8 vuruş doğru')).toBeTruthy()
    expect(screen.getByText(/Kaçan: 0 · Yanlış: 4 · Fazla: 200/)).toBeTruthy()
    expect(screen.getByText('Biraz erken vuruyorsun')).toBeTruthy()
    expect(screen.getByText('Bir daha dene')).toBeTruthy()
  })

  it('Durdur: ses durur, sonuç gösterilmez, yazılmaz', async () => {
    const btn = await ac()
    fireEvent.click(usulSesiKutusu())
    const baslangic = now
    await basla(btn)
    sekizVurus(baslangic)
    fireEvent.click(screen.getByRole('button', { name: '⏹ Durdur' }))
    await bitir()
    expect(stopAudio).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '▶ Başla' })).toBeTruthy()
    expect(screen.queryByText(/vuruş doğru/)).toBeNull()
    expect(isaretEkle).not.toHaveBeenCalledWith('vurulanUsuller', expect.anything())
  })

  it('çalarken sayfadan çıkınca stopAudio çağrılır ve isaretEkle çağrılmaz', async () => {
    const btn = await ac()
    fireEvent.click(usulSesiKutusu())
    const baslangic = now
    await basla(btn)
    sekizVurus(baslangic)
    cleanup()
    expect(stopAudio).toHaveBeenCalled()
    expect(releaseWakeLock).toHaveBeenCalled()
    await bitir()
    expect(isaretEkle).not.toHaveBeenCalled()
    expect((await getSettings()).vurulanUsuller).toEqual([])
  })

  it('unlockAudio beklenirken sayfadan çıkılırsa çalma başlamaz', async () => {
    let unlock: () => void = () => {}
    vi.mocked(unlockAudio).mockImplementation(() => new Promise<void>((r) => (unlock = r)))
    const btn = await ac()
    fireEvent.click(btn)
    cleanup()
    unlock()
    await act(async () => {
      await Promise.resolve()
    })
    expect(playCode).not.toHaveBeenCalled()
  })

  it('soundOn false → SOUND_OFF, playCode çağrılmaz', async () => {
    await saveSettings({ soundOn: false })
    const btn = await ac()
    fireEvent.click(btn)
    expect(await screen.findByText(SOUND_OFF)).toBeTruthy()
    expect(playCode).not.toHaveBeenCalled()
    expect(unlockAudio).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '▶ Başla' })).toBeTruthy()
  })

  it('çalma hatası → SOUND_WARNING, sonuç yok', async () => {
    vi.mocked(playCode).mockRejectedValue(new Error('ses yok'))
    const btn = await ac()
    fireEvent.click(btn)
    expect(await screen.findByText(SOUND_WARNING)).toBeTruthy()
    expect(screen.queryByText(/vuruş doğru/)).toBeNull()
    expect(screen.getByRole('button', { name: '▶ Başla' })).toBeTruthy()
  })

  it('hız kaydırıcısı tempoyu değiştirir: ♩ = 90 kodu ve süresi', async () => {
    const btn = await ac()
    const slider = screen.getByRole('slider') as HTMLInputElement
    fireEvent.input(slider, { target: { value: '90' } })
    fireEvent.change(slider, { target: { value: '90' } })
    expect(screen.getByText('Hız: ♩ = 90')).toBeTruthy()
    await basla(btn)
    const beklenen = buildVurmaCode(NIM, 90, { usulSesi: true })
    expect(vi.mocked(playCode).mock.calls[0]!.slice(0, 2)).toEqual([beklenen.code, beklenen.durationMs])
    await bitir()
  })

  it('çalarken o anki vuruş vurgulanır; giriş ölçüsünde ve bitince vurgu yok', async () => {
    const kareler: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => kareler.push(cb)),
    )
    const aktif = () =>
      screen.getAllByTestId('vurus').flatMap((b, i) => (b.getAttribute('data-active') === 'true' ? [i] : []))
    const kare = (t: number) => {
      now = t
      const cbs = kareler.splice(0)
      act(() => {
        for (const cb of cbs) cb(t)
      })
    }
    const btn = await ac()
    const baslangic = now
    await basla(btn)
    kare(baslangic + 1000) // giriş ölçüsü
    expect(aktif()).toEqual([])
    kare(baslangic + SIFIR + 300)
    expect(aktif()).toEqual([0])
    kare(baslangic + SIFIR + 1300)
    expect(aktif()).toEqual([1])
    kare(baslangic + SIFIR + 6200) // dördüncü ölçünün düm'ü
    expect(aktif()).toEqual([0])
    await bitir()
    expect(aktif()).toEqual([])
  })

  it('bilinmeyen usul → "Usul bulunamadı"', () => {
    for (const id of ['yok', 'dolap']) {
      render(<UsulVurma usulId={id} />)
      expect(screen.getByRole('heading', { name: 'Usul bulunamadı' })).toBeTruthy()
      expect(screen.getByRole('link', { name: 'Usul bölümüne dön' }).getAttribute('href')).toBe('#/usul')
      cleanup()
    }
  })
})
