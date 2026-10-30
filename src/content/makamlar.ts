import { writtenKoma } from '../music/pitch'
import type { WrittenPitch } from '../music/pitch'

export interface Makam {
  id: 'rast' | 'neva' | 'ussak' | 'bayati' | 'huseyni' | 'muhayyer' | 'kurdi' | 'hicaz'
  name: string
  /** Pesten tize bir oktav; makamın karakteristik notaları (Segâh, Eviç, Nim Hicaz …) işaretlidir. */
  dizi: WrittenPitch[]
  durak: string
  guclu: string
  yeden: string
  /** Makamın donanımı: dizide işaretle yazılan notalar (TDV'deki sırayla). */
  donanim: WrittenPitch[]
  seyir: string
  /** Pesten tize iniş dizisi; yoksa iniş, dizinin tersidir. Rast, Hüseynî ve Muhayyer'de farklıdır (Eviç yerine Acem). */
  inis?: WrittenPitch[]
  /** Makamın kuruluşu: hangi dörtlü ve beşlilerden oluştuğu. */
  yapi?: string
}

/** Dizinin koma konumlarından kurulan anahtar: aynı sesleri kullanan makamların anahtarı aynıdır. */
export const diziAnahtari = (m: Makam): string => m.dizi.map(writtenKoma).join()

const segah: WrittenPitch = { step: 'B', octave: 4, acc: -1 }
const dikKurdi: WrittenPitch = { step: 'B', octave: 4, acc: -4 }
const nimHicaz: WrittenPitch = { step: 'C', octave: 5, acc: 4 }
const evic: WrittenPitch = { step: 'F', octave: 5, acc: 4 }

const kurdi: WrittenPitch = { step: 'B', octave: 4, acc: -5 }

const acem: WrittenPitch = { step: 'F', octave: 5, acc: 0 }

const n = (step: WrittenPitch['step'], octave: number): WrittenPitch => ({ step, octave, acc: 0 })

// Hüseynî ile Muhayyer aynı sekiz sesi kullanır (Nevâ ile de aynı): Dügâh'tan Muhayyer'e, 6. ses Eviç.
const huseyniDizi: WrittenPitch[] = [n('A', 4), segah, n('C', 5), n('D', 5), n('E', 5), evic, n('G', 5), n('A', 5)]
// İnişte Eviç yerine Acem ("acemli hüseynî dizisi").
const huseyniInis: WrittenPitch[] = [n('A', 4), segah, n('C', 5), n('D', 5), n('E', 5), acem, n('G', 5), n('A', 5)]

