export type VurusSesi = 'düm' | 'tek' | 'te' | 'ke'

export interface Vurus {
  ses: VurusSesi
  /** Usulün birim (zaman) cinsinden süresi. */
  sure: number
}

export interface Usul {
  id: string
  name: string
  /** Bir ölçüdeki zaman (birim) sayısı: kesrin üstü. */
  zaman: number
  /** Birim değeri: kesrin altı. */
  mertebe: number
  /** Dolap'ta kaynaklarda bulunmadığı için null; süreler toplamı `zaman`dır. */
  vurus: Vurus[] | null
}

const v = (ses: VurusSesi, sure: number): Vurus => ({ ses, sure })

/**
 * Nim Sofyan: neyzenim.com Ney Dersleri 13 (https://www.neyzenim.com/neydersleri_13.html) "2/8 lik ve 2/4 lük
 * iki mertebesi vardır", "Vuruluşu: DÜM 1, TEK 1"; tr.wikipedia "Usul" tablosu da zamanını 2 verir. Uygulama 2/4'ü
 * kullanır. Hangi elle vurulduğu bu sayfalarda yazmadığı için uygulamada hiçbir el bilgisi verilmez (BELİRSİZ).
 * Sofyan, Düyek, Semâî, Yürük Semâî, Aksak: araştırma notu §3 (neyzenim ve tr.wikipedia birebir aynı).
 * Dolap SymbTr'de 12/8 olarak geçer; düm-tek kalıbı doğrulanamadığı için gösterilmez ve çalınmaz (BELİRSİZ).
 * Sıra = öğretim sırası (Seviye 2: Nim Sofyan → Semâî → Sofyan; sonra Yürük Semâî, Düyek, Aksak, Dolap).
 */
export const USULLER: Usul[] = [
  { id: 'nim-sofyan', name: 'Nim Sofyan', zaman: 2, mertebe: 4, vurus: [v('düm', 1), v('tek', 1)] },
  { id: 'semai', name: 'Semâî', zaman: 3, mertebe: 4, vurus: [v('düm', 1), v('tek', 1), v('tek', 1)] },
  { id: 'sofyan', name: 'Sofyan', zaman: 4, mertebe: 4, vurus: [v('düm', 2), v('te', 1), v('ke', 1)] },
  {
    id: 'yuruk-semai',
    name: 'Yürük Semâî',
    zaman: 6,
    mertebe: 8,
    vurus: [v('düm', 1), v('tek', 1), v('tek', 1), v('düm', 1), v('tek', 2)],
  },
  {
    id: 'duyek',
    name: 'Düyek',
    zaman: 8,
    mertebe: 8,
    vurus: [v('düm', 1), v('tek', 2), v('tek', 1), v('düm', 2), v('tek', 2)],
  },
  {
    id: 'aksak',
    name: 'Aksak',
    zaman: 9,
    mertebe: 8,
    vurus: [v('düm', 2), v('te', 1), v('ke', 1), v('düm', 2), v('tek', 2), v('tek', 1)],
  },
  { id: 'dolap', name: 'Dolap', zaman: 12, mertebe: 8, vurus: null },
]
