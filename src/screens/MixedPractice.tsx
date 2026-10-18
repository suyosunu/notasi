import { useEffect, useState } from 'preact/hooks'
import { NOTA_TOPICS } from '../content/nota-topics'
import { isDue } from '../learning/leitner'
import { topicStatuses } from '../learning/mastery'
import { buildMixedQuestions, MIXED_COUNT, mixedPool } from '../learning/mixed'
import type { Question } from '../learning/questions'
import { listAttempts, listCards, listTopics } from '../store/db'
import { todayLocal } from '../util/date'
import { seededRng } from '../util/rng'
import { FreeRound, Message } from './DayPractice'

const BACK = { href: '#/nota', label: 'Notalara dön' }
const TITLE = '🔀 Karışık antrenman'

async function loadQuestions(): Promise<Question[]> {
  const [attempts, topics, cards] = await Promise.all([listAttempts(), listTopics(), listCards()])
  const placedOut = new Set(topics.filter((t) => t.placedOut).map((t) => t.id))
  const pool = mixedPool(NOTA_TOPICS, topicStatuses(NOTA_TOPICS, attempts, placedOut))
  const inPool = new Set(pool)
  const today = todayLocal()
  const dueCards = cards
    .filter((c) => inPool.has(c.id) && isDue(c, today))
    .sort((a, b) => a.lastReviewedAt.localeCompare(b.lastReviewedAt))
    .map((c) => c.id)
  return buildMixedQuestions({ pool, attempts, dueCards, count: MIXED_COUNT, rng: seededRng(Date.now()) })
}

/** Öğrenilmiş tüm konulardan, yanlış yapılan kartlara ağırlık veren 12 soruluk tur. */
export function MixedPractice() {
  const [questions, setQuestions] = useState<Question[] | null>(null)

  useEffect(() => {
    let alive = true
    void loadQuestions().then((qs) => {
      if (alive) setQuestions(qs)
    })
    return () => {
      alive = false
    }
  }, [])

  if (!questions) return <Message back={BACK}>Yükleniyor…</Message>
  return <FreeRound questions={questions} title={TITLE} emptyMessage="Henüz öğrenilmiş konu yok." back={BACK} />
}
