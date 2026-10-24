import { soundingHz } from '../music/ahenk'
import type { Tuning } from '../music/ahenk'
import { beats } from '../music/notation'
import type { MusicEvent } from '../music/notation'
import type { WrittenPitch } from '../music/pitch'
import { SHAKUHACHI_SOUND } from './shakuhachi'

/** hz === null sus demektir. */
export interface ToneEvent {
  hz: number | null
  beats: number
}

/** Ayarlar → "Ney sesi". Seçilen ses bütün melodi çalımlarında kullanılır; usul sesleri etkilenmez. */
export type NeySesi = 'mevcut' | 'nefesli' | 'shakuhachi'
export const NEY_SESLERI: readonly NeySesi[] = ['mevcut', 'nefesli', 'shakuhachi']

export function isNeySesi(v: unknown): v is NeySesi {
  return typeof v === 'string' && (NEY_SESLERI as readonly string[]).includes(v)
}

/** "Mevcut" ses: üçgen dalga + vibrato. Kulakla ayarlanabilir. */
export const SOUND_CHAIN = '.s("triangle").vib(5).vibmod(0.1)'

/** "Nefesli" ana ton: yumuşak giriş/çıkış, alçak geçiren filtreyle yumuşatılmış üçgen dalga, hafif vibrato. */
export const NEFES_TON_CHAIN = '.s("triangle").lpf(1800).attack(0.06).release(0.12).vib(4.5).vibmod(0.08)'
/** "Nefesli" soluk katmanı: aynı ritimde, bant geçiren filtreli düşük seviyeli pembe gürültü. */
export const NEFES_SOLUK_CHAIN = '.s("pink").bpf(1500).bpq(1.5).gain(0.08).attack(0.04).release(0.1)'
/** "Shakuhachi": yerel olarak barındırılan Fluid R3 GM shakuhachi kaydı (bkz. shakuhachi.ts). */
export const SHAKUHACHI_CHAIN = `.s("${SHAKUHACHI_SOUND}").attack(0.03).release(0.1)`

/**
 * Bir `freq(...)` desenine eklenen ses zinciri. "Nefesli"de `layer` aynı deseni iki fonksiyondan geçirip
 * `stack` eder: ton ve soluk katmanı aynı frekans ve ritimle üst üste çalar. Zincirden sonra gelen maske ve
 * `.cpm()` iki katmana birlikte uygulanır.
 */
export function melodyChain(v: NeySesi): string {
  switch (v) {
    case 'nefesli':
      return `.layer(x => x${NEFES_TON_CHAIN}, x => x${NEFES_SOLUK_CHAIN})`
    case 'shakuhachi':
      return SHAKUHACHI_CHAIN
    case 'mevcut':
      return SOUND_CHAIN
  }
}

/**
 * Tek seferlik çalma: ilk döngüden sonrası (pratikte sonsuza dek) susturulur. hush() yalnızca saati durdurur,
 * Web Audio'ya verilmiş notaları kesemez; maskesiz olursa 2. döngünün ilk notası sonda duyulur.
 */
export const ONE_SHOT = '.mask("<1 0@1000000>")'

/** ToneEvent dizisi → freq mini-notasyonu adımları (`~` sus, `@n` vuruş sayısı). */
export function toneSteps(events: ToneEvent[]): string {
  return events.map((e) => `${e.hz === null ? '~' : e.hz.toFixed(2)}@${e.beats}`).join(' ')
}

export function buildPatternCode(
  events: ToneEvent[],
  bpm: number,
  voice: NeySesi = 'mevcut',
): { code: string; durationMs: number } {
  const totalBeats = events.reduce((sum, e) => sum + e.beats, 0)
  if (!(totalBeats > 0) || !(bpm > 0)) {
    throw new RangeError('Çalınacak ses ya da geçerli tempo yok')
  }
  return {
    code: `freq("${toneSteps(events)}")${melodyChain(voice)}${ONE_SHOT}.cpm(${bpm / totalBeats})`,
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
