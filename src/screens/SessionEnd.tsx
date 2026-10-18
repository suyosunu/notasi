import { useEffect, useRef, useState } from 'preact/hooks'
import type { DayState } from '../learning/day-session'
import { adjustCount } from '../learning/feedback'
import type { Feedback } from '../learning/feedback'
import { navigate } from '../router'
import { getSettings, listSessions, saveSession, saveSettings } from '../store/db'
import type { SessionRec } from '../store/db'

const CHOICES: ReadonlyArray<{ value: Feedback; label: string }> = [
  { value: 'kolay', label: 'Kolay' },
  { value: 'tam', label: 'Tam kararında' },
  { value: 'zor', label: 'Zor' },
]

function latestEnded(list: SessionRec[]): SessionRec | null {
  let best: SessionRec | null = null
  for (const s of list) {
    if (!s.endedAt) continue
    if (!best || s.endedAt > (best.endedAt ?? '')) best = s
  }
  return best
}

export function SessionEnd() {
  const [loaded, setLoaded] = useState(false)
  const [session, setSession] = useState<SessionRec | null>(null)
  const saving = useRef(false)

  useEffect(() => {
    let alive = true
    void listSessions().then((list) => {
      if (!alive) return
      setSession(latestEnded(list))
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [])

  async function choose(fb: Feedback) {
    if (saving.current || !session || session.feedback) return
    saving.current = true
    try {
      const next: SessionRec = { ...session, feedback: fb }
      await saveSession(next)
      // Yalnızca gündüz turu ertesi günün soru sayısını ayarlar; akşam seçimi sadece kaydedilir.
      if (session.kind === 'gunduz') {
        const { dailyQuestionCount } = await getSettings()
        await saveSettings({ dailyQuestionCount: adjustCount(dailyQuestionCount, fb) })
      }
      setSession(next)
    } catch {
      // Kaydedilemedi: seçenekler açık kalır, kullanıcı yeniden dokunabilir.
    } finally {
      saving.current = false
    }
  }

  if (!loaded) return null

  const answers = session?.kind === 'gunduz' ? (session.state as DayState | undefined)?.answers : undefined
  const correct = answers?.filter((a) => a.correct).length ?? 0

  return (
    <main class="screen">
      <h1>{answers ? 'Bugünlük bu kadar 👏' : 'Oturum sonu'}</h1>
      {answers && (
        <p class="score">
          {correct}/{answers.length} doğru
        </p>
      )}
      {session?.completed && (
        <section class="feedback" aria-labelledby="feedback-q">
          <h2 id="feedback-q">Bugün nasıldı?</h2>
          <div class="feedback-options">
            {CHOICES.map((c) => (
              <button
                key={c.value}
                type="button"
                class={`option${session.feedback === c.value ? ' option-chosen' : ''}`}
                aria-pressed={session.feedback === c.value}
                disabled={session.feedback !== undefined}
                onClick={() => void choose(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
          {session.feedback && (
            <p class="muted" role="status">
              {session.kind === 'gunduz' ? 'Teşekkürler, yarınki tur buna göre ayarlanacak.' : 'Teşekkürler.'}
            </p>
          )}
        </section>
      )}
      <button type="button" class="primary" onClick={() => navigate('/')}>
        Ana ekrana dön
      </button>
    </main>
  )
}
