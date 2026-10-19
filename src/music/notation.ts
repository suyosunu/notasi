import type { WrittenPitch } from './pitch'

export type DurationKind = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth'
export interface NoteEvent {
  kind: 'note'
  pitch: WrittenPitch
  dur: DurationKind
  dotted?: boolean
  /** true: sonraki notaya (aynı perde) bağlıdır; çalarken süreleri birleşir. */
  tie?: boolean
}
export interface RestEvent {
  kind: 'rest'
  dur: DurationKind
  dotted?: boolean
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

export function beats(e: MusicEvent): number {
  return BEATS[e.dur] * (e.dotted ? 1.5 : 1)
}

export function durationName(e: MusicEvent): string {
  const base = e.dotted ? `Noktalı ${NAMES[e.dur].toLocaleLowerCase('tr')}` : NAMES[e.dur]
  return e.kind === 'rest' ? `${base} sus` : base
}
