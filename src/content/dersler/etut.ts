import type { MusicEvent } from '../../music/notation'
import { ETUTLER } from '../etutler'
import { NEY_PERDELER } from '../ney-perdeler'
import type { PerdeId } from '../ney-perdeler'
import { meb, n } from './nota'
import type { Ders } from './types'

// Seviye 1 etüt dersleri: etütlerin nasıl çalışıldığı ve rast beşlisi. Bilgiler yalnızca araştırma notundan
// (docs/superpowers/notes/2026-10-25-ney-mufredat-arastirma.md; S1, S2 9.3.1.3, S4 ders 3–4, S5 s.054–065) ve genel
// nota bilgisinden gelir. Sayısal hedefler (tempo, hatasız çalma) "öneri" diye anılır.
// Seviye 4: oktav etütleri dersi (`etut:tiz`; neyzenim _8 ve _9, MEB 1227) ve dil teknikleri dersi (`dil:teknikler`; MEB 1229
// yalnız teknik adlarını verir, tanımlar genel müzik bilgisidir; neyzenim _15 yalnız bağı tanımlar).
// Seviye 2: dil dersi (`dil:tu-bag`; S4 d15 bağ işaretinde "dil çarpması yok", ayrıntılı dil teknikleri Seviye 4'tür) ve eser dersi
// (`eser:giris`; S1 ve §1 ortak kuralı: eser önce dinlenir, sonra notası okunur, en son neyle çalınır; S5 s.033; S4 "ezberle").

const S1 =
  'S1 MEB TYMM, Bireysel Çalgı Eğitimi Ney Modülü (1–8): https://tymm.meb.gov.tr/assets/pdf/muzik-bireysel-calgi-egitimi-ney.pdf'
const S2 =
  'S2 MEB, Çalgı Eğitimi Ney Dersi Öğretim Programı (GSL 9–12, 2022): https://mufredat.meb.gov.tr/Dosyalar/2024118143640484-2022%20%C3%87ALGI%20E%C4%9E%C4%B0T%C4%B0M%C4%B0%20NEY.pdf'
const s4 = (n: number) => `S4 neyzenim.com, Zeki Sözen, Ney Dersleri ${n}: https://www.neyzenim.com/neydersleri_${n}.html`
const S5 = 'S5 Mehmet Yücel, Ney Metodu: https://www.neyzen.com/ney_metodu.html'

function yazim(id: PerdeId) {
  return NEY_PERDELER.find((p) => p.id === id)!.written
}

/** Perdelerin yazılı notalarından ardışık dörtlükler (sus yok). */
function dortlukler(ids: PerdeId[]): MusicEvent[] {
  return ids.map((id) => ({ kind: 'note', pitch: yazim(id), dur: 'quarter' }))
}

/** `tek-neva` etüdünün ilk iki ölçüsü: birlik, sonra ikilik + ikilik sus. */
const TEK_NEVA = ETUTLER.find((e) => e.id === 'tek-neva')!
const CIKIS: PerdeId[] = ['rast', 'dugah', 'segah', 'cargah', 'neva']

