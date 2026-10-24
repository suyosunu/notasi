import type { Usul, Vurus, VurusSesi } from '../content/usuller'
import { ONE_SHOT } from './pattern'
import { playLoop, stopAudio, unlockAudio } from './player'
import { getUsulSesi, strokeSound } from './usulSamples'
import type { KayitSesi, UsulSesi } from './usulSamples'

// Kulakla ayarlanabilir ses parametreleri. "Oryantal" seçenekte örnek ses dosyası yoktur: yalnızca sentez (sine,
// triangle) ve gürültü (white). Oryantal (kudüm/darbuka) karakter: düm derin, perdesi hafif aşağı kayan; tek tiz ve
// kuru; te/ke tekin hafifi. Konga, Tahta ve Darbuka seçenekleri kayıt çalar (bkz. usulSamples.ts, sampleCode).

/**
 * Süre kuralı: her vuruş kendi süresinin (d = `sure × 60 / bpm` sn) ~%90'ı boyunca tınlar, sonra hızla söner.
 * - `.clip("<vuruşlarla hizalı>")`: superdough'un tutma süresi Hap.duration × clip olur.
 * - `.decay("<vuruşlarla hizalı>")`: genlik saldırıdan sonra tutmanın tamamı boyunca doğrusal olarak sustain düzeyine
 *   iner; 2 zamanlık düm 1 zamanlık vuruşun iki katı uzun "düüüm" diye duyulur, tık + sessizlik değil.
 * - `.release("<vuruşlarla hizalı>")`: tutma bitince en çok 20 ms'de sıfıra iner.
 * Tutma ve bırakma süreden türetilir (`envelope`): tutma + bırakma + superdough'un 10 ms durdurma payı + 5 ms güvenlik
 * payı ≤ d. Böylece hiçbir tempoda ses sonraki vuruşa taşmaz (en kısa vuruş, parçada Dolap ♩ = 100: d = 0.3 sn).
 */
const HOLD_FRACTION = 0.9
const ATTACK_S = 0.002
const RELEASE_S = 0.02
/** superdough bırakmayı en az 10 ms yapar (getADSRValues). */
const RELEASE_MIN_S = 0.01
/** superdough sesi bırakmadan 10 ms sonra durdurur; üstüne 5 ms güvenlik payı. */
const STOP_PAD_S = 0.01
const MARGIN_S = 0.005

/**
 * Düm: derin, perdesi hafif aşağı kayan iki gövde (alçak sinüs + orta üçgen) + deri vuruşu.
 * Alçak gövde 65 Hz'dir (kudüm derinliği), ama telefon hoparlörü ~300 Hz'in altını neredeyse hiç vermez; yalnız onunla
 * telefonda sadece deri tıkı duyulurdu. Bu yüzden aynı perde zarfı ve aynı süre zarfıyla 250 Hz'lik orta gövde eklenir.
 * Orta gövde üçgendir: tek harmonikleri (~750 Hz, ~1250 Hz) küçük hoparlörde de çıkar ve kulak perdeyi onlardan çıkarır.
 */
const DUM_HZ = 65
const DUM_START_HZ = 110
/** Orta gövde (telefon hoparlörü için): alçak gövdeyle aynı oranda kayar, ~423 Hz'den 250 Hz'e. */
const DUM_MID_HZ = 250
const DUM_MID_WAVE = 'triangle'
/** Perde zarfı yarım ton cinsindendir (superdough `penv`): 12 · log2(110 / 65) ≈ 9.11; iki gövdede aynı. */
const DUM_PENV = Math.round(1200 * Math.log2(DUM_START_HZ / DUM_HZ)) / 100
const DUM_PDECAY_S = 0.12
/** Tutma sonundaki düzey: düşük, böylece düm davul gibi baştan sona söner; sonda org gibi kesilmez. */
const DUM_SUSTAIN = 0.08
/**
 * Taşma payı: düm'ün başında üç katman üst üste biner (alçak + orta + deri = 0.4 + 0.55 + 0.25 = 1.2).
 * Alçak gövde telefonda zaten duyulmadığı için kısıktır; orta gövde en baskın katmandır.
 */
const DUM_LOW_GAIN = 0.4
const DUM_MID_GAIN = 0.55
/** Düm'ün başındaki gürültü: elin deriye çarpması (~25 ms); 2.5 kHz'e kadar açık, telefonda da duyulsun. */
const DUM_SKIN_LPF = 2500
const DUM_SKIN_DECAY_S = 0.025
const DUM_SKIN_GAIN = 0.25

