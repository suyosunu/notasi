import type { Parca } from '../content/parcalar'
import { USULLER } from '../content/usuller'
import type { Usul } from '../content/usuller'
import type { Tuning } from '../music/ahenk'
import { beats } from '../music/notation'
import { ONE_SHOT, SOUND_CHAIN, toneSteps, toToneEvents } from './pattern'
import { buildUsulBody } from './usul'

/** Bir usul ölçüsünün dörtlük vuruş cinsinden süresi (Sofyan 4/4 → 4, Dolap 12/8 → 6). */
export function measureBeats(u: Usul): number {
  return (u.zaman * 4) / u.mertebe
}

/** Dörtlük bpm'i usulün mertebe birimine çevirir (mertebe 8 → ×2, mertebe 4 → ×1). */
export function usulBpm(quarterBpm: number, u: Usul): number {
  return (quarterBpm * u.mertebe) / 4
}

/**
 * Parçanın tamamı tek döngüdür: melodi (bağlar birleşik ToneEvent'ler) ve isteğe bağlı usul katmanı
 * aynı `stack` içinde, tek seferlik maskeyle ve `.cpm(bpm / toplamVuruş)` ile çalar; `bpm` dörtlük sayar.
 *
 * Usul katmanı bir ölçülük usul desenini `.fast(n)` ile döngüye n kez yerleştirir. Tempo ayrıca verilmez:
 * bir usul ölçüsü `measureBeats` dörtlük sürer, yani usul `usulBpm(bpm)` mertebe biriminde, dakikada
 * `usulBpm / zaman = bpm / measureBeats` ölçü çalar. İlk ölçü tam usul ölçüsünden kısaysa (anacrusis) usul
 * ilk tam ölçüde başlar: katman `.compress(a / T, 1)` ile döngünün o kısmına sıkıştırılır, öncesi sessizdir.
 * Vuruş kalıbı olmayan usul (Dolap) metronom olarak çalar.
 */
export function buildPieceCode(
  parca: Parca,
  tuning: Tuning,
  bpm: number,
  withUsul: boolean,
): { code: string; durationMs: number } {
  const tones = toToneEvents(parca.olcu.flat(), tuning)
  const total = tones.reduce((sum, e) => sum + e.beats, 0)
  if (!(total > 0) || !(bpm > 0)) throw new RangeError('Çalınacak ses ya da geçerli tempo yok')
  const melody = `freq("${toneSteps(tones)}")${SOUND_CHAIN}`
  const tempo = `${ONE_SHOT}.cpm(${bpm / total})`
  const durationMs = (total * 60000) / bpm
  if (!withUsul) return { code: `${melody}${tempo}`, durationMs }

  const usul = USULLER.find((u) => u.id === parca.usul)
  if (!usul) throw new RangeError(`Bilinmeyen usul: ${parca.usul}`)
  const measure = measureBeats(usul)
  const first = (parca.olcu[0] ?? []).reduce((sum, e) => sum + beats(e), 0)
  const lead = first < measure ? first : 0
  const repeats = (total - lead) / measure
  const shift = lead > 0 ? `.compress(${lead} / ${total}, 1)` : ''
  const layer = `${buildUsulBody(usul)}.fast(${repeats})${shift}`
  return { code: `stack(${melody}, ${layer})${tempo}`, durationMs }
}
