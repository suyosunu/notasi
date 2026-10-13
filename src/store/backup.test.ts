import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BackupError, exportBackup, importBackup, needsBackupReminder, shareOrDownloadBackup } from './backup'
import {
  addAttempt,
  addFingeringFlag,
  addLongTone,
  getSettings,
  listAttempts,
  listCards,
  listLongTones,
  listSessions,
  listTopics,
  putCard,
  resetDbForTests,
  saveSession,
  saveSettings,
  setPlacedOut,
} from './db'

beforeEach(async () => {
  await resetDbForTests()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function seed() {
  await addAttempt({ topicId: 'nota-1', cardId: 'c1', correct: true })
  await putCard({ id: 'c1', box: 2, lastReviewedAt: '2026-10-13T08:00:00.000Z' })
  await saveSession({
    id: 's1',
    kind: 'gunduz',
    date: '2026-10-13',
    startedAt: '2026-10-13T08:00:00.000Z',
    completed: false,
    elapsedMs: 1200,
    state: { i: 3 },
  })
  await addLongTone({ perdeId: 'rast', durationMs: 4000, passed: true, toleranceCents: 25 })
  await addFingeringFlag({ perdeId: 'rast', medianCents: 60 })
  await setPlacedOut('nota-1')
  await saveSettings({ soundOn: false, onboarded: true })
}

describe('backup round trip', () => {
  it('restores identical records after reset', async () => {
    await seed()
    const before = {
      attempts: await listAttempts(),
      cards: await listCards(),
      sessions: await listSessions(),
      longTones: await listLongTones(),
      topics: await listTopics(),
      settings: await getSettings(),
    }
    const file = await exportBackup()
    expect(file.app).toBe('notasi')
    expect(file.version).toBe(1)
    expect(Number.isNaN(Date.parse(file.exportedAt))).toBe(false)
    expect(Object.keys(file.data).sort()).toEqual([
      'attempts',
      'cards',
      'fingeringFlags',
      'longTones',
      'sessions',
      'settings',
      'topics',
    ])
    expect(file.data.fingeringFlags).toHaveLength(1)

    await resetDbForTests()
    expect(await listAttempts()).toEqual([])

    // through JSON, like a real file
    await importBackup(JSON.parse(JSON.stringify(file)))
    expect(await listAttempts()).toEqual(before.attempts)
    expect(await listCards()).toEqual(before.cards)
    expect(await listSessions()).toEqual(before.sessions)
    expect(await listLongTones()).toEqual(before.longTones)
    expect(await listTopics()).toEqual(before.topics)
    expect(await getSettings()).toEqual(before.settings)
    expect((await exportBackup()).data.fingeringFlags).toEqual(file.data.fingeringFlags)
  })

  it('replaces existing data on import', async () => {
    await seed()
    const file = await exportBackup()
    await addAttempt({ topicId: 'extra', cardId: 'x', correct: false })
    await importBackup(file)
    expect(await listAttempts()).toHaveLength(1)
  })
})

describe('importBackup validation (Review Focus 4)', () => {
  async function expectRejectedAndIntact(bad: unknown) {
    const a = await addAttempt({ topicId: 'nota-1', cardId: 'c1', correct: true })
    await expect(importBackup(bad)).rejects.toBeInstanceOf(BackupError)
    const after = await listAttempts()
    expect(after.map((x) => x.id)).toEqual([a.id])
  }

  const goodData = (): Record<string, unknown> => ({
    attempts: [],
    cards: [],
    sessions: [],
    longTones: [],
    fingeringFlags: [],
    topics: [],
    settings: [],
  })

  it('rejects another app', async () => {
    await expectRejectedAndIntact({ app: 'baska', version: 1, data: {} })
  })

  it('rejects another version', async () => {
    await expectRejectedAndIntact({ app: 'notasi', version: 2, data: goodData() })
  })

  it('rejects a missing store', async () => {
    const data = goodData()
    delete data.cards
    await expectRejectedAndIntact({ app: 'notasi', version: 1, data })
  })

  it('rejects a non-array store', async () => {
    await expectRejectedAndIntact({ app: 'notasi', version: 1, data: { ...goodData(), cards: 'x' } })
  })

  it.each([[null], ['metin'], [{ app: 'notasi', version: 1 }]])('rejects malformed input %j', async (bad) => {
    await expectRejectedAndIntact(bad)
  })

  it('leaves data intact when a record cannot be written', async () => {
    // a record without the keyPath `id` makes the put fail mid-transaction
    await expectRejectedAndIntact({
      app: 'notasi',
      version: 1,
      data: { ...goodData(), attempts: [{ nope: 1 }] },
    })
  })
})

describe('needsBackupReminder', () => {
  const now = new Date('2026-10-13T12:00:00.000Z')
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString()

  it('is false with no backup and no completed session', () => {
    expect(needsBackupReminder(null, false, now)).toBe(false)
  })
  it('is true with no backup and a completed session', () => {
    expect(needsBackupReminder(null, true, now)).toBe(true)
  })
  it('is true when last backup is 8 days old', () => {
    expect(needsBackupReminder(daysAgo(8), true, now)).toBe(true)
  })
  it('is false when last backup is 3 days old', () => {
    expect(needsBackupReminder(daysAgo(3), true, now)).toBe(false)
  })
})

describe('shareOrDownloadBackup', () => {
  it('downloads via anchor when share is unavailable and records lastBackupAt', async () => {
    vi.stubGlobal('navigator', { ...navigator, canShare: undefined, share: undefined })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const createUrl = vi.fn(() => 'blob:fake')
    URL.createObjectURL = createUrl
    URL.revokeObjectURL = vi.fn()

    await seed()
    expect((await getSettings()).lastBackupAt).toBeNull()
    await shareOrDownloadBackup()

    expect(click).toHaveBeenCalledTimes(1)
    const anchor = click.mock.contexts[0] as HTMLAnchorElement
    expect(anchor.download).toMatch(/^notasi-yedek-\d{4}-\d{2}-\d{2}\.json$/)
    expect(createUrl).toHaveBeenCalledTimes(1)
    expect((await getSettings()).lastBackupAt).not.toBeNull()
  })

  it('uses navigator.share when files can be shared', async () => {
    const share = vi.fn(async () => {})
    vi.stubGlobal('navigator', { ...navigator, canShare: () => true, share })
    await shareOrDownloadBackup()
    expect(share).toHaveBeenCalledTimes(1)
    expect((await getSettings()).lastBackupAt).not.toBeNull()
  })

  it('does not record lastBackupAt when the user cancels the share', async () => {
    const abort = Object.assign(new Error('cancel'), { name: 'AbortError' })
    vi.stubGlobal('navigator', {
      ...navigator,
      canShare: () => true,
      share: vi.fn(async () => {
        throw abort
      }),
    })
    await shareOrDownloadBackup()
    expect((await getSettings()).lastBackupAt).toBeNull()
  })
})
