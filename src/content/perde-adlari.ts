import { ACCIDENTAL_NAMES, parseNoteKey } from '../music/accidentals'
import { SOLFEJ } from '../music/pitch'
import type { WrittenPitch } from '../music/pitch'

/**
 * Nota anahtarı (harf + oktav + isteğe bağlı NotaAE işareti) → perde adı.
 * İşaretli anahtarlar: `b` eksi, `#` artı koma ('B4b1' = Si4 koma bemolü).
 * Irak (F4#4) tanımlıdır, ama Irak için kart ya da soru üretilmez.
 */
export const PERDE_ADLARI: Record<string, string> = {
  G4: 'Rast',
  A4: 'Dügâh',
  B4: 'Bûselik',
  C5: 'Çârgâh',
  D5: 'Nevâ',
  E5: 'Hüseynî',
  F5: 'Acem',
  G5: 'Gerdâniye',
  A5: 'Muhayyer',
  B4b1: 'Segâh',
  B4b5: 'Kürdî',
  B4b4: 'Dik Kürdî',
  'C5#4': 'Nim Hicaz',
  'C5#5': 'Hicaz',
  'F5#4': 'Eviç',
  'F4#4': 'Irak',
}

/**
 * Solfej adı; oktav ayrımı gereken üst Sol ve La için "tiz" eklenir.
 * İşaretli notalarda "Si (koma bemolü)" biçimindedir.
 */
export function notaEtiketi(key: string): string {
  if (key === 'G5') return 'tiz Sol'
  if (key === 'A5') return 'tiz La'
  const p = parseNoteKey(key)
  if (p && p.acc !== 0) return `${SOLFEJ[p.step]} (${ACCIDENTAL_NAMES[p.acc as Exclude<typeof p.acc, 0 | 9 | -9>]})`
  return SOLFEJ[key.charAt(0) as keyof typeof SOLFEJ]
}

/** Yazılı perdenin nota etiketi ("Si (koma bemolü)", "tiz Sol", "Re"). */
export function perdeEtiketi(p: WrittenPitch): string {
  const key = `${p.step}${p.octave}${p.acc === 0 ? '' : `${p.acc < 0 ? 'b' : '#'}${Math.abs(p.acc)}`}`
  return notaEtiketi(key)
}
