import { useEffect, useRef, useState } from 'preact/hooks'
import type { PitchSample } from '../audio/mic'
import { NEY_PERDELER, visibleFingering } from '../content/ney-perdeler'
import { calibrate } from '../learning/calibration'
import type { CalibrationResult } from '../learning/calibration'
import { AHENKLER } from '../music/ahenk'
import type { Tuning } from '../music/ahenk'
import { FingeringDiagram } from '../ney/Fingering'
import { MicGate } from '../ney/MicGate'
import { navigate } from '../router'
import { getSettings, saveSettings } from '../store/db'
import type { Settings } from '../store/db'

export const COLLECT_MS = 3000
const INSTRUCTION = 'Nevâ perdesini (şemadaki gibi) rahatça 3 saniye üfleyin.'
const UNSTABLE = 'Ses kararlı gelmedi, biraz daha uzun ve sabit üfleyin.'
const UNKNOWN = 'Neyinizin ahengini tanıyamadım, tekrar deneyelim.'

type Outcome =
  | { kind: 'ok'; tuning: Tuning; matchesSelected: boolean }
  | { kind: 'error'; message: string }
  | { kind: 'declined' }

function ahenkName(id: Tuning['ahenk']): string {
  return AHENKLER.find((a) => a.id === id)?.name ?? id
}

function fromResult(r: CalibrationResult): Outcome {
  if (r.ok) return { kind: 'ok', tuning: r.tuning, matchesSelected: r.matchesSelected }
  return { kind: 'error', message: r.reason === 'tanimsiz' ? UNKNOWN : UNSTABLE }
}

function okText(t: Tuning): string {
  const name = ahenkName(t.ahenk)
  if (Math.abs(t.tuningCents) < 5) return `Neyiniz ${name} ahenginde, ayarı tam`
  return `Neyiniz ${name} ahenginde, ${Math.round(Math.abs(t.tuningCents))} sent ${t.tuningCents > 0 ? 'tiz' : 'pes'}`
}

/** Nevâ perdesinden ahenk, oktav ve ince ayarı bulur; onaylanınca ayarlara kaydeder. */
export function Calibration(props: { onDone?: () => void }) {
  const onDone = props.onDone ?? (() => navigate('/'))
  const [settings, setSettings] = useState<Settings | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const settingsRef = useRef<Settings | null>(null)
  const stopRef = useRef<() => void>(() => undefined)
  /** Toplama penceresi: `start`, ilk örneğin zamanıdır (örnek `t`'siyle ölçülür). */
  const collectRef = useRef<{ start: number | null; hz: number[] } | null>(null)

  useEffect(() => {
    let alive = true
    void getSettings().then((s) => {
      if (!alive) return
      settingsRef.current = s
      setSettings(s)
    })
    return () => {
      alive = false
    }
  }, [])

  function onSample(s: PitchSample) {
    const c = collectRef.current
    const cfg = settingsRef.current
    if (!c || !cfg) return
    if (c.start === null) c.start = s.t
    if (s.hz !== null) c.hz.push(s.hz)
    if (s.t - c.start < COLLECT_MS) return
    collectRef.current = null
    stopRef.current()
    setOutcome(fromResult(calibrate(c.hz, cfg.tuning.ahenk)))
  }

  async function begin(start: () => Promise<void>) {
    setOutcome(null)
    collectRef.current = { start: null, hz: [] }
    await start()
  }

  async function save(tuning: Tuning) {
    await saveSettings({ tuning, calibrated: true })
    onDone()
  }

  const fingering = visibleFingering(NEY_PERDELER.find((p) => p.id === 'neva')!)
  const result = outcome?.kind === 'ok' ? outcome : null

  return (
    <main class="screen calibration">
      <h1>Kalibrasyon</h1>
      <p>{INSTRUCTION}</p>
      {fingering && <FingeringDiagram fingering={fingering} />}
      <MicGate onSample={onSample}>
        {(start, stop, running) => {
          stopRef.current = stop
          if (running) return <p role="status">Dinleniyor…</p>
          if (result) {
            return result.matchesSelected ? (
              <div>
                <p role="status">{okText(result.tuning)}</p>
                <button type="button" onClick={() => void save(result.tuning)}>
                  Kaydet
                </button>
              </div>
            ) : (
              <div>
                <p role="status">
                  {`Neyiniz ${ahenkName(result.tuning.ahenk)} ahengi gibi görünüyor. Ayarı ${ahenkName(result.tuning.ahenk)} yapayım mı?`}
                </p>
                <button type="button" onClick={() => void save(result.tuning)}>
                  Evet
                </button>
                <button type="button" onClick={() => setOutcome({ kind: 'declined' })}>
                  Hayır
                </button>
              </div>
            )
          }
          return (
            <div>
              {outcome?.kind === 'error' && <p role="status">{outcome.message}</p>}
              <button type="button" disabled={!settings} onClick={() => void begin(start)}>
                {outcome === null ? 'Başla' : 'Tekrar dene'}
              </button>
            </div>
          )
        }}
      </MicGate>
    </main>
  )
}
