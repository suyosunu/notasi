import type { DurationKind, MusicEvent } from '../../music/notation'
import type { Accidental, Step } from '../../music/pitch'
import allahEmrin from './allah-emrin-tutalim.json'
import benimAdim from './benim-adim-dertli-dolap.json'
import cecenKizi from './cecen-kizi.json'
import daglarIle from './daglar-ile-taslar-ile.json'
import gulYuzlulerin from './gul-yuzlulerin.json'
import hakTeala from './hak-teala.json'
import hicranOku from './hicran-oku-aranagme.json'
import yineBaglandi from './yine-baglandi-dil-aranagme.json'
import { ELLE_PARCALAR } from './elle'
import { MAKAMLAR } from './types'
import type { Parca, ParcaMakam } from './types'

export type { Parca, ParcaMakam }

const DURATIONS: readonly string[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'thirtysecond']
const STEPS: readonly string[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const ACCIDENTALS: readonly number[] = [0, 1, -1, 4, -4, 5, -5, 8, -8]

function bad(what: string): never {
  throw new Error(`Geçersiz parça verisi: ${what}`)
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const str = (o: Record<string, unknown>, k: string): string =>
  typeof o[k] === 'string' ? (o[k] as string) : bad(k)

function toEvent(v: unknown, where: string): MusicEvent {
  if (!isObj(v) || typeof v.dur !== 'string' || !DURATIONS.includes(v.dur)) return bad(`${where} süre`)
  const dur = v.dur as DurationKind
  const dotted = v.dotted === undefined ? {} : v.dotted === true ? { dotted: true } : bad(`${where} nokta`)
  if (v.kind === 'rest') return 'tie' in v ? bad(`${where} susta bağ`) : { kind: 'rest', dur, ...dotted }
  if (v.kind !== 'note' || !isObj(v.pitch)) return bad(`${where} nota`)
  const tie = v.tie === undefined ? {} : v.tie === true ? { tie: true } : bad(`${where} bağ`)
  const { step, octave, acc } = v.pitch
  if (typeof step !== 'string' || !STEPS.includes(step)) return bad(`${where} perde`)
  if (typeof octave !== 'number' || !Number.isInteger(octave)) return bad(`${where} oktav`)
  if (typeof acc !== 'number' || !ACCIDENTALS.includes(acc)) return bad(`${where} işaret`)
  return { kind: 'note', pitch: { step: step as Step, octave, acc: acc as Accidental }, dur, ...dotted, ...tie }
}

/** JSON verisini çalışma anında doğrular (JSON türleri gevşek çıkarıldığı için). */
export function toParca(data: unknown): Parca {
  if (!isObj(data)) return bad('nesne değil')
  const makam = str(data, 'makam')
  if (!(MAKAMLAR as readonly string[]).includes(makam)) bad('makam')
  if (!Array.isArray(data.olcu)) return bad('olcu')
  const olcu = data.olcu.map((m: unknown, i) =>
    Array.isArray(m) ? m.map((e: unknown, j) => toEvent(e, `ölçü ${i + 1} olay ${j + 1}`)) : bad(`ölçü ${i + 1}`),
  )
  const parca: Parca = {
    id: str(data, 'id'),
    title: str(data, 'title'),
    makam: makam as ParcaMakam,
    usul: str(data, 'usul'),
    composer: str(data, 'composer'),
    source: str(data, 'source'),
    olcu,
  }
  if (data.soz !== undefined) {
    const soz = data.soz
    if (!Array.isArray(soz) || soz.length !== olcu.length) return bad('soz')
    parca.soz = soz.map((m: unknown, i) =>
      Array.isArray(m) && m.length === olcu[i]!.length && m.every((s) => typeof s === 'string')
        ? (m as string[])
        : bad(`soz ölçü ${i + 1}`),
    )
  }
  return parca
}

/** SymbTr parçaları, kolaydan zora. */
const SYMBTR_PARCALAR: Parca[] = [benimAdim, yineBaglandi, hakTeala, allahEmrin, hicranOku, gulYuzlulerin, daglarIle, cecenKizi].map(toParca)

/** SymbTr parçaları, sonra elle yazılmış parçalar (başlığa göre; bölümler ana parçanın hemen arkasında). */
export const PARCALAR: Parca[] = [...SYMBTR_PARCALAR, ...ELLE_PARCALAR]
