import type { Usul, Vurus, VurusSesi } from '../content/usuller'
import { playLoop, stopAudio, unlockAudio } from './player'

// Kulakla ayarlanabilir ses parametreleri. Örnek ses dosyası yoktur: yalnızca sentez (sine) ve gürültü (white).
// Oryantal (kudüm/darbuka) karakter: düm derin, perdesi hafif aşağı kayan; tek tiz ve kuru; te/ke tekin hafifi.

/**
 * Süre kuralı: her vuruş kendi süresinin (`sure × 60 / bpm` sn) %90'ı boyunca tınlar, sonra hızla söner.
 * - `.clip(HOLD_FRACTION)`: superdough'un tutma süresi olayın süresinin %90'ı olur (Hap.duration × clip).
 * - `.decay("<vuruşlarla hizalı>")`: genlik saldırıdan sonra tutma boyunca doğrusal olarak sustain düzeyine iner;
 *   2 zamanlık düm 1 zamanlık vuruşun iki katı uzun "düüüm" diye duyulur, tık + sessizlik değil.
 * - `.release(RELEASE_S)`: tutma bitince 20 ms'de sıfıra iner. Ses vuruş süresinin %90'ı + 20 ms (+ superdough'un
 *   10 ms durdurma payı) içinde biter; vuruş en az 0.3 sn sürdükçe (usul ♪ = 200'e kadar) sonraki vuruşa taşmaz.
 */
const HOLD_FRACTION = 0.9
const ATTACK_S = 0.002
const RELEASE_S = 0.02

/** Düm gövdesi: sinüs; perde zarfı ~110 Hz'den 65 Hz'e ~120 ms'de iner (vurulan derinin gerilimi gevşer). */
const DUM_HZ = 65
const DUM_START_HZ = 110
/** Perde zarfı yarım ton cinsindendir (superdough `penv`): 12 · log2(110 / 65) ≈ 9.11. */
const DUM_PENV = Math.round(1200 * Math.log2(DUM_START_HZ / DUM_HZ)) / 100
const DUM_PDECAY_S = 0.12
/** Tutma boyunca inilen düzey: düm belirgin biçimde tınlar. */
const DUM_SUSTAIN = 0.3
const DUM_GAIN = 0.9
/** Düm'ün başındaki kısa, alçak geçiren filtreli gürültü: elin deriye çarpması (~15 ms), sıcak tını için yumuşatılmış. */
const DUM_SKIN_LPF = 1200
const DUM_SKIN_DECAY_S = 0.015
const DUM_SKIN_GAIN = 0.5

/** Tek: kısa, tiz rezonans tonu (~450 Hz) + bant geçiren filtreli kuru gürültü tıkı (~3 kHz). */
const TEK_HZ = 450
/** Tek düm'den az tınlar. */
const TEK_SUSTAIN = 0.1
const TEK_TONE_GAIN = 0.35
const TEK_CLICK_BPF = 3000
const TEK_CLICK_Q = 3
const TEK_CLICK_DECAY_S = 0.03
const TEK_CLICK_GAIN = 0.8
/** te ve ke, tek'in aynı sesinin daha kısık halidir. */
const LEVEL: Record<Exclude<VurusSesi, 'düm'>, number> = { tek: 1, te: 0.7, ke: 0.6 }

/** Metronom (vuruş kalıbı olmayan usul): vurgulu ilk tık yüksek ve gür, diğerleri alçak ve hafif. */
const CLICK_ACCENT_HZ = 1200
const CLICK_HZ = 800
const CLICK_ACCENT_GAIN = 0.9
const CLICK_GAIN = 0.5
/** Tık uzunluğu bir zamanın bu kesridir (♪ = 60'ta 0.3 sn, ♪ = 120'de 0.15 sn): hızla birlikte kısalır. */
const CLICK_FRACTION = 0.3

/** Mini-notasyon adımı: ağırlık (@n) süreyi belirler. */
const step = (value: string | number, sure: number) => `${value}@${sure}`
const REST = '~'
const NOISE = 'white'
/** Kod içinde ms çözünürlüğü yeter; kayan nokta artığı (1.2000000000000002) yazılmaz. */
const ms = (seconds: number) => Math.round(seconds * 1000) / 1000
/** Bir zamanın saniye cinsinden süresi; `bpm` mertebe birimine göredir. */
const zamanSeconds = (bpm: number) => 60 / bpm

/** Kısa tıklar (deri, tek tıkı) için: süreden bağımsız kısa sönme, aynı tutma/bırakma sınırı. */
const shortEnvelope = (decay: number) =>
  `.attack(0.001).decay(${decay}).sustain(0).clip(${HOLD_FRACTION}).release(${RELEASE_S})`

