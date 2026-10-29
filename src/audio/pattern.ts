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
  /** Bu ses öncekinden dil vurulmadan geçer (önceki notada `bag`). */
  legato?: true
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

/** Bağlı geçişte önceki sesin sönüşü ve sonrakinin girişi (s): ikisi üst üste biner, arada boşluk ya da vurgu kalmaz. */
export const BAG_GECIS_S = 0.03

/** Bir sesin zarf değerleri; anahtarlar Strudel kontrolleridir. */
type Zarf = Partial<Record<'attack' | 'decay' | 'sustain' | 'release' | 'gain' | 'begin', number>>

/**
 * Bağlı geçişler için seslerle hizalı zarf desenleri (`.attack("0.03@1 …")` …). Bağlı girişte (`legato`) `bagli`
 * değerleri, bağlı çıkışta (sonraki ses `legato`) kısa sönüş (`BAG_GECIS_S`) kullanılır; diğer sesler `normal`
 * değerleriyle çalar. `lead`: melodiden önceki sus (vuruş), `normal` değerle doldurulur.
 */
function zarfDeseni(tones: ToneEvent[], lead: number, normal: Zarf, bagli: Zarf): string {
  const keys = Object.keys(normal) as (keyof Zarf)[]
  return keys
    .map((k) => {
      const steps = tones.map((t, i) => {
        let v = (t.legato ? bagli[k] : undefined) ?? normal[k]!
        if (k === 'release' && tones[i + 1]?.legato) v = BAG_GECIS_S
        return `${v}@${Number(t.beats.toFixed(6))}`
      })
      if (lead > 0) steps.unshift(`${normal[k]}@${lead}`)
      return `.${k}("${steps.join(' ')}")`
    })
    .join('')
}

/**
 * Bir `freq(...)` desenine eklenen ses zinciri. "Nefesli"de `layer` aynı deseni iki fonksiyondan geçirip
 * `stack` eder: ton ve soluk katmanı aynı frekans ve ritimle üst üste çalar. Zincirden sonra gelen maske ve
 * `.cpm()` iki katmana birlikte uygulanır.
 *
 * `tones` içinde bağlı ses (`legato`) varsa zincire seslerle hizalı zarf desenleri eklenir (`lead`: freq deseninin
 * başındaki sus, vuruş). Bağlı ses vurgusuz girer, önceki ses kısa söner; shakuhachi kaydı baştaki üfleme
 * geçişini atlayıp döngü bölgesinden başlar (`begin`). Bağsız seslerin değerleri zincirin kendi değerleridir.
 */
export function melodyChain(v: NeySesi, tones: ToneEvent[] = [], lead = 0): string {
  const bag = tones.some((t) => t.legato)
  const zarf = (normal: Zarf, bagli: Zarf) => (bag ? zarfDeseni(tones, lead, normal, bagli) : '')
  switch (v) {
    case 'nefesli':
      return (
        `.layer(x => x${NEFES_TON_CHAIN}${zarf({ attack: 0.06, release: 0.12 }, { attack: BAG_GECIS_S })}, ` +
        `x => x${NEFES_SOLUK_CHAIN}${zarf({ attack: 0.04, release: 0.1 }, { attack: BAG_GECIS_S })})`
      )
    case 'shakuhachi':
      return `${SHAKUHACHI_CHAIN}${zarf({ attack: 0.03, release: 0.1, begin: 0 }, { begin: 1 })}`
    case 'mevcut':
      // Normal değerler superdough osilatör varsayılanlarıdır (0.8 kazanç, 0.6 sustain). Bağlı ses tepe vurgusu
      // olmadan doğrudan aynı düzeye (0.8 × 0.6) çıkar.
      return `${SOUND_CHAIN}${zarf(
        { attack: 0.001, decay: 0.05, sustain: 0.6, release: 0.01, gain: 0.8 },
        { attack: BAG_GECIS_S, decay: 0.001, sustain: 1, gain: 0.48 },
      )}`
  }
}

/**
 * Tek seferlik çalma: ilk döngüden sonrası (pratikte sonsuza dek) susturulur. hush() yalnızca saati durdurur,
 * Web Audio'ya verilmiş notaları kesemez; maskesiz olursa 2. döngünün ilk notası sonda duyulur.
 */
export const ONE_SHOT = '.mask("<1 0@1000000>")'

/**
 * ToneEvent dizisi → freq mini-notasyonu adımları (`~` sus, `@n` vuruş sayısı). Ağırlıklar 6 ondalığa
 * yuvarlanır (üçleme 1/3 → 0.333333); sondaki sıfırlar yazılmaz (`@2`, `@0.5`).
 */
export function toneSteps(events: ToneEvent[]): string {
  return events.map((e) => `${e.hz === null ? '~' : e.hz.toFixed(2)}@${Number(e.beats.toFixed(6))}`).join(' ')
}

export function buildPatternCode(
  events: ToneEvent[],
  bpm: number,
  voice: NeySesi = 'shakuhachi',
): { code: string; durationMs: number } {
  const totalBeats = events.reduce((sum, e) => sum + e.beats, 0)
  if (!(totalBeats > 0) || !(bpm > 0)) {
    throw new RangeError('Çalınacak ses ya da geçerli tempo yok')
  }
  return {
    code: `freq("${toneSteps(events)}")${melodyChain(voice, events)}${ONE_SHOT}.cpm(${bpm / totalBeats})`,
    durationMs: (totalBeats * 60000) / bpm,
  }
}

const samePitch = (a: WrittenPitch, b: WrittenPitch): boolean =>
  a.step === b.step && a.octave === b.octave && a.acc === b.acc

/**
 * Bağlı nota dizisi (aynı perde, `tie`) tek ses olur; süreleri toplanır. `bag` (legato) sesleri ayrı tutar, ama
 * sonraki ses `legato` işaretlenir: dil vurulmadan geçilir (bkz. `melodyChain`).
 */
export function toToneEvents(events: MusicEvent[], t: Tuning): ToneEvent[] {
  const out: ToneEvent[] = []
  for (const [i, e] of events.entries()) {
    const prev = events[i - 1]
    const last = out.at(-1)
    if (e.kind === 'note' && prev?.kind === 'note' && prev.tie && samePitch(prev.pitch, e.pitch) && last) {
      last.beats += beats(e)
      continue
    }
    const legato = e.kind === 'note' && prev?.kind === 'note' && prev.bag
    out.push({ hz: e.kind === 'note' ? soundingHz(e.pitch, t) : null, beats: beats(e), ...(legato ? { legato: true } : {}) })
  }
  return out
}
