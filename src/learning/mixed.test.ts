import { describe, expect, it } from 'vitest'
import { NOTA_TOPICS } from '../content/nota-topics'
import type { AttemptRec } from '../store/db'
import { seededRng } from '../util/rng'
import { buildMixedQuestions, MIXED_COUNT, mixedPool } from './mixed'
import { topicStatuses } from './mastery'
import type { TopicStatus } from './mastery'

function statuses(learned: string[]): Record<string, TopicStatus> {
  const out: Record<string, TopicStatus> = {}
  let open = true
  for (const t of NOTA_TOPICS) {
    if (learned.includes(t.id)) out[t.id] = 'ogrenildi'
    else if (open) {
      out[t.id] = 'acik'
      open = false
    } else out[t.id] = 'kilitli'
  }
  return out
}

let n = 0
function attempt(cardId: string, correct: boolean): AttemptRec {
  n++
  return { id: `a${n}`, topicId: 'x', cardId, correct, at: new Date(2026, 0, 1, 0, 0, n).toISOString() }
}

const BIG_POOL = NOTA_TOPICS.slice(0, 4).flatMap((t) => t.cards) // 11 kart

describe('mixedPool', () => {
  it('returns only the cards of öğrenildi topics', () => {
    const pool = mixedPool(NOTA_TOPICS, statuses(['nota-1', 'sure-1']))
    expect(pool).toEqual([...NOTA_TOPICS[0]!.cards, ...NOTA_TOPICS[1]!.cards])
  })

  it('is empty when no topic is learned', () => {
    expect(mixedPool(NOTA_TOPICS, statuses([]))).toEqual([])
  })

  it('stays non-empty when a mastered topic is later answered wrong (sticky mastery)', () => {
    const results = [...Array(8).fill(true), false, false, false, false, false]
    const history: AttemptRec[] = results.map((correct, i) => ({
      id: `h${i}`,
      topicId: 'nota-1',
      cardId: 'note:D5',
      correct,
      at: new Date(2026, 0, 1, 0, i).toISOString(),
    }))
    const pool = mixedPool(NOTA_TOPICS, topicStatuses(NOTA_TOPICS, history, new Set()))
    expect(pool).toEqual(NOTA_TOPICS[0]!.cards)
  })
})

describe('buildMixedQuestions', () => {
  it('has a count of 12 by default', () => {
    expect(MIXED_COUNT).toBe(12)
  })

  it('returns exactly count questions when the pool is big enough', () => {
    const qs = buildMixedQuestions({ pool: BIG_POOL, attempts: [], dueCards: [], count: 12, rng: seededRng(1) })
    expect(qs).toHaveLength(12)
    expect(qs.every((q) => BIG_POOL.includes(q.cardId))).toBe(true)
  })

  it('returns [] for an empty pool', () => {
    expect(buildMixedQuestions({ pool: [], attempts: [], dueCards: ['note:D5'], count: 12, rng: seededRng(1) })).toEqual([])
  })

  it('takes at most floor(count/2) cards from the due list (oldest first), the rest is weighted', () => {
    // 10 due kart, havuz yalnızca bunlardan oluşur. Vade kotası 6: ilk 6 (sırayla) kesin vardır,
    // kalan 6 yer ağırlıklı çekilir; bu yüzden 10 kartın hepsi her turda bulunmaz.
    const pool = BIG_POOL.slice(0, 10)
    let missingSomewhere = 0
    for (let seed = 1; seed <= 200; seed++) {
      const qs = buildMixedQuestions({ pool, attempts: [], dueCards: pool, count: 12, rng: seededRng(seed) })
      expect(qs).toHaveLength(12)
      for (const id of pool.slice(0, 6)) expect(qs.some((q) => q.cardId === id)).toBe(true)
      if (new Set(qs.map((q) => q.cardId)).size < 10) missingSomewhere++
    }
    expect(missingSomewhere).toBeGreaterThan(0)
  })

  it('puts a due card first-class even in a short round', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const qs = buildMixedQuestions({ pool: BIG_POOL, attempts: [], dueCards: ['note:G4'], count: 4, rng: seededRng(seed) })
      expect(qs.some((q) => q.cardId === 'note:G4')).toBe(true)
    }
  })

  it('never puts the same card twice in a row (pool >= 2), over many seeds', () => {
    const smallPool = ['note:D5', 'note:C5']
    const attempts = [...Array.from({ length: 5 }, () => attempt('note:D5', false))]
    for (let seed = 1; seed <= 500; seed++) {
      for (const pool of [smallPool, BIG_POOL]) {
        const dueCards = seed % 2 ? pool.slice(0, 2) : []
        const qs = buildMixedQuestions({ pool, attempts, dueCards, count: 12, rng: seededRng(seed) })
        expect(qs).toHaveLength(12)
        for (let i = 1; i < qs.length; i++) expect(qs[i]!.cardId).not.toBe(qs[i - 1]!.cardId)
      }
    }
  })

  it('allows repeats when the pool has a single card', () => {
    const qs = buildMixedQuestions({ pool: ['note:D5'], attempts: [], dueCards: [], count: 5, rng: seededRng(1) })
    expect(qs).toHaveLength(5)
    expect(qs.every((q) => q.cardId === 'note:D5')).toBe(true)
  })

  it('ignores due cards that are not in the pool', () => {
    const qs = buildMixedQuestions({
      pool: ['note:D5', 'note:C5'],
      attempts: [],
      dueCards: ['note:A4'],
      count: 6,
      rng: seededRng(2),
    })
    expect(qs.every((q) => q.cardId !== 'note:A4')).toBe(true)
  })

  it('picks a card whose last 5 attempts were wrong much more often than a never-wrong card', () => {
    const pool = [...BIG_POOL, ...NOTA_TOPICS[4]!.cards, ...NOTA_TOPICS[5]!.cards] // 18 kart
    const weak = pool[0]!
    const strong = pool[1]!
    const attempts = [
      ...Array.from({ length: 8 }, () => attempt(weak, true)), // eski doğrular son 5'in dışında kalır
      ...Array.from({ length: 5 }, () => attempt(weak, false)),
      ...Array.from({ length: 5 }, () => attempt(strong, true)),
    ]
    // Eski kayıtların sırası `at` ile belirlenir: karıştırılmış girdi de aynı sonucu vermeli.
    attempts.reverse()
    let weakCount = 0
    let strongCount = 0
    for (let seed = 1; seed <= 2000; seed++) {
      const qs = buildMixedQuestions({ pool, attempts, dueCards: [], count: 12, rng: seededRng(seed) })
      weakCount += qs.filter((q) => q.cardId === weak).length
      strongCount += qs.filter((q) => q.cardId === strong).length
    }
    expect(weakCount / strongCount).toBeGreaterThan(3)
  })
})
