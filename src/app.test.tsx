import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from './app'
import { resetDbForTests, saveSettings } from './store/db'

beforeEach(async () => {
  await resetDbForTests()
})

afterEach(() => {
  cleanup()
  location.hash = ''
})

describe('App', () => {
  it('#/hakkinda rotasında "Hakkında" metnini gösterir', () => {
    location.hash = '#/hakkinda'
    render(<App />)
    expect(screen.getAllByText('Hakkında').length).toBeGreaterThan(0)
  })

  it('#/ rotası ana ekranı gösterir', async () => {
    await saveSettings({ onboarded: true })
    location.hash = '#/'
    render(<App />)
    expect(await screen.findByText('☀️ Masa başı · 10 dk')).toBeTruthy()
  })

  it('#/nota rotası Nota bölümünü gösterir', async () => {
    location.hash = '#/nota'
    render(<App />)
    expect(await screen.findByText('Re, Do, Si')).toBeTruthy()
  })

  it('#/nota/<konu> rotası serbest turu açar', async () => {
    location.hash = '#/nota/nota-1'
    render(<App />)
    expect(await screen.findByText(/Nota okuma · 1\/8/)).toBeTruthy()
  })

  it('bilinmeyen konu için bulunamadı ekranını gösterir', () => {
    location.hash = '#/nota/yok'
    render(<App />)
    expect(screen.getByText('Sayfa bulunamadı')).toBeTruthy()
  })

  it('#toString gibi prototip anahtarları bulunamadı sayılır', () => {
    location.hash = '#toString'
    render(<App />)
    expect(screen.getByText('Sayfa bulunamadı')).toBeTruthy()
  })

  it('#/oturum-sonu rotası oturum sonu ekranını gösterir', async () => {
    location.hash = '#/oturum-sonu'
    render(<App />)
    expect(await screen.findByText('Oturum sonu')).toBeTruthy()
  })
})
