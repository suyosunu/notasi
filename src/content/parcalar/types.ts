import type { MusicEvent } from '../../music/notation'

export const MAKAMLAR = ['rast', 'neva', 'ussak', 'bayati', 'huseyni', 'hicaz', 'segah'] as const
export type ParcaMakam = (typeof MAKAMLAR)[number]

/**
 * SymbTr'den `scripts/symbtr-to-json.mjs` ile üretilmiş parça (CC BY-NC-SA 4.0, bkz. LISANS.md).
 * Perdeler SymbTr NotaAE/KomaAE sütunlarından, süreler Pay/Payda'dan gelir.
 */
export interface Parca {
  id: string
  title: string
  makam: ParcaMakam
  /** USULLER kimliği. */
  usul: string
  composer: string
  /** Güfte sahibi; yalnız elle yazılan parçalarda ve PDF'te belirtilmişse. */
  lyricist?: string
  /** SymbTr txt URL'si; elle yazılan parçalarda neyzen.com PDF adresi. */
  source: string
  /** Ölçüler; ilk ölçü anacrusis olabilir, diğerleri tam usul zamanıdır. */
  olcu: MusicEvent[][]
  /**
   * Ölçü başına, olaylarla hizalı heceler (SymbTr Soz1, boşlukları kırpılmış; ulama `‿`). Sus, melizma
   * (aynı hecede yeni nota) ve bağlı notanın devamı için boş dizgi.
   */
  soz?: string[][]
}
