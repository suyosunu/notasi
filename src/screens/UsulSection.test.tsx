import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startUsul, stopUsul } from '../audio/usul'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { USULLER } from '../content/usuller'
import { resetDbForTests, saveSettings } from '../store/db'
import { UsulSection } from './UsulSection'

vi.mock('../audio/usul', () => ({
  startUsul: vi.fn(() => Promise.resolve()),
  stopUsul: vi.fn(),
}))

const DOLAP_NOTE = 'Bu usulün vuruş kalıbı kaynaklarda bulunamadı; yalnızca zaman sayılır (12/8).'

const usul = (id: string) => USULLER.find((u) => u.id === id)!

beforeEach(async () => {
  await resetDbForTests()
  vi.mocked(startUsul).mockReset().mockImplementation(() => Promise.resolve())
  vi.mocked(stopUsul).mockClear()
  location.hash = ''
})
afterEach(() => cleanup())

async function tapPlay() {
  const btn = screen.getByRole('button', { name: '▶ Çal' }) as HTMLButtonElement
  await waitFor(() => expect(btn.disabled).toBe(false))
  fireEvent.click(btn)
}
const pick = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }))

describe('UsulSection', () => {
  it('"Usuller" başlığı ve altı usulün listesi', () => {
    render(<UsulSection />)
    expect(screen.getByRole('heading', { name: /Usuller/ })).toBeTruthy()
    for (const u of USULLER) expect(screen.getByRole('button', { name: new RegExp(`^${u.name}`) })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ana ekrana dön' }).getAttribute('href')).toBe('#/')
  })

  it('vuruş şeması: kutular süreyle orantılı genişlikte, etiketli, düm ve tek farklı renkte', () => {
    render(<UsulSection />)
    pick(/Düyek/)
    const boxes = [...document.querySelectorAll<HTMLElement>('[data-testid="vurus"]')]
    expect(boxes.map((b) => b.textContent)).toEqual(['düm', 'tek', 'tek', 'düm', 'tek'])
    expect(boxes.map((b) => b.style.width)).toEqual(['12.5%', '25%', '12.5%', '25%', '25%'])
    const classes = boxes.map((b) => b.className)
    expect(classes[0]).toBe(classes[3])
    expect(classes[1]).toBe(classes[2])
    expect(classes[0]).not.toBe(classes[1])
  })

  it('Sofyan (varsayılan): düm, te, ke etiketleri; te ve ke tek ile aynı renk sınıfında', () => {
    render(<UsulSection />)
    const boxes = [...document.querySelectorAll<HTMLElement>('[data-testid="vurus"]')]
    expect(boxes.map((b) => b.textContent)).toEqual(['düm', 'te', 'ke'])
    expect(boxes.map((b) => b.style.width)).toEqual(['50%', '25%', '25%'])
    expect(boxes[1]!.className).toBe(boxes[2]!.className)
    expect(boxes[0]!.className).not.toBe(boxes[1]!.className)
  })

  it('Dolap: vuruş şeması gösterilmez, açıklama metni görünür', () => {
    render(<UsulSection />)
    expect(screen.queryByText(DOLAP_NOTE)).toBeNull()
    pick(/Dolap/)
    expect(document.querySelectorAll('[data-testid="vurus"]')).toHaveLength(0)
    expect(screen.getByText(DOLAP_NOTE)).toBeTruthy()
    pick(/Sofyan/)
    expect(screen.queryByText(DOLAP_NOTE)).toBeNull()
    expect(document.querySelectorAll('[data-testid="vurus"]')).toHaveLength(3)
  })

  it('hız kaydırıcısı 40–120, varsayılan 60; etiket "Hız: ♩ = {bpm}"', () => {
    render(<UsulSection />)
    const slider = screen.getByRole('slider') as HTMLInputElement
    expect([slider.min, slider.max, slider.value]).toEqual(['40', '120', '60'])
    expect(screen.getByText('Hız: ♩ = 60')).toBeTruthy()
    fireEvent.input(slider, { target: { value: '90' } })
    expect(screen.getByText('Hız: ♩ = 90')).toBeTruthy()
  })

  it('mertebesi 8 olan usulde birim ♪, 4 olanda ♩ gösterilir', () => {
    render(<UsulSection />)
    pick(/Sofyan/)
    expect(screen.getByText('Hız: ♩ = 60')).toBeTruthy()
    pick(/Düyek/)
    expect(screen.getByText('Hız: ♪ = 60')).toBeTruthy()
    pick(/Dolap/)
    expect(screen.getByText('Hız: ♪ = 60')).toBeTruthy()
    pick(/^Semâî/)
    expect(screen.getByText('Hız: ♩ = 60')).toBeTruthy()
  })

  it('Çal: sesi açıp seçili usulü varsayılan hızla başlatır; düğme "■ Durdur" olur', async () => {
    render(<UsulSection />)
    await tapPlay()
    await waitFor(() => expect(startUsul).toHaveBeenCalledTimes(1))
    expect(startUsul).toHaveBeenCalledWith(usul('sofyan'), 60)
    expect(screen.getByRole('button', { name: '■ Durdur' })).toBeTruthy()
  })

  it('Durdur: stopUsul çağrılır ve düğme "▶ Çal" olur', async () => {
    render(<UsulSection />)
    await tapPlay()
    fireEvent.click(await screen.findByRole('button', { name: '■ Durdur' }))
    expect(stopUsul).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '▶ Çal' })).toBeTruthy()
  })

  it('Dolap seçiliyken Çal metronomu başlatır (startUsul Dolap ile)', async () => {
    render(<UsulSection />)
    pick(/Dolap/)
    await tapPlay()
    await waitFor(() => expect(startUsul).toHaveBeenCalledWith(usul('dolap'), 60))
  })

  it('çalarken usul değişirse yeni usulle yeniden başlar', async () => {
    render(<UsulSection />)
    await tapPlay()
    await waitFor(() => expect(startUsul).toHaveBeenCalledTimes(1))
    pick(/Düyek/)
    await waitFor(() => expect(startUsul).toHaveBeenCalledTimes(2))
    expect(vi.mocked(startUsul).mock.calls[1]).toEqual([usul('duyek'), 60])
    expect(screen.getByRole('button', { name: '■ Durdur' })).toBeTruthy()
  })

  it('çalarken hız değişirse (bırakınca) yeni hızla yeniden başlar; çalmıyorsa başlamaz', async () => {
    render(<UsulSection />)
    const slider = screen.getByRole('slider') as HTMLInputElement
    fireEvent.input(slider, { target: { value: '80' } })
    fireEvent.change(slider)
    expect(startUsul).not.toHaveBeenCalled()
    await tapPlay()
    await waitFor(() => expect(startUsul).toHaveBeenCalledWith(usul('sofyan'), 80))
    fireEvent.input(slider, { target: { value: '100' } })
    fireEvent.change(slider)
    await waitFor(() => expect(startUsul).toHaveBeenLastCalledWith(usul('sofyan'), 100))
    expect(startUsul).toHaveBeenCalledTimes(2)
  })

  it('çalmıyorken usul seçmek çalmayı başlatmaz', () => {
    render(<UsulSection />)
    pick(/Düyek/)
    expect(startUsul).not.toHaveBeenCalled()
  })

  it('sayfadan çıkınca (unmount) stopUsul çağrılır', async () => {
    const { unmount } = render(<UsulSection />)
    await waitFor(() => expect((screen.getByRole('button', { name: '▶ Çal' }) as HTMLButtonElement).disabled).toBe(false))
    expect(stopUsul).not.toHaveBeenCalled()
    unmount()
    await waitFor(() => expect(stopUsul).toHaveBeenCalledTimes(1))
  })

  it('ses kapalıyken SOUND_OFF gösterir, çalmaz', async () => {
    await saveSettings({ soundOn: false })
    render(<UsulSection />)
    await tapPlay()
    expect(await screen.findByText(SOUND_OFF)).toBeTruthy()
    expect(startUsul).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '▶ Çal' })).toBeTruthy()
  })

  it('çalma başarısız olursa SOUND_WARNING gösterir ve düğme "▶ Çal" kalır', async () => {
    vi.mocked(startUsul).mockImplementation(() => Promise.reject(new Error('strudel yok')))
    render(<UsulSection />)
    await tapPlay()
    expect(await screen.findByText(SOUND_WARNING)).toBeTruthy()
    expect(screen.getByRole('button', { name: '▶ Çal' })).toBeTruthy()
  })
})
