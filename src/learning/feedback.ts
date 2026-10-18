export type Feedback = 'kolay' | 'tam' | 'zor'

export const MIN_DAILY_QUESTIONS = 6
export const MAX_DAILY_QUESTIONS = 20
const DEFAULT_DAILY_QUESTIONS = 12
const STEP = 3

/** Oturum sonu geri bildirimine göre ertesi günün soru sayısı: kolay +3, tam 0, zor −3; [6, 20]. */
export function adjustCount(current: number, fb: Feedback): number {
  const base = Number.isFinite(current) ? Math.round(current) : DEFAULT_DAILY_QUESTIONS
  const delta = fb === 'kolay' ? STEP : fb === 'zor' ? -STEP : 0
  return Math.min(MAX_DAILY_QUESTIONS, Math.max(MIN_DAILY_QUESTIONS, base + delta))
}
