import type { Step, WrittenPitch } from '../music/pitch'

export const LINE_GAP = 10
export const STAFF_TOP = 30
/** Alt çizginin y konumu (Mi4). */
export const STAFF_BOTTOM = STAFF_TOP + 4 * LINE_GAP

const STEP_ORDER: Record<Step, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }
/** Mi4'ün mutlak diyatonik sırası. */
const E4 = 4 * 7 + STEP_ORDER.E

/** Mi4 (alt çizgi) = 0; her diyatonik adım için 1 artar. Değiştirgeç etkilemez. */
export function staffIndex(p: WrittenPitch): number {
  return p.octave * 7 + STEP_ORDER[p.step] - E4
}

export function noteY(p: WrittenPitch): number {
  return indexY(staffIndex(p))
}

export function indexY(index: number): number {
  return STAFF_BOTTOM - index * (LINE_GAP / 2)
}

/** Notaya ulaşmak için gereken ek çizgilerin y konumları (porteye en yakından başlayarak). */
export function ledgerLineYs(p: WrittenPitch): number[] {
  const idx = staffIndex(p)
  const ys: number[] = []
  if (idx <= -2) {
    for (let i = -2; i >= idx; i -= 2) ys.push(indexY(i))
  } else if (idx >= 10) {
    for (let i = 10; i <= idx; i += 2) ys.push(indexY(i))
  }
  return ys
}
