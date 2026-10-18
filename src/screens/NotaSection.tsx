import { useEffect, useState } from 'preact/hooks'
import { NOTA_TOPICS } from '../content/nota-topics'
import { topicStatuses } from '../learning/mastery'
import { mixedPool } from '../learning/mixed'
import type { TopicStatus } from '../learning/mastery'
import { navigate } from '../router'
import { listAttempts, listTopics } from '../store/db'

const ICONS: Record<TopicStatus, string> = { kilitli: '🔒', acik: '▶', ogrenildi: '✓' }
const LABELS: Record<TopicStatus, string> = { kilitli: 'kilitli', acik: 'açık', ogrenildi: 'öğrenildi' }

const MIXED_LABEL = '🔀 Karışık antrenman'

/** Öğrenilmiş konulardan karışık tur; henüz öğrenilmiş konu yoksa devre dışı ve açıklamalıdır. */
function MixedCard({ enabled }: { enabled: boolean }) {
  if (enabled) {
    return (
      <a class="topic topic-mixed" href="#/nota/karisik">
        <span class="topic-title">{MIXED_LABEL}</span>
      </a>
    )
  }
  return (
    <div class="mixed-disabled">
      <div class="topic topic-kilitli topic-mixed" aria-disabled="true">
        <span class="topic-title">{MIXED_LABEL}</span>
      </div>
      <p class="muted">İlk konuyu öğrenince açılır.</p>
    </div>
  )
}

export function NotaSection() {
  const [statuses, setStatuses] = useState<Record<string, TopicStatus> | null>(null)

  useEffect(() => {
    let alive = true
    void Promise.all([listAttempts(), listTopics()]).then(([attempts, topics]) => {
      if (!alive) return
      const placedOut = new Set(topics.filter((t) => t.placedOut).map((t) => t.id))
      setStatuses(topicStatuses(NOTA_TOPICS, attempts, placedOut))
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <main class="screen">
      <h1>🎼 Nota</h1>
      <p class="muted">Bir konuya dokunarak 8 soruluk serbest tur başlat.</p>
      {statuses && <MixedCard enabled={mixedPool(NOTA_TOPICS, statuses).length > 0} />}
      {statuses && (
        <ul class="topic-list">
          {NOTA_TOPICS.map((t) => {
            const status = statuses[t.id] ?? 'kilitli'
            const body = (
              <>
                <span class="topic-icon" role="img" aria-label={LABELS[status]}>
                  {ICONS[status]}
                </span>
                <span class="topic-title">{t.title}</span>
              </>
            )
            return (
              <li key={t.id}>
                {status === 'kilitli' ? (
                  <div class="topic topic-kilitli" data-status={status} aria-disabled="true">
                    {body}
                  </div>
                ) : (
                  <button
                    type="button"
                    class={`topic topic-${status}`}
                    data-status={status}
                    onClick={() => navigate(`/nota/${t.id}`)}
                  >
                    {body}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <a class="back" href="#/">
        Ana ekrana dön
      </a>
    </main>
  )
}
