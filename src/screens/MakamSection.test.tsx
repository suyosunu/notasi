import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAKAMLAR } from '../content/makamlar'
import { listAttempts, listCards, resetDbForTests } from '../store/db'
import { MakamQuiz, MakamSection } from './MakamSection'

vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playWritten: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
}))

beforeEach(async () => {
  await resetDbForTests()
  location.hash = ''
})
afterEach(() => {
  cleanup()
  location.hash = ''
})

describe('MakamSection', () => {
  it('dört makam kartını listeler; her biri kendi sayfasına bağlanır', () => {
    render(<MakamSection />)
    expect(screen.getByRole('heading', { name: /Makam/ })).toBeTruthy()
    for (const m of MAKAMLAR) {
      const link = screen.getByText(m.name, { selector: '.topic-title' }).closest('a')!
      expect(link.getAttribute('href')).toBe(`#/makam/${m.id}`)
    }
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('makam kartlarında önerilen seviye etiketi: Rast 3, Nevâ 3, Uşşak 4, Hicaz 4', () => {
    render(<MakamSection />)
    const etiket = (ad: string) => screen.getByText(ad).closest('a')!.querySelector('.seviye-etiket')?.textContent
    expect(etiket('Rast')).toBe('Seviye 3')
    expect(etiket('Nevâ')).toBe('Seviye 3')
    expect(etiket('Uşşak')).toBe('Seviye 4')
    expect(etiket('Hicaz')).toBe('Seviye 4')
  })

  it("Nevâ kartı 'Seviye 3' etiketiyle Rast'tan sonra gelir", () => {
    render(<MakamSection />)
    const adlar = screen.getAllByRole('listitem').map((li) => li.querySelector('.topic-title')!.textContent ?? '')
    const rast = adlar.indexOf('Rast')
    const neva = adlar.indexOf('Nevâ')
    expect(neva).toBe(rast + 1)
    expect(screen.getByText('Nevâ').closest('a')!.querySelector('.seviye-etiket')?.textContent).toBe('Seviye 3')
  })

  it('sorulara ve ana ekrana bağlantı verir', () => {
    render(<MakamSection />)
    expect(screen.getByRole('link', { name: /Sorularla çalış/ }).getAttribute('href')).toBe('#/makam/sorular')
    expect(screen.getByRole('link', { name: 'Ana ekrana dön' }).getAttribute('href')).toBe('#/')
  })
})

describe('MakamQuiz', () => {
  it('8 soruluk serbest tur: başlık, soru ve 4 farklı seçenek', async () => {
    render(<MakamQuiz />)
    expect(await screen.findByText(/Makam · 1\/8/)).toBeTruthy()
    const opts = document.querySelectorAll('.option')
    // Dizi sorusunda dört makam + çeldirici (5), durak ve güçlüde 4 seçenek.
    expect([4, 5]).toContain(opts.length)
    expect(new Set([...opts].map((o) => o.textContent)).size).toBe(opts.length)
  })

  it('cevap bir deneme ve Leitner kartı yazar (makam konusu)', async () => {
    render(<MakamQuiz />)
    await screen.findByText(/Makam · 1\/8/)
    fireEvent.click(document.querySelector('.option') as HTMLElement)
    await screen.findByRole('button', { name: 'Devam' })
    await waitFor(async () => expect(await listAttempts()).toHaveLength(1))
    const [attempt] = await listAttempts()
    expect(attempt!.topicId).toBe('makam')
    expect(attempt!.cardId).toMatch(/^makam-(dizi|durak|guclu):/)
    expect(await listCards()).toHaveLength(1)
  })

  it('tur bitince makam bölümüne dönme bağlantısı çıkar', async () => {
    render(<MakamQuiz />)
    for (let i = 1; i <= 8; i++) {
      await screen.findByText(new RegExp(`Makam · ${i}/8`))
      fireEvent.click(document.querySelector('.option') as HTMLElement)
      fireEvent.click(await screen.findByRole('button', { name: 'Devam' }))
    }
    expect(await screen.findByText('Tur bitti')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Makam bölümüne dön' }).getAttribute('href')).toBe('#/makam')
  })
})