/**
 * Rast, Nevâ, Uşşak, Bayâtî, Hüseynî, Muhayyer, Kürdî, Hicaz. Değerler araştırma notu §2'den (TDV İslâm Ansiklopedisi, İ. H. Özkan) alındı.
 * Nevâ: TDV "Nevâ" maddesi, https://islamansiklopedisi.org.tr/neva (araştırma C §2).
 * Aşama D (araştırma D §3): Uşşak https://islamansiklopedisi.org.tr/ussak, Hicaz https://islamansiklopedisi.org.tr/hicaz-2,
 * Bayâtî https://islamansiklopedisi.org.tr/bayati--musiki ve https://www.neyzenim.com/neydersleri_10.html,
 * Hüseynî https://islamansiklopedisi.org.tr/huseyni, Muhayyer https://islamansiklopedisi.org.tr/muhayyer,
 * Kürdî https://islamansiklopedisi.org.tr/kurdi.
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
    // İnişte Eviç yerine Acem (F5, araştırma §2.1): "acemli rast dizisi".
    inis: [n('G', 4), n('A', 4), segah, n('C', 5), n('D', 5), n('E', 5), acem, n('G', 5)],
    donanim: [segah, evic],
    // TDV "Rast": yerinde bir Rast beşlisi + Nevâ'da bir Rast dörtlüsü (https://islamansiklopedisi.org.tr/rast).
    yapi: "Rast'ta Rast beşlisi + Nevâ'da Rast dörtlüsü",
    seyir:
      'Çıkıcı bir makamdır. Durak civarından ya da pest bölgeden başlanır, orta bölgede dolaşılır. ' +
      "Nevâ'da yarım karar yapılır, sonunda Rast'ta tam karar verilir. " +
      "İnişte Eviç yerine Acem (doğal Fa) kullanılır.",
  },
  {
    id: 'neva',
    name: 'Nevâ',
    // Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Eviç, Gerdâniye, Muhayyer. Uşşak'tan farkı yalnız 6. sestir: Acem yerine Eviç.
    dizi: [n('A', 4), segah, n('C', 5), n('D', 5), n('E', 5), evic, n('G', 5), n('A', 5)],
    durak: 'Dügâh',
    guclu: 'Nevâ',
    yeden: 'Rast',
    donanim: [segah, evic],
    // TDV "Nevâ": Dügâh'ta Uşşak dörtlüsü + Nevâ'da Rast beşlisi.
    yapi: "Dügâh'ta Uşşak dörtlüsü + Nevâ'da Rast beşlisi",
    seyir:
      "Güçlü olan Nevâ civarından başlanır. Nevâ'nın iki yanında uşşak ve rast çeşnilerinde dolaşılır, " +
      "Nevâ'da yarım karar yapılır. Sonra dizide inilip Dügâh'ta tam karar verilir. " +
      "Asma karar Eviç'te segâh çeşnili yapılır; Nevâ'da ise Eviç yerine Acem kullanılarak bûselik çeşnili asma karar ya da yarım karar yapılır.",
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
    // TDV "Uşşak": Dügâh'ta Uşşak dörtlüsü + Nevâ'da Bûselik beşlisi.
    yapi: "Dügâh'ta Uşşak dörtlüsü + Nevâ'da Bûselik beşlisi",
    seyir:
      "Çıkıcı bir makamdır. Önce Dügâh'taki uşşak dörtlüsünde dolaşılır, sonra Nevâ çevresinde gezinilir. " +
      "Nevâ'da yarım karar yapılır, sonunda Dügâh'ta tam karar verilir. En önemli asma karar Segâh'tır.",
  },
  {
    id: 'bayati',
    name: 'Bayâtî',
    // Uşşak ile aynı dizi (TDV "Bayâtî": "Uşşak makamı ile aynı diziyi kullanan"). Fark seyirdedir.
    dizi: [n('A', 4), segah, n('C', 5), n('D', 5), n('E', 5), n('F', 5), n('G', 5), n('A', 5)],
    durak: 'Dügâh',
    guclu: 'Nevâ',
    yeden: 'Rast', // TDV'de yeden yazılı değil; neyzenim _10 "Yedeni: Rast perdesidir".
    donanim: [segah],
    yapi: "Dügâh'ta Uşşak dörtlüsü + Nevâ'da Bûselik beşlisi",
    // Seyir yönü kaynaklarda çelişir (neyzenim "çıkıcı-inici", turkumuzikmerkezi.net "inici", TDV yazmıyor): yön söylenmez.
    seyir:
      "Uşşak ile aynı sesleri kullanır; onu ayıran seyridir. Güçlü olan Nevâ civarından başlanır. " +
      "Nevâ'da bûselik çeşnili yarım karar yapılır, sonunda Dügâh'ta uşşak dörtlüsüyle tam karar verilir. " +
      "Segâh asma kararı önemlidir. Dizi çoğunlukla tiz tarafa doğru genişletilir.",
  },
  {
    id: 'huseyni',
    name: 'Hüseynî',
    // Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Eviç, Gerdâniye, Muhayyer. Nevâ ile aynı dizi; makamı seyir ayırır.
    dizi: huseyniDizi,
    durak: 'Dügâh',
    guclu: 'Hüseynî',
    yeden: 'Rast',
    // TDV "Hüseynî": inişte Eviç yerine Acem kullanılır ("acemli hüseynî dizisi").
    inis: huseyniInis,
    donanim: [segah, evic],
    yapi: "Dügâh'ta Hüseynî beşlisi + Hüseynî'de Uşşak dörtlüsü",
    seyir:
      "İnici-çıkıcı bir makamdır. Güçlü olan Hüseynî civarından başlanır, çeşnilerde karışık dolaşılır. " +
      "Hüseynî'de uşşak çeşnili yarım karar yapılır, sonunda Dügâh'ta Hüseynî dizisiyle tam karar verilir. " +
      "En önemli asma karar Çârgâh'tır, ikincisi Segâh'tır. İnişte çoğunlukla Eviç yerine Acem kullanılır.",
  },
  {
    id: 'muhayyer',
    name: 'Muhayyer',
    // TDV "Muhayyer": dizi tamamen Hüseynî dizisinin aynısıdır (Hüseynî'nin inici biçimi).
    dizi: huseyniDizi,
    durak: 'Dügâh',
    guclu: 'Muhayyer',
    yeden: 'Rast',
    inis: huseyniInis,
    donanim: [segah, evic],
    yapi: "Dügâh'ta Hüseynî beşlisi + Hüseynî'de Uşşak dörtlüsü",
    seyir:
      "İnici bir makamdır. Tiz durak Muhayyer civarından başlanır, tizde dolaşılıp Muhayyer'de yarım karar yapılır. " +
      "Sonra orta bölgede Nevâ, Çârgâh, Segâh ve Rast asma kararları gösterilir. " +
      "İnişte çoğunlukla Eviç yerine Acem kullanılır. Dügâh'ta Hüseynî dizisiyle tam karar verilir.",
  },
  {
    id: 'kurdi',
    name: 'Kürdî',
    // Dügâh, Kürdî, Çârgâh, Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer. Kürdî perdesi B4b5 (309 koma).
    dizi: [n('A', 4), kurdi, n('C', 5), n('D', 5), n('E', 5), n('F', 5), n('G', 5), n('A', 5)],
    durak: 'Dügâh',
    guclu: 'Nevâ',
    yeden: 'Rast',
    donanim: [kurdi],
    yapi: "Dügâh'ta Kürdî dörtlüsü + Nevâ'da Bûselik beşlisi",
    seyir:
      "Çıkıcı bir makamdır, bazen çıkıcı-inici olur. Durak ya da güçlü civarından başlanır, çeşnilerde dolaşılır. " +
      "Nevâ'da bûselik çeşnili yarım karar yapılır, sonunda Kürdî dizisiyle Dügâh'ta tam karar verilir. " +
      "Asma kararlar Çârgâh, Kürdî ve Rast üzerindedir.",
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
    // TDV "Hicaz": yerinde Hicaz dörtlüsü + Nevâ'da Rast beşlisi.
    yapi: "Dügâh'ta Hicaz dörtlüsü + Nevâ'da Rast beşlisi",
    seyir:
      "İnici-çıkıcı bir makamdır, bazen çıkıcıdır. Durak ya da güçlü civarından başlanır. " +
      "Güçlü olan Nevâ'da yarım karar yapıldıktan sonra dizide dolaşılır, Dügâh'ta tam karar verilir. " +
      'Asma kararlar Rast, Nim Hicaz ve Dik Kürdî üzerindedir.',
  },
]
