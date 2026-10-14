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

export type PerdeId = 'neva' | 'cargah' | 'buselik' | 'dugah' | 'rast'

export interface NeyPerde {
  id: PerdeId
  name: string
  written: WrittenPitch
  fingering: Fingering | null
  /** Yalnızca bir kaynak şemayı (başparmak + 6 ön delik) açıkça gösteriyorsa true. */
  verified: boolean
  source: string | null
  tip: string
  notaTopicId: string
}

// Kaynaklar (ayrıntı: .superpowers/sdd/2026-10-13-notasi-surum-1/task-12-report.md).
// MEB Ney Modülü (tymm.meb.gov.tr ünite 1216) bu perdeleri ikinci kademe ana sesleri olarak
// sıralar, ancak parmak pozisyonunu yazılı vermez ("öğretmen uygulamalı gösterir").
// Şemalar Neyzenim ney derslerinden alınmıştır: sağ el üstte, sağ başparmak aşîrân deliğinde;
// iki elin orta parmağı (2. ve 5. delik) destek için kapalı tutulur.
// `source`, o perdenin şemasını açıkça yazan tek sayfadır.

/** Parmak→delik eşlemesinin kaynağı: sağ el üstte, sağ başparmak arkadaki aşîrân deliğinde. */
export const DELIK_YERLESIMI_KAYNAK = 'https://www.neyzenim.com/neydersleri_1.html'
/** Ney Dersleri 2 – Temel Sesler: Re (Neva), Do (Çargâh), La (Dügâh), Sol (Rast). */
const SRC_TEMEL = 'https://www.neyzenim.com/neydersleri_2.html'
/** Ney Dersleri 10 – Buselik makamı, "Naturel Si Perdesi". */
const SRC_BUSELIK = 'https://www.neyzenim.com/neydersleri_10.html'

/** Sıra MEB Ney Modülü 3. tema (NEY.3.3.1, NEY.3.3.2) sırasıdır. */
export const NEY_PERDELER: NeyPerde[] = [
  {
    id: 'neva',
    name: 'Nevâ',
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
    written: { step: 'C', octave: 5, acc: 0 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'acik', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_TEMEL,
    tip: 'Nevâ duruşuna üstteki elin işaret parmağını ekle: üstten ilk iki delik kapalı, alttaki elin orta parmağı kapalı.',
    notaTopicId: 'nota-1',
  },
  {
    id: 'buselik',
    name: 'Bûselik',
    written: { step: 'B', octave: 4, acc: 0 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'yarim', 'acik', 'kapali', 'acik'] },
    verified: true,
    source: SRC_BUSELIK,
    tip: 'Çârgâh duruşunda üstteki elin yüzük parmağıyla üçüncü deliğin yarısını kapat. Yarım deliği kulağınla ayarla.',
    notaTopicId: 'nota-1',
  },
  {
    id: 'dugah',
    name: 'Dügâh',
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
    written: { step: 'G', octave: 4, acc: 0 },
    fingering: { thumb: 'kapali', front: ['kapali', 'kapali', 'kapali', 'kapali', 'kapali', 'kapali'] },
    verified: true,
    source: SRC_TEMEL,
    tip: 'Bütün delikler kapalı. Parmak yastıklarıyla delikleri tam kapat; hava kaçarsa ses çıkmaz.',
    notaTopicId: 'nota-2',
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
