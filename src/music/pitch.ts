export type Step = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
/** Koma cinsinden değiştirgeç (AEU). */
export type Accidental = 0 | 1 | -1 | 4 | -4 | 5 | -5 | 8 | -8 | 9 | -9
export interface WrittenPitch {
  step: Step
  octave: number
  acc: Accidental
}

export const KOMA_PER_OCTAVE = 53

/** Do4 = 0, La4 = 40 olacak şekilde doğal perdelerin koma konumu. */
export const NATURAL_KOMA: Record<Step, number> = {
  C: 0,
  D: 9,
  E: 18,
  F: 22,
  G: 31,
  A: 40,
  B: 49,
}

export const SOLFEJ: Record<Step, string> = {
  C: 'Do',
  D: 'Re',
  E: 'Mi',
  F: 'Fa',
  G: 'Sol',
  A: 'La',
  B: 'Si',
}

export function writtenKoma(p: WrittenPitch): number {
  return (p.octave - 4) * KOMA_PER_OCTAVE + NATURAL_KOMA[p.step] + p.acc
}

export function komaToHz(k: number): number {
  return 440 * 2 ** ((k - 40) / KOMA_PER_OCTAVE)
}

export function centsBetween(hz: number, targetHz: number): number {
  return 1200 * Math.log2(hz / targetHz)
}
