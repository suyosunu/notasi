import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isStandalone } from '../audio/ios'
import { unlockAudio } from '../audio/player'
import { getSettings, resetDbForTests } from '../store/db'
import { Onboarding } from './Onboarding'

vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
}))
vi.mock('../audio/ios', () => ({
  isStandalone: vi.fn(() => false),
}))

beforeEach(async () => {
  await resetDbForTests()
  vi.mocked(unlockAudio).mockReset()
  vi.mocked(unlockAudio).mockImplementation(() => Promise.resolve())
  vi.mocked(isStandalone).mockReturnValue(false)
  location.hash = '#/baslangic'
})

afterEach(() => {
  cleanup()
  location.hash = ''
})

describe('Onboarding', () => {
  it('Başla → ana ekrana ekleme rehberi → Devam → onboarded kaydedilir ve /yoklama açılır', async () => {
    render(<Onboarding />)
    expect(screen.getByText('Hoş geldiniz')).toBeTruthy()
    expect(screen.getByText('Notası ile nota okumayı ve ney çalmayı adım adım öğrenirsiniz.')).toBeTruthy()
    expect(screen.queryByText(/on dakika yeter/)).toBeNull()
    expect(screen.queryByText('Ana ekrana ekleyin')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Başla' }))
    expect(unlockAudio).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Ana ekrana ekleyin')).toBeTruthy()
    expect(
      screen.getByText(
        "Safari'de alttaki Paylaş ⬆︎ düğmesine, sonra 'Ana Ekrana Ekle'ye dokunun. Böylece uygulama tam ekran açılır ve verileriniz korunur.",
      ),
    ).toBeTruthy()
    expect((await getSettings()).onboarded).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Devam' }))
    await waitFor(async () => expect((await getSettings()).onboarded).toBe(true))
    await waitFor(() => expect(location.hash).toBe('#/yoklama'))
  })

  it('uygulama ana ekrandaysa rehber atlanır ve doğrudan bitirir', async () => {
    vi.mocked(isStandalone).mockReturnValue(true)
    render(<Onboarding />)
    fireEvent.click(screen.getByRole('button', { name: 'Başla' }))
    await waitFor(async () => expect((await getSettings()).onboarded).toBe(true))
    expect(screen.queryByText('Ana ekrana ekleyin')).toBeNull()
    await waitFor(() => expect(location.hash).toBe('#/yoklama'))
  })

  it('unlockAudio hata verirse yutulur ve akış devam eder', async () => {
    vi.mocked(unlockAudio).mockRejectedValue(new Error('ses yok'))
    render(<Onboarding />)
    fireEvent.click(screen.getByRole('button', { name: 'Başla' }))
    expect(await screen.findByText('Ana ekrana ekleyin')).toBeTruthy()
  })

  it('unlockAudio eşzamanlı fırlatırsa da yutulur', async () => {
    vi.mocked(unlockAudio).mockImplementation(() => {
      throw new Error('hemen')
    })
    render(<Onboarding />)
    fireEvent.click(screen.getByRole('button', { name: 'Başla' }))
    expect(await screen.findByText('Ana ekrana ekleyin')).toBeTruthy()
  })

  it('bitişte geçmişe kayıt eklemez (geri tuşu tuzağı yok)', async () => {
    vi.mocked(isStandalone).mockReturnValue(true)
    render(<Onboarding />)
    const before = history.length
    fireEvent.click(screen.getByRole('button', { name: 'Başla' }))
    await waitFor(() => expect(location.hash).toBe('#/yoklama'))
    expect(history.length).toBe(before)
  })
})
