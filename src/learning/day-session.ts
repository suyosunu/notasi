import { NOTA_TOPICS } from '../content/nota-topics'
import { addAttempt, getOpenSession, getSettings, listAttempts, listTopics, saveSession } from '../store/db'
import type { SessionRec } from '../store/db'
import { todayLocal } from '../util/date'
import { seededRng } from '../util/rng'
import { buildDayQuestions } from './day-plan'
import { topicStatuses } from './mastery'
import type { Question } from './questions'

/** Bir gündüz oturumunun en çok sürebileceği aktif süre. */
export const DAY_CAP_MS = 600_000

export interface DayState {
  questions: Question[]
  index: number
  answers: { cardId: string; correct: boolean }[]
}

export async function finishSession(s: SessionRec, completed: boolean): Promise<SessionRec> {
  const done: SessionRec = { ...s, completed, endedAt: new Date().toISOString() }
  await saveSession(done)
  return done
}

async function startDaySession(now: Date): Promise<SessionRec> {
  const [settings, attempts, topics] = await Promise.all([getSettings(), listAttempts(), listTopics()])
  const placedOut = new Set(topics.filter((t) => t.placedOut).map((t) => t.id))
  const statuses = topicStatuses(NOTA_TOPICS, attempts, placedOut)
  const questions = buildDayQuestions({
    topics: NOTA_TOPICS,
    statuses,
    count: settings.dailyQuestionCount,
    rng: seededRng(now.getTime()),
  })
  const state: DayState = { questions, index: 0, answers: [] }
  const session: SessionRec = {
    id: crypto.randomUUID(),
    kind: 'gunduz',
    date: todayLocal(now),
    startedAt: now.toISOString(),
    completed: false,
    elapsedMs: 0,
    state,
  }
  await saveSession(session)
  return session
}

/** Bugünün açık oturumunu döner; önceki günden kalanı tamamlanmamış diye kapatıp yenisini açar. */
export async function loadOrStartDaySession(now: Date): Promise<SessionRec> {
  const open = await getOpenSession('gunduz')
  if (open) {
    if (open.date === todayLocal(now)) return open
    await finishSession(open, false)
  }
  return startDaySession(now)
}

export async function answerQuestion(
  s: SessionRec,
  choice: string,
): Promise<{ session: SessionRec; correct: boolean }> {
  if (s.endedAt) throw new Error('Oturum zaten bitti')
  const state = s.state as DayState
  const q = state.questions[state.index]
  if (!q) throw new Error('Cevaplanacak soru kalmadı')
  const correct = choice === q.answer
  await addAttempt({ topicId: q.topicId, cardId: q.cardId, correct })
  const index = state.index + 1
  const next: SessionRec = {
    ...s,
    state: { ...state, index, answers: [...state.answers, { cardId: q.cardId, correct }] } satisfies DayState,
  }
  if (index >= state.questions.length) return { session: await finishSession(next, true), correct }
  await saveSession(next)
  return { session: next, correct }
}

/** Aktif süreyi artırır ve kaydeder; sınıra ulaşınca oturumu tamamlanmış sayarak kapatır. */
export async function tick(s: SessionRec, deltaMs: number): Promise<SessionRec> {
  if (s.endedAt) return s
  const next: SessionRec = { ...s, elapsedMs: s.elapsedMs + deltaMs }
  if (next.elapsedMs >= DAY_CAP_MS) return finishSession(next, true)
  await saveSession(next)
  return next
}
