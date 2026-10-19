import type { Usul, VurusSesi } from '../content/usuller'
import { playLoop, stopAudio, unlockAudio } from './player'

// Kulakla ayarlanabilir ses parametreleri. Örnek ses dosyası yoktur: yalnızca sentez (sine) ve gürültü (white).
/** Düm: alçak, kısa sönümlü sinüs. */
const DUM_HZ = 70
const DUM_CHAIN = '.s("sine").attack(0.001).decay(0.3).sustain(0).gain(0.9)'
/** Tek, te, ke: kısa, tiz gürültü vuruşu. */
const NOISE = 'white'
const NOISE_CHAIN = '.decay(0.06).sustain(0).hpf(2000)'
const NOISE_GAIN: Record<Exclude<VurusSesi, 'düm'>, number> = { tek: 0.5, te: 0.35, ke: 0.35 }
/** Metronom (vuruş kalıbı olmayan usul): vurgulu ilk tık yüksek ve gür, diğerleri alçak ve hafif. */
const CLICK_ACCENT_HZ = 1200
const CLICK_HZ = 800
const CLICK_ACCENT_GAIN = 0.9
const CLICK_GAIN = 0.5
const CLICK_CHAIN = '.s("sine").attack(0.001).decay(0.04).sustain(0)'

/** Mini-notasyon adımı: ağırlık (@n) süreyi belirler. */
const step = (value: string | number, sure: number) => `${value}@${sure}`
const REST = '~'

function metronomeCode(u: Usul): string {
  const freqs = Array.from({ length: u.zaman }, (_, i) => step(i === 0 ? CLICK_ACCENT_HZ : CLICK_HZ, 1))
  const gains = Array.from({ length: u.zaman }, (_, i) => step(i === 0 ? CLICK_ACCENT_GAIN : CLICK_GAIN, 1))
  return `freq("${freqs.join(' ')}")${CLICK_CHAIN}.gain("${gains.join(' ')}")`
}

function strokeCode(u: Usul): string {
  const vurus = u.vurus!
  const dum = vurus.map((x) => step(x.ses === 'düm' ? DUM_HZ : REST, x.sure)).join(' ')
  const noise = vurus.map((x) => step(x.ses === 'düm' ? REST : NOISE, x.sure)).join(' ')
  const noiseGain = vurus.map((x) => step(x.ses === 'düm' ? REST : NOISE_GAIN[x.ses], x.sure)).join(' ')
  return `stack(freq("${dum}")${DUM_CHAIN}, s("${noise}")${NOISE_CHAIN}.gain("${noiseGain}"))`
}

/** Tek usul ölçüsünün deseni (tempo yok): bir döngü = bir ölçü. Dolap'ta metronom. */
export function buildUsulBody(u: Usul): string {
  return u.vurus === null ? metronomeCode(u) : strokeCode(u)
}

/**
 * Bir döngü = bir usul ölçüsü. `bpm` mertebe birimine göredir (dakikada bpm birim),
 * dolayısıyla dakikada bpm / zaman ölçü: `.cpm(bpm / zaman)`.
 * Vuruş kalıbı olmayan usul (Dolap) metronom olarak çalar: zaman başına bir tık, ilki vurgulu.
 */
export function buildUsulPatternCode(u: Usul, bpm: number): string {
  if (!(bpm > 0) || !(u.zaman > 0)) throw new RangeError('Geçerli tempo yok')
  return `${buildUsulBody(u)}.cpm(${bpm / u.zaman})`
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
