import { afterEach, describe, expect, it, vi } from 'vitest'
import { isStandalone, setPlaybackSession } from './ios'

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(navigator, 'audioSession')
  Reflect.deleteProperty(navigator, 'standalone')
})

describe('setPlaybackSession', () => {
  it('audioSession yoksa hata vermez', () => {
    expect(() => setPlaybackSession()).not.toThrow()
  })
  it('audioSession varsa type = playback yapar', () => {
    const session = { type: 'auto' }
    Object.defineProperty(navigator, 'audioSession', { value: session, configurable: true })
    setPlaybackSession()
    expect(session.type).toBe('playback')
  })
})

describe('isStandalone', () => {
  it('tarayıcı sekmesinde false', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(isStandalone()).toBe(false)
  })
  it('display-mode: standalone ise true', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(isStandalone()).toBe(true)
  })
  it('navigator.standalone === true ise true (iOS)', () => {
    Object.defineProperty(navigator, 'standalone', { value: true, configurable: true })
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(isStandalone()).toBe(true)
  })
})
