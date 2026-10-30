import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PitchSample } from '../audio/mic'
import { ETUTLER } from '../content/etutler'
import { NEY_PERDELER } from '../content/ney-perdeler'
import { NOTA_TOPICS } from '../content/nota-topics'
import { DEFAULT_TUNING, soundingHz } from '../music/ahenk'
import { addLongTone, isaretEkle, listLongTones, listSessions, resetDbForTests, saveSettings, setPlacedOut } from '../store/db'

let emit: ((s: PitchSample) => void) | null = null
vi.mock('../audio/mic', async (orig) => {
  const actual = await orig<typeof import('../audio/mic')>()
  return {
    ...actual,
    startPitchStream: async (cb: (s: PitchSample) => void) => {
      emit = cb
      return () => undefined
    },
  }
})
vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playWritten: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
}))

import { NeyPerdePractice, NeySection } from './NeySection'

beforeEach(async () => {
  await resetDbForTests()
  emit = null
  location.hash = ''
})
afterEach(() => {
  cleanup()
  location.hash = ''
})

function row(name: string): HTMLElement {
  return screen.getByText(name).closest('li') as HTMLElement
}

/** Dersi olan beş perde; trainer testlerinde dersleri okunmuş sayılır, kapı açılır. */
const DERSLI = ['neva', 'cargah', 'segah', 'dugah', 'rast']
async function perdeDersleriOkundu() {
  await isaretEkle('okunanDersler', 's0:uzun-ses')
  for (const id of DERSLI) await isaretEkle('okunanDersler', `perde:${id}`)
}

