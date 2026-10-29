import { n, S3, S6 } from './nota'
import type { Ders } from './types'

// Seviye 2 dörtlü dersleri: Çârgâh dörtlüsü (Rast'ta), Kürdî dörtlüsü ve Hicaz dörtlüsü (Dügâh'ta). Araştırma notu,
// Seviye 2: "Makam henüz yok ... Çargâh dizisi ve kürdî, hicaz dörtlüleri dörtlü olarak tanıtılır" (S3 5. sınıf, S8 Ney I;
// makama geçiş S2 10.2 ve S6 h12–13'e göre üçüncü kademeden sonradır). Aralıklar AEÜ komalarıdır: Çârgâh 9+9+4, Kürdî 4+9+9,
// Hicaz 5+12+5 (Global Constraints; uygulamadaki Hicaz dizisiyle tutarlı). Porte örneği her derste dörtlünün çıkış dizisidir;
// notalar perdelerin yazılı notalarıdır (dersler.test.ts bunu ney-perdeler.ts ile karşılaştırır). Etütler etutler.ts'tedir.

const S8 =
  'S8 Aydın Adnan Menderes Üniv. Devlet Konservatuvarı THM, Ney I (KGTM133): https://ects.adu.edu.tr/programme-detail/3/7506/lecture/43295/'

const ARALIK_NOTU = 'Aralığın büyüklüğü koma ile ölçülür; koma, Türk müziğinin en küçük aralık birimidir.'

