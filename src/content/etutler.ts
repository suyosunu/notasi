import type { DurationKind, MusicEvent } from '../music/notation'
import type { Accidental, Step, WrittenPitch } from '../music/pitch'
import { NEY_PERDELER } from './ney-perdeler'
import type { PerdeId } from './ney-perdeler'

// Özgün etütler (kaynak etüt kopyalanmadı), hepsi ♩ = 60.
// - Seviye 1: tek perde, iki perde ve rast beşlisi (4/4).
// - Seviye 2: usul (Nim Sofyan 2/4, Semâî 3/4, Sofyan 4/4), dörtlü (Çârgâh, Kürdî, Hicaz; 4/4) ve dil (tu ve bağ; 4/4).
//   Yalnız birlik, ikilik, dörtlük ve sekizlik (noktalısı da) kullanılır; onaltılık ve üçleme yoktur.
// Çalış sırası: uzun ses → etüt → eser (araştırma notu, ortak kalıp S1, S2, S5; etüt tempoları S4 ders 3–4).

export interface Etut {
  id: string
  baslik: string
  tur: 'tek' | 'iki' | 'besli' | 'usul' | 'dortlu' | 'dil'
  /** Hepsi geçilince etüt akşam planına girer. */
  perdeler: PerdeId[]
  /** Ölçüler: usulsüz etütte 4/4, usullü etütte `usul.zaman`/4. */
  olcu: MusicEvent[][]
  bpm: number
  /** Etütten önce okunan ders. */
  dersId: string
  seviye: 1 | 2
  /** `USULLER` kimliği: eşlik usul sesiyle çalar. Yoksa 4/4 metronom. */
  usulId?: string
}

const SURELER: Record<string, DurationKind> = { '1': 'whole', '2': 'half', '4': 'quarter', '8': 'eighth' }
/** Uygulamanın kullandığı koma değiştirgeçleri (`Accidental`). */
const KOMALAR: readonly number[] = [1, 4, 5, 8, 9]
const NOTA = /^([A-G])(\d)(?:([b#])(\d+))?:([1248])(\.)?(_)?$/
const SUS = /^r:([1248])(\.)?$/

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
  const pitch: WrittenPitch = { step: m[1] as Step, octave: Number(m[2]), acc: acc as Accidental }
  return { kind: 'note', pitch, dur: SURELER[m[5]!]!, ...(m[6] ? { dotted: true } : {}), ...(m[7] ? { bag: true } : {}) }
}

/**
 * Kısa etüt gösterimi: ölçüler `|` ile, notalar boşlukla ayrılır.
 * Nota `<Harf><Oktav>[b<koma>|#<koma>]:<1|2|4|8>[.][_]` (ör. `B4b1:4`, `D5:2.`, `G4:4_`), sus `r:<süre>`.
 * Nota sonundaki `_` sonraki notaya bağdır; tek başına `,` bir önceki olaydan sonra nefes işaretidir.
 * Geçersiz belirteç, boş ölçü ya da `,` ile başlayan ölçü `Error` fırlatır.
 */
export function parseEtut(s: string): MusicEvent[][] {
  return s.split('|').map((olcu) => {
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
}

/**
 * Perdenin etütlerde yazıldığı belirteç (Nevâ D5, Çârgâh C5, Segâh B4b1, Dügâh A4, Rast G4; ara sesler Bûselik B4,
 * Kürdî B4b5, Dik Kürdî B4b4, Nim Hicaz C5#4; 3. kademe Hüseynî E5, Acem F5, Gerdâniye G5, Muhayyer A5,
 * kapalı Nevâ D5, Eviç F5#4, Nim Şehnaz G5#4, Nim Hisar E5b5). Açık ve kapalı Nevâ aynı yazılı perdedir.
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
]
