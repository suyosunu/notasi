import { describe, expect, it } from 'vitest'
import { NEY_PERDELER } from '../content/ney-perdeler'
import type { PerdeId } from '../content/ney-perdeler'
import type { LongToneRec } from '../store/db'
import { buildEveningPlan, perdeStatuses } from './evening-plan'
import type { PerdeStatus } from './evening-plan'
import type { TopicStatus } from './mastery'

function tone(perdeId: string, passed: boolean): LongToneRec {
  return { id: crypto.randomUUID(), perdeId, durationMs: 4000, passed, toleranceCents: 25, at: new Date().toISOString() }
}

const NOTA_1_OPEN: Record<string, TopicStatus> = { 'nota-1': 'acik', 'sure-1': 'kilitli', 'nota-2': 'kilitli' }
const NOTA_2_OPEN: Record<string, TopicStatus> = { 'nota-1': 'ogrenildi', 'sure-1': 'ogrenildi', 'nota-2': 'acik' }

function statuses(over: Partial<Record<PerdeId, PerdeStatus>>): Record<PerdeId, PerdeStatus> {
  const all = Object.fromEntries(NEY_PERDELER.map((p) => [p.id, 'kilitli'])) as Record<PerdeId, PerdeStatus>
  return { ...all, ...over }
}

/** Her nota konusu açık, `kilitli` verilenler dışında. */
function topics(locked: string[] = []): Record<string, TopicStatus> {
  const out: Record<string, TopicStatus> = {}
  for (const id of ['nota-1', 'nota-2', 'perde-2', 'perde-3', 'perde-4']) out[id] = locked.includes(id) ? 'kilitli' : 'acik'
  return out
}

