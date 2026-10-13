import { NOTA_TOPICS } from '../content/nota-topics'
import { durationName } from '../music/notation'
import type { MusicEvent } from '../music/notation'
import { SOLFEJ } from '../music/pitch'
import type { Step } from '../music/pitch'
import { staffIndex } from '../notation/geometry'
import { shuffle } from '../util/rng'
import { cardToEvent, topicOfCard } from './cards'

export { seededRng } from '../util/rng'

export interface Question {
  id: string
  cardId: string
  topicId: string
  prompt: string
  events: MusicEvent[]
  options: string[]
  answer: string
  hint: string
}

const STEP_LIST: Step[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const DURATION_HINT = 'Birlik 4, ikilik 2, dörtlük 1, sekizlik ½ vuruş; nokta yarısı kadar ekler'

function noteHint(index: number): string {
  if (index < 0) return "Portenin altındaki ilk ek çizgi Do'dur"
  if (index > 8) return "Portenin üstündeki ilk ek çizgi La'dır"
  return index % 2 === 0 ? 'Çizgiler alttan: Mi, Sol, Si, Re, Fa' : 'Aralıklar alttan: Fa, La, Do, Mi'
}

const DURATION_TOPICS = NOTA_TOPICS.filter((t) => t.kind === 'duration')

function namesOf(topics: typeof DURATION_TOPICS): string[] {
  return [...new Set(topics.flatMap((t) => t.cards.map((c) => durationName(cardToEvent(c)))))]
}

/** Bu konunun ve önceki süre konularının adları; yetmezse tüm süre adlarından tamamlanır. */
function durationOptions(topicId: string, answer: string, rng: () => number): string[] {
  const upTo = DURATION_TOPICS.slice(0, DURATION_TOPICS.findIndex((t) => t.id === topicId) + 1)
  const distractors = shuffle(
    namesOf(upTo).filter((n) => n !== answer),
    rng,
  )
  if (distractors.length < 3) {
    distractors.push(
      ...shuffle(
        namesOf(DURATION_TOPICS).filter((n) => n !== answer && !distractors.includes(n)),
        rng,
      ),
    )
  }
  return shuffle([answer, ...distractors.slice(0, 3)], rng)
}

export function makeQuestion(cardId: string, rng: () => number): Question {
  const topic = topicOfCard(cardId)
  const event = cardToEvent(cardId)
  // Kimlik: kart + rng'den bir çekiliş; aynı (kart, rng durumu) için aynıdır.
  const id = `${cardId}#${Math.floor(rng() * 0x100000000).toString(36)}`

  if (topic.kind === 'note-name') {
    if (event.kind !== 'note') throw new Error(`Geçersiz kart kimliği: ${cardId}`)
    const answer = SOLFEJ[event.pitch.step]
    const distractors = shuffle(
      STEP_LIST.map((s) => SOLFEJ[s]).filter((n) => n !== answer),
      rng,
    ).slice(0, 3)
    return {
      id,
      cardId,
      topicId: topic.id,
      prompt: 'Bu notanın adı ne?',
      events: [event],
      options: shuffle([answer, ...distractors], rng),
      answer,
      hint: noteHint(staffIndex(event.pitch)),
    }
  }

  const answer = durationName(event)
  return {
    id,
    cardId,
    topicId: topic.id,
    prompt: 'Bu hangi süre?',
    events: [event],
    options: durationOptions(topic.id, answer, rng),
    answer,
    hint: DURATION_HINT,
  }
}
