import { useEffect, useRef, useState } from 'preact/hooks'
import type { PitchSample } from '../audio/mic'
import { NEY_PERDELER, visibleFingering } from '../content/ney-perdeler'
import { DersKapisi } from '../ders/DersKapisi'
import {
  BASPARE_DENEME,
  BASPARE_GECME,
  BASPARE_ID,
  BASPARE_TOLERANS,
  baspareSonuc,
  baspareSonucMetni,
  initialBaspare,
  stepBaspare,
} from '../learning/baspare'
import type { BaspareSonucu, BaspareState } from '../learning/baspare'
import { Smoother } from '../learning/smoothing'
import { soundingHz } from '../music/ahenk'
import { centsBetween } from '../music/pitch'
import { FingeringDiagram } from '../ney/Fingering'
import { seconds } from '../util/sure'
import { MicGate } from '../ney/MicGate'
import { navigate } from '../router'
import { addLongTone, getSettings } from '../store/db'
import type { Settings } from '../store/db'
import { Calibration } from './Calibration'

const NEVA = NEY_PERDELER.find((p) => p.id === 'neva')!

type Phase = 'hazir' | 'dinliyor' | 'bitti'

const DURUM_METNI: Record<BaspareState['faz'], string> = {
  'sessizlik-bekle': 'Neyi dudağından çek ve sessiz kal.',
  hazir: 'Şimdi neyi koy ve üfle.',
  ariyor: 'Nevâ’yı bulması ölçülüyor…',
}

/**
 * Tek bir başpâre koy-çek turu: mikrofonu dokunuşla açar, her "sessizlik → ses" geçişini bir deneme sayar ve
 * sesin kararlı Nevâ'ya ne kadar sürede oturduğunu ölçer. 10 denemede ya da "Bitir"le biter ve bir `LongToneRec`
 * yazar. Yeni tur için çağıran bileşeni `key` ile yeniden kurar.
 */
