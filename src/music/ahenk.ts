import { komaToHz, KOMA_PER_OCTAVE, writtenKoma } from './pitch'
import type { WrittenPitch } from './pitch'

export type AhenkId =
  | 'bolahenk'
  | 'davud'
  | 'sah'
  | 'mansur'
  | 'kiz'
  | 'yildiz'
  | 'mustahsen'
  | 'sipurde'

export interface Ahenk {
  id: AhenkId
  name: string
  /** Yazılı Rast (Sol) bu ahenkte hangi perde olarak duyulur. */
  rastSoundsAs: string
  /** Yazılı perdeye eklenen koma kaydırması (Mansur = 0). */
  shiftKoma: number
}

export const AHENKLER: Ahenk[] = [
  { id: 'bolahenk', name: 'Bolâhenk', rastSoundsAs: 'Re', shiftKoma: -22 },
  { id: 'davud', name: 'Davud', rastSoundsAs: 'Mi', shiftKoma: -13 },
  { id: 'sah', name: 'Şah', rastSoundsAs: 'Fa', shiftKoma: -9 },
  { id: 'mansur', name: 'Mansur', rastSoundsAs: 'Sol', shiftKoma: 0 },
  { id: 'kiz', name: 'Kız', rastSoundsAs: 'La', shiftKoma: 9 },
  { id: 'yildiz', name: 'Yıldız', rastSoundsAs: 'Si♭', shiftKoma: 13 },
  { id: 'mustahsen', name: 'Müstahsen', rastSoundsAs: 'Si', shiftKoma: 18 },
  { id: 'sipurde', name: 'Sipürde', rastSoundsAs: 'Do', shiftKoma: 22 },
]

export interface Tuning {
  ahenk: AhenkId
  octaveOffset: number
  tuningCents: number
}

export const DEFAULT_TUNING: Tuning = { ahenk: 'kiz', octaveOffset: 0, tuningCents: 0 }

export function soundingHz(p: WrittenPitch, t: Tuning): number {
  const ahenk = AHENKLER.find((a) => a.id === t.ahenk)
  if (!ahenk) throw new Error(`Bilinmeyen ahenk: ${t.ahenk}`)
  const koma = writtenKoma(p) + ahenk.shiftKoma + KOMA_PER_OCTAVE * t.octaveOffset
  return komaToHz(koma) * 2 ** (t.tuningCents / 1200)
}
