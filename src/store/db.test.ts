import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  addAttempt,
  addFingeringFlag,
  addLongTone,
  getCard,
  getOpenSession,
  getSettings,
  listAttempts,
  listCards,
  listFingeringFlags,
  listLongTones,
  listSessions,
  listTopics,
  putCard,
  readAllStores,
  replaceAllStores,
  resetDbForTests,
  saveSession,
  saveSettings,
  setPlacedOut,
} from './db'
import type { SessionRec } from './db'

beforeEach(async () => {
  await resetDbForTests()
})

function session(over: Partial<SessionRec> = {}): SessionRec {
  return {
    id: crypto.randomUUID(),
    kind: 'gunduz',
    date: '2026-10-13',
    startedAt: '2026-10-13T08:00:00.000Z',
    completed: false,
    elapsedMs: 0,
    state: null,
    ...over,
  }
}

const noStores = (): Parameters<typeof replaceAllStores>[0] => ({
  attempts: [],
  cards: [],
  sessions: [],
  longTones: [],
  fingeringFlags: [],
  topics: [],
  settings: [],
})

describe('settings', () => {
  it('returns defaults on first call', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
    expect(DEFAULT_SETTINGS.dailyQuestionCount).toBe(12)
    expect(DEFAULT_SETTINGS.soundOn).toBe(true)
    expect(DEFAULT_SETTINGS.lastBackupAt).toBeNull()
  })

  it('persists a patch and returns the merged settings', async () => {
    const saved = await saveSettings({ soundOn: false })
    expect(saved.soundOn).toBe(false)
    const again = await getSettings()
    expect(again.soundOn).toBe(false)
    expect(again.dailyQuestionCount).toBe(12)
  })

  it('yeni kurulumda ney sesi shakuhachi, usul sesi tahta', async () => {
    expect(DEFAULT_SETTINGS.neySesi).toBe('shakuhachi')
    expect(DEFAULT_SETTINGS.usulSesi).toBe('tahta')
    expect(DEFAULT_SETTINGS.varsayilanSesSurumu).toBe(2)
    const s = await getSettings()
    expect(s.neySesi).toBe('shakuhachi')
    expect(s.usulSesi).toBe('tahta')
    expect(s.varsayilanSesSurumu).toBe(2)
  })

  it('neySesi kaydedilir', async () => {
    await saveSettings({ neySesi: 'nefesli' })
    expect((await getSettings()).neySesi).toBe('nefesli')
  })

  it("neySesi'z eski kayıt ve bilinmeyen değer varsayılana (shakuhachi) döner", async () => {
    await replaceAllStores({
      ...noStores(),
      settings: [{ id: 'settings', soundOn: false }],
    })
    const old = await getSettings()
    expect(old.neySesi).toBe('shakuhachi')
    expect(old.soundOn).toBe(false)
    await replaceAllStores({ ...noStores(), settings: [{ id: 'settings', neySesi: 'davul', varsayilanSesSurumu: 2 }] })
    expect((await getSettings()).neySesi).toBe('shakuhachi')
  })

  it('usulSesi kaydedilir', async () => {
    await saveSettings({ usulSesi: 'darbuka' })
    expect((await getSettings()).usulSesi).toBe('darbuka')
  })

  it("usulSesi'z eski kayıt ve bilinmeyen değer varsayılana (tahta) döner", async () => {
    await replaceAllStores({ ...noStores(), settings: [{ id: 'settings', neySesi: 'nefesli' }] })
    const old = await getSettings()
    expect(old.usulSesi).toBe('tahta')
    expect(old.neySesi).toBe('nefesli')
    await replaceAllStores({ ...noStores(), settings: [{ id: 'settings', usulSesi: 'bongo', varsayilanSesSurumu: 2 }] })
    expect((await getSettings()).usulSesi).toBe('tahta')
  })

  it('eski varsayılanlar (mevcut/oryantal, sürüm alanı yok) yeni varsayılanlara taşınır', async () => {
    await replaceAllStores({
      ...noStores(),
      settings: [{ id: 'settings', soundOn: false, dailyQuestionCount: 8, neySesi: 'mevcut', usulSesi: 'oryantal' }],
    })
    const s = await getSettings()
    expect(s.neySesi).toBe('shakuhachi')
    expect(s.usulSesi).toBe('tahta')
    expect(s.varsayilanSesSurumu).toBe(2)
    expect(s.soundOn).toBe(false)
    expect(s.dailyQuestionCount).toBe(8)
  })

  it('bilinçli seçim korunur', async () => {
    await replaceAllStores({
      ...noStores(),
      settings: [{ id: 'settings', neySesi: 'nefesli', usulSesi: 'konga' }],
    })
    const secili = await getSettings()
    expect(secili.neySesi).toBe('nefesli')
    expect(secili.usulSesi).toBe('konga')
    expect(secili.varsayilanSesSurumu).toBe(2)
    // Sürüm 2 kaydında "mevcut" artık bilinçli seçimdir.
    await replaceAllStores({
      ...noStores(),
      settings: [{ id: 'settings', neySesi: 'mevcut', usulSesi: 'oryantal', varsayilanSesSurumu: 2 }],
    })
    const yeni = await getSettings()
    expect(yeni.neySesi).toBe('mevcut')
    expect(yeni.usulSesi).toBe('oryantal')
  })

  it('taşınan ayar ilk kayıtta kalıcı olur', async () => {
    await replaceAllStores({
      ...noStores(),
      settings: [{ id: 'settings', neySesi: 'mevcut', usulSesi: 'oryantal' }],
    })
    await saveSettings({ soundOn: false })
    const raw = (await readAllStores()).settings[0] as Record<string, unknown>
    expect(raw.varsayilanSesSurumu).toBe(2)
    expect(raw.neySesi).toBe('shakuhachi')
    expect(raw.usulSesi).toBe('tahta')
    // Kullanıcı sonradan "mevcut"i bilinçli seçerse bir daha taşınmaz.
    await saveSettings({ neySesi: 'mevcut' })
    expect((await getSettings()).neySesi).toBe('mevcut')
  })

  it('accumulates successive patches', async () => {
    await saveSettings({ onboarded: true })
    await saveSettings({ calibrated: true })
    const s = await getSettings()
    expect(s.onboarded).toBe(true)
    expect(s.calibrated).toBe(true)
  })
})

