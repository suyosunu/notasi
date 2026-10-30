import { etutDersleri, perdeDersId, perdeDersleri } from '../content/dersler'
import { ETUTLER } from '../content/etutler'
import { NEY_PERDELER, visibleFingering } from '../content/ney-perdeler'
import type { NeyPerde, PerdeId } from '../content/ney-perdeler'
import type { LongToneRec } from '../store/db'
import type { TopicStatus } from './mastery'

export type PerdeStatus = 'kilitli' | 'acik' | 'gecildi'

export interface EveningStep {
  kind: 'ilk-ses' | 'kalibrasyon' | 'uzun-ses' | 'baspare' | 'etut'
  perdeId?: PerdeId
  /** `kind: 'etut'` adımında çalınacak etüt (`ETUTLER` kimliği). */
  etutId?: string
  label: string
  tries: number
  /** Adımdan önce okunması gereken ders (`DersKapisi`). Bu alandan önce açılmış oturumlarda yoktur: kapı atlanır. */
  dersId?: string
  /**
   * Birden çok dersli adım (Nevâ: önce gösterge dersi, sonra Nevâ dersi; usul etüdü: ölçü, usul girişi, usulün
   * dersi); sırayla okunur. Varsa `dersId`'ye üstündür; bu alandan önce açılmış oturumlarda yoktur, o zaman
   * `dersId` okunur.
   */
  dersIdler?: string[]
}

/** "İlk ses" denemeleri bu kimlikle `LongToneRec` olarak saklanır. */
export const ILK_SES_ID = 'ilk-ses'

/** "İlk ses" adımından önce okunan ders. */
const ILK_SES_DERS_ID = 's0:ilk-ses'

/** Başpâre koy-çek adımından önce okunan ders. */
const BASPARE_DERS_ID = 's0:baspare'

const OTHER_PASSED_MAX = 3

/** Daha yüksek kademenin ilk perdesi (Hüseynî) için geçilmesi gereken perde: MEB çekirdek beşlisinin sonu. */
const KADEME_ONKOSULU: PerdeId = 'rast'

/**
 * Bir perde şunların hepsi sağlanınca açılır: aynı kademedeki önceki perde geçilmiş (kademenin
 * ilk perdesi için: ilk kademede önkoşul yok, sonraki kademelerde Rast geçilmiş), nota konusu
 * kilitli değil, parmak şeması doğrulanmış. Geçilmiş (`passed`) kaydı olan perde geçilmiştir; geçilmemiş de olsa
 * uzun ses kaydı olan perde (açıkken denenmiştir) hiç kilitlenmez.
 */
export function perdeStatuses(
  longTones: LongToneRec[],
  notaStatuses: Record<string, TopicStatus>,
  perdeler: NeyPerde[] = NEY_PERDELER,
): Record<PerdeId, PerdeStatus> {
  const passed = new Set(longTones.filter((r) => r.passed).map((r) => r.perdeId))
  // Kaydı olan perde, bir ara açıldığı için denenmiştir: sıra değişse de bir daha kilitlenmez.
  const denenen = new Set(longTones.map((r) => r.perdeId))
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
      status = denenen.has(p.id) || (prevOk && notaOpen && visibleFingering(p) !== null) ? 'acik' : 'kilitli'
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
  if (ders) {
    step.dersId = perdeDersId(p.id)
    const idler = perdeDersleri(p.id)
    if (idler.length > 1) step.dersIdler = idler
  }
  return step
}

function baspareStep(): EveningStep {
  return { kind: 'baspare', label: 'Başpâre koy-çek', tries: 1, dersId: BASPARE_DERS_ID }
}

/**
 * `ETUTLER` sırasında, bütün perdeleri geçilmiş ve henüz çalınmamış ilk etüt; yoksa adım da yoktur. N seviyeli etüt,
 * kendisinden küçük seviyelerin bütün etütleri çalınınca önerilir: Seviye 2 etütleri (usul, dörtlü, dil) Seviye 1'in,
 * Seviye 3 etütleri (kademe, Nevâ beşlileri, diziler) Seviye 1 ve 2'nin hepsi çalınmadan araya girmez; perdeleri
 * geçilmiş olsa da. Seviye 1 her zaman öneriye açıktır. Ney bölümünde hepsi her zaman açıktır (kilit yok).
 */
function etutStep(perdeStatus: Record<PerdeId, PerdeStatus>, calinan: ReadonlySet<string>): EveningStep | null {
  const altBitti = (seviye: number) => ETUTLER.every((e) => e.seviye >= seviye || calinan.has(e.id))
  const etut = ETUTLER.find(
    (e) => !calinan.has(e.id) && altBitti(e.seviye) && e.perdeler.every((id) => perdeStatus[id] === 'gecildi'),
  )
  if (!etut) return null
  const step: EveningStep = { kind: 'etut', etutId: etut.id, label: `Etüt · ${etut.baslik}`, tries: 1, dersId: etut.dersId }
  // Usul etüdü: önce ölçü ve nefes, sonra usulün giriş ve kendi dersi (`etutDersleri`).
  const idler = etutDersleri(etut)
  if (idler.length > 1) step.dersIdler = idler
  return step
}

export function buildEveningPlan(input: {
  ilkSesPassed: boolean
  calibrated: boolean
  /** Başpâre koy-çek ölçütü geçildi mi (`LongToneRec` `baspare`, `passed`). */
  baspareGecildi: boolean
  /** Çalındı diye işaretlenen etütler (`calinanEtutler`). */
  calinanEtutler: ReadonlySet<string>
  perdeStatus: Record<PerdeId, PerdeStatus>
}): EveningStep[] {
  if (!input.ilkSesPassed) return [ilkSesStep(3)]
  if (!input.calibrated) return [ilkSesStep(1), { kind: 'kalibrasyon', label: 'Kalibrasyon', tries: 1 }]
  const passed = NEY_PERDELER.filter((p) => input.perdeStatus[p.id] === 'gecildi')
  const current = NEY_PERDELER.find((p) => input.perdeStatus[p.id] === 'acik')
  // Isınma: güncel perdeden hemen önceki geçilmiş perde (taşınmış eski kullanıcıda son geçilen perde güncelin
  // ilerisinde olabilir); güncel perde yoksa ya da öncesinde geçilmiş perde yoksa son geçilen.
  const onceki = current ? passed.filter((p) => NEY_PERDELER.indexOf(p) < NEY_PERDELER.indexOf(current)) : []
  const warmup = onceki.at(-1) ?? passed.at(-1)
  const plan: EveningStep[] = []
  if (warmup) plan.push(perdeStep(warmup, 1))
  if (current) plan.push(perdeStep(current, 3, true))
  // Nevâ oturduktan sonra başpâre koy-çek; geçilene dek her akşam, güncel perde adımının hemen ardından.
  if (input.perdeStatus.neva === 'gecildi' && !input.baspareGecildi) plan.push(baspareStep())
  // Perdeleri geçilmiş sıradaki etüt: güncel perde (ve varsa başpâre) adımından sonra, tekrarlardan önce.
  const etut = etutStep(input.perdeStatus, input.calinanEtutler)
  if (etut) plan.push(etut)
  // Diğer geçilenler: güncel perdeye en yakın olandan geriye doğru.
  for (const p of passed.filter((x) => x !== warmup).reverse().slice(0, OTHER_PASSED_MAX)) plan.push(perdeStep(p, 1))
  return plan
}
