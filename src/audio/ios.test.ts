import { afterEach, describe, expect, it, vi } from 'vitest'
import { audioSessionType, isStandalone, setKayitSession, setPlaybackSession } from './ios'

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

describe('setKayitSession', () => {
  it('audioSession yoksa hata vermez', () => {
    expect(() => setKayitSession()).not.toThrow()
  })
  it('audioSession varsa type = play-and-record yapar', () => {
    const session = { type: 'playback' }
    Object.defineProperty(navigator, 'audioSession', { value: session, configurable: true })
    setKayitSession()
    expect(session.type).toBe('play-and-record')
  })
  it('atama reddedilirse hata vermez', () => {
    const session = {
      get type() {
        return 'playback'
      },
      set type(_v: string) {
        throw new Error('reddedildi')
      },
    }
    Object.defineProperty(navigator, 'audioSession', { value: session, configurable: true })
    expect(() => setKayitSession()).not.toThrow()
  })
})

describe('audioSessionType', () => {
  it('audioSession yoksa undefined', () => {
    expect(audioSessionType()).toBeUndefined()
  })
  it('mevcut type değerini döndürür', () => {
    Object.defineProperty(navigator, 'audioSession', { value: { type: 'playback' }, configurable: true })
    expect(audioSessionType()).toBe('playback')
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
