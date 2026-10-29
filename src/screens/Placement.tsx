import { useEffect, useRef, useState } from 'preact/hooks'
import { NOTA_TOPICS } from '../content/nota-topics'
import { currentTopic, topicStatuses } from '../learning/mastery'
import { ILK_SES_CONFIG } from '../learning/long-tone'
import { buildPlacement, placementResult } from '../learning/placement'
import type { Question } from '../learning/questions'
import { LongToneTrainer } from '../ney/LongToneTrainer'
import { Staff } from '../notation/Staff'
import { navigate } from '../router'
import { getSettings, listAttempts, listTopics, saveSettings, setPlacedOut } from '../store/db'
import type { Settings } from '../store/db'
import { seededRng } from '../util/rng'

/** Soru portesinde vuruş içindeki sekizlikler kirişlenir (gündüz oturumuyla aynı çizim). */
const KIRIS_VURUSU = 1

type Step = 'sorular' | 'ney' | 'deneme' | 'kaydediliyor' | 'bitti'

interface Answer {
  topicId: string
  correct: boolean
}

/**
 * Başlangıç yoklaması: 8 soru (doğru/yanlış gösterilmez), isteğe bağlı tek ilk ses denemesi,
 * sonra tam doğru konular atlanır. Cevaplar `AttemptRec` yazmaz; ustalık penceresi bozulmaz.
 */
export function Placement({ seed }: { seed?: number }) {
  const [questions] = useState<Question[]>(() => buildPlacement(seededRng(seed ?? Date.now())))
  const [index, setIndex] = useState(0)
  const [step, setStep] = useState<Step>('sorular')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [startTitle, setStartTitle] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const answers = useRef<Answer[]>([])
  const finishing = useRef(false)

  useEffect(() => {
    let alive = true
    void getSettings().then((s) => {
      if (alive) setSettings(s)
    })
    return () => {
      alive = false
    }
  }, [])

  function choose(question: Question, choice: string) {
    // Çift dokunuş aynı soruyu iki kez saymasın.
    if (step !== 'sorular' || answers.current.length !== index) return
    answers.current.push({ topicId: question.topicId, correct: choice === question.answer })
    if (index + 1 >= questions.length) setStep('ney')
    else setIndex(index + 1)
  }

  async function finish() {
    if (finishing.current) return
    finishing.current = true
    setFailed(false)
    setStep('kaydediliyor')
    try {
      for (const id of placementResult(answers.current)) await setPlacedOut(id)
      await saveSettings({ placementDone: true })
      const [attempts, topics] = await Promise.all([listAttempts(), listTopics()])
      const placedOut = new Set(topics.filter((t) => t.placedOut).map((t) => t.id))
      const topic = currentTopic(NOTA_TOPICS, topicStatuses(NOTA_TOPICS, attempts, placedOut))
      setStartTitle(topic?.title ?? null)
      setStep('bitti')
    } catch {
      setFailed(true)
      setStep('ney')
    } finally {
      finishing.current = false
    }
  }

  if (step === 'bitti') {
    return (
      <main class="screen">
        <h1>Hazırız!</h1>
        <p>{startTitle ? `${startTitle} konusundan başlıyoruz.` : 'Tüm konuları biliyorsunuz.'}</p>
        <button type="button" class="primary" onClick={() => navigate('/')}>
          Ana ekrana
        </button>
      </main>
    )
  }

  if (step === 'kaydediliyor') {
    return (
      <main class="screen">
        <p class="muted">Kaydediliyor…</p>
      </main>
    )
  }

  if (step === 'deneme' && settings) {
    return (
      <main class="screen evening">
        <header class="day-head">
          <h1>🪈 İlk ses</h1>
        </header>
        <LongToneTrainer
          target={{ kind: 'ilk-ses' }}
          settings={settings}
          cfg={ILK_SES_CONFIG}
          nextLabel="Devam"
          onNext={() => void finish()}
        />
        {/* Deneme kaydı yazılamasa da (Devam çıkmaz) yoklamadan çıkılabilsin. */}
        <button type="button" class="back" onClick={() => void finish()}>
          Atla
        </button>
      </main>
    )
  }

  if (step === 'ney' || step === 'deneme') {
    return (
      <main class="screen">
        <h1>Neyiniz yanınızda mı?</h1>
        {failed && (
          <p class="notice" role="status">
            Kaydedilemedi, tekrar deneyin.
          </p>
        )}
        <div class="feedback-options">
          <button type="button" class="primary" disabled={!settings} onClick={() => setStep('deneme')}>
            Evet
          </button>
          <button type="button" class="primary" onClick={() => void finish()}>
            Şimdi değil
          </button>
        </div>
      </main>
    )
  }

  const question = questions[index]
  if (!question) return null
  return (
    <main class="screen day">
      <header class="day-head">
        <h1>Önce ne hatırladığınıza bakalım</h1>
        <p class="muted placement-count">
          {index + 1}/{questions.length}
        </p>
        <progress max={questions.length} value={index} aria-label="İlerleme" />
      </header>

      <p class="prompt">{question.prompt}</p>
      <div class="staff-wrap">
        <Staff events={question.events} beamBeats={KIRIS_VURUSU} />
      </div>

      <div class="options">
        {question.options.map((o) => (
          <button key={`${question.id}-${o}`} type="button" class="option" onClick={() => choose(question, o)}>
            {o}
          </button>
        ))}
      </div>
    </main>
  )
}
