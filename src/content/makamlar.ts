import type { WrittenPitch } from '../music/pitch'

export interface Makam {
  id: 'rast' | 'ussak' | 'hicaz'
  name: string
  /** Pesten tize bir oktav; makamın karakteristik notaları (Segâh, Eviç, Nim Hicaz …) işaretlidir. */
  dizi: WrittenPitch[]
  durak: string
  guclu: string
  yeden: string
  /** Makamın donanımı: dizide işaretle yazılan notalar (TDV'deki sırayla). */
  donanim: WrittenPitch[]
  seyir: string
}

const segah: WrittenPitch = { step: 'B', octave: 4, acc: -1 }
const dikKurdi: WrittenPitch = { step: 'B', octave: 4, acc: -4 }
const nimHicaz: WrittenPitch = { step: 'C', octave: 5, acc: 4 }
const evic: WrittenPitch = { step: 'F', octave: 5, acc: 4 }

const n = (step: WrittenPitch['step'], octave: number): WrittenPitch => ({ step, octave, acc: 0 })

/**
 * Rast, Uşşak, Hicaz. Değerler araştırma notu §2'den (TDV İslâm Ansiklopedisi, İ. H. Özkan) alındı.
 */
export const MAKAMLAR: Makam[] = [
  {
    id: 'rast',
    name: 'Rast',
    // Rast, Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Eviç, Gerdâniye.
    dizi: [n('G', 4), n('A', 4), segah, n('C', 5), n('D', 5), n('E', 5), evic, n('G', 5)],
    durak: 'Rast',
    guclu: 'Nevâ',
    yeden: 'Irak',
    donanim: [segah, evic],
    seyir:
      'Çıkıcı bir makamdır. Durak civarından ya da pest bölgeden başlanır, orta bölgede dolaşılır. ' +
      "Nevâ'da yarım karar yapılır, sonunda Rast'ta tam karar verilir. " +
      "İnişte Eviç yerine Acem (doğal Fa) kullanılır.",
  },
  {
    id: 'ussak',
    name: 'Uşşak',
    // Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer.
    dizi: [n('A', 4), segah, n('C', 5), n('D', 5), n('E', 5), n('F', 5), n('G', 5), n('A', 5)],
    durak: 'Dügâh',
    guclu: 'Nevâ',
    yeden: 'Rast',
    donanim: [segah],
    seyir:
      "Çıkıcı bir makamdır. Önce Dügâh'taki uşşak dörtlüsünde dolaşılır, sonra Nevâ çevresinde gezinilir. " +
      "Nevâ'da yarım karar yapılır, sonunda Dügâh'ta tam karar verilir. En önemli asma karar Segâh'tır.",
  },
  {
    id: 'hicaz',
    name: 'Hicaz',
    // Dügâh, Dik Kürdî, Nim Hicaz, Nevâ, Hüseynî, Eviç, Gerdâniye, Muhayyer.
    dizi: [n('A', 4), dikKurdi, nimHicaz, n('D', 5), n('E', 5), evic, n('G', 5), n('A', 5)],
    durak: 'Dügâh',
    guclu: 'Nevâ',
    yeden: 'Rast',
    donanim: [dikKurdi, evic, nimHicaz],
    seyir:
      "İnici-çıkıcı bir makamdır, bazen çıkıcıdır. Durak ya da güçlü civarından başlanır. " +
      "Güçlü olan Nevâ'da yarım karar yapıldıktan sonra dizide dolaşılır, Dügâh'ta tam karar verilir. " +
      'Asma kararlar Rast, Nim Hicaz ve Dik Kürdî üzerindedir.',
  },
]
