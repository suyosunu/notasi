import type { Usul } from '../content/usuller'
import type { Tuning } from '../music/ahenk'
import { beats } from '../music/notation'
import type { MusicEvent } from '../music/notation'
import { melodyChain, ONE_SHOT, toneSteps, toToneEvents } from './pattern'
import type { NeySesi } from './pattern'
import { ISARET_SESI } from './sesSaati'
import { buildUsulBody, metronomeBody } from './usul'
import { getUsulSesi } from './usulSamples'
import type { UsulSesi } from './usulSamples'

/** Usulsüz çalışmalar 4/4'tür: bir metronom ölçüsü 4 tıktır. */
const USULSUZ_OLCU_VURUSU = 4
/** Ses saati işareti: başa tek bir kısa sessiz örnek. */
const ISARET_KATMANI = `s("${ISARET_SESI}")`
/** Kayan nokta artığı payı (üçleme toplamları 2.9999999 çıkabilir). */
const PAY = 1e-6

/**
 * Eşlik: `usul` usul sesidir (usulsüz çağrıda `metronom` gibi davranır), `metronom` bütün süre boyunca tıktır,
 * `yok` yalnız giriş sayımını tıklar.
 */
export type Eslik = 'usul' | 'metronom' | 'yok'

export interface CalismaSecenek {
  /** false: yalnız eşlik ("Usulle/Metronomla çal": kullanıcı neyle çalar). */
  melodi: boolean
  /** 'yok': yalnız giriş sayımı tıklar. 'usul' usulsüz çağrıda 'metronom' gibi davranır. */
  eslik: Eslik
  voice: NeySesi
  usul?: Usul
  /** Verilmezse Ayarlar'daki seçim (getUsulSesi()). */
  usulSesi?: UsulSesi
  /** Varsayılan true: başa ses saati işareti katmanı (`s("notasi_isaret")`). */
  isaret?: boolean
}

export interface CalismaKodu {
  code: string
  durationMs: number
  /** Giriş sayımı (dörtlük). */
  girisVurus: number
  /** Seçili ölçülerin toplamı (dörtlük). */
  toplamVurus: number
}

/** Bir usul ölçüsünün dörtlük vuruş cinsinden süresi (Sofyan 4/4 → 4, Dolap 12/8 → 6, Aksak 9/8 → 4.5). */
export function measureBeats(u: Usul): number {
  return (u.zaman * 4) / u.mertebe
}

/** Çalışmanın bir ölçüsü kaç dörtlüktür: usullüde `measureBeats`, usulsüzde 4. Giriş sayımı da bu kadardır. */
export function olcuVurusu(usul?: Usul): number {
  return usul ? measureBeats(usul) : USULSUZ_OLCU_VURUSU
}

/**
 * Etüt ve parça çalışmasının tek kod üreticisi. Her çalım tek döngüdür: giriş sayımı (bir ölçü tık) + verilen ölçüler;
 * `.cpm(bpm / (giriş + toplam vuruş))` ile tek seferlik (`ONE_SHOT`), `bpm` dörtlük sayar.
 * - `melodi`: giriş sayımından sonra başlar (başa bir ölçülük sus).
 * - Sayım Dolap metronomuyla aynı sestir (`metronomeBody`), ilk tık vurgulu; usullüde tık usulün biriminde
 *   (`bpm · mertebe / 4`) ve `usul.zaman` tıktır, yani 9/8'de sayım 4.5 dörtlüktür.
 * - `eslik: 'metronom'` (ya da usulsüz `'usul'`): tık bütün süre boyunca çalar; sayım ayrıca eklenmez.
 * - `eslik: 'usul'` (usul var): sayımdan sonra usul sesi (`buildUsulBody`; ölçü deseni `.fast` ile çoğaltılıp sayımdan
 *   sonraki bölüme `.compress` edilir). İlk ölçü tam usul ölçüsünden kısaysa (anacrusis) usul ilk tam ölçüde başlar.
 *   Vuruş kalıbı olmayan usul (Dolap) metronom olarak çalar. Bir usul ölçüsü `measureBeats` dörtlük sürer; sesler
 *   saniye cinsinden söndüğü için usulün kendi biriminde tempo `bpm · mertebe / 4`'tür.
 * - `eslik: 'yok'`: yalnız sayım.
 * - `isaret` (varsayılan açık): başa ses saati işareti katmanı.
 * `olcu` çalınacak (seçili) ölçülerdir; `toplamVurus` bunların toplamıdır.
 */
