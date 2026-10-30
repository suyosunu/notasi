import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startUsul, stopUsul } from '../audio/usul'
import { acquireWakeLock, releaseWakeLock } from '../audio/wakeLock'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { USULLER } from '../content/usuller'
import { getSettings, isaretEkle, resetDbForTests, saveSettings } from '../store/db'
import { UsulSection } from './UsulSection'

vi.mock('../audio/usul', () => ({
  startUsul: vi.fn(() => Promise.resolve()),
  stopUsul: vi.fn(),
}))

vi.mock('../audio/wakeLock', () => ({
  acquireWakeLock: vi.fn(() => Promise.resolve()),
  releaseWakeLock: vi.fn(),
}))

const DOLAP_NOTE = 'Bu usulün vuruş kalıbı kaynaklarda bulunamadı; yalnızca zaman sayılır (12/8).'

const usul = (id: string) => USULLER.find((u) => u.id === id)!

beforeEach(async () => {
  await resetDbForTests()
  await isaretEkle('okunanDersler', 'usul:giris') // ders kapısı açık; kapı testleri kendi kaydını sıfırlar
  vi.mocked(startUsul).mockReset().mockImplementation(() => Promise.resolve())
  vi.mocked(stopUsul).mockClear()
  vi.mocked(acquireWakeLock).mockClear()
  vi.mocked(releaseWakeLock).mockClear()
  location.hash = ''
})
afterEach(() => cleanup())

/** Ders kapısı ayarları okuyunca usul listesi görünür. */
async function ilkRender() {
  const r = render(<UsulSection />)
  await screen.findByRole('heading', { name: /Usuller/ })
  return r
}

