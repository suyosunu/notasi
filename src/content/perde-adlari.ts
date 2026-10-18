import { SOLFEJ } from '../music/pitch'
import type { Step } from '../music/pitch'

/** Nota anahtarı (basamak harfi + oktav) → perde adı. */
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
}

/** Solfej adı; oktav ayrımı gereken üst Sol ve La için "tiz" eklenir. */
export function notaEtiketi(key: string): string {
  if (key === 'G5') return 'tiz Sol'
  if (key === 'A5') return 'tiz La'
  return SOLFEJ[key.charAt(0) as Step]
}
