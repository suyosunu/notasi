import { waitFor } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  preloadAudio: vi.fn(() => Promise.resolve()),
  setNeySesi: vi.fn(),
  setUsulSesi: vi.fn(),
  getSettings: vi.fn(() => Promise.resolve({ neySesi: 'nefesli', usulSesi: 'darbuka' })),
}))

vi.mock('./app', () => ({ App: () => null }))
vi.mock('./audio/player', () => ({
  preloadAudio: mocks.preloadAudio,
  setNeySesi: mocks.setNeySesi,
  setUsulSesi: mocks.setUsulSesi,
  setDilBelirginligi: vi.fn(),
}))
vi.mock('./store/db', () => ({ getSettings: mocks.getSettings }))

afterEach(() => {
  document.body.innerHTML = ''
  vi.resetModules()
})

describe('main', () => {
  it('açılışta kayıtlı ney sesini yükler ve player\'a uygular', async () => {
    document.body.innerHTML = '<div id="app"></div>'
    await import('./main')
    await waitFor(() => expect(mocks.setNeySesi).toHaveBeenCalledWith('nefesli'))
    expect(mocks.preloadAudio).toHaveBeenCalled()
  })

  it("açılışta kayıtlı usul sesini player'a uygular", async () => {
    document.body.innerHTML = '<div id="app"></div>'
    await import('./main')
    await waitFor(() => expect(mocks.setUsulSesi).toHaveBeenCalledWith('darbuka'))
  })

  it('ayarlar okunamazsa uygulama yine açılır (hata yutulur)', async () => {
    mocks.setNeySesi.mockClear()
    mocks.getSettings.mockImplementationOnce(() => Promise.reject(new Error('IndexedDB yok')))
    document.body.innerHTML = '<div id="app"></div>'
    await expect(import('./main')).resolves.toBeTruthy()
    await new Promise((r) => setTimeout(r, 10))
    expect(mocks.setNeySesi).not.toHaveBeenCalled()
  })
})
