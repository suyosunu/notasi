import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addLongTone, isaretEkle, saveSession, saveSettings, resetDbForTests } from '../store/db'
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
  it('shows the Masa başı card and seven section chips, Piyano being ileride', async () => {
    await saveSettings({ onboarded: true, placementDone: true })
    render(<Home />)
    expect(await screen.findByText('☀️ Masa başı · 10 dk')).toBeTruthy()
    expect(screen.getByText('Re, Do, Si')).toBeTruthy()
    expect(document.querySelectorAll('[data-status]')).toHaveLength(7)
    expect(screen.getByText('Piyano').closest('[data-status]')?.getAttribute('data-status')).toBe('ileride')
    expect(screen.getByText('Makam').closest('[data-status]')?.getAttribute('data-status')).toBe('aktif')
    expect(screen.getByText('Usul').closest('[data-status]')?.getAttribute('data-status')).toBe('aktif')
    expect(screen.getByText('Usul').closest('a')?.getAttribute('href')).toBe('#/usul')
    expect(screen.getByText('Nota').closest('a')?.getAttribute('href')).toBe('#/nota')
    expect(screen.getByText('Öğren').closest('a')?.getAttribute('href')).toBe('#/ogren')
    expect(screen.getByText('Piyano').closest('a')).toBeNull()
    expect(screen.getByText('Makam').closest('a')?.getAttribute('href')).toBe('#/makam')
    expect(screen.getByText('Parçalar').closest('[data-status]')?.getAttribute('data-status')).toBe('aktif')
    expect(screen.getByText('Parçalar').closest('a')?.getAttribute('href')).toBe('#/parcalar')
  })

  it('Yolum kartı mevcut seviyeyi ve sıradaki hedefi gösterir, #/yolum sayfasına gider', async () => {
    await saveSettings({ onboarded: true, placementDone: true })
    render(<Home />)
    const kart = (await screen.findByText('🗺️ Yolum · Seviye 0: Hazırlık')).closest('a')!
    expect(kart.getAttribute('href')).toBe('#/yolum')
    expect(kart.textContent).toContain('Sıradaki: Neyin bölümlerini öğrendim')
    // Çalışma kartlarının üstündedir.
    expect(kart.nextElementSibling?.textContent).toContain('Masa başı')
    cleanup()
    await isaretEkle('okunanDersler', 's0:neyi-tani')
    render(<Home />)
    expect(await screen.findByText('Sıradaki: Duruş ve tutuş dersini okudum')).toBeTruthy()
  })

  it('links the Masa başı card to /gunduz and the evening card to /aksam', async () => {
    await saveSettings({ onboarded: true, placementDone: true })
    render(<Home />)
    const day = (await screen.findByText('☀️ Masa başı · 10 dk')).closest('a')
    expect(day?.getAttribute('href')).toBe('#/gunduz')
    const night = screen.getByText('🌙 Akşam neyle').closest('a')
    expect(night?.getAttribute('href')).toBe('#/aksam')
    expect(night?.getAttribute('aria-disabled')).toBeNull()
    expect(screen.queryByText('Yakında: neyle uzun ses')).toBeNull()
  })

  it('lists the evening plan step labels', async () => {
    await saveSettings({ onboarded: true, placementDone: true })
    render(<Home />)
    const night = (await screen.findByText('🌙 Akşam neyle')).closest('a') as HTMLElement
    expect(within(night).getByText('İlk ses')).toBeTruthy()
    cleanup()
    await addLongTone({ perdeId: 'ilk-ses', durationMs: 3000, passed: true, toleranceCents: 50 })
    await addLongTone({ perdeId: 'neva', durationMs: 4000, passed: true, toleranceCents: 25 })
    await saveSettings({ calibrated: true })
    render(<Home />)
    const night2 = (await screen.findByText('🌙 Akşam neyle')).closest('a') as HTMLElement
    const labels = within(night2)
      .getAllByRole('listitem')
      .map((li) => li.querySelector('.plan-label')?.textContent)
    // Nevâ geçilmişken etüt de planda: başpâre adımından sonra, tek perde Nevâ etüdü.
    expect(labels).toEqual(['Uzun ses: Nevâ', 'Uzun ses: Çârgâh', 'Başpâre koy-çek', 'Etüt · Tek perde: Nevâ'])
    cleanup()
    await addLongTone({ perdeId: 'baspare', durationMs: 300, passed: true, toleranceCents: 25 })
    render(<Home />)
    const night3 = (await screen.findByText('🌙 Akşam neyle')).closest('a') as HTMLElement
    expect(within(night3).queryByText('Başpâre koy-çek')).toBeNull()
  })

  it('shows the streak from completed sessions', async () => {
    await saveSettings({ onboarded: true, placementDone: true, lastBackupAt: new Date().toISOString() })
    await saveSession(session({ date: todayLocal() }))
    await saveSession(session({ date: daysAgo(1) }))
    await saveSession(session({ date: daysAgo(2), completed: false }))
    render(<Home />)
    expect(await screen.findByText('2 gün seri')).toBeTruthy()
  })

  it('shows "Bugün başlayalım" with no streak and picks the greeting by hour', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 13, 20, 0, 0))
    await saveSettings({ onboarded: true, placementDone: true })
    render(<Home />)
    expect(await screen.findByText('Bugün başlayalım')).toBeTruthy()
    expect(screen.getByText('İyi akşamlar')).toBeTruthy()
  })

  it('shows progress for an open day session', async () => {
    await saveSettings({ onboarded: true, placementDone: true })
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
    await saveSettings({ onboarded: true, placementDone: true, lastBackupAt: new Date().toISOString() })
    await saveSession(session({}))
    render(<Home />)
    expect(await screen.findByText('Bugünkü tur tamam ✓')).toBeTruthy()
  })

  it('shows the backup band when never backed up and a session was completed, then hides it', async () => {
    await saveSettings({ onboarded: true, placementDone: true, lastBackupAt: null })
    await saveSession(session({}))
    vi.mocked(shareOrDownloadBackup).mockImplementationOnce(async () => {
      await saveSettings({ lastBackupAt: new Date().toISOString() })
    })
    render(<Home />)
    expect(await screen.findByText(/Yedeğinizi alın, telefon verileri silinirse ilerlemeniz kaybolmasın/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Yedekle' }))
    await waitFor(() => expect(screen.queryByText(/Yedeğinizi alın/)).toBeNull())
    expect(shareOrDownloadBackup).toHaveBeenCalledTimes(1)
  })

  it('keeps the backup band when the share sheet is dismissed without saving a backup', async () => {
    await saveSettings({ onboarded: true, placementDone: true, lastBackupAt: null })
    await saveSession(session({}))
    render(<Home />)
    fireEvent.click(await screen.findByRole('button', { name: 'Yedekle' }))
    await waitFor(() => expect(shareOrDownloadBackup).toHaveBeenCalledTimes(1))
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.getByText(/Yedeğinizi alın/)).toBeTruthy()
  })

  it('keeps the backup band when the backup fails', async () => {
    vi.mocked(shareOrDownloadBackup).mockRejectedValueOnce(new Error('x'))
    await saveSettings({ onboarded: true, placementDone: true })
    await saveSession(session({}))
    render(<Home />)
    fireEvent.click(await screen.findByRole('button', { name: 'Yedekle' }))
    await waitFor(() => expect(shareOrDownloadBackup).toHaveBeenCalled())
    expect(screen.getByText(/Yedeğinizi alın/)).toBeTruthy()
  })

  it('shows no backup band without a completed session', async () => {
    await saveSettings({ onboarded: true, placementDone: true, lastBackupAt: null })
    render(<Home />)
    await screen.findByText('☀️ Masa başı · 10 dk')
    expect(screen.queryByText(/Yedeğinizi alın/)).toBeNull()
  })

  it('redirects to /baslangic when not onboarded and renders nothing', async () => {
    render(<Home />)
    await waitFor(() => expect(location.hash).toBe('#/baslangic'))
    expect(screen.queryByText('☀️ Masa başı · 10 dk')).toBeNull()
  })

  it('redirect does not add a history entry (no back-button trap)', async () => {
    const before = history.length
    render(<Home />)
    await waitFor(() => expect(location.hash).toBe('#/baslangic'))
    expect(history.length).toBe(before)
  })

  it('redirects onboarded users without a placement to /yoklama (no history entry, no loop)', async () => {
    await saveSettings({ onboarded: true })
    const before = history.length
    render(<Home />)
    await waitFor(() => expect(location.hash).toBe('#/yoklama'))
    expect(history.length).toBe(before)
    expect(screen.queryByText('☀️ Masa başı · 10 dk')).toBeNull()
  })

  it('does not redirect once the placement is done', async () => {
    await saveSettings({ onboarded: true, placementDone: true })
    render(<Home />)
    await screen.findByText('☀️ Masa başı · 10 dk')
    expect(location.hash).toBe('')
  })

  it('links to the settings screen', async () => {
    await saveSettings({ onboarded: true, placementDone: true })
    render(<Home />)
    const link = (await screen.findByText('⚙️ Ayarlar')).closest('a')
    expect(link?.getAttribute('href')).toBe('#/ayarlar')
  })
})
