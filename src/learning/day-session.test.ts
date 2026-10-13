import { beforeEach, describe, expect, it } from 'vitest'
import { addAttempt, getOpenSession, listAttempts, listSessions, resetDbForTests, saveSettings, setPlacedOut } from '../store/db'
import { DAY_CAP_MS, answerQuestion, finishSession, loadOrStartDaySession, tick } from './day-session'
import type { DayState } from './day-session'

const TODAY = new Date(2026, 9, 13, 9, 0, 0)
const YESTERDAY = new Date(2026, 9, 12, 21, 0, 0)

beforeEach(async () => {
  await resetDbForTests()
})

describe('loadOrStartDaySession', () => {
  it('starts a 12-question session with elapsedMs 0 and returns the same one on a second call', async () => {
    const s = await loadOrStartDaySession(TODAY)
    const st = s.state as DayState
    expect(s.kind).toBe('gunduz')
    expect(s.date).toBe('2026-10-13')
    expect(s.elapsedMs).toBe(0)
    expect(s.completed).toBe(false)
    expect(s.endedAt).toBeUndefined()
    expect(st.questions).toHaveLength(12)
    expect(st.index).toBe(0)
    expect(st.answers).toEqual([])

    const again = await loadOrStartDaySession(new Date(2026, 9, 13, 18, 0, 0))
    expect(again.id).toBe(s.id)
    expect((again.state as DayState).questions).toEqual(st.questions)
    expect(await listSessions()).toHaveLength(1)
  })

  it('uses settings.dailyQuestionCount', async () => {
    await saveSettings({ dailyQuestionCount: 5 })
    const s = await loadOrStartDaySession(TODAY)
    expect((s.state as DayState).questions).toHaveLength(5)
  })

  it('closes an open session from a previous day as incomplete and starts a new one', async () => {
    const old = await loadOrStartDaySession(YESTERDAY)
    const fresh = await loadOrStartDaySession(TODAY)
    expect(fresh.id).not.toBe(old.id)
    expect(fresh.date).toBe('2026-10-13')
    expect(fresh.endedAt).toBeUndefined()

    const all = await listSessions()
    expect(all).toHaveLength(2)
    const closed = all.find((x) => x.id === old.id)!
    expect(closed.endedAt).toBeTruthy()
    expect(closed.completed).toBe(false)
    expect((await getOpenSession('gunduz'))?.id).toBe(fresh.id)
  })

  it('builds questions from the current topic given attempts and placed-out topics', async () => {
    for (let i = 0; i < 10; i++) await addAttempt({ topicId: 'nota-1', cardId: 'note:D5', correct: true })
    const s = await loadOrStartDaySession(TODAY)
    const topics = new Set((s.state as DayState).questions.map((q) => q.topicId))
    expect(topics.has('sure-1')).toBe(true)

    await resetDbForTests()
    await setPlacedOut('nota-1')
    const p = await loadOrStartDaySession(TODAY)
    expect((p.state as DayState).questions.some((q) => q.topicId === 'sure-1')).toBe(true)
  })
})

describe('answerQuestion', () => {
  it('writes an attempt, records the answer and advances the index (persisted)', async () => {
    const s = await loadOrStartDaySession(TODAY)
    const q = (s.state as DayState).questions[0]!
    const { session, correct } = await answerQuestion(s, q.answer)
    expect(correct).toBe(true)
    const st = session.state as DayState
    expect(st.index).toBe(1)
    expect(st.answers).toEqual([{ cardId: q.cardId, correct: true }])

    const attempts = await listAttempts()
    expect(attempts).toHaveLength(1)
    expect(attempts[0]).toMatchObject({ topicId: q.topicId, cardId: q.cardId, correct: true })
    expect(((await getOpenSession('gunduz'))?.state as DayState).index).toBe(1)
  })

  it('marks a wrong choice as incorrect', async () => {
    const s = await loadOrStartDaySession(TODAY)
    const q = (s.state as DayState).questions[0]!
    const wrong = q.options.find((o) => o !== q.answer)!
    const { session, correct } = await answerQuestion(s, wrong)
    expect(correct).toBe(false)
    expect((session.state as DayState).answers[0]?.correct).toBe(false)
    expect((await listAttempts())[0]?.correct).toBe(false)
  })

  it('completes the session after the last question and refuses further answers', async () => {
    await saveSettings({ dailyQuestionCount: 2 })
    let s = await loadOrStartDaySession(TODAY)
    for (const q of (s.state as DayState).questions) s = (await answerQuestion(s, q.answer)).session
    expect(s.completed).toBe(true)
    expect(s.endedAt).toBeTruthy()
    expect(await getOpenSession('gunduz')).toBeUndefined()
    await expect(answerQuestion(s, 'Do')).rejects.toThrow()
    expect(await listAttempts()).toHaveLength(2)
  })
})

describe('tick and finishSession', () => {
  it('adds elapsed time and persists it on every call', async () => {
    const s = await loadOrStartDaySession(TODAY)
    const t = await tick(s, 1000)
    expect(t.elapsedMs).toBe(1000)
    expect(t.endedAt).toBeUndefined()
    expect((await getOpenSession('gunduz'))?.elapsedMs).toBe(1000)
  })

  it('closes the session as completed when the cap is reached', async () => {
    expect(DAY_CAP_MS).toBe(600_000)
    const s = await loadOrStartDaySession(TODAY)
    const t = await tick(s, 600_000)
    expect(t.completed).toBe(true)
    expect(t.endedAt).toBeTruthy()
    expect(await getOpenSession('gunduz')).toBeUndefined()
  })

  it('does not touch an already finished session', async () => {
    const s = await loadOrStartDaySession(TODAY)
    const done = await finishSession(s, true)
    const t = await tick(done, 5000)
    expect(t.elapsedMs).toBe(0)
    expect(t.endedAt).toBe(done.endedAt)
  })

  it('finishSession(false) closes without completing', async () => {
    const s = await loadOrStartDaySession(TODAY)
    const f = await finishSession(s, false)
    expect(f.completed).toBe(false)
    expect(f.endedAt).toBeTruthy()
  })
})
