import { beforeEach, describe, expect, it } from 'vitest'
import { addLongTone, getOpenSession, isaretEkle, listSessions, resetDbForTests, saveSettings } from '../store/db'
import { todayLocal } from '../util/date'
import { isPlanDone, loadEveningInput, loadOrStartEveningSession, nextTry, saveEveningProgress } from './evening-session'
import type { EveningState } from './evening-session'

beforeEach(async () => {
  await resetDbForTests()
})

const STATE: EveningState = {
  steps: [
    { kind: 'ilk-ses', label: 'İlk ses', tries: 2 },
    { kind: 'kalibrasyon', label: 'Kalibrasyon', tries: 1 },
  ],
  stepIndex: 0,
  tryIndex: 0,
}

describe('nextTry', () => {
  it('adımın denemelerini bitirip sonraki adıma geçer', () => {
    const a = nextTry(STATE)
    expect(a).toMatchObject({ stepIndex: 0, tryIndex: 1 })
    const b = nextTry(a)
    expect(b).toMatchObject({ stepIndex: 1, tryIndex: 0 })
    expect(isPlanDone(b)).toBe(false)
    expect(isPlanDone(nextTry(b))).toBe(true)
  })
})

describe('evening session', () => {
  it('girdi: ilk ses ve kalibrasyon kayıtlardan okunur', async () => {
    expect(await loadEveningInput()).toMatchObject({ ilkSesPassed: false, calibrated: false })
    await addLongTone({ perdeId: 'ilk-ses', durationMs: 3000, passed: true, toleranceCents: 50 })
    await saveSettings({ calibrated: true })
    const input = await loadEveningInput()
    expect(input).toMatchObject({ ilkSesPassed: true, calibrated: true })
    expect(input.perdeStatus.neva).toBe('acik')
  })

  it('girdi: başpâre yalnız geçilmiş kayıttan okunur', async () => {
    expect((await loadEveningInput()).baspareGecildi).toBe(false)
    await addLongTone({ perdeId: 'baspare', durationMs: 300, passed: false, toleranceCents: 25 })
    expect((await loadEveningInput()).baspareGecildi).toBe(false)
    await addLongTone({ perdeId: 'baspare', durationMs: 300, passed: true, toleranceCents: 25 })
    expect((await loadEveningInput()).baspareGecildi).toBe(true)
  })

  it('girdi: çalınan etütler ayarlardan bir küme olarak okunur', async () => {
    expect([...(await loadEveningInput()).calinanEtutler]).toEqual([])
    await isaretEkle('calinanEtutler', 'tek-neva')
    await isaretEkle('calinanEtutler', 'tek-cargah')
    expect([...(await loadEveningInput()).calinanEtutler]).toEqual(['tek-neva', 'tek-cargah'])
  })

  it('bugünün oturumunu açar, ikinci çağrıda aynısını döner; plan bitince tamamlar', async () => {
    const s = await loadOrStartEveningSession(new Date())
    expect(s).toMatchObject({ kind: 'aksam', date: todayLocal(), completed: false })
    expect((s.state as EveningState).steps).toEqual([
      { kind: 'ilk-ses', label: 'İlk ses', tries: 3, dersId: 's0:ilk-ses' },
    ])
    expect((await loadOrStartEveningSession(new Date())).id).toBe(s.id)
    const done = await saveEveningProgress(s, { ...(s.state as EveningState), stepIndex: 1, tryIndex: 0 })
    expect(done.completed).toBe(true)
    expect(done.endedAt).toBeTruthy()
    expect(await getOpenSession('aksam')).toBeUndefined()
    expect(await listSessions()).toHaveLength(1)
  })
})