describe('perdeStatuses', () => {
  it('hiç kayıt yokken yalnızca Nevâ açıktır', () => {
    expect(perdeStatuses([], NOTA_1_OPEN)).toEqual(statuses({ neva: 'acik' }))
  })

  it('Nevâ geçilmiş ve nota-1 açıkken Çârgâh açık olur', () => {
    const s = perdeStatuses([tone('neva', false), tone('neva', true)], NOTA_1_OPEN)
    expect(s.neva).toBe('gecildi')
    expect(s.cargah).toBe('acik')
    expect(s.buselik).toBe('kilitli')
  })

  it('geçilmemiş denemeler perdeyi geçilmiş saymaz', () => {
    const s = perdeStatuses([tone('neva', false)], NOTA_1_OPEN)
    expect(s.neva).toBe('acik')
    expect(s.cargah).toBe('kilitli')
  })

  it('nota-2 kilitliyken Dügâh kilitli kalır', () => {
    const passed = [tone('neva', true), tone('cargah', true), tone('buselik', true)]
    expect(perdeStatuses(passed, NOTA_1_OPEN).dugah).toBe('kilitli')
    expect(perdeStatuses(passed, NOTA_2_OPEN).dugah).toBe('acik')
  })

  it('nota konusu durumu bilinmiyorsa kilitli sayılır', () => {
    expect(perdeStatuses([], {}).neva).toBe('kilitli')
  })

  it('doğrulanmamış şemalı perde kilitli kalır', () => {
    const perdeler = NEY_PERDELER.map((p) => (p.id === 'cargah' ? { ...p, verified: false } : p))
    const s = perdeStatuses([tone('neva', true)], NOTA_1_OPEN, perdeler)
    expect(s.cargah).toBe('kilitli')
    expect(s.buselik).toBe('kilitli')
  })

  it('Rast geçilince Hüseynî, perde-2 kilitliyse kilitli kalır; açıksa hemen açılır', () => {
    const passed = ['neva', 'cargah', 'buselik', 'dugah', 'rast'].map((id) => tone(id, true))
    expect(perdeStatuses(passed, topics(['perde-2'])).huseyni).toBe('kilitli')
    expect(perdeStatuses(passed, topics()).huseyni).toBe('acik')
  })

  it('yeni perdeler nota konusu sırasıyla ve kendi konusuna bağlı açılır', () => {
    const upTo = (ids: string[]) => ids.map((id) => tone(id, true))
    const base = ['neva', 'cargah', 'buselik', 'dugah', 'rast']
    // perde-2: Hüseynî, Acem, Gerdâniye, Muhayyer
    const p2 = [...base, 'huseyni', 'acem', 'gerdaniye', 'muhayyer']
    expect(perdeStatuses(upTo([...base, 'huseyni']), topics()).acem).toBe('acik')
    expect(perdeStatuses(upTo([...base, 'huseyni', 'acem']), topics()).gerdaniye).toBe('acik')
    expect(perdeStatuses(upTo([...base, 'huseyni', 'acem', 'gerdaniye']), topics()).muhayyer).toBe('acik')
    // perde-3: Segâh, Kürdî, Dik Kürdî
    expect(perdeStatuses(upTo(p2), topics(['perde-3'])).segah).toBe('kilitli')
    expect(perdeStatuses(upTo(p2), topics()).segah).toBe('acik')
    expect(perdeStatuses(upTo([...p2, 'segah']), topics()).kurdi).toBe('acik')
    expect(perdeStatuses(upTo([...p2, 'segah', 'kurdi']), topics())['dik-kurdi']).toBe('acik')
    // perde-4: Nim Hicaz, Eviç
    const p3 = [...p2, 'segah', 'kurdi', 'dik-kurdi']
    expect(perdeStatuses(upTo(p3), topics(['perde-4']))['nim-hicaz']).toBe('kilitli')
    expect(perdeStatuses(upTo(p3), topics())['nim-hicaz']).toBe('acik')
    expect(perdeStatuses(upTo([...p3, 'nim-hicaz']), topics()).evic).toBe('acik')
    // Önceki (aynı kademedeki) geçilmeden sonraki açılmaz.
    expect(perdeStatuses(upTo(['neva', 'cargah', 'buselik', 'dugah']), topics()).segah).toBe('kilitli')
  })

  it('Segâh, Rast geçilip perde-3 açılınca; Muhayyer/Hüseynî geçilmese de açılır', () => {
    const base = ['neva', 'cargah', 'buselik', 'dugah', 'rast'].map((id) => tone(id, true))
    const s = perdeStatuses(base, topics())
    expect(s.segah).toBe('acik')
    expect(s.huseyni).toBe('acik')
    expect(perdeStatuses(base, topics(['perde-3'])).segah).toBe('kilitli')
  })

  it('2. kademe zinciri: Segâh → Kürdî → Dik Kürdî → Nim Hicaz', () => {
    const upTo = (ids: string[]) => ids.map((id) => tone(id, true))
    const base = ['neva', 'cargah', 'buselik', 'dugah', 'rast']
    expect(perdeStatuses(upTo([...base, 'segah', 'kurdi', 'dik-kurdi']), topics())['nim-hicaz']).toBe('acik')
    expect(perdeStatuses(upTo([...base, 'segah', 'kurdi']), topics())['nim-hicaz']).toBe('kilitli')
  })

  it('Hüseynî hâlâ Rast geçilmesini ve perde-2 açık olmasını ister', () => {
    const noRast = ['neva', 'cargah', 'buselik', 'dugah'].map((id) => tone(id, true))
    expect(perdeStatuses(noRast, topics()).huseyni).toBe('kilitli')
    const withRast = [...noRast, tone('rast', true)]
    expect(perdeStatuses(withRast, topics(['perde-2'])).huseyni).toBe('kilitli')
    expect(perdeStatuses(withRast, topics()).huseyni).toBe('acik')
  })

  it('Eviç, Muhayyer geçilmesini ve perde-4 açık olmasını ister; Nim Hicaz geçilmesi yetmez', () => {
    const upTo = (ids: string[]) => ids.map((id) => tone(id, true))
    const base = ['neva', 'cargah', 'buselik', 'dugah', 'rast']
    const k3 = ['huseyni', 'acem', 'gerdaniye']
    expect(perdeStatuses(upTo([...base, ...k3, 'muhayyer']), topics()).evic).toBe('acik')
    expect(perdeStatuses(upTo([...base, ...k3, 'muhayyer']), topics(['perde-4'])).evic).toBe('kilitli')
    expect(perdeStatuses(upTo([...base, ...k3]), topics()).evic).toBe('kilitli')
    expect(perdeStatuses(upTo([...base, 'segah', 'kurdi', 'dik-kurdi', 'nim-hicaz']), topics()).evic).toBe('kilitli')
  })

  it('ilk-ses kayıtları perde durumunu etkilemez', () => {
    expect(perdeStatuses([tone('ilk-ses', true)], NOTA_1_OPEN)).toEqual(statuses({ neva: 'acik' }))
  })
})

