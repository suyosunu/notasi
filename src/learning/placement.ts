import { NOTA_TOPICS } from '../content/nota-topics'
import { shuffle } from '../util/rng'
import { makeQuestion } from './questions'
import type { Question } from './questions'

/** Konu kimliği → sorulacak soru sayısı. */
const PLACEMENT_PLAN: ReadonlyArray<readonly [string, number]> = [
  ['nota-1', 5],
  ['sure-1', 3],
]

/** 8 soru: `nota-1` kartlarından 5, `sure-1` kartlarından 3; sıra karışık. */
export function buildPlacement(rng: () => number): Question[] {
  const cards: string[] = []
  for (const [topicId, count] of PLACEMENT_PLAN) {
    const topic = NOTA_TOPICS.find((t) => t.id === topicId)
    if (!topic) throw new Error(`Yoklama konusu bulunamadı: ${topicId}`)
    for (let i = 0; i < count; i++) cards.push(topic.cards[i % topic.cards.length]!)
  }
  return shuffle(cards, rng).map((id) => makeQuestion(id, rng))
}

/** Tüm soruları doğru cevaplanan konuların kimlikleri (konu sırasıyla). */
export function placementResult(answers: { topicId: string; correct: boolean }[]): string[] {
  const asked = new Set(answers.map((a) => a.topicId))
  const missed = new Set(answers.filter((a) => !a.correct).map((a) => a.topicId))
  return NOTA_TOPICS.filter((t) => asked.has(t.id) && !missed.has(t.id)).map((t) => t.id)
}
