import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playWritten, unlockAudio } from '../audio/player'
import { DAY_CAP_MS, loadOrStartDaySession } from '../learning/day-session'
import type { DayState } from '../learning/day-session'
import { makeQuestion, seededRng } from '../learning/questions'
import { addAttempt, getOpenSession, listAttempts, listCards, resetDbForTests, saveSession, saveSettings } from '../store/db'
import { DayPractice } from './DayPractice'

vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playWritten: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
}))

const REVIEW_NOTE = 'Biraz önceki konuyu tekrar edelim, sonra devam ederiz.'
const WARNING = 'Ses çalınamadı. Telefonun sessiz düğmesini kontrol edin.'

beforeEach(async () => {
  await resetDbForTests()
  vi.mocked(unlockAudio).mockClear()
  vi.mocked(playWritten).mockReset()
  vi.mocked(playWritten).mockImplementation(() => Promise.resolve())
  location.hash = ''
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  Reflect.deleteProperty(document, 'visibilityState')
})

async function currentQuestion() {
  await screen.findByText(/Nota okuma · \d+\/\d+/)
  const s = (await getOpenSession('gunduz'))!
  const st = s.state as DayState
  return st.questions[st.index]!
}

describe('DayPractice (gündüz oturumu)', () => {
  it('soru kartının başında ana ekrana dönen "← Ara ver" bağlantısı vardır; oturum açık kalır', async () => {
    render(<DayPractice />)
    await currentQuestion()
    const link = screen.getByRole('link', { name: '← Ara ver' })
    expect(link.getAttribute('href')).toBe('#/')
    expect(link.closest('header')).toBeTruthy()
    expect(await getOpenSession('gunduz')).toBeTruthy()
  })

  it('shows the header and shows "Doğru" after clicking the right option', async () => {
    render(<DayPractice />)
    const q = await currentQuestion()
    expect(screen.getByText('☀️ Nota okuma · 1/12')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: q.answer }))
    expect(await screen.findByText('Doğru 👏')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Devam' })).toBeTruthy()
    await waitFor(async () => expect(await listAttempts()).toHaveLength(1))
  })

  it('shows the correct answer after a wrong click, disables options until "Devam", then advances', async () => {
    render(<DayPractice />)
    const q = await currentQuestion()
    const wrong = q.options.find((o) => o !== q.answer)!
    fireEvent.click(screen.getByRole('button', { name: wrong }))
    expect(await screen.findByText(`Yanlış — doğru cevap: ${q.answer}`)).toBeTruthy()
    for (const o of q.options) {
      expect((screen.getByRole('button', { name: o }) as HTMLButtonElement).disabled).toBe(true)
    }
    fireEvent.click(screen.getByRole('button', { name: 'Devam' }))
    expect(await screen.findByText('☀️ Nota okuma · 2/12')).toBeTruthy()
    expect(screen.queryByText('Devam')).toBeNull()
  })

  it('shows a hint on demand', async () => {
    render(<DayPractice />)
    const q = await currentQuestion()
    fireEvent.click(screen.getByRole('button', { name: '💡 İpucu' }))
    expect(await screen.findByText(q.hint)).toBeTruthy()
  })

  it('plays the question with the user tuning, unlocking audio first', async () => {
    const tuning = { ahenk: 'kiz' as const, octaveOffset: 0, tuningCents: -30 }
    await saveSettings({ tuning })
    render(<DayPractice />)
    const q = await currentQuestion()
    fireEvent.click(screen.getByRole('button', { name: '🔊 Dinle' }))
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    expect(unlockAudio).toHaveBeenCalledTimes(1)
    expect(vi.mocked(playWritten).mock.calls[0]![0]).toEqual(q.events)
    expect(vi.mocked(playWritten).mock.calls[0]![1]).toEqual(tuning)
    expect(screen.queryByText(WARNING)).toBeNull()
  })

  it('Review Focus 3: when playback fails it warns and the options stay clickable', async () => {
    vi.mocked(playWritten).mockImplementation(() => Promise.reject(new Error('strudel yok')))
    render(<DayPractice />)
    const q = await currentQuestion()
    fireEvent.click(screen.getByRole('button', { name: '🔊 Dinle' }))
    expect(await screen.findByText(WARNING)).toBeTruthy()
    for (const o of q.options) {
      expect((screen.getByRole('button', { name: o }) as HTMLButtonElement).disabled).toBe(false)
    }
    fireEvent.click(screen.getByRole('button', { name: q.answer }))
    expect(await screen.findByText('Doğru 👏')).toBeTruthy()
  })

  it('when sound is off it warns without calling the player', async () => {
    await saveSettings({ soundOn: false })
    render(<DayPractice />)
    await currentQuestion()
    fireEvent.click(screen.getByRole('button', { name: '🔊 Dinle' }))
    expect(await screen.findByText(WARNING)).toBeTruthy()
    expect(unlockAudio).not.toHaveBeenCalled()
    expect(playWritten).not.toHaveBeenCalled()
  })

  it('navigates to #/oturum-sonu after the last question', async () => {
    await saveSettings({ dailyQuestionCount: 1 })
    render(<DayPractice />)
    const q = await currentQuestion()
    fireEvent.click(screen.getByRole('button', { name: q.answer }))
    fireEvent.click(await screen.findByRole('button', { name: 'Devam' }))
    await waitFor(() => expect(location.hash).toBe('#/oturum-sonu'))
    expect(await getOpenSession('gunduz')).toBeUndefined()
  })

  it('shows no review note by default', async () => {
    render(<DayPractice />)
    await currentQuestion()
    expect(screen.queryByText(REVIEW_NOTE)).toBeNull()
  })

  it('shows the soft review note at the top when the session asks to revisit the previous topic', async () => {
    for (let i = 0; i < 10; i++) await addAttempt({ topicId: 'nota-1', cardId: 'note:D5', correct: true })
    for (let i = 0; i < 8; i++) await addAttempt({ topicId: 'sure-1', cardId: 'dur:whole', correct: i < 3 })
    render(<DayPractice />)
    await currentQuestion()
    const note = screen.getByText(REVIEW_NOTE)
    expect(note.getAttribute('role')).toBe('status')
    expect(note.textContent).not.toMatch(/başarısız|yanlış|hata/i)
  })

  it('updates the Leitner card of the answered question', async () => {
    render(<DayPractice />)
    const q = await currentQuestion()
    fireEvent.click(screen.getByRole('button', { name: q.answer }))
    await screen.findByText('Doğru 👏')
    const cards = await listCards()
    expect(cards.find((c) => c.id === q.cardId)?.box).toBe(2)
  })

  describe('timer', () => {
    /** 1000 ms'lik aralığı elle sürülebilir yapar; diğer aralıklar (waitFor) gerçek kalır. */
    function captureTimer() {
      const real = globalThis.setInterval
      const callbacks: (() => void)[] = []
      vi.spyOn(globalThis, 'setInterval').mockImplementation(((fn: () => void, ms?: number, ...rest: unknown[]) => {
        if (ms === 1000) {
          callbacks.push(fn)
          return 0 as unknown as ReturnType<typeof setInterval>
        }
        return (real as (...a: unknown[]) => ReturnType<typeof setInterval>)(fn, ms, ...rest)
      }) as typeof setInterval)
      return callbacks
    }

    it('ticks while visible and persists the elapsed time', async () => {
      const callbacks = captureTimer()
      render(<DayPractice />)
      await currentQuestion()
      await waitFor(() => expect(callbacks).toHaveLength(1))
      callbacks[0]!()
      await waitFor(async () => expect((await getOpenSession('gunduz'))?.elapsedMs).toBe(1000))
    })

    it('does not tick while the page is hidden', async () => {
      const callbacks = captureTimer()
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
      render(<DayPractice />)
      await currentQuestion()
      await waitFor(() => expect(callbacks).toHaveLength(1))
      callbacks[0]!()
      callbacks[0]!()
      await new Promise((r) => setTimeout(r, 30))
      expect((await getOpenSession('gunduz'))?.elapsedMs).toBe(0)
    })

    it('keeps the last answer feedback visible: a tick after the final answer does not navigate until Devam', async () => {
      await saveSettings({ dailyQuestionCount: 1 })
      const callbacks = captureTimer()
      render(<DayPractice />)
      const q = await currentQuestion()
      await waitFor(() => expect(callbacks).toHaveLength(1))
      fireEvent.click(screen.getByRole('button', { name: q.answer }))
      expect(await screen.findByText('Doğru 👏')).toBeTruthy()
      await waitFor(async () => expect(await getOpenSession('gunduz')).toBeUndefined())
      callbacks[0]!()
      callbacks[0]!()
      await new Promise((r) => setTimeout(r, 50))
      expect(location.hash).not.toBe('#/oturum-sonu')
      expect(screen.getByText('Doğru 👏')).toBeTruthy()
      fireEvent.click(screen.getByRole('button', { name: 'Devam' }))
      await waitFor(() => expect(location.hash).toBe('#/oturum-sonu'))
    })

    it('finishes the session at the cap and goes to #/oturum-sonu', async () => {
      const s = await loadOrStartDaySession(new Date())
      await saveSession({ ...s, elapsedMs: DAY_CAP_MS - 1000 })
      const callbacks = captureTimer()
      render(<DayPractice />)
      await currentQuestion()
      await waitFor(() => expect(callbacks).toHaveLength(1))
      callbacks[0]!()
      await waitFor(() => expect(location.hash).toBe('#/oturum-sonu'))
      expect(await getOpenSession('gunduz')).toBeUndefined()
    })
  })
})