export const ETUT_DERSLERI: Ders[] = [
  {
    id: 'etut:giris',
    seviye: 1,
    baslik: 'Etüt nasıl çalışılır',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Etüt, bir sese ya da birkaç sese alıştıran kısa bir çalışma ezgisidir; bir eser değildir. Sesin kendisini, geçişleri ve süreleri çalışırsın.',
      },
      {
        tur: 'metin',
        metin: 'Kaynakların ortak kalıbı şudur: her yeni perdeyi önce uzun sesle çalışırsın, sonra o perdeyi içeren etüde geçersin, en sonda eser gelir. Notası da bu sırayı izler.',
      },
      {
        tur: 'liste',
        maddeler: [
          'Uzun ses: perdeyi tanır ve oturtursun.',
          'Etüt: perdeyi kısa kalıplarla çalarsın.',
          'Eser: öğrendiğin sesleri bir parçada kullanırsın.',
        ],
      },
      {
        tur: 'metin',
        metin: 'Notası iki tür etüt verir: tek perde etütleri ve iki perde etütleri. Tek perde etüdünde bir sesi farklı sürelerde çalarsın. İki perde etüdünde yeni perdeyle bir önceki perde arasında gidip gelirsin. Bu iki türün tempoları kaynakta M.M. 60–80 aralığındadır (Zeki Sözen, ders 3–4).',
      },
      {
        tur: 'porte',
        olaylar: TEK_NEVA.olcu.slice(0, 2).flat(),
        aciklama: "Tek perde: Nevâ etüdünün ilk iki ölçüsü. Birinci ölçüde birlik, 4 vuruş boyunca tutulur. İkinci ölçüde ikilik 2 vuruş tutulur, sonra 2 vuruş susulur.",
        bpm: 60,
      },
      {
        tur: 'metin',
        metin: 'Susta nefes al ve parmaklarını yerinde tut. Sus işareti çalmadığın, ama saydığın zamandır.',
      },
      { tur: 'metin', metin: 'Her etüdü şu sırayla çalış:' },
      {
        tur: 'liste',
        maddeler: [
          'Önce dinle: "▶ Dinle" ile etüdü baştan sona duy.',
          'Notayı oku: ölçüleri soldan sağa izle, hangi sürenin geldiğine bak.',
          'Metronomla yavaş çal: "🎵 Metronomla çal" bir ölçü sayar, sonra metronom seninle sürer. Metronom sürerken neyinle aynı ezgiyi çal.',
          'Sonra hızlan: yavaşta hatasız çalınca hızı kaydırıcıyla biraz artır.',
        ],
      },
      {
        tur: 'metin',
        metin: "Başlangıç hızı ♩ = 60'tır, yani dakikada 60 dörtlük. Kaydırıcıyı 40 ile 90 arasında ayarlayabilirsin. Bu sayılar bir öneridir; zorlanırsan yavaşlat. MEB programında da metronomla hızlandırma ve yavaşlatma yer alır.",
      },
      {
        tur: 'metin',
        metin: 'Etüdü çalınca "✓ Çaldım" düğmesine bas. Notası bunu işaretler ve akşam çalışmasında sıradaki etüdü önüne koyar.',
      },
      {
        tur: 'dene',
        adimlar: [
          '"Tek perde: Nevâ" etüdünü aç ve "▶ Dinle" ile baştan sona dinle.',
          'Notayı soldan sağa oku: birlik, ikilik, dörtlükler ve susların yerini bul.',
          'Hızı ♩ = 60 yap, "🎵 Metronomla çal"a bas ve giriş sayımından sonra etüdü neyle çal.',
          'Hatasız çaldıysan hızı biraz artır ve yeniden dene. Sonunda "✓ Çaldım"a bas.',
        ],
      },
    ],
    kaynaklar: [S1, S2, s4(3), s4(4), S5],
    alistirma: '/etut/tek-neva',
  },
  {
    id: 'etut:rast-besli',
    seviye: 1,
    baslik: 'Rast beşlisi',
    bloklar: [
      {
        tur: 'metin',
        metin: "Beşli, birbirini izleyen beş sesten oluşan bir dizidir. Rast beşlisi Rast'tan Nevâ'ya kadar beş sesten kurulur: Rast, Dügâh, Segâh, Çârgâh, Nevâ. Nota adlarıyla Sol, La, Si, Do, Re.",
      },
      {
        tur: 'metin',
        metin: "Seviye 1'de öğrendiğin beş ses tam bunlardır. MEB programı ilk etütlerini bu beşliden kurar; Mehmet Yücel de Rast ile Nevâ arası etütler verir.",
      },
      {
        tur: 'porte',
        olaylar: dortlukler(CIKIS),
        aciklama: "Çıkış: Rast'tan Nevâ'ya, her ses bir dörtlük. Segâh'ın önünde koma bemolü vardır.",
        bpm: 60,
      },
      {
        tur: 'porte',
        olaylar: dortlukler([...CIKIS].reverse()),
        aciklama: "İniş: Nevâ'dan Rast'a, her ses bir dörtlük.",
        bpm: 60,
      },
      {
        tur: 'metin',
        metin: "Nevâ'dan Rast'a inerken her adımda bir parmak eklersin. Yukarı çıkarken parmakları ters sırayla kaldırırsın. Parmağını eklerken deliği tam kapat; küçük bir aralık sesi bozar.",
      },
      {
        tur: 'metin',
        metin: "Segâh, Si'nin biraz pestidir. Bu etütlerde Segâh'ı doğru yükseklikte çıkarmaya çalış; akort göstergesi sana yardım eder.",
      },
      {
        tur: 'metin',
        metin: 'İki etüt vardır. Birinci etütte dörtlükler, ikilikler ve birlikler çalarsın. İkinci etütte sekizlikler girer: iki sekizlik bir dörtlük kadar sürer, yani aynı sürede iki ses çıkarırsın.',
      },
      {
        tur: 'metin',
        metin: "Öneri: dörtlük ve sekizlik içeren rast beşlisi etüdünü ♩ = 60'ta hatasız çalmak. Bu bir öneridir; kaynaklar kesin ölçüt vermez. Önce yavaş çal, sonra hızlan.",
      },
      {
        tur: 'dene',
        adimlar: [
          '"Rast beşlisi 1" etüdünü aç ve "▶ Dinle" ile dinle.',
          "Rast'tan Nevâ'ya çıkışı ve iniş yolunu notada izle.",
          'Hızı ♩ = 60 yap, "🎵 Metronomla çal" ile metronom eşliğinde neyle çal.',
          'Hatasız çaldıysan "Rast beşlisi 2" ile sekizlikleri dene.',
        ],
      },
    ],
    kaynaklar: [S2, s4(2), S5],
    alistirma: '/etut/rast-besli-1',
  },
]

