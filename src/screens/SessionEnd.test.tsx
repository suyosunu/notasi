import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetDbForTests, saveSession } from '../store/db'
import type { SessionRec } from '../store/db'
import { SessionEnd } from './SessionEnd'

beforeEach(async () => {
  await resetDbForTests()
  location.hash = '#/oturum-sonu'
})
afterEach(() => {
  cleanup()
  location.hash = ''
})

function session(over: Partial<SessionRec>): SessionRec {
  return {
    id: crypto.randomUUID(),
    kind: 'gunduz',
    date: '2026-10-13',
    startedAt: '2026-10-13T08:00:00.000Z',
    endedAt: '2026-10-13T08:10:00.000Z',
    completed: true,
    elapsedMs: 600000,
    state: {
      questions: [],
      index: 3,
      answers: [
        { cardId: 'a', correct: true },
        { cardId: 'b', correct: false },
        { cardId: 'c', correct: true },
      ],
    },
    ...over,
  }
}

describe('SessionEnd', () => {
  it('shows the result of the most recently ended day session', async () => {
    await saveSession(
      session({
        endedAt: '2026-10-12T08:10:00.000Z',
        state: { questions: [], index: 1, answers: [{ cardId: 'a', correct: false }] },
      }),
    )
    await saveSession(session({}))
    render(<SessionEnd />)
    expect(await screen.findByText('Bugünlük bu kadar 👏')).toBeTruthy()
    expect(screen.getByText('2/3 doğru')).toBeTruthy()
  })

  it('shows only the title when there is no ended session', async () => {
    await saveSession(session({ endedAt: undefined, completed: false }))
    render(<SessionEnd />)
    expect(await screen.findByText('Oturum sonu')).toBeTruthy()
    expect(screen.queryByText(/doğru/)).toBeNull()
  })

  it('shows only the title for non-gündüz sessions', async () => {
    await saveSession(session({ kind: 'aksam' }))
    render(<SessionEnd />)
    expect(await screen.findByText('Oturum sonu')).toBeTruthy()
    expect(screen.queryByText(/doğru/)).toBeNull()
  })

  it('returns home', async () => {
    render(<SessionEnd />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ana ekrana dön' }))
    expect(location.hash).toBe('#/')
  })
})
