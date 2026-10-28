import type { WrittenPitch } from './pitch'

export type DurationKind = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'
export interface NoteEvent {
  kind: 'note'
  pitch: WrittenPitch
  dur: DurationKind
  dotted?: boolean
  /** true: sonraki notaya (aynı perde) bağlıdır; çalarken süreleri birleşir. */
  tie?: boolean
  /** true: sonraki notaya bağ (legato; perde farklı olabilir). Yalnız çizilir; çalma değişmez. */
  bag?: boolean
  /** true: üçleme üyesi; süre × 2/3. */
  uclu?: boolean
  /** true: bu olaydan sonra nefes işareti. */
  nefes?: boolean
}
export interface RestEvent {
  kind: 'rest'
  dur: DurationKind
  dotted?: boolean
  /** true: üçleme üyesi; süre × 2/3. */
  uclu?: boolean
  /** true: bu olaydan sonra nefes işareti. */
  nefes?: boolean
}
export type MusicEvent = NoteEvent | RestEvent

const BEATS: Record<DurationKind, number> = { whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25 }
const NAMES: Record<DurationKind, string> = {
  whole: 'Birlik',
  half: 'İkilik',
  quarter: 'Dörtlük',
  eighth: 'Sekizlik',
  sixteenth: 'Onaltılık',
}

/** Süre (dörtlük cinsinden). Üçlemede kesirlidir (üç sekizlik üçleme = 1); karşılaştırmalar 1e-6 payıyla yapılır. */
export function beats(e: MusicEvent): number {
  return BEATS[e.dur] * (e.dotted ? 1.5 : 1) * (e.uclu ? 2 / 3 : 1)
}

export function durationName(e: MusicEvent): string {
  const base = e.dotted ? `Noktalı ${NAMES[e.dur].toLocaleLowerCase('tr')}` : NAMES[e.dur]
  const ad = e.uclu ? `${base} üçleme` : base
  return e.kind === 'rest' ? `${ad} sus` : ad
}
