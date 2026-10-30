import { describe, expect, it } from 'vitest'
import { ETUTLER } from '../content/etutler'
import { NOTA_TOPICS } from '../content/nota-topics'
import { NEY_PERDELER } from '../content/ney-perdeler'
import type { PerdeId } from '../content/ney-perdeler'
import type { LongToneRec } from '../store/db'
import { buildEveningPlan, perdeStatuses } from './evening-plan'
import type { PerdeStatus } from './evening-plan'
import { topicStatuses } from './mastery'
import type { TopicStatus } from './mastery'

/** Bütün etütler çalınmış sayılır; etüt adımı olmayan senaryolar için. */
const HEPSI: ReadonlySet<string> = new Set(ETUTLER.map((e) => e.id))

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
  for (const id of ['nota-1', 'nota-2', 'perde-2', 'perde-3', 'perde-4', 'perde-5']) out[id] = locked.includes(id) ? 'kilitli' : 'acik'
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
    expect(s.segah).toBe('kilitli')
  })

  it('yeni kullanıcıda perdeler yeni sırayla açılır', () => {
    expect(perdeStatuses([], NOTA_1_OPEN)).toEqual(statuses({ neva: 'acik' }))
    const s = perdeStatuses([tone('neva', true), tone('cargah', true)], NOTA_1_OPEN)
    expect(s.segah).toBe('acik')
    expect(s.dugah).toBe('kilitli')
    expect(s.buselik).toBe('kilitli')
  })

  it('eski sırayla ilerlemiş kullanıcının ilerlemesi korunur', () => {
    // Eski sıra: Nevâ, Çârgâh, Bûselik, Dügâh, Rast geçilmiş; nota konuları perde-2'ye kadar açık.
    const old = ['neva', 'cargah', 'buselik', 'dugah', 'rast'].map((id) => tone(id, true))
    const open = topics(['perde-3', 'perde-4'])
    const s = perdeStatuses(old, open)
    expect(s.buselik).toBe('gecildi')
    expect(s.dugah).toBe('gecildi')
    expect(s.rast).toBe('gecildi')
    expect(s.segah).toBe('acik')
    expect(s.huseyni).toBe('acik')
    const plan = buildEveningPlan({ ilkSesPassed: true, calibrated: true, baspareGecildi: true, calinanEtutler: HEPSI, perdeStatus: s })
    expect(plan.find((st) => st.tries === 3)!.perdeId).toBe('segah')
  })

  it('geçilmemiş denemeler perdeyi geçilmiş saymaz', () => {
    const s = perdeStatuses([tone('neva', false)], NOTA_1_OPEN)
    expect(s.neva).toBe('acik')
    expect(s.cargah).toBe('kilitli')
  })

  it('nota-2 kilitliyken Dügâh kilitli kalır', () => {
    const passed = [tone('neva', true), tone('cargah', true), tone('segah', true)]
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
    expect(s.segah).toBe('kilitli')
  })

  it('Rast geçilince Hüseynî, perde-2 kilitliyse kilitli kalır; açıksa hemen açılır', () => {
    const passed = ['neva', 'cargah', 'segah', 'dugah', 'rast'].map((id) => tone(id, true))
    expect(perdeStatuses(passed, topics(['perde-2'])).huseyni).toBe('kilitli')
    expect(perdeStatuses(passed, topics()).huseyni).toBe('acik')
  })

  it('Rast geçilince güncel perde Bûselik olur, Hüseynî kilitli kalır', () => {
    const passed = ['neva', 'cargah', 'segah', 'dugah', 'rast'].map((id) => tone(id, true))
    // Nota konuları perde-3'e kadar öğrenilmiş; perde-3 açık, perde-4 ve perde-2 henüz kilitli.
    const ogrenilen = new Set(NOTA_TOPICS.slice(0, NOTA_TOPICS.findIndex((t) => t.id === 'perde-3')).map((t) => t.id))
    const notalar = topicStatuses(NOTA_TOPICS, [], ogrenilen)
    expect(notalar['perde-3']).toBe('acik')
    expect(notalar['perde-2']).toBe('kilitli')
    const s = perdeStatuses(passed, notalar)
    expect(s.buselik).toBe('acik')
    expect(s.huseyni).toBe('kilitli')
    const plan = buildEveningPlan({ ilkSesPassed: true, calibrated: true, baspareGecildi: true, calinanEtutler: HEPSI, perdeStatus: s })
    expect(plan.find((st) => st.tries === 3)!.perdeId).toBe('buselik')
  })

  it("eski sırada Hüseynî'yi geçmiş kullanıcının perdesi geçilmiş kalır", () => {
    const eski = ['neva', 'cargah', 'segah', 'dugah', 'rast', 'huseyni'].map((id) => tone(id, true))
    // perde-2 öğrenilmiş sayılır ama koma-1 öğrenilmemiş: yeni sırada perde-2 en sonda, kilitli.
    const ogrenilen = new Set(['perde-2'])
    const notalar = topicStatuses(NOTA_TOPICS, [], ogrenilen)
    expect(notalar['koma-1']).not.toBe('ogrenildi')
    const s = perdeStatuses(eski, notalar)
    expect(s.huseyni).toBe('gecildi')
    expect(s.acem).toBe('kilitli')
  })

  it('yeni perdeler nota konusu sırasıyla ve kendi konusuna bağlı açılır', () => {
    const upTo = (ids: string[]) => ids.map((id) => tone(id, true))
    const base = ['neva', 'cargah', 'segah', 'dugah', 'rast']
    // perde-2: Hüseynî, Acem, Gerdâniye, Muhayyer
    const p2 = [...base, 'huseyni', 'acem', 'gerdaniye', 'muhayyer']
    expect(perdeStatuses(upTo([...base, 'huseyni']), topics()).acem).toBe('acik')
    expect(perdeStatuses(upTo([...base, 'huseyni', 'acem']), topics()).gerdaniye).toBe('acik')
    expect(perdeStatuses(upTo([...base, 'huseyni', 'acem', 'gerdaniye']), topics()).muhayyer).toBe('acik')
    // perde-3: Bûselik, Kürdî, Dik Kürdî
    expect(perdeStatuses(upTo(p2), topics(['perde-3'])).buselik).toBe('kilitli')
    expect(perdeStatuses(upTo(p2), topics()).buselik).toBe('acik')
    expect(perdeStatuses(upTo([...p2, 'buselik']), topics()).kurdi).toBe('acik')
    expect(perdeStatuses(upTo([...p2, 'buselik', 'kurdi']), topics())['dik-kurdi']).toBe('acik')
    // perde-4: Nim Hicaz, Eviç
    const p3 = [...p2, 'buselik', 'kurdi', 'dik-kurdi']
    expect(perdeStatuses(upTo(p3), topics(['perde-4']))['nim-hicaz']).toBe('kilitli')
    expect(perdeStatuses(upTo(p3), topics())['nim-hicaz']).toBe('acik')
    expect(perdeStatuses(upTo([...p3, 'nim-hicaz', 'kapali-neva']), topics()).evic).toBe('acik')
    // Önceki (aynı kademedeki) geçilmeden sonraki açılmaz.
    expect(perdeStatuses(upTo(['neva', 'cargah', 'segah', 'dugah']), topics()).buselik).toBe('kilitli')
  })

  it('Rast geçilip perde-3 açılınca; Muhayyer/Hüseynî geçilmese de Bûselik açılır', () => {
    const base = ['neva', 'cargah', 'segah', 'dugah', 'rast'].map((id) => tone(id, true))
    const s = perdeStatuses(base, topics())
    expect(s.buselik).toBe('acik')
    expect(s.huseyni).toBe('acik')
    expect(perdeStatuses(base, topics(['perde-3'])).buselik).toBe('kilitli')
  })

  it('2. kademe zinciri: Bûselik → Kürdî → Dik Kürdî → Nim Hicaz', () => {
    const upTo = (ids: string[]) => ids.map((id) => tone(id, true))
    const base = ['neva', 'cargah', 'segah', 'dugah', 'rast']
    expect(perdeStatuses(upTo([...base, 'buselik', 'kurdi', 'dik-kurdi']), topics())['nim-hicaz']).toBe('acik')
    expect(perdeStatuses(upTo([...base, 'buselik', 'kurdi']), topics())['nim-hicaz']).toBe('kilitli')
  })

  it('Hüseynî hâlâ Rast geçilmesini ve perde-2 açık olmasını ister', () => {
    const noRast = ['neva', 'cargah', 'segah', 'dugah'].map((id) => tone(id, true))
    expect(perdeStatuses(noRast, topics()).huseyni).toBe('kilitli')
    const withRast = [...noRast, tone('rast', true)]
    expect(perdeStatuses(withRast, topics(['perde-2'])).huseyni).toBe('kilitli')
    expect(perdeStatuses(withRast, topics()).huseyni).toBe('acik')
  })

  it('Eviç, kapalı Nevâ geçilmesini ve perde-4 açık olmasını ister; Nim Hicaz geçilmesi yetmez', () => {
    const upTo = (ids: string[]) => ids.map((id) => tone(id, true))
    const base = ['neva', 'cargah', 'segah', 'dugah', 'rast']
    const k3 = ['huseyni', 'acem', 'gerdaniye', 'muhayyer']
    expect(perdeStatuses(upTo([...base, ...k3, 'kapali-neva']), topics()).evic).toBe('acik')
    expect(perdeStatuses(upTo([...base, ...k3, 'kapali-neva']), topics(['perde-4'])).evic).toBe('kilitli')
    expect(perdeStatuses(upTo([...base, ...k3]), topics()).evic).toBe('kilitli')
    expect(perdeStatuses(upTo([...base, 'buselik', 'kurdi', 'dik-kurdi', 'nim-hicaz']), topics()).evic).toBe('kilitli')
  })

  it('kapalı Nevâ Muhayyer geçilince, perde-2 açıkken açılır', () => {
    const upTo = (ids: string[]) => ids.map((id) => tone(id, true))
    const k3 = ['neva', 'cargah', 'segah', 'dugah', 'rast', 'huseyni', 'acem', 'gerdaniye']
    expect(perdeStatuses(upTo(k3), topics())['kapali-neva']).toBe('kilitli')
    expect(perdeStatuses(upTo([...k3, 'muhayyer']), topics())['kapali-neva']).toBe('acik')
    expect(perdeStatuses(upTo([...k3, 'muhayyer']), topics(['perde-2']))['kapali-neva']).toBe('kilitli')
  })

  describe("Eviç'e kadar geçmiş eski kullanıcı", () => {
    // Eski listedeki bütün perdeler (Aşama B sonu): Seviye 2 ara sesleri, 3. kademe ana sesleri ve Eviç.
    const eski = [
      'neva', 'cargah', 'segah', 'dugah', 'rast', 'buselik', 'kurdi', 'dik-kurdi', 'nim-hicaz',
      'huseyni', 'acem', 'gerdaniye', 'muhayyer', 'evic',
    ].map((id) => tone(id, true))
    // perde-2 öğrenilmiş, perde-5 henüz öğrenilmemiş (yeni konu, açık): önündeki bütün konular öğrenilmiş sayılır.
    const notalar = topicStatuses(NOTA_TOPICS, [], new Set(NOTA_TOPICS.slice(0, NOTA_TOPICS.findIndex((t) => t.id === 'perde-5')).map((t) => t.id)))

    it('geçilmişler geçilmiş kalır; kapalı Nevâ ve Nim Şehnaz açık, Nim Hisar kilitli', () => {
      expect(notalar['perde-2']).toBe('ogrenildi')
      expect(notalar['perde-5']).toBe('acik')
      const s = perdeStatuses(eski, notalar)
      for (const id of ['huseyni', 'acem', 'gerdaniye', 'muhayyer', 'evic']) expect(s[id as PerdeId], id).toBe('gecildi')
      expect(s['kapali-neva']).toBe('acik')
      expect(s['nim-sehnaz']).toBe('acik')
      expect(s['nim-hisar']).toBe('kilitli')
    })

    it('akşam planının güncel adımı kapalı Nevâ’dır, ısınma Muhayyer', () => {
      const s = perdeStatuses(eski, notalar)
      const plan = buildEveningPlan({ ilkSesPassed: true, calibrated: true, baspareGecildi: true, calinanEtutler: HEPSI, perdeStatus: s })
      const guncel = plan.find((st) => st.tries === 3)!
      expect(guncel.perdeId).toBe('kapali-neva')
      expect(guncel.dersId).toBe('perde:kapali-neva')
      expect(plan[0]!.perdeId).toBe('muhayyer')
    })

    it('perde-5 konusu kayıtta yoksa ya da kilitliyse Nim Şehnaz ve Nim Hisar kilitli kalır', () => {
      const { 'perde-5': _yok, ...eskiKayit } = notalar
      const s = perdeStatuses(eski, eskiKayit)
      expect(s['kapali-neva']).toBe('acik')
      expect(s['nim-sehnaz']).toBe('kilitli')
      expect(s['nim-hisar']).toBe('kilitli')
      expect(perdeStatuses(eski, { ...notalar, 'perde-5': 'kilitli' })['nim-sehnaz']).toBe('kilitli')
    })

    it('Nim Hisar, Nim Şehnaz geçilene dek kilitli kalır; geçilince açılır', () => {
      expect(perdeStatuses(eski, notalar)['nim-hisar']).toBe('kilitli')
      const s = perdeStatuses([...eski, tone('nim-sehnaz', true)], notalar)
      expect(s['nim-sehnaz']).toBe('gecildi')
      expect(s['nim-hisar']).toBe('acik')
      expect(perdeStatuses([...eski, tone('nim-sehnaz', true)], { ...notalar, 'perde-5': 'kilitli' })['nim-hisar']).toBe('kilitli')
    })
  })

  it('ilk-ses kayıtları perde durumunu etkilemez', () => {
    expect(perdeStatuses([tone('ilk-ses', true)], NOTA_1_OPEN)).toEqual(statuses({ neva: 'acik' }))
  })
})

