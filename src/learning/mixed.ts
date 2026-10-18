import type { Topic } from '../content/nota-topics'
import type { AttemptRec } from '../store/db'
import { shuffle } from '../util/rng'
import type { TopicStatus } from './mastery'
import { makeQuestion } from './questions'
import type { Question } from './questions'

export const MIXED_COUNT = 12
/** Ağırlık hesabında bir kartın bakılan son deneme sayısı. */
const RECENT_ATTEMPTS = 5

/** Öğrenilmiş (`ogrenildi`) konuların tüm kartları, konu sırasıyla. */
export function mixedPool(topics: Topic[], statuses: Record<string, TopicStatus>): string[] {
  return topics.filter((t) => statuses[t.id] === 'ogrenildi').flatMap((t) => t.cards)
}

/** Kartın ağırlığı: 1 + son 5 denemesindeki (konudan bağımsız) yanlış sayısı. */
function weights(pool: string[], attempts: AttemptRec[]): Map<string, number> {
  const byCard = new Map<string, AttemptRec[]>()
  for (const a of attempts) {
    const list = byCard.get(a.cardId)
    if (list) list.push(a)
    else byCard.set(a.cardId, [a])
  }
  const out = new Map<string, number>()
  for (const id of pool) {
    const last = (byCard.get(id) ?? []).sort((a, b) => a.at.localeCompare(b.at)).slice(-RECENT_ATTEMPTS)
    out.set(id, 1 + last.filter((a) => !a.correct).length)
  }
  return out
}

function weightedPick(candidates: string[], w: Map<string, number>, rng: () => number): string {
  const total = candidates.reduce((sum, id) => sum + (w.get(id) ?? 1), 0)
  let r = rng() * total
  for (const id of candidates) {
    r -= w.get(id) ?? 1
    if (r < 0) return id
  }
  return candidates[candidates.length - 1]!
}

/**
 * `dueCards` en eski tekrar önde sıralı verilir. Vadesi gelen havuz kartlarından en fazla
 * `floor(count/2)` tanesi gelir; kalan yerler ağırlıklı rastgele dolar. Havuzda 2+ kart varsa
 * aynı kart art arda iki kez gelmez.
 */
export function buildMixedQuestions(input: {
  pool: string[]
  attempts: AttemptRec[]
  dueCards: string[]
  count: number
  rng: () => number
}): Question[] {
  const { pool, attempts, count, rng } = input
  if (pool.length === 0 || count <= 0) return []
  const inPool = new Set(pool)
  const pending = new Set([...new Set(input.dueCards)].filter((id) => inPool.has(id)).slice(0, Math.floor(count / 2)))
  const w = weights(pool, attempts)

  const order: string[] = []
  for (let slot = 0; slot < count; slot++) {
    const last = order[slot - 1]
    const remaining = count - slot
    const dueChoices = shuffle([...pending].filter((id) => id !== last), rng)
    // Bekleyen due kartlar kalan yerlere eşit olasılıkla serpiştirilir; yer kalmadıysa zorunludur.
    const mustTakeDue = pending.size >= remaining
    const takeDue = dueChoices.length > 0 && (mustTakeDue || rng() < pending.size / remaining)
    let pick: string | undefined = takeDue ? dueChoices[0] : undefined
    if (pick === undefined) {
      // Bekleyen due kartlar (kendi sırasını bekler) ve bir önceki kart ağırlıklı çekilişin dışında kalır.
      const candidates = pool.length < 2 ? pool : pool.filter((id) => id !== last && !pending.has(id))
      pick = candidates.length > 0 ? weightedPick(candidates, w, rng) : dueChoices[0]
    }
    pending.delete(pick!)
    order.push(pick!)
  }
  return order.map((id) => makeQuestion(id, rng))
}