describe('attempts', () => {
  it('fills id and at', async () => {
    const a = await addAttempt({ topicId: 'nota-1', cardId: 'c1', correct: true })
    expect(a.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(Number.isNaN(Date.parse(a.at))).toBe(false)
  })

  it('keeps a strict order for attempts written in a tight loop (monotonic timestamps)', async () => {
    const written: string[] = []
    for (let i = 0; i < 20; i++) written.push((await addAttempt({ topicId: 'nota-1', cardId: `c${i}`, correct: true })).id)
    const list = await listAttempts('nota-1')
    expect(list.map((x) => x.id)).toEqual(written)
    const ats = list.map((x) => x.at)
    expect(new Set(ats).size).toBe(ats.length)
  })

  it('lists only the topic, ordered by at ascending', async () => {
    const a = await addAttempt({ topicId: 'nota-1', cardId: 'c1', correct: true })
    await addAttempt({ topicId: 'nota-2', cardId: 'c2', correct: false })
    await new Promise((r) => setTimeout(r, 5))
    const b = await addAttempt({ topicId: 'nota-1', cardId: 'c3', correct: false })
    const list = await listAttempts('nota-1')
    expect(list.map((x) => x.id)).toEqual([a.id, b.id])
    expect((await listAttempts()).length).toBe(3)
  })
})

describe('cards', () => {
  it('puts, gets and lists', async () => {
    expect(await getCard('x')).toBeUndefined()
    await putCard({ id: 'x', box: 2, lastReviewedAt: '2026-10-13T08:00:00.000Z' })
    await putCard({ id: 'x', box: 3, lastReviewedAt: '2026-10-13T09:00:00.000Z' })
    expect((await getCard('x'))?.box).toBe(3)
    expect(await listCards()).toHaveLength(1)
  })
})

describe('sessions', () => {
  it('getOpenSession does not return closed sessions', async () => {
    await saveSession(session({ endedAt: '2026-10-13T08:10:00.000Z', completed: true }))
    expect(await getOpenSession('gunduz')).toBeUndefined()
  })

  it('returns the latest open session of the requested kind', async () => {
    await saveSession(session({ id: 'old', startedAt: '2026-10-12T08:00:00.000Z' }))
    await saveSession(session({ id: 'new', startedAt: '2026-10-13T08:00:00.000Z' }))
    await saveSession(session({ id: 'eve', kind: 'aksam', startedAt: '2026-10-13T20:00:00.000Z' }))
    expect((await getOpenSession('gunduz'))?.id).toBe('new')
    expect((await getOpenSession('aksam'))?.id).toBe('eve')
    expect(await listSessions()).toHaveLength(3)
  })

  it('overwrites a session with the same id', async () => {
    const s = session({ id: 's1' })
    await saveSession(s)
    await saveSession({ ...s, elapsedMs: 5000 })
    const all = await listSessions()
    expect(all).toHaveLength(1)
    expect(all[0]?.elapsedMs).toBe(5000)
  })
})

describe('long tones, flags, topics', () => {
  it('adds and lists long tones, filtered by perde', async () => {
    const r = await addLongTone({ perdeId: 'rast', durationMs: 4000, passed: true, toleranceCents: 25 })
    await addLongTone({ perdeId: 'neva', durationMs: 3000, passed: false, toleranceCents: 25 })
    expect(r.id).toBeTruthy()
    expect(r.at).toBeTruthy()
    expect(await listLongTones('rast')).toHaveLength(1)
    expect(await listLongTones()).toHaveLength(2)
  })

  it('adds a fingering flag', async () => {
    const f = await addFingeringFlag({ perdeId: 'rast', medianCents: 60 })
    expect(f.id).toBeTruthy()
    expect(f.at).toBeTruthy()
  })

  it('lists fingering flags, filtered by perde', async () => {
    await addFingeringFlag({ perdeId: 'rast', medianCents: 60 })
    await addFingeringFlag({ perdeId: 'neva', medianCents: -55 })
    expect(await listFingeringFlags('rast')).toHaveLength(1)
    expect((await listFingeringFlags('neva'))[0]!.medianCents).toBe(-55)
    expect(await listFingeringFlags()).toHaveLength(2)
  })

  it('setPlacedOut creates and updates topic records', async () => {
    expect(await listTopics()).toEqual([])
    await setPlacedOut('nota-1')
    await setPlacedOut('nota-1')
    const topics = await listTopics()
    expect(topics).toHaveLength(1)
    expect(topics[0]?.placedOut).toBe(true)
    expect(topics[0]?.id).toBe('nota-1')
  })
})

describe('replaceAllStores', () => {
  function emptyData(): Parameters<typeof replaceAllStores>[0] {
    return { attempts: [], cards: [], sessions: [], longTones: [], fingeringFlags: [], topics: [], settings: [] }
  }

  it('bir put eşzamanlı fırlatırsa (anahtarsız kayıt) işlem iptal edilir ve mevcut veri korunur', async () => {
    await addAttempt({ topicId: 'nota-1', cardId: 'note:D5', correct: true })
    await putCard({ id: 'note:D5', box: 3, lastReviewedAt: '2026-10-01T00:00:00.000Z' })
    const data = emptyData()
    data.attempts = [{ topicId: 'nota-1' }] // keyPath 'id' yok → put eşzamanlı DataError
    await expect(replaceAllStores(data)).rejects.toThrow()
    const after = await readAllStores()
    expect(after.attempts).toHaveLength(1)
    expect(after.cards).toHaveLength(1)
  })

  it('geçerli veriyle depoları değiştirir', async () => {
    await addAttempt({ topicId: 'nota-1', cardId: 'note:D5', correct: true })
    const data = emptyData()
    data.cards = [{ id: 'note:C5', box: 2, lastReviewedAt: '2026-10-01T00:00:00.000Z' }]
    await replaceAllStores(data)
    const after = await readAllStores()
    expect(after.attempts).toHaveLength(0)
    expect(after.cards).toHaveLength(1)
  })
})

describe('resetDbForTests', () => {
  it('wipes all data', async () => {
    await addAttempt({ topicId: 'a', cardId: 'b', correct: true })
    await resetDbForTests()
    expect(await listAttempts()).toEqual([])
  })
})
