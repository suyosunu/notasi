import { median } from './smoothing'

export interface LongToneConfig {
  toleranceCents: number
  requiredMs: number
  /** Tolerans dışı ya da sessiz örneklerin tutuşu bozmadan sürebileceği en uzun süre. */
  graceMs: number
}

export interface LongToneState {
  holdStartAt: number | null
  /** Tutuş içindeki son tolerans içi örneğin zamanı. */
  lastGoodAt: number | null
  holdingMs: number
  bestMs: number
  passed: boolean
}

const GRACE_MS = 250

/** Düzeyi belirleyen son deneme sayısı. */
export const NEY_LEVEL_WINDOW = 6

/**
 * Perde düzeyi son denemeleri izler (zorluk yalnızca artmasın): o perdenin en yeni
 * `NEY_LEVEL_WINDOW` denemesinde geçiş − başarısız, en az 0. Girdi sırası önemsizdir.
 */
export function neyLevel(recs: readonly { passed: boolean; at: string }[]): number {
  const recent = [...recs].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0)).slice(0, NEY_LEVEL_WINDOW)
  const passes = recent.filter((r) => r.passed).length
  return Math.max(0, passes - (recent.length - passes))
}

/** `level`: `neyLevel` ile bulunan perde düzeyi. */
export function neyLevelConfig(level: number): LongToneConfig {
  const k = Math.max(0, Math.floor(Number.isFinite(level) ? level : 0))
  return {
    toleranceCents: Math.max(10, 25 - 5 * k),
    requiredMs: Math.min(10000, 4000 + 1000 * k),
    graceMs: GRACE_MS,
  }
}

/** İlk ses: hedef, tutuşun başındaki perdedir; geniş tolerans, kısa süre. */
export const ILK_SES_CONFIG: LongToneConfig = { toleranceCents: 50, requiredMs: 3000, graceMs: GRACE_MS }

export function initialLongTone(): LongToneState {
  return { holdStartAt: null, lastGoodAt: null, holdingMs: 0, bestMs: 0, passed: false }
}

/**
 * Bir yumuşatılmış örneği işler. Tolerans içindeki ilk örnekte tutuş başlar; tolerans dışı
 * ya da `null` örnekler `graceMs`'i aşmadıkça tutuşu bozmaz (süreyi de uzatmaz), aşarsa
 * tutuş sıfırlanır. `holdingMs >= requiredMs` olunca geçilir ve durum artık değişmez.
 */
export function stepLongTone(
  s: LongToneState,
  sample: { t: number; cents: number | null },
  cfg: LongToneConfig,
): LongToneState {
  if (s.passed) return s
  const { t, cents } = sample
  const good = cents !== null && Number.isFinite(cents) && Math.abs(cents) <= cfg.toleranceCents
  const holding = s.holdStartAt !== null && s.lastGoodAt !== null
  const broken = holding && t - s.lastGoodAt! > cfg.graceMs

  if (!good) {
    if (!broken) return s
    return { ...s, holdStartAt: null, lastGoodAt: null, holdingMs: 0 }
  }

  const holdStartAt = holding && !broken ? s.holdStartAt! : t
  const holdingMs = t - holdStartAt
  const bestMs = Math.max(s.bestMs, holdingMs)
  return { holdStartAt, lastGoodAt: t, holdingMs, bestMs, passed: holdingMs >= cfg.requiredMs }
}

export const FINGERING_MIN_SAMPLES = 10
export const FINGERING_SUSPECT_CENTS = 50

/** En az 10 örneğin ortancası ±50 sentin dışındaysa parmak şeması şüphelidir. */
export function fingeringCheck(centsSamples: number[]): { suspicious: boolean; medianCents: number } {
  const finite = centsSamples.filter((c) => Number.isFinite(c))
  const m = median(finite)
  const medianCents = Number.isFinite(m) ? m : 0
  return {
    suspicious: finite.length >= FINGERING_MIN_SAMPLES && Math.abs(medianCents) > FINGERING_SUSPECT_CENTS,
    medianCents,
  }
}