export function BaspareTur(props: {
  settings: Settings
  nextLabel: string
  onNext: () => void
  /** Tur kaydı yazılınca çağrılır. */
  onSaved?: () => void
}) {
  const { settings } = props
  const targetHz = soundingHz(NEVA.written, settings.tuning)
  const fingering = visibleFingering(NEVA)

  const [phase, setPhase] = useState<Phase>('hazir')
  const [view, setView] = useState<BaspareState>(initialBaspare)
  /** `kayit`: yazılıyor / yazıldı / yazılamadı; yazılamasa da sonraki adım açılır, akış takılmaz. */
  const [result, setResult] = useState<{ sonuc: BaspareSonucu; kayit: 'yaziliyor' | 'yazildi' | 'hata' } | null>(null)

  const phaseRef = useRef<Phase>('hazir')
  const stopRef = useRef<() => void>(() => undefined)
  const mountedRef = useRef(true)
  const smootherRef = useRef(new Smoother())
  const stateRef = useRef<BaspareState>(initialBaspare())

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  async function finish() {
    if (phaseRef.current !== 'dinliyor') return
    phaseRef.current = 'bitti'
    setPhase('bitti')
    stopRef.current()
    const sonuc = baspareSonuc(stateRef.current)
    setResult({ sonuc, kayit: 'yaziliyor' })
    try {
      await addLongTone({
        perdeId: BASPARE_ID,
        durationMs: sonuc.ortancaMs ?? 0,
        passed: sonuc.gecti,
        toleranceCents: BASPARE_TOLERANS,
      })
    } catch {
      if (mountedRef.current) setResult({ sonuc, kayit: 'hata' })
      return
    }
    if (!mountedRef.current) return
    setResult({ sonuc, kayit: 'yazildi' })
    props.onSaved?.()
  }

  function onSample(s: PitchSample) {
    if (phaseRef.current !== 'dinliyor') return
    const hz = smootherRef.current.push(s.hz)
    const cents = hz === null ? null : centsBetween(hz, targetHz)
    const next = stepBaspare(stateRef.current, { t: s.t, cents })
    if (next === stateRef.current) return
    stateRef.current = next
    setView(next)
    if (next.denemeler.length >= BASPARE_DENEME) void finish()
  }

  async function begin(start: () => Promise<void>) {
    if (phaseRef.current !== 'hazir') return
    smootherRef.current = new Smoother()
    stateRef.current = initialBaspare()
    setView(stateRef.current)
    phaseRef.current = 'dinliyor'
    setPhase('dinliyor')
    await start()
  }

  const son = view.denemeler.at(-1)
  // Deneme sayısı yalnızca sessizlikten sonraki ses başlangıcında artar: biten + süren.
  const baslayan = view.denemeler.length + (view.faz === 'ariyor' ? 1 : 0)

  return (
    <section class="tone">
      <div class="tone-perde">
        {fingering && <FingeringDiagram fingering={fingering} />}
        <p class="tone-tip">
          Neyi dudağından çek, sonra koy ve üfle. Nevâ’nın aramadan, hemen çıkması için dudağını ve neyin açısını
          oynatma.
        </p>
      </div>

      <p class="tone-time">{`Deneme ${baslayan}/${BASPARE_DENEME}`}</p>
      {son !== undefined && (
        <p class="muted baspare-son">{son === null ? 'Son deneme: bulunamadı' : `Son deneme: ${seconds(son)} sn`}</p>
      )}
      {phase === 'dinliyor' && (
        <p class="muted baspare-durum" role="status">
          {DURUM_METNI[view.faz]}
        </p>
      )}

      {phase === 'bitti' ? (
        // Tur bitince MicGate hiç çizilmez: hata uyarısı ve kendi "Tekrar dene"si kalmaz, mikrofon yeniden açılamaz.
        <div class="result" role="status">
          <p class={result?.sonuc.gecti ? 'result-ok' : 'result-bad'}>
            {result?.sonuc.gecti ? 'Geçtin 👏' : `Hedef: ${BASPARE_DENEME} denemenin en az ${BASPARE_GECME}’inde anında.`}
          </p>
          {result && <p>{baspareSonucMetni(result.sonuc)}</p>}
          {result?.sonuc.ortancaMs != null && <p class="muted">{`Ortanca süre: ${seconds(result.sonuc.ortancaMs)} sn`}</p>}
          {result?.kayit === 'hata' && <p class="notice">Sonuç kaydedilemedi.</p>}
          {(result?.kayit === 'yazildi' || result?.kayit === 'hata') && (
            <button type="button" class="primary" onClick={props.onNext}>
              {props.nextLabel}
            </button>
          )}
        </div>
      ) : (
        <MicGate onSample={onSample}>
          {(start, stop) => {
            stopRef.current = stop
            if (phase === 'hazir') {
              return (
                <button type="button" class="primary" onClick={() => void begin(start)}>
                  Başla
                </button>
              )
            }
            // Mikrofon açılamasa ya da hiç ses gelmese de tur bitirilebilir; ekran takılı kalmaz.
            return (
              <button type="button" class="primary" onClick={() => void finish()}>
                Bitir
              </button>
            )
          }}
        </MicGate>
      )}
    </section>
  )
}

/** `/hazirlik/baspare`: ders kapısı + (gerekirse) kalibrasyon + başpâre koy-çek turu. */
export function BaspareAlistirma() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [round, setRound] = useState(0)

  useEffect(() => {
    let alive = true
    void getSettings().then((cfg) => {
      if (alive) setSettings(cfg)
    })
    return () => {
      alive = false
    }
  }, [])

  if (!settings) {
    return (
      <main class="screen">
        <p class="muted">Yükleniyor…</p>
      </main>
    )
  }
  // Hedef Nevâ ahenge bağlıdır: kalibrasyon yapılmadıysa önce o (ders kapısı kalibrasyondan sonra gelir).
  if (!settings.calibrated) {
    return <Calibration onDone={() => void getSettings().then(setSettings)} onCancel={() => navigate('/ogren')} />
  }

  return (
    <DersKapisi dersId="s0:baspare" geri={{ href: '#/ogren', label: 'Öğren bölümüne dön' }}>
      <main class="screen evening">
        <header class="day-head">
          <h1>🪈 Başpâreyi koy, çek</h1>
        </header>
        <BaspareTur key={round} settings={settings} nextLabel="Tekrar dene" onNext={() => setRound((n) => n + 1)} />
        <a class="back" href="#/ogren">
          Öğren bölümüne dön
        </a>
      </main>
    </DersKapisi>
  )
}
