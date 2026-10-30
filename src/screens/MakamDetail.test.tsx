import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playWritten, unlockAudio } from '../audio/player'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { MAKAMLAR } from '../content/makamlar'
import { cikisInisEvents } from '../music/makam'
import { resetDbForTests, saveSettings } from '../store/db'
import { MakamDetail } from './MakamDetail'

vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playWritten: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
}))

beforeEach(async () => {
  await resetDbForTests()
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

describe('MakamDetail', () => {
  it.each(MAKAMLAR.map((m) => [m.id, m.dizi.length] as const))('%s: porte %i nota başı çizer', (id, n) => {
    render(<MakamDetail makamId={id} />)
    expect(document.querySelectorAll('[data-testid="notehead"]')).toHaveLength(n)
  })

  it('Rast: Segâh koma bemolü ve Eviç bakiye diyezi işaretleri çizilir', () => {
    render(<MakamDetail makamId="rast" />)
    expect(accs()).toEqual(['-1', '4'])
  })

  it('Hicaz: Dik Kürdî, Nim Hicaz ve Eviç işaretleri çizilir', () => {
    render(<MakamDetail makamId="hicaz" />)
    expect(accs()).toEqual(['-4', '4', '4'])
  })

  it('durak, güçlü, yeden, donanım ve seyir bilgilerini gösterir', () => {
    render(<MakamDetail makamId="rast" />)
    expect(screen.getByRole('heading', { name: /Rast/ })).toBeTruthy()
    expect(screen.getByText('Durak').nextElementSibling?.textContent).toBe('Rast')
    expect(screen.getByText('Güçlü').nextElementSibling?.textContent).toBe('Nevâ')
    expect(screen.getByText('Yeden').nextElementSibling?.textContent).toBe('Irak')
    expect(screen.getByText('Donanım').nextElementSibling?.textContent).toBe('Si koma bemolü, Fa bakiye diyezi')
    expect(screen.getByText(byId('rast').seyir)).toBeTruthy()
  })

  it('Nevâ: Segâh koma bemolü ve Eviç bakiye diyezi işaretleri çizilir', () => {
    render(<MakamDetail makamId="neva" />)
    expect(accs()).toEqual(['-1', '4'])
  })

  it('yapı satırı varsa "Yapı" başlığıyla gösterilir; yoksa hiç çıkmaz', () => {
    render(<MakamDetail makamId="neva" />)
    expect(screen.getByText('Yapı').nextElementSibling?.textContent).toBe("Dügâh'ta Uşşak dörtlüsü + Nevâ'da Rast beşlisi")
    cleanup()
    render(<MakamDetail makamId="rast" />)
    expect(screen.getByText('Yapı').nextElementSibling?.textContent).toBe("Rast'ta Rast beşlisi + Nevâ'da Rast dörtlüsü")
    cleanup()
    render(<MakamDetail makamId="ussak" />)
    expect(screen.queryByText('Yapı')).toBeNull()
  })

  it('Uşşak ve Hicaz donanımı', () => {
    render(<MakamDetail makamId="ussak" />)
    expect(screen.getByText('Donanım').nextElementSibling?.textContent).toBe('Si koma bemolü')
    cleanup()
    render(<MakamDetail makamId="hicaz" />)
    expect(screen.getByText('Donanım').nextElementSibling?.textContent).toBe(
      'Si bakiye bemolü, Fa bakiye diyezi, Do bakiye diyezi',
    )
  })

  it('"Sorularla çalış" ve geri bağlantıları', () => {
    render(<MakamDetail makamId="hicaz" />)
    expect(screen.getByRole('link', { name: 'Sorularla çalış' }).getAttribute('href')).toBe('#/makam/sorular')
    expect(screen.getByRole('link', { name: 'Makam bölümüne dön' }).getAttribute('href')).toBe('#/makam')
  })

  it('"Diziyi dinle": çıkış-iniş olaylarını, kullanıcı ahengiyle, 80 bpm çalar; önce sesi açar', async () => {
    const tuning = { ahenk: 'kiz' as const, octaveOffset: 0, tuningCents: -20 }
    await saveSettings({ tuning })
    render(<MakamDetail makamId="ussak" />)
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
    await tapListen()
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    const rast = byId('rast')
    expect(vi.mocked(playWritten).mock.calls[0]![0]).toEqual(cikisInisEvents(rast.dizi, rast.inis))
  })

  it('ses kapalıyken uyarır, çalmaz', async () => {
    await saveSettings({ soundOn: false })
    render(<MakamDetail makamId="rast" />)
    await tapListen()
    expect(await screen.findByText(SOUND_OFF)).toBeTruthy()
    expect(playWritten).not.toHaveBeenCalled()
    expect(unlockAudio).not.toHaveBeenCalled()
  })

  it('çalma başarısız olursa ses uyarısı gösterir', async () => {
    vi.mocked(playWritten).mockImplementation(() => Promise.reject(new Error('strudel yok')))
    render(<MakamDetail makamId="rast" />)
    await tapListen()
    expect(await screen.findByText(SOUND_WARNING)).toBeTruthy()
  })
})
