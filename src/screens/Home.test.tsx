import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { saveSession, saveSettings, resetDbForTests } from '../store/db'
import type { SessionRec } from '../store/db'
import { shareOrDownloadBackup } from '../store/backup'
import { todayLocal } from '../util/date'
import { Home } from './Home'

vi.mock('../store/backup', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../store/backup')>()
  return { ...actual, shareOrDownloadBackup: vi.fn(() => Promise.resolve()) }
})

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return todayLocal(d)
}

function session(over: Partial<SessionRec>): SessionRec {
  return {
    id: crypto.randomUUID(),
    kind: 'gunduz',
    date: todayLocal(),
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    completed: true,
    elapsedMs: 1000,
    state: { questions: [], index: 0, answers: [] },
    ...over,
  }
}

beforeEach(async () => {
  await resetDbForTests()
  vi.mocked(shareOrDownloadBackup).mockClear()
  location.hash = ''
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  location.hash = ''
})

describe('Home', () => {
  it('shows the Masa başı card and six section chips, Piyano being ileride', async () => {
    await saveSettings({ onboarded: true })
    render(<Home />)
    expect(await screen.findByText('☀️ Masa başı · 10 dk')).toBeTruthy()
    expect(screen.getByText('Re, Do, Si')).toBeTruthy()
    expect(document.querySelectorAll('[data-status]')).toHaveLength(6)
    expect(screen.getByText('Piyano').closest('[data-status]')?.getAttribute('data-status')).toBe('ileride')
    expect(screen.getByText('Makam').closest('[data-status]')?.getAttribute('data-status')).toBe('yakinda')
    expect(screen.getByText('Nota').closest('a')?.getAttribute('href')).toBe('#/nota')
    expect(screen.getByText('Piyano').closest('a')).toBeNull()
    expect(screen.getByText('Makam').closest('a')).toBeNull()
  })

  it('links the Masa başı card to /gunduz and disables the evening card', async () => {
    await saveSettings({ onboarded: true })
    render(<Home />)
    const day = (await screen.findByText('☀️ Masa başı · 10 dk')).closest('a')
    expect(day?.getAttribute('href')).toBe('#/gunduz')
    const night = screen.getByText('🌙 Akşam neyle').closest('[aria-disabled]')
    expect(night?.getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByText('Yakında: neyle uzun ses')).toBeTruthy()
  })

  it('shows the streak from completed sessions', async () => {
    await saveSettings({ onboarded: true, lastBackupAt: new Date().toISOString() })
    await saveSession(session({ date: todayLocal() }))
    await saveSession(session({ date: daysAgo(1) }))
    await saveSession(session({ date: daysAgo(2), completed: false }))
    render(<Home />)
    expect(await screen.findByText('2 gün seri')).toBeTruthy()
  })

  it('shows "Bugün başlayalım" with no streak and picks the greeting by hour', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 13, 20, 0, 0))
    await saveSettings({ onboarded: true })
    render(<Home />)
    expect(await screen.findByText('Bugün başlayalım')).toBeTruthy()
    expect(screen.getByText('İyi akşamlar')).toBeTruthy()
  })

  it('shows progress for an open day session', async () => {
    await saveSettings({ onboarded: true })
    await saveSession(
      session({
        completed: false,
        endedAt: undefined,
        state: { questions: new Array(12).fill({}), index: 3, answers: [] },
      }),
    )
    render(<Home />)
    const bar = (await screen.findByRole('progressbar')) as HTMLProgressElement
    expect(bar.value).toBe(3)
    expect(bar.max).toBe(12)
    expect(screen.queryByText('Bugünkü tur tamam ✓')).toBeNull()
  })

  it('shows "Bugünkü tur tamam ✓" when a day session completed today', async () => {
    await saveSettings({ onboarded: true, lastBackupAt: new Date().toISOString() })
    await saveSession(session({}))
    render(<Home />)
    expect(await screen.findByText('Bugünkü tur tamam ✓')).toBeTruthy()
  })

  it('shows the backup band when never backed up and a session was completed, then hides it', async () => {
    await saveSettings({ onboarded: true, lastBackupAt: null })
    await saveSession(session({}))
    render(<Home />)
    expect(await screen.findByText(/Yedeğinizi alın, telefon verileri silinirse ilerlemeniz kaybolmasın/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Yedekle' }))
    await waitFor(() => expect(screen.queryByText(/Yedeğinizi alın/)).toBeNull())
    expect(shareOrDownloadBackup).toHaveBeenCalledTimes(1)
  })

  it('keeps the backup band when the backup fails', async () => {
    vi.mocked(shareOrDownloadBackup).mockRejectedValueOnce(new Error('x'))
    await saveSettings({ onboarded: true })
    await saveSession(session({}))
    render(<Home />)
    fireEvent.click(await screen.findByRole('button', { name: 'Yedekle' }))
    await waitFor(() => expect(shareOrDownloadBackup).toHaveBeenCalled())
    expect(screen.getByText(/Yedeğinizi alın/)).toBeTruthy()
  })

  it('shows no backup band without a completed session', async () => {
    await saveSettings({ onboarded: true, lastBackupAt: null })
    render(<Home />)
    await screen.findByText('☀️ Masa başı · 10 dk')
    expect(screen.queryByText(/Yedeğinizi alın/)).toBeNull()
  })

  it('redirects to /baslangic when not onboarded and renders nothing', async () => {
    render(<Home />)
    await waitFor(() => expect(location.hash).toBe('#/baslangic'))
    expect(screen.queryByText('☀️ Masa başı · 10 dk')).toBeNull()
  })
})