describe('DayPractice (dizi ve eski oturumlar)', () => {
  async function seedSession(questions: ReturnType<typeof makeQuestion>[]) {
    const s = await loadOrStartDaySession(new Date())
    const state: DayState = { questions, index: 0, answers: [], reviewNote: false }
    await saveSession({ ...s, state })
  }

  it('Review Focus 1: dizi sorusunda 4 nota başı çizilir, seçenek metni tam görünür ve düğmeler satır kaydırır', async () => {
    const q = makeQuestion('seq:D5-C5-B4-A4', seededRng(3))
    await seedSession([q])
    render(<DayPractice />)
    await screen.findByText('Bu dizi nasıl okunur?')
    expect(screen.getAllByTestId('notehead')).toHaveLength(4)
    for (const o of q.options) {
      const btn = screen.getByRole('button', { name: o })
      expect(btn.textContent).toBe(o)
    }
    // CSS kuralı: uzun seçenekler satır kaydırır; ortak kural düğmeleri en az 44 px yapar.
    const css = readFileSync(resolve(__dirname, '../styles.css'), 'utf8')
    const rule = /\.option\s*\{([^}]*)\}/.exec(css)![1]!
    expect(rule).toMatch(/white-space:\s*normal/)
    expect(rule).not.toMatch(/min-height/)
    const base = /\.option,\s*\.tool,\s*\.primary\s*\{([^}]*)\}/.exec(css)![1]!
    const minHeight = /min-height:\s*([\d.]+)(rem|px)/.exec(base)!
    const px = Number(minHeight[1]) * (minHeight[2] === 'rem' ? 16 : 1)
    expect(px).toBeGreaterThanOrEqual(44)
  })

  it('Review Focus 2: perde-ters sorusunda porte ve nota başı çizilmez, "🔊 Dinle" gizlenir', async () => {
    const q = makeQuestion('perde-ters:D5', seededRng(3))
    await seedSession([q])
    render(<DayPractice />)
    await screen.findByText('Nevâ hangi nota?')
    expect(screen.queryAllByTestId('notehead')).toHaveLength(0)
    expect(document.querySelector('.staff-wrap')).toBeNull()
    expect(screen.queryByRole('button', { name: '🔊 Dinle' })).toBeNull()
    // ipucu ve cevap yine çalışır
    expect(screen.getByRole('button', { name: '💡 İpucu' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Re' }))
    expect(await screen.findByText('Doğru 👏')).toBeTruthy()
  })

  it('perde: sorusunda nota başı çizilir ve "🔊 Dinle" görünür', async () => {
    const q = makeQuestion('perde:D5', seededRng(3))
    await seedSession([q])
    render(<DayPractice />)
    await screen.findByText('Bu notanın perde adı ne?')
    expect(screen.getAllByTestId('notehead')).toHaveLength(1)
    expect(screen.getByRole('button', { name: '🔊 Dinle' })).toBeTruthy()
  })

  it('Dinle dizinin tamamını çalar', async () => {
    const q = makeQuestion('seq:D5-C5-B4-A4', seededRng(3))
    await seedSession([q])
    render(<DayPractice />)
    await screen.findByText('Bu dizi nasıl okunur?')
    fireEvent.click(screen.getByRole('button', { name: '🔊 Dinle' }))
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    expect(vi.mocked(playWritten).mock.calls[0]![0]).toHaveLength(4)
  })

  it('dizi cevabı doğru işaretlenir', async () => {
    const q = makeQuestion('seq:D5-C5-B4-A4', seededRng(3))
    await seedSession([q])
    render(<DayPractice />)
    await screen.findByText('Bu dizi nasıl okunur?')
    fireEvent.click(screen.getByRole('button', { name: 'Re – Do – Si – La' }))
    expect(await screen.findByText('Doğru 👏')).toBeTruthy()
  })

  it('Review Focus 4: eski note: sorularını içeren kayıtlı oturum yeni kodla açılır ve çizilir', async () => {
    const old = {
      id: 'note:D5#abc',
      cardId: 'note:D5',
      topicId: 'nota-1',
      prompt: 'Bu notanın adı ne?',
      events: [{ kind: 'note', pitch: { step: 'D', octave: 5, acc: 0 }, dur: 'quarter' }],
      options: ['Re', 'Do', 'Mi', 'Fa'],
      answer: 'Re',
      hint: 'Çizgiler alttan: Mi, Sol, Si, Re, Fa',
    } as ReturnType<typeof makeQuestion>
    await seedSession([old])
    render(<DayPractice />)
    await screen.findByText('Bu notanın adı ne?')
    expect(screen.getAllByTestId('notehead')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Re' }))
    expect(await screen.findByText('Doğru 👏')).toBeTruthy()
  })
})

describe('DayPractice (serbest tur)', () => {
  it('serbest turda da "← Ara ver" bağlantısı ana ekrana döner', async () => {
    render(<DayPractice topicId="nota-2" />)
    await screen.findByText('☀️ Nota okuma · 1/8')
    expect(screen.getByRole('link', { name: '← Ara ver' }).getAttribute('href')).toBe('#/')
  })

  it('asks 8 questions of the topic, writes attempts, no session record, and ends with the score', async () => {
    render(<DayPractice topicId="nota-2" />)
    for (let i = 1; i <= 8; i++) {
      await screen.findByText(`☀️ Nota okuma · ${i}/8`)
      const options = screen.getAllByRole('button').filter((b) => !/Dinle|İpucu|Devam/.test(b.textContent ?? ''))
      expect(options).toHaveLength(4)
      fireEvent.click(options[0]!)
      fireEvent.click(await screen.findByRole('button', { name: 'Devam' }))
    }
    expect(await screen.findByText('Tur bitti')).toBeTruthy()
    expect(screen.getByText(/^Skor: \d\/8$/)).toBeTruthy()
    expect(screen.getByRole('link').getAttribute('href')).toBe('#/nota')
    const attempts = await listAttempts()
    expect(attempts).toHaveLength(8)
    expect(attempts.every((a) => a.topicId === 'nota-2')).toBe(true)
    expect(await getOpenSession('gunduz')).toBeUndefined()
    const cards = await listCards()
    expect(cards.length).toBeGreaterThan(0)
    expect(cards.every((c) => ['note:A4', 'note:G4'].includes(c.id))).toBe(true)
    expect(screen.queryByText(REVIEW_NOTE)).toBeNull()
  })
})
