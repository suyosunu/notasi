import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { NOTA_TOPICS } from '../content/nota-topics'
import { addAttempt, resetDbForTests, setPlacedOut } from '../store/db'
import { NotaSection } from './NotaSection'

beforeEach(async () => {
  await resetDbForTests()
  location.hash = ''
})
afterEach(() => {
  cleanup()
  location.hash = ''
})

function row(title: string): HTMLElement {
  return screen.getByText(title).closest('li') as HTMLElement
}

describe('NotaSection', () => {
  it('lists every topic with its status icon', async () => {
    await setPlacedOut('nota-1')
    render(<NotaSection />)
    await screen.findByText('Re, Do, Si')
    expect(screen.getAllByRole('listitem')).toHaveLength(NOTA_TOPICS.length)
    expect(within(row('Re, Do, Si')).getByText('✓')).toBeTruthy()
    expect(within(row('Birlik, ikilik, dörtlük')).getByText('▶')).toBeTruthy()
    expect(within(row('La ve Sol')).getByText('🔒')).toBeTruthy()
  })

  it('starts a free round for an açık or öğrenildi topic', async () => {
    await setPlacedOut('nota-1')
    render(<NotaSection />)
    fireEvent.click(await screen.findByRole('button', { name: /Re, Do, Si/ }))
    await waitFor(() => expect(location.hash).toBe('#/nota/nota-1'))
    fireEvent.click(screen.getByRole('button', { name: /Birlik, ikilik, dörtlük/ }))
    await waitFor(() => expect(location.hash).toBe('#/nota/sure-1'))
  })

  it('does not make kilitli topics tappable', async () => {
    await setPlacedOut('nota-1')
    render(<NotaSection />)
    await screen.findByText('Re, Do, Si')
    expect(within(row('La ve Sol')).queryByRole('button')).toBeNull()
    fireEvent.click(screen.getByText('La ve Sol'))
    expect(location.hash).toBe('')
  })

  it('marks a topic öğrenildi from mastery attempts', async () => {
    for (let i = 0; i < 10; i++) await addAttempt({ topicId: 'nota-1', cardId: 'note:D5', correct: true })
    render(<NotaSection />)
    await screen.findByText('Re, Do, Si')
    expect(within(row('Re, Do, Si')).getByText('✓')).toBeTruthy()
  })
})