/** Dil dersindeki ezgi: Nevâ, Çârgâh, Segâh (dil-1 etüdünün ilk ölçüsü). `bagli`: ikişerli bağ (1.–2. ve 3.–4. nota). */
function dilEzgisi(bagli: boolean): MusicEvent[] {
  return ['D5', 'C5', 'B4b1', 'C5'].map((k, i) => ({ ...n(k), ...(bagli && i % 2 === 0 ? { bag: true } : {}) }) as MusicEvent)
}

/** Seviye 2: dil ve eser dersleri (`ETUT_DERSLERI` Seviye 1'dir). */
export const DIL_ESER_DERSLERI: Ders[] = [
  {
    id: 'dil:tu-bag',
    seviye: 2,
    baslik: 'Dil: tu ve bağ',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Neyde sesi dille başlatırsın. Hava akımını "tu" der gibi dilinin ucuyla açarsın. Her yeni nota böyle bir "tu" ile başlar; ses net ve ayrık duyulur.',
      },
      {
        tur: 'porte',
        olaylar: dilEzgisi(false),
        aciklama: 'Ayrık: Nevâ, Çârgâh, Segâh, Çârgâh. Dört notanın her birine ayrı "tu" dersin.',
        bpm: 60,
      },
      {
        tur: 'metin',
        metin: 'Bağ, iki ya da daha çok notanın üstüne çizilen eğri çizgidir. Bağ altındaki notalarda dil vurulmaz: yalnız ilk notayı "tu" ile başlatırsın, sonrakine geçerken sadece parmağını değiştirirsin. Hava akımı kesilmez, ses akar. Zeki Sözen\'in ders notlarında da bağ işareti için "dil çarpması yok" denir.',
      },
      {
        tur: 'porte',
        olaylar: dilEzgisi(true),
        aciklama: 'Bağlı: aynı dört nota ikişerli bağlı. Nevâ ve Segâh\'a "tu" dersin; ikinci ve dördüncü notaya (Çârgâh) dil vurmadan geçersin.',
        bpm: 60,
      },
      {
        tur: 'metin',
        metin: 'Bağ ile uzatma bağı farklıdır; farkının ayrıntısı "Röpriz ve bağ" dersinde var. Bağ farklı perdeleri bağlar, uzatma bağı aynı perdeyi.',
      },
      {
        tur: 'metin',
        metin: 'Uygulamadaki ses ayrık ve bağlı çalışı aynı duyurur. Aradaki fark ney çalarken senin dilinde ve nefesindedir; farkı kendi çalışında yaparsın. Kendi sesini dinle: bağlı yerlerde ses kopmadan akmalı.',
      },
      {
        tur: 'metin',
        metin: 'Burada yalnız iki şeyi öğreniyorsun: "tu" ile başlatmak ve bağda dil vurmamak. Ayrıntılı dil teknikleri Seviye 4\'tedir.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Ayrık portedeki dört notayı çal; her notada "tu" de ve sesin başlayışını dinle.',
          'Bağlı portedeki aynı notaları çal; bağ altındaki ikinci notaya dil vurma, yalnız parmağını değiştir.',
          'Bağlı yerlerde sesin kesilmeden aktığını dinle.',
          'Dil etüdünü aç ve ♩ = 60\'ta çal: önce ayrık, sonra bağlı.',
        ],
      },
    ],
    kaynaklar: [s4(15)],
    alistirma: '/etut/dil-1',
  },
  {
    id: 'eser:giris',
    seviye: 2,
    baslik: 'Bir eser nasıl çalışılır',
    bloklar: [
      {
        tur: 'metin',
        metin: 'Eser, öğrendiğin sesleri bir parçada birleştirir. Kaynaklarda eser çalışmanın ortak bir sırası vardır: önce dinlenir, sonra notası okunur, en son neyle çalınır.',
      },
      {
        tur: 'liste',
        maddeler: [
          'Önce dinle: eseri baştan sona dinle. Ezginin gidişini kulağın tanısın.',
          'Sonra oku: notayı önce usulü sayarak oku, sonra solfejle (nota adlarıyla) oku.',
          'En sonda çal: eseri neyle çal, yavaştan başla.',
        ],
      },
      {
        tur: 'usul',
        usulId: 'nim-sofyan',
        aciklama: 'Usulle okurken ölçüyü böyle sayarsın: düm, tek. Nota, usulün üstüne oturur.',
      },
      {
        tur: 'metin',
        metin: 'Mehmet Yücel\'in bir kuralı var: yedi sese 2–3 ay çalışmadan eser çalınmaz. Bu yedi ses Nevâ, Nim Hicaz, Çârgâh, Segâh, Kürdî, Dügâh ve Rast\'tır. Önce sesleri ve etütleri çalış; eser bunların ardından gelir.',
      },
      {
        tur: 'metin',
        metin: 'Zeki Sözen de derslerinde çalışılan alıştırmaların ezberlenmesini ister. Eseri de ezberle.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Parçalar bölümünden basit bir eser seç ve "▶ Dinle" ile baştan sona dinle.',
          'Notayı usulü sayarak oku, sonra aynı notayı solfejle oku.',
          'Eseri neyle yavaş çal; hatasız çalınca hızlan.',
          'Parçayı ezberle ve notaya bakmadan çalmayı dene.',
        ],
      },
    ],
    kaynaklar: [S1, S2, S5, s4(3)],
  },
]

