import { renderHook, act } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { navigate, replaceRoute, useRoute } from './router'

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

  it('replaceRoute hash değerini ayarlar ve geçmişe kayıt eklemez', () => {
    const before = history.length
    replaceRoute('/ayarlar')
    expect(location.hash).toBe('#/ayarlar')
    expect(history.length).toBe(before)
  })

  it('replaceRoute sonrası useRoute yeniden çizer', async () => {
    location.hash = ''
    const { result } = renderHook(() => useRoute())
    await act(async () => {
      replaceRoute('/hakkinda')
      await new Promise((r) => setTimeout(r, 20))
    })
    expect(result.current).toBe('/hakkinda')
  })
})
