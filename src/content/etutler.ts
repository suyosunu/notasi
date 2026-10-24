import type { DurationKind, MusicEvent } from '../music/notation'
import type { Accidental, Step, WrittenPitch } from '../music/pitch'
import { NEY_PERDELER } from './ney-perdeler'
import type { PerdeId } from './ney-perdeler'

// Özgün etütler (kaynak etüt kopyalanmadı): tek perde, iki perde ve rast beşlisi. Üçü de ♩ = 60'ta 4/4'tür.
// Çalış sırası: uzun ses → etüt → eser (araştırma notu, ortak kalıp S1, S2, S5; etüt tempoları S4 ders 3–4).

export interface Etut {
  id: string
  baslik: string
  tur: 'tek' | 'iki' | 'besli'
  /** Hepsi geçilince etüt akşam planına girer. */
  perdeler: PerdeId[]
  /** 4/4 ölçüler. */
  olcu: MusicEvent[][]
  bpm: number
  /** Etütten önce okunan ders. */
  dersId: string
  seviye: 1
}

const SURELER: Record<string, DurationKind> = { '1': 'whole', '2': 'half', '4': 'quarter', '8': 'eighth' }
/** Uygulamanın kullandığı koma değiştirgeçleri (`Accidental`). */
const KOMALAR: readonly number[] = [1, 4, 5, 8, 9]
const NOTA = /^([A-G])(\d)(?:([b#])(\d+))?:([1248])(\.)?$/
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
  return { kind: 'note', pitch, dur: SURELER[m[5]!]!, ...(m[6] ? { dotted: true } : {}) }
}

/**
 * Kısa etüt gösterimi: ölçüler `|` ile, notalar boşlukla ayrılır.
 * Nota `<Harf><Oktav>[b<koma>|#<koma>]:<1|2|4|8>[.]` (ör. `B4b1:4`, `D5:2.`), sus `r:<süre>`.
 * Geçersiz belirteç ya da boş ölçü `Error` fırlatır.
 */
export function parseEtut(s: string): MusicEvent[][] {
  return s.split('|').map((olcu) => {
    const tokens = olcu.trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) throw new Error('Boş ölçü')
    return tokens.map(parseToken)
  })
}

/** Perdenin etütlerde yazıldığı belirteç (Nevâ D5, Çârgâh C5, Segâh B4b1, Dügâh A4, Rast G4). */
const YAZIM: Partial<Record<PerdeId, string>> = { neva: 'D5', cargah: 'C5', segah: 'B4b1', dugah: 'A4', rast: 'G4' }

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
]
