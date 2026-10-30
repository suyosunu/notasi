import { ACCIDENTAL_NAMES } from '../../music/accidentals'
import { diziEvents } from '../../music/makam'
import { MAKAMLAR } from '../makamlar'
import type { Makam } from '../makamlar'
import { S2, S6, s4 } from './nota'
import type { Ders } from './types'

// Seviye 3 makam dersleri: makamın unsurları (`makam:giris`), Rast ve Nevâ. Bilgiler araştırma C'nin §2'sinden
// (docs/superpowers/notes/2026-10-30-asama-c-arastirma.md: TDV İslâm Ansiklopedisi "Rast" ve "Nevâ" maddeleri,
// neyzenim _10) ve makamlar.ts'ten gelir; porte örnekleri aynı makam verisinden türetilir (dersler.test.ts bunu denetler).
// Uşşak ve Hicaz'ın ders ve ayrıntıları Seviye 4'tür: onlar için ders yazılmaz, makam sayfasında yalnız `makam:giris` okunur.
// Nevâ seyri §2 "Seyir" satırından, kendi cümlelerimizle yazılır. Etütler (dizi-rast, dizi-neva) etutler.ts'tedir.

export const TDV_RAST = 'TDV İslâm Ansiklopedisi, Rast (İsmail Hakkı Özkan): https://islamansiklopedisi.org.tr/rast'
export const TDV_NEVA = 'TDV İslâm Ansiklopedisi, Nevâ (İsmail Hakkı Özkan): https://islamansiklopedisi.org.tr/neva'

const RAST = MAKAMLAR.find((m) => m.id === 'rast')!
const NEVA = MAKAMLAR.find((m) => m.id === 'neva')!
const USSAK = MAKAMLAR.find((m) => m.id === 'ussak')!

const KOMA_BEMOLU = ACCIDENTAL_NAMES[-1]
const BAKIYE_DIYEZI = ACCIDENTAL_NAMES[4]

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
          'Seyir: ezginin izlediği yol; nereden başlar, nerelerde dolaşır, nerelerde dinlenir, nerede biter. Tize doğru giden seyre çıkıcı, peste doğru giden seyre inici denir.',
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
        metin: `Rast makamında durak ${RAST.durak}, güçlü ${RAST.guclu}, yeden ${RAST.yeden}. Rast'ın yedeni olan Irak, bu seviyede çaldığın perdeler arasında yok; yalnız adını bil. Durak, güçlü, yeden ve yapıyı makam sayfasında her makam için okuyabilirsin; seyir ve asma karar yerlerini makam derslerinde göreceksin.`,
      },
      {
        tur: 'metin',
        metin: "Bu seviyede iki makam öğreneceksin: Rast ve Nevâ. Uşşak ve Hicaz'ı Seviye 4'te öğreneceksin; makam bölümünde adlarını görsen de şimdilik dizilerine bakman yeter.",
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
          "Asma karar iki yerde yapılır. Eviç'te segâh çeşnisiyle asma karar yapılır; segâh çeşnisinin ayrıntısı Seviye 4'tedir. Nevâ'da ise bûselik çeşnisiyle asma karar ya da yarım karar yapılırken Eviç yerine Acem kullanılır. Yani bu makamda da Fa iki biçimde çalınır: Eviç ve Acem. Dizi çıkarken Eviç'i çalarsın; Acem yalnız bu bûselik çeşnili yerde gelir.",
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
]