/** Tek: kısa, tiz rezonans tonu (~450 Hz) + bant geçiren filtreli kuru gürültü tıkı (~3 kHz). */
const TEK_HZ = 450
/** Ton, vuruş süresinden bağımsız kısadır (≤ 120 ms): tek kuru kalır. */
const TEK_TONE_DECAY_S = 0.1
const TEK_TONE_GAIN = 0.35
const TEK_CLICK_BPF = 3000
const TEK_CLICK_Q = 3
const TEK_CLICK_DECAY_S = 0.03
const TEK_CLICK_GAIN = 0.8
/** Tek'in süreye uyan tınısı: geniş bantlı, alçak düzeyli gürültü (gövdenin titreşimi); düm'den az tınlar. */
const TEK_RING_BPF = 1800
const TEK_RING_Q = 1
const TEK_RING_GAIN = 0.15
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
/** Aşağı yuvarlar (sınırı aşmasın); kayan nokta artığı için küçük bir tolerans. */
const floorTo = (x: number, k: number) => Math.floor(x * k + 1e-9) / k
/** Bir zamanın saniye cinsinden süresi; `bpm` mertebe birimine göredir. */
const zamanSeconds = (bpm: number) => 60 / bpm

interface Envelope {
  /** Tutma süresi (sn) = süreye uyan katmanların sönme süresi. */
  hold: number
  /** Tutma / vuruş süresi (superdough `clip`). */
  clip: number
  release: number
}

/** `d` sn süren vuruşun zarfı: tutma ≤ 0.9 · d ve tutma + bırakma + durdurma + güvenlik payı ≤ d. */
function envelope(d: number): Envelope {
  const pad = STOP_PAD_S + MARGIN_S
  const release = Math.min(RELEASE_S, Math.max(RELEASE_MIN_S, floorTo((1 - HOLD_FRACTION) * d - pad, 1000)))
  const clip = floorTo(Math.min(HOLD_FRACTION, (d - release - pad) / d), 10000)
  return { hold: floorTo(clip * d, 1000), clip, release }
}

function metronomeCode(u: Usul, bpm: number): string {
  const freqs = Array.from({ length: u.zaman }, (_, i) => step(i === 0 ? CLICK_ACCENT_HZ : CLICK_HZ, 1))
  const gains = Array.from({ length: u.zaman }, (_, i) => step(i === 0 ? CLICK_ACCENT_GAIN : CLICK_GAIN, 1))
  const d = zamanSeconds(bpm)
  const env = envelope(d)
  const decay = Math.min(ms(CLICK_FRACTION * d), env.hold)
  return (
    `freq("${freqs.join(' ')}").s("sine").attack(${ATTACK_S}).decay(${decay}).sustain(0)` +
    `.clip(${env.clip}).release(${env.release}).gain("${gains.join(' ')}")`
  )
}

function strokeCode(u: Usul, bpm: number): string {
  const vurus = u.vurus!
  const pat = (f: (x: Vurus) => string | number) => `"${vurus.map((x) => step(f(x), x.sure)).join(' ')}"`
  const isDum = (x: Vurus) => x.ses === 'düm'
  const level = (x: Vurus, base: number) => (isDum(x) ? REST : ms(base * LEVEL[x.ses as Exclude<VurusSesi, 'düm'>]))
  const env = (x: Vurus) => envelope(x.sure * zamanSeconds(bpm))
  // Vuruşlarla hizalı tutma/bırakma (her katmanda) ve süreye uyan sönme (≈ 0.9 × vuruş süresi).
  const gate = `.clip(${pat((x) => env(x).clip)}).release(${pat((x) => env(x).release)})`
  const ring = `.attack(${ATTACK_S}).decay(${pat((x) => env(x).hold)})${gate}`
  /** Süreden bağımsız kısa sönme (deri, tık, tek tonu); tutma/bırakma sınırı aynı. */
  const short = (decay: number) => `.attack(0.001).decay(${decay}).sustain(0)${gate}`
  const pitchDrop = `.penv(${DUM_PENV}).pattack(0.001).pdecay(${DUM_PDECAY_S}).psustain(0)`

  const dumLow =
    `freq(${pat((x) => (isDum(x) ? DUM_HZ : REST))}).s("sine")${pitchDrop}` +
    `${ring}.sustain(${DUM_SUSTAIN}).gain(${DUM_LOW_GAIN})`
  const dumMid =
    `freq(${pat((x) => (isDum(x) ? DUM_MID_HZ : REST))}).s("${DUM_MID_WAVE}")${pitchDrop}` +
    `${ring}.sustain(${DUM_SUSTAIN}).gain(${DUM_MID_GAIN})`
  const dumSkin =
    `s(${pat((x) => (isDum(x) ? NOISE : REST))}).lpf(${DUM_SKIN_LPF})` +
    `${short(DUM_SKIN_DECAY_S)}.gain(${DUM_SKIN_GAIN})`
  const tekTone =
    `freq(${pat((x) => (isDum(x) ? REST : TEK_HZ))}).s("sine")` +
    `${short(TEK_TONE_DECAY_S)}.gain(${pat((x) => level(x, TEK_TONE_GAIN))})`
  const tekClick =
    `s(${pat((x) => (isDum(x) ? REST : NOISE))}).bpf(${TEK_CLICK_BPF}).bpq(${TEK_CLICK_Q})` +
    `${short(TEK_CLICK_DECAY_S)}.gain(${pat((x) => level(x, TEK_CLICK_GAIN))})`
  const tekRing =
    `s(${pat((x) => (isDum(x) ? REST : NOISE))}).bpf(${TEK_RING_BPF}).bpq(${TEK_RING_Q})` +
    `${ring}.sustain(0).gain(${pat((x) => level(x, TEK_RING_GAIN))})`
  return `stack(${dumLow}, ${dumMid}, ${dumSkin}, ${tekTone}, ${tekClick}, ${tekRing})`
}

