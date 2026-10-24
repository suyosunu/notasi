import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PitchSample } from '../audio/mic'
import { playWritten, unlockAudio } from '../audio/player'
import { ILK_SES_REHBER, NEY_PERDELER } from '../content/ney-perdeler'
import { DEFAULT_TUNING, soundingHz } from '../music/ahenk'
import {
  addFingeringFlag,
  addLongTone,
  getOpenSession,
  isaretEkle,
  listLongTones,
  listSessions,
  readAllStores,
  resetDbForTests,
  saveSession,
  saveSettings,
} from '../store/db'
import type { SessionRec } from '../store/db'
import { todayLocal } from '../util/date'

let emit: ((s: PitchSample) => void) | null = null
const stopper = vi.fn()
const startPitchStream = vi.fn(async (cb: (s: PitchSample) => void) => {
  emit = cb
  return stopper
})
vi.mock('../audio/mic', async (orig) => {
  const actual = await orig<typeof import('../audio/mic')>()
  return { ...actual, startPitchStream: (cb: (s: PitchSample) => void) => startPitchStream(cb) }
})
vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playWritten: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
}))

import { EveningPractice } from './EveningPractice'

const NEVA = NEY_PERDELER.find((p) => p.id === 'neva')!
const NEVA_HZ = soundingHz(NEVA.written, DEFAULT_TUNING)
const FINGERING_NOTE = 'Ses beklenenden epey farklı. Parmak şemasını ve deliklerin tam kapandığını kontrol edin.'
const SOUND_WARNING = 'Ses çalınamadı. Telefonun sessiz düğmesini kontrol edin.'

beforeEach(async () => {
  await resetDbForTests()
  emit = null
  stopper.mockClear()
  startPitchStream.mockClear()
  vi.mocked(playWritten).mockClear()
  vi.mocked(unlockAudio).mockClear()
  location.hash = ''
})
afterEach(() => {
  cleanup()
  location.hash = ''
})

/** İlk ses geçilmiş, kalibre; perde adımlarının dersleri okunmuş sayılır (kapı açılır). */
async function readyForPerde() {
  await readyForPerdeDerssiz()
  for (const id of ['neva', 'cargah', 'segah', 'dugah', 'rast']) await isaretEkle('okunanDersler', `perde:${id}`)
}

/** İlk ses geçilmiş, kalibre; perde dersleri okunmamış. */
async function readyForPerdeDerssiz() {
  await addLongTone({ perdeId: 'ilk-ses', durationMs: 3000, passed: true, toleranceCents: 50 })
  await saveSettings({ calibrated: true })
}

/** İlk ses adımının dersi (s0:ilk-ses) okunmuş sayılır; kapı açılır. */
async function ilkSesDersiOkundu() {
  await isaretEkle('okunanDersler', 's0:ilk-ses')
}

/** `ms` boyunca 50 ms arayla sabit frekans (null = sessizlik). */
function blow(hz: number | ((t: number) => number | null) | null, ms: number, t0 = 1000) {
  act(() => {
    for (let t = 0; t <= ms; t += 50) {
      const h = typeof hz === 'function' ? hz(t) : hz
      emit!({ t: t0 + t, hz: h, clarity: h === null ? 0.2 : 0.99 })
    }
  })
}

async function begin() {
  const btn = await screen.findByRole('button', { name: 'Başla' })
  await waitFor(() => expect((btn as HTMLButtonElement).disabled).toBe(false))
  emit = null
  fireEvent.click(btn)
  await waitFor(() => expect(emit).not.toBeNull())
}

async function finishTry() {
  await begin()
  fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Devam' }))
}

