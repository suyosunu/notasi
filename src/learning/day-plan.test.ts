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

  describe('1c kuralı (dueCards verildiğinde)', () => {
    const nota1 = NOTA_TOPICS.find((t) => t.id === 'nota-1')!
    const due10 = ['note:A4', 'note:G4', 'note:E5', 'note:F5', 'note:G5', 'note:C4', 'note:D4', 'note:E4', 'note:F4', 'note:A5']
    const ids = (qs: { cardId: string }[]) => qs.map((q) => q.cardId)

    it('count 12 ve 10 due kart: due kartlardan en fazla 6 soru, sırayla', () => {
      const qs = buildDayQuestions({
        topics: NOTA_TOPICS,
        statuses: statuses([], 'nota-1'),
        count: 12,
        rng: seededRng(11),
        dueCards: due10,
      })
      expect(qs).toHaveLength(12)
      const dueQs = ids(qs).filter((id) => !nota1.cards.includes(id))
      expect(dueQs.sort()).toEqual(due10.slice(0, 6).sort())
      expect(qs.filter((q) => q.topicId === 'nota-1')).toHaveLength(6)
    })
    it('tek sayıda count: floor(count/2) due kart', () => {
      const qs = buildDayQuestions({
        topics: NOTA_TOPICS,
        statuses: statuses([], 'nota-1'),
        count: 11,
        rng: seededRng(12),
        dueCards: due10,
      })
      expect(qs).toHaveLength(11)
      expect(ids(qs).filter((id) => !nota1.cards.includes(id))).toHaveLength(5)
    })
    it('reviewTopic verilince ondan tam 3 soru gelir', () => {
      const qs = buildDayQuestions({
        topics: NOTA_TOPICS,
        statuses: statuses(['nota-1'], 'sure-1'),
        count: 12,
        rng: seededRng(13),
        dueCards: [],
        reviewTopic: nota1,
      })
      expect(qs).toHaveLength(12)
      // 3 review + round(12*0,3)=4 öğrenilmiş konu payı (yalnızca nota-1 öğrenilmiş) = 7; kalan 5 güncel konudan
      expect(qs.filter((q) => q.topicId === 'nota-1')).toHaveLength(7)
      expect(qs.filter((q) => q.topicId === 'sure-1')).toHaveLength(5)
    })
    it('due kartlar + review + güncel konu: 6 + 3 + 3', () => {
      const qs = buildDayQuestions({
        topics: NOTA_TOPICS,
        statuses: statuses(['nota-1'], 'sure-1'),
        count: 12,
        rng: seededRng(14),
        dueCards: due10,
        reviewTopic: nota1,
      })
      expect(qs).toHaveLength(12)
      expect(qs.filter((q) => q.topicId === 'nota-1')).toHaveLength(3)
      expect(qs.filter((q) => q.topicId === 'sure-1')).toHaveLength(3)
      expect(ids(qs).filter((id) => due10.includes(id))).toHaveLength(6)
    })
    it('boş dueCards, öğrenilmiş konu yok: hepsi güncel konudan', () => {
      const qs = buildDayQuestions({
        topics: NOTA_TOPICS,
        statuses: statuses([], 'nota-1'),
        count: 12,
        rng: seededRng(15),
        dueCards: [],
      })
      expect(qs).toHaveLength(12)
      expect(qs.every((q) => q.topicId === 'nota-1')).toBe(true)
    })
    it('boş dueCards, öğrenilmiş konu var: round(count*0,3) soru öğrenilmiş konulardan, kalanı güncel konudan', () => {
      const qs = buildDayQuestions({
        topics: NOTA_TOPICS,
        statuses: statuses(['nota-1', 'nota-2'], 'sure-1'),
        count: 12,
        rng: seededRng(15),
        dueCards: [],
      })
      expect(qs).toHaveLength(12)
      expect(qs.filter((q) => q.topicId === 'sure-1')).toHaveLength(8)
      expect(qs.filter((q) => q.topicId === 'nota-1' || q.topicId === 'nota-2')).toHaveLength(4)
    })
    it('öğrenilmiş konu payından alınan due kartlar düşülür', () => {
      const qs = buildDayQuestions({
        topics: NOTA_TOPICS,
        statuses: statuses(['nota-1'], 'sure-1'),
        count: 12,
        rng: seededRng(20),
        dueCards: ['note:A4', 'note:G4'],
      })
      expect(qs).toHaveLength(12)
      expect(ids(qs).filter((id) => id === 'note:A4' || id === 'note:G4')).toHaveLength(2)
      // pay 4 − 2 due = 2 öğrenilmiş konu sorusu; kalan 8 güncel konudan
      expect(qs.filter((q) => q.topicId === 'nota-1')).toHaveLength(2)
      expect(qs.filter((q) => q.topicId === 'sure-1')).toHaveLength(8)
    })
    it('due kartlar payı aşarsa öğrenilmiş konu payı sıfır olur (negatif değil)', () => {
      const qs = buildDayQuestions({
        topics: NOTA_TOPICS,
        statuses: statuses(['nota-1'], 'sure-1'),
        count: 12,
        rng: seededRng(21),
        dueCards: due10,
      })
      expect(qs).toHaveLength(12)
      expect(ids(qs).filter((id) => due10.includes(id))).toHaveLength(6)
      expect(qs.filter((q) => q.topicId === 'sure-1')).toHaveLength(6)
    })
    it('güncel konu yoksa kalan sorular öğrenilmiş konulardan', () => {
      const all = NOTA_TOPICS.map((t) => t.id)
      const qs = buildDayQuestions({ topics: NOTA_TOPICS, statuses: statuses(all, null), count: 10, rng: seededRng(16), dueCards: [] })
      expect(qs).toHaveLength(10)
    })
    it('hiçbir kaynak yoksa boş liste', () => {
      expect(
        buildDayQuestions({ topics: NOTA_TOPICS, statuses: statuses([], null), count: 10, rng: seededRng(17), dueCards: [] }),
      ).toEqual([])
    })
    it('toplam count değerini aşmaz', () => {
      const qs = buildDayQuestions({
        topics: NOTA_TOPICS,
        statuses: statuses(['nota-1'], 'sure-1'),
        count: 4,
        rng: seededRng(18),
        dueCards: due10,
        reviewTopic: nota1,
      })
      expect(qs).toHaveLength(4)
    })
    it('aynı seed aynı sonuç', () => {
      const input = () => ({
        topics: NOTA_TOPICS,
        statuses: statuses(['nota-1'], 'sure-1'),
        count: 12,
        rng: seededRng(19),
        dueCards: ['note:D5', 'note:C5'],
      })
      expect(buildDayQuestions(input())).toEqual(buildDayQuestions(input()))
    })
  })
})
