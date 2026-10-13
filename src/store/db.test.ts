import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  addAttempt,
  addFingeringFlag,
  addLongTone,
  getCard,
  getOpenSession,
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
import type { SessionRec } from './db'

beforeEach(async () => {
  await resetDbForTests()
})

function session(over: Partial<SessionRec> = {}): SessionRec {
  return {
    id: crypto.randomUUID(),
    kind: 'gunduz',
    date: '2026-10-13',
    startedAt: '2026-10-13T08:00:00.000Z',
    completed: false,
    elapsedMs: 0,
    state: null,
    ...over,
  }
}

describe('settings', () => {
  it('returns defaults on first call', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
    expect(DEFAULT_SETTINGS.dailyQuestionCount).toBe(12)
    expect(DEFAULT_SETTINGS.soundOn).toBe(true)
    expect(DEFAULT_SETTINGS.lastBackupAt).toBeNull()
  })

  it('persists a patch and returns the merged settings', async () => {
    const saved = await saveSettings({ soundOn: false })
    expect(saved.soundOn).toBe(false)
    const again = await getSettings()
    expect(again.soundOn).toBe(false)
    expect(again.dailyQuestionCount).toBe(12)
  })

  it('accumulates successive patches', async () => {
    await saveSettings({ onboarded: true })
    await saveSettings({ calibrated: true })
    const s = await getSettings()
    expect(s.onboarded).toBe(true)
    expect(s.calibrated).toBe(true)
  })
})

describe('attempts', () => {
  it('fills id and at', async () => {
    const a = await addAttempt({ topicId: 'nota-1', cardId: 'c1', correct: true })
    expect(a.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(Number.isNaN(Date.parse(a.at))).toBe(false)
  })

  it('lists only the topic, ordered by at ascending', async () => {
    const a = await addAttempt({ topicId: 'nota-1', cardId: 'c1', correct: true })
    await addAttempt({ topicId: 'nota-2', cardId: 'c2', correct: false })
    await new Promise((r) => setTimeout(r, 5))
    const b = await addAttempt({ topicId: 'nota-1', cardId: 'c3', correct: false })
    const list = await listAttempts('nota-1')
    expect(list.map((x) => x.id)).toEqual([a.id, b.id])
    expect((await listAttempts()).length).toBe(3)
  })
})

describe('cards', () => {
  it('puts, gets and lists', async () => {
    expect(await getCard('x')).toBeUndefined()
    await putCard({ id: 'x', box: 2, lastReviewedAt: '2026-10-13T08:00:00.000Z' })
    await putCard({ id: 'x', box: 3, lastReviewedAt: '2026-10-13T09:00:00.000Z' })
    expect((await getCard('x'))?.box).toBe(3)
    expect(await listCards()).toHaveLength(1)
  })
})

describe('sessions', () => {
  it('getOpenSession does not return closed sessions', async () => {
    await saveSession(session({ endedAt: '2026-10-13T08:10:00.000Z', completed: true }))
    expect(await getOpenSession('gunduz')).toBeUndefined()
  })

  it('returns the latest open session of the requested kind', async () => {
    await saveSession(session({ id: 'old', startedAt: '2026-10-12T08:00:00.000Z' }))
    await saveSession(session({ id: 'new', startedAt: '2026-10-13T08:00:00.000Z' }))
    await saveSession(session({ id: 'eve', kind: 'aksam', startedAt: '2026-10-13T20:00:00.000Z' }))
    expect((await getOpenSession('gunduz'))?.id).toBe('new')
    expect((await getOpenSession('aksam'))?.id).toBe('eve')
    expect(await listSessions()).toHaveLength(3)
  })

  it('overwrites a session with the same id', async () => {
    const s = session({ id: 's1' })
    await saveSession(s)
    await saveSession({ ...s, elapsedMs: 5000 })
    const all = await listSessions()
    expect(all).toHaveLength(1)
    expect(all[0]?.elapsedMs).toBe(5000)
  })
})

describe('long tones, flags, topics', () => {
  it('adds and lists long tones, filtered by perde', async () => {
    const r = await addLongTone({ perdeId: 'rast', durationMs: 4000, passed: true, toleranceCents: 25 })
    await addLongTone({ perdeId: 'neva', durationMs: 3000, passed: false, toleranceCents: 25 })
    expect(r.id).toBeTruthy()
    expect(r.at).toBeTruthy()
    expect(await listLongTones('rast')).toHaveLength(1)
    expect(await listLongTones()).toHaveLength(2)
  })

  it('adds a fingering flag', async () => {
    const f = await addFingeringFlag({ perdeId: 'rast', medianCents: 60 })
    expect(f.id).toBeTruthy()
    expect(f.at).toBeTruthy()
  })

  it('setPlacedOut creates and updates topic records', async () => {
    expect(await listTopics()).toEqual([])
    await setPlacedOut('nota-1')
    await setPlacedOut('nota-1')
    const topics = await listTopics()
    expect(topics).toHaveLength(1)
    expect(topics[0]?.placedOut).toBe(true)
    expect(topics[0]?.id).toBe('nota-1')
  })
})

describe('resetDbForTests', () => {
  it('wipes all data', async () => {
    await addAttempt({ topicId: 'a', cardId: 'b', correct: true })
    await resetDbForTests()
    expect(await listAttempts()).toEqual([])
  })
})
