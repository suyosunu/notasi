import { MAKAMLAR } from '../content/makamlar'
import type { Makam } from '../content/makamlar'
import { NOTA_TOPICS } from '../content/nota-topics'
import { ACCIDENTAL_NAMES } from '../music/accidentals'
import { notaEtiketi, PERDE_ADLARI } from '../content/perde-adlari'
import { diziEvents } from '../music/makam'
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

/** Dizi adlarının ayracı: kopmaz boşluk + en tire + boşluk; satır sonunda kırılsa da "–" ile başlamaz. */
export const SEQ_SEP = ' – '
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

const ACCIDENTAL_HINT = 'Bemol sesi pesleştirir, diyez tizleştirir; çizgi ve gövde sayısı koma miktarını gösterir.'
const PERDE_HINT = 'Sırayla: Rast (Sol), Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer (tiz La).'
const PERDE_3_HINT = 'Si üzerindeki işaretler: işaretsiz Si Bûselik, Dik Kürdî bakiye bemolü, Kürdî küçük mücenneb bemolü.'
const PERDE_4_HINT = 'Do üzerinde: Nim Hicaz bakiye diyezi, Hicaz küçük mücenneb diyezi; Fa üzerinde: Eviç bakiye diyezi.'

function perdeHint(topicId: string): string {
  if (topicId === 'perde-3') return PERDE_3_HINT
  if (topicId === 'perde-4') return PERDE_4_HINT
  return PERDE_HINT
}

/** Irak için kart ya da soru üretilmez; hiçbir çeldirici havuzunda yer almaz. */
const IRAK_KEY = 'F4#4'
const IRAK_NAME = 'Irak'

const PERDE_TOPICS = NOTA_TOPICS.filter((t) => t.kind === 'perde-name')

/** Aynı harfin öbür oktavdaki perdesi (Sol4 ↔ Sol5, La4 ↔ La5); yalnızca Sol ve La için vardır. */
function octaveCounterpart(key: string): string | null {
  if (key.charAt(0) !== 'G' && key.charAt(0) !== 'A') return null
  const other = `${key.charAt(0)}${key.charAt(1) === '4' ? '5' : '4'}`
  return other in PERDE_ADLARI ? notaEtiketi(other) : null
}

/**
 * Konudaki notaların etiketleri çeldirici olur; yetmezse dokuz notanın tamamından tamamlanır.
 * Cevap Sol ya da La ise oktav karşılığı ("tiz Sol" ↔ "Sol", "tiz La" ↔ "La") bir çeldirici olarak
 * her zaman bulunur: öğrenen oktavı ayırt etmelidir.
 */
function reverseOptions(topicId: string, topicCards: string[], key: string, answer: string, rng: () => number): string[] {
  const counterpart = octaveCounterpart(key)
  const fixed = counterpart && counterpart !== answer ? [counterpart] : []
  const own = [...new Set(topicCards.map((c) => notaEtiketi(perdeKey(c))))].filter((l) => l !== answer && !fixed.includes(l))
  const distractors = [...fixed, ...shuffle(own, rng)]
  if (distractors.length < 3) {
    // Önce önceki perde konularının etiketleri, yetmezse Irak hariç tüm perdelerin etiketleri.
    const earlier = PERDE_TOPICS.slice(0, PERDE_TOPICS.findIndex((t) => t.id === topicId)).flatMap((t) =>
      t.cards.map((c) => notaEtiketi(perdeKey(c))),
    )
    const all = Object.keys(PERDE_ADLARI).filter((k) => k !== IRAK_KEY).map(notaEtiketi)
    for (const pool of [earlier, all]) {
      if (distractors.length >= 3) break
      distractors.push(...shuffle([...new Set(pool)].filter((l) => l !== answer && !distractors.includes(l)), rng))
    }
  }
  return shuffle([answer, ...distractors.slice(0, 3)], rng)
}

/** Aynı işaret ailesinin (bemol ya da diyez) dört işareti; cevap bunlardan biridir. */
function accidentalOptions(acc: number, rng: () => number): string[] {
  const family = Object.entries(ACCIDENTAL_NAMES)
    .filter(([k]) => (Number(k) < 0) === (acc < 0))
    .map(([, name]) => name)
  return shuffle(family, rng)
}

/** Bu perde konusunun ve önceki perde konularının perde adları, konu sırasıyla. */
function perdeNamesUpTo(topicId: string): string[] {
  const upTo = PERDE_TOPICS.slice(0, PERDE_TOPICS.findIndex((t) => t.id === topicId) + 1)
  return [...new Set(upTo.flatMap((t) => t.cards.map((c) => PERDE_ADLARI[perdeKey(c)]!)))]
}

