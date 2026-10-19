import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { acquireWakeLock, releaseWakeLock } from './wakeLock'

interface FakeSentinel {
  release: ReturnType<typeof vi.fn>
}

function setWakeLock(value: unknown) {
  Object.defineProperty(navigator, 'wakeLock', { value, configurable: true, writable: true })
}

let sentinel: FakeSentinel

beforeEach(() => {
  sentinel = { release: vi.fn(() => Promise.resolve()) }
})
afterEach(() => {
  releaseWakeLock()
  // @ts-expect-error test temizliği
  delete navigator.wakeLock
})

describe('wakeLock', () => {
  it("destek yoksa sessizce hiçbir şey yapmaz", async () => {
    await expect(acquireWakeLock()).resolves.toBeUndefined()
    expect(() => releaseWakeLock()).not.toThrow()
  })

  it("acquire 'screen' kilidi ister; release bırakır", async () => {
    const request = vi.fn(() => Promise.resolve(sentinel))
    setWakeLock({ request })
    await acquireWakeLock()
    expect(request).toHaveBeenCalledWith('screen')
    expect(sentinel.release).not.toHaveBeenCalled()
    releaseWakeLock()
    expect(sentinel.release).toHaveBeenCalledTimes(1)
    releaseWakeLock() // ikinci kez zararsız
    expect(sentinel.release).toHaveBeenCalledTimes(1)
  })

  it('arka arkaya acquire tek kilit isteği yapar', async () => {
    const request = vi.fn(() => Promise.resolve(sentinel))
    setWakeLock({ request })
    await Promise.all([acquireWakeLock(), acquireWakeLock()])
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('istek reddedilirse hata fırlatmaz', async () => {
    setWakeLock({ request: vi.fn(() => Promise.reject(new Error('NotAllowedError'))) })
    await expect(acquireWakeLock()).resolves.toBeUndefined()
    expect(() => releaseWakeLock()).not.toThrow()
  })

  it('istek sürerken release çağrılırsa gelen kilit hemen bırakılır', async () => {
    let resolve!: (s: FakeSentinel) => void
    setWakeLock({ request: vi.fn(() => new Promise<FakeSentinel>((r) => (resolve = r))) })
    const p = acquireWakeLock()
    releaseWakeLock()
    resolve(sentinel)
    await p
    expect(sentinel.release).toHaveBeenCalledTimes(1)
  })

  it('release sonrası yeniden acquire çalışır', async () => {
    const request = vi.fn(() => Promise.resolve(sentinel))
    setWakeLock({ request })
    await acquireWakeLock()
    releaseWakeLock()
    await acquireWakeLock()
    expect(request).toHaveBeenCalledTimes(2)
  })
})
