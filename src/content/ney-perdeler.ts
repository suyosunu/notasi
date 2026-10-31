import type { WrittenPitch } from '../music/pitch'

export type Hole = 'kapali' | 'acik' | 'yarim'

/**
 * Parmak pozisyonu. `thumb` arkadaki aşîrân deliğidir (üstteki elin başparmağı).
 * `front` ön delikler, yukarıdan (başpâreye en yakın) aşağıya:
 * (klasik delik adları, S13) 1 nevâ, 2 hicaz, 3 çârgâh (üstteki elin işaret, orta, yüzük parmağı),
 * 4 segâh, 5 kürdî, 6 dügâh (alttaki elin işaret, orta, yüzük parmağı).
 * Parmak pozisyonları neyin ahengine (Kız, Mansur…) göre değişmez.
 */
export interface Fingering {
  thumb: Hole
  front: [Hole, Hole, Hole, Hole, Hole, Hole]
}

export type PerdeId =
  | 'neva'
  | 'cargah'
  | 'buselik'
  | 'dugah'
  | 'rast'
  | 'segah'
  | 'huseyni'
  | 'acem'
  | 'evic'
  | 'kurdi'
  | 'dik-kurdi'
  | 'nim-hicaz'
  | 'gerdaniye'
  | 'muhayyer'
  | 'kapali-neva'
  | 'nim-sehnaz'
  | 'nim-hisar'
  | 'tiz-segah'
  | 'tiz-cargah'
  | 'tiz-neva'
  | 'kapali-gerdaniye'
  | 'kapali-muhayyer'
  | 'tiz-nim-hicaz'

export interface NeyPerde {
  id: PerdeId
  name: string
  /** MEB kademesi: 2 = ana sesler, 3 = daha sert üflenen sesler, 4 = tiz sesler ve kapalı pozisyonlar. */
  kademe: 2 | 3 | 4
  written: WrittenPitch
  fingering: Fingering | null
  /** Yalnızca bir kaynak şemayı (başparmak + 6 ön delik) açıkça gösteriyorsa true. */
  verified: boolean
  source: string | null
  tip: string
  notaTopicId: string
}

// Kaynaklar (ayrıntı: .superpowers/sdd/2026-10-13-notasi-surum-1/task-12-report.md).
// MEB Ney Modülü (tymm.meb.gov.tr ünite 1216) ikinci kademe ana seslerini sıralar, ancak parmak
// pozisyonunu yazılı vermez ("öğretmen uygulamalı gösterir"). Uygulamanın ilk beşi Nevâ, Çârgâh,
// Segâh, Dügâh, Rast'tır; Bûselik sonra gelir.
// Sonraki perdeler (ikinci kademe Bûselik, Kürdî, Dik Kürdî, Nim Hicaz ve üçüncü kademe Hüseynî, Acem,
// Eviç, açık Gerdâniye, açık Muhayyer; MEB ünite 1217) nota konularının açılma sırasını izler. Hüseynî Rast'tan
// hemen sonra, perde-4 (Seviye 2) konusuyla açılır; Acem, Gerdâniye ve Muhayyer perde-2 konusuna bağlıdır.
// Şemalar Neyzenim ney derslerinden alınmıştır: sağ el üstte, sağ başparmak aşîrân deliğinde;
// iki elin orta parmağı (2. ve 5. delik) destek için kapalı tutulur.
// `source`, o perdenin şemasını açıkça yazan tek sayfadır.

/** Parmak→delik eşlemesinin kaynağı: sağ el üstte, sağ başparmak arkadaki aşîrân deliğinde. */
export const DELIK_YERLESIMI_KAYNAK = 'https://www.neyzenim.com/neydersleri_1.html'
/** Ney Dersleri 2 – Temel Sesler: Re (Neva), Do (Çargâh), La (Dügâh), Sol (Rast), Si (Segâh). */
const SRC_TEMEL = 'https://www.neyzenim.com/neydersleri_2.html'
/** Ney Dersleri 10 – Buselik makamı, "Naturel Si Perdesi". */
const SRC_BUSELIK = 'https://www.neyzenim.com/neydersleri_10.html'