export function buildCalismaCode(olcu: MusicEvent[][], tuning: Tuning, bpm: number, s: CalismaSecenek): CalismaKodu {
  if (!s.melodi && s.eslik === 'yok') throw new RangeError('Çalınacak melodi ya da eşlik seçilmedi')
  const tones = toToneEvents(olcu.flat(), tuning)
  const total = tones.reduce((sum, e) => sum + e.beats, 0)
  if (!(total > 0) || !(bpm > 0)) throw new RangeError('Çalınacak ses ya da geçerli tempo yok')
  const { usul } = s
  const olcuV = olcuVurusu(usul)
  if (!(olcuV > 0)) throw new RangeError('Geçerli ölçü zamanı yok')
  /** Giriş sayımı bir ölçü; melodi bundan sonra başlar. */
  const giris = olcuV
  const cycle = giris + total
  const tempo = `${ONE_SHOT}.cpm(${bpm / cycle})`
  const durationMs = (cycle * 60000) / bpm

  // Usulün biriminde tempo: tık ve usul sesleri saniye cinsinden bu birime göre söner.
  const usulBpm = usul ? (bpm * usul.mertebe) / 4 : bpm
  const click = metronomeBody(usul ? usul.zaman : USULSUZ_OLCU_VURUSU, usulBpm)
  const sayim = `${click}.compress(0, ${giris} / ${cycle})`

  const layers: string[] = []
  if (s.melodi) layers.push(`freq("~@${giris} ${toneSteps(tones)}")${melodyChain(s.voice, tones, { lead: giris, bpm })}`)
  if (s.eslik === 'yok') layers.push(sayim)
  else if (s.eslik === 'metronom' || !usul) layers.push(`${click}.fast(${cycle / olcuV})`)
  else {
    layers.push(sayim)
    const first = (olcu[0] ?? []).reduce((sum, e) => sum + beats(e), 0)
    const lead = first < olcuV - PAY ? first : 0
    const repeats = (total - lead) / olcuV
    if (repeats > 0) {
      layers.push(
        `${buildUsulBody(usul, usulBpm, s.usulSesi ?? getUsulSesi())}.fast(${repeats}).compress(${giris + lead} / ${cycle}, 1)`,
      )
    }
  }
  if (s.isaret ?? true) layers.push(ISARET_KATMANI)
  return {
    code: `${layers.length > 1 ? `stack(${layers.join(', ')})` : layers[0]}${tempo}`,
    durationMs,
    girisVurus: giris,
    toplamVurus: total,
  }
}

/**
 * Seçimin başından (`bas`. ölçü) `vurus` dörtlük sonra çalan olay: `{ olcu, nota }` (`olcu` dizinindeki indeksler).
 * Sus da olaydır. `vurus` negatifse ya da `bas`'tan sonraki ölçülerin toplamını aşıyorsa null.
 */
export function konumBul(olcu: MusicEvent[][], bas: number, vurus: number): { olcu: number; nota: number } | null {
  if (!(vurus >= 0)) return null
  let t = 0
  for (let o = bas; o < olcu.length; o++) {
    const olaylar = olcu[o]!
    for (let n = 0; n < olaylar.length; n++) {
      t += beats(olaylar[n]!)
      if (vurus < t - PAY) return { olcu: o, nota: n }
    }
  }
  return null
}
