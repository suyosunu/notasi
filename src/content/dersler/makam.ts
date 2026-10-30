import { ACCIDENTAL_NAMES } from '../../music/accidentals'
import { diziEvents } from '../../music/makam'
import { MAKAMLAR } from '../makamlar'
import type { Makam } from '../makamlar'
import { S2, S3, S6, n, s4 } from './nota'
import type { Ders } from './types'

// Seviye 3 makam dersleri: makamın unsurları (`makam:giris`), Rast ve Nevâ. Bilgiler araştırma C'nin §2'sinden
// (docs/superpowers/notes/2026-10-30-asama-c-arastirma.md: TDV İslâm Ansiklopedisi "Rast" ve "Nevâ" maddeleri,
// neyzenim _10) ve makamlar.ts'ten gelir; porte örnekleri aynı makam verisinden türetilir (dersler.test.ts bunu denetler).
// Nevâ seyri §2 "Seyir" satırından, kendi cümlelerimizle yazılır. Etütler (dizi-rast, dizi-neva) etutler.ts'tedir.
//
// Seviye 4 makam dersleri (Aşama D): Uşşak, Bayâtî, Hüseynî, Muhayyer, Kürdî, Hicaz. Bilgiler araştırma D'nin §3'ünden
// (docs/superpowers/notes/2026-10-30-asama-d-arastirma.md: TDV maddeleri ve neyzenim _10); seyir metinleri makamlar.ts'teki
// özetin üstüne §3'ün ayrıntılarını (asma karar, çeşni adı, başlangıç perdesi) ekler. Segâh, Ferahnâk ve Karcığar çeşnileri
// yalnız ad olarak anılır, yapıları anlatılmaz (kaynaklarda açık değil). Dizi etütleri (dizi-ussak-tiz …) Task 63'te eklenir.

export const TDV_RAST = 'TDV İslâm Ansiklopedisi, Rast (İsmail Hakkı Özkan): https://islamansiklopedisi.org.tr/rast'
export const TDV_NEVA = 'TDV İslâm Ansiklopedisi, Nevâ (İsmail Hakkı Özkan): https://islamansiklopedisi.org.tr/neva'
const TDV_USSAK = 'TDV İslâm Ansiklopedisi, Uşşak: https://islamansiklopedisi.org.tr/ussak'
const TDV_BAYATI = 'TDV İslâm Ansiklopedisi, Bayâtî (müzik; kısa madde): https://islamansiklopedisi.org.tr/bayati--musiki'
const TDV_HUSEYNI = 'TDV İslâm Ansiklopedisi, Hüseynî (İsmail Hakkı Özkan): https://islamansiklopedisi.org.tr/huseyni'
const TDV_MUHAYYER = 'TDV İslâm Ansiklopedisi, Muhayyer (İsmail Hakkı Özkan): https://islamansiklopedisi.org.tr/muhayyer'
const TDV_KURDI = 'TDV İslâm Ansiklopedisi, Kürdî: https://islamansiklopedisi.org.tr/kurdi'
const TDV_HICAZ = 'TDV İslâm Ansiklopedisi, Hicaz: https://islamansiklopedisi.org.tr/hicaz-2'

const RAST = MAKAMLAR.find((m) => m.id === 'rast')!
const NEVA = MAKAMLAR.find((m) => m.id === 'neva')!
const USSAK = MAKAMLAR.find((m) => m.id === 'ussak')!
const BAYATI = MAKAMLAR.find((m) => m.id === 'bayati')!
const HUSEYNI = MAKAMLAR.find((m) => m.id === 'huseyni')!
const MUHAYYER = MAKAMLAR.find((m) => m.id === 'muhayyer')!
const KURDI = MAKAMLAR.find((m) => m.id === 'kurdi')!
const HICAZ = MAKAMLAR.find((m) => m.id === 'hicaz')!

const KOMA_BEMOLU = ACCIDENTAL_NAMES[-1]
const BAKIYE_DIYEZI = ACCIDENTAL_NAMES[4]
const BAKIYE_BEMOLU = ACCIDENTAL_NAMES[-4]
const KUCUK_MUCENNEB_BEMOLU = ACCIDENTAL_NAMES[-5]

/** Dizinin tersi (iniş); `inis` verilmişse o dizi. */
const inisDizisi = (m: Makam) => [...(m.inis ?? m.dizi)].reverse()