/** Ney Dersleri 5 – Do diyez (Nim Hicaz) ve La diyez (Kürdî). */
const SRC_KOMA = 'https://www.neyzenim.com/neydersleri_5.html'
/** Ney Dersleri 10 – Hicaz bölümü: Nim Hicaz ve Dik Kürdî. */
const SRC_HICAZ = 'https://www.neyzenim.com/neydersleri_10.html'
/**
 * Ney Dersleri 6 – orta perdeler: Hüseynî, Acem, Eviç, açık Gerdâniye, açık Muhayyer; ayrıca kapalı Nevâ
 * ("Re sesini tüm perdeler kapalı olarak üfleyeceğiz"), Nim Şehnaz ve Nim Hisar ("yüzük parmağımızın 3/4 ünü
 * kapatıyoruz", "kafamızı hafifçe sola doğru çeviriyoruz"). Kapalı Nevâ ayrıca neydersleri_9'da da yazılıdır.
 */
const SRC_ORTA = 'https://www.neyzenim.com/neydersleri_6.html'
/** Ney Dersleri 8 – Tiz Sesler: Tiz Segâh, Tiz Çârgâh, Tiz Nevâ, Tiz Nim Hicaz (daha da sert üflenir, dudak biraz daha büzülür). */
const SRC_TIZ = 'https://www.neyzenim.com/neydersleri_8.html'
/** Ney Dersleri 9 – aynı sesleri farklı pozisyondan çıkarma: kapalı Gerdâniye ve kapalı Muhayyer (yalnız parmak yazılıdır). */
const SRC_KAPALI = 'https://www.neyzenim.com/neydersleri_9.html'

const SERT = 'Daha sert üfle: '
/** 4. kademe tiz sesler (neyzenim _8): nefes daha da sert, dudak biraz daha büzülür. */
const TIZ_SERT = 'Daha da sert üfle; dudak biraz daha büzülür: '
/** Kapalı Gerdâniye ve Muhayyer için kaynak (neyzenim _9) yalnız parmağı yazar, nefes şiddetini yazmaz. */
const KAPALI_NEFES = ' Kaynak nefes şiddetini yazmıyor; sesi kulağınla ayarla.'
export const KOMA_FARKI = 'aradaki koma farkını dudak ve baş açısıyla verirsin.'

/**
 * İlk beş perde Nevâ, Çârgâh, Segâh, Dügâh, Rast sırasıyla öğretilir (2. kademe; araştırma §4.1,
 * S2, S4, S5, S13 Segâh der). Sonrası nota konularının açılma sırasını izler: kullanıcı perde adını
 * okumayı öğrendiği sırayla çalar. Önce Seviye 2 ara sesleri: perde-3 (Bûselik, Kürdî, Dik Kürdî),
 * perde-4 (Nim Hicaz); Hüseynî 3. kademedir ama hocanın pratiğine göre Seviye 2'de öğretilir ve perde-4 konusuna
 * bağlıdır (2026-10-31); sonra 3. kademe: perde-2 (Acem, Gerdâniye, Muhayyer), kapalı Nevâ,
 * perde-4'ün Eviç'i, en sonda perde-5 (Nim Şehnaz, Nim Hisar). Sıra MEB'i izler: önce ana sesler (ünite 1217),
 * sonra ara sesler (Eviç ve Nim Şehnaz ünite 1226; Nim Hisar ünite 1232'de en geç anılır). Kapalı Nevâ açık
 * Nevâ'dan sonra gelir: aynı yazılı perdeye göre arama "Nevâ"yı bulur. 3. kademe perdeleri 2. kademedeki
 * eşiyle aynı parmakla, daha sert üfleyerek çalınır ve ondan 31 koma (bir beşli) yüksektir
 * (araştırma C §1: Rast→kapalı Nevâ, Dügâh→Hüseynî, Kürdî→Acem, Segâh→Eviç, Çârgâh→Gerdâniye,
 * Nim Hicaz→Nim Şehnaz, Nevâ→Muhayyer). Nim Hisar'ın şeması Dügâh parmağının son deliğini 3/4 kapatır;
 * `Hole` kesir taşımadığı için `yarim` yazılır, 3/4 ipucundadır. MEB: tymm.meb.gov.tr ünite 1217, 1226, 1232.
 * 4. kademe (araştırma D §1; neyzenim _8 ve _9, MEB ünite 1227) yeni parmak öğretmez: aynı ana ses parmağı, bir oktav
 * (53 koma) yukarıda ve daha da sert üflenerek çalınır. Sıra: önce MEB 1227'nin ana sesleri (Tiz Segâh, Tiz Çârgâh,
 * Tiz Nevâ), sonra kapalı pozisyonlar (kapalı Gerdâniye = Rast parmağı, kapalı Muhayyer = Dügâh parmağı), en sonda
 * yalnız neyzenim'de geçen Tiz Nim Hicaz. Kapalı Gerdâniye ve Muhayyer, 3. kademedeki açık eşleriyle aynı yazılı
 * perdedir (G5, A5); `find(samePitch)` açık olanı bulur, çünkü açıklar listede önce gelir. Kaynak kapalı olanların
 * nefes şiddetini yazmaz; ipucu yalnız parmağı ve oktav ilişkisini söyler.
 * Perde-2 ve perde-5 konuları NOTA_TOPICS'in sonundadır, bu yüzden Acem, Gerdâniye, Muhayyer ve Nim Şehnaz, Seviye 2
 * nota konuları öğrenilmeden açılmaz. Hüseynî perde-4 konusuna bağlıdır, perde-2'ye değil. Her perde, kendi nota
 * konusu açılınca ve aynı kademedeki önceki perde geçilince açılır (Hüseynî Rast'tan sonra açılır).
 */
