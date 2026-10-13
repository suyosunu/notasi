import { soundingHz } from '../music/ahenk'
import type { Tuning } from '../music/ahenk'
import { beats } from '../music/notation'
import type { MusicEvent } from '../music/notation'

/** hz === null sus demektir. */
export interface ToneEvent {
  hz: number | null
  beats: number
}

/** Kulakla ayarlanabilir ses zinciri. */
export const SOUND_CHAIN = '.s("triangle").vib(5).vibmod(0.1)'

/**
 * Tek seferlik çalma: ilk döngüden sonrası (pratikte sonsuza dek) susturulur. hush() yalnızca saati durdurur,
 * Web Audio'ya verilmiş notaları kesemez; maskesiz olursa 2. döngünün ilk notası sonda duyulur.
 */
const ONE_SHOT = '.mask("<1 0@1000000>")'

export function buildPatternCode(
  events: ToneEvent[],
  bpm: number,
): { code: string; durationMs: number } {
  const totalBeats = events.reduce((sum, e) => sum + e.beats, 0)
  if (!(totalBeats > 0) || !(bpm > 0)) {
    throw new RangeError('Çalınacak ses ya da geçerli tempo yok')
  }
  const steps = events
    .map((e) => `${e.hz === null ? '~' : e.hz.toFixed(2)}@${e.beats}`)
    .join(' ')
  return {
    code: `freq("${steps}")${SOUND_CHAIN}${ONE_SHOT}.cpm(${bpm / totalBeats})`,
    durationMs: (totalBeats * 60000) / bpm,
  }
}

export function toToneEvents(events: MusicEvent[], t: Tuning): ToneEvent[] {
  return events.map((e) => ({
    hz: e.kind === 'note' ? soundingHz(e.pitch, t) : null,
    beats: beats(e),
  }))
}