describe('buildEveningPlan', () => {
  it('ilk ses geçilmemişse plan yalnızca 3 ilk ses denemesidir', () => {
    const plan = buildEveningPlan({ ilkSesPassed: false, calibrated: true, baspareGecildi: true, calinanEtutler: HEPSI, perdeStatus: statuses({ neva: 'acik' }) })
    expect(plan).toEqual([{ kind: 'ilk-ses', label: 'İlk ses', tries: 3, dersId: 's0:ilk-ses' }])
  })

  it('ilk ses adımı s0:ilk-ses dersini taşır; kalibrasyon adımı ders taşımaz', () => {
    const ilk = buildEveningPlan({ ilkSesPassed: false, calibrated: false, baspareGecildi: true, calinanEtutler: HEPSI, perdeStatus: statuses({ neva: 'acik' }) })
    expect(ilk.map((s) => s.dersId)).toEqual(['s0:ilk-ses'])
    const kalibre = buildEveningPlan({ ilkSesPassed: true, calibrated: false, baspareGecildi: true, calinanEtutler: HEPSI, perdeStatus: statuses({ neva: 'acik' }) })
    expect(kalibre.map((s) => [s.kind, s.dersId])).toEqual([
      ['ilk-ses', 's0:ilk-ses'],
      ['kalibrasyon', undefined],
    ])
  })

  it('Nevâ adımı önce gösterge dersini, sonra Nevâ dersini ister; öteki perdelerde tek ders vardır', () => {
    const neva = buildEveningPlan({ ilkSesPassed: true, calibrated: true, baspareGecildi: true, calinanEtutler: HEPSI, perdeStatus: statuses({ neva: 'acik' }) })
    expect(neva[0]!.dersIdler).toEqual(['s0:uzun-ses', 'perde:neva'])
    const cargah = buildEveningPlan({ ilkSesPassed: true, calibrated: true, baspareGecildi: true, calinanEtutler: HEPSI, perdeStatus: statuses({ neva: 'gecildi', cargah: 'acik' }) })
    expect(cargah.find((s) => s.perdeId === 'cargah')!.dersIdler).toBeUndefined()
  })

  it('güncel perde adımı perde:<id> dersini taşır, ısınma taşımaz', () => {
    const ilk = buildEveningPlan({ ilkSesPassed: true, calibrated: true, baspareGecildi: true, calinanEtutler: HEPSI, perdeStatus: statuses({ neva: 'acik' }) })
    expect(ilk.map((s) => [s.perdeId, s.tries, s.dersId])).toEqual([['neva', 3, 'perde:neva']])
    const iki = buildEveningPlan({
      ilkSesPassed: true,
      calibrated: true,
      baspareGecildi: true, calinanEtutler: HEPSI,
      perdeStatus: statuses({ neva: 'gecildi', cargah: 'acik' }),
    })
    expect(iki.map((s) => [s.perdeId, s.tries, s.dersId])).toEqual([
      ['neva', 1, undefined],
      ['cargah', 3, 'perde:cargah'],
    ])
  })

  it('geçilmiş perdelerin tekrar adımları ders taşımaz; hepsi geçilmişse hiçbir adım ders taşımaz', () => {
    const plan = buildEveningPlan({
      ilkSesPassed: true,
      calibrated: true,
      baspareGecildi: true, calinanEtutler: HEPSI,
      perdeStatus: statuses({ neva: 'gecildi', cargah: 'gecildi', segah: 'gecildi', dugah: 'gecildi', rast: 'acik' }),
    })
    expect(plan.filter((s) => s.dersId !== undefined).map((s) => [s.perdeId, s.dersId])).toEqual([['rast', 'perde:rast']])
    const bitti = buildEveningPlan({
      ilkSesPassed: true,
      calibrated: true,
      baspareGecildi: true, calinanEtutler: HEPSI,
      perdeStatus: statuses({ neva: 'gecildi', cargah: 'gecildi', segah: 'gecildi', dugah: 'gecildi', rast: 'gecildi' }),
    })
    expect(bitti.every((s) => s.dersId === undefined)).toBe(true)
  })

  it('kalibre değilse plan kalibrasyon adımını içerir', () => {
    const plan = buildEveningPlan({ ilkSesPassed: true, calibrated: false, baspareGecildi: true, calinanEtutler: HEPSI, perdeStatus: statuses({ neva: 'acik' }) })
    expect(plan).toEqual([
      { kind: 'ilk-ses', label: 'İlk ses', tries: 1, dersId: 's0:ilk-ses' },
      { kind: 'kalibrasyon', label: 'Kalibrasyon', tries: 1 },
    ])
  })

  it('henüz geçilen perde yoksa güncel açık perde ×3', () => {
    const plan = buildEveningPlan({ ilkSesPassed: true, calibrated: true, baspareGecildi: true, calinanEtutler: HEPSI, perdeStatus: statuses({ neva: 'acik' }) })
    expect(plan).toEqual([
      {
        kind: 'uzun-ses',
        perdeId: 'neva',
        label: 'Uzun ses: Nevâ',
        tries: 3,
        dersId: 'perde:neva',
        dersIdler: ['s0:uzun-ses', 'perde:neva'],
      },
    ])
  })

  it('ısınma (son geçilen) ×1, açık perde ×3, diğer geçilenler ×1 (en fazla 3)', () => {
    const plan = buildEveningPlan({
      ilkSesPassed: true,
      calibrated: true,
      baspareGecildi: true, calinanEtutler: HEPSI,
      perdeStatus: statuses({ neva: 'gecildi', cargah: 'gecildi', segah: 'gecildi', dugah: 'gecildi', rast: 'acik' }),
    })
    expect(plan.map((s) => [s.perdeId, s.tries])).toEqual([
      ['dugah', 1],
      ['rast', 3],
      ['segah', 1],
      ['cargah', 1],
      ['neva', 1],
    ])
    expect(plan.every((s) => s.kind === 'uzun-ses')).toBe(true)
    expect(plan[1]!.label).toBe('Uzun ses: Rast')
  })

  it('taşınmış eski kullanıcı: ısınma güncel perdeden hemen önceki geçilen perdedir (Bûselik değil Çârgâh)', () => {
    const plan = buildEveningPlan({
      ilkSesPassed: true,
      calibrated: true,
      baspareGecildi: true,
      calinanEtutler: HEPSI,
      perdeStatus: statuses({ neva: 'gecildi', cargah: 'gecildi', buselik: 'gecildi', dugah: 'gecildi', rast: 'gecildi', segah: 'acik' }),
    })
    expect(plan.map((s) => [s.perdeId, s.tries])).toEqual([
      ['cargah', 1],
      ['segah', 3],
      ['buselik', 1],
      ['rast', 1],
      ['dugah', 1],
    ])
    expect(plan.filter((s) => s.perdeId === 'cargah')).toHaveLength(1)
  })

  it('tek geçilen perde yalnızca ısınmada yer alır', () => {
    const plan = buildEveningPlan({
      ilkSesPassed: true,
      calibrated: true,
      baspareGecildi: true, calinanEtutler: HEPSI,
      perdeStatus: statuses({ neva: 'gecildi', cargah: 'acik' }),
    })
    expect(plan.map((s) => s.label)).toEqual(['Uzun ses: Nevâ', 'Uzun ses: Çârgâh'])
  })

  it('açık perde yoksa (hepsi geçildi) ısınma ve en fazla 3 tekrar', () => {
    const plan = buildEveningPlan({
      ilkSesPassed: true,
      calibrated: true,
      baspareGecildi: true, calinanEtutler: HEPSI,
      perdeStatus: statuses({ neva: 'gecildi', cargah: 'gecildi', segah: 'gecildi', dugah: 'gecildi', rast: 'gecildi' }),
    })
    expect(plan.map((s) => s.perdeId)).toEqual(['rast', 'dugah', 'segah', 'cargah'])
    expect(plan.every((s) => s.tries === 1)).toBe(true)
  })

  describe('başpâre adımı', () => {
    const girdi = (over: Partial<Parameters<typeof buildEveningPlan>[0]>) => ({
      ilkSesPassed: true,
      calibrated: true,
      baspareGecildi: false, calinanEtutler: HEPSI,
      perdeStatus: statuses({ neva: 'gecildi', cargah: 'acik' }),
      ...over,
    })

    it('Nevâ geçilmiş ve başpâre geçilmemişken güncel perde adımından sonra eklenir', () => {
      const plan = buildEveningPlan(girdi({}))
      expect(plan.map((s) => s.kind)).toEqual(['uzun-ses', 'uzun-ses', 'baspare'])
      expect(plan[2]).toEqual({ kind: 'baspare', label: 'Başpâre koy-çek', tries: 1, dersId: 's0:baspare' })
      expect(plan[1]!.perdeId).toBe('cargah')
    })

    it('güncel (açık) perde yoksa ısınmadan sonra eklenir', () => {
      const plan = buildEveningPlan(girdi({ perdeStatus: statuses({ neva: 'gecildi' }) }))
      expect(plan.map((s) => s.kind)).toEqual(['uzun-ses', 'baspare'])
    })

    it('başpâre geçilmişse eklenmez', () => {
      const plan = buildEveningPlan(girdi({ baspareGecildi: true }))
      expect(plan.some((s) => s.kind === 'baspare')).toBe(false)
    })

    it('Nevâ geçilmemişse eklenmez', () => {
      const plan = buildEveningPlan(girdi({ perdeStatus: statuses({ neva: 'acik' }) }))
      expect(plan.some((s) => s.kind === 'baspare')).toBe(false)
    })

    it('ilk ses geçilmemişken ya da kalibre değilken eklenmez', () => {
      expect(buildEveningPlan(girdi({ ilkSesPassed: false })).some((s) => s.kind === 'baspare')).toBe(false)
      expect(buildEveningPlan(girdi({ calibrated: false })).some((s) => s.kind === 'baspare')).toBe(false)
    })
  })
})