/** İleri soru çeldiricileri: bu ve önceki perde konularının adları; 3'ten azsa Irak hariç tüm perde adlarından tamamlanır. */
function forwardPerdeOptions(topicId: string, perde: string, rng: () => number): string[] {
  const distractors = shuffle(
    perdeNamesUpTo(topicId).filter((n) => n !== perde),
    rng,
  )
  if (distractors.length < 3) {
    distractors.push(
      ...shuffle(
        Object.values(PERDE_ADLARI).filter((n) => n !== perde && n !== IRAK_NAME && !distractors.includes(n)),
        rng,
      ),
    )
  }
  return shuffle([perde, ...distractors.slice(0, 3)], rng)
}

const MAKAM_DIZI_HINT =
  'İşaretli notalara bak. Rast: Si koma bemolü, Fa bakiye diyezi. Uşşak: yalnızca Si koma bemolü. Hicaz: Si bakiye bemolü, Fa ve Do bakiye diyezi.'
const MAKAM_DURAK_HINT = 'Durak, makamın bittiği (karar verdiği) perdedir.'
const MAKAM_GUCLU_HINT = 'Güçlü, makamda yarım karar yapılan perdedir.'
/** Üç makamın dışında, çeldirici olarak kullanılan tanınmış bir makam adı. */
const MAKAM_DISTRACTOR = 'Hüseynî'

function makamOf(cardId: string, id: string): Makam {
  const makam = MAKAMLAR.find((m) => m.id === id)
  if (!makam) throw new Error(`Geçersiz kart kimliği: ${cardId}`)
  return makam
}

/** Cevap + Irak hariç üç farklı perde adı. */
function makamPerdeOptions(answer: string, rng: () => number): string[] {
  const pool = [...new Set(Object.values(PERDE_ADLARI))].filter((n) => n !== answer && n !== IRAK_NAME)
  return shuffle([answer, ...shuffle(pool, rng).slice(0, 3)], rng)
}

/** 'makam-dizi:rast' / 'makam-durak:ussak' / 'makam-guclu:hicaz' */
function makeMakamQuestion(cardId: string, id: string, rng: () => number): Question {
  const m = /^makam-(dizi|durak|guclu):(.+)$/.exec(cardId)
  if (!m) throw new Error(`Geçersiz kart kimliği: ${cardId}`)
  const makam = makamOf(cardId, m[2]!)
  const base = { id, cardId, topicId: 'makam' }
  if (m[1] === 'dizi') {
    return {
      ...base,
      prompt: 'Bu dizi hangi makamın?',
      events: diziEvents(makam.dizi, 'quarter'),
      options: shuffle([...MAKAMLAR.map((x) => x.name), MAKAM_DISTRACTOR], rng),
      answer: makam.name,
      hint: MAKAM_DIZI_HINT,
    }
  }
  const durak = m[1] === 'durak'
  const answer = durak ? makam.durak : makam.guclu
  return {
    ...base,
    prompt: `${makam.name} makamının ${durak ? 'durağı' : 'güçlüsü'} hangi perde?`,
    events: [],
    options: makamPerdeOptions(answer, rng),
    answer,
    hint: durak ? MAKAM_DURAK_HINT : MAKAM_GUCLU_HINT,
  }
}

export function makeQuestion(cardId: string, rng: () => number): Question {
  if (cardId.startsWith('makam-')) {
    const id = `${cardId}#${Math.floor(rng() * 0x100000000).toString(36)}`
    return makeMakamQuestion(cardId, id, rng)
  }
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
        options: reverseOptions(topic.id, topic.cards, key, answer, rng),
        answer,
        hint: perdeHint(topic.id),
      }
    }
    return {
      id,
      cardId,
      topicId: topic.id,
      prompt: 'Bu notanın perde adı ne?',
      events,
      options: forwardPerdeOptions(topic.id, perde, rng),
      answer: perde,
      hint: perdeHint(topic.id),
    }
  }

  const event = events[0]!
  if (topic.kind === 'accidental-name') {
    if (event.kind !== 'note' || event.pitch.acc === 0) throw new Error(`Geçersiz kart kimliği: ${cardId}`)
    const acc = event.pitch.acc
    return {
      id,
      cardId,
      topicId: topic.id,
      prompt: 'Bu işaretin adı ne?',
      events: [event],
      options: accidentalOptions(acc, rng),
      answer: ACCIDENTAL_NAMES[acc as Exclude<typeof acc, 0 | 9 | -9>],
      hint: ACCIDENTAL_HINT,
    }
  }
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
