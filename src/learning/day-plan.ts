import type { Topic } from '../content/nota-topics'
import { shuffle } from '../util/rng'
import { currentTopic } from './mastery'
import type { TopicStatus } from './mastery'
import { makeQuestion } from './questions'
import type { Question } from './questions'

export interface DayPlanInput {
  topics: Topic[]
  statuses: Record<string, TopicStatus>
  count: number
  rng: () => number
  /** Task 16'da doldurulur; şimdilik yok sayılır. */
  dueCards?: string[]
  /** Task 16'da doldurulur; şimdilik yok sayılır. */
  reviewTopic?: Topic | null
}

const CURRENT_SHARE = 0.7

/**
 * Güncel konudan ~%70, kalanı öğrenilmiş konulardan rastgele; sonuç karıştırılır.
 * Öğrenilmiş konu yoksa hepsi güncel konudan, güncel konu yoksa hepsi öğrenilmişlerden gelir.
 */
export function buildDayQuestions(input: DayPlanInput): Question[] {
  const { topics, statuses, rng } = input
  const count = Math.max(0, Math.floor(input.count))
  const current = currentTopic(topics, statuses)
  const learnedCards = topics.filter((t) => statuses[t.id] === 'ogrenildi').flatMap((t) => t.cards)

  if (count === 0 || (!current && learnedCards.length === 0)) return []

  const currentCount = current ? (learnedCards.length > 0 ? Math.round(count * CURRENT_SHARE) : count) : 0
  const cardIds: string[] = []
  if (current) {
    for (let i = 0; i < currentCount; i++) cardIds.push(current.cards[i % current.cards.length])
  }
  for (let i = cardIds.length; i < count; i++) {
    cardIds.push(learnedCards[Math.floor(rng() * learnedCards.length)])
  }
  return shuffle(
    cardIds.map((id) => makeQuestion(id, rng)),
    rng,
  )
}
