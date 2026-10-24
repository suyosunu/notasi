import { useEffect, useRef, useState } from 'preact/hooks'
import { playWritten, stopAudio, unlockAudio } from '../audio/player'
import { notaDersId } from '../content/dersler'
import { NOTA_TOPICS } from '../content/nota-topics'
import { DersKapisi } from '../ders/DersKapisi'
import { buildFreeQuestions } from '../learning/day-plan'
import { review } from '../learning/leitner'
import { answerQuestion, currentNotaTopicId, loadOrStartDaySession, tick } from '../learning/day-session'
import type { DayState } from '../learning/day-session'
import type { Question } from '../learning/questions'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { Staff } from '../notation/Staff'
import { navigate } from '../router'
import { addAttempt, getCard, getSettings, putCard } from '../store/db'
import type { SessionRec, Settings } from '../store/db'
import { seededRng } from '../util/rng'

const TICK_MS = 1000
const FREE_QUESTION_COUNT = 8
const DAY_TITLE = '☀️ Nota okuma'
export const REVIEW_NOTE = 'Biraz önceki konuyu tekrar edelim, sonra devam ederiz.'

interface Feedback {
  choice: string
  correct: boolean
}

interface QuestionCardProps {
  question: Question
  /** 0 tabanlı sıra. */
  index: number
  total: number
  settings: Settings
  feedback: Feedback | null
  /** Ekranın başında gösterilen yumuşak not (örn. önceki konuya dönüş). */
  note?: string
  /** Başlık metni (soru sırası sonuna eklenir). */
  title?: string
  onChoose: (choice: string) => void
  onNext: () => void
}

function QuestionCard({ question, index, total, settings, feedback, note, title = DAY_TITLE, onChoose, onNext }: QuestionCardProps) {
  const [showHint, setShowHint] = useState(false)
  /** Dinle'ye dokununca gösterilen ses uyarısı (yoksa null). */
  const [soundWarn, setSoundWarn] = useState<string | null>(null)

  // Soru değişince (ya da ekran kapanınca) çalan ses susar.
  useEffect(() => () => stopAudio(), [question.id])

  async function listen() {
    setSoundWarn(null)
    if (!settings.soundOn) {
      setSoundWarn(SOUND_OFF)
      return
    }
    try {
      // unlockAudio dokunuş işleyicisinde, ilk iş olarak çağrılmalıdır (iOS).
      await unlockAudio()
      await playWritten(question.events, settings.tuning)
    } catch {
      setSoundWarn(SOUND_WARNING)
    }
  }

  const answered = feedback !== null
  /** Portesiz sorularda (perde-ters) nota çizilmez ve çalınacak bir şey yoktur. */
  const hasStaff = question.events.length > 0
  /** Yalnızca sus işaretinden oluşan soruda çalınacak ses yoktur (sessizlik çalınmaz). */
  const canListen = question.events.some((e) => e.kind === 'note')
  return (
    <main class="screen day">
      <header class="day-head">
        {/* Gündüz oturumu kaydedilidir, sonra kaldığı yerden sürer; serbest tur bırakılır. */}
        <a class="back-top" href="#/">
          ← Ara ver
        </a>
        <h1>
          {title} · {index + 1}/{total}
        </h1>
        <progress max={total} value={index + (answered ? 1 : 0)} aria-label="İlerleme" />
      </header>

      {note && (
        <p class="notice" role="status">
          {note}
        </p>
      )}

      <p class="prompt">{question.prompt}</p>
      {hasStaff && (
        <div class="staff-wrap">
          <Staff events={question.events} />
        </div>
      )}

      <div class="options">
        {question.options.map((o) => {
          const state = !answered ? '' : o === question.answer ? ' option-correct' : o === feedback.choice ? ' option-wrong' : ''
          return (
            <button key={o} type="button" class={`option${state}`} disabled={answered} onClick={() => onChoose(o)}>
              {o}
            </button>
          )
        })}
      </div>

      <div class="tools">
        {canListen && (
          <button type="button" class="tool" onClick={() => void listen()}>
            🔊 Dinle
          </button>
        )}
        <button type="button" class="tool" onClick={() => setShowHint(true)}>
          💡 İpucu
        </button>
      </div>
      {showHint && <p class="hint">{question.hint}</p>}
      {soundWarn && (
        <p class="notice" role="status">
          {soundWarn}
        </p>
      )}

      {answered && (
        <div class="result" role="status">
          <p class={feedback.correct ? 'result-ok' : 'result-bad'}>
            {feedback.correct ? 'Doğru 👏' : `Yanlış — doğru cevap: ${question.answer}`}
          </p>
          <button type="button" class="primary" onClick={onNext}>
            Devam
          </button>
        </div>
      )}
    </main>
  )
}

