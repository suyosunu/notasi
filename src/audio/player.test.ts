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

describe('playLoop', () => {
  it('kodu maskesiz ve zamanlayıcısız evaluate eder; süre dolsa da hush çağrılmaz', async () => {
    const { playLoop } = await freshPlayer()
    await playLoop('s("white").cpm(10)')
    expect(strudel.evaluate).toHaveBeenCalledWith('s("white").cpm(10)')
    strudel.hush.mockClear()
    await vi.advanceTimersByTimeAsync(600_000)
    expect(strudel.hush).not.toHaveBeenCalled()
  })

  it('stopAudio döngüyü durdurur (hush)', async () => {
    const { playLoop, stopAudio } = await freshPlayer()
    await playLoop('x')
    strudel.hush.mockClear()
    stopAudio()
    expect(strudel.hush).toHaveBeenCalledTimes(1)
  })

  it('ikinci playLoop öncekini durdurur: önce hush, sonra yeni evaluate', async () => {
    const { playLoop } = await freshPlayer()
    await playLoop('birinci')
    strudel.hush.mockClear()
    await playLoop('ikinci')
    expect(strudel.evaluate).toHaveBeenLastCalledWith('ikinci')
    expect(strudel.hush).toHaveBeenCalledTimes(1)
    expect(strudel.hush.mock.invocationCallOrder[0]!).toBeLessThan(
      strudel.evaluate.mock.invocationCallOrder[1]!,
    )
  })

  it('çalan playTones varsa playLoop onu durdurur ve eski söz çözülür', async () => {
    const { playLoop, playTones } = await freshPlayer()
    let toneDone = false
    const tone = playTones(events).then(() => {
      toneDone = true
    })
    await vi.advanceTimersByTimeAsync(0)
    await playLoop('döngü')
    await tone
    expect(toneDone).toBe(true)
  })

  it('evaluate sürerken stopAudio çağrılırsa döngü yine de susturulur', async () => {
    const { playLoop, stopAudio } = await freshPlayer()
    let finishEvaluate: () => void = () => {}
    strudel.evaluate.mockImplementation(() => new Promise<void>((resolve) => (finishEvaluate = resolve)))
    const p = playLoop('x')
    await vi.advanceTimersByTimeAsync(0)
    stopAudio()
    strudel.hush.mockClear()
    finishEvaluate()
    await p
    expect(strudel.hush).toHaveBeenCalledTimes(1)
  })

  it('başka bir playLoop devraldıysa eski çağrı hush çağırmaz', async () => {
    const { playLoop } = await freshPlayer()
    let finishFirst: () => void = () => {}
    strudel.evaluate.mockImplementationOnce(() => new Promise<void>((resolve) => (finishFirst = resolve)))
    const first = playLoop('birinci')
    await vi.advanceTimersByTimeAsync(0)
    const second = playLoop('ikinci')
    await vi.advanceTimersByTimeAsync(0)
    strudel.hush.mockClear()
    finishFirst()
    await Promise.all([first, second])
    expect(strudel.hush).not.toHaveBeenCalled()
  })

  it('evaluate hata fırlatırsa reject olur', async () => {
    const { playLoop } = await freshPlayer()
    strudel.evaluate.mockRejectedValue(new Error('ses yok'))
    await expect(playLoop('x')).rejects.toThrow('ses yok')
  })
})

describe('playCode', () => {
  it('verilen kodu evaluate eder; durationMs + 150 ms sonra hush çağırır ve çözülür', async () => {
    const { playCode } = await freshPlayer()
    let done = false
    const p = playCode('stack(a, b)', 2000).then(() => {
      done = true
    })
    await vi.advanceTimersByTimeAsync(0)
    expect(strudel.evaluate).toHaveBeenCalledWith('stack(a, b)')
    const hushBefore = strudel.hush.mock.calls.length
    await vi.advanceTimersByTimeAsync(2149)
    expect(done).toBe(false)
    expect(strudel.hush.mock.calls.length).toBe(hushBefore)
    await vi.advanceTimersByTimeAsync(1)
    await p
    expect(done).toBe(true)
    expect(strudel.hush.mock.calls.length).toBe(hushBefore + 1)
  })

  it('stopAudio çalmayı keser: söz hemen çözülür, sonradan ikinci hush gelmez', async () => {
    const { playCode, stopAudio } = await freshPlayer()
    let done = false
    const p = playCode('x', 60_000).then(() => {
      done = true
    })
    await vi.advanceTimersByTimeAsync(0)
    strudel.hush.mockClear()
    stopAudio()
    await p
    expect(done).toBe(true)
    expect(strudel.hush).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(120_000)
    expect(strudel.hush).toHaveBeenCalledTimes(1)
  })

  it('çalan döngü (playLoop) varsa önce onu durdurur: aynı anda iki desen çalmaz', async () => {
    const { playCode, playLoop } = await freshPlayer()
    await playLoop('döngü')
    strudel.hush.mockClear()
    const p = playCode('parça', 1000)
    await vi.advanceTimersByTimeAsync(0)
    expect(strudel.hush).toHaveBeenCalledTimes(1)
    expect(strudel.hush.mock.invocationCallOrder[0]!).toBeLessThan(
      strudel.evaluate.mock.invocationCallOrder[1]!,
    )
    await vi.advanceTimersByTimeAsync(1150)
    await p
  })

  it('evaluate hata fırlatırsa reject olur', async () => {
    const { playCode } = await freshPlayer()
    strudel.evaluate.mockRejectedValue(new Error('ses yok'))
    await expect(playCode('x', 1000)).rejects.toThrow('ses yok')
  })
})
