import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { topicOfCard } from '../learning/cards'
import { getOpenSession, listAttempts, listCards, putCard, resetDbForTests, setPlacedOut } from '../store/db'
import { MixedPractice } from './MixedPractice'

vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playWritten: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
}))

// Her sorunun ilk seçeneği doğru cevap olsun: testler cevabı bilmeden doğru/yanlış sürebilsin.
vi.mock('../learning/questions', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../learning/questions')>()
  return {
    ...orig,
    makeQuestion: (cardId: string, rng: () => number) => {
      const q = orig.makeQuestion(cardId, rng)
      return { ...q, options: [q.answer, ...q.options.filter((o) => o !== q.answer)] }
    },
  }
})

beforeEach(async () => {
  await resetDbForTests()
  location.hash = ''
})
afterEach(() => {
  cleanup()
  location.hash = ''
})

function optionButtons(): HTMLElement[] {
  return screen.getAllByRole('button').filter((b) => !/Dinle|İpucu|Devam/.test(b.textContent ?? ''))
}

async function playRound(total: number, pick: (options: HTMLElement[]) => HTMLElement): Promise<void> {
  for (let i = 1; i <= total; i++) {
    await screen.findByText(`🔀 Karışık antrenman · ${i}/${total}`)
    fireEvent.click(pick(optionButtons()))
    fireEvent.click(await screen.findByRole('button', { name: 'Devam' }))
  }
}

describe('MixedPractice', () => {
  it('shows an explanation instead of an empty round when no topic is learned', async () => {
    render(<MixedPractice />)
    expect(await screen.findByText('Henüz öğrenilmiş konu yok.')).toBeTruthy()
    expect(screen.queryByText(/Karışık antrenman · 1\//)).toBeNull()
    expect(screen.getByRole('link', { name: 'Notalara dön' }).getAttribute('href')).toBe('#/nota')
  })

  it('asks 12 questions, writes a correct attempt and updates the Leitner box for each, then ends with the score', async () => {
    await setPlacedOut('nota-1')
    render(<MixedPractice />)
    await playRound(12, (opts) => opts[0]!)
    expect(await screen.findByText('Tur bitti')).toBeTruthy()
    expect(screen.getByText('Skor: 12/12')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Notalara dön' }).getAttribute('href')).toBe('#/nota')

    const attempts = await listAttempts()
    expect(attempts).toHaveLength(12)
    expect(attempts.every((a) => a.correct && a.topicId === 'nota-1')).toBe(true)
    const cards = await listCards()
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.every((c) => ['note:D5', 'note:C5', 'note:B4'].includes(c.id) && c.box === 2)).toBe(true)
    expect(await getOpenSession('gunduz')).toBeUndefined()
  })

  it('writes each attempt under the card own topic and drops the box on a wrong answer', async () => {
    await setPlacedOut('nota-1')
    await setPlacedOut('sure-1')
    // Vadesi gelmiş iki kart (her konudan biri) turda kesin yer alır.
    await putCard({ id: 'note:D5', box: 1, lastReviewedAt: '2020-01-01T00:00:00.000Z' })
    await putCard({ id: 'dur:whole', box: 1, lastReviewedAt: '2020-01-02T00:00:00.000Z' })
    render(<MixedPractice />)
    await playRound(12, (opts) => opts[1]!) // her zaman yanlış
    expect(await screen.findByText('Skor: 0/12')).toBeTruthy()
    const attempts = await listAttempts()
    expect(attempts).toHaveLength(12)
    expect(attempts.every((a) => !a.correct && a.topicId === topicOfCard(a.cardId).id)).toBe(true)
    expect(new Set(attempts.map((a) => a.topicId))).toEqual(new Set(['nota-1', 'sure-1']))
    expect((await listCards()).every((c) => c.box === 1)).toBe(true)
  })
})
