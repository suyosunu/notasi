import type { MusicEvent } from '../../music/notation'

export type ParcaMakam = 'rast' | 'ussak' | 'hicaz'

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
   * Ölçü başına, olaylarla hizalı heceler (SymbTr Soz1, olduğu gibi). Sus ve melizma (aynı hecede
   * yeni nota) için boş dizgi. Sondaki tek boşluk kelime sonu, çift boşluk dize sonu, `_` ulama demektir.
   */
  soz?: string[][]
}