export const MAKAM_DERSLERI: Ders[] = [
  {
    id: 'makam:giris',
    seviye: 3,
    baslik: 'Makam nedir?',
    bloklar: [
      {
        tur: 'metin',
        metin:
          'Makam, bir ezginin hangi seslerle kurulduğunu ve nasıl yürüdüğünü belirleyen düzendir. Şimdiye kadar tek tek sesleri, dörtlüleri ve beşlileri çaldın. Makam bunları bir araya getirir.',
      },
      { tur: 'metin', metin: 'Bir makamı altı şeyle tanırsın:' },
      {
        tur: 'liste',
        maddeler: [
          'Dizi: makamın seslerinin pestten tize sıralanışı. Bir makamı önce dizisiyle tanırsın.',
          'Durak: makamın karar sesi. Ezgi sonunda buraya döner ve burada biter.',
          'Güçlü: dizinin ikinci önemli sesi. Ezgi bu sesin çevresinde dolaşır ve sık sık burada yarım karar yapar, yani bir an dinlenir.',
          'Yeden: durağın altındaki komşu ses.',
          'Asma karar: ezginin durakta değil, dizinin başka bir sesinde geçici olarak dinlendiği yer.',
          'Seyir: ezginin izlediği yol; nereden başlar, nerelerde dolaşır, nerelerde dinlenir, nerede biter. Pestten ya da durak çevresinden başlayıp tize doğru gelişen seyre çıkıcı, tizden başlayıp peste inen seyre inici denir.',
        ],
      },
      {
        tur: 'metin',
        metin: `Makam bir dörtlü ve bir beşliden kurulur. Rast örneği: ${RAST.yapi}. Rast beşlisi Rast'tan Nevâ'ya kadar beş sestir; Nevâ'dan başlayan Rast dörtlüsü dört sestir. İki parça Nevâ'da birleşir: beşlinin son sesi dörtlünün ilk sesidir.`,
      },
      {
        tur: 'porte',
        olaylar: diziEvents(RAST.dizi.slice(0, 5), 'quarter'),
        aciklama: "Rast beşlisi (Rast'ta): Rast, Dügâh, Segâh, Çârgâh, Nevâ; her ses bir vuruş. Segâh'ın önünde koma bemolü vardır.",
        bpm: 60,
      },
      {
        tur: 'porte',
        olaylar: diziEvents(RAST.dizi.slice(4), 'quarter'),
        aciklama: `Rast dörtlüsü (Nevâ'da): Nevâ, Hüseynî, Eviç, Gerdâniye; her ses bir vuruş. Eviç'in önünde ${BAKIYE_DIYEZI} vardır.`,
        bpm: 60,
      },
      {
        tur: 'metin',
        metin: `Rast makamında durak ${RAST.durak}, güçlü ${RAST.guclu}, yeden ${RAST.yeden}. Rast'ın yedeni olan Irak, bu seviyede çaldığın perdeler arasında yok; yalnız adını bil. Makam bölümünde her makamın durağını, güçlüsünü ve yedenini; Rast ve Nevâ'nın yapısını görebilirsin. Rast ve Nevâ derslerinde bu makamların seyir özetini, Nevâ dersinde asma karar yerlerini göreceksin.`,
      },
      {
        tur: 'metin',
        metin: "Bu seviyede iki makam öğreneceksin: Rast ve Nevâ. Uşşak, Bayâtî, Hüseynî, Muhayyer, Kürdî ve Hicaz'ın dersleri Seviye 4'tedir; makam bölümünde adlarını görsen de şimdilik dizilerine bakman yeter.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Makam bölümünde Rast\'a dokun ve "🔊 Diziyi dinle" ile dizisini dinle.',
          'Sayfadaki Durak, Güçlü, Yeden ve Yapı satırlarını bu dersteki tanımlarla eşleştir.',
          "Rast beşlisini (Rast'tan Nevâ'ya beş ses) neyinle yavaş çal.",
          'Sonra Makam bölümündeki "Sorularla çalış" ile kendini dene.',
        ],
      },
    ],
    kaynaklar: [TDV_RAST, TDV_NEVA, S2, S6],
    alistirma: '/makam',
  },
  {
    id: 'makam:rast',
    seviye: 3,
    baslik: 'Rast makamı',
    bloklar: [
      {
        tur: 'metin',
        metin: `Rast, bildiğin Rast perdesinde karar veren makamdır. Yapısı: ${RAST.yapi}. Yani Rast'tan Nevâ'ya kadar bir Rast beşlisi çalarsın (9+8+5+9 koma), Nevâ'dan Gerdâniye'ye kadar bir Rast dörtlüsü (9+8+5 koma).`,
      },
      {
        tur: 'metin',
        metin: `Durak ${RAST.durak}, güçlü ${RAST.guclu}, yeden ${RAST.yeden}. Dizide iki işaretli ses vardır: Segâh (Si ${KOMA_BEMOLU}) ve Eviç (Fa ${BAKIYE_DIYEZI}).`,
      },
      {
        tur: 'porte',
        olaylar: diziEvents(RAST.dizi, 'quarter'),
        aciklama: "Çıkış: Rast'tan Gerdâniye'ye, her ses bir vuruş. Rast'tan sayınca yedinci ses Eviç'tir: önünde bakiye diyezi vardır.",
        bpm: 60,
      },
      {
        tur: 'metin',
        metin: 'Rast inerken başka bir yol izler. İnişte Eviç yerine Acem çalınır; Acem, işaretsiz Fa\'dır. Böyle iniş yapan diziye acemli rast dizisi denir.',
      },
      {
        tur: 'porte',
        olaylar: diziEvents(inisDizisi(RAST), 'quarter'),
        aciklama: "İniş: Gerdâniye'den Rast'a, her ses bir vuruş. Rast'tan sayınca yedinci ses Acem'dir (Gerdâniye'den sayınca ikinci ses): Fa, önünde işaret yok.",
        bpm: 60,
      },
      {
        tur: 'metin',
        metin:
          'Seyri: Rast çıkıcı bir makamdır. Durak civarından ya da pest bölgeden başlanır, orta bölgede dolaşılır. Güçlü olan Nevâ\'da yarım karar yapılır, sonunda Rast\'ta tam karar verilir. İnişte Eviç yerine Acem kullanılır.',
      },
      {
        tur: 'metin',
        metin:
          'Eviç ve Acem ayrı perdelerdir. Eviç Segâh parmağıyla, Acem Kürdî parmağıyla çalınır; ikisi de daha sert nefesle çıkar. Eviç, Acem\'den bir bakiye yüksektir. "▶ Dinle" ile çıkışı ve inişi art arda dinleyince bu farkı duyarsın.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Makam bölümünde Rast\'ı aç ve "🔊 Diziyi dinle" ile çıkışı ve inişi dinle; yedinci sesin değiştiğini duy.',
          "Çıkışta Rast'tan Gerdâniye'ye sekiz sesi tek tek çal; Eviç'te parmağını dikkatle koy.",
          "İnişte Gerdâniye'den Rast'a çal; yedinci sesi Acem olarak çal.",
          'Rast dizisi etüdünü aç ve ♩ = 60\'ta metronomla çal.',
        ],
      },
    ],
    kaynaklar: [TDV_RAST, s4(10), S2],
    alistirma: '/etut/dizi-rast',
  },
  {
    id: 'makam:neva',
    seviye: 3,
    baslik: 'Nevâ makamı',
    bloklar: [
      {
        tur: 'metin',
        metin: `Nevâ makamının adı Nevâ perdesiyle aynıdır; makamın güçlü sesi de Nevâ'dır. Yapısı: ${NEVA.yapi}. Dügâh'tan Nevâ'ya Uşşak dörtlüsünü çalarsın (La, Si ${KOMA_BEMOLU}, Do, Re; 8+5+9 koma). Nevâ'dan Muhayyer'e Rast beşlisini çalarsın (Re, Mi, Fa ${BAKIYE_DIYEZI}, Sol, La; 9+8+5+9 koma).`,
      },
      {
        tur: 'porte',
        olaylar: diziEvents(NEVA.dizi, 'quarter'),
        aciklama: "Nevâ dizisi: Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Eviç, Gerdâniye, Muhayyer; her ses bir vuruş. Segâh'ın önünde koma bemolü, Eviç'in önünde bakiye diyezi vardır.",
        bpm: 60,
      },
      {
        tur: 'liste',
        maddeler: [
          `Durak: ${NEVA.durak}`,
          `Güçlü: ${NEVA.guclu}`,
          `Yeden: ${NEVA.yeden}`,
          'Donanım: Segâh ve Eviç',
        ],
      },
      {
        tur: 'metin',
        metin: `Nevâ'nın pest yarısı Uşşak ile aynıdır: ikisi de Dügâh'ta karar verir, aynı dörtlüyü kullanır, güçlüleri Nevâ'dır. Fark altıncı sestedir. Uşşak'ta Acem (Fa, işaretsiz), Nevâ'da Eviç (Fa ${BAKIYE_DIYEZI}) çalınır. Seyirleri de ayrılır: Nevâ güçlü sesten, yani Nevâ civarından başlar.`,
      },
      {
        tur: 'porte',
        olaylar: diziEvents(USSAK.dizi.slice(4, 7), 'quarter'),
        aciklama: 'Uşşak: Hüseynî, Acem, Gerdâniye. Ortadaki ses işaretsiz Fa.',
        bpm: 60,
      },
      {
        tur: 'porte',
        olaylar: diziEvents(NEVA.dizi.slice(4, 7), 'quarter'),
        aciklama: 'Nevâ: Hüseynî, Eviç, Gerdâniye. Ortadaki Fa\'nın önünde bakiye diyezi var; ses biraz daha tizdir.',
        bpm: 60,
      },
      {
        tur: 'metin',
        metin:
          "Seyri: Nevâ civarından başlanır. Nevâ'nın iki yanında, uşşak ve rast çeşnilerinde dolaşılır. Nevâ'da yarım karar yapılır; bu karar çoğunlukla rast çeşnilidir, nadiren bûselik çeşnili olur. Sonra dizide inilir ve Dügâh'ta tam karar verilir. Çeşni, makamın kurulduğu dörtlü ve beşlilerin genel adıdır.",
      },
      {
        tur: 'metin',
        metin:
          "Asma karar iki yerde yapılır. Eviç'te segâh çeşnisiyle asma karar yapılır; segâh çeşnisinin adını bil; yapısı bu uygulamada anlatılmaz. Nevâ'da ise bûselik çeşnisiyle asma karar ya da yarım karar yapılırken Eviç yerine Acem kullanılır. Yani bu makamda da Fa iki biçimde çalınır: Eviç ve Acem. Dizi çıkarken Eviç'i çalarsın; Acem yalnız bu bûselik çeşnili yerde gelir.",
      },
      {
        tur: 'metin',
        metin:
          "Dizi Muhayyer'in üstüne de uzanır; o sesler Seviye 4'tedir. Dizi etüdünde inerken Nevâ'yı kapalı Nevâ (Rast parmağı) ile çalarsın. Zeki Sözen, kapalı Nevâ'yı tiz seslerden orta seslere inerken çok kullanacağımızı yazar. Etüdün bu kalıbı bu uygulamanın önerisidir.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Makam bölümünde Nevâ\'yı aç ve "🔊 Diziyi dinle" ile dizisini dinle.',
          "Dügâh'tan Muhayyer'e sekiz sesi tek tek çal; Eviç'te parmağını dikkatle koy.",
          'Uşşak ile Nevâ\'yı karşılaştır: ikisini de Nevâ\'ya kadar çal, sonra altıncı sesi Acem ve Eviç olarak dinle.',
          'Nevâ dizisi etüdünü aç ve ♩ = 60\'ta metronomla çal.',
        ],
      },
    ],
    kaynaklar: [TDV_NEVA, s4(9), S2],
    alistirma: '/etut/dizi-neva',
  },
  {
    id: 'makam:ussak',
    seviye: 4,
    baslik: 'Uşşak makamı',
    bloklar: [
      {
        tur: 'metin',
        metin: `Uşşak, Dügâh'ta karar veren çıkıcı bir makamdır. Yapısı: ${USSAK.yapi}. Dügâh'tan Nevâ'ya Uşşak dörtlüsünü çalarsın (8+5+9 koma), Nevâ'dan Muhayyer'e Bûselik beşlisini (9+4+9+9 koma). Dizide tek işaretli ses vardır: Segâh (Si ${KOMA_BEMOLU}).`,
      },
      {
        tur: 'porte',
        olaylar: diziEvents(USSAK.dizi, 'quarter'),
        aciklama: "Uşşak dizisi: Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer; her ses bir vuruş. Segâh'ın önünde koma bemolü vardır; Acem, işaretsiz Fa'dır.",
        bpm: 60,
      },
      {
        tur: 'liste',
        maddeler: [`Durak: ${USSAK.durak}`, `Güçlü: ${USSAK.guclu}`, `Yeden: ${USSAK.yeden}`, 'Donanım: Segâh'],
      },
      {
        tur: 'metin',
        metin: "Nevâ dersinde Uşşak ile Nevâ'nın pest yarısının aynı olduğunu gördün. Fark altıncı sestedir: Uşşak'ta Acem (işaretsiz Fa), Nevâ'da Eviç. Uşşak'ta Eviç yoktur.",
      },
      {
        tur: 'metin',
        metin:
          "Seyri: Uşşak çıkıcı bir makamdır. Dügâh'tan başlanır. Önce Dügâh çevresindeki Uşşak dörtlüsünde dolaşılır, sonra Nevâ çevresinde gezinilir. Güçlü olan Nevâ'da bûselik çeşnili yarım karar yapılır, Dügâh'ta uşşak çeşnili tam karar verilir.",
      },
      {
        tur: 'metin',
        metin: `En önemli asma karar Segâh'tır. Segâh yazıda hep aynı kalır (Si ${KOMA_BEMOLU}), ama seyir inerken biraz daha pest basılır. Kaynaklar bu farkı 1–2 koma (TDV) ya da 2–3 koma (neyzenim) diye yazar; kulağınla ayarla, kesin bir sayıya bağlanma.`,
      },
      {
        tur: 'metin',
        metin:
          "Uşşak'ta tiz durak Muhayyer'in üstüne çıkılabilir, ama orada kalınmaz. Tiz tarafa genişlemek Bayâtî'nin özelliğidir. Bayâtî, Uşşak ile aynı sekiz sesi kullanır; ikisini seyir ayırır. Bunu Bayâtî dersinde göreceksin.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Makam bölümünde Uşşak\'ı aç ve "🔊 Diziyi dinle" ile dizisini dinle.',
          "Dügâh'tan Muhayyer'e sekiz sesi tek tek çal; Segâh'ta akort göstergesine bak.",
          "Önce Dügâh'taki Uşşak dörtlüsünü (Dügâh, Segâh, Çârgâh, Nevâ) çal, Nevâ'da dur; sonra Dügâh'a inip bitir. Uşşak seyrinin iskeleti budur.",
          'Uşşak dizisi etüdünü aç ve ♩ = 60\'ta metronomla çal.',
        ],
      },
    ],
    kaynaklar: [TDV_USSAK, s4(10), S2],
    alistirma: '/etut/dizi-ussak-tiz',
  },
  {
    id: 'makam:bayati',
    seviye: 4,
    baslik: 'Bayâtî makamı',
    bloklar: [
      {
        tur: 'metin',
        metin: `Bayâtî, Uşşak ile aynı diziyi kullanır: aynı sekiz ses, aynı donanım (yalnız Segâh), aynı durak, güçlü ve yeden. Yapısı da aynıdır: ${BAYATI.yapi}. İki makamı dizi ayırmaz, seyir ayırır.`,
      },
      {
        tur: 'porte',
        olaylar: diziEvents(BAYATI.dizi, 'quarter'),
        aciklama: "Bayâtî dizisi (Uşşak ile aynı): Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer; her ses bir vuruş. Segâh'ın önünde koma bemolü vardır.",
        bpm: 60,
      },
      {
        tur: 'liste',
        maddeler: [`Durak: ${BAYATI.durak}`, `Güçlü: ${BAYATI.guclu}`, `Yeden: ${BAYATI.yeden}`, 'Donanım: Segâh'],
      },
      {
        tur: 'metin',
        metin:
          "Fark nereden başladığındadır. Uşşak Dügâh'tan başlar. Bayâtî ise güçlü sesin çevresinden, Nevâ'dan başlar. İkisi de Dügâh'ta karar verir. Yani aynı sesleri çalarsın, ama ezgi Nevâ'dan başlıyorsa Bayâtî duyarsın.",
      },
      {
        tur: 'metin',
        metin: `Seyri: Nevâ çevresinden başlanır. Nevâ'da bûselik çeşnili yarım karar yapılır, sonunda Dügâh'ta uşşak dörtlüsüyle tam karar verilir. Segâh asma kararı önemlidir (segâh ya da ferahnâk çeşnili); Uşşak'taki gibi Segâh biraz daha pest basılır. Nevâ, Acem, Hüseynî ve Çârgâh'ta da asma karar yapılabilir. Segâh ve ferahnâk çeşnilerinin adlarını bil; yapıları bu uygulamada anlatılmaz.`,
      },
      {
        tur: 'metin',
        metin:
          "Kaynaklar Bayâtî'nin seyir yönünü aynı biçimde yazmaz; bu yüzden burada yön söylemiyoruz. Başlangıç sesine (Nevâ) ve karar sesine (Dügâh) bak, yeter.",
      },
      {
        tur: 'metin',
        metin: "Bayâtî dizisi çoğunlukla tiz tarafa doğru genişletilir; Uşşak'tan bu özelliğiyle de ayrılır. Tiz genişlemeyi bu derste çalmayacaksın.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Makam bölümünde Bayâtî\'yi aç ve "🔊 Diziyi dinle" ile dizisini dinle; Uşşak ile aynı sesleri duy.',
          "Sekiz sesi Dügâh'tan Muhayyer'e çal; sonra aynı sesleri bu kez Nevâ'dan başlayıp Dügâh'ta bitirerek çal. Bayâtî seyrinin yolu budur.",
          'Aynı ezgiyi bir kez Dügâh\'tan, bir kez Nevâ\'dan başlayarak çal; hangisinin Uşşak, hangisinin Bayâtî olduğunu söyle.',
          'Bayâtî dizisi etüdünü aç ve ♩ = 60\'ta metronomla çal.',
        ],
      },
    ],
    kaynaklar: [TDV_BAYATI, s4(10), "turkumuzikmerkezi.net, Makamlar (Bayâtî'nin seyir yönü kaynaklar arasında çelişir): https://turkumuzikmerkezi.net/makamlar.php"],
    alistirma: '/etut/dizi-bayati',
  },
  {
    id: 'makam:huseyni',
    seviye: 4,
    baslik: 'Hüseynî makamı',
    bloklar: [
      {
        tur: 'metin',
        metin: `Hüseynî, Dügâh'ta karar veren bir makamdır. Yapısı: ${HUSEYNI.yapi}. Dügâh'tan Hüseynî'ye Hüseynî beşlisini çalarsın (8+5+9+9 koma), Hüseynî'den Muhayyer'e Uşşak dörtlüsünü (8+5+9 koma). Hüseynî beşlisi: Uşşak dörtlüsü (8+5+9) ve bir tanini (9), toplam 31 koma. Dizide iki işaretli ses vardır: Segâh (Si ${KOMA_BEMOLU}) ve Eviç (Fa ${BAKIYE_DIYEZI}).`,
      },
      {
        tur: 'porte',
        olaylar: diziEvents(HUSEYNI.dizi, 'quarter'),
        aciklama: "Hüseynî, çıkış: Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Eviç, Gerdâniye, Muhayyer; her ses bir vuruş.",
        bpm: 60,
      },
      {
        tur: 'metin',
        metin: "Hüseynî inerken çoğunlukla Eviç yerine Acem çalınır. Böyle iniş yapan diziye acemli hüseynî dizisi denir. Hüseynî eserlerinin hemen hepsinde Acem de geçer.",
      },
      {
        tur: 'porte',
        olaylar: diziEvents(inisDizisi(HUSEYNI), 'quarter'),
        aciklama: "Hüseynî, iniş (acemli): Muhayyer'den Dügâh'a, her ses bir vuruş. Eviç yerine Acem, işaretsiz Fa.",
        bpm: 60,
      },
      {
        tur: 'liste',
        maddeler: [`Durak: ${HUSEYNI.durak}`, `Güçlü: ${HUSEYNI.guclu}`, `Yeden: ${HUSEYNI.yeden}`, 'Donanım: Segâh ve Eviç'],
      },
      {
        tur: 'metin',
        metin:
          "Hüseynî dizisi Nevâ ile aynı sekiz sestir: aynı durak, aynı yeden, aynı donanım. Makamı güçlü ses ve seyir ayırır. Nevâ'nın güçlüsü Nevâ'dır; Hüseynî'nin güçlüsü Hüseynî'dir (Mi). Nevâ seyre Nevâ çevresinden başlar, Hüseynî ise Hüseynî'den.",
      },
      {
        tur: 'metin',
        metin:
          "Seyri: Hüseynî inici-çıkıcı bir makamdır. Hüseynî'den başlanır, çeşnilerde karışık dolaşılır. Güçlü olan Hüseynî'de uşşak çeşnili yarım karar yapılır, sonunda Dügâh'ta Hüseynî dizisiyle tam karar verilir.",
      },
      {
        tur: 'metin',
        metin:
          "En önemli asma karar Çârgâh'tır; bu makamın en karakteristik asma kararıdır (acemli inişte çârgâh çeşnili). İkinci asma karar Segâh'tır (segâh ya da ferahnâk çeşnili). Nevâ'da rast ya da bûselik çeşnili, Rast'ta da asma karar yapılabilir. Segâh ve ferahnâk çeşnilerinin yapıları bu uygulamada anlatılmaz; yalnız adlarını bil.",
      },
      {
        tur: 'metin',
        metin: "Hüseynî dizisi tiz tarafa da uzanır: Muhayyer'in üstünde dolaşılır. Bu tiz bölgeyi Muhayyer dersinde göreceksin.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Makam bölümünde Hüseynî\'yi aç ve "🔊 Diziyi dinle" ile çıkışı ve inişi dinle; altıncı sesin Eviç\'ten Acem\'e döndüğünü duy.',
          "Çıkışta Dügâh'tan Muhayyer'e sekiz sesi çal; Eviç'te parmağını dikkatle koy.",
          "İnişte Muhayyer'den Dügâh'a çal; altıncı sesi Acem olarak çal.",
          "Hüseynî'den başla, Çârgâh'ta bir an dinlen, Hüseynî'de uşşak çeşnili yarım karar gibi dur ve Dügâh'ta bitir; Hüseynî seyrinin iskeleti budur.",
          'Hüseynî dizisi etüdünü aç ve ♩ = 60\'ta metronomla çal.',
        ],
      },
    ],
    kaynaklar: [TDV_HUSEYNI, s4(10), S2],
    alistirma: '/etut/dizi-huseyni',
  },
  {
    id: 'makam:muhayyer',
    seviye: 4,
    baslik: 'Muhayyer makamı',
    bloklar: [
      {
        tur: 'metin',
        metin: `Muhayyer, Hüseynî makamının inici biçimidir. Dizisi Hüseynî ile aynıdır: aynı sekiz ses, aynı donanım (Segâh ve Eviç), aynı durak ve yeden. Yapısı: ${MUHAYYER.yapi}. İnişte Hüseynî'deki gibi çoğunlukla Eviç yerine Acem çalınır.`,
      },
      {
        tur: 'porte',
        olaylar: diziEvents(MUHAYYER.dizi, 'quarter'),
        aciklama: 'Muhayyer, çıkış (Hüseynî ile aynı): Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Eviç, Gerdâniye, Muhayyer; her ses bir vuruş.',
        bpm: 60,
      },
      {
        tur: 'porte',
        olaylar: diziEvents(inisDizisi(MUHAYYER), 'quarter'),
        aciklama: "Muhayyer, iniş (acemli hüseynî dizisi): Muhayyer'den Dügâh'a, her ses bir vuruş. Eviç yerine Acem, işaretsiz Fa.",
        bpm: 60,
      },
      {
        tur: 'liste',
        maddeler: [`Durak: ${MUHAYYER.durak}`, `Güçlü: ${MUHAYYER.guclu} (tiz durak)`, `Yeden: ${MUHAYYER.yeden}`, 'Donanım: Segâh ve Eviç'],
      },
      {
        tur: 'metin',
        metin: 'Aynı sesleri kullanan dört makamı birbirinden seyir ayırır. Başlangıç sesi ve yön özeti:',
      },
      {
        tur: 'liste',
        maddeler: [
          "Uşşak: Dügâh'tan başlar, çıkıcıdır.",
          "Bayâtî: Nevâ'dan başlar (Uşşak ile aynı dizi).",
          "Hüseynî: Hüseynî'den başlar, inici-çıkıcıdır (Nevâ ile aynı dizi).",
          "Muhayyer: Muhayyer'den başlar, inicidir (Hüseynî ile aynı dizi).",
        ],
      },
      {
        tur: 'metin',
        metin: "Dördünde de tam karar Dügâh'tadır. Sekiz sesin hangi makamda çalındığını nota kümesi tek başına söylemez; ezginin nereden başlayıp nerede dinlendiğine bakarsın.",
      },
      {
        tur: 'metin',
        metin:
          "Seyri: Muhayyer inici bir makamdır. Muhayyer'den, yani tiz duraktan başlanır. Tiz bölgede dolaşılır ve Muhayyer'de yarım karar yapılır (uşşak ya da hüseynî çeşnili). Sonra orta bölgeye inilir. Hüseynî ikinci güçlüdür; orada uşşak çeşnili asma karar yapılabilir. Orta bölgede sırayla asma kararlar gösterilir: Nevâ'da rast çeşnili, Nevâ'da Eviç yerine Acem ile bûselik çeşnili, Çârgâh'ta çârgâh çeşnili, Segâh'ta segâh ya da ferahnâk çeşnili, Rast'ta rast çeşnili. Sonunda Dügâh'ta Hüseynî dizisiyle tam karar verilir.",
      },
      {
        tur: 'metin',
        metin: "Muhayyer'den başladığın için bu makamda tiz bölgede de çalarsın: Muhayyer'in üstünde Tiz Segâh, Tiz Çârgâh ve Tiz Nevâ vardır. Tiz perdelerde nefesi daha da sert üflersin ve dudağın biraz daha büzülür; tiz perde derslerinde bunu gördün.",
      },
      {
        tur: 'porte',
        olaylar: [n('A5'), n('B5b1'), n('C6'), n('D6')],
        aciklama: 'Tiz bölge: Muhayyer, Tiz Segâh, Tiz Çârgâh, Tiz Nevâ; her ses bir vuruş. Tiz Segâh\'ın önünde koma bemolü vardır.',
        bpm: 60,
      },
      {
        tur: 'dene',
        adimlar: [
          'Makam bölümünde Muhayyer\'i aç ve "🔊 Diziyi dinle" ile dizisini dinle; Hüseynî ile aynı sesleri duy.',
          "Muhayyer'den Tiz Nevâ'ya dört tiz sesi yavaş çal; her sesi sert ve dengeli üfle.",
          "Sonra Muhayyer'den Dügâh'a inerek çal; altıncı sesi Acem olarak çal ve Dügâh'ta dur.",
          "Aynı sekiz sesi bir kez Hüseynî'den, bir kez Muhayyer'den başlayıp Dügâh'ta bitirerek çal; iki makamın farkını başlangıç sesinde duy.",
          'Muhayyer dizisi etüdünü aç ve ♩ = 60\'ta metronomla çal.',
        ],
      },
    ],
    kaynaklar: [TDV_MUHAYYER, TDV_HUSEYNI, s4(10), s4(8)],
    alistirma: '/etut/dizi-muhayyer',
  },
  {
    id: 'makam:kurdi',
    seviye: 4,
    baslik: 'Kürdî makamı',
    bloklar: [
      {
        tur: 'metin',
        metin: `Kürdî, Dügâh'ta karar veren makamdır. Yapısı: ${KURDI.yapi}. Dügâh'tan Nevâ'ya Kürdî dörtlüsünü çalarsın (4+9+9 koma; dörtlü dersinden tanıyorsun), Nevâ'dan Muhayyer'e Bûselik beşlisini (9+4+9+9 koma). Dizide tek işaretli ses vardır: Kürdî (Si ${KUCUK_MUCENNEB_BEMOLU}).`,
      },
      {
        tur: 'porte',
        olaylar: diziEvents(KURDI.dizi, 'quarter'),
        aciklama: "Kürdî dizisi: Dügâh, Kürdî, Çârgâh, Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer; her ses bir vuruş. İkinci notanın önünde küçük mücenneb bemolü vardır; Acem, işaretsiz Fa'dır.",
        bpm: 60,
      },
      {
        tur: 'liste',
        maddeler: [`Durak: ${KURDI.durak}`, `Güçlü: ${KURDI.guclu}`, `Yeden: ${KURDI.yeden}`, 'Donanım: Kürdî (Si küçük mücenneb bemolü)'],
      },
      {
        tur: 'metin',
        metin:
          "Uşşak ile karşılaştır: Nevâ'dan sonrası aynıdır (Bûselik beşlisi), Çârgâh ve Nevâ da aynıdır. Fark ikinci sestedir: Uşşak'ta Segâh (Si koma bemolü), Kürdî'de Kürdî perdesi (Si küçük mücenneb bemolü); Kürdî daha pesttir. Dügâh'tan sonraki adım Kürdî'de küçüktür (4 koma).",
      },
      {
        tur: 'metin',
        metin:
          "Seyri: Kürdî çıkıcı bir makamdır, bazen çıkıcı-inici olur. Durak ya da güçlü sesin çevresinden başlanır, çeşnilerde dolaşılır. Güçlü olan Nevâ'da bûselik çeşnili yarım karar yapılır, sonunda Kürdî dizisiyle Dügâh'ta tam karar verilir.",
      },
      {
        tur: 'metin',
        metin: "Seyir sırasında asma kararlar Çârgâh'ta (çârgâh çeşnili), Kürdî perdesinde (çeşnisiz) ve Rast'ta (bûselik çeşnili) yapılır.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Makam bölümünde Kürdî\'yi aç ve "🔊 Diziyi dinle" ile dizisini dinle.',
          "Uşşak dizisini çal, sonra Kürdî dizisini çal; yalnız ikinci sesin değiştiğini duy. Kürdî perdesinde akort göstergesine bak.",
          "Dügâh'tan Nevâ'ya Kürdî dörtlüsünü çal, Nevâ'da yarım karar gibi dur, sonra Dügâh'a dön.",
          'Kürdî dizisi etüdünü aç ve ♩ = 60\'ta metronomla çal.',
        ],
      },
    ],
    kaynaklar: [TDV_KURDI, S3, S6],
    alistirma: '/etut/dizi-kurdi',
  },
  {
    id: 'makam:hicaz',
    seviye: 4,
    baslik: 'Hicaz makamı',
    bloklar: [
      {
        tur: 'metin',
        metin: `Hicaz, Dügâh'ta karar veren makamdır. Yapısı: ${HICAZ.yapi}. Dügâh'tan Nevâ'ya Hicaz dörtlüsünü çalarsın (5+12+5 koma; dörtlü dersinden tanıyorsun), Nevâ'dan Muhayyer'e Rast beşlisini (9+8+5+9 koma). Hicaz'ın rengini ortadaki geniş aralık (12 koma) verir.`,
      },
      {
        tur: 'porte',
        olaylar: diziEvents(HICAZ.dizi, 'quarter'),
        aciklama: `Hicaz dizisi: Dügâh, Dik Kürdî, Nim Hicaz, Nevâ, Hüseynî, Eviç, Gerdâniye, Muhayyer; her ses bir vuruş. Dik Kürdî'nin önünde ${BAKIYE_BEMOLU}, Nim Hicaz'ın ve Eviç'in önünde ${BAKIYE_DIYEZI} vardır.`,
        bpm: 60,
      },
      {
        tur: 'liste',
        maddeler: [
          `Durak: ${HICAZ.durak}`,
          `Güçlü: ${HICAZ.guclu}`,
          `Yeden: ${HICAZ.yeden}`,
          `Donanım: Dik Kürdî (Si ${BAKIYE_BEMOLU}), Eviç (Fa ${BAKIYE_DIYEZI}), Nim Hicaz (Do ${BAKIYE_DIYEZI})`,
        ],
      },
      {
        tur: 'metin',
        metin:
          "Hicaz dizisinde üç işaretli ses vardır. Dik Kürdî'den Nim Hicaz'a çıkarken geniş adımı (12 koma) kulağınla ayarla; Nevâ'dan sonrası Rast beşlisidir, Nevâ dersinde Eviç'i tanıdın.",
      },
      {
        tur: 'metin',
        metin:
          "Seyri: Hicaz inici-çıkıcı bir makamdır, bazen yalnız çıkıcıdır. Durak ya da güçlü sesin çevresinden başlanır. Güçlü olan Nevâ'da rast çeşnili yarım karar yapıldıktan sonra dizide dolaşılır, Dügâh'ta tam karar verilir.",
      },
      {
        tur: 'metin',
        metin:
          "Seyir sırasında asma kararlar: Rast'ta (nikriz çeşnili), Nim Hicaz'da ve Dik Kürdî'de (çeşnisiz). Nevâ'da bûselik çeşnili, Hüseynî'de uşşak çeşnili asma karar da yapılabilir. Nikriz çeşnisinin yapısı bu uygulamada anlatılmaz; adını bil.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Makam bölümünde Hicaz\'ı aç ve "🔊 Diziyi dinle" ile dizisini dinle; ortadaki geniş adımı duy.',
          "Dügâh'tan Muhayyer'e sekiz sesi tek tek çal; Dik Kürdî, Nim Hicaz ve Eviç'te parmağını dikkatle koy.",
          "Önce Hicaz dörtlüsünü (Dügâh'tan Nevâ'ya) çal, Nevâ'da dur; sonra Dügâh'a dönüp bitir.",
          'Hicaz dizisi etüdünü aç ve ♩ = 60\'ta metronomla çal.',
        ],
      },
    ],
    kaynaklar: [TDV_HICAZ, s4(10), S3, S6],
    alistirma: '/etut/dizi-hicaz',
  },
]