describe('EveningPractice', () => {
  it('tolerans içinde 4,5 sn üfleyince Nevâ geçilir ve kaydedilir', async () => {
    await readyForPerde()
    render(<EveningPractice />)
    expect(await screen.findByRole('heading', { name: /Uzun ses: Nevâ/ })).toBeTruthy()
    expect(screen.getByText(NEVA.tip)).toBeTruthy()
    expect(screen.getByRole('img', { name: /Ney parmak şeması/ })).toBeTruthy()
    await begin()
    blow(NEVA_HZ, 4500)
    expect(await screen.findByText(/Geçtin/)).toBeTruthy()
    expect(stopper).toHaveBeenCalled()
    await waitFor(async () => {
      const recs = await listLongTones('neva')
      expect(recs.some((r) => r.passed)).toBe(true)
    })
    const [rec] = await listLongTones('neva')
    expect(rec).toMatchObject({ passed: true, toleranceCents: 25 })
    expect(rec!.durationMs).toBeGreaterThanOrEqual(4000)
    expect(screen.queryByText(FINGERING_NOTE)).toBeNull()
  })

  it('süre ve en iyi süre gösterilir', async () => {
    await readyForPerde()
    render(<EveningPractice />)
    await begin()
    blow(NEVA_HZ, 2000)
    expect(await screen.findByText('Süre: 2,0 sn (en iyi 2,0 sn)')).toBeTruthy()
  })

  it('en iyi süre perdenin tüm geçmişindeki en uzun süredir', async () => {
    await readyForPerde()
    await addLongTone({ perdeId: 'neva', durationMs: 4300, passed: true, toleranceCents: 25 })
    await addLongTone({ perdeId: 'neva', durationMs: 1500, passed: false, toleranceCents: 20 })
    render(<EveningPractice />)
    expect(await screen.findByText('Süre: 0,0 sn (en iyi 4,3 sn)')).toBeTruthy()
    await begin()
    blow(NEVA_HZ, 2000)
    expect(await screen.findByText('Süre: 2,0 sn (en iyi 4,3 sn)')).toBeTruthy()
  })

  it('bu deneme geçmişi aşarsa en iyi süre bu denemedir', async () => {
    await readyForPerde()
    await addLongTone({ perdeId: 'neva', durationMs: 1200, passed: false, toleranceCents: 25 })
    render(<EveningPractice />)
    expect(await screen.findByText('Süre: 0,0 sn (en iyi 1,2 sn)')).toBeTruthy()
    await begin()
    blow(NEVA_HZ, 2000)
    expect(await screen.findByText('Süre: 2,0 sn (en iyi 2,0 sn)')).toBeTruthy()
  })

  it('Review Focus 5: sessizlik ve oktav sıçramaları geçilmiş sayılmaz; Bitir başarısız kaydı yazar', async () => {
    await readyForPerde()
    render(<EveningPractice />)
    await begin()
    blow(null, 6000)
    // 150 ms doğru, 300 ms oktav üstü: grace aşılır, tutuş hep sıfırlanır.
    blow((t) => (Math.floor(t / 150) % 3 === 0 ? NEVA_HZ : NEVA_HZ * 2), 8000, 8000)
    expect(screen.queryByText(/Geçtin/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    expect(await screen.findByRole('button', { name: 'Devam' })).toBeTruthy()
    const recs = await listLongTones('neva')
    expect(recs).toHaveLength(1)
    expect(recs[0]!.passed).toBe(false)
    expect(recs[0]!.durationMs).toBeLessThan(4000)
  })

  it('perde ilk kez çalışılırken ses çok farklıysa şema uyarısı çıkar ve kaydedilir', async () => {
    await readyForPerde()
    render(<EveningPractice />)
    await begin()
    blow(NEVA_HZ * 2 ** (70 / 1200), 2500)
    expect(await screen.findByText(FINGERING_NOTE)).toBeTruthy()
    await waitFor(async () => {
      const { fingeringFlags } = await readAllStores()
      expect(fingeringFlags).toHaveLength(1)
    })
    const { fingeringFlags } = await readAllStores()
    expect(fingeringFlags[0]).toMatchObject({ perdeId: 'neva' })
    expect((fingeringFlags[0] as { medianCents: number }).medianCents).toBeCloseTo(70, 0)
  })

  it('perdenin önceki kaydı varsa şema denetimi yapılmaz', async () => {
    await readyForPerde()
    await addLongTone({ perdeId: 'neva', durationMs: 1000, passed: false, toleranceCents: 25 })
    render(<EveningPractice />)
    await begin()
    blow(NEVA_HZ * 2 ** (70 / 1200), 2500)
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    await screen.findByRole('button', { name: 'Devam' })
    expect(screen.queryByText(FINGERING_NOTE)).toBeNull()
    expect((await readAllStores()).fingeringFlags).toHaveLength(0)
  })

  it('ilk deneme ses gelmeden bitirilirse (süre 0) sonraki denemede şema denetimi yine yapılır', async () => {
    await readyForPerde()
    render(<EveningPractice />)
    await begin()
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Devam' }))
    expect(await screen.findByText('Deneme 2/3')).toBeTruthy()
    expect((await listLongTones('neva'))[0]!.durationMs).toBe(0)
    await begin()
    blow(NEVA_HZ * 2 ** (70 / 1200), 2500)
    expect(await screen.findByText(FINGERING_NOTE)).toBeTruthy()
    await waitFor(async () => expect((await readAllStores()).fingeringFlags).toHaveLength(1))
  })

  it('perde için şema kaydı varsa (süreli deneme olmasa da) denetim tekrarlanmaz', async () => {
    await readyForPerde()
    await addFingeringFlag({ perdeId: 'neva', medianCents: 70 })
    render(<EveningPractice />)
    await begin()
    blow(NEVA_HZ * 2 ** (70 / 1200), 2500)
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    await screen.findByRole('button', { name: 'Devam' })
    expect(screen.queryByText(FINGERING_NOTE)).toBeNull()
    expect((await readAllStores()).fingeringFlags).toHaveLength(1)
  })

  it('ilk ses: rehber gösterilir, hedef tutuşun başındaki perdedir', async () => {
    await ilkSesDersiOkundu()
    render(<EveningPractice />)
    expect(await screen.findByRole('heading', { name: /İlk ses/ })).toBeTruthy()
    expect(screen.getByText(ILK_SES_REHBER[0]!)).toBeTruthy()
    expect(screen.getByText('Deneme 1/3')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '🔊 Doğru sesi dinle' })).toBeNull()
    await begin()
    blow(300, 3200)
    expect(await screen.findByText(/Geçtin/)).toBeTruthy()
    await waitFor(async () => expect((await listLongTones('ilk-ses')).some((r) => r.passed)).toBe(true))
    expect((await listLongTones('ilk-ses'))[0]!.toleranceCents).toBe(50)
  })

  it('plan bitince oturum tamamlanır ve oturum sonuna gidilir; yeniden açılınca kaldığı yerden sürer', async () => {
    await readyForPerde()
    render(<EveningPractice />)
    expect(await screen.findByText('Deneme 1/3')).toBeTruthy()
    await finishTry()
    expect(await screen.findByText('Deneme 2/3')).toBeTruthy()
    await waitFor(async () => {
      const open = await getOpenSession('aksam')
      expect((open?.state as { tryIndex: number } | undefined)?.tryIndex).toBe(1)
    })

    cleanup()
    render(<EveningPractice />)
    expect(await screen.findByText('Deneme 2/3')).toBeTruthy()
    await finishTry()
    expect(await screen.findByText('Deneme 3/3')).toBeTruthy()
    await finishTry()
    await waitFor(() => expect(location.hash).toBe('#/oturum-sonu'))
    const sessions = await listSessions()
    expect(sessions).toHaveLength(1)
    expect(sessions[0]).toMatchObject({ kind: 'aksam', completed: true, date: todayLocal() })
    expect(sessions[0]!.endedAt).toBeTruthy()
    expect(await listLongTones('neva')).toHaveLength(3)
  })

  it('dünden kalan açık akşam oturumu tamamlanmamış diye kapatılır', async () => {
    await readyForPerde()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const stale: SessionRec = {
      id: 'eski',
      kind: 'aksam',
      date: todayLocal(yesterday),
      startedAt: yesterday.toISOString(),
      completed: false,
      elapsedMs: 0,
      state: { steps: [{ kind: 'ilk-ses', label: 'İlk ses', tries: 3 }], stepIndex: 0, tryIndex: 2 },
    }
    await saveSession(stale)
    render(<EveningPractice />)
    expect(await screen.findByText('Deneme 1/3')).toBeTruthy()
    expect(screen.getByRole('heading', { name: /Uzun ses: Nevâ/ })).toBeTruthy()
    const sessions = await listSessions()
    const old = sessions.find((s) => s.id === 'eski')!
    expect(old.completed).toBe(false)
    expect(old.endedAt).toBeTruthy()
    expect((await getOpenSession('aksam'))?.date).toBe(todayLocal())
  })

  it('kalibre değilse ilk sesten sonra kalibrasyon adımı gelir', async () => {
    await addLongTone({ perdeId: 'ilk-ses', durationMs: 3000, passed: true, toleranceCents: 50 })
    await ilkSesDersiOkundu()
    render(<EveningPractice />)
    expect(await screen.findByText('Deneme 1/1')).toBeTruthy()
    await finishTry()
    expect(await screen.findByRole('heading', { name: 'Kalibrasyon' })).toBeTruthy()
  })

  it('kalibrasyon adımında "Şimdi değil" ana ekrana döner', async () => {
    await addLongTone({ perdeId: 'ilk-ses', durationMs: 3000, passed: true, toleranceCents: 50 })
    await ilkSesDersiOkundu()
    location.hash = '#/aksam'
    render(<EveningPractice />)
    await finishTry()
    await screen.findByRole('heading', { name: 'Kalibrasyon' })
    fireEvent.click(screen.getByRole('button', { name: 'Şimdi değil' }))
    expect(location.hash).toBe('#/')
  })

  it('perde adımına kalibrasyonsuz gelinirse önce kalibrasyon gösterilir', async () => {
    await addLongTone({ perdeId: 'ilk-ses', durationMs: 3000, passed: true, toleranceCents: 50 })
    await saveSession({
      id: 'bugun',
      kind: 'aksam',
      date: todayLocal(),
      startedAt: new Date().toISOString(),
      completed: false,
      elapsedMs: 0,
      state: { steps: [{ kind: 'uzun-ses', perdeId: 'neva', label: 'Uzun ses: Nevâ', tries: 3 }], stepIndex: 0, tryIndex: 0 },
    })
    render(<EveningPractice />)
    expect(await screen.findByRole('heading', { name: 'Kalibrasyon' })).toBeTruthy()
    expect(screen.queryByText('Deneme 1/3')).toBeNull()
  })

  it('🔊 Doğru sesi dinle perdenin ikilik sesini çalar', async () => {
    await readyForPerde()
    render(<EveningPractice />)
    fireEvent.click(await screen.findByRole('button', { name: '🔊 Doğru sesi dinle' }))
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    expect(unlockAudio).toHaveBeenCalled()
    expect(vi.mocked(playWritten).mock.calls[0]![0]).toEqual([{ kind: 'note', pitch: NEVA.written, dur: 'half' }])
    expect(vi.mocked(playWritten).mock.calls[0]![1]).toEqual(DEFAULT_TUNING)
    expect(screen.queryByText(SOUND_WARNING)).toBeNull()
  })

  it('ses kapalıysa çalmaz, uyarı gösterir', async () => {
    await readyForPerde()
    await saveSettings({ soundOn: false })
    render(<EveningPractice />)
    fireEvent.click(await screen.findByRole('button', { name: '🔊 Doğru sesi dinle' }))
    expect(await screen.findByText("Sesler Ayarlar'dan kapalı.")).toBeTruthy()
    expect(screen.queryByText(SOUND_WARNING)).toBeNull()
    expect(playWritten).not.toHaveBeenCalled()
  })

  it('çalma başarısız olursa uyarı gösterir', async () => {
    await readyForPerde()
    vi.mocked(playWritten).mockImplementationOnce(() => Promise.reject(new Error('yok')))
    render(<EveningPractice />)
    fireEvent.click(await screen.findByRole('button', { name: '🔊 Doğru sesi dinle' }))
    expect(await screen.findByText(SOUND_WARNING)).toBeTruthy()
  })

  it('düzey son denemelere göre belirlenir: 3 geçiş + 1 başarısız → düzey 2, tolerans 15', async () => {
    await readyForPerde()
    await addLongTone({ perdeId: 'neva', durationMs: 4000, passed: true, toleranceCents: 25 })
    await addLongTone({ perdeId: 'neva', durationMs: 5000, passed: true, toleranceCents: 20 })
    await addLongTone({ perdeId: 'neva', durationMs: 6000, passed: true, toleranceCents: 15 })
    await addLongTone({ perdeId: 'neva', durationMs: 900, passed: false, toleranceCents: 10 })
    render(<EveningPractice />)
    await begin()
    // 18 sent sapma: 15 sent toleransın dışında, 20'nin içinde. Tolerans 15 ise tutuş hiç başlamaz.
    blow(NEVA_HZ * 2 ** (18 / 1200), 1500)
    expect(await screen.findByText('Süre: 0,0 sn (en iyi 6,0 sn)')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    await screen.findByRole('button', { name: 'Devam' })
    const last = (await listLongTones('neva')).filter((r) => !r.passed).at(-1)!
    expect(last.toleranceCents).toBe(15)
  })

  it('ilk ses geçilmiş sayısından etkilenmez: tolerans 50 kalır', async () => {
    await addLongTone({ perdeId: 'ilk-ses', durationMs: 3000, passed: true, toleranceCents: 50 })
    await addLongTone({ perdeId: 'ilk-ses', durationMs: 3000, passed: true, toleranceCents: 50 })
    await saveSettings({ calibrated: true })
    await ilkSesDersiOkundu()
    await isaretEkle('okunanDersler', 'perde:neva')
    render(<EveningPractice />)
    await begin()
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    await screen.findByRole('button', { name: 'Devam' })
    const recs = await listLongTones('ilk-ses')
    expect(recs.at(-1)!.toleranceCents).toBe(50)
  })
  describe('başpâre adımı', () => {
    const BASPARE_ADIMI = { kind: 'baspare', label: 'Başpâre koy-çek', tries: 1, dersId: 's0:baspare' } as const

    async function oturumKur(steps: object[], stepIndex = 0) {
      await saveSession({
        id: 'baspareli',
        kind: 'aksam',
        date: todayLocal(),
        startedAt: new Date().toISOString(),
        completed: false,
        elapsedMs: 0,
        state: { steps, stepIndex, tryIndex: 0 },
      })
    }

    it('adım gömülü çizilir (başlık, adım sayacı, Başla); "Deneme x/1" sayacı çıkmaz', async () => {
      await saveSettings({ calibrated: true })
      await isaretEkle('okunanDersler', 's0:baspare')
      await oturumKur([BASPARE_ADIMI])
      render(<EveningPractice />)
      expect(await screen.findByRole('heading', { name: /Başpâre koy-çek/ })).toBeTruthy()
      expect(screen.getByText('Adım 1/1')).toBeTruthy()
      expect(screen.queryByText('Deneme 1/1')).toBeNull()
      expect(screen.getByText('Deneme 0/10')).toBeTruthy()
      expect(await screen.findByRole('button', { name: 'Başla' })).toBeTruthy()
      expect(screen.getByRole('link', { name: 'Ana ekrana dön' })).toBeTruthy()
    })

    it('tur kaydedilince "Devam" sonraki adıma geçer; son adımsa oturum biter', async () => {
      await saveSettings({ calibrated: true })
      await isaretEkle('okunanDersler', 's0:baspare')
      await oturumKur([BASPARE_ADIMI, { kind: 'uzun-ses', perdeId: 'neva', label: 'Uzun ses: Nevâ', tries: 1 }])
      render(<EveningPractice />)
      await begin()
      fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Devam' }))
      expect(await screen.findByRole('heading', { name: /Uzun ses: Nevâ/ })).toBeTruthy()
      expect(await listLongTones('baspare')).toHaveLength(1)
      expect(screen.getByText('Adım 2/2')).toBeTruthy()
    })

    it('son adım bitince oturum tamamlanır ve oturum sonuna gidilir', async () => {
      await saveSettings({ calibrated: true })
      await isaretEkle('okunanDersler', 's0:baspare')
      await oturumKur([BASPARE_ADIMI])
      render(<EveningPractice />)
      await begin()
      fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
      fireEvent.click(await screen.findByRole('button', { name: 'Devam' }))
      await waitFor(() => expect(location.hash).toBe('#/oturum-sonu'))
      expect((await listSessions())[0]).toMatchObject({ completed: true })
    })

    it('ders okunmamışsa önce ders gelir; "Anladım"dan sonra alıştırma açılır', async () => {
      await saveSettings({ calibrated: true })
      await oturumKur([BASPARE_ADIMI])
      render(<EveningPractice />)
      expect(await screen.findByRole('heading', { name: /Başpâreyi koy, çek/ })).toBeTruthy()
      expect(screen.queryByRole('button', { name: 'Başla' })).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
      expect(await screen.findByRole('button', { name: 'Başla' })).toBeTruthy()
    })

    it('kalibre değilse önce kalibrasyon gösterilir', async () => {
      await oturumKur([BASPARE_ADIMI])
      render(<EveningPractice />)
      expect(await screen.findByRole('heading', { name: 'Kalibrasyon' })).toBeTruthy()
      expect(screen.queryByText('Deneme 0/10')).toBeNull()
    })

    it('planı kuran akış: Nevâ geçilmiş, başpâre geçilmemişse güncel perdeden sonra başpâre gelir', async () => {
      await readyForPerde()
      await addLongTone({ perdeId: 'neva', durationMs: 4500, passed: true, toleranceCents: 25 })
      await isaretEkle('okunanDersler', 's0:baspare')
      render(<EveningPractice />)
      await screen.findByRole('heading', { name: /Uzun ses: Nevâ/ })
      const open = await getOpenSession('aksam')
      expect((open!.state as { steps: { kind: string }[] }).steps.map((s) => s.kind)).toEqual([
        'uzun-ses',
        'uzun-ses',
        'baspare',
      ])
    })

    it('tanınmayan adım türü (gelecekteki ya da bozuk kayıt) çökertmez: "Devam" sonraki adıma geçer', async () => {
      await saveSettings({ calibrated: true })
      await oturumKur([{ kind: 'bilinmeyen-tur', label: 'Gizemli adım', tries: 1 }])
      render(<EveningPractice />)
      expect(await screen.findByText('Bu adım tanınmadı.')).toBeTruthy()
      expect(screen.queryByRole('button', { name: 'Başla' })).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Devam' }))
      await waitFor(() => expect(location.hash).toBe('#/oturum-sonu'))
    })
  })

  describe('ders kapısı', () => {
    it('okunmamış s0:ilk-ses ile akşam açılınca ders görünür, "Başla" görünmez; "Anladım"dan sonra trainer görünür', async () => {
      render(<EveningPractice />)
      expect(await screen.findByRole('heading', { name: /Dudak ve ilk ses/ })).toBeTruthy()
      expect(screen.queryByRole('button', { name: 'Başla' })).toBeNull()
      expect(startPitchStream).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
      expect(await screen.findByRole('heading', { name: /İlk ses/ })).toBeTruthy()
      expect(screen.queryByRole('heading', { name: /Dudak ve ilk ses/ })).toBeNull()
      await begin()
      blow(300, 3200)
      expect(await screen.findByText(/Geçtin/)).toBeTruthy()
      // Aynı adımın sonraki denemesinde ders yeniden gelmez.
      fireEvent.click(await screen.findByRole('button', { name: 'Devam' }))
      expect(await screen.findByText('Deneme 2/3')).toBeTruthy()
      expect(screen.queryByRole('heading', { name: /Dudak ve ilk ses/ })).toBeNull()
    })

    it('ders okunmuşsa doğrudan trainer görünür', async () => {
      await ilkSesDersiOkundu()
      render(<EveningPractice />)
      expect(await screen.findByRole('button', { name: 'Başla' })).toBeTruthy()
      expect(screen.queryByRole('heading', { name: /Dudak ve ilk ses/ })).toBeNull()
    })

    it('kalibrasyon adımında ilk ses dersi okunmamış olsa da ders değil kalibrasyon görünür', async () => {
      await addLongTone({ perdeId: 'ilk-ses', durationMs: 3000, passed: true, toleranceCents: 50 })
      await saveSession({
        id: 'kalibrasyonda',
        kind: 'aksam',
        date: todayLocal(),
        startedAt: new Date().toISOString(),
        completed: false,
        elapsedMs: 0,
        state: {
          steps: [
            { kind: 'ilk-ses', label: 'İlk ses', tries: 1, dersId: 's0:ilk-ses' },
            { kind: 'kalibrasyon', label: 'Kalibrasyon', tries: 1 },
          ],
          stepIndex: 1,
          tryIndex: 0,
        },
      })
      render(<EveningPractice />)
      expect(await screen.findByRole('heading', { name: 'Kalibrasyon' })).toBeTruthy()
      expect(screen.queryByRole('heading', { name: /Dudak ve ilk ses/ })).toBeNull()
    })

    it('güncel perde adımında ders kapısı çıkar; "Anladım"dan sonra trainer gelir, sonraki denemede ders gelmez', async () => {
      await readyForPerdeDerssiz()
      render(<EveningPractice />)
      expect(await screen.findByRole('heading', { name: /Nevâ perdesi/ })).toBeTruthy()
      expect(screen.queryByRole('button', { name: 'Başla' })).toBeNull()
      expect(startPitchStream).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
      expect(await screen.findByRole('heading', { name: /Uzun ses: Nevâ/ })).toBeTruthy()
      await finishTry()
      expect(await screen.findByText('Deneme 2/3')).toBeTruthy()
      expect(screen.queryByRole('heading', { name: /Nevâ perdesi/ })).toBeNull()
    })

    it('ısınma adımı (geçilmiş perde) ders göstermez; sonraki güncel perde adımı kendi dersini gösterir', async () => {
      await readyForPerdeDerssiz()
      await addLongTone({ perdeId: 'neva', durationMs: 4500, passed: true, toleranceCents: 25 })
      render(<EveningPractice />)
      expect(await screen.findByRole('heading', { name: /Uzun ses: Nevâ/ })).toBeTruthy()
      expect(screen.queryByRole('heading', { name: /Nevâ perdesi/ })).toBeNull()
      await finishTry()
      expect(await screen.findByRole('heading', { name: /Çârgâh perdesi/ })).toBeTruthy()
      expect(screen.queryByRole('button', { name: 'Başla' })).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
      expect(await screen.findByRole('heading', { name: /Uzun ses: Çârgâh/ })).toBeTruthy()
    })

    it('dersId taşımayan eski açık oturum kapısız açılır', async () => {
      await saveSession({
        id: 'eski-bugun',
        kind: 'aksam',
        date: todayLocal(),
        startedAt: new Date().toISOString(),
        completed: false,
        elapsedMs: 0,
        state: { steps: [{ kind: 'ilk-ses', label: 'İlk ses', tries: 3 }], stepIndex: 0, tryIndex: 1 },
      })
      render(<EveningPractice />)
      expect(await screen.findByText('Deneme 2/3')).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Başla' })).toBeTruthy()
      expect(screen.queryByRole('heading', { name: /Dudak ve ilk ses/ })).toBeNull()
    })
  })
})
