import { useEffect, useRef, useState } from 'preact/hooks'
import type { PitchSample } from '../audio/mic'
import { playWritten, stopAudio, unlockAudio } from '../audio/player'
import { ILK_SES_REHBER, visibleFingering } from '../content/ney-perdeler'
import type { NeyPerde } from '../content/ney-perdeler'
import { ILK_SES_ID } from '../learning/evening-plan'
import { fingeringCheck, initialLongTone, stepLongTone } from '../learning/long-tone'
import type { LongToneConfig, LongToneState } from '../learning/long-tone'
import { Smoother } from '../learning/smoothing'
import { soundingHz } from '../music/ahenk'
import { centsBetween } from '../music/pitch'
import { SOUND_WARNING } from '../screens/DayPractice'
import { addFingeringFlag, addLongTone, listFingeringFlags, listLongTones } from '../store/db'
import type { Settings } from '../store/db'
import { FingeringDiagram } from './Fingering'
import { MicGate } from './MicGate'
import { TunerGauge } from './TunerGauge'

export type ToneTarget = { kind: 'ilk-ses' } | { kind: 'perde'; perde: NeyPerde }

/** Perde ilk kez çalışılırken şema denetimi için toplanan süre. */
export const FINGERING_WINDOW_MS = 2000
export const FINGERING_NOTE = 'Ses beklenenden epey farklı. Parmak şemasını ve deliklerin tam kapandığını kontrol edin.'

type Phase = 'hazir' | 'dinliyor' | 'bitti'

interface View {
  cents: number | null
  holdingMs: number
  bestMs: number
}

/** Saniye, bir ondalık, Türkçe ondalık virgülüyle: 3200 → "3,2". */
export function seconds(ms: number): string {
  return (ms / 1000).toFixed(1).replace('.', ',')
}

/**
 * Tek bir uzun ses denemesi: mikrofonu dokunuşla açar, yumuşatılmış perdeyi hedefle
 * karşılaştırır, deneme bitince (geçince ya da "Bitir"le) `LongToneRec` yazar.
 * Yeni deneme için çağıran bileşeni `key` ile yeniden kurar.
 */
