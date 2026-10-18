import type { Accidental } from './pitch'

/** AEU işaretlerinin Türkçe adları (araştırma §1). ±9 tam ses olduğu için işaretsizdir. */
export const ACCIDENTAL_NAMES: Record<Exclude<Accidental, 0 | 9 | -9>, string> = {
  [-1]: 'koma bemolü',
  [-4]: 'bakiye bemolü',
  [-5]: 'küçük mücenneb bemolü',
  [-8]: 'büyük mücenneb bemolü',
  1: 'koma diyezi',
  4: 'bakiye diyezi',
  5: 'küçük mücenneb diyezi',
  8: 'büyük mücenneb diyezi',
}
