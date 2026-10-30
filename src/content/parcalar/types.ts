import type { MusicEvent } from '../../music/notation'

export type ParcaMakam = 'rast' | 'neva' | 'ussak' | 'bayati' | 'huseyni' | 'hicaz'

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
  /** SymbTr txt URL'si. */
  source: string
  /** Ölçüler; ilk ölçü anacrusis olabilir, diğerleri tam usul zamanıdır. */
  olcu: MusicEvent[][]
  /**
   * Ölçü başına, olaylarla hizalı heceler (SymbTr Soz1, boşlukları kırpılmış; ulama `‿`). Sus, melizma
   * (aynı hecede yeni nota) ve bağlı notanın devamı için boş dizgi.
   */
  soz?: string[][]
}
