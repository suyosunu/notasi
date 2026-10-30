import { NOTA_TOPICS, type Topic } from '../content/nota-topics'
import { PERDE_ADLARI } from '../content/perde-adlari'
import { parseNoteKey } from '../music/accidentals'
import type { DurationKind, MusicEvent } from '../music/notation'
import type { Step } from '../music/pitch'

export type { Topic }

const STEPS: readonly string[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const DURATIONS: readonly string[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth', 'thirtysecond']

function invalid(cardId: string): never {
  throw new Error(`Geçersiz kart kimliği: ${cardId}`)
}

/**
 * 'note:D5' → Re5 dörtlük; 'dur:half' → Si4 ikilik nota;
 * 'dur:quarter.dotted' → noktalı; 'rest:eighth' → sekizlik sus; 'dur:eighth.uclu' → üçleme sekizliği
 * (tek olay; porte için üçü cardToEvents'ten gelir). Noktalı ve üçleme birlikte kullanılmaz.
 */
export function cardToEvent(cardId: string): MusicEvent {
  const m = /^(note|dur|rest):(.+)$/.exec(cardId)
  if (!m) return invalid(cardId)
  const [, type, rest] = m
  if (type === 'note') {
    const pitch = parseNoteKey(rest)
    if (!pitch) return invalid(cardId)
    return { kind: 'note', pitch, dur: 'quarter' }
  }
  const [dur, flag, ...extra] = rest.split('.')
  if (!DURATIONS.includes(dur) || extra.length > 0 || (flag !== undefined && flag !== 'dotted' && flag !== 'uclu')) {
    return invalid(cardId)
  }
  const base = {
    dur: dur as DurationKind,
    ...(flag === 'dotted' ? { dotted: true } : {}),
    ...(flag === 'uclu' ? { uclu: true } : {}),
  }
  if (type === 'rest') return { kind: 'rest', ...base }
  return { kind: 'note', pitch: { step: 'B', octave: 4, acc: 0 }, ...base }
}

/** 'perde:D5' / 'perde-ters:B4b1' içindeki nota anahtarı; tanımlı bir perde olmalıdır. */
export function perdeKey(cardId: string): string {
  const m = /^perde(?:-ters)?:(.+)$/.exec(cardId)
  if (!m || !Object.hasOwn(PERDE_ADLARI, m[1]!)) return invalid(cardId)
  return m[1]!
}

/**
 * Tüm kart türleri için olay listesi. 'seq:G4-A4-B4-C5' → dört dörtlük nota;
 * 'perde:D5' → tek dörtlük nota; 'perde-ters:D5' → porte çizilmez (boş liste);
 * 'dur:eighth.uclu' → üç üçleme olayı (bir vuruşluk grup); diğer kartlar tek olaylıdır (cardToEvent).
 */
export function cardToEvents(cardId: string): MusicEvent[] {
  if (cardId.startsWith('perde')) {
    const key = perdeKey(cardId)
    if (cardId.startsWith('perde-ters:')) return []
    const pitch = parseNoteKey(key)
    if (!pitch) return invalid(cardId)
    return [{ kind: 'note', pitch, dur: 'quarter' }]
  }
  if (!cardId.startsWith('seq:')) {
    const e = cardToEvent(cardId)
    return e.uclu ? [e, { ...e }, { ...e }] : [e]
  }
  const parts = cardId.slice(4).split('-')
  return parts.map((p) => {
    const n = /^([A-G])(\d)$/.exec(p)
    if (!n || !STEPS.includes(n[1]!)) return invalid(cardId)
    return { kind: 'note', pitch: { step: n[1] as Step, octave: Number(n[2]), acc: 0 }, dur: 'quarter' } as const
  })
}

export function topicOfCard(cardId: string): Topic {
  const t = NOTA_TOPICS.find((x) => x.cards.includes(cardId))
  if (!t) return invalid(cardId)
  return t
}
