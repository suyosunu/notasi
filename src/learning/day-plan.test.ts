import { describe, expect, it } from 'vitest'
import { NOTA_TOPICS } from '../content/nota-topics'
import { seededRng } from '../util/rng'
import { buildDayQuestions } from './day-plan'
import type { TopicStatus } from './mastery'

function statuses(learned: string[], open: string | null): Record<string, TopicStatus> {
  const s: Record<string, TopicStatus> = {}
  for (const t of NOTA_TOPICS) s[t.id] = learned.includes(t.id) ? 'ogrenildi' : t.id === open ? 'acik' : 'kilitli'
  return s
}

describe('buildDayQuestions', () => {
  it('öğrenilmiş konu varken count 12: 8 soru güncel konudan', () => {
    const qs = buildDayQuestions({
      topics: NOTA_TOPICS,
      statuses: statuses(['nota-1'], 'sure-1'),
      count: 12,
      rng: seededRng(1),
    })
    expect(qs).toHaveLength(12)
    expect(qs.filter((q) => q.topicId === 'sure-1')).toHaveLength(8)
    expect(qs.filter((q) => q.topicId === 'nota-1')).toHaveLength(4)
  })
  it('öğrenilmiş konu yokken 12 sorunun hepsi güncel konudan', () => {
    const qs = buildDayQuestions({ topics: NOTA_TOPICS, statuses: statuses([], 'nota-1'), count: 12, rng: seededRng(2) })
    expect(qs).toHaveLength(12)
    expect(qs.every((q) => q.topicId === 'nota-1')).toBe(true)
  })
  it('güncel konu kartları sırayla döner', () => {
    const qs = buildDayQuestions({ topics: NOTA_TOPICS, statuses: statuses([], 'nota-1'), count: 7, rng: seededRng(3) })
    const counts = new Map<string, number>()
    for (const q of qs) counts.set(q.cardId, (counts.get(q.cardId) ?? 0) + 1)
    // 3 kart, 7 soru: kart 0 üç kez, diğerleri ikişer kez
    expect(counts.get('note:D5')).toBe(3)
    expect(counts.get('note:C5')).toBe(2)
    expect(counts.get('note:B4')).toBe(2)
  })
  it('güncel konu yoksa tümü öğrenilmiş konulardan', () => {
    const all = NOTA_TOPICS.map((t) => t.id)
    const qs = buildDayQuestions({ topics: NOTA_TOPICS, statuses: statuses(all, null), count: 10, rng: seededRng(4) })
    expect(qs).toHaveLength(10)
  })
  it('öğrenilmiş konu ve güncel konu yoksa boş liste', () => {
    expect(
      buildDayQuestions({ topics: NOTA_TOPICS, statuses: statuses([], null), count: 10, rng: seededRng(5) }),
    ).toEqual([])
  })
  it('tekrar soruları yalnızca öğrenilmiş konulardan gelir', () => {
    const qs = buildDayQuestions({
      topics: NOTA_TOPICS,
      statuses: statuses(['nota-1', 'sure-1'], 'nota-2'),
      count: 20,
      rng: seededRng(6),
    })
    const allowed = new Set(['nota-1', 'sure-1', 'nota-2'])
    expect(qs.every((q) => allowed.has(q.topicId))).toBe(true)
    expect(qs.filter((q) => q.topicId === 'nota-2')).toHaveLength(14)
  })
  it('aynı seed aynı sonuç; sonuç karıştırılmıştır', () => {
    const input = () => ({ topics: NOTA_TOPICS, statuses: statuses(['nota-1'], 'sure-1'), count: 12, rng: seededRng(7) })
    const a = buildDayQuestions(input())
    expect(buildDayQuestions(input())).toEqual(a)
    // karıştırılmamış olsaydı önce 8 güncel, sonra 4 tekrar sorusu gelirdi
    const firstEight = a.slice(0, 8).map((q) => q.topicId)
    expect(firstEight.every((t) => t === 'sure-1')).toBe(false)
  })
  it('count 0 boş liste', () => {
    expect(
      buildDayQuestions({ topics: NOTA_TOPICS, statuses: statuses(['nota-1'], 'sure-1'), count: 0, rng: seededRng(8) }),
    ).toEqual([])
  })
})
