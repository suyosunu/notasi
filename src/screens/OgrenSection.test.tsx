import { cleanup, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { DERSLER } from '../content/dersler'
import type { Ders } from '../content/dersler/types'
import { isaretEkle, resetDbForTests } from '../store/db'
import { OgrenSection } from './OgrenSection'

function ders(id: string, seviye: number, baslik: string): Ders {
  return {
    id,
    seviye,
    baslik,
    bloklar: [{ tur: 'dene', adimlar: ['x'] }],
    kaynaklar: ['test'],
  }
}

const FIXTURE: Ders[] = [
  ders('s0:ney', 0, 'Ney nedir'),
  ders('perde:neva', 1, 'Nevâ'),
  ders('nota:nota-1', 1, 'Re, Do, Si'),
  ders('etut:uzun ses/1', 7, 'Uzun ses'),
]
let kopya: Ders[] = []

beforeEach(async () => {
  await resetDbForTests()
  kopya = DERSLER.splice(0, DERSLER.length)
  DERSLER.push(...FIXTURE)
})
afterEach(() => {
  cleanup()
  DERSLER.splice(0, DERSLER.length, ...kopya)
})

describe('OgrenSection', () => {
  it('dersler seviyeye göre gruplanır; bilinmeyen seviye "Seviye N" olur', () => {
    render(<OgrenSection />)
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Seviye 0 · Hazırlık',
      'Seviye 1 · İlk beş ses',
      'Seviye 7',
    ])
    const grup1 = screen.getByRole('heading', { name: 'Seviye 1 · İlk beş ses' }).parentElement!
    expect([...grup1.querySelectorAll('.topic-title')].map((e) => e.textContent)).toEqual(['Nevâ', 'Re, Do, Si'])
  })

  it('okunanlar ✓, okunmayanlar 📖; bağlantılar #/ders/<kodlanmış kimlik>', async () => {
    await isaretEkle('okunanDersler', 'perde:neva')
    await isaretEkle('okunanDersler', 'etut:uzun ses/1')
    render(<OgrenSection />)
    const link = (baslik: string) => screen.getByText(baslik).closest('a')!
    await waitFor(() => expect(link('Nevâ').textContent).toContain('✓'))
    expect(link('Ney nedir').textContent).toContain('📖')
    expect(link('Re, Do, Si').textContent).toContain('📖')
    expect(link('Uzun ses').textContent).toContain('✓')
    expect(link('Ney nedir').getAttribute('href')).toBe('#/ders/s0%3Aney')
    expect(link('Uzun ses').getAttribute('href')).toBe('#/ders/etut%3Auzun%20ses%2F1')
    expect(link('Nevâ').querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('okundu')
    expect(link('Ney nedir').querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('okunmadı')
  })

  it('ders yoksa kısa soluk mesaj gösterir', () => {
    DERSLER.splice(0, DERSLER.length)
    render(<OgrenSection />)
    expect(screen.getByText('Dersler yakında burada olacak.').className).toBe('muted')
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0)
  })

  it('ana ekrana dönüş bağlantısı', () => {
    render(<OgrenSection />)
    expect(screen.getByRole('link', { name: 'Ana ekrana dön' }).getAttribute('href')).toBe('#/')
  })
})
