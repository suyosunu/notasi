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
  'G5#4': 'Nim Şehnaz',
  E5b5: 'Nim Hisar',
  B5b1: 'Tiz Segâh',
  C6: 'Tiz Çârgâh',
  D6: 'Tiz Nevâ',
  'C6#4': 'Tiz Nim Hicaz',
  'F4#4': 'Irak',
}

/** Oktav ayrımı gereken tiz notalar: etikete "tiz " eklenir (G5, A5 ve 4. kademe: Tiz Segâh, Çârgâh, Nim Hicaz, Nevâ). */
const TIZ_ANAHTARLAR: ReadonlySet<string> = new Set(['G5', 'A5', 'B5b1', 'C6', 'C6#4', 'D6'])

/**
 * Solfej adı; oktav ayrımı gereken tiz notalar için "tiz" eklenir ("tiz Sol", "tiz Re").
 * İşaretli notalarda "Si (koma bemolü)" biçimindedir ("tiz Si (koma bemolü)").
 */
export function notaEtiketi(key: string): string {
  const tiz = TIZ_ANAHTARLAR.has(key) ? 'tiz ' : ''
  const p = parseNoteKey(key)
  if (p && p.acc !== 0) return `${tiz}${SOLFEJ[p.step]} (${ACCIDENTAL_NAMES[p.acc as Exclude<typeof p.acc, 0 | 9 | -9>]})`
  return `${tiz}${SOLFEJ[key.charAt(0) as keyof typeof SOLFEJ]}`
}

/** Yazılı perdenin nota etiketi ("Si (koma bemolü)", "tiz Sol", "Re", "tiz Do (bakiye diyezi)"). */
export function perdeEtiketi(p: WrittenPitch): string {
  const key = `${p.step}${p.octave}${p.acc === 0 ? '' : `${p.acc < 0 ? 'b' : '#'}${Math.abs(p.acc)}`}`
  return notaEtiketi(key)
}