export const NEY_PERDELER: NeyPerde[] = [
  {
    id: 'neva',
    name: 'Nevâ',
    kademe: 2,
    written: { step: 'D', octave: 5, acc: 0 },
    fingering: { thumb: 'kapali', front: ['acik', 'kapali', 'acik', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_TEMEL,
    tip: 'Başparmak arkada kapalı; iki elin orta parmağı destek için kapalı, diğer ön delikler açık. Orta şiddette (ılık) üfle.',
    notaTopicId: 'nota-1',
  },
  {
    id: 'cargah',
    name: 'Çârgâh',
    kademe: 2,
    written: { step: 'C', octave: 5, acc: 0 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'acik', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_TEMEL,
    tip: 'Nevâ duruşuna üstteki elin işaret parmağını ekle: üstten ilk iki delik kapalı, alttaki elin orta parmağı kapalı.',
    notaTopicId: 'nota-1',
  },
  {
    id: 'segah',
    name: 'Segâh',
    kademe: 2,
    written: { step: 'B', octave: 4, acc: -1 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_TEMEL,
    tip: 'Çârgâh duruşuna üstteki elin yüzük parmağını ekle: üstten ilk üç delik kapalı, dördüncü delik açık, alttaki elin orta parmağı kapalı.',
    notaTopicId: 'nota-1',
  },
  {
    id: 'dugah',
    name: 'Dügâh',
    kademe: 2,
    written: { step: 'A', octave: 4, acc: 0 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'kapali', 'acik'] },
    verified: true,
    source: SRC_TEMEL,
    tip: 'Yalnızca en alttaki delik açık; başparmak ve diğer beş ön delik kapalı.',
    notaTopicId: 'nota-2',
  },
  {
    id: 'rast',
    name: 'Rast',
    kademe: 2,
    written: { step: 'G', octave: 4, acc: 0 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'kapali', 'kapali'] },
    verified: true,
    source: SRC_TEMEL,
    tip: 'Bütün delikler kapalı. Parmaklarının orta bölümüyle delikleri tam kapat; hava kaçarsa ses çıkmaz.',
    notaTopicId: 'nota-2',
  },
  {
    id: 'buselik',
    name: 'Bûselik',
    kademe: 2,
    written: { step: 'B', octave: 4, acc: 0 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'yarim', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_BUSELIK,
    tip: 'Segâh duruşunda üçüncü deliğin yarısını aç (üstteki elin yüzük parmağı yarım). Ses Segâh’tan bir koma tiz çıkar; yarım deliği kulağınla ayarla.',
    notaTopicId: 'perde-3',
  },
  {
    id: 'kurdi',
    name: 'Kürdî',
    kademe: 2,
    written: { step: 'B', octave: 4, acc: -5 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'acik', 'acik'] },
    verified: true,
    source: SRC_KOMA,
    tip: 'Alttaki iki delik açık, diğerleri kapalı. Parmak konumu Dik Kürdî ile aynı; ' + KOMA_FARKI,
    notaTopicId: 'perde-3',
  },
  {
    id: 'dik-kurdi',
    name: 'Dik Kürdî',
    kademe: 2,
    written: { step: 'B', octave: 4, acc: -4 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'acik', 'acik'] },
    verified: true,
    source: SRC_HICAZ,
    tip: 'Alttaki iki delik açık, diğerleri kapalı. Parmak konumu Kürdî ile aynı; ' + KOMA_FARKI,
    notaTopicId: 'perde-3',
  },
  {
    id: 'nim-hicaz',
    name: 'Nim Hicaz',
    kademe: 2,
    written: { step: 'C', octave: 5, acc: 4 },
    fingering: { thumb: 'kapali', front: ['kapali', 'acik', 'acik', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_KOMA,
    tip: 'Başparmak arkada kapalı; yalnızca ilk delik ve alttaki elin orta parmağı kapalı; Çârgâh’tan bir bakiye (4 koma) yüksek çıkar.',
    notaTopicId: 'perde-4',
  },
  {
    id: 'huseyni',
    name: 'Hüseynî',
    kademe: 3,
    written: { step: 'E', octave: 5, acc: 0 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'kapali', 'acik'] },
    verified: true,
    source: SRC_ORTA,
    tip: SERT + 'Dügâh parmağıyla çalınır (yalnızca en alt delik açık); sesi bir beşli yukarı çıkarmak için nefesi güçlendir.',
    notaTopicId: 'perde-4',
  },
  {
    id: 'acem',
    name: 'Acem',
    kademe: 3,
    written: { step: 'F', octave: 5, acc: 0 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'acik', 'acik'] },
    verified: true,
    source: SRC_ORTA,
    tip: SERT + 'Kürdî parmağıyla çalınır (alttaki iki delik açık); nefesi güçlendirerek sesi yukarı taşı.',
    notaTopicId: 'perde-2',
  },
  {
    id: 'gerdaniye',
    name: 'Gerdâniye (açık)',
    kademe: 3,
    written: { step: 'G', octave: 5, acc: 0 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'acik', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_ORTA,
    tip: SERT + 'Çârgâh parmağıyla çalınır (üstten ilk iki delik ve alttaki elin orta parmağı kapalı); nefesi güçlendirerek sesi yukarı taşı.',
    notaTopicId: 'perde-2',
  },
  {
    id: 'muhayyer',
    name: 'Muhayyer (açık)',
    kademe: 3,
    written: { step: 'A', octave: 5, acc: 0 },
    fingering: { thumb: 'kapali', front: ['acik', 'kapali', 'acik', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_ORTA,
    tip: SERT + 'Nevâ parmağıyla çalınır (iki elin orta parmağı kapalı, diğer ön delikler açık); nefesi güçlendirerek sesi yukarı taşı.',
    notaTopicId: 'perde-2',
  },
  {
    id: 'kapali-neva',
    name: 'Nevâ (kapalı)',
    kademe: 3,
    written: { step: 'D', octave: 5, acc: 0 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'kapali', 'kapali'] },
    verified: true,
    source: SRC_ORTA,
    tip: SERT + 'Rast parmağıyla çalınır (bütün delikler kapalı); açık Nevâ ile aynı sestir. Rast’tan bir beşli yukarı çıkmak için nefesini güçlendirirsin.',
    notaTopicId: 'perde-2',
  },
  {
    id: 'evic',
    name: 'Eviç',
    kademe: 3,
    written: { step: 'F', octave: 5, acc: 4 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_ORTA,
    tip: SERT + 'Segâh parmağıyla çalınır (dördüncü ve altıncı delik açık); nefesi güçlendirerek sesi yukarı taşı.',
    notaTopicId: 'perde-4',
  },
  {
    id: 'nim-sehnaz',
    name: 'Nim Şehnaz',
    kademe: 3,
    written: { step: 'G', octave: 5, acc: 4 },
    fingering: { thumb: 'kapali', front: ['kapali', 'acik', 'acik', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_ORTA,
    tip: SERT + 'Nim Hicaz parmağıyla çalınır (yalnızca ilk delik ve alttaki elin orta parmağı kapalı); nefesi güçlendirerek sesi yukarı taşı.',
    notaTopicId: 'perde-5',
  },
  {
    id: 'nim-hisar',
    name: 'Nim Hisar',
    kademe: 3,
    written: { step: 'E', octave: 5, acc: -5 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'kapali', 'yarim'] },
    verified: true,
    source: SRC_ORTA,
    tip: SERT + 'Dügâh parmağıyla çalınır, ama alttaki elin yüzük parmağı en alt deliğin 3/4’ünü kapatır; başını hafifçe sola çevir.',
    notaTopicId: 'perde-5',
  },
  {
    id: 'tiz-segah',
    name: 'Tiz Segâh',
    kademe: 4,
    written: { step: 'B', octave: 5, acc: -1 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_TIZ,
    tip: TIZ_SERT + 'Segâh parmağıyla, bir oktav yukarıda (üstten ilk üç delik ve alttaki elin orta parmağı kapalı).',
    notaTopicId: 'perde-6',
  },
  {
    id: 'tiz-cargah',
    name: 'Tiz Çârgâh',
    kademe: 4,
    written: { step: 'C', octave: 6, acc: 0 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'acik', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_TIZ,
    tip: TIZ_SERT + 'Çârgâh parmağıyla, bir oktav yukarıda (üstten ilk iki delik ve alttaki elin orta parmağı kapalı).',
    notaTopicId: 'perde-6',
  },
  {
    id: 'tiz-neva',
    name: 'Tiz Nevâ',
    kademe: 4,
    written: { step: 'D', octave: 6, acc: 0 },
    fingering: { thumb: 'kapali', front: ['acik', 'kapali', 'acik', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_TIZ,
    tip: TIZ_SERT + 'Nevâ parmağıyla, bir oktav yukarıda (iki elin orta parmağı kapalı, diğer ön delikler açık).',
    notaTopicId: 'perde-6',
  },
  {
    id: 'kapali-gerdaniye',
    name: 'Gerdâniye (kapalı)',
    kademe: 4,
    written: { step: 'G', octave: 5, acc: 0 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'kapali', 'kapali'] },
    verified: true,
    source: SRC_KAPALI,
    tip: 'Rast parmağıyla, bir oktav yukarıda (bütün delikler kapalı); açık Gerdâniye ile aynı sestir.' + KAPALI_NEFES,
    notaTopicId: 'perde-2',
  },
  {
    id: 'kapali-muhayyer',
    name: 'Muhayyer (kapalı)',
    kademe: 4,
    written: { step: 'A', octave: 5, acc: 0 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'kapali', 'acik'] },
    verified: true,
    source: SRC_KAPALI,
    tip: 'Dügâh parmağıyla, bir oktav yukarıda (yalnızca en alt delik açık); açık Muhayyer ile aynı sestir.' + KAPALI_NEFES,
    notaTopicId: 'perde-2',
  },
  {
    id: 'tiz-nim-hicaz',
    name: 'Tiz Nim Hicaz',
    kademe: 4,
    written: { step: 'C', octave: 6, acc: 4 },
    fingering: { thumb: 'kapali', front: ['kapali', 'acik', 'acik', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_TIZ,
    tip: TIZ_SERT + 'Nim Hicaz parmağıyla, bir oktav yukarıda (yalnızca ilk delik ve alttaki elin orta parmağı kapalı).',
    notaTopicId: 'perde-6',
  },
]

/** Doğrulanmamış şema kullanıcıya asla gösterilmez. */
export function visibleFingering(p: NeyPerde): Fingering | null {
  return p.verified ? p.fingering : null
}

/** MEB Ney Modülü 1. tema (Nefes Teknikleri) ve 2. tema (Neyden Ses Elde Ediş) özetidir. */
export const ILK_SES_REHBER: string[] = [
  'Dik ve rahat otur; nefesi karnına (diyaframa) al, omuzlarını kaldırma.',
  'Isınmak için 4 saniye nefes al, 4 saniye tut, 4 saniye ver.',
  'Dudaklarını "u" der gibi topla; ıslık çalar gibi ince bir hava akımı oluştur.',
  'Başpâreyi dudağına yasla; havayı neyin ağzına 30–45 derecelik bir açıyla yönelt.',
  'İlk denemelerde ses çıkmayabilir; acele etme, kısa aralarla sabırla tekrar dene.',
]
