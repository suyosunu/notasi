import type { WrittenPitch } from '../music/pitch'

export type Hole = 'kapali' | 'acik' | 'yarim'

/**
 * Parmak pozisyonu. `thumb` arkadaki aşîrân deliğidir (üstteki elin başparmağı).
 * `front` ön delikler, yukarıdan (başpâreye en yakın) aşağıya:
 * 1 nevâ, 2 nîm hicâz, 3 çârgâh (üstteki elin işaret, orta, yüzük parmağı),
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

export interface NeyPerde {
  id: PerdeId
  name: string
  /** MEB kademesi: 2 = ana sesler, 3 = daha sert üflenen sesler. */
  kademe: 2 | 3
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
// Eviç, açık Gerdâniye, açık Muhayyer; MEB ünite 1217) açılma sırasını nota konularından alır.
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
/** Ney Dersleri 6 – orta perdeler: Hüseynî, Acem, Eviç, açık Gerdâniye, açık Muhayyer. */
const SRC_ORTA = 'https://www.neyzenim.com/neydersleri_6.html'

const SERT = 'Daha sert üfle: '
const KOMA_FARKI = 'aradaki koma farkını dudak ve baş açısıyla verirsin.'

/**
 * İlk beş perde Nevâ, Çârgâh, Segâh, Dügâh, Rast sırasıyla öğretilir (2. kademe; araştırma §4.1,
 * S2, S4, S5, S13 Segâh der). Bûselik bu beşin dışındadır, Rast'tan sonra perde-3 konusuyla açılır.
 * Sonrası nota konularının açılma sırasını izler: perde-2 (Hüseynî, Acem, Gerdâniye, Muhayyer;
 * 3. kademe), perde-3 (Bûselik, Kürdî, Dik Kürdî), perde-4 (Nim Hicaz, Eviç). Böylece her perde,
 * kendi nota konusu açılınca, aynı kademedeki önceki perde geçilir geçilmez açılır (3. kademenin
 * ilk perdesi Hüseynî için Rast'ın geçilmesi yeter).
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
    tip: 'Bütün delikler kapalı. Parmak yastıklarıyla delikleri tam kapat; hava kaçarsa ses çıkmaz.',
    notaTopicId: 'nota-2',
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
    notaTopicId: 'perde-2',
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
