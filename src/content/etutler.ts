import type { DurationKind, MusicEvent } from '../music/notation'
import { samePitch } from '../music/pitch'
import type { Accidental, Step, WrittenPitch } from '../music/pitch'
import { NEY_PERDELER } from './ney-perdeler'
import type { PerdeId } from './ney-perdeler'

// Özgün etütler (kaynak etüt kopyalanmadı), hepsi ♩ = 60.
// - Seviye 1: tek perde, iki perde ve rast beşlisi (4/4).
// - Seviye 2: usul (Nim Sofyan 2/4, Semâî 3/4, Sofyan 4/4), dörtlü (Çârgâh, Kürdî, Hicaz; 4/4) ve dil (tu ve bağ; 4/4).
//   Yalnız birlik, ikilik, dörtlük ve sekizlik (noktalısı da) kullanılır; onaltılık ve üçleme yoktur.
// - Seviye 3: kademe geçişi (aynı parmakla iki şiddet: 2. kademe sesi ve 31 koma üstündeki eşi), Nevâ'da Rast ve
//   Bûselik beşlileri ve Rast ile Nevâ dizileri (4/4). Usulsüz, yalnız uzun seslerle; kapalı Nevâ inişte kullanılır.
//   İlke MEB 1218 ve 1232 ile neyzenim _9'dan (araştırma C §5); kalıplar bizim önerimizdir.
// - Seviye 4: tiz perdeler (alt perde–tiz perde oktav çiftleri; neyzenim _8: "orta ve alt perdeleri uzun uzun üflemenizi
//   öneriyorum", bu yüzden tizde süreler kısa), makam dizileri (Uşşak Tiz Nevâ'ya kadar, Bayâtî, Hüseynî, Muhayyer, Kürdî,
//   Hicaz), dil teknikleri (bağsız, bağlı, kesik) ve aksak usuller (Türk Aksağı 5/8, Devr-i Hindî 7/8). Kalıplar bizim önerimizdir.
// Çalış sırası: uzun ses → etüt → eser (araştırma notu, ortak kalıp S1, S2, S5; etüt tempoları S4 ders 3–4).

export interface Etut {
  id: string
  baslik: string
  tur: 'tek' | 'iki' | 'besli' | 'usul' | 'dortlu' | 'dil' | 'kademe' | 'dizi' | 'tiz'
  /** Hepsi geçilince etüt akşam planına girer. */
  perdeler: PerdeId[]
  /** Ölçüler: usulsüz etütte 4/4, usullü etütte `usul.zaman * 4 / usul.mertebe` dörtlük (5/8 → 2.5, 7/8 → 3.5). */
  olcu: MusicEvent[][]
  bpm: number
  /** Etütten önce okunan ders. */
  dersId: string
  seviye: 1 | 2 | 3 | 4
  /** `USULLER` kimliği: eşlik usul sesiyle çalar. Yoksa 4/4 metronom. */
  usulId?: string
}

