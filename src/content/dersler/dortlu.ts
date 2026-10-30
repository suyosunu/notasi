import { ACCIDENTAL_NAMES } from '../../music/accidentals'
import { n, S2, S3, S6 } from './nota'
import { TDV_RAST } from './makam'
import type { Ders } from './types'

// Seviye 2 dörtlü dersleri: Çârgâh dörtlüsü (Rast'ta), Kürdî dörtlüsü ve Hicaz dörtlüsü (Dügâh'ta). Araştırma notu,
// Seviye 2: "Makam henüz yok ... Çargâh dizisi ve kürdî, hicaz dörtlüleri dörtlü olarak tanıtılır" (S3 5. sınıf, S8 Ney I;
// makama geçiş S2 10.2 ve S6 h12–13'e göre üçüncü kademeden sonradır). Aralıklar AEÜ komalarıdır: Çârgâh 9+9+4, Kürdî 4+9+9,
// Hicaz 5+12+5 (Global Constraints; uygulamadaki Hicaz dizisiyle tutarlı). Porte örneği her derste dörtlünün çıkış dizisidir;
// notalar perdelerin yazılı notalarıdır (dersler.test.ts bunu ney-perdeler.ts ile karşılaştırır). Etütler etutler.ts'tedir.

const S8 =
  'S8 Aydın Adnan Menderes Üniv. Devlet Konservatuvarı THM, Ney I (KGTM133): https://ects.adu.edu.tr/programme-detail/3/7506/lecture/43295/'

// Seviye 3: beşli dersi (`dortlu:besli`). Araştırma C §3: beşli = dörtlü + bir tanini (9 koma), dörtlü 22, beşli 31 koma.
// Komaları açıkça yazan tek sayfa amatör bir blogdur; Wikipedia'nın perde tablosu (Çârgâh'a göre koma) ve TDV'nin çeşni
// tanımlarıyla çapraz kontrol edildi (Hicaz 5+12+5 yalnız perde konumlarından çıkarıldı). Beşli sütunu "dörtlü + 9" kuralıyla
// hesaplandı. Uşşak'ın beşlisi yoktur: kaynaklar Uşşak'ı yalnız dörtlü olarak kullanır.

const KOMA_BLOG =
  'muzikteorisiveegitimi.blogspot.com, Makam (dörtlü ve beşli komaları; amatör kaynak, perde konumlarıyla çapraz kontrol edildi): https://muzikteorisiveegitimi.blogspot.com/2013/01/makam.html'
const WIKI_PERDE =
  'en.wikipedia.org, List of notes in Turkish makam theory (Çârgâh’a göre koma farkı): https://en.wikipedia.org/wiki/List_of_notes_in_Turkish_makam_theory'

// Seviye 4 çeşni ve üçlüler dersi (`dortlu:cesni`, araştırma D §4). Çeşni tanımı MEB ünite 1115'ten, altı üçlünün adları MEB ünite 1113'ten,
// güçlü tanımı TDV "Makam" maddesinden. MEB üçlülerin komasını vermez; koma değerleri turkumuzikmerkezi.net'ten ve dörtlü komalarıyla
// tutarlıdır (üçlü = dörtlünün ilk iki aralığı). Tek ve zayıf bir kaynak olduğu için ders üçlüyü kısa tutar. Segâh, Ferahnâk, Nikriz
// ve Karcığar çeşnilerinin yapısı kaynaklarda açık olmadığından verilmez, yalnız adları anılır.
const MEB_CESNI =
  'MEB TYMM, Türk Müziği Teori ve Uygulaması, ünite 1115 (çeşni tanımı): https://tymm.meb.gov.tr/muzik-okullari-turk-muzigi-teori-uygulamasi-dersi/unite/1115'
const MEB_UCLU =
  'MEB TYMM, Türk Müziği Teori ve Uygulaması 6. sınıf, ünite 1113 (altı üçlünün adı; koma vermez): https://tymm.meb.gov.tr/muzik-okullari-turk-muzigi-teori-uygulamasi-dersi/unite/1113'
const TDV_MAKAM = 'TDV İslâm Ansiklopedisi, Makam (müzik; güçlü ve çeşni): https://islamansiklopedisi.org.tr/makam--musiki'
const KOMA_UCLU =
  'turkumuzikmerkezi.net, Makamlar (üçlülerin koma değerleri; tek ve zayıf kaynak, dörtlü komalarıyla tutarlı olduğu için kullanıldı): https://turkumuzikmerkezi.net/makamlar.php'