/** Kademe geçiş etütlerinin ilk ölçüleri (porte örneği); etütle ders aynı notayı gösterir. */
function kademeOlculeri(etutId: string): MusicEvent[] {
  return ETUTLER.find((e) => e.id === etutId)!.olcu.slice(0, 3).flat()
}

const MEB_1218 =
  'S1 MEB TYMM, Bireysel Çalgı Eğitimi Ney Modülü, ünite 1218 (ikinci ve üçüncü kademe ana seslerden oluşan etütler): https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-ney-modulu/unite/1218'
const MEB_1232 =
  'S1 MEB TYMM, Bireysel Çalgı Eğitimi Ney Modülü, ünite 1232 (nim hisar, eviç ve nim şehnaz etütleri): https://tymm.meb.gov.tr/muzik-okullari-bireysel-calgi-egitimi-dersi-ney-modulu/unite/1232'

/**
 * Seviye 3 etüt dersi: kademe geçiş etütleri (araştırma C §5). Kaynaklar yalnız ilkeyi destekler (aynı parmak ve nefes
 * şiddeti, uzun sesler, basit usul; MEB 1218, neyzenim _6/_8/_9); etütlerin kalıpları bu uygulamanın önerisidir.
 */
export const ETUT_3_DERSLERI: Ders[] = [
  {
    id: 'etut:kademe',
    seviye: 3,
    baslik: 'Kademe geçiş etütleri',
    bloklar: [
      {
        tur: 'metin',
        metin:
          'Üçüncü kademedeki bir ses, ikinci kademedeki eşiyle aynı parmakla çalınır. Kademe geçiş etütleri bu iki sesi art arda çaldırır: parmak aynı kalır, yalnız nefes değişir. İkinci kademe sesini ılık nefesle, üçüncü kademe sesini daha sert nefesle çalarsın. Amaç, geçişte sesin kırılmamasıdır; nefesi değiştirirken ses ne kopar ne de başka bir perdeye kayar.',
      },
      {
        tur: 'porte',
        olaylar: kademeOlculeri('kademe-dugah-huseyni'),
        aciklama: 'Dügâh–Hüseynî etüdünün ilk üç ölçüsü: birlik Dügâh, birlik Hüseynî, sonra ikilikler. Parmak aynı: yalnız en alttaki delik açık.',
        bpm: 60,
        olcuCizgileri: [0, 1],
      },
      {
        tur: 'porte',
        olaylar: kademeOlculeri('kademe-rast-kapali-neva'),
        aciklama: "Rast–kapalı Nevâ etüdünün ilk üç ölçüsü: birlik Rast, birlik Nevâ, sonra ikilikler. Parmak aynı: bütün delikler kapalı.",
        bpm: 60,
        olcuCizgileri: [0, 1],
      },
      { tur: 'metin', metin: 'Nasıl çalışılır:' },
      {
        tur: 'liste',
        maddeler: [
          'Önce uzun değerlerle başla: ilk ölçülerde her sesi birlik olarak, tam süre tut. Nefes değişirken ses kırılmasın; akort göstergesine bak.',
          'Sonra kısa değerlere geç: ikilikler, sonra dörtlükler. İki ses ne kadar sık değişirse nefesi o kadar çabuk ayarlaman gerekir.',
          'Parmağı oynatma. Ses tutmuyorsa parmağı değil nefesi değiştir.',
        ],
      },
      { tur: 'metin', metin: 'Uygulamadaki kademe etütleri şunlardır:' },
      {
        tur: 'liste',
        maddeler: ETUTLER.filter((e) => e.tur === 'kademe').map((e) => e.baslik),
      },
      {
        tur: 'metin',
        metin:
          "Rast–kapalı Nevâ çiftinde yukarıdaki Nevâ, açık Nevâ değil kapalı Nevâ'dır: Rast parmağıyla, yani bütün delikler kapalı çalınır. Zeki Sözen, kapalı Nevâ'yı tiz seslerden orta seslere inerken çok kullanacağımızı yazar. Son etütte Nim Hisar da var: Hüseynî ile Nevâ arasında çalınır. Nim Hisar için yüzük parmağı deliğin 3/4'ünü kapatır, baş hafifçe sola çevrilir.",
      },
      {
        tur: 'metin',
        metin:
          "Bu etütlerin kalıpları bu uygulamanın önerisidir. Kaynaklar yalnız ilkeyi söyler: aynı parmakla farklı nefes şiddeti, uzun sesler, basit usul. MEB programında etütlerin metronomla hızlandırılabildiği de yazılıdır. ♩ = 60 de bir öneridir; zorlanırsan yavaşlat.",
      },
      {
        tur: 'dene',
        adimlar: [
          'Dügâh–Hüseynî etüdünü aç ve "▶ Dinle" ile dinle; iki sesin aynı parmaktan çıktığını düşün.',
          'Birliklerle Dügâh\'tan Hüseynî\'ye geç: parmağını oynatma, nefesini güçlendir.',
          'Ses kırılıyorsa ya da Hüseynî Dügâh\'ta kalıyorsa yavaşla; akort göstergesine bak.',
          'Birlikler temizse ikiliklere, sonra dörtlüklere geç; ♩ = 60\'ta metronomla çal.',
        ],
      },
    ],
    kaynaklar: [MEB_1218, MEB_1232, s4(6), s4(8), s4(9)],
    alistirma: '/etut/kademe-dugah-huseyni',
  },
]

