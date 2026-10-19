import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from './app'
import { resetDbForTests, saveSettings, setPlacedOut } from './store/db'

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
    await saveSettings({ onboarded: true, placementDone: true })
    location.hash = '#/'
    render(<App />)
    expect(await screen.findByText('☀️ Masa başı · 10 dk')).toBeTruthy()
  })

  it('#/yoklama rotası başlangıç yoklamasını gösterir', async () => {
    location.hash = '#/yoklama'
    render(<App />)
    expect(await screen.findByText('Önce ne hatırladığınıza bakalım')).toBeTruthy()
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

  it('#/nota/karisik rotası karışık antrenmanı açar, bulunamadı göstermez', async () => {
    await setPlacedOut('nota-1')
    location.hash = '#/nota/karisik'
    render(<App />)
    expect(await screen.findByText(/Karışık antrenman · 1\/12/)).toBeTruthy()
    expect(screen.queryByText('Sayfa bulunamadı')).toBeNull()
  })

  it('#/nota/karisik havuz boşken açıklama gösterir', async () => {
    location.hash = '#/nota/karisik'
    render(<App />)
    expect(await screen.findByText('Henüz öğrenilmiş konu yok.')).toBeTruthy()
    expect(screen.queryByText('Sayfa bulunamadı')).toBeNull()
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

  it('#/usul rotası Usul bölümünü gösterir', () => {
    location.hash = '#/usul'
    render(<App />)
    expect(screen.getByRole('heading', { name: /Usuller/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: '▶ Çal' })).toBeTruthy()
  })

  it('#/makam rotası Makam bölümünü gösterir', () => {
    location.hash = '#/makam'
    render(<App />)
    expect(screen.getByRole('link', { name: /Uşşak/ })).toBeTruthy()
  })

  it('#/makam/<id> rotası makam sayfasını açar', () => {
    location.hash = '#/makam/hicaz'
    render(<App />)
    expect(screen.getByRole('heading', { name: /Hicaz/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: '🔊 Diziyi dinle' })).toBeTruthy()
  })

  it('#/makam/sorular rotası makam sorularını açar, makam sayfası sanılmaz', async () => {
    location.hash = '#/makam/sorular'
    render(<App />)
    expect(await screen.findByText(/Makam · 1\/8/)).toBeTruthy()
    expect(screen.queryByText('Sayfa bulunamadı')).toBeNull()
  })

  it('bilinmeyen makam için bulunamadı ekranını gösterir', () => {
    for (const hash of ['#/makam/yok', '#/makam/toString', '#/makam/']) {
      location.hash = hash
      render(<App />)
      expect(screen.getByText('Sayfa bulunamadı')).toBeTruthy()
      cleanup()
    }
  })
  it('#/parcalar rotası parça listesini gösterir', () => {
    location.hash = '#/parcalar'
    render(<App />)
    expect(screen.getByRole('link', { name: /Hak Teâlâ/ }).getAttribute('href')).toBe('#/parcalar/hak-teala')
  })

  it('#/parcalar/<id> rotası parça sayfasını açar', () => {
    location.hash = '#/parcalar/daglar-ile-taslar-ile'
    render(<App />)
    expect(screen.getByRole('heading', { name: /Dağlar ile Taşlar ile/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: '🔊 Dinle' })).toBeTruthy()
  })

  it('bilinmeyen parça için bulunamadı ekranını gösterir', () => {
    for (const hash of ['#/parcalar/yok', '#/parcalar/toString', '#/parcalar/', '#/parcalar/__proto__']) {
      location.hash = hash
      render(<App />)
      expect(screen.getByText('Sayfa bulunamadı')).toBeTruthy()
      cleanup()
    }
  })
})
