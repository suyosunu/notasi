import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const resume = vi.fn(() => Promise.resolve())

vi.mock('@strudel/web', () => ({
  getAudioContext: vi.fn(() => ({ resume })),
  initStrudel: vi.fn(() => Promise.resolve()),
  evaluate: vi.fn(() => Promise.resolve()),
  hush: vi.fn(),
}))

import { evaluate, hush, initStrudel } from '@strudel/web'
import { buildPatternCode } from './pattern'
import { playTones, stopAudio, unlockAudio } from './player'

const events = [
  { hz: 440, beats: 2 },
  { hz: null, beats: 1 },
  { hz: 494.957, beats: 1 },
]

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(evaluate).mockReset()
  vi.mocked(evaluate).mockResolvedValue(undefined)
  vi.mocked(hush).mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('unlockAudio', () => {
  it('initStrudel yalnızca bir kez, prebake olmadan çağrılır', async () => {
    await unlockAudio()
    await unlockAudio()
    expect(initStrudel).toHaveBeenCalledTimes(1)
    const options = vi.mocked(initStrudel).mock.calls[0]?.[0]
    expect(options?.prebake).toBeUndefined()
    expect(resume).toHaveBeenCalled()
  })
})

describe('playTones', () => {
  it('üretilen kodla evaluate çağırır ve 4150 ms sonra hush çağırıp resolve olur', async () => {
    const { code } = buildPatternCode(events, 60)
    let done = false
    const p = playTones(events).then(() => {
      done = true
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(evaluate).toHaveBeenCalledWith(code)
    const hushBefore = vi.mocked(hush).mock.calls.length
    await vi.advanceTimersByTimeAsync(4149)
    expect(vi.mocked(hush).mock.calls.length).toBe(hushBefore)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await p
    expect(vi.mocked(hush).mock.calls.length).toBe(hushBefore + 1)
    expect(done).toBe(true)
  })

  it('evaluate hata fırlatırsa reject olur', async () => {
    vi.mocked(evaluate).mockRejectedValue(new Error('ses yok'))
    await expect(playTones(events)).rejects.toThrow('ses yok')
  })

  it('yeni çalma öncekini durdurur (hush) ve eski zamanlayıcıyı iptal eder', async () => {
    void playTones(events)
    await vi.advanceTimersByTimeAsync(0)
    const before = vi.mocked(hush).mock.calls.length
    void playTones(events)
    await vi.advanceTimersByTimeAsync(0)
    expect(vi.mocked(hush).mock.calls.length).toBeGreaterThan(before)
    stopAudio()
  })
})
