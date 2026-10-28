import type { Usul } from '../content/usuller'

/**
 * Usul vurma alıştırması: kullanıcı metronomla birlikte ekrandaki Düm / Tek düğmelerine dokunur, zamanlama
 * değerlendirilir. Çalgıya özgü varsayım yoktur (ortak katman). Sayılar öneridir (araştırma notu, Seviye 2).
 */

/** Giriş ölçüsünden sonra vurulan ölçü sayısı. */
export const VURMA_OLCU = 4
/** Bir dokunuşun bir vuruşa sayılması için en çok sapma (ms, iki yönde). */
export const VURMA_TOLERANS_MS = 150
/** Geçmek için doğru türde ve zamanında vurulması gereken vuruş oranı. */
export const VURMA_GECME_ORANI = 0.8

export type VurmaTuru = 'düm' | 'tek' // te ve ke 'tek' sayılır
/** `t`: ms, giriş ölçüsünün bitişinden (ilk vuruştan) itibaren. */
export interface BeklenenVurus {
  t: number
  tur: VurmaTuru
}
export interface Dokunus {
  t: number
  tur: VurmaTuru
}
export interface VurmaSonucu {
  toplam: number
  isabet: number
  yanlisTur: number
  kacan: number
  fazla: number
  /** İsabetlerin işaretli ortalama sapması (ms, + geç); isabet yoksa null. */
  ortalamaSapma: number | null
  gecti: boolean
}

/** Bir zaman biriminin ms cinsinden süresi; `bpm` mertebe birimine göredir. */
const birimMs = (bpm: number) => 60000 / bpm

/** `olcuSayisi` ölçü boyunca vurulacak vuruşlar; vuruş kalıbı olmayan usulde (Dolap) boş. */
export function beklenenVuruslar(u: Usul, bpm: number, olcuSayisi: number = VURMA_OLCU): BeklenenVurus[] {
  if (u.vurus === null) return []
  const birim = birimMs(bpm)
  const sonuc: BeklenenVurus[] = []
  for (let olcu = 0; olcu < olcuSayisi; olcu++) {
    let konum = olcu * u.zaman
    for (const v of u.vurus) {
      sonuc.push({ t: konum * birim, tur: v.ses === 'düm' ? 'düm' : 'tek' })
      konum += v.sure
    }
  }
  return sonuc
}

/**
 * Dokunuşlar zaman sırasıyla gezilir; her biri tolerans içindeki, henüz eşlenmemiş en yakın beklenen vuruşla eşlenir
 * (eşitlikte önceki vuruş). Tür aynıysa isabet, farklıysa yanlış tür; eşlenemeyen dokunuş fazla, eşlenmeyen vuruş
 * kaçan sayılır. Her dokunuş en çok bir kez sayılır.
 */
export function degerlendir(
  beklenen: BeklenenVurus[],
  dokunuslar: Dokunus[],
  tolMs: number = VURMA_TOLERANS_MS,
): VurmaSonucu {
  const eslendi = beklenen.map(() => false)
  const sirali = [...dokunuslar].sort((a, b) => a.t - b.t)
  let isabet = 0
  let yanlisTur = 0
  let fazla = 0
  let sapmaToplam = 0
  for (const d of sirali) {
    let en = -1
    let enUzaklik = Infinity
    for (let i = 0; i < beklenen.length; i++) {
      if (eslendi[i]) continue
      const uzaklik = Math.abs(d.t - beklenen[i]!.t)
      if (uzaklik <= tolMs && uzaklik < enUzaklik) {
        en = i
        enUzaklik = uzaklik
      }
    }
    if (en < 0) {
      fazla++
      continue
    }
    eslendi[en] = true
    if (beklenen[en]!.tur === d.tur) {
      isabet++
      sapmaToplam += d.t - beklenen[en]!.t
    } else {
      yanlisTur++
    }
  }
  const toplam = beklenen.length
  return {
    toplam,
    isabet,
    yanlisTur,
    kacan: toplam - isabet - yanlisTur,
    fazla,
    ortalamaSapma: isabet > 0 ? sapmaToplam / isabet : null,
    gecti: toplam > 0 && isabet / toplam >= VURMA_GECME_ORANI,
  }
}

/**
 * İlk vuruştan `ms` sonra çalan vuruşun usul içindeki sırası (vurgu için); `olcuSayisi` ölçünün dışında ya da vuruş
 * kalıbı yoksa null.
 */
export function vurusSirasi(u: Usul, bpm: number, ms: number, olcuSayisi: number = VURMA_OLCU): number | null {
  if (u.vurus === null) return null
  const konum = ms / birimMs(bpm)
  if (!(konum >= 0) || konum >= olcuSayisi * u.zaman) return null
  const olcuIci = konum % u.zaman
  let bas = 0
  for (let i = 0; i < u.vurus.length; i++) {
    const son = bas + u.vurus[i]!.sure
    if (olcuIci >= bas && olcuIci < son) return i
    bas = son
  }
  return null
}
