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
 * Türk Aksağı 5/8: neyzenim _13 "5/8 lik mertebesi vardır", "Vuruluşu: DÜM 2, TEK 2, TEK 1 şeklindedir."; tr.wikipedia Usul
 * (`	ime 5/8`, düüm4 teek4 tek8); TDV (https://islamansiklopedisi.org.tr/turk-aksagi) "Beş zamanlı ve üç vuruşlu bir küçük usul".
 * Devr-i Hindî 7/8: neyzenim _13 "Düm 1, Tek 1, Tek 1 ,Düm 2, Tek 2"; tr.wikipedia Usul (`	ime 7/8`, düm8 tek8 tek8 düüm4 teek4);
 * TDV (https://islamansiklopedisi.org.tr/devr-i-hindi) "yedi zamanlı ve beş vuruşlu bir küçük usul". 7/4 (ağır devr-i hindî)
 * ikinci mertebe olarak var, uygulama 7/8'i kullanır.
 * Yürük Semâî 6/4: neyzenim "6/8 lik, 6/4 lük ve 6/2 lik üç mertebesi vardır", vuruş aynı; tr.wikipedia Usul tablosu aynı vuruşu
 * 6/4 yazar; TDV (https://islamansiklopedisi.org.tr/yuruk-semai) "nota yazımında usulün 6/4'lük mertebesine de yürük semâi adı
 * verildiği görülür", form için "Daha çok 6/4 olarak kullanılmıştır". Bu yüzden 6/8 ile aynı vuruşta ayrı bir 6/4 kaydı vardır
 * (dönüştürücü pay/paydayı birebir karşılaştırır). Hangi elle vurulduğu bu kaynaklarda da yazmaz: el bilgisi verilmez.
 * Sıra = öğretim sırası (Seviye 2: Nim Sofyan → Semâî → Sofyan; Seviye 4: Yürük Semâî 6/8 ve 6/4, Türk Aksağı, Devr-i Hindî;
 * sonra Düyek, Aksak, Dolap).
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
    id: 'yuruk-semai-64',
    name: 'Yürük Semâî (6/4)',
    zaman: 6,
    mertebe: 4,
    vurus: [v('düm', 1), v('tek', 1), v('tek', 1), v('düm', 1), v('tek', 2)],
  },
  { id: 'turk-aksagi', name: 'Türk Aksağı', zaman: 5, mertebe: 8, vurus: [v('düm', 2), v('tek', 2), v('tek', 1)] },
  {
    id: 'devr-i-hindi',
    name: 'Devr-i Hindî',
    zaman: 7,
    mertebe: 8,
    vurus: [v('düm', 1), v('tek', 1), v('tek', 1), v('düm', 2), v('tek', 2)],
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
