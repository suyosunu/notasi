import { NOTA_TOPICS } from '../content/nota-topics'
import { notaEtiketi, PERDE_ADLARI } from '../content/perde-adlari'
import { durationName } from '../music/notation'
import type { MusicEvent } from '../music/notation'
import { SOLFEJ } from '../music/pitch'
import type { Step } from '../music/pitch'
import { staffIndex } from '../notation/geometry'
import { shuffle } from '../util/rng'
import { cardToEvent, cardToEvents, perdeKey, topicOfCard } from './cards'

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

const SEQ_SEP = ' – '
const SEQ_HINT = 'Soldan sağa tek tek oku: önce çizgi mi aralık mı olduğuna bak.'
/** Çeldirici dizilerde izin verilen aralık: C4 (28) .. A5 (40), diyatonik sıra numarasıyla. */
const SEQ_MIN = 4 * 7
const SEQ_MAX = 5 * 7 + 5

/** Doğal perdenin diyatonik sıra numarası (Do4 = 28, Re4 = 29 …). */
function diatonic(p: { step: Step; octave: number }): number {
  return p.octave * 7 + STEP_LIST.indexOf(p.step)
}

function seqName(indices: number[]): string {
  return indices.map((i) => SOLFEJ[STEP_LIST[i % 7]!]).join(SEQ_SEP)
}

function inRange(indices: number[]): boolean {
  return indices.every((i) => i >= SEQ_MIN && i <= SEQ_MAX)
}

/** Dizi cevabı için üç çeldirici: ±1 adım kayma, tek nota değişimi; yetmezse iki nota değişimi. */
function sequenceOptions(answerIdx: number[], answer: string, rng: () => number): string[] {
  const found: string[] = []
  const consider = (candidate: number[]): void => {
    if (found.length >= 3 || !inRange(candidate)) return
    const name = seqName(candidate)
    if (name !== answer && !found.includes(name)) found.push(name)
  }
  const dir = (): number => (rng() < 0.5 ? -1 : 1)
  const change = (idx: number[], at: number, by: number): number[] => idx.map((v, i) => (i === at ? v + by : v))

  consider(answerIdx.map((i) => i + 1))
  consider(answerIdx.map((i) => i - 1))
  consider(change(answerIdx, Math.floor(rng() * answerIdx.length), dir()))

  // Yetmezse farklı iki notayı değiştirerek üret; sınırlı deneme, sonra kesin tarama.
  for (let tries = 0; found.length < 3 && tries < 200 && answerIdx.length > 1; tries++) {
    const a = Math.floor(rng() * answerIdx.length)
    const b = (a + 1 + Math.floor(rng() * (answerIdx.length - 1))) % answerIdx.length
    consider(change(change(answerIdx, a, dir()), b, dir()))
  }
  for (let at = 0; found.length < 3 && at < answerIdx.length; at++) {
    for (const by of [1, -1]) consider(change(answerIdx, at, by))
  }
  return found
}

const PERDE_HINT = 'Sırayla: Rast (Sol), Dügâh, Bûselik, Çârgâh, Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer (tiz La).'

/** Konudaki notaların etiketleri çeldirici olur; yetmezse dokuz notanın tamamından tamamlanır. */
function reverseOptions(topicCards: string[], answer: string, rng: () => number): string[] {
  const own = [...new Set(topicCards.map((c) => notaEtiketi(perdeKey(c))))].filter((l) => l !== answer)
  const distractors = shuffle(own, rng)
  if (distractors.length < 3) {
    const all = Object.keys(PERDE_ADLARI).map(notaEtiketi)
    distractors.push(...shuffle([...new Set(all)].filter((l) => l !== answer && !distractors.includes(l)), rng))
  }
  return shuffle([answer, ...distractors.slice(0, 3)], rng)
}

export function makeQuestion(cardId: string, rng: () => number): Question {
  const topic = topicOfCard(cardId)
  const events = cardToEvents(cardId)
  // Kimlik: kart + rng'den bir çekiliş; aynı (kart, rng durumu) için aynıdır.
  const id = `${cardId}#${Math.floor(rng() * 0x100000000).toString(36)}`

  if (topic.kind === 'sequence') {
    const idx = events.map((e) => {
      if (e.kind !== 'note') throw new Error(`Geçersiz kart kimliği: ${cardId}`)
      return diatonic(e.pitch)
    })
    const answer = seqName(idx)
    return {
      id,
      cardId,
      topicId: topic.id,
      prompt: 'Bu dizi nasıl okunur?',
      events,
      options: shuffle([answer, ...sequenceOptions(idx, answer, rng)], rng),
      answer,
      hint: SEQ_HINT,
    }
  }

  if (topic.kind === 'perde-name') {
    const key = perdeKey(cardId)
    const perde = PERDE_ADLARI[key]!
    if (cardId.startsWith('perde-ters:')) {
      const answer = notaEtiketi(key)
      return {
        id,
        cardId,
        topicId: topic.id,
        prompt: `${perde} hangi nota?`,
        events,
        options: reverseOptions(topic.cards, answer, rng),
        answer,
        hint: PERDE_HINT,
      }
    }
    const distractors = shuffle(
      Object.values(PERDE_ADLARI).filter((n) => n !== perde),
      rng,
    ).slice(0, 3)
    return {
      id,
      cardId,
      topicId: topic.id,
      prompt: 'Bu notanın perde adı ne?',
      events,
      options: shuffle([perde, ...distractors], rng),
      answer: perde,
      hint: PERDE_HINT,
    }
  }

  const event = events[0]!
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
