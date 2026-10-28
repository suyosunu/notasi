import { NOTA_TOPICS } from '../content/nota-topics'
import type { Hedef, Seviye } from '../content/seviyeler'
import { getSettings, listAttempts, listLongTones, listTopics } from '../store/db'
import type { LongToneRec } from '../store/db'
import { seconds } from '../util/sure'
import { BASPARE_ID } from './baspare'
import { ILK_SES_ID } from './evening-plan'
import { topicStatuses } from './mastery'
import type { TopicStatus } from './mastery'

export interface IlerlemeGirdisi {
  okunanDersler: ReadonlySet<string>
  onaylar: ReadonlySet<string>
  calinanEtutler: ReadonlySet<string>
  vurulanUsuller: ReadonlySet<string>
  longTones: LongToneRec[]
  notaStatuses: Record<string, TopicStatus>
}

/** `ilerleme`: "7/10" ya da "en iyi 6,2 sn". */
export interface HedefDurumu {
  tamam: boolean
  ilerleme?: string
}

function sayim(adet: number, toplam: number): HedefDurumu {
  return { tamam: adet === toplam, ilerleme: `${adet}/${toplam}` }
}

function hedefDurumu(h: Hedef, g: IlerlemeGirdisi): HedefDurumu {
  const o = h.olcut
  switch (o.tur) {
    case 'ders':
      return { tamam: g.okunanDersler.has(o.dersId) }
    case 'onay':
      return { tamam: g.onaylar.has(h.id) }
    case 'ilk-ses':
      return { tamam: g.longTones.some((r) => r.perdeId === ILK_SES_ID && r.passed) }
    case 'baspare':
      return { tamam: g.longTones.some((r) => r.perdeId === BASPARE_ID && r.passed) }
    case 'uzun-ses': {
      // Yalnız geçen ve tolerans payı hedeften geniş olmayan (ör. ±25 değil) kayıtlar bu hedefe sayılır.
      const uygun = g.longTones.filter((r) => r.perdeId === o.perdeId && r.passed && r.toleranceCents <= o.cent)
      const tamam = uygun.some((r) => r.durationMs >= o.ms)
      if (uygun.length === 0) return { tamam }
      return { tamam, ilerleme: `en iyi ${seconds(Math.max(...uygun.map((r) => r.durationMs)))} sn` }
    }
    case 'konular':
      return sayim(o.topicIds.filter((id) => g.notaStatuses[id] === 'ogrenildi').length, o.topicIds.length)
    case 'etutler':
      return sayim(o.etutIds.filter((id) => g.calinanEtutler.has(id)).length, o.etutIds.length)
    case 'usul-vurma':
      return { tamam: g.vurulanUsuller.has(o.usulId) }
  }
}

/** Her hedefin (kimliğine göre) durumu. */
export function hedefDurumlari(seviyeler: Seviye[], g: IlerlemeGirdisi): Record<string, HedefDurumu> {
  const out: Record<string, HedefDurumu> = {}
  for (const s of seviyeler) for (const h of s.hedefler) out[h.id] = hedefDurumu(h, g)
  return out
}

/**
 * Hedefi olan ve en az bir hedefi eksik ilk seviye. Hepsi tamamsa hedefi olan son seviyenin bir sonrakisi
 * (son seviyeyi aşmaz).
 */
export function mevcutSeviye(seviyeler: Seviye[], d: Record<string, HedefDurumu>): Seviye {
  const eksik = seviyeler.find((s) => s.hedefler.some((h) => !d[h.id]?.tamam))
  if (eksik) return eksik
  let son = -1
  seviyeler.forEach((s, i) => {
    if (s.hedefler.length > 0) son = i
  })
  return seviyeler[Math.min(son + 1, seviyeler.length - 1)]!
}

/** Seviyenin ilk eksik hedefi; yoksa `null`. */
export function siradakiHedef(s: Seviye, d: Record<string, HedefDurumu>): Hedef | null {
  return s.hedefler.find((h) => !d[h.id]?.tamam) ?? null
}

/** Yolum ve ana ekranın girdisini cihazdaki kayıtlardan okur. */
export async function loadIlerleme(): Promise<IlerlemeGirdisi> {
  const [settings, longTones, attempts, topics] = await Promise.all([
    getSettings(),
    listLongTones(),
    listAttempts(),
    listTopics(),
  ])
  const placedOut = new Set(topics.filter((t) => t.placedOut).map((t) => t.id))
  return {
    okunanDersler: new Set(settings.okunanDersler ?? []),
    onaylar: new Set(settings.onaylananHedefler ?? []),
    calinanEtutler: new Set(settings.calinanEtutler ?? []),
    vurulanUsuller: new Set(settings.vurulanUsuller ?? []),
    longTones,
    notaStatuses: topicStatuses(NOTA_TOPICS, attempts, placedOut),
  }
}
