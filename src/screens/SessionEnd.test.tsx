import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getSettings, listSessions, resetDbForTests, saveSession, saveSettings } from '../store/db'
import type { SessionRec } from '../store/db'
import { SessionEnd } from './SessionEnd'

beforeEach(async () => {
  await resetDbForTests()
  location.hash = '#/oturum-sonu'
})
afterEach(() => {
  cleanup()
  location.hash = ''
})

function session(over: Partial<SessionRec>): SessionRec {
  return {
    id: crypto.randomUUID(),
    kind: 'gunduz',
    date: '2026-10-13',
    startedAt: '2026-10-13T08:00:00.000Z',
    endedAt: '2026-10-13T08:10:00.000Z',
    completed: true,
    elapsedMs: 600000,
    state: {
      questions: [],
      index: 3,
      answers: [
        { cardId: 'a', correct: true },
        { cardId: 'b', correct: false },
        { cardId: 'c', correct: true },
      ],
    },
    ...over,
  }
}

describe('SessionEnd', () => {
  it('shows the result of the most recently ended day session', async () => {
    await saveSession(
      session({
        endedAt: '2026-10-12T08:10:00.000Z',
        state: { questions: [], index: 1, answers: [{ cardId: 'a', correct: false }] },
      }),
    )
    await saveSession(session({}))
    render(<SessionEnd />)
    expect(await screen.findByText('Bugünlük bu kadar 👏')).toBeTruthy()
    expect(screen.getByText('2/3 doğru')).toBeTruthy()
  })

  it('shows only the title when there is no ended session', async () => {
    await saveSession(session({ endedAt: undefined, completed: false }))
    render(<SessionEnd />)
    expect(await screen.findByText('Oturum sonu')).toBeTruthy()
    expect(screen.queryByText(/doğru/)).toBeNull()
  })

  it('shows only the title for non-gündüz sessions', async () => {
    await saveSession(session({ kind: 'aksam' }))
    render(<SessionEnd />)
    expect(await screen.findByText('Oturum sonu')).toBeTruthy()
    expect(screen.queryByText(/doğru/)).toBeNull()
  })

  it('returns home', async () => {
    render(<SessionEnd />)
    fireEvent.click(await screen.findByRole('button', { name: 'Ana ekrana dön' }))
    expect(location.hash).toBe('#/')
  })

  describe('geri bildirim', () => {
    it('tamamlanmış gündüz oturumunda "Bugün nasıldı?" ve üç seçenek gösterilir', async () => {
      await saveSession(session({}))
      render(<SessionEnd />)
      expect(await screen.findByText('Bugün nasıldı?')).toBeTruthy()
      for (const name of ['Kolay', 'Tam kararında', 'Zor']) {
        expect(screen.getByRole('button', { name })).toBeTruthy()
      }
    })

    it('gündüz: "Zor" 12\'den 9\'a düşürür, oturuma yazar, teşekkür eder', async () => {
      const s = session({})
      await saveSession(s)
      render(<SessionEnd />)
      fireEvent.click(await screen.findByRole('button', { name: 'Zor' }))
      expect(await screen.findByText('Teşekkürler, yarınki tur buna göre ayarlanacak.')).toBeTruthy()
      expect((await getSettings()).dailyQuestionCount).toBe(9)
      const saved = (await listSessions()).find((x) => x.id === s.id)!
      expect(saved.feedback).toBe('zor')
      expect(saved.completed).toBe(true)
      // Seçim işaretli kalır, seçenekler kilitlenir.
      expect(screen.getByRole('button', { name: 'Zor' }).getAttribute('aria-pressed')).toBe('true')
      expect(screen.getByRole('button', { name: 'Kolay' }).hasAttribute('disabled')).toBe(true)
    })

    it('gündüz: "Kolay" +3', async () => {
      await saveSession(session({}))
      render(<SessionEnd />)
      fireEvent.click(await screen.findByRole('button', { name: 'Kolay' }))
      await screen.findByText(/Teşekkürler/)
      expect((await getSettings()).dailyQuestionCount).toBe(15)
    })

    it('gündüz: "Tam kararında" sayıyı değiştirmez', async () => {
      await saveSession(session({}))
      render(<SessionEnd />)
      fireEvent.click(await screen.findByRole('button', { name: 'Tam kararında' }))
      await screen.findByText(/Teşekkürler/)
      expect((await getSettings()).dailyQuestionCount).toBe(12)
    })

    it('akşam: yalnızca kaydedilir, soru sayısı değişmez', async () => {
      const s = session({ kind: 'aksam' })
      await saveSession(s)
      render(<SessionEnd />)
      fireEvent.click(await screen.findByRole('button', { name: 'Kolay' }))
      expect(await screen.findByText('Teşekkürler.')).toBeTruthy()
      expect(screen.queryByText(/yarınki tur/)).toBeNull()
      expect((await getSettings()).dailyQuestionCount).toBe(12)
      expect((await listSessions()).find((x) => x.id === s.id)!.feedback).toBe('kolay')
    })

    it('tamamlanmamış (süre dolmuş) oturumda soru sorulmaz', async () => {
      await saveSession(session({ completed: false }))
      render(<SessionEnd />)
      await screen.findByRole('button', { name: 'Ana ekrana dön' })
      expect(screen.queryByText('Bugün nasıldı?')).toBeNull()
    })

    it('zaten geri bildirimi olan oturumda seçim işaretli gösterilir, yeniden uygulanmaz', async () => {
      await saveSettings({ dailyQuestionCount: 9 })
      await saveSession(session({ feedback: 'zor' }))
      render(<SessionEnd />)
      const zor = await screen.findByRole('button', { name: 'Zor' })
      expect(zor.getAttribute('aria-pressed')).toBe('true')
      expect(zor.hasAttribute('disabled')).toBe(true)
      expect(screen.getByRole('button', { name: 'Kolay' }).hasAttribute('disabled')).toBe(true)
      fireEvent.click(zor)
      await waitFor(async () => expect((await getSettings()).dailyQuestionCount).toBe(9))
    })

    it('çift dokunuş ayarı iki kez değiştirmez', async () => {
      await saveSession(session({}))
      render(<SessionEnd />)
      const zor = await screen.findByRole('button', { name: 'Zor' })
      fireEvent.click(zor)
      fireEvent.click(zor)
      await screen.findByText(/Teşekkürler/)
      expect((await getSettings()).dailyQuestionCount).toBe(9)
    })
  })
})
