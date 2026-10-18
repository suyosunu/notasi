import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PitchSample } from '../audio/mic'
import { ILK_SES_REHBER } from '../content/ney-perdeler'
import { buildPlacement } from '../learning/placement'
import { getSettings, listAttempts, listLongTones, listTopics, resetDbForTests } from '../store/db'
import { seededRng } from '../util/rng'

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

import { Placement } from './Placement'

const SEED = 42

beforeEach(async () => {
  await resetDbForTests()
  emit = null
  location.hash = '#/yoklama'
})
afterEach(() => {
  cleanup()
  location.hash = ''
})

/** Aynı tohumla üretilen sorular: doğru cevapları bilmek için. */
const questions = () => buildPlacement(seededRng(SEED))

async function answerAll(correct: (topicId: string) => boolean) {
  for (const [i, q] of questions().entries()) {
    await screen.findByText(`${i + 1}/8`)
    const wrong = q.options.find((o) => o !== q.answer)!
    fireEvent.click(await screen.findByRole('button', { name: correct(q.topicId) ? q.answer : wrong }))
  }
}

describe('Placement', () => {
  it('giriş yazısı, sayaç; ipucu ve dinle düğmesi yok; doğru/yanlış gösterilmez', async () => {
    render(<Placement seed={SEED} />)
    expect(await screen.findByText('Önce ne hatırladığınıza bakalım')).toBeTruthy()
    expect(screen.getByText('1/8')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /İpucu/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /Dinle/ })).toBeNull()
    const q = questions()[0]!
    fireEvent.click(await screen.findByRole('button', { name: q.options.find((o) => o !== q.answer)! }))
    expect(await screen.findByText('2/8')).toBeTruthy()
    expect(screen.queryByText(/Doğru|Yanlış/)).toBeNull()
  })

  it('çift dokunuş aynı soruyu iki kez cevaplamaz', async () => {
    render(<Placement seed={SEED} />)
    const q = questions()[0]!
    const btn = await screen.findByRole('button', { name: q.answer })
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(await screen.findByText('2/8')).toBeTruthy()
    expect(screen.queryByText('3/8')).toBeNull()
  })

  it('8 sorudan sonra "Neyiniz yanınızda mı?" sorulur', async () => {
    render(<Placement seed={SEED} />)
    await answerAll(() => true)
    expect(await screen.findByText('Neyiniz yanınızda mı?')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Evet' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Şimdi değil' })).toBeTruthy()
  })

  it('hepsi doğru + Şimdi değil: iki konu atlanır, placementDone kaydedilir, deneme yazılmaz', async () => {
    render(<Placement seed={SEED} />)
    await answerAll(() => true)
    fireEvent.click(await screen.findByRole('button', { name: 'Şimdi değil' }))
    expect(await screen.findByText('Hazırız!')).toBeTruthy()
    expect(screen.getByText('La ve Sol konusundan başlıyoruz.')).toBeTruthy()
    expect((await getSettings()).placementDone).toBe(true)
    const topics = await listTopics()
    expect(topics.filter((t) => t.placedOut).map((t) => t.id).sort()).toEqual(['nota-1', 'sure-1'])
    expect(await listAttempts()).toHaveLength(0)
    expect(await listLongTones()).toHaveLength(0)
  })

  it('sadece nota-1 tam doğruysa süre konusu atlanmaz; başlangıç konusu sure-1 olur', async () => {
    render(<Placement seed={SEED} />)
    await answerAll((t) => t === 'nota-1')
    fireEvent.click(await screen.findByRole('button', { name: 'Şimdi değil' }))
    expect(await screen.findByText('Birlik, ikilik, dörtlük konusundan başlıyoruz.')).toBeTruthy()
    expect((await listTopics()).map((t) => t.id)).toEqual(['nota-1'])
  })

  it('hepsi yanlış: hiçbir konu atlanmaz, ilk konudan başlanır', async () => {
    render(<Placement seed={SEED} />)
    await answerAll(() => false)
    fireEvent.click(await screen.findByRole('button', { name: 'Şimdi değil' }))
    expect(await screen.findByText('Re, Do, Si konusundan başlıyoruz.')).toBeTruthy()
    expect(await listTopics()).toHaveLength(0)
    expect((await getSettings()).placementDone).toBe(true)
  })

  it('"Ana ekrana" ana ekrana götürür', async () => {
    render(<Placement seed={SEED} />)
    await answerAll(() => false)
    fireEvent.click(await screen.findByRole('button', { name: 'Şimdi değil' }))
    await screen.findByText('Hazırız!')
    fireEvent.click(screen.getByRole('button', { name: 'Ana ekrana' }))
    expect(location.hash).toBe('#/')
  })

  it('Evet: tek bir ilk ses denemesi yapılır, geçerse kaydedilir, sonra sonuç gelir', async () => {
    render(<Placement seed={SEED} />)
    await answerAll(() => false)
    fireEvent.click(await screen.findByRole('button', { name: 'Evet' }))
    expect(await screen.findByText(ILK_SES_REHBER[0]!)).toBeTruthy()
    const btn = await screen.findByRole('button', { name: 'Başla' })
    await waitFor(() => expect((btn as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(btn)
    await waitFor(() => expect(emit).not.toBeNull())
    act(() => {
      for (let t = 0; t <= 3200; t += 50) emit!({ t: 1000 + t, hz: 300, clarity: 0.99 })
    })
    expect(await screen.findByText(/Geçtin/)).toBeTruthy()
    await waitFor(async () => expect((await listLongTones('ilk-ses')).some((r) => r.passed)).toBe(true))
    expect((await listLongTones('ilk-ses'))[0]!.toleranceCents).toBe(50)
    fireEvent.click(await screen.findByRole('button', { name: 'Devam' }))
    expect(await screen.findByText('Hazırız!')).toBeTruthy()
    expect((await getSettings()).placementDone).toBe(true)
    expect(await listLongTones('ilk-ses')).toHaveLength(1)
  })

  it('Evet: Bitir ile bırakılsa da akış sürer (başarısız kayıt)', async () => {
    render(<Placement seed={SEED} />)
    await answerAll(() => false)
    fireEvent.click(await screen.findByRole('button', { name: 'Evet' }))
    const btn = await screen.findByRole('button', { name: 'Başla' })
    await waitFor(() => expect((btn as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(btn)
    fireEvent.click(await screen.findByRole('button', { name: 'Bitir' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Devam' }))
    expect(await screen.findByText('Hazırız!')).toBeTruthy()
    const recs = await listLongTones('ilk-ses')
    expect(recs).toHaveLength(1)
    expect(recs[0]!.passed).toBe(false)
  })
})
