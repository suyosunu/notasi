import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playWritten, unlockAudio } from '../audio/player'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { MAKAMLAR } from '../content/makamlar'
import { cikisInisEvents } from '../music/makam'
import { MAKAM_DERSLERI } from '../content/dersler/makam'
import { getSettings, isaretEkle, resetDbForTests, saveSettings } from '../store/db'
import { MakamDetail } from './MakamDetail'

vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playWritten: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
}))

beforeEach(async () => {
  await resetDbForTests()
  await saveSettings({ okunanDersler: MAKAM_DERSLERI.map((d) => d.id) }) // ders kapısı açık; kapı testleri kaydı kendileri siler
  vi.mocked(unlockAudio).mockClear()
  vi.mocked(playWritten).mockReset()
  vi.mocked(playWritten).mockImplementation(() => Promise.resolve())
  location.hash = ''
})
afterEach(() => cleanup())

const byId = (id: string) => MAKAMLAR.find((m) => m.id === id)!
/** Ayarlar yüklenince etkinleşen dinle düğmesine dokunur. */
async function tapListen() {
  const btn = screen.getByRole('button', { name: '🔊 Diziyi dinle' }) as HTMLButtonElement
  await waitFor(() => expect(btn.disabled).toBe(false))
  fireEvent.click(btn)
}
const accs = () => [...document.querySelectorAll('g[data-acc]')].map((g) => g.getAttribute('data-acc'))

/** Ders kapısı ayarları okuyunca makam sayfası görünür. */
const sayfa = () => screen.findByRole('button', { name: '🔊 Diziyi dinle' })
const anladim = () => screen.findByRole('button', { name: 'Anladım, alıştırmaya geç' })

describe('MakamDetail', () => {
  it.each(MAKAMLAR.map((m) => [m.id, m.dizi.length] as const))('%s: porte %i nota başı çizer', async (id, n) => {
    render(<MakamDetail makamId={id} />)
    await sayfa()
    expect(document.querySelectorAll('[data-testid="notehead"]')).toHaveLength(n)
  })

  it('Rast: Segâh koma bemolü ve Eviç bakiye diyezi işaretleri çizilir', async () => {
    render(<MakamDetail makamId="rast" />)
    await sayfa()
    expect(accs()).toEqual(['-1', '4'])
  })

  it('Hicaz: Dik Kürdî, Nim Hicaz ve Eviç işaretleri çizilir', async () => {
    render(<MakamDetail makamId="hicaz" />)
    await sayfa()
    expect(accs()).toEqual(['-4', '4', '4'])
  })

  it('durak, güçlü, yeden, donanım ve seyir bilgilerini gösterir', async () => {
    render(<MakamDetail makamId="rast" />)
    await sayfa()
    expect(screen.getByRole('heading', { name: /Rast/ })).toBeTruthy()
    expect(screen.getByText('Durak').nextElementSibling?.textContent).toBe('Rast')
    expect(screen.getByText('Güçlü').nextElementSibling?.textContent).toBe('Nevâ')
    expect(screen.getByText('Yeden').nextElementSibling?.textContent).toBe('Irak')
    expect(screen.getByText('Donanım').nextElementSibling?.textContent).toBe('Si koma bemolü, Fa bakiye diyezi')
    expect(screen.getByText(byId('rast').seyir)).toBeTruthy()
  })

  it('Nevâ: Segâh koma bemolü ve Eviç bakiye diyezi işaretleri çizilir', async () => {
    render(<MakamDetail makamId="neva" />)
    await sayfa()
    expect(accs()).toEqual(['-1', '4'])
  })

  it('yapı satırı "Yapı" başlığıyla gösterilir', async () => {
    render(<MakamDetail makamId="neva" />)
    await sayfa()
    expect(screen.getByText('Yapı').nextElementSibling?.textContent).toBe("Dügâh'ta Uşşak dörtlüsü + Nevâ'da Rast beşlisi")
    cleanup()
    render(<MakamDetail makamId="rast" />)
    await sayfa()
    expect(screen.getByText('Yapı').nextElementSibling?.textContent).toBe("Rast'ta Rast beşlisi + Nevâ'da Rast dörtlüsü")
    cleanup()
    render(<MakamDetail makamId="ussak" />)
    await sayfa()
    expect(screen.getByText('Yapı').nextElementSibling?.textContent).toBe("Dügâh'ta Uşşak dörtlüsü + Nevâ'da Bûselik beşlisi")
  })

  it('Hüseynî: "Diziyi dinle" inişte Acem çalar (makam.inis); Kürdî donanımı küçük mücenneb bemolü', async () => {
    const huseyni = byId('huseyni')
    render(<MakamDetail makamId="huseyni" />)
    await sayfa()
    await tapListen()
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    expect(vi.mocked(playWritten).mock.calls[0]![0]).toEqual(cikisInisEvents(huseyni.dizi, huseyni.inis))
    cleanup()
    render(<MakamDetail makamId="kurdi" />)
    await sayfa()
    expect(screen.getByText('Donanım').nextElementSibling?.textContent).toBe('Si küçük mücenneb bemolü')
  })

  it('Uşşak ve Hicaz donanımı', async () => {
    render(<MakamDetail makamId="ussak" />)
    await sayfa()
    expect(screen.getByText('Donanım').nextElementSibling?.textContent).toBe('Si koma bemolü')
    cleanup()
    render(<MakamDetail makamId="hicaz" />)
    await sayfa()
    expect(screen.getByText('Donanım').nextElementSibling?.textContent).toBe(
      'Si bakiye bemolü, Fa bakiye diyezi, Do bakiye diyezi',
    )
  })

  it('"Sorularla çalış" ve geri bağlantıları', async () => {
    render(<MakamDetail makamId="hicaz" />)
    await sayfa()
    expect(screen.getByRole('link', { name: 'Sorularla çalış' }).getAttribute('href')).toBe('#/makam/sorular')
    expect(screen.getByRole('link', { name: 'Makam bölümüne dön' }).getAttribute('href')).toBe('#/makam')
  })

  it('"Diziyi dinle": çıkış-iniş olaylarını, kullanıcı ahengiyle, 80 bpm çalar; önce sesi açar', async () => {
    const tuning = { ahenk: 'kiz' as const, octaveOffset: 0, tuningCents: -20 }
    await saveSettings({ tuning })
    render(<MakamDetail makamId="ussak" />)
    await sayfa()
    await tapListen()
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    expect(unlockAudio).toHaveBeenCalledTimes(1)
    const [events, t, bpm] = vi.mocked(playWritten).mock.calls[0]!
    expect(events).toEqual(cikisInisEvents(byId('ussak').dizi))
    expect(t).toEqual(tuning)
    expect(bpm).toBe(80)
    expect(screen.queryByText(SOUND_WARNING)).toBeNull()
  })

  it('Rast "Diziyi dinle": inişte Acem çalınır (makam.inis)', async () => {
    render(<MakamDetail makamId="rast" />)
    await sayfa()
    await tapListen()
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    const rast = byId('rast')
    expect(vi.mocked(playWritten).mock.calls[0]![0]).toEqual(cikisInisEvents(rast.dizi, rast.inis))
  })

  it('ses kapalıyken uyarır, çalmaz', async () => {
    await saveSettings({ soundOn: false })
    render(<MakamDetail makamId="rast" />)
    await sayfa()
    await tapListen()
    expect(await screen.findByText(SOUND_OFF)).toBeTruthy()
    expect(playWritten).not.toHaveBeenCalled()
    expect(unlockAudio).not.toHaveBeenCalled()
  })

  it('çalma başarısız olursa ses uyarısı gösterir', async () => {
    vi.mocked(playWritten).mockImplementation(() => Promise.reject(new Error('strudel yok')))
    render(<MakamDetail makamId="rast" />)
    await sayfa()
    await tapListen()
    expect(await screen.findByText(SOUND_WARNING)).toBeTruthy()
  })
})

