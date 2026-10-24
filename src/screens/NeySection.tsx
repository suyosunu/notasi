import { useEffect, useState } from 'preact/hooks'
import { dersById, perdeDersId } from '../content/dersler'
import { ETUTLER } from '../content/etutler'
import { NEY_PERDELER } from '../content/ney-perdeler'
import type { PerdeId } from '../content/ney-perdeler'
import { perdeEtiketi } from '../content/perde-adlari'
import type { PerdeStatus } from '../learning/evening-plan'
import { loadEveningInput } from '../learning/evening-session'
import { neyLevelConfig } from '../learning/long-tone'
import { LongToneTrainer } from '../ney/LongToneTrainer'
import { seconds } from '../util/sure'
import { useNeyLevel } from '../ney/useNeyLevel'
import { DersKapisi } from '../ders/DersKapisi'
import { navigate } from '../router'
import { getSettings, listLongTones } from '../store/db'
import type { Settings } from '../store/db'
import { Calibration } from './Calibration'

const ICONS: Record<PerdeStatus, string> = { kilitli: '🔒', acik: '▶', gecildi: '✓' }
const LABELS: Record<PerdeStatus, string> = { kilitli: 'kilitli', acik: 'açık', gecildi: 'geçildi' }
/** Tek perde sayfasında gösterilen son deneme sayısı. */
const HISTORY_SIZE = 5

/**
 * Ney bölümü: perdeler durumlarıyla; açık ya da geçilmiş perde tek başına çalışılabilir. Dersi olan perdenin
 * yanında 📖 bağlantısı vardır; ders okumak serbest olduğu için kilitli perdede de görünür. Perde listesinin
 * altında etütler: çalınanlar ✓, perdeleri henüz geçilmemiş olanlar soluk (ama kilit yok, hepsi açılır).
 */
export function NeySection() {
  const [statuses, setStatuses] = useState<Record<PerdeId, PerdeStatus> | null>(null)
  const [calinan, setCalinan] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    let alive = true
    void loadEveningInput().then((input) => {
      if (!alive) return
      setStatuses(input.perdeStatus)
      setCalinan(input.calinanEtutler)
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
            const dersId = perdeDersId(p.id)
            const body = (
              <>
                <span class="topic-icon" role="img" aria-label={LABELS[status]}>
                  {ICONS[status]}
                </span>
                <span class="topic-title">{p.name}</span>
                <small class="muted">{perdeEtiketi(p.written)}</small>
              </>
            )
            return (
              <li key={p.id} class="topic-row">
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
                {dersById(dersId) && (
                  <a class="ders-link" href={`#/ders/${encodeURIComponent(dersId)}`} aria-label={`${p.name} dersi`}>
                    📖
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {statuses && (
        <section>
          <h2>Etütler</h2>
          <ul class="topic-list">
            {ETUTLER.map((e) => {
              const calindi = calinan.has(e.id)
              const soluk = !e.perdeler.every((id) => statuses[id] === 'gecildi')
              return (
                <li key={e.id}>
                  <a class="topic" href={`#/etut/${e.id}`} data-soluk={soluk} data-calindi={calindi}>
                    <span class="topic-icon" role="img" aria-label={calindi ? 'çalındı' : 'çalınmadı'}>
                      {calindi ? '✓' : '🎼'}
                    </span>
                    <span class="topic-title">{e.baslik}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </section>
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
  const level = useNeyLevel(perde?.id ?? null, round)
  /** Son denemelerin süreleri (ms), en yeniden eskiye. */
  const [history, setHistory] = useState<number[]>([])
  const [savedCount, setSavedCount] = useState(0)

  useEffect(() => {
    if (!perde) return
    let alive = true
    void listLongTones(perde.id).then((list) => {
      if (alive) setHistory(list.slice(-HISTORY_SIZE).reverse().map((r) => r.durationMs))
    })
    return () => {
      alive = false
    }
  }, [perdeId, savedCount])

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
  if (!settings || !status || level === null) {
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

  // Ders kuralı: perdenin dersi okunmadan alıştırması gelmez (kilitli perdede ve kalibrasyonda kapı yok).
  return (
    <DersKapisi dersId={perdeDersId(perde.id)}>
      <main class="screen evening">
        <header class="day-head">
          <h1>🪈 Uzun ses: {perde.name}</h1>
        </header>
        <LongToneTrainer
          key={round}
          target={{ kind: 'perde', perde }}
          settings={settings}
          cfg={neyLevelConfig(level)}
          nextLabel="Tekrar dene"
          onNext={() => setRound((n) => n + 1)}
          onSaved={() => setSavedCount((n) => n + 1)}
        />
        {history.length > 0 && (
          <p class="muted tone-history">{`Son denemeler: ${history.map(seconds).join(' · ')} sn`}</p>
        )}
        <a class="back" href="#/ney">
          Ney bölümüne dön
        </a>
      </main>
    </DersKapisi>
  )
}
