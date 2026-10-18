import { useEffect, useState } from 'preact/hooks'
import { NOTA_TOPICS } from '../content/nota-topics'
import type { DayState } from '../learning/day-session'
import { buildEveningPlan } from '../learning/evening-plan'
import type { EveningStep } from '../learning/evening-plan'
import { loadEveningInput } from '../learning/evening-session'
import { currentTopic, topicStatuses } from '../learning/mastery'
import { streakDays } from '../learning/streak'
import { replaceRoute } from '../router'
import { SECTIONS } from '../sections/registry'
import type { SectionDef } from '../sections/registry'
import { needsBackupReminder, shareOrDownloadBackup } from '../store/backup'
import { getOpenSession, getSettings, listAttempts, listSessions, listTopics } from '../store/db'
import { todayLocal } from '../util/date'

interface HomeData {
  greeting: string
  streak: number
  topicTitle: string | null
  progress: { index: number; total: number } | null
  doneToday: boolean
  backupDue: boolean
  hasCompletedSession: boolean
  eveningPlan: EveningStep[]
}

function greetingFor(now: Date): string {
  const h = now.getHours()
  return h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : 'İyi akşamlar'
}

/** `redirect`: onboard olunmamışsa başlangıç, yoklama yapılmamışsa yoklama ekranı. */
async function load(): Promise<HomeData | { redirect: string }> {
  const settings = await getSettings()
  if (!settings.onboarded) return { redirect: '/baslangic' }
  // Yoklama bir kez yapılır; bitince `placementDone` kaydedilir, döngü olmaz.
  if (!settings.placementDone) return { redirect: '/yoklama' }
  const [attempts, topics, sessions, open, eveningInput] = await Promise.all([
    listAttempts(),
    listTopics(),
    listSessions(),
    getOpenSession('gunduz'),
    loadEveningInput(),
  ])
  const now = new Date()
  const today = todayLocal(now)
  const placedOut = new Set(topics.filter((t) => t.placedOut).map((t) => t.id))
  const topic = currentTopic(NOTA_TOPICS, topicStatuses(NOTA_TOPICS, attempts, placedOut))
  const completed = sessions.filter((s) => s.completed)
  const state = open?.date === today ? (open.state as DayState) : null
  return {
    greeting: greetingFor(now),
    streak: streakDays(
      completed.map((s) => s.date),
      today,
    ),
    topicTitle: topic?.title ?? null,
    progress: state ? { index: state.index, total: state.questions.length } : null,
    doneToday: completed.some((s) => s.kind === 'gunduz' && s.date === today),
    backupDue: needsBackupReminder(settings.lastBackupAt, completed.length > 0, now),
    hasCompletedSession: completed.length > 0,
    eveningPlan: buildEveningPlan(eveningInput),
  }
}

function Chip({ section }: { section: SectionDef }) {
  const body = (
    <>
      <span aria-hidden="true">{section.icon}</span>
      <span class="chip-title">{section.title}</span>
      {section.status === 'yakinda' && <small class="chip-soon">yakında</small>}
    </>
  )
  if (section.status === 'aktif' && section.route) {
    return (
      <a class="chip" data-status={section.status} href={`#${section.route}`}>
        {body}
      </a>
    )
  }
  return (
    <span class="chip" data-status={section.status}>
      {body}
    </span>
  )
}

export function Home() {
  const [data, setData] = useState<HomeData | null>(null)
  const [backupDue, setBackupDue] = useState(false)

  useEffect(() => {
    let alive = true
    void load().then((d) => {
      if (!alive) return
      if ('redirect' in d) {
        replaceRoute(d.redirect)
        return
      }
      setData(d)
      setBackupDue(d.backupDue)
    })
    return () => {
      alive = false
    }
  }, [])

  async function backup() {
    try {
      await shareOrDownloadBackup()
      // Paylaşım sayfası kapatılırsa çağrı hatasız döner ama yedek alınmamıştır.
      const { lastBackupAt } = await getSettings()
      setBackupDue(needsBackupReminder(lastBackupAt, data?.hasCompletedSession ?? false, new Date()))
    } catch {
      // Yedek alınamadı: bant görünür kalır, kullanıcı tekrar deneyebilir.
    }
  }

  if (!data) return null

  return (
    <main class="screen">
      <header class="home-head">
        <div>
          <h1>{data.greeting}</h1>
          <p class="muted">{data.streak > 0 ? `${data.streak} gün seri` : 'Bugün başlayalım'}</p>
        </div>
        <a class="head-link" href="#/ayarlar">
          ⚙️ Ayarlar
        </a>
      </header>

      {backupDue && (
        <div class="backup-band" role="status">
          <p>Yedeğinizi alın, telefon verileri silinirse ilerlemeniz kaybolmasın</p>
          <button type="button" class="tool" onClick={() => void backup()}>
            Yedekle
          </button>
        </div>
      )}

      <nav class="cards" aria-label="Çalışma">
        <a class="card card-day" href="#/gunduz">
          <strong>☀️ Masa başı · 10 dk</strong>
          <span>{data.topicTitle ?? 'Tüm konular öğrenildi 🎉'}</span>
          {data.progress && <progress class="card-progress" value={data.progress.index} max={data.progress.total} />}
          {data.doneToday && <span class="card-done">Bugünkü tur tamam ✓</span>}
        </a>
        <a class="card card-night" href="#/aksam">
          <strong>🌙 Akşam neyle</strong>
          <ul class="plan-steps">
            {data.eveningPlan.map((step, i) => (
              <li key={i}>
                <span class="plan-label">{step.label}</span>
                {step.tries > 1 && <span class="muted"> ×{step.tries}</span>}
              </li>
            ))}
          </ul>
        </a>
      </nav>

      <nav class="chips" aria-label="Bölümler">
        {SECTIONS.map((s) => (
          <Chip key={s.id} section={s} />
        ))}
      </nav>
    </main>
  )
}
