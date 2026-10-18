import type { Topic } from '../content/nota-topics'
import type { AttemptRec } from '../store/db'

export const MASTERY_WINDOW = 10
export const MASTERY_THRESHOLD = 0.8

export type TopicStatus = 'kilitli' | 'acik' | 'ogrenildi'

/**
 * Tek bir konunun denemeleri verilir. Ustalık yapışkandır: konu, seviye atlama (`placedOut`) ile ya da
 * zaman sıralı geçmişinde art arda 10 denemelik herhangi bir pencere en az %80 doğruysa öğrenilmiş sayılır.
 * Sonradan gelen yanlışlar konuyu yeniden kilitlemez; zayıflık `needsReview` ve Leitner ile ele alınır.
 */
export function isMastered(attempts: AttemptRec[], placedOut: boolean): boolean {
  if (placedOut) return true
  if (attempts.length < MASTERY_WINDOW) return false
  const ordered = [...attempts].sort((a, b) => a.at.localeCompare(b.at))
  let correct = 0
  for (let i = 0; i < ordered.length; i++) {
    if (ordered[i]!.correct) correct++
    if (i >= MASTERY_WINDOW && ordered[i - MASTERY_WINDOW]!.correct) correct--
    if (i >= MASTERY_WINDOW - 1 && correct / MASTERY_WINDOW >= MASTERY_THRESHOLD) return true
  }
  return false
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

export const REVIEW_MIN_ATTEMPTS = 6
export const REVIEW_MIN_CORRECT = 5

/**
 * Tek bir konunun denemeleri verilir. Konuda en az 6 deneme varsa ve son 10 denemenin
 * 5'inden azı doğruysa, öğrenci bir önceki konuya kısa bir dönüşten yarar görür.
 */
export function needsReview(attempts: AttemptRec[]): boolean {
  if (attempts.length < REVIEW_MIN_ATTEMPTS) return false
  const last = [...attempts].sort((a, b) => a.at.localeCompare(b.at)).slice(-MASTERY_WINDOW)
  return last.filter((a) => a.correct).length < REVIEW_MIN_CORRECT
}