async function tapPlay() {
  const btn = screen.getByRole('button', { name: '▶ Çal' }) as HTMLButtonElement
  await waitFor(() => expect(btn.disabled).toBe(false))
  fireEvent.click(btn)
}
/** Düğmenin adı "<ad><zaman>/<mertebe>" ile başlar: "Yürük Semâî" ile "Yürük Semâî (6/4)" karışmaz. */
const usulDugmesi = (u: { name: string; zaman: number; mertebe: number }) => {
  const kacis = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${kacis(u.name)}\\s*${u.zaman}/${u.mertebe}`)
}
const pick = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }))

describe('UsulSection', () => {
  it('"Usuller" başlığı ve altı usulün listesi', async () => {
    await ilkRender()
    expect(screen.getByRole('heading', { name: /Usuller/ })).toBeTruthy()
    for (const u of USULLER) expect(screen.getByRole('button', { name: usulDugmesi(u) })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ana ekrana dön' }).getAttribute('href')).toBe('#/')
  })

  it('usul düğmelerinde önerilen seviye etiketi; Dolap etiketsiz', async () => {
    await ilkRender()
    const etiket = (ad: string) =>
      screen.getByRole('button', { name: new RegExp(`^${ad}`) }).querySelector('.seviye-etiket')?.textContent
    expect(etiket('Nim Sofyan')).toBe('Seviye 2')
    expect(etiket('Sofyan')).toBe('Seviye 2')
    expect(etiket('Semâî')).toBe('Seviye 2')
    expect(etiket('Düyek')).toBe('Seviye 5')
    expect(etiket('Aksak')).toBe('Seviye 5')
    expect(etiket('Dolap')).toBeUndefined()
  })

  it('Yürük Semâî (6/4), Türk Aksağı ve Devr-i Hindî "Seviye 4" etiketli; sıra Yürük Semâî 6/8, 6/4, Türk Aksağı, Devr-i Hindî, Düyek', async () => {
    await ilkRender()
    for (const id of ['yuruk-semai', 'yuruk-semai-64', 'turk-aksagi', 'devr-i-hindi']) {
      const dugme = screen.getByRole('button', { name: usulDugmesi(usul(id)) })
      expect(dugme.querySelector('.seviye-etiket')?.textContent, id).toBe('Seviye 4')
    }
    const adlar = screen.getAllByRole('button').map((b) => b.textContent ?? '')
    const sira = ['Yürük Semâî 6/8', 'Yürük Semâî (6/4) 6/4', 'Türk Aksağı 5/8', 'Devr-i Hindî 7/8', 'Düyek 8/8'].map((a) =>
      adlar.findIndex((t) => t.startsWith(a)),
    )
    expect(sira.every((i) => i >= 0)).toBe(true)
    expect(sira).toEqual([...sira].sort((a, b) => a - b))
  })

  it('Türk Aksağı: vuruş şeması düm 2, tek 2, tek 1 (40%, 40%, 20%) ve birim ♪', async () => {
    await ilkRender()
    pick(usulDugmesi(usul('turk-aksagi')))
    const boxes = [...document.querySelectorAll<HTMLElement>('[data-testid="vurus"]')]
    expect(boxes.map((b) => b.textContent)).toEqual(['düm', 'tek', 'tek'])
    expect(boxes.map((b) => b.style.width)).toEqual(['40%', '40%', '20%'])
    expect(screen.getByRole('heading', { name: 'Türk Aksağı · 5/8' })).toBeTruthy()
    expect(screen.getByText('Hız: ♪ = 60')).toBeTruthy()
  })

  it('vuruş şeması: kutular süreyle orantılı genişlikte, etiketli, düm ve tek farklı renkte', async () => {
    await ilkRender()
    pick(/Düyek/)
    const boxes = [...document.querySelectorAll<HTMLElement>('[data-testid="vurus"]')]
    expect(boxes.map((b) => b.textContent)).toEqual(['düm', 'tek', 'tek', 'düm', 'tek'])
    expect(boxes.map((b) => b.style.width)).toEqual(['12.5%', '25%', '12.5%', '25%', '25%'])
    const classes = boxes.map((b) => b.className)
    expect(classes[0]).toBe(classes[3])
    expect(classes[1]).toBe(classes[2])
    expect(classes[0]).not.toBe(classes[1])
  })

  it('açılışta Nim Sofyan seçili ve "Seviye 2" etiketi var', async () => {
    await ilkRender()
    const nim = screen.getByRole('button', { name: /^Nim Sofyan/ })
    expect(nim.getAttribute('aria-pressed')).toBe('true')
    expect(nim.querySelector('.seviye-etiket')?.textContent).toBe('Seviye 2')
    const boxes = [...document.querySelectorAll<HTMLElement>('[data-testid="vurus"]')]
    expect(boxes.map((b) => b.textContent)).toEqual(['düm', 'tek'])
    expect(boxes.map((b) => b.style.width)).toEqual(['50%', '50%'])
    expect(screen.getByText('Hız: ♩ = 60')).toBeTruthy()
  })

  it('Sofyan: düm, te, ke etiketleri; te ve ke tek ile aynı renk sınıfında', async () => {
    await ilkRender()
    pick(/^Sofyan/)
    const boxes = [...document.querySelectorAll<HTMLElement>('[data-testid="vurus"]')]
    expect(boxes.map((b) => b.textContent)).toEqual(['düm', 'te', 'ke'])
    expect(boxes.map((b) => b.style.width)).toEqual(['50%', '25%', '25%'])
    expect(boxes[1]!.className).toBe(boxes[2]!.className)
    expect(boxes[0]!.className).not.toBe(boxes[1]!.className)
  })

  it('Dolap: vuruş şeması gösterilmez, açıklama metni görünür', async () => {
    await ilkRender()
    expect(screen.queryByText(DOLAP_NOTE)).toBeNull()
    pick(/Dolap/)
    expect(document.querySelectorAll('[data-testid="vurus"]')).toHaveLength(0)
    expect(screen.getByText(DOLAP_NOTE)).toBeTruthy()
    pick(/^Sofyan/)
    expect(screen.queryByText(DOLAP_NOTE)).toBeNull()
    expect(document.querySelectorAll('[data-testid="vurus"]')).toHaveLength(3)
  })

  it('hız kaydırıcısı 40–120, varsayılan 60; etiket "Hız: ♩ = {bpm}"', async () => {
    await ilkRender()
    const slider = screen.getByRole('slider') as HTMLInputElement
    expect([slider.min, slider.max, slider.value]).toEqual(['40', '120', '60'])
    expect(screen.getByText('Hız: ♩ = 60')).toBeTruthy()
    fireEvent.input(slider, { target: { value: '90' } })
    expect(screen.getByText('Hız: ♩ = 90')).toBeTruthy()
  })

  it('mertebesi 8 olan usulde birim ♪, 4 olanda ♩ gösterilir', async () => {
    await ilkRender()
    pick(/^Sofyan/)
    expect(screen.getByText('Hız: ♩ = 60')).toBeTruthy()
    pick(/Düyek/)
    expect(screen.getByText('Hız: ♪ = 60')).toBeTruthy()
    pick(/Dolap/)
    expect(screen.getByText('Hız: ♪ = 60')).toBeTruthy()
    pick(/^Semâî/)
    expect(screen.getByText('Hız: ♩ = 60')).toBeTruthy()
  })

  it('Çal: sesi açıp seçili usulü varsayılan hızla başlatır; düğme "■ Durdur" olur', async () => {
    await ilkRender()
    await tapPlay()
    await waitFor(() => expect(startUsul).toHaveBeenCalledTimes(1))
    expect(startUsul).toHaveBeenCalledWith(usul('nim-sofyan'), 60)
    expect(screen.getByRole('button', { name: '■ Durdur' })).toBeTruthy()
  })

  it('Durdur: stopUsul çağrılır ve düğme "▶ Çal" olur', async () => {
    await ilkRender()
    await tapPlay()
    fireEvent.click(await screen.findByRole('button', { name: '■ Durdur' }))
    expect(stopUsul).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '▶ Çal' })).toBeTruthy()
  })

  it('Dolap seçiliyken Çal metronomu başlatır (startUsul Dolap ile)', async () => {
    await ilkRender()
    pick(/Dolap/)
    await tapPlay()
    await waitFor(() => expect(startUsul).toHaveBeenCalledWith(usul('dolap'), 60))
  })

  it('çalarken usul değişirse yeni usulle yeniden başlar', async () => {
    await ilkRender()
    await tapPlay()
    await waitFor(() => expect(startUsul).toHaveBeenCalledTimes(1))
    pick(/Düyek/)
    await waitFor(() => expect(startUsul).toHaveBeenCalledTimes(2))
    expect(vi.mocked(startUsul).mock.calls[1]).toEqual([usul('duyek'), 60])
    expect(screen.getByRole('button', { name: '■ Durdur' })).toBeTruthy()
  })

  it('çalarken hız değişirse (bırakınca) yeni hızla yeniden başlar; çalmıyorsa başlamaz', async () => {
    await ilkRender()
    const slider = screen.getByRole('slider') as HTMLInputElement
    fireEvent.input(slider, { target: { value: '80' } })
    fireEvent.change(slider)
    expect(startUsul).not.toHaveBeenCalled()
    await tapPlay()
    await waitFor(() => expect(startUsul).toHaveBeenCalledWith(usul('nim-sofyan'), 80))
    fireEvent.input(slider, { target: { value: '100' } })
    fireEvent.change(slider)
    await waitFor(() => expect(startUsul).toHaveBeenLastCalledWith(usul('nim-sofyan'), 100))
    expect(startUsul).toHaveBeenCalledTimes(2)
  })

  it('çalmıyorken usul seçmek çalmayı başlatmaz', async () => {
    await ilkRender()
    pick(/Düyek/)
    expect(startUsul).not.toHaveBeenCalled()
  })

  it('sayfadan çıkınca (unmount) stopUsul çağrılır', async () => {
    const { unmount } = await ilkRender()
    await waitFor(() => expect((screen.getByRole('button', { name: '▶ Çal' }) as HTMLButtonElement).disabled).toBe(false))
    vi.mocked(stopUsul).mockClear() // önceki testin geç unmount temizliği sayıma karışmasın
    unmount()
    await waitFor(() => expect(stopUsul).toHaveBeenCalledTimes(1))
  })

  it('çalarken ekran kilidi istenir; Durdur, hata ve unmount bırakır', async () => {
    const { unmount } = await ilkRender()
    await tapPlay()
    await screen.findByRole('button', { name: '■ Durdur' })
    expect(acquireWakeLock).toHaveBeenCalled()
    vi.mocked(releaseWakeLock).mockClear() // önceki testin geç temizliği sayıma karışmasın
    fireEvent.click(screen.getByRole('button', { name: '■ Durdur' }))
    expect(releaseWakeLock).toHaveBeenCalledTimes(1)
    await tapPlay()
    await screen.findByRole('button', { name: '■ Durdur' })
    vi.mocked(releaseWakeLock).mockClear()
    unmount()
    await waitFor(() => expect(releaseWakeLock).toHaveBeenCalledTimes(1))
  })

  it('çalma başarısızsa ekran kilidi bırakılır; ses kapalıyken istenmez', async () => {
    vi.mocked(startUsul).mockImplementation(() => Promise.reject(new Error('strudel yok')))
    await ilkRender()
    await tapPlay()
    await screen.findByText(SOUND_WARNING)
    expect(releaseWakeLock).toHaveBeenCalled()
    cleanup()
    vi.mocked(acquireWakeLock).mockClear()
    await saveSettings({ soundOn: false })
    await ilkRender()
    await tapPlay()
    await screen.findByText(SOUND_OFF)
    expect(acquireWakeLock).not.toHaveBeenCalled()
  })

  it('ses kapalıyken SOUND_OFF gösterir, çalmaz', async () => {
    await saveSettings({ soundOn: false })
    await ilkRender()
    await tapPlay()
    expect(await screen.findByText(SOUND_OFF)).toBeTruthy()
    expect(startUsul).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '▶ Çal' })).toBeTruthy()
  })

  it('çalma başarısız olursa SOUND_WARNING gösterir ve düğme "▶ Çal" kalır', async () => {
    vi.mocked(startUsul).mockImplementation(() => Promise.reject(new Error('strudel yok')))
    await ilkRender()
    await tapPlay()
    expect(await screen.findByText(SOUND_WARNING)).toBeTruthy()
    expect(screen.getByRole('button', { name: '▶ Çal' })).toBeTruthy()
  })
})

describe('UsulSection: ders kapısı ve bağlantılar', () => {
  it("usul:giris okunmadan önce ders görünür; Anladım'dan sonra usul listesi", async () => {
    await resetDbForTests() // giriş dersi okunmamış
    render(<UsulSection />)
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('📖 Usul nedir?')
    expect(screen.queryByRole('heading', { name: /Usuller/ })).toBeNull()
    expect(screen.getByRole('link', { name: 'Ana ekrana dön' }).getAttribute('href')).toBe('#/')
    fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    expect(await screen.findByRole('heading', { name: /Usuller/ })).toBeTruthy()
    expect((await getSettings()).okunanDersler).toEqual(['usul:giris'])
  })

  it('giriş okunmuşsa liste doğrudan görünür', async () => {
    await ilkRender()
    expect(screen.queryByRole('button', { name: 'Anladım, alıştırmaya geç' })).toBeNull()
  })

  it('Nim Sofyan seçiliyken Ders ve Vurarak çalış bağlantıları var', async () => {
    await ilkRender()
    expect(screen.getByRole('link', { name: '📖 Ders' }).getAttribute('href')).toBe('#/ders/usul%3Anim-sofyan')
    expect(screen.getByRole('link', { name: '👏 Vurarak çalış' }).getAttribute('href')).toBe('#/usul/vur/nim-sofyan')
  })

  it.each([
    ['Semâî', 'semai'],
    ['Sofyan', 'sofyan'],
  ])('%s seçilince bağlantılar o usule gider', async (ad, id) => {
    await ilkRender()
    pick(new RegExp(`^${ad}`))
    expect(screen.getByRole('link', { name: '📖 Ders' }).getAttribute('href')).toBe(`#/ders/usul%3A${id}`)
    expect(screen.getByRole('link', { name: '👏 Vurarak çalış' }).getAttribute('href')).toBe(`#/usul/vur/${id}`)
  })

  it('dersi olmayan ama vuruşu olan usulde (Düyek) yalnız Vurarak çalış var', async () => {
    await ilkRender()
    pick(/Düyek/)
    expect(screen.queryByRole('link', { name: '📖 Ders' })).toBeNull()
    expect(screen.getByRole('link', { name: '👏 Vurarak çalış' }).getAttribute('href')).toBe('#/usul/vur/duyek')
  })

  it('Dolap seçiliyken Vurarak çalış yok (ders de yok)', async () => {
    await ilkRender()
    pick(/Dolap/)
    expect(screen.queryByRole('link', { name: '👏 Vurarak çalış' })).toBeNull()
    expect(screen.queryByRole('link', { name: '📖 Ders' })).toBeNull()
    pick(/^Sofyan/)
    expect(screen.getByRole('link', { name: '👏 Vurarak çalış' })).toBeTruthy()
  })
})

