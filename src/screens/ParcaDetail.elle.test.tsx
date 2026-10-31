import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isaretEkle, resetDbForTests } from '../store/db'
import { ParcaDetail } from './ParcaDetail'

vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playCode: vi.fn(() => Promise.resolve()),
  playLoop: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
  getNeySesi: vi.fn(() => 'shakuhachi'),
  sesSaatiSimdi: vi.fn(() => null),
}))
vi.mock('../audio/wakeLock', () => ({
  acquireWakeLock: vi.fn(() => Promise.resolve()),
  releaseWakeLock: vi.fn(),
}))
// Gönderilen elle yazılmış parça yok: yalnız bu dosyada örnek bir parça PARCALAR'a eklenir.
vi.mock('../content/parcalar', async (orijinal) => {
  const m = await orijinal<typeof import('../content/parcalar')>()
  const { ellePiecesFrom } = await import('../content/parcalar/elle/tur')
  const ornek = ellePiecesFrom([
    {
      id: 'ornek',
      title: 'Örnek Eser',
      makam: 'ussak',
      usul: 'sofyan',
      composer: 'Anonim',
      kaynak: 'https://www.neyzen.com/ornek.pdf',
      notasyon: 'G4:1 | A4:1',
    },
  ])
  return { ...m, PARCALAR: [...m.PARCALAR, ...ornek] }
})

beforeEach(async () => {
  await resetDbForTests()
  await isaretEkle('okunanDersler', 'eser:giris')
})
afterEach(() => cleanup())

describe('ParcaDetail kaynak notu', () => {
  it('neyzen.com kaynaklı parçada "Nota: neyzen.com" bağlantısı ve çarpma notu; SymbTr notu yok', async () => {
    render(<ParcaDetail parcaId="ornek" />)
    await screen.findByRole('heading', { level: 1 })
    const link = screen.getByRole('link', { name: 'neyzen.com' })
    expect(link.getAttribute('href')).toBe('https://www.neyzen.com/ornek.pdf')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener')
    expect(screen.getByText(/Nota:/).textContent).toContain('Nota: neyzen.com')
    expect(screen.getByText(/Çarpmalar gösterilmez\./)).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'SymbTr' })).toBeNull()
  })

  it('SymbTr parçasında SymbTr atfı kalır, neyzen.com notu yoktur', async () => {
    render(<ParcaDetail parcaId="hak-teala" />)
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByRole('link', { name: 'SymbTr' }).getAttribute('href')).toBe('https://github.com/MTG/SymbTr')
    expect(screen.queryByRole('link', { name: 'neyzen.com' })).toBeNull()
    expect(screen.queryByText(/Çarpmalar gösterilmez/)).toBeNull()
  })
})
