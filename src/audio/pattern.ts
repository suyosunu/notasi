import { soundingHz } from '../music/ahenk'
import type { Tuning } from '../music/ahenk'
import { beats } from '../music/notation'
import type { MusicEvent } from '../music/notation'
import type { WrittenPitch } from '../music/pitch'

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

const samePitch = (a: WrittenPitch, b: WrittenPitch): boolean =>
  a.step === b.step && a.octave === b.octave && a.acc === b.acc

/** Bağlı nota dizisi (aynı perde) tek ses olur; süreleri toplanır. */
export function toToneEvents(events: MusicEvent[], t: Tuning): ToneEvent[] {
  const out: ToneEvent[] = []
  for (const [i, e] of events.entries()) {
    const prev = events[i - 1]
    const last = out.at(-1)
    if (e.kind === 'note' && prev?.kind === 'note' && prev.tie && samePitch(prev.pitch, e.pitch) && last) {
      last.beats += beats(e)
      continue
    }
    out.push({ hz: e.kind === 'note' ? soundingHz(e.pitch, t) : null, beats: beats(e) })
  }
  return out
}