export function LongToneTrainer(props: {
  target: ToneTarget
  settings: Settings
  cfg: LongToneConfig
  nextLabel: string
  onNext: () => void
  /** Deneme kaydı yazılınca çağrılır (örn. geçmiş listesini yenilemek için). */
  onSaved?: () => void
}) {
  const { target, settings, cfg } = props
  const perde = target.kind === 'perde' ? target.perde : null
  const perdeId = perde ? perde.id : ILK_SES_ID
  const targetHz = perde ? soundingHz(perde.written, settings.tuning) : null

  const [phase, setPhase] = useState<Phase>('hazir')
  const [view, setView] = useState<View>({ cents: null, holdingMs: 0, bestMs: 0 })
  const [result, setResult] = useState<{ passed: boolean; saved: boolean } | null>(null)
  /** `null`: perdenin önceki kayıtları henüz okunmadı. */
  const [checkFingering, setCheckFingering] = useState<boolean | null>(perde ? null : false)
  const [fingeringNote, setFingeringNote] = useState(false)
  const [soundWarn, setSoundWarn] = useState(false)
  /** Bu perdenin önceki denemelerindeki en uzun süre. */
  const [historyBestMs, setHistoryBestMs] = useState(0)

  const phaseRef = useRef<Phase>('hazir')
  const stopRef = useRef<() => void>(() => undefined)
  const mountedRef = useRef(true)
  const smootherRef = useRef(new Smoother())
  const toneRef = useRef<LongToneState>(initialLongTone())
  /** İlk ses: tutuşun başındaki yumuşatılmış perde. */
  const refHzRef = useRef<number | null>(null)
  const collectRef = useRef<{ start: number | null; cents: number[]; done: boolean } | null>(null)

  useEffect(() => {
    mountedRef.current = true
    let alive = true
    void Promise.all([listLongTones(perdeId), perde ? listFingeringFlags(perde.id) : []]).then(([list, flags]) => {
      if (!alive) return
      setHistoryBestMs(list.reduce((m, r) => Math.max(m, r.durationMs), 0))
      // Şema denetimi yapılmış sayılır: şema kaydı ya da süresi olan (ses gelmiş) bir deneme varsa.
      if (perde) setCheckFingering(flags.length === 0 && !list.some((r) => r.durationMs > 0))
    })
    return () => {
      alive = false
      mountedRef.current = false
      stopAudio()
    }
  }, [])

  function evaluateFingering() {
    const c = collectRef.current
    if (!c || c.done) return
    c.done = true
    const r = fingeringCheck(c.cents)
    if (!r.suspicious || !perde) return
    setFingeringNote(true)
    void addFingeringFlag({ perdeId: perde.id, medianCents: r.medianCents })
  }

  async function finish() {
    if (phaseRef.current !== 'dinliyor') return
    phaseRef.current = 'bitti'
    setPhase('bitti')
    stopRef.current()
    evaluateFingering()
    const tone = toneRef.current
    setResult({ passed: tone.passed, saved: false })
    try {
      await addLongTone({ perdeId, durationMs: tone.bestMs, passed: tone.passed, toleranceCents: cfg.toleranceCents })
    } catch {
      return // kayıt yazılamadı: sonraki adım düğmesi çıkmaz; çağıran ekranın çıkış yolu kalır
    }
    if (!mountedRef.current) return
    setResult({ passed: tone.passed, saved: true })
    props.onSaved?.()
  }

  function onSample(s: PitchSample) {
    if (phaseRef.current !== 'dinliyor') return
    const hz = smootherRef.current.push(s.hz)
    let cents: number | null = null
    if (hz !== null) {
      if (targetHz !== null) {
        cents = centsBetween(hz, targetHz)
      } else {
        if (toneRef.current.holdStartAt === null) refHzRef.current = hz
        cents = centsBetween(hz, refHzRef.current ?? hz)
      }
    }
    const next = stepLongTone(toneRef.current, { t: s.t, cents }, cfg)
    toneRef.current = next

    const c = collectRef.current
    if (c && !c.done) {
      if (c.start === null && cents !== null) c.start = s.t
      if (c.start !== null) {
        if (s.t - c.start <= FINGERING_WINDOW_MS) {
          if (cents !== null) c.cents.push(cents)
        } else {
          evaluateFingering()
        }
      }
    }

    setView({ cents, holdingMs: next.holdingMs, bestMs: next.bestMs })
    if (next.passed) void finish()
  }

  async function begin(start: () => Promise<void>) {
    if (phaseRef.current !== 'hazir') return
    stopAudio() // hoparlördeki örnek ses mikrofona karışmasın
    smootherRef.current = new Smoother()
    toneRef.current = initialLongTone()
    refHzRef.current = null
    collectRef.current = checkFingering ? { start: null, cents: [], done: false } : null
    phaseRef.current = 'dinliyor'
    setPhase('dinliyor')
    await start()
  }

  async function listen() {
    if (!perde) return
    setSoundWarn(false)
    if (!settings.soundOn) {
      setSoundWarn(true)
      return
    }
    try {
      // unlockAudio dokunuş işleyicisinde, ilk iş olarak çağrılmalıdır (iOS).
      await unlockAudio()
      await playWritten([{ kind: 'note', pitch: perde.written, dur: 'half' }], settings.tuning)
    } catch {
      setSoundWarn(true)
    }
  }

  const fingering = perde ? visibleFingering(perde) : null

  return (
    <section class="tone">
      {target.kind === 'ilk-ses' && (
        <ul class="tone-guide">
          {ILK_SES_REHBER.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {perde && (
        <div class="tone-perde">
          {fingering && <FingeringDiagram fingering={fingering} />}
          <p class="tone-tip">{perde.tip}</p>
        </div>
      )}
      {fingeringNote && (
        <p class="notice" role="status">
          {FINGERING_NOTE}
        </p>
      )}

      <p class="tone-time">
        Süre: {seconds(view.holdingMs)} sn (en iyi {seconds(Math.max(historyBestMs, view.bestMs))} sn)
      </p>
      <TunerGauge cents={view.cents} toleranceCents={cfg.toleranceCents} />

      <MicGate onSample={onSample}>
        {(start, stop) => {
          stopRef.current = stop
          if (phase === 'hazir') {
            return (
              <button
                type="button"
                class="primary"
                disabled={checkFingering === null}
                onClick={() => void begin(start)}
              >
                Başla
              </button>
            )
          }
          if (phase === 'dinliyor') {
            // Mikrofon açılamasa da deneme bitirilebilir; plan takılı kalmaz.
            return (
              <button type="button" class="primary" onClick={() => void finish()}>
                Bitir
              </button>
            )
          }
          return (
            <div class="result" role="status">
              <p class={result?.passed ? 'result-ok' : 'result-bad'}>
                {result?.passed ? 'Geçtin 👏' : 'Süre dolmadı; bir sonraki denemede biraz daha uzun tut.'}
              </p>
              {result?.saved && (
                <button type="button" class="primary" onClick={props.onNext}>
                  {props.nextLabel}
                </button>
              )}
            </div>
          )
        }}
      </MicGate>

      {perde && (
        <div class="tools">
          <button type="button" class="tool" disabled={phase === 'dinliyor'} onClick={() => void listen()}>
            🔊 Doğru sesi dinle
          </button>
        </div>
      )}
      {soundWarn && (
        <p class="notice" role="status">
          {SOUND_WARNING}
        </p>
      )}
    </section>
  )
}
