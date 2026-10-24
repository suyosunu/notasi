import { beforeEach, describe, expect, it } from 'vitest'
import {
  addAttempt,
  getCard,
  getOpenSession,
  listAttempts,
  listSessions,
  putCard,
  resetDbForTests,
  saveSettings,
  setPlacedOut,
} from '../store/db'
import { NOTA_TOPICS } from '../content/nota-topics'
import { DAY_CAP_MS, answerQuestion, currentNotaTopicId, finishSession, loadOrStartDaySession, tick } from './day-session'
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

describe('Leitner tekrarı', () => {
  const LONG_AGO = new Date(2026, 8, 1, 12, 0, 0).toISOString()

  async function masterNota1() {
    for (let i = 0; i < 10; i++) await addAttempt({ topicId: 'nota-1', cardId: 'note:D5', correct: true })
  }

  it('answerQuestion kartı günceller: doğru → kutu 2, yanlış → kutu 1', async () => {
    const s = await loadOrStartDaySession(TODAY)
    const q = (s.state as DayState).questions[0]!
    const { session } = await answerQuestion(s, q.answer)
    expect((await getCard(q.cardId))?.box).toBe(2)
    const q2 = (session.state as DayState).questions[1]!
    const wrong = q2.options.find((o) => o !== q2.answer)!
    await putCard({ id: q2.cardId, box: 4, lastReviewedAt: LONG_AGO })
    await answerQuestion(session, wrong)
    expect((await getCard(q2.cardId))?.box).toBe(1)
  })

  it('vadesi gelen kartlar oturuma girer; kilitli konunun kartı girmez', async () => {
    await masterNota1()
    await putCard({ id: 'note:D5', box: 1, lastReviewedAt: LONG_AGO })
    await putCard({ id: 'note:A4', box: 1, lastReviewedAt: LONG_AGO }) // nota-2: kilitli
    await putCard({ id: 'dur:half', box: 1, lastReviewedAt: LONG_AGO }) // güncel konu (sure-1)
    const s = await loadOrStartDaySession(TODAY)
    const qs = (s.state as DayState).questions
    expect(qs).toHaveLength(12)
    expect(qs.some((q) => q.cardId === 'note:D5')).toBe(true)
    expect(qs.some((q) => q.topicId === 'nota-2')).toBe(false)
    // 2 due + öğrenilmiş konu payı (4 − 2 = 2) + 8 güncel konu (dur:half döngüde 3 kez) → dur:half 4 kez
    expect(qs.filter((q) => q.cardId === 'dur:half')).toHaveLength(4)
    expect(qs.filter((q) => q.topicId === 'nota-1')).toHaveLength(3)
  })

  it('vadesi gelmemiş kart oturuma girmez', async () => {
    await masterNota1()
    await putCard({ id: 'dur:whole', box: 5, lastReviewedAt: new Date(2026, 9, 12, 12).toISOString() })
    const s = await loadOrStartDaySession(TODAY)
    const qs = (s.state as DayState).questions
    // due kart yok: öğrenilmiş konu payı 4, güncel konu 8 (dur:whole yalnızca döngüde, en çok 3 kez)
    expect(qs.filter((q) => q.topicId === 'nota-1')).toHaveLength(4)
    expect(qs.filter((q) => q.topicId === 'sure-1')).toHaveLength(8)
    const whole = qs.filter((q) => q.cardId === 'dur:whole').length
    expect(whole).toBeGreaterThanOrEqual(2)
    expect(whole).toBeLessThanOrEqual(3)
  })

  it('en çok gecikmiş kartlar önce alınır', async () => {
    await masterNota1()
    const ids = ['note:D5', 'note:C5', 'note:B4']
    await saveSettings({ dailyQuestionCount: 4 }) // floor(4/2) = 2 due kart
    await putCard({ id: ids[0]!, box: 1, lastReviewedAt: new Date(2026, 9, 1).toISOString() })
    await putCard({ id: ids[1]!, box: 1, lastReviewedAt: new Date(2026, 8, 1).toISOString() })
    await putCard({ id: ids[2]!, box: 1, lastReviewedAt: new Date(2026, 9, 5).toISOString() })
    const s = await loadOrStartDaySession(TODAY)
    const picked = (s.state as DayState).questions.filter((q) => ids.includes(q.cardId)).map((q) => q.cardId)
    expect(picked.sort()).toEqual(['note:C5', 'note:D5'])
  })

  it('güncel konu zorlanıyorsa önceki konudan 3 soru ve not', async () => {
    await masterNota1()
    for (let i = 0; i < 8; i++) await addAttempt({ topicId: 'sure-1', cardId: 'dur:whole', correct: i < 3 })
    const s = await loadOrStartDaySession(TODAY)
    const st = s.state as DayState
    expect(st.reviewNote).toBe(true)
    // 3 geri dönüş + 4 öğrenilmiş konu payı (nota-1 tek öğrenilmiş konu) = 7; kalan 5 güncel konudan
    expect(st.questions.filter((q) => q.topicId === 'nota-1')).toHaveLength(7)
    expect(st.questions.filter((q) => q.topicId === 'sure-1')).toHaveLength(5)
    // devam eden oturum notu korur
    const again = await loadOrStartDaySession(new Date(2026, 9, 13, 18, 0, 0))
    expect((again.state as DayState).reviewNote).toBe(true)
  })

  it('zorlanma yoksa not yok ve geri dönüş sorusu yok', async () => {
    await masterNota1()
    for (let i = 0; i < 8; i++) await addAttempt({ topicId: 'sure-1', cardId: 'dur:whole', correct: i < 6 })
    const st = (await loadOrStartDaySession(TODAY)).state as DayState
    expect(st.reviewNote).toBe(false)
    // geri dönüş sorusu yok: yalnızca öğrenilmiş konu payı (4) ve güncel konu (8)
    expect(st.questions.filter((q) => q.topicId === 'nota-1')).toHaveLength(4)
    expect(st.questions.filter((q) => q.topicId === 'sure-1')).toHaveLength(8)
  })

  it('ilk konuda zorlanma: önceki konu yok, not yok', async () => {
    for (let i = 0; i < 8; i++) await addAttempt({ topicId: 'nota-1', cardId: 'note:D5', correct: i < 2 })
    const st = (await loadOrStartDaySession(TODAY)).state as DayState
    expect(st.reviewNote).toBe(false)
    expect(st.questions.every((q) => q.topicId === 'nota-1')).toBe(true)
  })
})

describe('currentNotaTopicId', () => {
  it('currentNotaTopicId ilk açık konuyu döner; hepsi öğrenildiyse null', async () => {
    expect(await currentNotaTopicId()).toBe('nota-1')
    await setPlacedOut('nota-1')
    expect(await currentNotaTopicId()).toBe('sure-1')
    for (let i = 0; i < 10; i++) await addAttempt({ topicId: 'sure-1', cardId: 'dur:whole', correct: true })
    expect(await currentNotaTopicId()).toBe('nota-2')
    for (const t of NOTA_TOPICS) await setPlacedOut(t.id)
    expect(await currentNotaTopicId()).toBeNull()
  })
})
