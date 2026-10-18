import { useEffect, useState } from 'preact/hooks'
import { NEY_PERDELER } from '../content/ney-perdeler'
import type { PerdeId } from '../content/ney-perdeler'
import type { PerdeStatus } from '../learning/evening-plan'
import { loadEveningInput } from '../learning/evening-session'
import { neyLevelConfig } from '../learning/long-tone'
import { SOLFEJ } from '../music/pitch'
import { LongToneTrainer } from '../ney/LongToneTrainer'
import { usePassCount } from '../ney/usePassCount'
import { navigate } from '../router'
import { getSettings } from '../store/db'
import type { Settings } from '../store/db'
import { Calibration } from './Calibration'

const ICONS: Record<PerdeStatus, string> = { kilitli: '🔒', acik: '▶', gecildi: '✓' }
const LABELS: Record<PerdeStatus, string> = { kilitli: 'kilitli', acik: 'açık', gecildi: 'geçildi' }

/** Ney bölümü: perdeler durumlarıyla; açık ya da geçilmiş perde tek başına çalışılabilir. */
export function NeySection() {
  const [statuses, setStatuses] = useState<Record<PerdeId, PerdeStatus> | null>(null)

  useEffect(() => {
    let alive = true
    void loadEveningInput().then((input) => {
      if (alive) setStatuses(input.perdeStatus)
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <main class="screen">
      <h1>🪈 Ney</h1>
      <p class="muted">Bir perdeye dokunarak uzun ses çalış.</p>
      {statuses && (
        <ul class="topic-list">
          {NEY_PERDELER.map((p) => {
            const status = statuses[p.id]
            const body = (
              <>
                <span class="topic-icon" role="img" aria-label={LABELS[status]}>
                  {ICONS[status]}
                </span>
                <span class="topic-title">{p.name}</span>
                <small class="muted">{SOLFEJ[p.written.step]}</small>
              </>
            )
            return (
              <li key={p.id}>
                {status === 'kilitli' ? (
                  <div class="topic topic-kilitli" data-status={status} aria-disabled="true">
                    {body}
                  </div>
                ) : (
                  <button
                    type="button"
                    class={`topic topic-${status}`}
                    data-status={status}
                    onClick={() => navigate(`/ney/${p.id}`)}
                  >
                    {body}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <div class="links">
        <a class="back" href="#/kalibrasyon">
          Yeniden kalibre et
        </a>
        <a class="back" href="#/">
          Ana ekrana dön
        </a>
      </div>
    </main>
  )
}

/** Tek perde uzun ses alıştırması: oturum kaydı yok, her deneme yine `LongToneRec` yazar. */
export function NeyPerdePractice({ perdeId }: { perdeId: string }) {
  const perde = NEY_PERDELER.find((p) => p.id === perdeId)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [status, setStatus] = useState<PerdeStatus | null>(null)
  const [round, setRound] = useState(0)
  const passCount = usePassCount(perde?.id ?? null, round)

  useEffect(() => {
    let alive = true
    void Promise.all([getSettings(), loadEveningInput()]).then(([cfg, input]) => {
      if (!alive || !perde) return
      setSettings(cfg)
      setStatus(input.perdeStatus[perde.id])
    })
    return () => {
      alive = false
    }
  }, [perdeId])

  if (!perde) {
    return (
      <main class="screen">
        <p class="muted">Perde bulunamadı.</p>
        <a class="back" href="#/ney">
          Ney bölümüne dön
        </a>
      </main>
    )
  }
  if (!settings || !status || passCount === null) {
    return (
      <main class="screen">
        <p class="muted">Yükleniyor…</p>
      </main>
    )
  }
  if (status === 'kilitli') {
    return (
      <main class="screen">
        <h1>🪈 {perde.name}</h1>
        <p class="muted">Bu perde henüz açılmadı.</p>
        <a class="back" href="#/ney">
          Ney bölümüne dön
        </a>
      </main>
    )
  }
  if (!settings.calibrated) {
    return <Calibration onDone={() => void getSettings().then(setSettings)} onCancel={() => navigate('/ney')} />
  }

  return (
    <main class="screen evening">
      <header class="day-head">
        <h1>🪈 Uzun ses: {perde.name}</h1>
      </header>
      <LongToneTrainer
        key={round}
        target={{ kind: 'perde', perde }}
        settings={settings}
        cfg={neyLevelConfig(passCount)}
        nextLabel="Tekrar dene"
        onNext={() => setRound((n) => n + 1)}
      />
      <a class="back" href="#/ney">
        Ney bölümüne dön
      </a>
    </main>
  )
}
