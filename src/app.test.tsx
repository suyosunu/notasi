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
  it('#/hakkinda rotası Hakkında ekranını gösterir', () => {
    location.hash = '#/hakkinda'
    render(<App />)
    expect(screen.getByText(/AGPL-3.0-or-later lisansıyla\./)).toBeTruthy()
  })

  it('#/ayarlar rotası Ayarlar ekranını gösterir', async () => {
    location.hash = '#/ayarlar'
    render(<App />)
    expect(await screen.findByLabelText('Ney ahengi')).toBeTruthy()
  })

  it('#/baslangic rotası başlangıç ekranını gösterir', () => {
    location.hash = '#/baslangic'
    render(<App />)
    expect(screen.getByText('Hoş geldiniz')).toBeTruthy()
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

  it('#/ney rotası Ney bölümünü gösterir', async () => {
    location.hash = '#/ney'
    render(<App />)
    expect(await screen.findByRole('link', { name: 'Yeniden kalibre et' })).toBeTruthy()
  })

  it('#/ney/<perde> rotası o perdenin uzun sesini açar', async () => {
    await saveSettings({ calibrated: true })
    location.hash = '#/ney/neva'
    render(<App />)
    expect(await screen.findByRole('heading', { name: /Uzun ses: Nevâ/ })).toBeTruthy()
  })

  it('bilinmeyen perde için bulunamadı ekranını gösterir', () => {
    location.hash = '#/ney/yok'
    render(<App />)
    expect(screen.getByText('Sayfa bulunamadı')).toBeTruthy()
    cleanup()
    location.hash = '#/ney/toString'
    render(<App />)
    expect(screen.getByText('Sayfa bulunamadı')).toBeTruthy()
  })

  it('#/aksam rotası akşam pratiğini açar', async () => {
    location.hash = '#/aksam'
    render(<App />)
    expect(await screen.findByRole('heading', { name: /İlk ses/ })).toBeTruthy()
  })

  it('#/oturum-sonu rotası oturum sonu ekranını gösterir', async () => {
    location.hash = '#/oturum-sonu'
    render(<App />)
    expect(await screen.findByText('Oturum sonu')).toBeTruthy()
  })
})
