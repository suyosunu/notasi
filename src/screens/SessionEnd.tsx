import { useEffect, useState } from 'preact/hooks'
import type { DayState } from '../learning/day-session'
import { navigate } from '../router'
import { listSessions } from '../store/db'
import type { SessionRec } from '../store/db'

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
      <button type="button" class="primary" onClick={() => navigate('/')}>
        Ana ekrana dön
      </button>
    </main>
  )
}
