import { NOTA_TOPICS } from '../content/nota-topics'
import {
  addAttempt,
  getCard,
  getOpenSession,
  getSettings,
  listAttempts,
  listCards,
  listTopics,
  putCard,
  saveSession,
} from '../store/db'
import type { SessionRec } from '../store/db'
import { todayLocal } from '../util/date'
import { seededRng } from '../util/rng'
import { buildDayQuestions } from './day-plan'
import { isDue, review } from './leitner'
import { currentTopic, needsReview, topicStatuses } from './mastery'
import type { Question } from './questions'

/** Bir gündüz oturumunun en çok sürebileceği aktif süre. */
export const DAY_CAP_MS = 600_000

export interface DayState {
  questions: Question[]
  index: number
  answers: { cardId: string; correct: boolean }[]
  /** Önceki konuya dönüş yapıldıysa ekranın başında yumuşak bir not gösterilir. */
  reviewNote: boolean
}

export async function finishSession(s: SessionRec, completed: boolean): Promise<SessionRec> {
  const done: SessionRec = { ...s, completed, endedAt: new Date().toISOString() }
  await saveSession(done)
  return done
}

async function startDaySession(now: Date): Promise<SessionRec> {
  const [settings, attempts, topics, cards] = await Promise.all([
    getSettings(),
    listAttempts(),
    listTopics(),
    listCards(),
  ])
  const placedOut = new Set(topics.filter((t) => t.placedOut).map((t) => t.id))
  const statuses = topicStatuses(NOTA_TOPICS, attempts, placedOut)
  const today = todayLocal(now)

  // Vadesi gelen, kilitli olmayan konuların kartları; en gecikmiş önce.
  const dueCards = cards
    .filter((c) => {
      const topic = NOTA_TOPICS.find((t) => t.cards.includes(c.id))
      return topic !== undefined && statuses[topic.id] !== 'kilitli' && isDue(c, today)
    })
    .sort((a, b) => a.lastReviewedAt.localeCompare(b.lastReviewedAt))
    .map((c) => c.id)

  // Güncel konuda zorlanılıyorsa bir önceki konuya yumuşak dönüş.
  const current = currentTopic(NOTA_TOPICS, statuses)
  const currentIndex = current ? NOTA_TOPICS.indexOf(current) : -1
  const reviewTopic =
    current && currentIndex > 0 && needsReview(attempts.filter((a) => a.topicId === current.id))
      ? NOTA_TOPICS[currentIndex - 1]!
      : null

  const questions = buildDayQuestions({
    topics: NOTA_TOPICS,
    statuses,
    count: settings.dailyQuestionCount,
    rng: seededRng(now.getTime()),
    dueCards,
    reviewTopic,
  })
  const state: DayState = { questions, index: 0, answers: [], reviewNote: reviewTopic !== null }
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
  await putCard(review(await getCard(q.cardId), q.cardId, correct, new Date()))
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