describe('UsulSection: vurgulu şema', () => {
  /** Sahte saat ve sahte requestAnimationFrame: kareler elle (flush) çalıştırılır. */
  let now = 0
  let nextId = 1
  const pending = new Map<number, FrameRequestCallback>()
  let nowSpy: { mockRestore(): void } | null = null

  beforeEach(() => {
    now = 1000
    nextId = 1
    pending.clear()
    nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        const id = nextId++
        pending.set(id, cb)
        return id
      }),
    )
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((id: number) => {
        pending.delete(id)
      }),
    )
  })
  afterEach(() => {
    cleanup()
    nowSpy?.mockRestore()
    vi.unstubAllGlobals()
  })

  /** Saati `t` ms'ye getirip bekleyen kareleri bir kez çalıştırır. */
  function flush(t: number) {
    now = t
    const cbs = [...pending.entries()]
    pending.clear()
    act(() => {
      for (const [, cb] of cbs) cb(t)
    })
  }
  const boxes = () => [...document.querySelectorAll<HTMLElement>('[data-testid="vurus"]')]
  const activeIndexes = () => boxes().flatMap((b, i) => (b.getAttribute('data-active') === 'true' ? [i] : []))
  /** Gecikme payı (Strudel zamanlayıcısının ileri bakışı) 100 ms. */
  const LAT = 100

  async function expectActiveAt(t: number, expected: number[]) {
    await waitFor(() => {
      flush(t)
      expect(activeIndexes()).toEqual(expected)
    })
  }

  it('çalarken o anki vuruş kutusu vurgulanır ve döngüyle birlikte ilerler (Sofyan, ♩ = 60)', async () => {
    await ilkRender()
    pick(/^Sofyan/)
    expect(activeIndexes()).toEqual([])
    await tapPlay()
    await screen.findByRole('button', { name: '■ Durdur' })
    // Sofyan: düm [0, 2), te [2, 3), ke [3, 4) zaman; ♩ = 60 ⇒ 1 zaman = 1 sn.
    await expectActiveAt(1000 + LAT + 500, [0])
    await expectActiveAt(1000 + LAT + 1900, [0])
    await expectActiveAt(1000 + LAT + 2500, [1])
    await expectActiveAt(1000 + LAT + 3500, [2])
    await expectActiveAt(1000 + LAT + 4200, [0]) // ikinci ölçü
    await expectActiveAt(1000 + LAT + 6100, [1])
  })

  it('Aksak (9/8): 2 zamanlık vuruşlar iki zaman boyunca vurgulu kalır', async () => {
    await ilkRender()
    pick(/Aksak/)
    await tapPlay()
    await screen.findByRole('button', { name: '■ Durdur' })
    // düm 0–2, te 2–3, ke 3–4, düm 4–6, tek 6–8, tek 8–9
    const expected: [number, number][] = [[0.5, 0], [1.5, 0], [2.5, 1], [3.5, 2], [4.5, 3], [5.9, 3], [7, 4], [8.5, 5], [9.2, 0]]
    for (const [z, i] of expected) await expectActiveAt(1000 + LAT + z * 1000, [i])
  })

  it('Durdur vurguyu kaldırır ve kare döngüsünü durdurur', async () => {
    await ilkRender()
    pick(/^Sofyan/)
    await tapPlay()
    await screen.findByRole('button', { name: '■ Durdur' })
    await expectActiveAt(1000 + LAT + 2500, [1])
    fireEvent.click(screen.getByRole('button', { name: '■ Durdur' }))
    expect(activeIndexes()).toEqual([])
    flush(1000 + LAT + 3500)
    flush(1000 + LAT + 4500)
    expect(activeIndexes()).toEqual([])
    expect(pending.size).toBe(0) // yeni kare istenmiyor
  })

  it('hız değişince saat yeniden başlar (♩ = 120)', async () => {
    await ilkRender()
    pick(/^Sofyan/)
    await tapPlay()
    await screen.findByRole('button', { name: '■ Durdur' })
    await expectActiveAt(1000 + LAT + 500, [0])
    now = 5000
    const slider = screen.getByRole('slider') as HTMLInputElement
    fireEvent.input(slider, { target: { value: '120' } })
    fireEvent.change(slider)
    await waitFor(() => expect(startUsul).toHaveBeenLastCalledWith(usul('sofyan'), 120))
    // Yeni saat 5000 ms'de başlar: 1.1 sn × 2 zaman/sn = 2.2 zaman ⇒ te. (Eski saatle 5.1 zaman ⇒ düm olurdu.)
    await expectActiveAt(5000 + LAT + 1100, [1])
    await expectActiveAt(5000 + LAT + 1600, [2])
  })

  it('usul değişince saat yeniden başlar ve yeni usulün kutuları vurgulanır', async () => {
    await ilkRender()
    pick(/^Sofyan/)
    await tapPlay()
    await screen.findByRole('button', { name: '■ Durdur' })
    await expectActiveAt(1000 + LAT + 2500, [1])
    now = 8000
    pick(/Düyek/)
    await waitFor(() => expect(startUsul).toHaveBeenLastCalledWith(usul('duyek'), 60))
    // Düyek: düm 0–1, tek 1–3, tek 3–4, düm 4–6, tek 6–8
    await expectActiveAt(8000 + LAT + 500, [0])
    await expectActiveAt(8000 + LAT + 2000, [1])
    await expectActiveAt(8000 + LAT + 5000, [3])
  })

  it('çalma başarısız olursa vurgu kalkar', async () => {
    await ilkRender()
    await tapPlay()
    await screen.findByRole('button', { name: '■ Durdur' })
    await expectActiveAt(1000 + LAT + 500, [0])
    vi.mocked(startUsul).mockImplementation(() => Promise.reject(new Error('strudel yok')))
    pick(/Düyek/)
    await screen.findByText(SOUND_WARNING)
    flush(1000 + LAT + 1500)
    expect(activeIndexes()).toEqual([])
    flush(1000 + LAT + 2500)
    expect(pending.size).toBe(0)
  })

  it('ses kapalıyken vurgu başlamaz', async () => {
    await saveSettings({ soundOn: false })
    await ilkRender()
    await tapPlay()
    await screen.findByText(SOUND_OFF)
    flush(1000 + LAT + 500)
    flush(1000 + LAT + 600)
    expect(activeIndexes()).toEqual([])
    expect(pending.size).toBe(0)
  })

  it('sayfadan çıkınca (unmount) kare döngüsü durur', async () => {
    const { unmount } = await ilkRender()
    await tapPlay()
    await screen.findByRole('button', { name: '■ Durdur' })
    await expectActiveAt(1000 + LAT + 500, [0])
    unmount()
    await waitFor(() => {
      flush(1000 + LAT + 600)
      expect(pending.size).toBe(0)
    })
  })
})
