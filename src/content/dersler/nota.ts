import { parseNoteKey } from '../../music/accidentals'
import type { DurationKind, MusicEvent } from '../../music/notation'
import type { Ders } from './types'

// Seviye 1 nota okuma dersleri: her nota konusunun önünde bir ders. Bilgiler yalnızca araştırma notundan
// (docs/superpowers/notes/2026-10-25-ney-mufredat-arastirma.md; S3 1–2, S4 d2–4 ve d7, S6 h1–2) ve genel nota
// bilgisinden gelir. Porte örnekleri konunun kartlarındaki notaları gösterir (kart kuralları: learning/cards.ts).

export const S2 =
  'S2 MEB, Çalgı Eğitimi Ney Dersi Öğretim Programı (GSL 9–12, 2022): https://mufredat.meb.gov.tr/Dosyalar/2024118143640484-2022%20%C3%87ALGI%20E%C4%9E%C4%B0T%C4%B0M%C4%B0%20NEY.pdf'
export const S3 =
  'S3 MEB TYMM, Müzik Okulları Türk Müziği Teori ve Uygulaması Dersi (1–8): https://tymm.meb.gov.tr/assets/pdf/muzik-okullari-turk-muzigi-teori-uygulamasi-dersi.pdf'
export const s4 = (n: number) => `S4 neyzenim.com, Zeki Sözen, Ney Dersleri ${n}: https://www.neyzenim.com/neydersleri_${n}.html`
/** MEB Ney Modülü ünitesi (tymm.meb.gov.tr); `ad` ünitenin konusudur. */
export const meb = (no: number, ad: string) =>
  `S1 MEB TYMM, Bireysel Çalgı Eğitimi Ney Modülü, ünite ${no} (${ad}): https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-ney-modulu/unite/${no}`
export const S6 = 'S6 Bursa Uludağ Üniv., NEY I ders bilgi paketi: https://bilgipaketi.uludag.edu.tr/DersProgramiRapor/DersIcerikRapor/915137?Dil=0'

/** 'D5' → Re5; 'B4b1' → Si4 koma bemolü. Süre verilmezse dörtlük (soru kartlarındaki gibi). */
export function n(key: string, dur: DurationKind = 'quarter', dotted = false): MusicEvent {
  const pitch = parseNoteKey(key)
  if (!pitch) throw new Error(`Geçersiz nota anahtarı: ${key}`)
  return { kind: 'note', pitch, dur, ...(dotted ? { dotted: true } : {}) }
}

export function sus(dur: DurationKind): MusicEvent {
  return { kind: 'rest', dur }
}

/** 'G4-A4-B4-C5' → dört dörtlük (dizi kartlarındaki gibi). */
function dizi(keys: string): MusicEvent[] {
  return keys.split('-').map((k) => n(k))
}

/** Süre derslerinin ortak notası: süre kartları Si4 ile çizilir. */
const SI = 'B4'

const DORTLUK_1_SN = "♩ = 60'ta bir dörtlük 1 sn sürer."

