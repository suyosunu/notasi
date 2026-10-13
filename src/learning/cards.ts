import { NOTA_TOPICS, type Topic } from '../content/nota-topics'
import type { DurationKind, MusicEvent } from '../music/notation'
import type { Step } from '../music/pitch'

export type { Topic }

const STEPS: readonly string[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const DURATIONS: readonly string[] = ['whole', 'half', 'quarter', 'eighth']

function invalid(cardId: string): never {
  throw new Error(`Geçersiz kart kimliği: ${cardId}`)
}

/**
 * 'note:D5' → Re5 dörtlük; 'dur:half' → Si4 ikilik nota;
 * 'dur:quarter.dotted' → noktalı; 'rest:eighth' → sekizlik sus.
 */
export function cardToEvent(cardId: string): MusicEvent {
  const m = /^(note|dur|rest):(.+)$/.exec(cardId)
  if (!m) return invalid(cardId)
  const [, type, rest] = m
  if (type === 'note') {
    const n = /^([A-G])(\d)$/.exec(rest)
    if (!n || !STEPS.includes(n[1])) return invalid(cardId)
    return { kind: 'note', pitch: { step: n[1] as Step, octave: Number(n[2]), acc: 0 }, dur: 'quarter' }
  }
  const [dur, flag, ...extra] = rest.split('.')
  if (!DURATIONS.includes(dur) || extra.length > 0 || (flag !== undefined && flag !== 'dotted')) {
    return invalid(cardId)
  }
  const base = { dur: dur as DurationKind, ...(flag === 'dotted' ? { dotted: true } : {}) }
  if (type === 'rest') return { kind: 'rest', ...base }
  return { kind: 'note', pitch: { step: 'B', octave: 4, acc: 0 }, ...base }
}

export function topicOfCard(cardId: string): Topic {
  const t = NOTA_TOPICS.find((x) => x.cards.includes(cardId))
  if (!t) return invalid(cardId)
  return t
}
