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
  /** Vadesi gelen kartlar (en gecikmiş önce). Verilirse (boş olsa da) 1c kuralı uygulanır. */
  dueCards?: string[]
  /** Güncel konuda zorlanılıyorsa bir önceki konu; ondan tam 3 soru eklenir. */
  reviewTopic?: Topic | null
}

const CURRENT_SHARE = 0.7
export const REVIEW_TOPIC_QUESTIONS = 3

function cycle(topic: Topic, n: number): string[] {
  return Array.from({ length: n }, (_, i) => topic.cards[i % topic.cards.length]!)
}

/**
 * 1c: dueCards verildiyse (1) en çok floor(count/2) vadesi gelen kart, (2) varsa reviewTopic'ten 3 soru,
 * (3) kalanı güncel konudan (güncel konu yoksa öğrenilmişlerden); sonuç karıştırılır.
 * dueCards yoksa 1a kuralı:
 * Güncel konudan ~%70, kalanı öğrenilmiş konulardan rastgele; sonuç karıştırılır.
 * Öğrenilmiş konu yoksa hepsi güncel konudan, güncel konu yoksa hepsi öğrenilmişlerden gelir.
 */
export function buildDayQuestions(input: DayPlanInput): Question[] {
  const { topics, statuses, rng } = input
  const count = Math.max(0, Math.floor(input.count))
  const current = currentTopic(topics, statuses)
  const learnedCards = topics.filter((t) => statuses[t.id] === 'ogrenildi').flatMap((t) => t.cards)

  if (count === 0 || (!current && learnedCards.length === 0)) return []

  if (input.dueCards) {
    const cardIds = input.dueCards.slice(0, Math.floor(count / 2))
    const review = input.reviewTopic
    if (review && review.cards.length > 0) {
      cardIds.push(...cycle(review, Math.min(REVIEW_TOPIC_QUESTIONS, count - cardIds.length)))
    }
    const rest = count - cardIds.length
    if (current) cardIds.push(...cycle(current, rest))
    else for (let i = 0; i < rest; i++) cardIds.push(learnedCards[Math.floor(rng() * learnedCards.length)]!)
    return shuffle(
      cardIds.map((id) => makeQuestion(id, rng)),
      rng,
    )
  }

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