const BAKIYE_BEMOLU = ACCIDENTAL_NAMES[-4]
const BAKIYE_DIYEZI = ACCIDENTAL_NAMES[4]

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
  {
    id: 'dortlu:besli',
    seviye: 3,
    baslik: 'Beşli nedir?',
    bloklar: [
      {
        tur: 'metin',
        metin:
          'Beşli, birbirini izleyen beş sesten oluşan bir dizidir. Beşlide dört aralık vardır. Beşli, bir dörtlünün sonuna bir tanini aralığı (9 koma) eklenerek kurulur. Dörtlü 22 koma olduğu için beşli 22 + 9 = 31 komadır. Kademe geçişinde gördüğün 31 koma da bir beşlidir.',
      },
      { tur: 'metin', metin: 'Çeşni, dörtlülerle beşlilerin ortak adıdır: makamın rengini veren küçük dizi parçasıdır. Altı çeşninin aralıkları (komayla; önce dörtlü, sonra beşli):' },
      {
        tur: 'liste',
        maddeler: [
          'Çârgâh: dörtlü 9+9+4, beşli 9+9+4+9',
          'Bûselik: dörtlü 9+4+9, beşli 9+4+9+9',
          'Kürdî: dörtlü 4+9+9, beşli 4+9+9+9',
          'Rast: dörtlü 9+8+5, beşli 9+8+5+9',
          "Uşşak: dörtlü 8+5+9; beşlisi yoktur, kaynaklar Uşşak'ı yalnız dörtlü olarak kullanır",
          'Hicaz: dörtlü 5+12+5, beşli 5+12+5+9',
        ],
      },
      {
        tur: 'metin',
        metin:
          "Rakamlar aralıkların büyüklüğüdür: 9+8+5+9 demek, ilk aralık 9, ikincisi 8, üçüncüsü 5, dördüncüsü 9 komadır.",
      },
      {
        tur: 'porte',
        olaylar: [n('G4'), n('A4'), n('B4b1'), n('C5'), n('D5')],
        aciklama: "Rast'ta Rast beşlisi: Rast, Dügâh, Segâh, Çârgâh, Nevâ; her ses bir vuruş. Aralıklar 9+8+5+9 komadır. Segâh'ın önünde koma bemolü vardır.",
        bpm: 60,
      },
      {
        tur: 'porte',
        olaylar: [n('A4'), n('B4'), n('C5'), n('D5'), n('E5')],
        aciklama: "Dügâh'ta Bûselik beşlisi: Dügâh, Bûselik, Çârgâh, Nevâ, Hüseynî; her ses bir vuruş. Aralıklar 9+4+9+9 komadır. Hüseynî, üçüncü kademeden bir sestir.",
        bpm: 60,
      },
      {
        tur: 'porte',
        olaylar: [n('D5'), n('E5'), n('F5#4'), n('G5'), n('A5')],
        aciklama: "Nevâ'da Rast beşlisi: Nevâ, Hüseynî, Eviç, Gerdâniye, Muhayyer; her ses bir vuruş. Eviç'in önünde bakiye diyezi vardır. Aralıklar yine 9+8+5+9 komadır.",
        bpm: 60,
      },
      {
        tur: 'metin',
        metin:
          "Rast beşlisini iki yerde çalabilirsin: Rast'ta ve Nevâ'da. Dizi aynı aralıkları izler, yalnız yükseklik değişir. Nevâ'da Bûselik beşlisi de çalınır: Nevâ'dan başlar, Rast beşlisiyle aynı seslerden geçer, yalnız üçüncü ses Eviç yerine Acem olur (9+4+9+9). Etütte ikisini art arda çalarsın.",
      },
      {
        tur: 'metin',
        metin: 'Beşli, makamın yapı taşıdır. Sonraki derste makamı bir dörtlü ve bir beşliden kuracaksın. Beşliyi çalarken ♩ = 60 önerilen hızdır; bu bir öneridir, zorlanırsan yavaşlat.',
      },
      {
        tur: 'dene',
        adimlar: [
          '"▶ Dinle" ile Rast beşlisini dinle; beş sesi say.',
          "Rast'tan Nevâ'ya beş sesi tek tek çal; son aralığın Rast dörtlüsünün sonuna eklenen tanini olduğunu duy.",
          "Nevâ'da Rast beşlisi etüdünü aç ve ♩ = 60'ta metronomla çal.",
          "Sonra Nevâ'da Bûselik beşlisi etüdünü çal ve üçüncü sesin (Eviç yerine Acem) değiştiğini dinle.",
        ],
      },
    ],
    kaynaklar: [S3, S6, S2, TDV_RAST, KOMA_BLOG, WIKI_PERDE],
    alistirma: '/etut/neva-rast-besli',
  },
  {
    id: 'dortlu:cesni',
    seviye: 4,
    baslik: 'Çeşni ve üçlüler',
    bloklar: [
      {
        tur: 'metin',
        metin:
          'Çeşni, bir ezgiye renk veren kısa melodik yapıdır. Üçlü, dörtlü ya da beşli bir dizi parçasıyla kurulur. Dörtlüleri ve beşlileri çaldın; bu parçaların her biri bir çeşnidir.',
      },
      {
        tur: 'metin',
        metin:
          "Çeşniyi makam derslerinde zaten duydun: \"Nevâ'da bûselik çeşnili yarım karar\", \"Dügâh'ta uşşak çeşnili tam karar\". Yani çeşni, ezginin o perdede kalış yaptığı dörtlü ya da beşlidir. Güçlü ses, çeşnisini veren dörtlü ile beşlinin birleştiği ortak sestir.",
      },
      {
        tur: 'metin',
        metin:
          'Temel çeşniler altıdır: Çârgâh, Bûselik, Kürdî, Rast, Uşşak ve Hicaz. Bunların dörtlü ve beşli aralıklarını dörtlü ve beşli derslerinde gördün. Segâh, Ferahnâk, Nikriz ve Karcığar gibi başka çeşni adlarını da makam anlatımlarında duyarsın; bu uygulama onların yapısını anlatmaz, yalnız adlarını bil.',
      },
      {
        tur: 'metin',
        metin:
          'Üçlü, bir dörtlünün ilk üç sesidir; aralarında iki aralık vardır. Adları dörtlülerle aynıdır. Altı üçlü vardır. Aralıkların büyüklüğü komayla ölçülür (aşağıda önce iki aralık, sonra toplamı):',
      },
      {
        tur: 'liste',
        maddeler: [
          'Çârgâh üçlüsü: 9+9 = 18 koma',
          'Bûselik üçlüsü: 9+4 = 13 koma',
          'Kürdî üçlüsü: 4+9 = 13 koma',
          'Rast üçlüsü: 9+8 = 17 koma',
          'Uşşak üçlüsü: 8+5 = 13 koma',
          'Hicaz üçlüsü: 5+12 = 17 koma',
        ],
      },
      {
        tur: 'porte',
        olaylar: [n('G4'), n('A4'), n('B4')],
        aciklama: "Çârgâh üçlüsü (Rast'ta): Rast, Dügâh, Bûselik; her ses bir vuruş. Çârgâh dörtlüsünün ilk üç sesidir; iki aralık da geniştir (9+9).",
        bpm: 60,
      },
      {
        tur: 'porte',
        olaylar: [n('A4'), n('B4b1'), n('C5')],
        aciklama: "Uşşak üçlüsü (Dügâh'ta): Dügâh, Segâh, Çârgâh; her ses bir vuruş. Uşşak dörtlüsünün ilk üç sesidir (8+5). Segâh'ın önünde koma bemolü vardır.",
        bpm: 60,
      },
      {
        tur: 'porte',
        olaylar: [n('A4'), n('B4b4'), n('C5#4')],
        aciklama: `Hicaz üçlüsü (Dügâh'ta): Dügâh, Dik Kürdî, Nim Hicaz; her ses bir vuruş. Hicaz dörtlüsünün ilk üç sesidir (5+12). Dik Kürdî'nin önünde ${BAKIYE_BEMOLU}, Nim Hicaz'ın önünde ${BAKIYE_DIYEZI} vardır.`,
        bpm: 60,
      },
      {
        tur: 'metin',
        metin:
          'Toplamlar üçlüleri üç gruba ayırır: Bûselik, Kürdî ve Uşşak üçlüleri dar (13 koma), Rast ve Hicaz üçlüleri geniş (17 koma), Çârgâh üçlüsü en geniştir (18 koma). Üçlü kavramı ders kitaplarında kısa geçer; üçlülerin koma değerlerini yazan kaynak da sınırlıdır (kaynaklar bölümüne bak). Bu yüzden üçlüleri ezberleme: dörtlünün ilk üç sesi olduğunu bilmen yeter.',
      },
      {
        tur: 'dene',
        adimlar: [
          '"▶ Dinle" ile üç üçlüyü sırayla dinle; Çârgâh üçlüsünün iki geniş adımını, Hicaz üçlüsünün ortadaki çok geniş adımını duy.',
          "Rast'ta Çârgâh üçlüsünü çal; sonra dördüncü sesi (Çârgâh) ekleyip Çârgâh dörtlüsünü tamamla.",
          "Dügâh'ta Uşşak üçlüsünü ve Hicaz üçlüsünü çal; hangisinin daha geniş duyulduğunu söyle (Uşşak 13, Hicaz 17 koma).",
          'Makam bölümünden bir makam aç ve seyir yazısında geçen çeşni adlarını (bûselik, uşşak, rast …) bul.',
        ],
      },
    ],
    kaynaklar: [MEB_CESNI, MEB_UCLU, TDV_MAKAM, KOMA_UCLU],
    alistirma: '/makam',
  },
]