export function Message({ children, back }: { children: string; back?: { href: string; label: string } }) {
  return (
    <main class="screen">
      <p class="muted">{children}</p>
      <a class="back" href={back?.href ?? '#/'}>
        {back?.label ?? 'Ana ekrana dön'}
      </a>
    </main>
  )
}

/** Oturum kaydıyla çalışan, 10 dakikalık gündüz dersi. */
function DaySession() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [session, setSession] = useState<SessionRec | null>(null)
  const [shown, setShown] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const sessionRef = useRef<SessionRec | null>(null)
  /** Oturum işlemleri (tick, cevap) sırayla çalışır; eski bir kopya üstüne yazılmaz. */
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const busy = useRef(false)

  function enqueue(op: (s: SessionRec) => Promise<SessionRec | null>): void {
    queue.current = queue.current
      .then(async () => {
        const current = sessionRef.current
        if (!current) return
        const next = await op(current)
        if (!next) return
        sessionRef.current = next
        setSession(next)
      })
      .catch(() => {
        // bitmiş oturuma gelen geç işlem; yok sayılır
      })
  }

  useEffect(() => {
    let alive = true
    Promise.all([getSettings(), loadOrStartDaySession(new Date())]).then(([cfg, s]) => {
      if (!alive) return
      sessionRef.current = s
      setSettings(cfg)
      setSession(s)
      setShown((s.state as DayState).index)
    })
    return () => {
      alive = false
    }
  }, [])

  const loaded = settings !== null && session !== null
  useEffect(() => {
    if (!loaded) return
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      enqueue(async (s) => {
        // Oturum zaten bittiyse (son cevap verildi) zamanlayıcı bir şey yapmaz;
        // geri bildirim görünür kalır, geçiş "Devam" ile olur.
        if (s.endedAt) return null
        const next = await tick(s, TICK_MS)
        // Yalnızca bu tick süre sınırıyla kapattıysa oturum sonuna git.
        if (next.endedAt) navigate('/oturum-sonu')
        return next
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [loaded])

  if (!settings || !session) return <Message>Yükleniyor…</Message>
  const state = session.state as DayState
  const question = state.questions[shown]
  if (!question) return <Message>Bugün için soru yok.</Message>

  function choose(choice: string) {
    if (busy.current || feedback) return
    busy.current = true
    enqueue(async (s) => {
      try {
        const { session: next, correct } = await answerQuestion(s, choice)
        setFeedback({ choice, correct })
        return next
      } finally {
        busy.current = false
      }
    })
  }

  function next() {
    const s = sessionRef.current
    if (!s) return
    if (s.endedAt) {
      navigate('/oturum-sonu')
      return
    }
    setShown((s.state as DayState).index)
    setFeedback(null)
  }

  return (
    <QuestionCard
      key={question.id}
      question={question}
      index={shown}
      total={state.questions.length}
      settings={settings}
      feedback={feedback}
      note={state.reviewNote ? REVIEW_NOTE : undefined}
      onChoose={choose}
      onNext={next}
    />
  )
}

/**
 * Hazır soru listesiyle serbest tur: oturum kaydı ve süre sınırı yok. Her cevap, sorunun kendi
 * konusuyla bir deneme yazar ve kartın Leitner kutusunu günceller. Konu turu ve karışık antrenman paylaşır.
 */
export function FreeRound({
  questions,
  title,
  emptyMessage,
  back,
}: {
  questions: Question[]
  title?: string
  emptyMessage: string
  back?: { href: string; label: string }
}) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const busy = useRef(false)

  useEffect(() => {
    let alive = true
    void getSettings().then((cfg) => {
      if (alive) setSettings(cfg)
    })
    return () => {
      alive = false
    }
  }, [])

  const question = questions[index]
  if (!question) return <Message back={back}>{emptyMessage}</Message>
  if (!settings) return <Message back={back}>Yükleniyor…</Message>

  if (done) {
    return (
      <main class="screen">
        <h1>Tur bitti</h1>
        <p>
          Skor: {score}/{questions.length}
        </p>
        <a class="primary" href={back?.href ?? '#/nota'}>
          {back?.label ?? 'Notalara dön'}
        </a>
      </main>
    )
  }

  async function choose(choice: string) {
    if (busy.current || feedback || !question) return
    busy.current = true
    try {
      const correct = choice === question.answer
      await addAttempt({ topicId: question.topicId, cardId: question.cardId, correct })
      await putCard(review(await getCard(question.cardId), question.cardId, correct, new Date()))
      if (correct) setScore((n) => n + 1)
      setFeedback({ choice, correct })
    } finally {
      busy.current = false
    }
  }

  function next() {
    if (index + 1 >= questions.length) {
      setDone(true)
      return
    }
    setIndex(index + 1)
    setFeedback(null)
  }

  return (
    <QuestionCard
      key={question.id}
      question={question}
      index={index}
      total={questions.length}
      settings={settings}
      feedback={feedback}
      title={title}
      onChoose={(c) => void choose(c)}
      onNext={next}
    />
  )
}

/** Tek bir konudan 8 soruluk serbest tur. */
function FreePractice({ topicId }: { topicId: string }) {
  const [questions] = useState<Question[]>(() => {
    const topic = NOTA_TOPICS.find((t) => t.id === topicId)
    if (!topic) return []
    const rng = seededRng(Date.now())
    return buildFreeQuestions(topic, FREE_QUESTION_COUNT, rng)
  })
  // Okunmamışsa konunun dersi turun önüne gelir (dersi olmayan konuda kapı doğrudan geçer).
  return (
    <DersKapisi dersId={notaDersId(topicId)}>
      <FreeRound questions={questions} emptyMessage="Konu bulunamadı." />
    </DersKapisi>
  )
}

/**
 * Gündüz oturumunun ders kapısı: yalnızca güncel konunun dersi istenir; öğrenilmiş konulardan gelen tekrar
 * soruları ders istemez. Kapı oturumun dışındadır: ders okunurken oturum açılmaz ve 10 dakikalık süre işlemez.
 */
function DaySessionGate() {
  /** undefined: güncel konu henüz okunmadı; null: güncel konu yok (hepsi öğrenildi ya da okunamadı). */
  const [topicId, setTopicId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    let alive = true
    currentNotaTopicId()
      .catch(() => null) // konu okunamazsa kapı atlanır; oturum yine açılır
      .then((id) => {
        if (alive) setTopicId(id)
      })
    return () => {
      alive = false
    }
  }, [])

  if (topicId === undefined) return <Message>Yükleniyor…</Message>
  return (
    <DersKapisi dersId={topicId ? notaDersId(topicId) : null}>
      <DaySession />
    </DersKapisi>
  )
}

export function DayPractice({ topicId }: { topicId?: string }) {
  return topicId ? <FreePractice topicId={topicId} /> : <DaySessionGate />
}
