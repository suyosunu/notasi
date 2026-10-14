import { AHENKLER } from '../music/ahenk'
import type { AhenkId, Tuning } from '../music/ahenk'
import { KOMA_PER_OCTAVE, writtenKoma } from '../music/pitch'
import type { WrittenPitch } from '../music/pitch'

/** Kalibrasyon perdesi: Nevâ (MEB sırasında ilk öğrenilen perde). */
export const CALIBRATION_REF: WrittenPitch = { step: 'D', octave: 5, acc: 0 }

export type CalibrationResult =
  | { ok: true; tuning: Tuning; matchesSelected: boolean }
  | { ok: false; reason: 'az-veri' | 'kararsiz' | 'tanimsiz' }

export const MIN_SAMPLES = 20
/** Örneklerin en az bu oranı medyanın ±STABLE_CENTS içinde olmalı. */
export const STABLE_RATIO = 0.8
export const STABLE_CENTS = 30
/** Bundan büyük ayar sapması hiçbir ahenge uymaz. */
export const MAX_TUNING_CENTS = 50
const OCTAVE_OFFSETS = [-2, -1, 0, 1]
/** Kayan noktalı eşitlik payı (koma). */
const TIE_EPS = 1e-9

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const mid = s.length >> 1
  return s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2
}

/** Nevâ perdesi üflenirken toplanan Hz örneklerinden ahenk, oktav ve ince ayarı bulur. */
export function calibrate(samplesHz: number[], selected: AhenkId): CalibrationResult {
  if (samplesHz.length < MIN_SAMPLES) return { ok: false, reason: 'az-veri' }
  const m = median(samplesHz)
  const stable = samplesHz.filter((hz) => Math.abs(1200 * Math.log2(hz / m)) <= STABLE_CENTS).length
  if (stable < samplesHz.length * STABLE_RATIO) return { ok: false, reason: 'kararsiz' }

  const d = 40 + KOMA_PER_OCTAVE * Math.log2(m / 440) - writtenKoma(CALIBRATION_REF)

  // Seçili ahenk önce denenir: eşitlikte (yalnızca kesin küçük olan yeri alır) o kazanır.
  const ordered = [...AHENKLER].sort((a, b) => Number(b.id === selected) - Number(a.id === selected))
  let best: { id: AhenkId; octaveOffset: number; err: number } | null = null
  for (const a of ordered) {
    for (const o of OCTAVE_OFFSETS) {
      const err = d - (a.shiftKoma + KOMA_PER_OCTAVE * o)
      if (best === null || Math.abs(err) < Math.abs(best.err) - TIE_EPS) {
        best = { id: a.id, octaveOffset: o, err }
      }
    }
  }
  if (best === null) return { ok: false, reason: 'tanimsiz' }

  const tuningCents = (best.err * 1200) / KOMA_PER_OCTAVE
  if (Math.abs(tuningCents) > MAX_TUNING_CENTS) return { ok: false, reason: 'tanimsiz' }
  return {
    ok: true,
    tuning: { ahenk: best.id, octaveOffset: best.octaveOffset, tuningCents },
    matchesSelected: best.id === selected,
  }
}
