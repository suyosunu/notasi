import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PitchSample } from '../audio/mic'
import { NEY_PERDELER } from '../content/ney-perdeler'
import { DEFAULT_TUNING, soundingHz } from '../music/ahenk'
import { addLongTone, listLongTones, listSessions, resetDbForTests, saveSettings } from '../store/db'

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

describe('NeySection', () => {
  it('perdeleri durum ikonlarıyla listeler', async () => {
    await addLongTone({ perdeId: 'neva', durationMs: 4000, passed: true, toleranceCents: 25 })
    render(<NeySection />)
    await screen.findByText('Nevâ')
    expect(screen.getAllByRole('listitem')).toHaveLength(NEY_PERDELER.length)
    expect(within(row('Nevâ')).getByText('✓')).toBeTruthy()
    expect(within(row('Çârgâh')).getByText('▶')).toBeTruthy()
    expect(within(row('Bûselik')).getByText('🔒')).toBeTruthy()
    expect(within(row('Rast')).getByText('🔒')).toBeTruthy()
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

  it('altta "Yeniden kalibre et" bağlantısı vardır', async () => {
    render(<NeySection />)
    const link = await screen.findByRole('link', { name: 'Yeniden kalibre et' })
    expect(link.getAttribute('href')).toBe('#/kalibrasyon')
  })
})

describe('NeyPerdePractice', () => {
  it('tek perde uzun sesi kayıt yazar, oturum açmaz', async () => {
    await saveSettings({ calibrated: true })
    render(<NeyPerdePractice perdeId="neva" />)
    const btn = await screen.findByRole('button', { name: 'Başla' })
    await waitFor(() => expect((btn as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(btn)
    await waitFor(() => expect(emit).not.toBeNull())
    const hz = soundingHz(NEY_PERDELER[0]!.written, DEFAULT_TUNING)
    act(() => {
      for (let t = 0; t <= 4500; t += 50) emit!({ t, hz, clarity: 0.99 })
    })
    expect(await screen.findByText(/Geçtin/)).toBeTruthy()
    await waitFor(async () => expect((await listLongTones('neva')).some((r) => r.passed)).toBe(true))
    expect(await listSessions()).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Tekrar dene' }))
    expect(await screen.findByRole('button', { name: 'Başla' })).toBeTruthy()
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
    // 1 geçiş − 1 başarısız = düzey 0: tolerans 25, süre 4 sn.
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
