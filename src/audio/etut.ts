import type { Usul } from '../content/usuller'
import type { Tuning } from '../music/ahenk'
import type { MusicEvent } from '../music/notation'
import { melodyChain, ONE_SHOT, toneSteps, toToneEvents } from './pattern'
import type { NeySesi } from './pattern'
import { buildUsulBody, metronomeBody } from './usul'

/** Usulsüz etütler 4/4'tür: bir metronom ölçüsü 4 tıktır. */
const OLCU_VURUS = 4

/**
 * Etüdün tamamı tek döngüdür: giriş sayımı (bir ölçü tık) + etüt ölçüleri; `.cpm(bpm / toplamVuruş)` ile tek seferlik
 * (`buildPieceCode` deseni), `bpm` dörtlük sayar.
 * - Ölçü vuruşu usulsüz etütte 4, `usul` verilince `usul.zaman`'dır; giriş sayımı bu kadar tık sürer.
 * - `melodi`: giriş sayımından sonra başlar (başa bir ölçülük sus).
 * - `metronom`: eşlik bütün süre boyunca çalar; kapalıysa yalnız giriş sayımı tıklar (`.compress` ile döngünün ilk
 *   ölçüsüne sıkıştırılır). Usulsüz etütte eşlik metronomdur. Usullü etütte giriş sayımı yine tıktır, eşlik ise
 *   melodiyle birlikte başlayan usul sesidir (`buildUsulBody`; ölçü deseni `.fast` ile çoğaltılıp sayımdan sonraki
 *   bölüme `.compress` edilir, her usul ölçüsü bir etüt ölçüsüne denk gelir).
 * - `melodi: false`: yalnız eşlik ("Metronomla çal" / "Usulle çal": kullanıcı neyle kendisi çalar).
 * Tık Dolap metronomuyla aynı sestir (`metronomeBody`), ilk tık vurgulu.
 */
export function buildEtutCode(
  olcu: MusicEvent[][],
  tuning: Tuning,
  bpm: number,
  opts: { melodi: boolean; metronom: boolean; voice: NeySesi; usul?: Usul },
): { code: string; durationMs: number } {
  if (!opts.melodi && !opts.metronom) throw new RangeError('Çalınacak melodi ya da metronom seçilmedi')
  const tones = toToneEvents(olcu.flat(), tuning)
  const total = tones.reduce((sum, e) => sum + e.beats, 0)
  if (!(total > 0) || !(bpm > 0)) throw new RangeError('Çalınacak ses ya da geçerli tempo yok')
  const olcuVurus = opts.usul ? opts.usul.zaman : OLCU_VURUS
  if (!(olcuVurus > 0)) throw new RangeError('Geçerli ölçü zamanı yok')
  /** Giriş sayımı bir ölçü; melodi bundan sonra başlar. */
  const giris = olcuVurus
  const cycle = giris + total
  const tempo = `${ONE_SHOT}.cpm(${bpm / cycle})`
  const durationMs = (cycle * 60000) / bpm

  const click = metronomeBody(olcuVurus, bpm)
  const sayim = `${click}.compress(0, ${giris} / ${cycle})`
  const layers: string[] = []
  if (opts.melodi) layers.push(`freq("~@${giris} ${toneSteps(tones)}")${melodyChain(opts.voice, tones, { lead: giris, bpm })}`)
  if (!opts.metronom) layers.push(sayim)
  else if (!opts.usul) layers.push(`${click}.fast(${cycle / olcuVurus})`)
  else layers.push(sayim, `${buildUsulBody(opts.usul, bpm)}.fast(${total / olcuVurus}).compress(${giris} / ${cycle}, 1)`)
  return { code: `${layers.length > 1 ? `stack(${layers.join(', ')})` : layers[0]}${tempo}`, durationMs }
}
