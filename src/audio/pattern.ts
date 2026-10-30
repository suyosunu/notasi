import { soundingHz } from '../music/ahenk'
import type { Tuning } from '../music/ahenk'
import { beats } from '../music/notation'
import type { MusicEvent } from '../music/notation'
import { samePitch } from '../music/pitch'
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

/**
 * Dil ("tu") belirginliği: bağsız iki ses arasındaki ayrımın gücü, 0–1 (Ayarlar → "Dil belirginliği" yüzde olarak).
 * 0 eski çalımdır (sesler birbirine yapışık). Artınca önceki ses biraz erken susar (`TU_BOSLUK_S × k`), kısa söner,
 * sonraki ses keskin girer: aradaki dil vuruşu duyulur. Bağlı geçişler etkilenmez.
 */
export const DIL_VARSAYILAN = 0.5
/** k = 1'de önceki sesin erken susma payı (s); sönüş bu payın içindedir. */
export const TU_BOSLUK_S = 0.12
/** k = 1'de önceki sesin sönüşü ve sonraki sesin girişi (s); sesin kendi değeri daha kısaysa o kalır. */
const TU_SONUS_S = 0.02
const TU_GIRIS_S = 0.005
/** Erken susma sesin en çok yarısını alır (hızlı tempoda kısa notalar kaybolmasın). */
const TU_EN_KISA_CLIP = 0.5

let dilBelirginligi = DIL_VARSAYILAN

/** Ayarlardan yüklenir; Ayarlar'da değişince hemen uygulanır. 0–1 dışı değer sınıra çekilir. */
export function setDilBelirginligi(k: number): void {
  dilBelirginligi = Number.isFinite(k) ? Math.min(1, Math.max(0, k)) : DIL_VARSAYILAN
}

export function getDilBelirginligi(): number {
  return dilBelirginligi
}

/** Bir sesin zarf değerleri; anahtarlar Strudel kontrolleridir. */
type Zarf = Partial<Record<'attack' | 'decay' | 'sustain' | 'release' | 'gain' | 'begin' | 'clip', number>>

/** `melodyChain` seçenekleri: `lead` freq deseninin başındaki sus (vuruş), `bpm` erken susma payı için, `dil` 0–1. */
export interface MelodiSecenek {
  lead?: number
  bpm?: number
  dil?: number
}

/**
 * Her sesin zarfı. Bağlı girişte (`legato`) `bagli` değerleri, bağlı çıkışta (sonraki ses `legato`) kısa sönüş
 * (`BAG_GECIS_S`). Bağsız sesten bağsız sese geçişte (dil vuruşu) `dil` oranında: önceki ses kısa söner ve erken
 * susar (`clip`), sonraki ses keskin girer. Diğer sesler `normal` değerleriyle çalar.
 */
function zarflar(tones: ToneEvent[], normal: Zarf, bagli: Zarf, dil: number, bpm?: number): Zarf[] {
  const kisalt = (v: number, hedef: number) => v - dil * (v - Math.min(v, hedef))
  const tuGiris = (x: ToneEvent | undefined, onceki: ToneEvent | undefined) =>
    dil > 0 && x?.hz != null && !x.legato && onceki?.hz != null
  return tones.map((t, i) => {
    const z: Zarf = { ...normal, ...(t.legato ? bagli : {}) }
    if (tuGiris(t, tones[i - 1])) z.attack = kisalt(z.attack!, TU_GIRIS_S)
    if (tones[i + 1]?.legato) z.release = BAG_GECIS_S
    else if (tuGiris(tones[i + 1], t)) {
      z.release = kisalt(z.release!, TU_SONUS_S)
      if (bpm && bpm > 0) z.clip = Math.max(TU_EN_KISA_CLIP, 1 - (dil * TU_BOSLUK_S * bpm) / (60 * t.beats))
    }
    return z
  })
}

/**
 * Seslerle hizalı zarf desenleri (`.attack("0.03@1 …")` …). Her ses `normal` değerinde kalıyorsa boş döner: zincir
 * değişmez. `lead` adımı `normal` değerle (clip 1) doldurulur.
 */
function zarfDeseni(tones: ToneEvent[], normal: Zarf, bagli: Zarf, s: MelodiSecenek): string {
  const zs = zarflar(tones, normal, bagli, s.dil ?? dilBelirginligi, s.bpm)
  const tam: Zarf = { ...normal, clip: 1 }
  const keys = (Object.keys(tam) as (keyof Zarf)[]).filter((k) => zs.some((z) => (z[k] ?? tam[k]) !== tam[k]))
  return keys
    .map((k) => {
      const steps = zs.map((z, i) => `${Number((z[k] ?? tam[k]!).toFixed(4))}@${Number(tones[i]!.beats.toFixed(6))}`)
      if ((s.lead ?? 0) > 0) steps.unshift(`${tam[k]}@${s.lead}`)
      return `.${k}("${steps.join(' ')}")`
    })
    .join('')
}

/**
 * Bir `freq(...)` desenine eklenen ses zinciri. "Nefesli"de `layer` aynı deseni iki fonksiyondan geçirip
 * `stack` eder: ton ve soluk katmanı aynı frekans ve ritimle üst üste çalar. Zincirden sonra gelen maske ve
 * `.cpm()` iki katmana birlikte uygulanır.
 *
 * `tones` verilince zincire seslerle hizalı zarf desenleri eklenir (bkz. `zarflar`): bağlı ses vurgusuz girer,
 * önceki ses kısa söner; shakuhachi kaydı bağlı seste baştaki üfleme geçişini atlayıp döngü bölgesinden başlar
 * (`begin`). Bağsız geçişler dil belirginliğiyle ayrılır. Hiçbir ses değişmiyorsa zincir yalın kalır.
 */
export function melodyChain(v: NeySesi, tones: ToneEvent[] = [], s: MelodiSecenek = {}): string {
  const zarf = (normal: Zarf, bagli: Zarf) => (tones.length ? zarfDeseni(tones, normal, bagli, s) : '')
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
    code: `freq("${toneSteps(events)}")${melodyChain(voice, events, { bpm })}${ONE_SHOT}.cpm(${bpm / totalBeats})`,
    durationMs: (totalBeats * 60000) / bpm,
  }
}

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
