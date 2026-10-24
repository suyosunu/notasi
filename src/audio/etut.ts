import type { Tuning } from '../music/ahenk'
import type { MusicEvent } from '../music/notation'
import { melodyChain, ONE_SHOT, toneSteps, toToneEvents } from './pattern'
import type { NeySesi } from './pattern'
import { metronomeBody } from './usul'

/** Etütler 4/4'tür: bir metronom ölçüsü 4 tıktır. */
const OLCU_VURUS = 4
/** Giriş sayımı bir ölçü (4 tık); melodi bundan sonra başlar. */
const GIRIS_VURUS = OLCU_VURUS

/**
 * Etüdün tamamı tek döngüdür: giriş sayımı (bir ölçü tık) + etüt ölçüleri; `.cpm(bpm / toplamVuruş)` ile tek seferlik
 * (`buildPieceCode` deseni), `bpm` dörtlük sayar.
 * - `melodi`: giriş sayımından sonra başlar (başa 4 vuruşluk sus).
 * - `metronom`: tık bütün süre boyunca çalar; kapalıysa tık yalnız giriş sayımındadır (`.compress` ile döngünün
 *   ilk ölçüsüne sıkıştırılır).
 * - `melodi: false`: yalnız metronom ("Metronomla çal": kullanıcı neyle kendisi eşlik eder).
 * Tık Dolap metronomuyla aynı sestir (`metronomeBody`), ilk tık vurgulu.
 */
export function buildEtutCode(
  olcu: MusicEvent[][],
  tuning: Tuning,
  bpm: number,
  opts: { melodi: boolean; metronom: boolean; voice: NeySesi },
): { code: string; durationMs: number } {
  if (!opts.melodi && !opts.metronom) throw new RangeError('Çalınacak melodi ya da metronom seçilmedi')
  const tones = toToneEvents(olcu.flat(), tuning)
  const total = tones.reduce((sum, e) => sum + e.beats, 0)
  if (!(total > 0) || !(bpm > 0)) throw new RangeError('Çalınacak ses ya da geçerli tempo yok')
  const cycle = GIRIS_VURUS + total
  const tempo = `${ONE_SHOT}.cpm(${bpm / cycle})`
  const durationMs = (cycle * 60000) / bpm

  const click = metronomeBody(OLCU_VURUS, bpm)
  const layers: string[] = []
  if (opts.melodi) layers.push(`freq("~@${GIRIS_VURUS} ${toneSteps(tones)}")${melodyChain(opts.voice)}`)
  layers.push(opts.metronom ? `${click}.fast(${cycle / OLCU_VURUS})` : `${click}.compress(0, ${GIRIS_VURUS} / ${cycle})`)
  return { code: `${layers.length > 1 ? `stack(${layers.join(', ')})` : layers[0]}${tempo}`, durationMs }
}