/** Dil teknikleri dersindeki ezgi: `dil-2` etüdünün bağsız (1.), bağlı (5.) ve kesik (9.) ölçüsü; etütle ders aynı notayı gösterir. */
const DIL_2 = ETUTLER.find((e) => e.id === 'dil-2')!

const MEB_1229 = meb(1229, 'dil teknikleri: bağsız, bağlı, kısa-kesik')
const MEB_1227 = meb(1227, 'dördüncü kademe ana sesler')

/**
 * Seviye 4 dersleri. `etut:tiz`: oktav etütleri; kaynaklar yalnız ilkeyi söyler (aynı parmak, daha da sert nefes, uzun sesin
 * orta ve alt perdelerde çalışılması), kalıplar bu uygulamanın önerisidir. `dil:teknikler`: bağsız, bağlı, kesik; MEB 7.1 yalnız
 * adları verir (bağsız, bağlı, kısa-kesik), tanımlar genel müzik bilgisidir. Kesik noktası bu uygulamadaki gösterimdir.
 */
export const ETUT_4_DERSLERI: Ders[] = [
  {
    id: 'etut:tiz',
    seviye: 4,
    baslik: 'Oktav etütleri',
    bloklar: [
      {
        tur: 'metin',
        metin:
          'Oktav etütleri bir sesi ve onun bir oktav üstündeki tiz eşini art arda çaldırır: örneğin Segâh ile Tiz Segâh. Parmak aynı kalır; yalnız nefes değişir (tizde daha da sert) ve dudak biraz daha büzülür. Amaç, oktav geçişinde sesin kopmaması ve tiz sesin temiz çıkmasıdır.',
      },
      {
        tur: 'porte',
        olaylar: ETUTLER.find((e) => e.id === 'tiz-segah-oktav')!.olcu.slice(0, 3).flat(),
        aciklama:
          'Segâh–Tiz Segâh etüdünün ilk üç ölçüsü: birlik Segâh, birlik Tiz Segâh, sonra ikilikler. Parmak aynı: üstten ilk üç delik ve alttaki elin orta parmağı kapalı.',
        bpm: 60,
        olcuCizgileri: [0, 1],
      },
      {
        tur: 'porte',
        olaylar: ETUTLER.find((e) => e.id === 'kapali-oktav')!.olcu.slice(0, 3).flat(),
        aciklama:
          'Rast–kapalı Gerdâniye etüdünün ilk üç ölçüsü: birlik Rast, birlik kapalı Gerdâniye, sonra ikilikler. Parmak aynı: bütün delikler kapalı.',
        bpm: 60,
        olcuCizgileri: [0, 1],
      },
      { tur: 'metin', metin: 'Uygulamadaki oktav etütleri şunlardır:' },
      {
        tur: 'liste',
        maddeler: ETUTLER.filter((e) => e.tur === 'tiz').map((e) => e.baslik),
      },
      { tur: 'metin', metin: 'Nasıl çalışılır:' },
      {
        tur: 'liste',
        maddeler: [
          'Önce uzun değerlerle başla: birlikleri çal, alt sesten tiz sese geçerken parmağını oynatma, nefesini güçlendir. Tiz sesi uzun tutmaya çalışma; zorlanırsan kısa bırak.',
          'Sonra kısa değerlere geç: ikilikler, sonra dörtlükler. İki ses ne kadar sık değişirse nefesi o kadar çabuk ayarlaman gerekir.',
          'Tiz ses oktavın altında kalıyorsa parmağı değil nefesi değiştir; dudağın biraz daha büzülsün.',
          'Çoğu etütte tiz ses noktalı ikilikle biter ve ardından bir dörtlük sus gelir; susta nefes al.',
        ],
      },
      {
        tur: 'metin',
        metin:
          "Zeki Sözen uzun uzun üflemeyi orta ve alt perdelerde önerir (neyzenim.com, Ders 8). Bu yüzden uzun ses çalışmasının ağırlığı orta ve alt perdelerde kalır; oktav etütlerinde tiz sesler kısa tutulur. Tiz perdelerde önerimiz 5 sn, ±20 sent'tir.",
      },
      {
        tur: 'metin',
        metin:
          "Kapalı oktav etüdünde Rast parmağı ve Dügâh parmağı bir oktav yukarı çıkar. Kapalı Gerdâniye ve kapalı Muhayyer, açık olanlarla aynı yazılı notadır. Zeki Sözen'in Ders 9 sayfasında bu ikisinin nefes şiddeti yazılmaz; ne kadar sert üfleyeceğini kulağın ve akort göstergesi söyler.",
      },
      {
        tur: 'metin',
        metin:
          'Bu etütlerin kalıpları bu uygulamanın önerisidir. Kaynaklar yalnız ilkeyi söyler: aynı parmakla daha da sert nefes, dudağın biraz büzülmesi, uzun sesin orta ve alt perdelerde çalışılması. ♩ = 60 de bir öneridir; zorlanırsan yavaşlat.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Segâh–Tiz Segâh etüdünü aç ve "▶ Dinle" ile dinle; iki sesin aynı parmaktan çıktığını düşün.',
          "Birliklerle Segâh'tan Tiz Segâh'a geç: parmağını oynatma, nefesini güçlendir.",
          'Tiz ses oktavın altında kalıyorsa ya da kırılıyorsa yavaşla; akort göstergesine bak.',
          "Birlikler temizse ikiliklere, sonra dörtlüklere geç; ♩ = 60'ta metronomla çal.",
        ],
      },
    ],
    kaynaklar: [s4(8), s4(9), MEB_1227],
    alistirma: '/etut/tiz-segah-oktav',
  },
  {
    id: 'dil:teknikler',
    seviye: 4,
    baslik: 'Dil teknikleri: bağsız, bağlı, kesik',
    bloklar: [
      {
        tur: 'metin',
        metin:
          "Seviye 2'de dili ve bağı öğrenmiştin. Seviye 4'te aynı ezgiyi üç farklı çalış biçimiyle çalarsın. MEB programı bunları adlarıyla sayar: bağsız (non legato), bağlı (legato) ve kısa-kesik (staccato). Biz kısaca kesik diyeceğiz.",
      },
      {
        tur: 'metin',
        metin:
          "Kaynaklar konusunda dürüst olalım. MEB programı (ünite 1229) bu üç tekniğin yalnız adlarını verir, tanımlamaz. Burada anlatılanlar genel müzik bilgisidir. Zeki Sözen'in Ders 15'i yalnız bağı tanımlar. Kesiğin notada nota başının yanındaki bir noktayla gösterilmesi de bu uygulamadaki gösterimdir; ney kaynaklarında bu işaretin kullanımı yazılı değildir.",
      },
      {
        tur: 'liste',
        maddeler: [
          'Bağsız: her nota ayrı dil vuruşuyla başlar. Notalar süresini doldurur, aralarında çok kısa bir ayrılık kalır. Özel bir işaret yoktur; yazılı nota öntanımlı olarak böyle çalınır.',
          'Bağlı: bağ yayı altındaki notalarda dil vurulmaz, yalnız parmak değişir. Ses kopmadan akar. Zeki Sözen\'in ders notlarında bağ için "dil çarpması yok" denir.',
          'Kesik: nota kısa çalınır, süresinin geri kalanı sus olur. Bu uygulamadaki gösterim: nota başının sap karşısına bir nokta konur.',
        ],
      },
      {
        tur: 'porte',
        olaylar: DIL_2.olcu[0]!,
        aciklama: 'Bağsız: Dügâh, Segâh, Çârgâh, Nevâ. Dört notanın her birine ayrı dil vuruşu.',
        bpm: 60,
      },
      {
        tur: 'porte',
        olaylar: DIL_2.olcu[4]!,
        aciklama:
          "Bağlı: aynı dört nota ikişerli bağlı. Dügâh'a ve Çârgâh'a dil vurursun; Segâh'a ve Nevâ'ya dil vurmadan, yalnız parmak değiştirerek geçersin.",
        bpm: 60,
      },
      {
        tur: 'porte',
        olaylar: DIL_2.olcu[8]!,
        aciklama: 'Kesik: aynı dört nota, her birinde bir nokta. Her nota kısa çalınır, arkasından sus gelir.',
        bpm: 60,
      },
      {
        tur: 'metin',
        metin:
          '▶ Dinle kesik notayı gerçekten kısa çalar: ses, süresinin yarısında susar. Bağsız ile bağlı arasındaki fark ise asıl neyde, dilinde ve nefesinde yapılır; ▶ Dinle bunu yalnız hafifçe duyurur. Bu üç biçimi çalışında sen ayırt edersin.',
      },
      {
        tur: 'metin',
        metin:
          'Ezginin ritmi üçünde de aynıdır: kesik notanın arkasındaki sus, notanın kendi süresinden gelir ve ölçü aynı kalır. Yani kesik çalmak ezgiyi hızlandırmaz, yalnız her notayı kısaltır.',
      },
      {
        tur: 'dene',
        adimlar: [
          'Bağsız portedeki dört notayı çal; her notayı ayrı dil vuruşuyla başlat ve sesin her notada yeniden başlayışını dinle.',
          'Bağlı portede aynı notaları çal; bağ altındaki ikinci notaya dil vurma, yalnız parmağını değiştir. Ses kesilmeden akmalı.',
          'Kesik portede her notayı süresinin yaklaşık yarısında bırak, kalan yarısında sus; ölçüyü sayarak bir sonraki notaya tam zamanında gir.',
          '▶ Dinle ile üç portenin farkını dinle; kesik notada sesin yarıda sustuğunu duy.',
          "Dil etüdünü aç ve ♩ = 60'ta çal: önce bağsız, sonra bağlı, sonra kesik bölümü.",
        ],
      },
    ],
    kaynaklar: [MEB_1229, s4(15)],
    alistirma: '/etut/dil-2',
  },
]