export const NOTA_DERSLERI: Ders[] = [
  {
    id: 'nota:nota-1',
    seviye: 1,
    baslik: 'Porte ve ilk notalar: Re, Do, Si',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Nota, bir sesin yazıdaki işaretidir. Notalar porteye yazılır. Porte, beş yatay çizgiden oluşur.',
      },
      {
        tur: 'metin',
        metin: 'Çizgileri alttan yukarı sayarsın: en alttaki 1. çizgi, en üstteki 5. çizgidir. İki çizgi arasındaki boşluğa aralık denir. Portede dört aralık vardır; onları da alttan sayarsın.',
      },
      {
        tur: 'metin',
        metin: 'Portenin başındaki işaret sol anahtarıdır. Sol anahtarı alttan 2. çizgiden başlar ve o çizgideki notanın Sol olduğunu gösterir. Öteki notaların adları buradan sayılır.',
      },
      {
        tur: 'metin',
        metin: 'Bir nota ya bir çizginin üstündedir (çizgi notanın ortasından geçer) ya da bir aralıktadır. Notanın yeri adını belirler. Bu derste üç nota öğreneceksin: Re, Do ve Si.',
      },
      {
        tur: 'liste',
        maddeler: [
          "Re: alttan 4. çizgidedir. Neyde bu nota Nevâ perdesidir; neyde ilk öğrendiğin ses.",
          'Do: 3. ile 4. çizgi arasındaki aralıktadır (alttan 3. aralık).',
          'Si: alttan 3. çizgidedir, yani portenin tam ortasında.',
        ],
      },
      { tur: 'porte', olaylar: [n('D5')], aciklama: '4. çizgi = Re = Nevâ.' },
      { tur: 'porte', olaylar: [n('C5')], aciklama: 'Do: 3. aralık.' },
      { tur: 'porte', olaylar: [n('B4')], aciklama: 'Si: 3. çizgi, portenin ortası.' },
      {
        tur: 'porte',
        olaylar: [n('D5'), n('C5'), n('B4')],
        aciklama: 'Re, Do, Si yan yana: her adımda nota bir çizgiden komşu aralığa ya da bir aralıktan komşu çizgiye iner.',
      },
      {
        tur: 'metin',
        metin: "Re'yi bulmak için çizgileri alttan say: 4. çizgideki nota Re'dir. Do onun hemen altındaki aralıkta, Si de onun altındaki çizgidedir.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Her porteye bak; önce notanın çizgide mi aralıkta mı olduğunu söyle.',
          "Çizgileri alttan sayarak Re'yi bul.",
          '▶ Dinle ile notaları dinle ve adlarını sesli söyle.',
          'Gözünü kapat, üç notanın yerini sırayla aklında canlandır: 4. çizgi, 3. aralık, 3. çizgi.',
        ],
      },
    ],
    kaynaklar: [S3, s4(3), S6],
    alistirma: '/nota/nota-1',
  },
  {
    id: 'nota:sure-1',
    seviye: 1,
    baslik: 'Süreler: birlik, ikilik, dörtlük',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Notanın yeri sesin yüksekliğini, biçimi de ne kadar süreceğini gösterir. Süre vuruşla ölçülür. Vuruş, müziğin düzenli atan nabzıdır; ayağınla tempo tutarken her vuruş bir adımdır.',
      },
      {
        tur: 'metin',
        metin: `Tempo, vuruşların hızıdır. Metronom, vuruşları tık sesiyle veren alettir. ♩ = 60, dakikada 60 vuruş demektir. Bu yüzden ${DORTLUK_1_SN}`,
      },
      {
        tur: 'liste',
        maddeler: [
          'Dörtlük: içi dolu baş ve bir sap. 1 vuruş sürer.',
          'İkilik: içi boş baş ve bir sap. 2 vuruş, yani iki dörtlük kadar sürer.',
          'Birlik: içi boş baş, sap yok. 4 vuruş, yani dört dörtlük kadar sürer.',
        ],
      },
      { tur: 'porte', olaylar: [n(SI, 'whole')], aciklama: "Birlik: 4 vuruş. ♩ = 60'ta 4 sn." },
      { tur: 'porte', olaylar: [n(SI, 'half')], aciklama: "İkilik: 2 vuruş. ♩ = 60'ta 2 sn." },
      { tur: 'porte', olaylar: [n(SI, 'quarter')], aciklama: "Dörtlük: 1 vuruş. ♩ = 60'ta 1 sn." },
      {
        tur: 'porte',
        olaylar: [n(SI, 'whole'), n(SI, 'half'), n(SI, 'half'), n(SI), n(SI), n(SI), n(SI)],
        aciklama: 'Aynı Si üç süreyle yan yana: bir birlik, iki ikilik, dört dörtlük. Üç grup da 4 vuruş sürer.',
      },
      {
        tur: 'metin',
        metin: "Bu dersteki örneklerin hepsi aynı notada, Si'dedir. Yer değişmediği için yükseklik aynı kalır; yalnızca süre değişir.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Her örnekte ▶ Dinle ile dinle ve vuruşları sesli say: bir, iki, üç, dört.',
          'Birlik boyunca elinle dizine dört kez vur; ikilikte iki, dörtlükte bir kez vur.',
          'Saatin saniyesine bak: dörtlüğün 1 sn, birliğin 4 sn sürdüğünü kontrol et.',
        ],
      },
    ],
    kaynaklar: [s4(3), S3, S6],
    alistirma: '/nota/sure-1',
  },
  {
    id: 'nota:nota-2',
    seviye: 1,
    baslik: 'La ve Sol',
    bloklar: [
      {
        tur: 'metin',
        metin: "Si 3. çizgideydi. Ondan bir basamak inersen 2. aralığa gelirsin: bu nota La'dır. Bir basamak daha inersen 2. çizgiye gelirsin: bu nota Sol'dür.",
      },
      {
        tur: 'metin',
        metin: 'Sol, sol anahtarının başladığı çizgidedir; anahtar adını bu notadan alır. Notaları şaşırırsan buradan say.',
      },
      {
        tur: 'liste',
        maddeler: ['La: 2. aralık (2. ile 3. çizgi arası).', 'Sol: 2. çizgi.'],
      },
      { tur: 'porte', olaylar: [n('A4')], aciklama: 'La: 2. aralık.' },
      { tur: 'porte', olaylar: [n('G4')], aciklama: 'Sol: 2. çizgi, sol anahtarının başladığı yer.' },
      {
        tur: 'porte',
        olaylar: [n('D5'), n('C5'), n('B4'), n('A4'), n('G4')],
        aciklama: "Re'den Sol'e beş nota: çizgi, aralık, çizgi, aralık, çizgi.",
      },
      {
        tur: 'metin',
        metin: 'Neyde La Dügâh, Sol de Rast perdesidir. Perde adlarını ileride ayrı bir derste göreceksin.',
      },
      {
        tur: 'dene',
        adimlar: [
          "Son portede notaları Re'den başlayarak sesli oku: Re, Do, Si, La, Sol.",
          'Her notada çizgide mi aralıkta mı olduğunu söyle.',
          '▶ Dinle ile dinle; her notada ses biraz daha kalınlaşır.',
        ],
      },
    ],
    kaynaklar: [S3, s4(3), S6],
    alistirma: '/nota/nota-2',
  },
  {
    id: 'nota:sure-2',
    seviye: 1,
    baslik: 'Sekizlik ve noktalı süreler',
    bloklar: [
      {
        tur: 'metin',
        metin: `Sekizlik, dörtlüğün yarısıdır: ½ vuruş sürer. İçi dolu başı, sapı ve sapın ucunda bir bayrağı vardır. Yan yana sekizliklerde bayrakların yerine sapları birleştiren kalın bir çizgi kullanılır; buna kiriş denir. ${DORTLUK_1_SN} Bir sekizlik de yarım saniye sürer.`,
      },
      { tur: 'porte', olaylar: [n(SI, 'eighth')], aciklama: 'Sekizlik: ½ vuruş.' },
      {
        tur: 'porte',
        olaylar: [n(SI), n(SI, 'eighth'), n(SI, 'eighth'), n(SI), n(SI, 'eighth'), n(SI, 'eighth')],
        aciklama: "Aynı Si'de dörtlük ve iki sekizlik: iki sekizlik bir dörtlük kadar sürer.",
      },
      {
        tur: 'metin',
        metin: 'Nota başının sağındaki nokta, notaya kendi süresinin yarısını ekler.',
      },
      {
        tur: 'liste',
        maddeler: ['Noktalı ikilik: 2 + 1 = 3 vuruş.', 'Noktalı dörtlük: 1 + ½ = 1½ vuruş.'],
      },
      { tur: 'porte', olaylar: [n(SI, 'half', true)], aciklama: 'Noktalı ikilik: 3 vuruş.' },
      { tur: 'porte', olaylar: [n(SI, 'quarter', true)], aciklama: 'Noktalı dörtlük: 1½ vuruş.' },
      {
        tur: 'porte',
        olaylar: [n(SI, 'half'), n(SI), n(SI, 'half', true)],
        aciklama: 'Önce bir ikilik ve bir dörtlük, sonra tek başına bir noktalı ikilik: ikisi de 3 vuruş sürer.',
      },
      {
        tur: 'porte',
        olaylar: [n(SI, 'quarter', true), n(SI, 'eighth'), n(SI, 'quarter', true), n(SI, 'eighth')],
        aciklama: 'Noktalı dörtlük ve sekizlik birlikte 2 vuruş eder.',
      },
      {
        tur: 'dene',
        adimlar: [
          'İkinci örneği ▶ Dinle ile dinle; iki sekizliğin birlikte bir dörtlük kadar sürdüğünü duy.',
          'Noktalı ikilik örneğinde vuruşları say: bir, iki, üç.',
          'Son örnekte elinle vuruşu tut; noktalı dörtlüğün vuruşun ortasına taştığını duy.',
        ],
      },
    ],
    kaynaklar: [s4(3), s4(4), S6],
    alistirma: '/nota/sure-2',
  },
  {
    id: 'nota:nota-3',
    seviye: 1,
    baslik: 'Üstteki notalar: Mi, Fa, Sol',
    bloklar: [
      {
        tur: 'metin',
        metin: "Re 4. çizgideydi. Ondan yukarı çıkalım: 4. aralıkta Mi, en üstteki 5. çizgide Fa vardır. 5. çizginin hemen üstündeki boşlukta da Sol durur.",
      },
      {
        tur: 'liste',
        maddeler: [
          'Mi: 4. aralık (4. ile 5. çizgi arası).',
          'Fa: 5. çizgi, portenin en üstü.',
          'Sol: 5. çizginin hemen üstü.',
        ],
      },
      { tur: 'porte', olaylar: [n('E5')], aciklama: 'Mi: 4. aralık.' },
      { tur: 'porte', olaylar: [n('F5')], aciklama: 'Fa: 5. çizgi.' },
      { tur: 'porte', olaylar: [n('G5')], aciklama: 'Sol: portenin üstündeki boşluk.' },
      {
        tur: 'metin',
        metin: "Bu Sol, 2. çizgideki Sol'ün bir oktav tizidir. Oktav, aynı adı taşıyan iki komşu nota arasındaki uzaklıktır. Tiz, daha ince ses demektir. Adı yine Sol'dür.",
      },
      {
        tur: 'porte',
        olaylar: [n('G4'), n('G5')],
        aciklama: 'İki Sol: 2. çizgide ve portenin üstünde. Aynı ad, bir oktav ara.',
      },
      {
        tur: 'porte',
        olaylar: [n('D5'), n('E5'), n('F5'), n('G5')],
        aciklama: "Re'den yukarı: çizgi, aralık, çizgi, üstteki boşluk.",
      },
      {
        tur: 'dene',
        adimlar: [
          "Son portede Re'yi bul ve oradan yukarı say: Re, Mi, Fa, Sol.",
          "İki Sol örneğini ▶ Dinle ile dinle; üstteki Sol'ün daha ince olduğunu duy.",
          'Portenin en üst çizgisindeki notanın adını söyle.',
        ],
      },
    ],
    kaynaklar: [S3, s4(3), S6],
    alistirma: '/nota/nota-3',
  },
  {
    id: 'nota:sure-3',
    seviye: 1,
    baslik: 'Sus işaretleri',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Sus, sesin durduğu andır. Sus işareti ne kadar susacağını gösterir. Her nota süresinin bir sus karşılığı vardır ve aynı sayıda vuruş sürer.',
      },
      {
        tur: 'liste',
        maddeler: [
          'Birlik sus: 4. çizginin altına asılı dolu, küçük bir dikdörtgen. 4 vuruş.',
          'İkilik sus: 3. çizginin üstüne oturan dolu, küçük bir dikdörtgen. 2 vuruş.',
          'Dörtlük sus: dikine, kırık bir çizgi. 1 vuruş.',
          "Sekizlik sus: 7'ye benzer, tepesinde küçük bir top vardır. ½ vuruş.",
        ],
      },
      {
        tur: 'porte',
        olaylar: [sus('whole'), sus('half'), sus('quarter'), sus('eighth')],
        aciklama: 'Soldan sağa: birlik, ikilik, dörtlük ve sekizlik sus. Burada çalınacak ses yok.',
      },
      {
        tur: 'metin',
        metin: `Susarken de vuruş saymayı sürdürürsün. ${DORTLUK_1_SN} Dörtlük sus da 1 sn, birlik sus 4 sn sürer.`,
      },
      {
        tur: 'porte',
        olaylar: [n('B4'), sus('quarter'), n('B4'), sus('quarter'), n('B4', 'half'), sus('half')],
        aciklama: 'Si, sus, Si, sus; sonra bir ikilik Si ve bir ikilik sus.',
      },
      {
        tur: 'porte',
        olaylar: [n('D5'), sus('eighth'), n('C5', 'eighth'), n('B4'), sus('quarter'), n('A4', 'half'), sus('half')],
        aciklama: 'Sus içeren kısa bir ezgi: Re, sekizlik sus, Do, Si, dörtlük sus, La, ikilik sus.',
      },
      {
        tur: 'dene',
        adimlar: [
          'İlk portedeki dört sus işaretini adlarıyla söyle.',
          'Ezgileri ▶ Dinle ile dinle; sus yerlerinde de vuruşu saymayı sürdür.',
          'Elinle vuruş tutarak son ezgiyi seslendir: notalarda "ta" de, suslarda sus.',
        ],
      },
    ],
    kaynaklar: [s4(7), s4(3), S6],
    alistirma: '/nota/sure-3',
  },
  {
    id: 'nota:nota-4',
    seviye: 1,
    baslik: 'Alttaki notalar: Do, Re, Mi, Fa',
    bloklar: [
      {
        tur: 'metin',
        metin: "Sol 2. çizgideydi. Ondan aşağı inelim: 1. aralıkta Fa, en alttaki 1. çizgide Mi vardır. 1. çizginin hemen altındaki boşlukta Re durur.",
      },
      {
        tur: 'metin',
        metin: "Daha aşağıdaki nota porteye sığmaz. Onun için kısa bir çizgi eklenir; buna ek çizgi denir. Portenin altındaki ilk ek çizgideki nota Do'dur.",
      },
      {
        tur: 'liste',
        maddeler: [
          'Fa: 1. aralık (1. ile 2. çizgi arası).',
          'Mi: 1. çizgi, portenin en altı.',
          'Re: 1. çizginin hemen altı.',
          'Do: portenin altındaki ilk ek çizgi.',
        ],
      },
      { tur: 'porte', olaylar: [n('F4')], aciklama: 'Fa: 1. aralık.' },
      { tur: 'porte', olaylar: [n('E4')], aciklama: 'Mi: 1. çizgi.' },
      { tur: 'porte', olaylar: [n('D4')], aciklama: 'Re: portenin hemen altı.' },
      { tur: 'porte', olaylar: [n('C4')], aciklama: 'Do: alttaki ek çizgi.' },
      {
        tur: 'metin',
        metin: "Bu Do ve Re, 3. aralıktaki Do'nun ve 4. çizgideki Re'nin bir oktav pesidir. Pes, daha kalın ses demektir.",
      },
      {
        tur: 'porte',
        olaylar: [n('C4'), n('D4'), n('E4'), n('F4'), n('G4')],
        aciklama: "Do'dan Sol'e: ek çizgi, alttaki boşluk, 1. çizgi, 1. aralık, 2. çizgi.",
      },
      {
        tur: 'dene',
        adimlar: [
          "Son portede Sol'ü bul ve oradan aşağı say: Sol, Fa, Mi, Re, Do.",
          'Ek çizgili notayı göster ve adını söyle.',
          '▶ Dinle ile dinle ve notaların adını sesle birlikte söyle.',
        ],
      },
    ],
    kaynaklar: [S3, s4(3), S6],
    alistirma: '/nota/nota-4',
  },
  {
    id: 'nota:nota-5',
    seviye: 1,
    baslik: 'Üstteki ek çizgi: La',
    bloklar: [
      {
        tur: 'metin',
        metin: "Üstteki Sol, 5. çizginin hemen üstündeydi. Bir basamak daha çıkarsan portenin üstündeki ilk ek çizgiye gelirsin. Bu nota La'dır.",
      },
      {
        tur: 'metin',
        metin: "Bu La, 2. aralıktaki La'nın bir oktav tizidir; adı yine La'dır.",
      },
      { tur: 'porte', olaylar: [n('A5')], aciklama: 'La: portenin üstündeki ilk ek çizgi.' },
      {
        tur: 'porte',
        olaylar: [n('A4'), n('A5')],
        aciklama: 'İki La: 2. aralıkta ve üstteki ek çizgide. Aynı ad, bir oktav ara.',
      },
      {
        tur: 'porte',
        olaylar: [n('E5'), n('F5'), n('G5'), n('A5')],
        aciklama: "Mi'den yukarı: aralık, çizgi, üstteki boşluk, ek çizgi.",
      },
      {
        tur: 'metin',
        metin: "Ek çizgileri hatırlamanın kolay yolu: alttaki ilk ek çizgi Do, üstteki ilk ek çizgi La'dır.",
      },
      {
        tur: 'dene',
        adimlar: [
          "Son portede Mi'den başlayarak yukarı oku: Mi, Fa, Sol, La.",
          "İki La örneğini ▶ Dinle ile dinle; üstteki La'nın daha ince olduğunu duy.",
          'Alttaki ve üstteki ilk ek çizgilerin adlarını söyle.',
        ],
      },
    ],
    kaynaklar: [S3, s4(3), S6],
    alistirma: '/nota/nota-5',
  },
  {
    id: 'nota:dizi-1',
    seviye: 1,
    baslik: 'Dizi okuma: adım adım',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Dizi, art arda okunan notalardır. Bu derste notalar hep komşu basamağa gider. Bir çizgiden komşu aralığa ya da bir aralıktan komşu çizgiye geçmeye adım diyoruz.',
      },
      {
        tur: 'metin',
        metin: "Nota adları yukarı doğru sırayla gider: Do, Re, Mi, Fa, Sol, La, Si; Si'den sonra yine Do gelir.",
      },
      {
        tur: 'liste',
        maddeler: [
          'İlk notayı bul: çizgide mi, aralıkta mı? Adını söyle.',
          'Sağdaki notaya geç: yukarı mı çıktı, aşağı mı indi?',
          'Bir adım yukarı çıktıysa adı sıradaki notadır (Sol → La); bir adım indiyse bir önceki notadır (La → Sol).',
          'Sona kadar soldan sağa böyle ilerle.',
        ],
      },
      { tur: 'porte', olaylar: dizi('G4-A4-B4-C5'), aciklama: 'Sol – La – Si – Do: her nota bir adım yukarı.' },
      { tur: 'porte', olaylar: dizi('D5-C5-B4-A4'), aciklama: 'Re – Do – Si – La: her nota bir adım aşağı.' },
      { tur: 'porte', olaylar: dizi('E5-D5-C5-D5'), aciklama: 'Mi – Re – Do – Re: iki adım aşağı, bir adım yukarı.' },
      { tur: 'metin', metin: 'Şimdi üç diziyi kendin oku, sonra ▶ Dinle ile kontrol et.' },
      { tur: 'porte', olaylar: dizi('A4-B4-C5-B4') },
      { tur: 'porte', olaylar: dizi('C5-D5-E5-F5') },
      { tur: 'porte', olaylar: dizi('G5-F5-E5-D5') },
      {
        tur: 'dene',
        adimlar: [
          'Son üç dizide ilk notanın adını bul.',
          'Her notada yukarı mı aşağı mı gittiğini söyle ve adı sıradan bul.',
          'Diziyi soldan sağa sesli oku, sonra ▶ Dinle ile dinle.',
        ],
      },
    ],
    kaynaklar: [S3, s4(3), S6],
    alistirma: '/nota/dizi-1',
  },
  {
    id: 'nota:perde-1',
    seviye: 1,
    baslik: "Perde adları: Rast'tan Nevâ'ya",
    bloklar: [
      {
        tur: 'metin',
        metin: 'Perde, Türk müziğinde belli bir sesin adıdır. Ney notasında her perdenin portede bir yeri vardır. Bu derste akşam çalıştığın beş perdeyi notalarla eşleyeceksin.',
      },
      {
        tur: 'liste',
        maddeler: [
          'Rast = Sol (2. çizgi).',
          'Dügâh = La (2. aralık).',
          "Segâh = Si'nin biraz pesti (3. çizgi, önünde koma bemolü).",
          'Çârgâh = Do (3. aralık).',
          'Nevâ = Re (4. çizgi).',
        ],
      },
      {
        tur: 'porte',
        olaylar: [n('G4'), n('A4'), n('B4b1'), n('C5'), n('D5')],
        aciklama: 'Soldan sağa: Rast, Dügâh, Segâh, Çârgâh, Nevâ.',
      },
      {
        tur: 'metin',
        metin: "Segâh, Si'nin biraz pestidir. Pes, daha kalın ses demektir. Notada bunu göstermek için Si'nin önüne küçük bir işaret konur: koma bemolü. Bu işaret sesi çok az pesleştirir.",
      },
      { tur: 'porte', olaylar: [n('B4b1')], aciklama: "Segâh: Si'nin önünde koma bemolü." },
      {
        tur: 'metin',
        metin: 'Koma işaretlerinin ayrıntısını ileride koma konularında göreceksin.',
      },
      {
        tur: 'metin',
        metin: 'Sorularda bazen nota verilir, perde adını seçersin; bazen perde adı verilir, notayı seçersin. Segâh için "Si (koma bemolü)" seçeneğini ara.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Beş notalı portede her notanın perde adını sesli söyle.',
          'Gözünü porteden ayır ve eşlemeyi ezberden say: Rast Sol, Dügâh La, Segâh koma bemollü Si, Çârgâh Do, Nevâ Re.',
          'Koma bemolünü göster: hangi notanın önünde duruyor?',
        ],
      },
    ],
    kaynaklar: [s4(2), s4(3), S3, S2],
    alistirma: '/nota/perde-1',
  },
  {
    id: 'nota:dizi-2',
    seviye: 1,
    baslik: 'Dizi okuma: atlamalı',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Bu dizilerde notalar komşu basamağa gitmez, atlar. Atlama, notanın arada en az bir basamak bırakıp daha uzağa gitmesidir.',
      },
      {
        tur: 'metin',
        metin: 'En kısa atlama, bir çizgiden komşu çizgiye ya da bir aralıktan komşu aralığa geçmektir. Bu atlamada aradaki tek nota atlanır.',
      },
      {
        tur: 'liste',
        maddeler: [
          'İlk notanın adını bul.',
          'Sonraki nota çizgiden çizgiye ya da aralıktan aralığa gittiyse aradaki tek notayı atla (Sol → Si: La atlandı).',
          'Atlama daha büyükse aradaki çizgi ve aralıkları tek tek say.',
          'Emin olamadığın notayı çizgileri alttan sayarak baştan bul.',
          'Sona kadar soldan sağa böyle ilerle.',
        ],
      },
      { tur: 'porte', olaylar: dizi('G4-B4-D5-G5'), aciklama: 'Sol – Si – Re – Sol: 2., 3. ve 4. çizgi, sonra portenin üstü.' },
      { tur: 'porte', olaylar: dizi('D5-B4-G4-B4'), aciklama: 'Re – Si – Sol – Si: hep çizgiden çizgiye.' },
      { tur: 'porte', olaylar: dizi('C5-E5-G5-E5'), aciklama: 'Do – Mi – Sol – Mi: aralıktan aralığa, sonra portenin üstü.' },
      { tur: 'metin', metin: 'Şimdi üç diziyi kendin oku, sonra ▶ Dinle ile kontrol et.' },
      { tur: 'porte', olaylar: dizi('A4-C5-E5-A5') },
      { tur: 'porte', olaylar: dizi('F5-D5-B4-G4') },
      { tur: 'porte', olaylar: dizi('E5-C5-A4-C5') },
      {
        tur: 'dene',
        adimlar: [
          'Son üç dizide ilk notanın adını bul.',
          'Her atlamada kaç basamak atlandığını say.',
          'Diziyi soldan sağa sesli oku, sonra ▶ Dinle ile dinle.',
        ],
      },
    ],
    kaynaklar: [S3, s4(3), S6],
    alistirma: '/nota/dizi-2',
  },
]