describe('etüt adımı', () => {
  const girdi = (over: Partial<Parameters<typeof buildEveningPlan>[0]>) => ({
    ilkSesPassed: true,
    calibrated: true,
    baspareGecildi: true,
    calinanEtutler: new Set<string>(),
    perdeStatus: statuses({ neva: 'gecildi', cargah: 'gecildi', segah: 'acik' }),
    ...over,
  })
  const etutAdimlari = (plan: ReturnType<typeof buildEveningPlan>) => plan.filter((s) => s.kind === 'etut')

  it('Nevâ ve Çârgâh geçilmiş, hiç etüt çalınmamışsa ilk etüt tek-neva eklenir', () => {
    const plan = buildEveningPlan(girdi({}))
    expect(etutAdimlari(plan)).toEqual([
      { kind: 'etut', etutId: 'tek-neva', label: 'Etüt · Tek perde: Nevâ', tries: 1, dersId: 'etut:giris' },
    ])
  })

  it('tek-neva çalınmışsa sıradaki tek-cargah gelir; ikisi de çalınmışsa iki-neva-cargah', () => {
    expect(etutAdimlari(buildEveningPlan(girdi({ calinanEtutler: new Set(['tek-neva']) }))).map((s) => s.etutId)).toEqual([
      'tek-cargah',
    ])
    expect(
      etutAdimlari(buildEveningPlan(girdi({ calinanEtutler: new Set(['tek-neva', 'tek-cargah']) }))).map((s) => s.etutId),
    ).toEqual(['iki-neva-cargah'])
  })

  it('tek adım eklenir: yalnız ilk çalınmamış etüt', () => {
    expect(etutAdimlari(buildEveningPlan(girdi({})))).toHaveLength(1)
  })

  it('perdeleri henüz geçilmemiş etüt atlanır; hiç perde geçilmemişse etüt adımı yoktur', () => {
    // Çârgâh geçilmedi: iki-neva-cargah ve sonrası uygun değil, ama tek-neva çalınmadıkça o gelir.
    const nevaGecildi = girdi({ perdeStatus: statuses({ neva: 'gecildi', cargah: 'acik' }), calinanEtutler: new Set(['tek-neva']) })
    expect(etutAdimlari(buildEveningPlan(nevaGecildi))).toEqual([])
    expect(etutAdimlari(buildEveningPlan(girdi({ perdeStatus: statuses({ neva: 'acik' }) })))).toEqual([])
    expect(etutAdimlari(buildEveningPlan(girdi({ perdeStatus: statuses({}) })))).toEqual([])
  })

  it('hepsi çalınmışsa etüt adımı yoktur', () => {
    const hepsi = girdi({
      perdeStatus: statuses({ neva: 'gecildi', cargah: 'gecildi', segah: 'gecildi', dugah: 'gecildi', rast: 'gecildi' }),
      calinanEtutler: HEPSI,
    })
    expect(etutAdimlari(buildEveningPlan(hepsi))).toEqual([])
  })

  it('rast beşlisi etütleri bütün beş perde geçilince gelir', () => {
    const dortGecildi = statuses({ neva: 'gecildi', cargah: 'gecildi', segah: 'gecildi', dugah: 'gecildi', rast: 'acik' })
    const ilk8 = new Set(ETUTLER.slice(0, 9).map((e) => e.id))
    expect(etutAdimlari(buildEveningPlan(girdi({ perdeStatus: dortGecildi, calinanEtutler: ilk8 })))).toEqual([])
    const bes = statuses({ neva: 'gecildi', cargah: 'gecildi', segah: 'gecildi', dugah: 'gecildi', rast: 'gecildi' })
    const plan = buildEveningPlan(girdi({ perdeStatus: bes, calinanEtutler: ilk8 }))
    expect(etutAdimlari(plan).map((s) => [s.etutId, s.dersId])).toEqual([['rast-besli-1', 'etut:rast-besli']])
  })

  it('Seviye 1 etütleri çalınmış, beş ses geçilmiş → sıradaki etüt adımı usul-nim-sofyan; önce ölçü, usul girişi ve Nim Sofyan dersleri', () => {
    const bes = statuses({ neva: 'gecildi', cargah: 'gecildi', segah: 'gecildi', dugah: 'gecildi', rast: 'gecildi' })
    const s1 = new Set(ETUTLER.filter((e) => e.seviye === 1).map((e) => e.id))
    expect(s1.size).toBe(11)
    const plan = buildEveningPlan(girdi({ perdeStatus: bes, calinanEtutler: s1 }))
    expect(etutAdimlari(plan)).toEqual([
      {
        kind: 'etut',
        etutId: 'usul-nim-sofyan',
        label: 'Etüt · Usul: Nim Sofyan',
        tries: 1,
        dersId: 'usul:nim-sofyan',
        dersIdler: ['okuma:olcu', 'usul:giris', 'usul:nim-sofyan'],
      },
    ])
    // Seviye 1 etütlerinden biri çalınmamışken Seviye 2 etüdü önerilmez; o etüt gelir.
    const eksik = new Set([...s1].filter((id) => id !== 'rast-besli-2'))
    expect(etutAdimlari(buildEveningPlan(girdi({ perdeStatus: bes, calinanEtutler: eksik }))).map((s) => s.etutId)).toEqual([
      'rast-besli-2',
    ])
    // Usul ve dil etütleri çalınınca, ara sesleri geçilmemiş dörtlü etütleri gelmez.
    const usulDil = new Set([...s1, 'usul-nim-sofyan', 'usul-semai', 'usul-sofyan', 'dil-1'])
    expect(etutAdimlari(buildEveningPlan(girdi({ perdeStatus: bes, calinanEtutler: usulDil })))).toEqual([])
    // Bûselik de geçilince Çârgâh dörtlüsü etüdü gelir.
    const buselik = { ...bes, buselik: 'gecildi' as const }
    expect(
      etutAdimlari(buildEveningPlan(girdi({ perdeStatus: buselik, calinanEtutler: usulDil }))).map((s) => [s.etutId, s.dersId]),
    ).toEqual([['dortlu-cargah', 'dortlu:cargah']])
  })

  it('sıra: ısınma, güncel perde ×3, başpâre, etüt, diğer geçilen perdeler', () => {
    const plan = buildEveningPlan(
      girdi({
        baspareGecildi: false,
        perdeStatus: statuses({ neva: 'gecildi', cargah: 'gecildi', segah: 'acik' }),
      }),
    )
    expect(plan.map((s) => [s.kind, s.perdeId ?? s.etutId, s.tries])).toEqual([
      ['uzun-ses', 'cargah', 1],
      ['uzun-ses', 'segah', 3],
      ['baspare', undefined, 1],
      ['etut', 'tek-neva', 1],
      ['uzun-ses', 'neva', 1],
    ])
  })

  it('başpâre geçilmişse etüt güncel perde adımının hemen ardından gelir', () => {
    const plan = buildEveningPlan(girdi({}))
    expect(plan.map((s) => s.kind)).toEqual(['uzun-ses', 'uzun-ses', 'etut', 'uzun-ses'])
  })

  it('ilk ses geçilmemişken ya da kalibre değilken etüt adımı yoktur', () => {
    expect(etutAdimlari(buildEveningPlan(girdi({ ilkSesPassed: false })))).toEqual([])
    expect(etutAdimlari(buildEveningPlan(girdi({ calibrated: false })))).toEqual([])
  })
})