const SURELER: Record<string, DurationKind> = {
  '1': 'whole',
  '2': 'half',
  '4': 'quarter',
  '8': 'eighth',
  '16': 'sixteenth',
  '32': 'thirtysecond',
}
/** Uygulamanın kullandığı koma değiştirgeçleri (`Accidental`). */
const KOMALAR: readonly number[] = [1, 4, 5, 8, 9]
/** Nota sonunda noktadan sonra `_` (legato bağı), `~` (aynı perdeye bağ) ve `!` (kesik) en çok birer kez, herhangi bir sırada gelebilir. */
const NOTA = /^([A-G])(\d)(?:([b#])(\d+))?:(1|2|4|8|16|32)(t)?(\.)?([_~!]*)$/
const SUS = /^r:(1|2|4|8|16|32)(\.)?$/

function parseToken(token: string): MusicEvent {
  const sus = SUS.exec(token)
  if (sus) return { kind: 'rest', dur: SURELER[sus[1]!]!, ...(sus[2] ? { dotted: true } : {}) }
  const m = NOTA.exec(token)
  if (!m) throw new Error(`Geçersiz etüt belirteci: "${token}"`)
  let acc = 0
  if (m[3]) {
    const koma = Number(m[4])
    if (!KOMALAR.includes(koma)) throw new Error(`Geçersiz koma: "${token}"`)
    acc = m[3] === 'b' ? -koma : koma
  } else if (m[4]) {
    throw new Error(`Geçersiz etüt belirteci: "${token}"`)
  }
  const isaretler = m[8]!
  // Her işaret en çok bir kez; legato (_) ile aynı perde bağı (~) birlikte olmaz.
  if (/_.*_|~.*~|!.*!/.test(isaretler) || (isaretler.includes('_') && isaretler.includes('~'))) {
    throw new Error(`Geçersiz etüt belirteci: "${token}"`)
  }
  const pitch: WrittenPitch = { step: m[1] as Step, octave: Number(m[2]), acc: acc as Accidental }
  return {
    kind: 'note',
    pitch,
    dur: SURELER[m[5]!]!,
    ...(m[6] ? { uclu: true } : {}),
    ...(m[7] ? { dotted: true } : {}),
    ...(isaretler.includes('_') ? { bag: true } : {}),
    ...(isaretler.includes('~') ? { tie: true } : {}),
    ...(isaretler.includes('!') ? { kesik: true } : {}),
  }
}

/**
 * Kısa etüt gösterimi: ölçüler `|` ile, notalar boşlukla ayrılır.
 * Nota `<Harf><Oktav>[b<koma>|#<koma>]:<1|2|4|8|16|32>[t][.][_|~][!]` (ör. `B4b1:4`, `D5:2.`, `G4:4_`, `A4:16`, `A4:32`,
 * `A4:4!`, `D5:2~`, `A4:8t`), sus `r:<süre>`. `:16` onaltılık, `:32` otuzikiliktir; süreden sonraki `t` üçleme üyesidir
 * (süre × 2/3; üç `:8t` bir dörtlük eder). Nota sonundaki `_` sonraki notaya legato
 * bağıdır (perde farklı olabilir), `~` aynı perdedeki sonraki notaya bağdır (süreler birleşir; sonraki olay ölçü
 * aşsa da aynı perdeden nota olmalı; `_` ile birlikte yazılmaz), `!` notayı kesik (staccato) yapar (susta kullanılamaz);
 * tek başına `,` bir önceki olaydan sonra nefes işaretidir.
 * Geçersiz belirteç, boş ölçü, `,` ile başlayan ölçü ya da aynı perdeye gitmeyen bağ `Error` fırlatır.
 */
export function parseEtut(s: string): MusicEvent[][] {
  const olcular = s.split('|').map((olcu) => {
    const tokens = olcu.trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) throw new Error('Boş ölçü')
    const olaylar: MusicEvent[] = []
    for (const token of tokens) {
      if (token === ',') {
        const onceki = olaylar.at(-1)
        if (!onceki) throw new Error('Ölçü nefes işaretiyle (,) başlayamaz')
        onceki.nefes = true
      } else {
        olaylar.push(parseToken(token))
      }
    }
    return olaylar
  })
  // Bağın karşılığı: sonraki olay (ölçü aşsa da) aynı perdeden nota olmalı.
  const hepsi = olcular.flat()
  hepsi.forEach((e, i) => {
    if (e.kind !== 'note' || !e.tie) return
    const sonraki = hepsi[i + 1]
    if (sonraki?.kind !== 'note' || !samePitch(e.pitch, sonraki.pitch)) {
      throw new Error('Bağ (~) aynı perdedeki sonraki notaya gitmeli')
    }
  })
  return olcular
}

/**
 * Perdenin etütlerde yazıldığı belirteç (Nevâ D5, Çârgâh C5, Segâh B4b1, Dügâh A4, Rast G4; ara sesler Bûselik B4,
 * Kürdî B4b5, Dik Kürdî B4b4, Nim Hicaz C5#4; 3. kademe Hüseynî E5, Acem F5, Gerdâniye G5, Muhayyer A5,
 * kapalı Nevâ D5, Eviç F5#4, Nim Şehnaz G5#4, Nim Hisar E5b5;
 * 4. kademe Tiz Segâh B5b1, Tiz Çârgâh C6, Tiz Nevâ D6, kapalı Gerdâniye G5, kapalı Muhayyer A5, Tiz Nim Hicaz C6#4).
 * Açık ve kapalı Nevâ (Gerdâniye, Muhayyer) aynı yazılı perdedir.
 */
const YAZIM: Partial<Record<PerdeId, string>> = {
  neva: 'D5',
  cargah: 'C5',
  segah: 'B4b1',
  dugah: 'A4',
  rast: 'G4',
  buselik: 'B4',
  kurdi: 'B4b5',
  'dik-kurdi': 'B4b4',
  'nim-hicaz': 'C5#4',
  huseyni: 'E5',
  acem: 'F5',
  gerdaniye: 'G5',
  muhayyer: 'A5',
  'kapali-neva': 'D5',
  evic: 'F5#4',
  'nim-sehnaz': 'G5#4',
  'nim-hisar': 'E5b5',
  'tiz-segah': 'B5b1',
  'tiz-cargah': 'C6',
  'tiz-neva': 'D6',
  'kapali-gerdaniye': 'G5',
  'kapali-muhayyer': 'A5',
  'tiz-nim-hicaz': 'C6#4',
}

function perdeAdi(id: PerdeId): string {
  return NEY_PERDELER.find((p) => p.id === id)!.name
}

function tek(id: PerdeId): Etut {
  const P = YAZIM[id]!
  return {
    id: `tek-${id}`,
    baslik: `Tek perde: ${perdeAdi(id)}`,
    tur: 'tek',
    perdeler: [id],
    olcu: parseEtut(`${P}:1 | ${P}:2 r:2 | ${P}:4 ${P}:4 ${P}:4 r:4 | ${P}:2 ${P}:2 | ${P}:1`),
    bpm: 60,
    dersId: 'etut:giris',
    seviye: 1,
  }
}

/** `a` önceki perde, `b` yeni perde. */
function iki(a: PerdeId, b: PerdeId): Etut {
  const A = YAZIM[a]!
  const B = YAZIM[b]!
  return {
    id: `iki-${a}-${b}`,
    baslik: `İki perde: ${perdeAdi(a)}–${perdeAdi(b)}`,
    tur: 'iki',
    perdeler: [a, b],
    olcu: parseEtut(
      `${A}:2 ${B}:2 | ${A}:2 ${B}:2 | ${A}:4 ${B}:4 ${A}:4 ${B}:4 | ${B}:1 | ${B}:2 ${A}:2 | ${B}:4 ${A}:4 ${B}:2 | ` +
        `${A}:4 ${A}:4 ${B}:4 r:4 | ${B}:1`,
    ),
    bpm: 60,
    dersId: 'etut:giris',
    seviye: 1,
  }
}

const BESLI: PerdeId[] = ['neva', 'cargah', 'segah', 'dugah', 'rast']

function besli(n: number, baslik: string, notasyon: string): Etut {
  return {
    id: `rast-besli-${n}`,
    baslik,
    tur: 'besli',
    perdeler: [...BESLI],
    olcu: parseEtut(notasyon),
    bpm: 60,
    dersId: 'etut:rast-besli',
    seviye: 1,
  }
}

/** Seviye 2 etüdü: ♩ = 60. */
function seviye2(e: Omit<Etut, 'olcu' | 'bpm' | 'seviye'> & { notasyon: string }): Etut {
  const { notasyon, ...rest } = e
  return { ...rest, olcu: parseEtut(notasyon), bpm: 60, seviye: 2 }
}

/** Seviye 3 etüdü: ♩ = 60. */
function seviye3(e: Omit<Etut, 'olcu' | 'bpm' | 'seviye'> & { notasyon: string }): Etut {
  const { notasyon, ...rest } = e
  return { ...rest, olcu: parseEtut(notasyon), bpm: 60, seviye: 3 }
}

/**
 * Usul etütleri: her ölçünün ilk notası düm'e denk gelir ve ölçünün en uzun sesidir (Nim Sofyan ve Semâî'de düm
 * 1. vuruşta, Sofyan'da 1–2. vuruşlarda).
 */
const USUL_ETUTLERI: Etut[] = [
  seviye2({
    id: 'usul-nim-sofyan',
    baslik: 'Usul: Nim Sofyan',
    tur: 'usul',
    usulId: 'nim-sofyan',
    perdeler: ['neva', 'cargah', 'segah'],
    dersId: 'usul:nim-sofyan',
    // 2/4: ikilik ölçüler düm'ü tutar; dörtlüklü ölçülerde ilk dörtlük düm'de, ikincisi tek'te. Nevâ'da durur.
    notasyon: 'D5:2 | C5:4 B4b1:4 | C5:2 | B4b1:4 C5:4 | B4b1:2 | C5:4 D5:4 | C5:4 D5:4 | D5:2',
  }),
  seviye2({
    id: 'usul-semai',
    baslik: 'Usul: Semâî',
    tur: 'usul',
    usulId: 'semai',
    perdeler: ['cargah', 'segah', 'dugah'],
    dersId: 'usul:semai',
    // 3/4: noktalı ikilik bütün ölçüyü, ikilik düm ile ilk tek'i tutar. Dügâh'ta durur.
    notasyon: 'C5:2. | B4b1:2 A4:4 | B4b1:2. | C5:2 B4b1:4 | A4:2 B4b1:4 | C5:4 B4b1:4 C5:4 | B4b1:2 A4:4 | A4:2.',
  }),
  seviye2({
    id: 'usul-sofyan',
    baslik: 'Usul: Sofyan',
    tur: 'usul',
    usulId: 'sofyan',
    perdeler: ['segah', 'dugah', 'rast'],
    dersId: 'usul:sofyan',
    // 4/4: ikilik ya da birlik iki zamanlık düm'ü tutar; her iki ölçüde bir nefes. Rast'ta durur.
    notasyon:
      'B4b1:2 A4:2 | G4:2 A4:2 , | B4b1:2 A4:4 B4b1:4 | A4:1 , | A4:2 G4:4 A4:4 | B4b1:2 A4:2 , | ' +
      'A4:2 B4b1:4 A4:4 | G4:1',
  }),
]

/** Dörtlü etütleri: önce dörtlü dörtlüklerle çıkılıp inilir, sonra dörtlük ve sekizliklerle; durak perdesinde biter. */
const DORTLU_ETUTLERI: Etut[] = [
  seviye2({
    id: 'dortlu-cargah',
    baslik: "Çârgâh dörtlüsü (Rast'ta)",
    tur: 'dortlu',
    perdeler: ['rast', 'dugah', 'buselik', 'cargah'],
    dersId: 'dortlu:cargah',
    notasyon:
      'G4:4 A4:4 B4:4 C5:4 | C5:1 | C5:4 B4:4 A4:4 G4:4 | G4:1 | G4:8 A4:8 B4:4 C5:2 | C5:8 B4:8 A4:4 B4:2 | ' +
      'A4:8 B4:8 C5:4 B4:4 A4:4 | G4:1',
  }),
  seviye2({
    id: 'dortlu-kurdi',
    baslik: "Kürdî dörtlüsü (Dügâh'ta)",
    tur: 'dortlu',
    perdeler: ['dugah', 'kurdi', 'cargah', 'neva'],
    dersId: 'dortlu:kurdi',
    notasyon:
      'A4:4 B4b5:4 C5:4 D5:4 | D5:1 | D5:4 C5:4 B4b5:4 A4:4 | A4:1 | A4:8 B4b5:8 C5:4 D5:2 | ' +
      'D5:8 C5:8 B4b5:4 C5:2 | C5:4 B4b5:8 C5:8 B4b5:4 A4:4 | A4:1',
  }),
  seviye2({
    id: 'dortlu-hicaz',
    baslik: "Hicaz dörtlüsü (Dügâh'ta)",
    tur: 'dortlu',
    perdeler: ['dugah', 'dik-kurdi', 'nim-hicaz', 'neva'],
    dersId: 'dortlu:hicaz',
    notasyon:
      'A4:4 B4b4:4 C5#4:4 D5:4 | D5:1 | D5:4 C5#4:4 B4b4:4 A4:4 | A4:1 | B4b4:8 C5#4:8 D5:4 C5#4:2 | ' +
      'B4b4:8 C5#4:8 B4b4:4 A4:2 | A4:8 B4b4:8 C5#4:4 B4b4:2 | A4:1',
  }),
]

/** Dil etüdünün ezgisi (4 ölçü): önce her nota ayrı "tu" ile, sonra aynı ezgi ikişer bağlı. */
const DIL_EZGI = 'D5:4 C5:4 B4b1:4 C5:4 | D5:4 C5:4 D5:2 | C5:4 B4b1:4 C5:4 D5:4 | C5:2 D5:2'
const DIL_BAGLI = 'D5:4_ C5:4 B4b1:4_ C5:4 | D5:4_ C5:4 D5:2 | C5:4_ B4b1:4 C5:4_ D5:4 | C5:2_ D5:2'

const DIL_ETUTLERI: Etut[] = [
  seviye2({
    id: 'dil-1',
    baslik: 'Dil: tu ve bağ',
    tur: 'dil',
    perdeler: ['neva', 'cargah', 'segah'],
    dersId: 'dil:tu-bag',
    notasyon: `${DIL_EZGI} | ${DIL_BAGLI}`,
  }),
]

/** Nevâ'da Rast beşlisi (Eviç F5#4); Bûselik beşlisi aynı kalıpta F5#4 yerine F5 (Acem) ile çalınır. */
const NEVA_BESLI =
  'D5:4 E5:4 F5#4:4 G5:4 | A5:1 | A5:4 G5:4 F5#4:4 E5:4 | D5:1 | D5:4 E5:4 F5#4:2 | G5:4 A5:4 G5:2 | ' +
  'F5#4:4 E5:4 F5#4:4 E5:4 | D5:1'

/**
 * Seviye 3 etütleri. Kademe etütlerinde aynı parmakla önce 2. kademe sesi, sonra 31 koma üstündeki eşi çalınır
 * (nefes güçlenir). Bûselik beşliği Nevâ'da D5 E5 F5 G5 A5'tir (9+4+9+9; S2 10.1.1.2: "Nevâda rast ve bûselik beşlisi").
 */
const SEVIYE3_ETUTLERI: Etut[] = [
  seviye3({
    id: 'kademe-dugah-huseyni',
    baslik: 'Aynı parmak: Dügâh–Hüseynî',
    tur: 'kademe',
    perdeler: ['dugah', 'huseyni'],
    dersId: 'etut:kademe',
    notasyon: 'A4:1 | E5:1 | A4:2 E5:2 | A4:2 E5:2 | E5:2 A4:2 | A4:4 E5:4 A4:4 E5:4 | E5:2. r:4 | A4:1',
  }),
  seviye3({
    id: 'kademe-rast-kapali-neva',
    baslik: 'Aynı parmak: Rast–Nevâ (kapalı)',
    tur: 'kademe',
    perdeler: ['rast', 'kapali-neva'],
    dersId: 'etut:kademe',
    notasyon: 'G4:1 | D5:1 | G4:2 D5:2 | G4:2 D5:2 | D5:2 G4:2 | G4:4 D5:4 G4:4 D5:4 | D5:2. r:4 | G4:1',
  }),
  seviye3({
    id: 'kademe-cargah-gerdaniye',
    baslik: 'Aynı parmak: Çârgâh–Gerdâniye, Nevâ–Muhayyer',
    tur: 'kademe',
    perdeler: ['cargah', 'gerdaniye', 'neva', 'muhayyer'],
    dersId: 'etut:kademe',
    notasyon: 'C5:1 | G5:1 | C5:2 G5:2 | G5:2 C5:2 | D5:1 | A5:1 | D5:2 A5:2 | A5:2 D5:2 | D5:1',
  }),
  seviye3({
    id: 'kademe-ara',
    baslik: 'Aynı parmak: Segâh–Eviç, Nim Hicaz–Nim Şehnaz',
    tur: 'kademe',
    perdeler: ['segah', 'evic', 'nim-hicaz', 'nim-sehnaz', 'neva'],
    dersId: 'etut:kademe',
    notasyon:
      'B4b1:1 | F5#4:1 | B4b1:2 F5#4:2 | F5#4:2 B4b1:2 | C5#4:1 | G5#4:1 | C5#4:2 G5#4:2 | G5#4:2 C5#4:2 | D5:1',
  }),
  seviye3({
    id: 'kademe-nim-hisar',
    baslik: 'Nim Hisar: Hüseynî ile Nevâ arasında',
    tur: 'kademe',
    perdeler: ['huseyni', 'nim-hisar', 'neva'],
    dersId: 'etut:kademe',
    notasyon:
      'E5:1 | E5b5:1 | E5:2 E5b5:2 | D5:2 E5b5:2 | E5:4 E5b5:4 D5:2 | D5:4 E5b5:4 E5:2 | E5:2 E5b5:4 D5:4 | D5:1',
  }),
  seviye3({
    id: 'neva-rast-besli',
    baslik: "Nevâ'da Rast beşlisi",
    tur: 'besli',
    perdeler: ['neva', 'huseyni', 'evic', 'gerdaniye', 'muhayyer'],
    dersId: 'dortlu:besli',
    notasyon: NEVA_BESLI,
  }),
  seviye3({
    id: 'neva-buselik-besli',
    baslik: "Nevâ'da Bûselik beşlisi",
    tur: 'besli',
    perdeler: ['neva', 'huseyni', 'acem', 'gerdaniye', 'muhayyer'],
    dersId: 'dortlu:besli',
    notasyon: NEVA_BESLI.replaceAll('F5#4', 'F5'),
  }),
  seviye3({
    id: 'dizi-rast',
    baslik: 'Rast dizisi: çıkışta Eviç, inişte Acem',
    tur: 'dizi',
    perdeler: ['rast', 'dugah', 'segah', 'cargah', 'neva', 'huseyni', 'evic', 'gerdaniye', 'acem'],
    dersId: 'makam:rast',
    notasyon: 'G4:4 A4:4 B4b1:4 C5:4 | D5:4 E5:4 F5#4:4 G5:4 | G5:1 | G5:4 F5:4 E5:4 D5:4 | C5:4 B4b1:4 A4:4 G4:4 | G4:1',
  }),
  seviye3({
    id: 'dizi-neva',
    baslik: 'Nevâ dizisi (inişte kapalı Nevâ)',
    tur: 'dizi',
    perdeler: ['dugah', 'segah', 'cargah', 'neva', 'huseyni', 'evic', 'gerdaniye', 'muhayyer', 'kapali-neva'],
    dersId: 'makam:neva',
    notasyon: 'A4:4 B4b1:4 C5:4 D5:4 | E5:4 F5#4:4 G5:4 A5:4 | A5:1 | A5:4 G5:4 F5#4:4 E5:4 | D5:2 C5:4 B4b1:4 | A4:1',
  }),
]

/** Seviye 4 etüdü: ♩ = 60. */
function seviye4(e: Omit<Etut, 'olcu' | 'bpm' | 'seviye'> & { notasyon: string }): Etut {
  const { notasyon, ...rest } = e
  return { ...rest, olcu: parseEtut(notasyon), bpm: 60, seviye: 4 }
}

/** Oktav kalıbı: uzun sesler, ikilikler, dörtlükler; tizde noktalı ikilik ve sus, alt sesle biter. */
function oktavKalibi(alt: string, tiz: string): string {
  return (
    `${alt}:1 | ${tiz}:1 | ${alt}:2 ${tiz}:2 | ${tiz}:2 ${alt}:2 | ${alt}:4 ${tiz}:4 ${alt}:4 ${tiz}:4 | ` +
    `${tiz}:2. r:4 | ${alt}:1`
  )
}

/**
 * Seviye 4 etütleri. Oktav etütlerinde alt perde ile bir oktav üstündeki tiz perde birbirini izler; kapalı Gerdâniye ve
 * Muhayyer açık olanlarla aynı yazılı notadır (G5, A5). Dizi etütleri Seviye 4 perdelerini (tiz sesler, Eviç, Acem...) kullanır.
 * Usul etütlerinde her ölçünün ilk notası düm'e denk gelir: Türk Aksağı (5/8) düm 2, tek 2, tek 1; Devr-i Hindî (7/8)
 * düm 1, tek 1, tek 1, düm 2, tek 2 (neyzenim _13); ölçüler 2.5 ve 3.5 dörtlüktür.
 */
const SEVIYE4_ETUTLERI: Etut[] = [
  seviye4({
    id: 'tiz-segah-oktav',
    baslik: 'Oktav: Segâh–Tiz Segâh',
    tur: 'tiz',
    perdeler: ['segah', 'tiz-segah'],
    dersId: 'etut:tiz',
    notasyon: oktavKalibi('B4b1', 'B5b1'),
  }),
  seviye4({
    id: 'tiz-cargah-oktav',
    baslik: 'Oktav: Çârgâh–Tiz Çârgâh',
    tur: 'tiz',
    perdeler: ['cargah', 'tiz-cargah'],
    dersId: 'etut:tiz',
    notasyon: oktavKalibi('C5', 'C6'),
  }),
  seviye4({
    id: 'tiz-neva-oktav',
    baslik: 'Oktav: Nevâ–Tiz Nevâ',
    tur: 'tiz',
    perdeler: ['neva', 'tiz-neva'],
    dersId: 'etut:tiz',
    notasyon: oktavKalibi('D5', 'D6'),
  }),
  seviye4({
    id: 'kapali-oktav',
    baslik: 'Oktav: Rast–Gerdâniye, Dügâh–Muhayyer (kapalı)',
    tur: 'tiz',
    perdeler: ['rast', 'kapali-gerdaniye', 'dugah', 'kapali-muhayyer'],
    dersId: 'etut:tiz',
    notasyon: 'G4:1 | G5:1 | G4:2 G5:2 | G5:2 G4:2 | A4:1 | A5:1 | A4:2 A5:2 | A5:2 A4:2 | A4:1',
  }),
  seviye4({
    id: 'tiz-nim-hicaz-oktav',
    baslik: 'Oktav: Nim Hicaz–Tiz Nim Hicaz',
    tur: 'tiz',
    perdeler: ['nim-hicaz', 'tiz-nim-hicaz', 'neva'],
    dersId: 'etut:tiz',
    notasyon: 'C5#4:1 | C6#4:1 | C5#4:2 C6#4:2 | C6#4:2 C5#4:2 | C5#4:4 C6#4:4 C5#4:4 C6#4:4 | C6#4:2. r:4 | C5#4:2 D5:2 | D5:1',
  }),
  seviye4({
    id: 'dizi-ussak-tiz',
    baslik: "Uşşak dizisi Tiz Nevâ'ya kadar",
    tur: 'dizi',
    perdeler: ['dugah', 'segah', 'cargah', 'neva', 'huseyni', 'acem', 'gerdaniye', 'muhayyer', 'tiz-segah', 'tiz-cargah', 'tiz-neva'],
    dersId: 'makam:ussak',
    notasyon:
      'A4:4 B4b1:4 C5:4 D5:4 | E5:4 F5:4 G5:4 A5:4 | B5b1:4 C6:4 D6:2 | D6:4 C6:4 B5b1:4 A5:4 | G5:4 F5:4 E5:4 D5:4 | ' +
      'C5:4 B4b1:4 A4:2 | A4:1',
  }),
  seviye4({
    id: 'dizi-bayati',
    baslik: "Bayâtî: Nevâ'dan başla",
    tur: 'dizi',
    perdeler: ['neva', 'huseyni', 'cargah', 'segah', 'acem', 'gerdaniye', 'muhayyer', 'dugah'],
    dersId: 'makam:bayati',
    notasyon: 'D5:2 E5:4 D5:4 | C5:4 B4b1:4 C5:2 | D5:4 E5:4 F5:4 G5:4 | A5:2 G5:4 F5:4 | E5:4 D5:4 C5:4 B4b1:4 | A4:1',
  }),
  seviye4({
    id: 'dizi-huseyni',
    baslik: 'Hüseynî dizisi (çıkışta Eviç, inişte Acem)',
    tur: 'dizi',
    perdeler: ['dugah', 'segah', 'cargah', 'neva', 'huseyni', 'evic', 'gerdaniye', 'muhayyer', 'acem'],
    dersId: 'makam:huseyni',
    notasyon: 'A4:4 B4b1:4 C5:4 D5:4 | E5:4 F5#4:4 G5:4 A5:4 | A5:1 | A5:4 G5:4 F5:4 E5:4 | D5:4 C5:4 B4b1:4 A4:4 | A4:1',
  }),
  seviye4({
    id: 'dizi-muhayyer',
    baslik: 'Muhayyer: tizden iniş',
    tur: 'dizi',
    perdeler: ['muhayyer', 'tiz-segah', 'gerdaniye', 'evic', 'huseyni', 'neva', 'acem', 'cargah', 'segah', 'dugah'],
    dersId: 'makam:muhayyer',
    notasyon: 'A5:2 B5b1:4 A5:4 | G5:4 F5#4:4 E5:2 | D5:4 E5:4 F5#4:4 G5:4 | A5:1 | A5:4 G5:4 F5:4 E5:4 | D5:4 C5:4 B4b1:4 A4:4 | A4:1',
  }),
  seviye4({
    id: 'dizi-kurdi',
    baslik: 'Kürdî dizisi',
    tur: 'dizi',
    perdeler: ['dugah', 'kurdi', 'cargah', 'neva', 'huseyni', 'acem', 'gerdaniye', 'muhayyer'],
    dersId: 'makam:kurdi',
    notasyon: 'A4:4 B4b5:4 C5:4 D5:4 | E5:4 F5:4 G5:4 A5:4 | A5:1 | A5:4 G5:4 F5:4 E5:4 | D5:4 C5:4 B4b5:4 A4:4 | A4:1',
  }),
  seviye4({
    id: 'dizi-hicaz',
    baslik: 'Hicaz dizisi',
    tur: 'dizi',
    perdeler: ['dugah', 'dik-kurdi', 'nim-hicaz', 'neva', 'huseyni', 'evic', 'gerdaniye', 'muhayyer'],
    dersId: 'makam:hicaz',
    notasyon: 'A4:4 B4b4:4 C5#4:4 D5:4 | E5:4 F5#4:4 G5:4 A5:4 | A5:1 | A5:4 G5:4 F5#4:4 E5:4 | D5:4 C5#4:4 B4b4:4 A4:4 | A4:1',
  }),
  seviye4({
    id: 'dil-2',
    baslik: 'Dil: bağsız, bağlı, kesik',
    tur: 'dil',
    perdeler: ['dugah', 'segah', 'cargah', 'neva', 'huseyni'],
    dersId: 'dil:teknikler',
    notasyon:
      'A4:4 B4b1:4 C5:4 D5:4 | E5:4 D5:4 C5:2 | B4b1:4 C5:4 D5:4 C5:4 | B4b1:2 A4:2 | ' +
      'A4:4_ B4b1:4 C5:4_ D5:4 | E5:4_ D5:4 C5:2 | B4b1:4_ C5:4 D5:4_ C5:4 | B4b1:2_ A4:2 | ' +
      'A4:4! B4b1:4! C5:4! D5:4! | E5:4! D5:4! C5:2 | B4b1:4! C5:4! D5:4! C5:4! | B4b1:2 A4:2',
  }),
  seviye4({
    id: 'usul-turk-aksagi',
    baslik: 'Usul: Türk Aksağı',
    tur: 'usul',
    usulId: 'turk-aksagi',
    perdeler: ['rast', 'dugah', 'segah', 'cargah', 'neva', 'huseyni'],
    dersId: 'usul:turk-aksagi',
    notasyon:
      'D5:4 C5:4 B4b1:8 | A4:4 B4b1:4 C5:8 | D5:4 E5:4 D5:8 | D5:2 r:8 | C5:4 B4b1:4 A4:8 | B4b1:4 C5:4 B4b1:8 | ' +
      'A4:4 B4b1:4 G4:8 | A4:2 r:8',
  }),
  seviye4({
    id: 'usul-devr-i-hindi',
    baslik: 'Usul: Devr-i Hindî',
    tur: 'usul',
    usulId: 'devr-i-hindi',
    perdeler: ['rast', 'dugah', 'segah', 'cargah', 'neva', 'huseyni'],
    dersId: 'usul:devr-i-hindi',
    notasyon:
      'A4:8 B4b1:8 C5:8 D5:4 C5:4 | B4b1:8 C5:8 D5:8 E5:4 D5:4 | C5:8 D5:8 C5:8 B4b1:4 A4:4 | A4:2. r:8 | ' +
      'D5:8 E5:8 D5:8 C5:4 B4b1:4 | C5:8 B4b1:8 A4:8 B4b1:4 C5:4 | B4b1:8 C5:8 B4b1:8 A4:4 G4:4 | A4:2. r:8',
  }),
]

export const ETUTLER: Etut[] = [
  tek('neva'),
  tek('cargah'),
  iki('neva', 'cargah'),
  tek('segah'),
  iki('cargah', 'segah'),
  tek('dugah'),
  iki('segah', 'dugah'),
  tek('rast'),
  iki('dugah', 'rast'),
  besli(
    1,
    'Rast beşlisi 1 (dörtlükler)',
    'G4:4 A4:4 B4b1:4 C5:4 | D5:1 | D5:4 C5:4 B4b1:4 A4:4 | G4:1 | G4:4 A4:4 B4b1:2 | C5:4 D5:4 C5:2 | ' +
      'B4b1:4 A4:4 B4b1:4 A4:4 | G4:1',
  ),
  besli(
    2,
    'Rast beşlisi 2 (sekizlikler)',
    'G4:8 A4:8 B4b1:8 C5:8 D5:2 | D5:8 C5:8 B4b1:8 A4:8 G4:2 | G4:8 A4:8 B4b1:4 A4:8 B4b1:8 C5:4 | ' +
      'B4b1:8 C5:8 D5:4 C5:8 B4b1:8 A4:4 | G4:1',
  ),
  ...USUL_ETUTLERI,
  ...DORTLU_ETUTLERI,
  ...DIL_ETUTLERI,
  ...SEVIYE3_ETUTLERI,
  ...SEVIYE4_ETUTLERI,
]