describe('MakamDetail: ders kapısı', () => {
  it('makam:giris okunmamışken ders gösterilir; ikisi okununca dizi ekranı', async () => {
    await resetDbForTests()
    render(<MakamDetail makamId="rast" />)
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('📖 Makam nedir?')
    expect(screen.queryByRole('button', { name: '🔊 Diziyi dinle' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Makam bölümüne dön' }).getAttribute('href')).toBe('#/makam')
    fireEvent.click(await anladim())
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('📖 Rast makamı'))
    expect(screen.queryByRole('button', { name: '🔊 Diziyi dinle' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Makam bölümüne dön' }).getAttribute('href')).toBe('#/makam')
    fireEvent.click(await anladim())
    await sayfa()
    expect((await getSettings()).okunanDersler).toEqual(['makam:giris', 'makam:rast'])
  })

  it('Nevâ: giriş okunmuşsa yalnız makam:neva dersi görünür', async () => {
    await resetDbForTests()
    await isaretEkle('okunanDersler', 'makam:giris')
    render(<MakamDetail makamId="neva" />)
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('📖 Nevâ makamı')
    fireEvent.click(await anladim())
    await sayfa()
  })

  it("Uşşak'ta yalnız makam:giris kapısı", async () => {
    await resetDbForTests()
    render(<MakamDetail makamId="ussak" />)
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('📖 Makam nedir?')
    fireEvent.click(await anladim())
    await sayfa()
    expect(screen.queryByRole('button', { name: 'Anladım, alıştırmaya geç' })).toBeNull()
    expect((await getSettings()).okunanDersler).toEqual(['makam:giris'])
  })

  it('bilinmeyen makamda kapı yok: "Makam bulunamadı" hemen görünür', async () => {
    await resetDbForTests()
    render(<MakamDetail makamId="yok" />)
    expect(screen.getByText('Makam bulunamadı.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Anladım, alıştırmaya geç' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Makam bölümüne dön' }).getAttribute('href')).toBe('#/makam')
  })
})