export const DORTLU_DERSLERI: Ders[] = [
  {
    id: 'dortlu:cargah',
    seviye: 2,
    baslik: 'Dörtlü nedir? Çârgâh dörtlüsü',
    bloklar: [
      {
        tur: 'metin',
        metin: `Dörtlü, birbirini izleyen dört sesten oluşan bir dizidir. Her dörtlüde üç aralık vardır. ${ARALIK_NOTU} Dörtlünün rengini bu aralıkların sırası belirler.`,
      },
      {
        tur: 'metin',
        metin: "Dörtlü, bir makamın yapı taşıdır. Makama Seviye 3'te geçeceksin. Şimdilik dörtlüleri tanı ve çal; makamı kurarken bu dörtlüleri tanıdık bulursun.",
      },
      {
        tur: 'metin',
        metin: "İlk dörtlün Çârgâh dörtlüsüdür. Rast'tan başlar: Rast, Dügâh, Bûselik, Çârgâh. Nota adlarıyla Sol, La, Si, Do. Bu seslerin dördünü de çalıyorsun; Bûselik, Seviye 2'de öğrendiğin yeni sestir.",
      },
      {
        tur: 'porte',
        olaylar: [n('G4'), n('A4'), n('B4'), n('C5')],
        aciklama: "Çârgâh dörtlüsü: Rast, Dügâh, Bûselik, Çârgâh; her ses bir vuruş. Bûselik, Si'dir ve önünde işaret yoktur; dörtlünün üçüncü sesi odur.",
        bpm: 60,
      },
      { tur: 'metin', metin: 'Dörtlünün aralıkları (komayla):' },
      {
        tur: 'liste',
        maddeler: [
          'Rast – Dügâh: 9 koma (tanini, geniş aralık)',
          'Dügâh – Bûselik: 9 koma (tanini, geniş aralık)',
          'Bûselik – Çârgâh: 4 koma (bakiye, dar aralık)',
        ],
      },
      {
        tur: 'metin',
        metin: "İki geniş aralık gelir, sonra bir dar aralık: Çârgâh dörtlüsünün dar aralığı sonundadır. Bûselik'ten Çârgâh'a adım küçüktür; kulağını bu küçük adıma alıştır. Bûselik'i çıkarırken Segâh'a kaymamaya dikkat et; Segâh bir koma bemollüdür, yani daha pestir.",
      },
      {
        tur: 'dene',
        adimlar: [
          '"▶ Dinle" ile dörtlüyü dinle; dört sesi say ve son adımın daha küçük olduğunu duy.',
          "Rast'tan Çârgâh'a dört sesi tek tek çal. Bûselik'te akort göstergesine bak.",
          'Aynı dört sesi Çârgâh\'tan Rast\'a doğru, ters sırayla çal.',
          'Çârgâh dörtlüsü etüdünü aç ve ♩ = 60\'ta metronomla çal.',
        ],
      },
    ],
    kaynaklar: [S3, S6, S8],
    alistirma: '/etut/dortlu-cargah',
  },
  {
    id: 'dortlu:kurdi',
    seviye: 2,
    baslik: 'Kürdî dörtlüsü',
    bloklar: [
      {
        tur: 'metin',
        metin: "Kürdî dörtlüsü Dügâh'ta başlar: Dügâh, Kürdî, Çârgâh, Nevâ. Nota adlarıyla La, Si küçük mücenneb bemolü, Do, Re. Kürdî perdesini daha önce öğrendin; şimdi onu bir dörtlünün ikinci sesi olarak çalarsın.",
      },
      {
        tur: 'porte',
        olaylar: [n('A4'), n('B4b5'), n('C5'), n('D5')],
        aciklama: 'Kürdî dörtlüsü: Dügâh, Kürdî, Çârgâh, Nevâ; her ses bir vuruş. İkinci notanın önünde küçük mücenneb bemolü (5 koma) vardır.',
        bpm: 60,
      },
      { tur: 'metin', metin: 'Dörtlünün aralıkları (komayla):' },
      {
        tur: 'liste',
        maddeler: [
          'Dügâh – Kürdî: 4 koma (bakiye, dar aralık)',
          'Kürdî – Çârgâh: 9 koma (tanini, geniş aralık)',
          'Çârgâh – Nevâ: 9 koma (tanini, geniş aralık)',
        ],
      },
      {
        tur: 'metin',
        metin: "Çârgâh dörtlüsüyle karşılaştır: orada dar aralık sondaydı (9 + 9 + 4). Kürdî dörtlüsünde dar aralık başta (4 + 9 + 9). Aynı üç aralık, sırası değişince başka renk verir.",
      },
      {
        tur: 'dene',
        adimlar: [
          '"▶ Dinle" ile dörtlüyü dinle; ilk adımın küçük olduğunu duy.',
          "Dügâh'tan Nevâ'ya dört sesi tek tek çal. Kürdî'de akort göstergesine bak.",
          'Çârgâh dörtlüsünü yeniden çal ve iki dörtlüyü karşılaştır: küçük adım bir sonda, bir başta.',
          'Kürdî dörtlüsü etüdünü aç ve ♩ = 60\'ta metronomla çal.',
        ],
      },
    ],
    kaynaklar: [S3, S6, S8],
    alistirma: '/etut/dortlu-kurdi',
  },
  {
    id: 'dortlu:hicaz',
    seviye: 2,
    baslik: 'Hicaz dörtlüsü',
    bloklar: [
      {
        tur: 'metin',
        metin: "Hicaz dörtlüsü de Dügâh'ta başlar: Dügâh, Dik Kürdî, Nim Hicaz, Nevâ. Nota adlarıyla La, Si bakiye bemolü, Do bakiye diyezi, Re. Dik Kürdî ile Nim Hicaz perdelerini daha önce öğrendin.",
      },
      {
        tur: 'porte',
        olaylar: [n('A4'), n('B4b4'), n('C5#4'), n('D5')],
        aciklama: 'Hicaz dörtlüsü: Dügâh, Dik Kürdî, Nim Hicaz, Nevâ; her ses bir vuruş. İkinci notanın önünde bakiye bemolü, üçüncünün önünde bakiye diyezi vardır.',
        bpm: 60,
      },
      { tur: 'metin', metin: 'Dörtlünün aralıkları (komayla):' },
      {
        tur: 'liste',
        maddeler: [
          'Dügâh – Dik Kürdî: 5 koma (dar aralık)',
          'Dik Kürdî – Nim Hicaz: 12 koma (artık ikili, çok geniş aralık)',
          'Nim Hicaz – Nevâ: 5 koma (dar aralık)',
        ],
      },
      {
        tur: 'metin',
        metin: "Ortadaki geniş aralığa artık ikili denir. Bu aralık, tanini kadar (9 koma) değil, ondan da geniştir (12 koma). Hicaz'ın rengi bu aralıktan gelir. İki yanındaki dar aralıklar onu çevreler: dar, çok geniş, dar. Dik Kürdî'den Nim Hicaz'a çıkarken sesi geniş bir adımla yükselt, Nim Hicaz'dan Nevâ'ya ise yine küçük adım at.",
      },
      {
        tur: 'dene',
        adimlar: [
          '"▶ Dinle" ile dörtlüyü dinle; ortadaki geniş adımı duy.',
          "Dügâh'tan Nevâ'ya dört sesi tek tek çal. Dik Kürdî ve Nim Hicaz'da akort göstergesine bak.",
          'Kürdî dörtlüsüyle karşılaştır: orada ortada 9 koma vardı, burada 12 koma.',
          'Hicaz dörtlüsü etüdünü aç ve ♩ = 60\'ta metronomla çal.',
        ],
      },
    ],
    kaynaklar: [S3, S6, S8],
    alistirma: '/etut/dortlu-hicaz',
  },
]
