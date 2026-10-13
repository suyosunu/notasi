import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPatternCode } from './pattern'

const strudel = vi.hoisted(() => ({
  resume: vi.fn(() => Promise.resolve()),
  initStrudel: vi.fn((_options?: { prebake?: unknown }) => Promise.resolve()),
  evaluate: vi.fn((_code: string) => Promise.resolve()),
  hush: vi.fn(),
}))

vi.mock('@strudel/web', () => ({
  getAudioContext: () => ({ resume: strudel.resume }),
  initStrudel: strudel.initStrudel,
  evaluate: strudel.evaluate,
  hush: strudel.hush,
}))

const events = [
  { hz: 440, beats: 2 },
  { hz: null, beats: 1 },
  { hz: 494.957, beats: 1 },
]

/** Her testte modül durumu (init, önbellek, belirteç) sıfırlanır. */
async function freshPlayer() {
  vi.resetModules()
  return import('./player')
}

beforeEach(() => {
  vi.useFakeTimers()
  strudel.resume.mockClear()
  strudel.initStrudel.mockReset().mockResolvedValue(undefined)
  strudel.evaluate.mockReset().mockResolvedValue(undefined)
  strudel.hush.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('preloadAudio / unlockAudio', () => {
  it('önceden yüklenmişse resume, await olmadan eşzamanlı çağrılır', async () => {
    const { preloadAudio, unlockAudio } = await freshPlayer()
    await preloadAudio()
    void unlockAudio() // await yok: kullanıcı hareketi içinde eşzamanlı olmalı
    expect(strudel.resume).toHaveBeenCalledTimes(1)
    expect(strudel.initStrudel).toHaveBeenCalledTimes(1)
  })

  it('yüklenmemişse önce içe aktarmayı bekler, sonra resume eder', async () => {
    const { unlockAudio } = await freshPlayer()
    await unlockAudio()
    expect(strudel.resume).toHaveBeenCalledTimes(1)
    expect(strudel.initStrudel).toHaveBeenCalledTimes(1)
  })

  it('initStrudel yalnızca bir kez, prebake olmadan çağrılır', async () => {
    const { unlockAudio } = await freshPlayer()
    await unlockAudio()
    await unlockAudio()
    expect(strudel.initStrudel).toHaveBeenCalledTimes(1)
    expect(strudel.initStrudel.mock.calls[0]?.[0]?.prebake).toBeUndefined()
  })

  it('init başarısız olursa reject olur ve sonraki dokunuşta yeniden denenir', async () => {
    const { unlockAudio } = await freshPlayer()
    strudel.initStrudel.mockRejectedValueOnce(new Error('başlatılamadı'))
    await expect(unlockAudio()).rejects.toThrow('başlatılamadı')
    await unlockAudio()
    expect(strudel.initStrudel).toHaveBeenCalledTimes(2)
  })
})

describe('playTones', () => {
  it('üretilen kodla evaluate çağırır ve 4150 ms sonra hush çağırıp resolve olur', async () => {
    const { playTones } = await freshPlayer()
    const { code } = buildPatternCode(events, 60)
    let done = false
    const p = playTones(events).then(() => {
      done = true
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(strudel.evaluate).toHaveBeenCalledWith(code)
    const hushBefore = strudel.hush.mock.calls.length
    await vi.advanceTimersByTimeAsync(4149)
    expect(strudel.hush.mock.calls.length).toBe(hushBefore)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    await p
    expect(strudel.hush.mock.calls.length).toBe(hushBefore + 1)
    expect(done).toBe(true)
  })

  it('evaluate hata fırlatırsa reject olur', async () => {
    const { playTones } = await freshPlayer()
    strudel.evaluate.mockRejectedValue(new Error('ses yok'))
    await expect(playTones(events)).rejects.toThrow('ses yok')
  })

  it('yeni çalma öncekini durdurur: eski söz çözülür, eski zamanlayıcı iptal olur', async () => {
    const { playTones, stopAudio } = await freshPlayer()
    let firstDone = false
    const first = playTones(events).then(() => {
      firstDone = true
    })
    await vi.advanceTimersByTimeAsync(0)
    const before = strudel.hush.mock.calls.length
    const second = playTones(events)
    await vi.advanceTimersByTimeAsync(0)
    expect(strudel.hush.mock.calls.length).toBeGreaterThan(before)
    await first
    expect(firstDone).toBe(true)
    stopAudio()
    await second
  })

  it('evaluate sürerken stopAudio çağrılırsa desen yine de başlamaz: hush çağrılır, söz çözülür', async () => {
    const { playTones, stopAudio } = await freshPlayer()
    let finishEvaluate: () => void = () => {}
    strudel.evaluate.mockImplementation(
      () => new Promise<void>((resolve) => (finishEvaluate = resolve)),
    )
    let settled = false
    const p = playTones(events).then(() => {
      settled = true
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(strudel.evaluate).toHaveBeenCalledTimes(1)
    stopAudio()
    strudel.hush.mockClear()
    finishEvaluate() // evaluate deseni şimdi başlattı
    await p
    expect(settled).toBe(true)
    expect(strudel.hush).toHaveBeenCalledTimes(1)
    // süre dolsa da ikinci bir hush ya da takılı zamanlayıcı kalmaz
    await vi.advanceTimersByTimeAsync(10_000)
    expect(strudel.hush).toHaveBeenCalledTimes(1)
  })

  it('başka bir playTones devraldıysa eski çağrı hush çağırmaz ve söz çözülür', async () => {
    const { playTones, stopAudio } = await freshPlayer()
    let finishFirst: () => void = () => {}
    strudel.evaluate.mockImplementationOnce(
      () => new Promise<void>((resolve) => (finishFirst = resolve)),
    )
    let firstSettled = false
    const first = playTones(events).then(() => {
      firstSettled = true
    })
    await vi.advanceTimersByTimeAsync(0)
    const second = playTones(events)
    await vi.advanceTimersByTimeAsync(0)
    strudel.hush.mockClear()
    finishFirst()
    await first
    expect(firstSettled).toBe(true)
    expect(strudel.hush).not.toHaveBeenCalled()
    stopAudio()
    await second
  })
})
