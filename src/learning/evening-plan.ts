import { perdeDersId } from '../content/dersler'
import { NEY_PERDELER, visibleFingering } from '../content/ney-perdeler'
import type { NeyPerde, PerdeId } from '../content/ney-perdeler'
import type { LongToneRec } from '../store/db'
import type { TopicStatus } from './mastery'

export type PerdeStatus = 'kilitli' | 'acik' | 'gecildi'

export interface EveningStep {
  kind: 'ilk-ses' | 'kalibrasyon' | 'uzun-ses'
  perdeId?: PerdeId
  label: string
  tries: number
  /** Adımdan önce okunması gereken ders (`DersKapisi`). Bu alandan önce açılmış oturumlarda yoktur: kapı atlanır. */
  dersId?: string
}

/** "İlk ses" denemeleri bu kimlikle `LongToneRec` olarak saklanır. */
export const ILK_SES_ID = 'ilk-ses'

/** "İlk ses" adımından önce okunan ders. */
const ILK_SES_DERS_ID = 's0:ilk-ses'

const OTHER_PASSED_MAX = 3

/** Daha yüksek kademenin ilk perdesi (Hüseynî) için geçilmesi gereken perde: MEB çekirdek beşlisinin sonu. */
const KADEME_ONKOSULU: PerdeId = 'rast'

/**
 * Bir perde şunların hepsi sağlanınca açılır: aynı kademedeki önceki perde geçilmiş (kademenin
 * ilk perdesi için: ilk kademede önkoşul yok, sonraki kademelerde Rast geçilmiş), nota konusu
 * kilitli değil, parmak şeması doğrulanmış. Geçilmiş (`passed`) kaydı olan perde geçilmiştir.
 */
export function perdeStatuses(
  longTones: LongToneRec[],
  notaStatuses: Record<string, TopicStatus>,
  perdeler: NeyPerde[] = NEY_PERDELER,
): Record<PerdeId, PerdeStatus> {
  const passed = new Set(longTones.filter((r) => r.passed).map((r) => r.perdeId))
  const out = {} as Record<PerdeId, PerdeStatus>
  const prevByKademe = new Map<number, PerdeStatus>()
  const lowestKademe = Math.min(...perdeler.map((p) => p.kademe))
  for (const p of perdeler) {
    let status: PerdeStatus
    if (passed.has(p.id)) {
      status = 'gecildi'
    } else {
      const notaOpen = Object.hasOwn(notaStatuses, p.notaTopicId) && notaStatuses[p.notaTopicId] !== 'kilitli'
      const prev = prevByKademe.get(p.kademe)
      let prevOk: boolean
      if (prev !== undefined) prevOk = prev === 'gecildi'
      else if (p.kademe === lowestKademe) prevOk = true
      else prevOk = out[KADEME_ONKOSULU] === 'gecildi'
      status = prevOk && notaOpen && visibleFingering(p) !== null ? 'acik' : 'kilitli'
    }
    out[p.id] = status
    prevByKademe.set(p.kademe, status)
  }
  return out
}

function ilkSesStep(tries: number): EveningStep {
  return { kind: 'ilk-ses', label: 'İlk ses', tries, dersId: ILK_SES_DERS_ID }
}

/** `ders`: güncel (yeni çalışılan) perdenin adımı o perdenin dersini taşır; ısınma ve tekrar adımları taşımaz. */
function perdeStep(p: NeyPerde, tries: number, ders = false): EveningStep {
  const step: EveningStep = { kind: 'uzun-ses', perdeId: p.id, label: `Uzun ses: ${p.name}`, tries }
  if (ders) step.dersId = perdeDersId(p.id)
  return step
}

export function buildEveningPlan(input: {
  ilkSesPassed: boolean
  calibrated: boolean
  perdeStatus: Record<PerdeId, PerdeStatus>
}): EveningStep[] {
  if (!input.ilkSesPassed) return [ilkSesStep(3)]
  if (!input.calibrated) return [ilkSesStep(1), { kind: 'kalibrasyon', label: 'Kalibrasyon', tries: 1 }]
  const passed = NEY_PERDELER.filter((p) => input.perdeStatus[p.id] === 'gecildi')
  const current = NEY_PERDELER.find((p) => input.perdeStatus[p.id] === 'acik')
  const warmup = passed.at(-1)
  const plan: EveningStep[] = []
  if (warmup) plan.push(perdeStep(warmup, 1))
  if (current) plan.push(perdeStep(current, 3, true))
  // Diğer geçilenler: güncel perdeye en yakın olandan geriye doğru.
  for (const p of passed.slice(0, -1).reverse().slice(0, OTHER_PASSED_MAX)) plan.push(perdeStep(p, 1))
  return plan
}