describe('NeySection', () => {
  it('perdeleri durum ikonlarıyla listeler', async () => {
    await addLongTone({ perdeId: 'neva', durationMs: 4000, passed: true, toleranceCents: 25 })
    render(<NeySection />)
    await screen.findByText('Nevâ')
    expect(within(screen.getAllByRole('list')[0]!).getAllByRole('listitem')).toHaveLength(NEY_PERDELER.length)
    expect(within(row('Nevâ')).getByText('✓')).toBeTruthy()
    expect(within(row('Çârgâh')).getByText('▶')).toBeTruthy()
    expect(within(row('Bûselik')).getByText('🔒')).toBeTruthy()
    expect(within(row('Rast')).getByText('🔒')).toBeTruthy()
  })

  it('Si ailesi satırları işaretli nota etiketiyle ayırt edilir', async () => {
    render(<NeySection />)
    await screen.findByText('Nevâ')
    expect(within(row('Bûselik')).getByText('Si')).toBeTruthy()
    expect(within(row('Segâh')).getByText('Si (koma bemolü)')).toBeTruthy()
    expect(within(row('Kürdî')).getByText('Si (küçük mücenneb bemolü)')).toBeTruthy()
    expect(within(row('Dik Kürdî')).getByText('Si (bakiye bemolü)')).toBeTruthy()
    expect(within(row('Nim Hicaz')).getByText('Do (bakiye diyezi)')).toBeTruthy()
    expect(within(row('Eviç')).getByText('Fa (bakiye diyezi)')).toBeTruthy()
    expect(within(row('Nevâ')).getByText('Re')).toBeTruthy()
  })

  it('açık ve geçilmiş perdeye dokununca o perdenin uzun sesi açılır; kilitli dokunulamaz', async () => {
    await addLongTone({ perdeId: 'neva', durationMs: 4000, passed: true, toleranceCents: 25 })
    render(<NeySection />)
    fireEvent.click(await screen.findByRole('button', { name: /Nevâ/ }))
    await waitFor(() => expect(location.hash).toBe('#/ney/neva'))
    fireEvent.click(screen.getByRole('button', { name: /Çârgâh/ }))
    await waitFor(() => expect(location.hash).toBe('#/ney/cargah'))
    expect(screen.queryByRole('button', { name: /Bûselik/ })).toBeNull()
  })

  it('yeni perdeler listelenir; Rast geçilse de nota konusu kilitliyse Hüseynî kilitli kalır', async () => {
    for (const id of ['neva', 'cargah', 'buselik', 'dugah', 'rast']) {
      await addLongTone({ perdeId: id, durationMs: 4000, passed: true, toleranceCents: 25 })
    }
    render(<NeySection />)
    await screen.findByText('Hüseynî')
    for (const name of ['Hüseynî', 'Acem', 'Gerdâniye (açık)', 'Muhayyer (açık)', 'Segâh', 'Kürdî', 'Dik Kürdî', 'Nim Hicaz', 'Eviç']) {
      expect(screen.getByText(name)).toBeTruthy()
    }
    expect(screen.queryByText(/Irak/)).toBeNull()
    expect(within(row('Hüseynî')).getByText('🔒')).toBeTruthy()
  })

  it('perde-2 açılınca Hüseynî açılır ve /ney/huseyni yönlenir', async () => {
    for (const id of ['neva', 'cargah', 'buselik', 'dugah', 'rast']) {
      await addLongTone({ perdeId: id, durationMs: 4000, passed: true, toleranceCents: 25 })
    }
    // perde-2 en sondadır: açılması için önündeki bütün konular öğrenilmiş olmalıdır.
    for (const id of NOTA_TOPICS.map((t) => t.id)) if (id !== 'perde-2') await setPlacedOut(id)
    render(<NeySection />)
    await screen.findByText('Hüseynî')
    expect(within(row('Hüseynî')).getByText('▶')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Hüseynî/ }))
    await waitFor(() => expect(location.hash).toBe('#/ney/huseyni'))
    expect(screen.queryByRole('button', { name: /Acem/ })).toBeNull()
  })

  it('dersi olan perdenin yanında 📖 ders bağlantısı vardır; kilitli perdede de görünür, dersi olmayanda yoktur', async () => {
    render(<NeySection />)
    await screen.findByText('Nevâ')
    const link = within(row('Nevâ')).getByRole('link', { name: 'Nevâ dersi' })
    expect(link.textContent).toBe('📖')
    expect(link.getAttribute('href')).toBe('#/ders/perde%3Aneva')
    // Rast kilitli, ama ders okumak serbesttir.
    expect(within(row('Rast')).getByText('🔒')).toBeTruthy()
    expect(within(row('Rast')).getByRole('link', { name: 'Rast dersi' }).getAttribute('href')).toBe('#/ders/perde%3Arast')
    for (const name of ['Çârgâh', 'Segâh', 'Dügâh']) expect(within(row(name)).getByRole('link', { name: `${name} dersi` })).toBeTruthy()
    expect(within(row('Hüseynî')).queryByRole('link')).toBeNull()
  })

  it('Bûselik satırında ders bağlantısı görünür; Kürdî, Dik Kürdî ve Nim Hicaz için de', async () => {
    render(<NeySection />)
    await screen.findByText('Nevâ')
    const link = within(row('Bûselik')).getByRole('link', { name: 'Bûselik dersi' })
    expect(link.textContent).toBe('📖')
    expect(link.getAttribute('href')).toBe('#/ders/perde%3Abuselik')
    expect(within(row('Kürdî')).getByRole('link', { name: 'Kürdî dersi' }).getAttribute('href')).toBe('#/ders/perde%3Akurdi')
    expect(within(row('Dik Kürdî')).getByRole('link', { name: 'Dik Kürdî dersi' }).getAttribute('href')).toBe('#/ders/perde%3Adik-kurdi')
    expect(within(row('Nim Hicaz')).getByRole('link', { name: 'Nim Hicaz dersi' }).getAttribute('href')).toBe('#/ders/perde%3Anim-hicaz')
  })

  describe('Etütler', () => {
    /** Başlığı tam eşleşen etüt bağlantısı (✓ ve başlık aynı bağlantıdadır). */
    const etutSatiri = (baslik: string) => {
      const a = screen.getAllByRole('link').find((l) => l.querySelector('.topic-title')?.textContent === baslik)
      if (!a) throw new Error(`Etüt bağlantısı yok: ${baslik}`)
      return a
    }

    it('perde listesinin altında "Etütler" başlığı vardır; etütler Seviye 1 ve Seviye 2 başlıkları altında', async () => {
      render(<NeySection />)
      const baslik = await screen.findByRole('heading', { name: 'Etütler' })
      // Etütler perde listesinin altındadır.
      const perdeListesi = screen.getAllByRole('list')[0]!
      expect(perdeListesi.compareDocumentPosition(baslik) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      for (const seviye of [1, 2] as const) {
        const alt = screen.getByRole('heading', { name: `Seviye ${seviye} etütleri` })
        expect(baslik.compareDocumentPosition(alt) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
        const liste = alt.nextElementSibling as HTMLElement
        const linkler = within(liste).getAllByRole('link')
        const beklenen = ETUTLER.filter((e) => e.seviye === seviye)
        expect(linkler).toHaveLength(seviye === 1 ? 11 : 7)
        expect(linkler.map((a) => a.getAttribute('href'))).toEqual(beklenen.map((e) => `#/etut/${e.id}`))
        for (const [i, e] of beklenen.entries()) expect(linkler[i]!.textContent).toContain(e.baslik)
      }
    })

    it('"Seviye 3 etütleri" başlığı ve dokuz etüt', async () => {
      render(<NeySection />)
      const baslik = await screen.findByRole('heading', { name: 'Seviye 3 etütleri' })
      const linkler = within(baslik.nextElementSibling as HTMLElement).getAllByRole('link')
      const beklenen = ETUTLER.filter((e) => e.seviye === 3)
      expect(linkler).toHaveLength(9)
      expect(linkler.map((a) => a.getAttribute('href'))).toEqual(beklenen.map((e) => `#/etut/${e.id}`))
      expect(linkler[0]!.textContent).toContain('Aynı parmak: Dügâh–Hüseynî')
    })

    it('çalınan etütte ✓ vardır, çalınmayanda yoktur', async () => {
      await isaretEkle('calinanEtutler', 'tek-neva')
      render(<NeySection />)
      await screen.findByRole('heading', { name: 'Etütler' })
      expect(within(etutSatiri('Tek perde: Nevâ')).getByRole('img', { name: 'çalındı' }).textContent).toBe('✓')
      expect(within(etutSatiri('Tek perde: Çârgâh')).queryByRole('img', { name: 'çalındı' })).toBeNull()
    })

    it('perdeleri henüz geçilmemiş etüt soluk gösterilir ama tıklanabilir (kilit yok)', async () => {
      await addLongTone({ perdeId: 'neva', durationMs: 4000, passed: true, toleranceCents: 25 })
      render(<NeySection />)
      await screen.findByRole('heading', { name: 'Etütler' })
      expect(etutSatiri('Tek perde: Nevâ').getAttribute('data-soluk')).toBe('false')
      for (const baslik of ['Tek perde: Çârgâh', 'İki perde: Nevâ–Çârgâh', 'Rast beşlisi 1 (dörtlükler)']) {
        const a = etutSatiri(baslik)
        expect(a.getAttribute('data-soluk')).toBe('true')
        expect(a.getAttribute('href')).toMatch(/^#\/etut\//)
        expect(a.getAttribute('aria-disabled')).toBeNull()
      }
    })

    it('bütün perdeleri geçilmiş etütler soluk değildir; ara sesleri geçilmemiş dörtlü etüdü soluktur', async () => {
      for (const id of ['neva', 'cargah', 'segah', 'dugah', 'rast']) {
        await addLongTone({ perdeId: id, durationMs: 4000, passed: true, toleranceCents: 25 })
      }
      render(<NeySection />)
      await screen.findByRole('heading', { name: 'Etütler' })
      for (const e of ETUTLER.filter((x) => x.seviye === 1 || x.tur === 'usul' || x.tur === 'dil')) {
        expect(etutSatiri(e.baslik).getAttribute('data-soluk'), e.id).toBe('false')
      }
      for (const e of ETUTLER.filter((x) => x.tur === 'dortlu')) {
        expect(etutSatiri(e.baslik).getAttribute('data-soluk'), e.id).toBe('true')
      }
    })
  })

  it('altta "Yeniden kalibre et" bağlantısı vardır', async () => {
    render(<NeySection />)
    const link = await screen.findByRole('link', { name: 'Yeniden kalibre et' })
    expect(link.getAttribute('href')).toBe('#/kalibrasyon')
  })
})

describe('NeyPerdePractice ders kapısı', () => {
  it('/ney/neva taze: önce gösterge dersi, sonra Nevâ dersi, sonra trainer; s0:uzun-ses okunmuşsa yalnız Nevâ dersi', async () => {
    await saveSettings({ calibrated: true })
    render(<NeyPerdePractice perdeId="neva" />)
    expect(await screen.findByRole('heading', { name: /Uzun ses ve akort göstergesi/ })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Nevâ perdesi/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    expect(await screen.findByRole('heading', { name: /Nevâ perdesi/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Başla' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    expect(await screen.findByRole('button', { name: 'Başla' })).toBeTruthy()
  })

  it('/ney/neva: s0:uzun-ses okunmuşsa yalnız Nevâ dersi gelir', async () => {
    await saveSettings({ calibrated: true })
    await isaretEkle('okunanDersler', 's0:uzun-ses')
    render(<NeyPerdePractice perdeId="neva" />)
    expect(await screen.findByRole('heading', { name: /Nevâ perdesi/ })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Uzun ses ve akort göstergesi/ })).toBeNull()
  })

  it('/ney/neva okunmamış derste önce ders gelir; "Anladım"dan sonra trainer görünür', async () => {
    await saveSettings({ calibrated: true })
    await isaretEkle('okunanDersler', 's0:uzun-ses')
    render(<NeyPerdePractice perdeId="neva" />)
    expect(await screen.findByRole('heading', { name: /Nevâ perdesi/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Başla' })).toBeNull()
    expect(screen.queryByRole('heading', { name: /Uzun ses: Nevâ/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    expect(await screen.findByRole('heading', { name: /Uzun ses: Nevâ/ })).toBeTruthy()
    expect(await screen.findByRole('button', { name: 'Başla' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Nevâ perdesi/ })).toBeNull()
  })

  it('ders okunmuşsa doğrudan trainer görünür', async () => {
    await saveSettings({ calibrated: true })
    await isaretEkle('okunanDersler', 's0:uzun-ses')
    await isaretEkle('okunanDersler', 'perde:neva')
    render(<NeyPerdePractice perdeId="neva" />)
    expect(await screen.findByRole('button', { name: 'Başla' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Nevâ perdesi/ })).toBeNull()
  })

  it('kalibre değilse ders değil önce kalibrasyon gelir', async () => {
    render(<NeyPerdePractice perdeId="neva" />)
    expect(await screen.findByRole('heading', { name: 'Kalibrasyon' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Nevâ perdesi/ })).toBeNull()
  })

  it('kilitli perdede ders kapısı çıkmaz, "henüz açılmadı" görünür', async () => {
    await saveSettings({ calibrated: true })
    render(<NeyPerdePractice perdeId="rast" />)
    expect(await screen.findByText('Bu perde henüz açılmadı.')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Rast perdesi/ })).toBeNull()
  })

  it('dersi olmayan perde (Hüseynî) kapısız açılır', async () => {
    await saveSettings({ calibrated: true })
    for (const id of ['neva', 'cargah', 'segah', 'dugah', 'rast']) {
      await addLongTone({ perdeId: id, durationMs: 4000, passed: true, toleranceCents: 25 })
    }
    for (const id of NOTA_TOPICS.map((t) => t.id)) await setPlacedOut(id)
    render(<NeyPerdePractice perdeId="huseyni" />)
    expect(await screen.findByRole('button', { name: 'Başla' })).toBeTruthy()
  })
})

describe('NeyPerdePractice', () => {
  beforeEach(perdeDersleriOkundu)

  it('tek perde uzun sesi kayıt yazar, oturum açmaz', async () => {
    await saveSettings({ calibrated: true })
    render(<NeyPerdePractice perdeId="neva" />)
    const btn = await screen.findByRole('button', { name: 'Başla' })
    await waitFor(() => expect((btn as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(btn)
    await waitFor(() => expect(emit).not.toBeNull())
    const hz = soundingHz(NEY_PERDELER[0]!.written, DEFAULT_TUNING)
    act(() => {
      for (let t = 0; t <= 5500; t += 50) emit!({ t, hz, clarity: 0.99 })
    })
    expect(await screen.findByText(/Geçtin/)).toBeTruthy()
    await waitFor(async () => expect((await listLongTones('neva')).some((r) => r.passed)).toBe(true))
    expect(await listSessions()).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Tekrar dene' }))
    expect(await screen.findByRole('button', { name: 'Başla' })).toBeTruthy()
  })

  it('son 5 deneme en yeniden eskiye "Son denemeler" olarak gösterilir ve her denemeden sonra güncellenir', async () => {
    await saveSettings({ calibrated: true })
    vi.useFakeTimers({ toFake: ['Date'] })
    for (const [i, ms] of [1000, 3200, 4000, 1500, 2600, 900].entries()) {
      vi.setSystemTime(new Date(2026, 9, 13, 20, i))
      await addLongTone({ perdeId: 'neva', durationMs: ms, passed: false, toleranceCents: 25 })
    }
    vi.useRealTimers()
    await addLongTone({ perdeId: 'dugah', durationMs: 9900, passed: true, toleranceCents: 25 })
    render(<NeyPerdePractice perdeId="neva" />)
    expect(await screen.findByText('Son denemeler: 0,9 · 2,6 · 1,5 · 4,0 · 3,2 sn')).toBeTruthy()
    const btn = await screen.findByRole('button', { name: 'Başla' })
    await waitFor(() => expect((btn as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(btn)
    await waitFor(() => expect(emit).not.toBeNull())
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    expect(await screen.findByText('Son denemeler: 0,0 · 0,9 · 2,6 · 1,5 · 4,0 sn')).toBeTruthy()
  })

  it('işaretli yeni perde (Segâh) kendi koma konumuna göre geçilir ve kaydı yazılır', async () => {
    await saveSettings({ calibrated: true })
    for (const id of ['neva', 'cargah', 'buselik', 'dugah', 'rast', 'huseyni', 'acem', 'gerdaniye', 'muhayyer']) {
      await addLongTone({ perdeId: id, durationMs: 4000, passed: true, toleranceCents: 25 })
    }
    for (const id of NOTA_TOPICS.map((t) => t.id)) if (id !== 'perde-3' && id !== 'perde-4') await setPlacedOut(id)
    render(<NeyPerdePractice perdeId="segah" />)
    const btn = await screen.findByRole('button', { name: 'Başla' })
    await waitFor(() => expect((btn as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(btn)
    await waitFor(() => expect(emit).not.toBeNull())
    const segah = NEY_PERDELER.find((p) => p.id === 'segah')!
    const hz = soundingHz(segah.written, DEFAULT_TUNING)
    expect(hz).not.toBeCloseTo(soundingHz({ step: 'B', octave: 4, acc: 0 }, DEFAULT_TUNING), 0)
    act(() => {
      for (let t = 0; t <= 5500; t += 50) emit!({ t, hz, clarity: 0.99 })
    })
    expect(await screen.findByText(/Geçtin/)).toBeTruthy()
    await waitFor(async () => expect((await listLongTones('segah')).some((r) => r.passed)).toBe(true))
  })

  it('hiç deneme yoksa "Son denemeler" satırı yoktur', async () => {
    await saveSettings({ calibrated: true })
    render(<NeyPerdePractice perdeId="neva" />)
    await screen.findByRole('button', { name: 'Başla' })
    expect(screen.queryByText(/Son denemeler/)).toBeNull()
  })

  it('kalibre değilse önce kalibrasyon gösterilir', async () => {
    render(<NeyPerdePractice perdeId="neva" />)
    expect(await screen.findByRole('heading', { name: 'Kalibrasyon' })).toBeTruthy()
  })

  it('kalibrasyonda "Şimdi değil" Ney bölümüne döner', async () => {
    location.hash = '#/ney/neva'
    render(<NeyPerdePractice perdeId="neva" />)
    await screen.findByRole('heading', { name: 'Kalibrasyon' })
    fireEvent.click(screen.getByRole('button', { name: 'Şimdi değil' }))
    expect(location.hash).toBe('#/ney')
  })

  it('kilitli perde açılmaz', async () => {
    await saveSettings({ calibrated: true })
    render(<NeyPerdePractice perdeId="rast" />)
    expect(await screen.findByText('Bu perde henüz açılmadı.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Başla' })).toBeNull()
    expect(screen.queryByRole('img', { name: /parmak şeması/ })).toBeNull()
  })

  it('düzey son denemeleri izler: geçiş daraltır, başarısız deneme geri gevşetir', async () => {
    await saveSettings({ calibrated: true })
    await addLongTone({ perdeId: 'neva', durationMs: 4000, passed: true, toleranceCents: 25 })
    await addLongTone({ perdeId: 'neva', durationMs: 900, passed: false, toleranceCents: 20 })
    render(<NeyPerdePractice perdeId="neva" />)
    const start = async () => {
      const btn = await screen.findByRole('button', { name: 'Başla' })
      await waitFor(() => expect((btn as HTMLButtonElement).disabled).toBe(false))
      emit = null
      fireEvent.click(btn)
      await waitFor(() => expect(emit).not.toBeNull())
    }
    // 1 geçiş − 1 başarısız = düzey 0: tolerans 25, süre 5 sn.
    await start()
    const hz = soundingHz(NEY_PERDELER[0]!.written, DEFAULT_TUNING)
    act(() => {
      for (let t = 0; t <= 5200; t += 50) emit!({ t, hz, clarity: 0.99 })
    })
    expect(await screen.findByText(/Geçtin/)).toBeTruthy()
    await waitFor(async () => expect((await listLongTones('neva')).filter((r) => r.passed)).toHaveLength(2))
    // 2 geçiş − 1 başarısız = düzey 1: yeni deneme tolerans 20.
    fireEvent.click(await screen.findByRole('button', { name: 'Tekrar dene' }))
    await start()
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    await waitFor(async () => expect(await listLongTones('neva')).toHaveLength(4))
    // Bu başarısız deneme düzeyi 0'a indirir: sonraki deneme yine tolerans 25.
    fireEvent.click(await screen.findByRole('button', { name: 'Tekrar dene' }))
    await start()
    fireEvent.click(screen.getByRole('button', { name: 'Bitir' }))
    await waitFor(async () => expect(await listLongTones('neva')).toHaveLength(5))
    const recs = await listLongTones('neva')
    expect(recs.filter((r) => r.passed)[1]!.toleranceCents).toBe(25)
    expect(recs.slice(-2).map((r) => r.toleranceCents)).toEqual([20, 25])
  })
})