function metronomeCode(u: Usul, bpm: number): string {
  const freqs = Array.from({ length: u.zaman }, (_, i) => step(i === 0 ? CLICK_ACCENT_HZ : CLICK_HZ, 1))
  const gains = Array.from({ length: u.zaman }, (_, i) => step(i === 0 ? CLICK_ACCENT_GAIN : CLICK_GAIN, 1))
  const decay = ms(CLICK_FRACTION * zamanSeconds(bpm))
  return (
    `freq("${freqs.join(' ')}").s("sine").attack(${ATTACK_S}).decay(${decay}).sustain(0)` +
    `.clip(${HOLD_FRACTION}).release(${RELEASE_S}).gain("${gains.join(' ')}")`
  )
}

function strokeCode(u: Usul, bpm: number): string {
  const vurus = u.vurus!
  const pat = (f: (x: Vurus) => string | number) => `"${vurus.map((x) => step(f(x), x.sure)).join(' ')}"`
  const isDum = (x: Vurus) => x.ses === 'düm'
  const level = (x: Vurus, base: number) => (isDum(x) ? REST : ms(base * LEVEL[x.ses as Exclude<VurusSesi, 'düm'>]))
  // Vuruşlarla hizalı sönme deseni: 0.9 × vuruş süresi (sn).
  const decay = pat((x) => ms(HOLD_FRACTION * x.sure * zamanSeconds(bpm)))
  const ring = `.attack(${ATTACK_S}).decay(${decay}).clip(${HOLD_FRACTION}).release(${RELEASE_S})`

  const dumBody =
    `freq(${pat((x) => (isDum(x) ? DUM_HZ : REST))}).s("sine")` +
    `.penv(${DUM_PENV}).pattack(0.001).pdecay(${DUM_PDECAY_S}).psustain(0)` +
    `${ring}.sustain(${DUM_SUSTAIN}).gain(${DUM_GAIN})`
  const dumSkin =
    `s(${pat((x) => (isDum(x) ? NOISE : REST))}).lpf(${DUM_SKIN_LPF})` +
    `${shortEnvelope(DUM_SKIN_DECAY_S)}.gain(${DUM_SKIN_GAIN})`
  const tekTone =
    `freq(${pat((x) => (isDum(x) ? REST : TEK_HZ))}).s("sine")` +
    `${ring}.sustain(${TEK_SUSTAIN}).gain(${pat((x) => level(x, TEK_TONE_GAIN))})`
  const tekClick =
    `s(${pat((x) => (isDum(x) ? REST : NOISE))}).bpf(${TEK_CLICK_BPF}).bpq(${TEK_CLICK_Q})` +
    `${shortEnvelope(TEK_CLICK_DECAY_S)}.gain(${pat((x) => level(x, TEK_CLICK_GAIN))})`
  return `stack(${dumBody}, ${dumSkin}, ${tekTone}, ${tekClick})`
}

/**
 * Tek usul ölçüsünün deseni (tempo yok): bir döngü = bir ölçü. Dolap'ta metronom.
 * `bpm` (mertebe birimi) yalnızca seslerin saniye cinsinden sönme sürelerini belirler.
 */
export function buildUsulBody(u: Usul, bpm: number): string {
  return u.vurus === null ? metronomeCode(u, bpm) : strokeCode(u, bpm)
}

/**
 * Bir döngü = bir usul ölçüsü. `bpm` mertebe birimine göredir (dakikada bpm birim),
 * dolayısıyla dakikada bpm / zaman ölçü: `.cpm(bpm / zaman)`.
 * Vuruş kalıbı olmayan usul (Dolap) metronom olarak çalar: zaman başına bir tık, ilki vurgulu.
 */
export function buildUsulPatternCode(u: Usul, bpm: number): string {
  if (!(bpm > 0) || !(u.zaman > 0)) throw new RangeError('Geçerli tempo yok')
  return `${buildUsulBody(u, bpm)}.cpm(${bpm / u.zaman})`
}

/** Her başlatma/durdurmada artar; sesi açmayı beklerken durdurulan ya da yenisi başlatılan çağrı bayatlığını anlar. */
let token = 0

/** Dokunuş işleyicisinden çağrılır: unlockAudio eşzamanlı çalışır; çalan her şey durur, yalnızca bu döngü çalar. */
export async function startUsul(u: Usul, bpm: number): Promise<void> {
  const mine = ++token
  const code = buildUsulPatternCode(u, bpm)
  await unlockAudio()
  if (mine !== token) return
  await playLoop(code)
}

export function stopUsul(): void {
  token++
  stopAudio()
}
