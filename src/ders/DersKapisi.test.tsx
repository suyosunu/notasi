import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DERSLER } from '../content/dersler'
import type { Ders } from '../content/dersler/types'
import { getSettings, isaretEkle, resetDbForTests } from '../store/db'
import { DersKapisi } from './DersKapisi'

vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playWritten: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
}))
vi.mock('../store/db', async (orijinal) => {
  const m = await orijinal<typeof import('../store/db')>()
  return { ...m, isaretEkle: vi.fn(m.isaretEkle) }
})

const DIGER: Ders = {
  id: 's0:diger',
  seviye: 0,
  baslik: 'Diğer ders',
  bloklar: [
    { tur: 'metin', metin: 'Diğer ders metni.' },
    { tur: 'gorsel', ad: 'nefes-444' },
    { tur: 'dene', adimlar: ['Dene'] },
  ],
  kaynaklar: ['test'],
}

const FIXTURE: Ders = {
  id: 's0:kapi',
  seviye: 0,
  baslik: 'Kapı dersi',
  bloklar: [
    { tur: 'metin', metin: 'Ders metni.' },
    { tur: 'gorsel', ad: 'nefes-444' },
    { tur: 'dene', adimlar: ['Dene'] },
  ],
  kaynaklar: ['test'],
}

beforeEach(async () => {
  await resetDbForTests()
  DERSLER.push(FIXTURE, DIGER)
})
afterEach(() => {
  cleanup()
  DERSLER.splice(DERSLER.indexOf(FIXTURE), 1)
  DERSLER.splice(DERSLER.indexOf(DIGER), 1)
})

const cocuk = () => <p>Alıştırma burada</p>

describe('DersKapisi', () => {
  it('okunmamış derste ders görünür, çocuk görünmez; "Anladım"dan sonra çocuk görünür', async () => {
    render(<DersKapisi dersId="s0:kapi">{cocuk()}</DersKapisi>)
    expect(screen.getByText('Yükleniyor…')).toBeTruthy()
    expect(await screen.findByText('Ders metni.')).toBeTruthy()
    expect(screen.queryByText('Alıştırma burada')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    expect(await screen.findByText('Alıştırma burada')).toBeTruthy()
    expect(screen.queryByText('Ders metni.')).toBeNull()
    expect((await getSettings()).okunanDersler).toEqual(['s0:kapi'])
  })

  it('okunmuş derste doğrudan çocuk görünür', async () => {
    await isaretEkle('okunanDersler', 's0:kapi')
    render(<DersKapisi dersId="s0:kapi">{cocuk()}</DersKapisi>)
    expect(await screen.findByText('Alıştırma burada')).toBeTruthy()
    expect(screen.queryByText('Ders metni.')).toBeNull()
  })

  it('yeniden kurulduğunda (okundu kaydı var) ders tekrar gelmez', async () => {
    const ilk = render(<DersKapisi dersId="s0:kapi">{cocuk()}</DersKapisi>)
    fireEvent.click(await screen.findByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    await screen.findByText('Alıştırma burada')
    ilk.unmount()
    render(<DersKapisi dersId="s0:kapi">{cocuk()}</DersKapisi>)
    expect(await screen.findByText('Alıştırma burada')).toBeTruthy()
    expect(screen.queryByText('Ders metni.')).toBeNull()
  })

  it('bilinmeyen, null ve undefined kimlikte doğrudan çocuk görünür', () => {
    for (const id of ['yok:yok', null, undefined]) {
      const { unmount } = render(<DersKapisi dersId={id}>{cocuk()}</DersKapisi>)
      expect(screen.getByText('Alıştırma burada')).toBeTruthy()
      expect(screen.queryByText('Yükleniyor…')).toBeNull()
      unmount()
    }
  })

  it('kayıt yazılamazsa da "Anladım" çocuğa geçirir ve ders kapıda takılmaz', async () => {
    vi.mocked(isaretEkle).mockRejectedValueOnce(new Error('IndexedDB yazılamadı'))
    render(<DersKapisi dersId="s0:kapi">{cocuk()}</DersKapisi>)
    fireEvent.click(await screen.findByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    await waitFor(() => expect(screen.getByText('Alıştırma burada')).toBeTruthy())
  })

  it('dersId değişince önceki dersin durumu sıfırlanır (geçmiş ders çocuğu göstermez)', async () => {
    const { rerender } = render(<DersKapisi dersId="s0:kapi">{cocuk()}</DersKapisi>)
    fireEvent.click(await screen.findByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    await screen.findByText('Alıştırma burada')
    rerender(<DersKapisi dersId="s0:diger">{cocuk()}</DersKapisi>)
    expect(screen.queryByText('Alıştırma burada')).toBeNull()
    expect(await screen.findByText('Diğer ders metni.')).toBeTruthy()
  })
})