describe('buildEveningPlan', () => {
  it('ilk ses geçilmemişse plan yalnızca 3 ilk ses denemesidir', () => {
    const plan = buildEveningPlan({ ilkSesPassed: false, calibrated: true, perdeStatus: statuses({ neva: 'acik' }) })
    expect(plan).toEqual([{ kind: 'ilk-ses', label: 'İlk ses', tries: 3 }])
  })

  it('kalibre değilse plan kalibrasyon adımını içerir', () => {
    const plan = buildEveningPlan({ ilkSesPassed: true, calibrated: false, perdeStatus: statuses({ neva: 'acik' }) })
    expect(plan).toEqual([
      { kind: 'ilk-ses', label: 'İlk ses', tries: 1 },
      { kind: 'kalibrasyon', label: 'Kalibrasyon', tries: 1 },
    ])
  })

  it('henüz geçilen perde yoksa güncel açık perde ×3', () => {
    const plan = buildEveningPlan({ ilkSesPassed: true, calibrated: true, perdeStatus: statuses({ neva: 'acik' }) })
    expect(plan).toEqual([{ kind: 'uzun-ses', perdeId: 'neva', label: 'Uzun ses: Nevâ', tries: 3 }])
  })

  it('ısınma (son geçilen) ×1, açık perde ×3, diğer geçilenler ×1 (en fazla 3)', () => {
    const plan = buildEveningPlan({
      ilkSesPassed: true,
      calibrated: true,
      perdeStatus: statuses({ neva: 'gecildi', cargah: 'gecildi', buselik: 'gecildi', dugah: 'gecildi', rast: 'acik' }),
    })
    expect(plan.map((s) => [s.perdeId, s.tries])).toEqual([
      ['dugah', 1],
      ['rast', 3],
      ['buselik', 1],
      ['cargah', 1],
      ['neva', 1],
    ])
    expect(plan.every((s) => s.kind === 'uzun-ses')).toBe(true)
    expect(plan[1]!.label).toBe('Uzun ses: Rast')
  })

  it('tek geçilen perde yalnızca ısınmada yer alır', () => {
    const plan = buildEveningPlan({
      ilkSesPassed: true,
      calibrated: true,
      perdeStatus: statuses({ neva: 'gecildi', cargah: 'acik' }),
    })
    expect(plan.map((s) => s.label)).toEqual(['Uzun ses: Nevâ', 'Uzun ses: Çârgâh'])
  })

  it('açık perde yoksa (hepsi geçildi) ısınma ve en fazla 3 tekrar', () => {
    const plan = buildEveningPlan({
      ilkSesPassed: true,
      calibrated: true,
      perdeStatus: statuses({ neva: 'gecildi', cargah: 'gecildi', buselik: 'gecildi', dugah: 'gecildi', rast: 'gecildi' }),
    })
    expect(plan.map((s) => s.perdeId)).toEqual(['rast', 'dugah', 'buselik', 'cargah'])
    expect(plan.every((s) => s.tries === 1)).toBe(true)
  })
})
