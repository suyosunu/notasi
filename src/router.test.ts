import { renderHook, act } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { navigate, useRoute } from './router'

afterEach(() => {
  location.hash = ''
})

describe('useRoute', () => {
  it("hash '#/nota' iken '/nota' döner", () => {
    location.hash = '#/nota'
    const { result } = renderHook(() => useRoute())
    expect(result.current).toBe('/nota')
  })

  it("hash boşken '/' döner", () => {
    location.hash = ''
    const { result } = renderHook(() => useRoute())
    expect(result.current).toBe('/')
  })

  it('hashchange olayında yeniden çizer', async () => {
    location.hash = ''
    const { result } = renderHook(() => useRoute())
    await act(async () => {
      location.hash = '#/ney'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(result.current).toBe('/ney')
  })

  it('navigate hash değerini ayarlar', () => {
    navigate('/ayarlar')
    expect(location.hash).toBe('#/ayarlar')
  })
})
