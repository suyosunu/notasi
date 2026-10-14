import { NOTA_TOPICS } from '../content/nota-topics'
import type { PerdeId } from '../content/ney-perdeler'
import { getOpenSession, getSettings, listAttempts, listLongTones, listTopics, saveSession } from '../store/db'
import type { SessionRec } from '../store/db'
import { todayLocal } from '../util/date'
import { finishSession } from './day-session'
import { buildEveningPlan, ILK_SES_ID, perdeStatuses } from './evening-plan'
import type { EveningStep, PerdeStatus } from './evening-plan'
import { topicStatuses } from './mastery'

export interface EveningState {
  steps: EveningStep[]
  stepIndex: number
  /** Geçerli adımdaki 0 tabanlı deneme sırası. */
  tryIndex: number
}

export interface EveningInput {
  ilkSesPassed: boolean
  calibrated: boolean
  perdeStatus: Record<PerdeId, PerdeStatus>
}

/** Akşam planının ve Ney bölümünün girdisini cihazdaki kayıtlardan hesaplar. */
export async function loadEveningInput(): Promise<EveningInput> {
  const [settings, longTones, attempts, topics] = await Promise.all([
    getSettings(),
    listLongTones(),
    listAttempts(),
    listTopics(),
  ])
  const placedOut = new Set(topics.filter((t) => t.placedOut).map((t) => t.id))
  return {
    ilkSesPassed: longTones.some((r) => r.perdeId === ILK_SES_ID && r.passed),
    calibrated: settings.calibrated,
    perdeStatus: perdeStatuses(longTones, topicStatuses(NOTA_TOPICS, attempts, placedOut)),
  }
}

async function startEveningSession(now: Date): Promise<SessionRec> {
  const steps = buildEveningPlan(await loadEveningInput())
  const state: EveningState = { steps, stepIndex: 0, tryIndex: 0 }
  const session: SessionRec = {
    id: crypto.randomUUID(),
    kind: 'aksam',
    date: todayLocal(now),
    startedAt: now.toISOString(),
    completed: false,
    elapsedMs: 0,
    state,
  }
  await saveSession(session)
  return session
}

/** Bugünün açık akşam oturumunu döner; önceki günden kalanı tamamlanmamış diye kapatıp yenisini açar. */
export async function loadOrStartEveningSession(now: Date): Promise<SessionRec> {
  const open = await getOpenSession('aksam')
  if (open) {
    if (open.date === todayLocal(now)) return open
    await finishSession(open, false)
  }
  return startEveningSession(now)
}

/** Bir sonraki denemeye (adımın denemeleri bittiyse sonraki adıma) geçer. */
export function nextTry(state: EveningState): EveningState {
  const step = state.steps[state.stepIndex]
  if (step && state.tryIndex + 1 < step.tries) return { ...state, tryIndex: state.tryIndex + 1 }
  return { ...state, stepIndex: state.stepIndex + 1, tryIndex: 0 }
}

export function isPlanDone(state: EveningState): boolean {
  return state.stepIndex >= state.steps.length
}

/** İlerlemeyi kaydeder; plan bittiyse oturumu tamamlanmış olarak kapatır. */
export async function saveEveningProgress(s: SessionRec, state: EveningState): Promise<SessionRec> {
  const next: SessionRec = { ...s, state }
  if (isPlanDone(state)) return finishSession(next, true)
  await saveSession(next)
  return next
}
