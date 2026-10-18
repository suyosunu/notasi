import type { Accidental, Step, WrittenPitch } from './pitch'

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

const VALID_KOMA: readonly number[] = [1, 4, 5, 8]

/**
 * NotaAE nota anahtarı: harf + oktav + isteğe bağlı (`b` eksi / `#` artı) + koma sayısı.
 * 'B4' → Si4; 'B4b1' → Si4 koma bemolü; 'C5#4' → Do5 bakiye diyezi.
 * Geçersiz biçim ya da koma sayısı (1, 4, 5, 8 dışı) için null döner.
 */
export function parseNoteKey(key: string): WrittenPitch | null {
  const m = /^([A-G])(\d)(?:([b#])(\d+))?$/.exec(key)
  if (!m) return null
  const pitch = { step: m[1] as Step, octave: Number(m[2]) }
  if (m[3] === undefined) return { ...pitch, acc: 0 }
  const koma = Number(m[4])
  if (!VALID_KOMA.includes(koma)) return null
  return { ...pitch, acc: (m[3] === 'b' ? -koma : koma) as Accidental }
}
