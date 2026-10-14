import { useEffect, useRef, useState } from 'preact/hooks'
import { NEY_PERDELER } from '../content/ney-perdeler'
import { isPlanDone, loadOrStartEveningSession, nextTry, saveEveningProgress } from '../learning/evening-session'
import type { EveningState } from '../learning/evening-session'
import { ILK_SES_CONFIG, neyLevelConfig } from '../learning/long-tone'
import { LongToneTrainer } from '../ney/LongToneTrainer'
import type { ToneTarget } from '../ney/LongToneTrainer'
import { navigate } from '../router'
import { getSettings } from '../store/db'
import type { SessionRec, Settings } from '../store/db'
import { Calibration } from './Calibration'

function Loading() {
  return (
    <main class="screen">
      <p class="muted">Yükleniyor…</p>
    </main>
  )
}

/** Akşam planını adım adım, oturum kaydıyla yürütür; yarıda kalırsa aynı gün kaldığı yerden sürer. */
export function EveningPractice() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [session, setSession] = useState<SessionRec | null>(null)
  const busy = useRef(false)

  async function persist(s: SessionRec, state: EveningState) {
    const next = await saveEveningProgress(s, state)
    if (next.endedAt) {
      navigate('/oturum-sonu')
      return
    }
    setSession(next)
  }

  useEffect(() => {
    let alive = true
    void Promise.all([getSettings(), loadOrStartEveningSession(new Date())]).then(([cfg, s]) => {
      if (!alive) return
      setSettings(cfg)
      const state = s.state as EveningState
      // Boş plan (yapılacak adım yok): oturum hemen tamamlanır.
      if (isPlanDone(state)) void persist(s, state)
      else setSession(s)
    })
    return () => {
      alive = false
    }
  }, [])

  async function advance() {
    if (busy.current || !session) return
    busy.current = true
    try {
      await persist(session, nextTry(session.state as EveningState))
    } finally {
      busy.current = false
    }
  }

  async function afterCalibration(isStep: boolean) {
    setSettings(await getSettings())
    if (isStep) await advance()
  }

  if (!settings || !session) return <Loading />
  const state = session.state as EveningState
  const step = state.steps[state.stepIndex]
  if (!step) return <Loading />

  if (step.kind === 'kalibrasyon') {
    return <Calibration key="kalibrasyon-adimi" onDone={() => void afterCalibration(true)} />
  }

  let target: ToneTarget = { kind: 'ilk-ses' }
  if (step.kind === 'uzun-ses') {
    const perde = NEY_PERDELER.find((p) => p.id === step.perdeId)
    if (!perde) {
      return (
        <main class="screen">
          <p class="muted">Bu adımın perdesi bulunamadı.</p>
          <button type="button" class="primary" onClick={() => void advance()}>
            Devam
          </button>
        </main>
      )
    }
    // Perde hedefi ahenge bağlı: kalibrasyon yapılmadıysa önce o.
    if (!settings.calibrated) {
      return <Calibration key="kalibrasyon-once" onDone={() => void afterCalibration(false)} />
    }
    target = { kind: 'perde', perde }
  }

  // Task 17 perde başına geçiş sayısını bağlayana dek başlangıç düzeyi kullanılır.
  const cfg = step.kind === 'ilk-ses' ? ILK_SES_CONFIG : neyLevelConfig(0)

  return (
    <main class="screen evening">
      <header class="day-head">
        <h1>🌙 {step.label}</h1>
        <p class="muted step-meta">
          <span>
            Adım {state.stepIndex + 1}/{state.steps.length}
          </span>
          <span>
            Deneme {state.tryIndex + 1}/{step.tries}
          </span>
        </p>
      </header>
      <LongToneTrainer
        key={`${state.stepIndex}-${state.tryIndex}`}
        target={target}
        settings={settings}
        cfg={cfg}
        nextLabel="Devam"
        onNext={() => void advance()}
      />
      <a class="back" href="#/">
        Ana ekrana dön
      </a>
    </main>
  )
}