/**
 * Kayıt seçeneklerinde vuruş düzeyleri: tek düm'ün 0.85'i; te ve ke, tek kaydının 0.7× ve 0.6× düzeyi.
 * Kayıtlar tepe düzeyi -1 dBFS'e normalleştirilmiştir.
 */
const SAMPLE_LEVEL: Record<VurusSesi, number> = { düm: 1, tek: 0.85, te: 0.85 * 0.7, ke: 0.85 * 0.6 }
/**
 * Sese özgü genel düzey: gürlük oryantal sesle yakın olsun diye. Kulakla ayarlanabilir. Başlangıç değerleri düm
 * kayıtlarının ilk 300 ms RMS düzeyinden (konga -14.7, darbuka -12.4, tahta -22.6 dBFS) oryantal düm'ün kestirilen
 * ~-18.6 dBFS düzeyine göre hesaplandı; tahta 1'de sınırlandı (ahşap tık tiz olduğundan zaten belirgin duyulur).
 */
const SAMPLE_GAIN: Record<KayitSesi, number> = { konga: 0.65, tahta: 1, darbuka: 0.5 }
/** Düzey oranları (0.7, 0.6) yuvarlamada bozulmasın. */
const gainRound = (x: number) => Math.round(x * 10000) / 10000

/**
 * Kayıt seçenekleri (Konga, Tahta, Darbuka): tek katman, her vuruş kendi kaydını çalar (`usulSamples.strokeSound`).
 * Kayıt doğal uzunluğu kadar tınlar (döngü yok); vuruştan uzunsa oryantal sesle aynı `envelope(d)` sınırıyla
 * (`clip`/`release`) sonraki vuruştan önce kesilir.
 */
function sampleCode(u: Usul, bpm: number, ses: KayitSesi): string {
  const vurus = u.vurus!
  const pat = (f: (x: Vurus) => string | number) => `"${vurus.map((x) => step(f(x), x.sure)).join(' ')}"`
  const env = (x: Vurus) => envelope(x.sure * zamanSeconds(bpm))
  return (
    `s(${pat((x) => strokeSound(ses, x.ses))})` +
    `.clip(${pat((x) => env(x).clip)}).release(${pat((x) => env(x).release)})` +
    `.gain(${pat((x) => gainRound(SAMPLE_GAIN[ses] * SAMPLE_LEVEL[x.ses]))})`
  )
}

/**
 * Tek usul ölçüsünün deseni (tempo yok): bir döngü = bir ölçü. Dolap'ta metronom (her seçenekte sentez tık:
 * metronom usul vuruşu değildir).
 * `bpm` (mertebe birimi) yalnızca seslerin saniye cinsinden sönme sürelerini belirler. `ses` verilmezse seçili usul
 * sesi kullanılır.
 */
export function buildUsulBody(u: Usul, bpm: number, ses: UsulSesi = getUsulSesi()): string {
  if (u.vurus === null) return metronomeCode(u, bpm)
  return ses === 'oryantal' ? strokeCode(u, bpm) : sampleCode(u, bpm, ses)
}

/**
 * Bir döngü = bir usul ölçüsü. `bpm` mertebe birimine göredir (dakikada bpm birim),
 * dolayısıyla dakikada bpm / zaman ölçü: `.cpm(bpm / zaman)`.
 * Vuruş kalıbı olmayan usul (Dolap) metronom olarak çalar: zaman başına bir tık, ilki vurgulu.
 */
export function buildUsulPatternCode(u: Usul, bpm: number, ses: UsulSesi = getUsulSesi()): string {
  if (!(bpm > 0) || !(u.zaman > 0)) throw new RangeError('Geçerli tempo yok')
  return `${buildUsulBody(u, bpm, ses)}.cpm(${bpm / u.zaman})`
}

/** Usulün tek bir ölçüsü, tek seferlik (Ayarlar → Usul sesi → "▶ Dene"); `playCode` ile çalınır. */
export function buildUsulOnceCode(u: Usul, bpm: number, ses: UsulSesi): { code: string; durationMs: number } {
  if (!(bpm > 0) || !(u.zaman > 0)) throw new RangeError('Geçerli tempo yok')
  return {
    code: `${buildUsulBody(u, bpm, ses)}${ONE_SHOT}.cpm(${bpm / u.zaman})`,
    durationMs: (u.zaman * 60000) / bpm,
  }
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
