import type { MusicEvent } from '../../music/notation'
import { ETUTLER } from '../etutler'
import { NEY_PERDELER } from '../ney-perdeler'
import type { PerdeId } from '../ney-perdeler'
import { n } from './nota'
import type { Ders } from './types'

// Seviye 1 etüt dersleri: etütlerin nasıl çalışıldığı ve rast beşlisi. Bilgiler yalnızca araştırma notundan
// (docs/superpowers/notes/2026-10-25-ney-mufredat-arastirma.md; S1, S2 9.3.1.3, S4 ders 3–4, S5 s.054–065) ve genel
// nota bilgisinden gelir. Sayısal hedefler (tempo, hatasız çalma) "öneri" diye anılır.
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
          'Parçalar bölümünden basit bir eser seç ve "🔊 Dinle" ile baştan sona dinle.',
          'Notayı usulü sayarak oku, sonra aynı notayı solfejle oku.',
          'Eseri neyle yavaş çal; hatasız çalınca hızlan.',
          'Parçayı ezberle ve notaya bakmadan çalmayı dene.',
        ],
      },
    ],
    kaynaklar: [S1, S2, S5, s4(3)],
  },
]
