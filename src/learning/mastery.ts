import type { Topic } from '../content/nota-topics'
import type { AttemptRec } from '../store/db'

export const MASTERY_WINDOW = 10
export const MASTERY_THRESHOLD = 0.8

export type TopicStatus = 'kilitli' | 'acik' | 'ogrenildi'

/**
 * Tek bir konunun denemeleri verilir. Konu, seviye atlama (`placedOut`) ile ya da
 * son 10 denemenin en az %80'i doğruysa (en az 10 deneme gerekir) ustalaşılmış sayılır.
 */
export function isMastered(attempts: AttemptRec[], placedOut: boolean): boolean {
  if (placedOut) return true
  if (attempts.length < MASTERY_WINDOW) return false
  const last = [...attempts].sort((a, b) => a.at.localeCompare(b.at)).slice(-MASTERY_WINDOW)
  const correct = last.filter((a) => a.correct).length
  return correct / MASTERY_WINDOW >= MASTERY_THRESHOLD
}

/** Tüm denemeler verilir. İlk konu her zaman açık; sonrakiler önceki öğrenilince açılır. */
export function topicStatuses(
  topics: Topic[],
  attempts: AttemptRec[],
  placedOut: Set<string>,
): Record<string, TopicStatus> {
  const byTopic = new Map<string, AttemptRec[]>()
  for (const a of attempts) {
    const list = byTopic.get(a.topicId)
    if (list) list.push(a)
    else byTopic.set(a.topicId, [a])
  }
  const out: Record<string, TopicStatus> = {}
  let unlocked = true
  for (const t of topics) {
    if (!unlocked) {
      out[t.id] = 'kilitli'
    } else if (isMastered(byTopic.get(t.id) ?? [], placedOut.has(t.id))) {
      out[t.id] = 'ogrenildi'
    } else {
      out[t.id] = 'acik'
      unlocked = false
    }
  }
  return out
}

/** İlk açık konu; hepsi öğrenildiyse `null`. */
export function currentTopic(topics: Topic[], statuses: Record<string, TopicStatus>): Topic | null {
  return topics.find((t) => statuses[t.id] === 'acik') ?? null
}
