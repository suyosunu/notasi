import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App, rotaBilinir } from './app'
import { DERSLER } from './content/dersler'
import type { Ders } from './content/dersler/types'
import { getSettings, resetDbForTests, saveSettings, setPlacedOut } from './store/db'

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

  it('#/nota/<konu> rotası serbest turu açar (konunun dersi okunduysa)', async () => {
    await saveSettings({ okunanDersler: ['nota:nota-1'] })
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
    await saveSettings({ calibrated: true, okunanDersler: ['s0:uzun-ses', 'perde:neva'] })
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

  it('#/aksam rotası akşam pratiğini açar (yeni kullanıcıda önce ilk ses dersi)', async () => {
    location.hash = '#/aksam'
    render(<App />)
    expect(await screen.findByRole('heading', { name: /Dudak ve ilk ses/ })).toBeTruthy()
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

  it('#/etut/<id> rotası etüt sayfasını açar (önce ders kapısı); bilinmeyen etüt bulunamadı ekranı', async () => {
    location.hash = '#/etut/tek-neva'
    render(<App />)
    expect(await screen.findByRole('heading', { name: /Etüt nasıl çalışılır/ })).toBeTruthy()
    cleanup()
    for (const hash of ['#/etut/yok', '#/etut/', '#/etut/__proto__']) {
      location.hash = hash
      render(<App />)
      expect(screen.getByText('Sayfa bulunamadı')).toBeTruthy()
      cleanup()
    }
    expect(rotaBilinir('/etut/rast-besli-2')).toBe(true)
    expect(rotaBilinir('/etut/yok')).toBe(false)
  })

  describe('Öğren ve ders rotaları', () => {
    const FIXTURE: Ders = {
      id: 's0:rota deneme',
      seviye: 0,
      baslik: 'Rota dersi',
      bloklar: [
        { tur: 'metin', metin: 'Rota dersi metni.' },
        { tur: 'gorsel', ad: 'nefes-444' },
        { tur: 'dene', adimlar: ['Dene'] },
      ],
      kaynaklar: ['test'],
      alistirma: '/hakkinda',
    }
    beforeEach(() => {
      DERSLER.push(FIXTURE)
    })
    afterEach(() => {
      DERSLER.splice(DERSLER.indexOf(FIXTURE), 1)
    })

    it('#/ogren rotası Öğren bölümünü gösterir', async () => {
      location.hash = '#/ogren'
      render(<App />)
      expect(await screen.findByRole('heading', { name: '📖 Öğren' })).toBeTruthy()
      expect(await screen.findByText('Rota dersi')).toBeTruthy()
    })

    it('#/ders/<kodlanmış kimlik> ders sayfasını açar; "Anladım" kaydeder ve ders.alistirma rotasına gider', async () => {
      location.hash = '#/ders/' + encodeURIComponent(FIXTURE.id)
      render(<App />)
      expect(await screen.findByText('Rota dersi metni.')).toBeTruthy()
      expect(screen.getByRole('link', { name: 'Öğren bölümüne dön' }).getAttribute('href')).toBe('#/ogren')
      fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
      await waitFor(() => expect(location.hash).toBe('#/hakkinda'))
      expect((await getSettings()).okunanDersler).toEqual([FIXTURE.id])
    })

    it('alıştırması olmayan ders sonunda /ogren sayfasına gider', async () => {
      const yalin: Ders = { ...FIXTURE, id: 's0:yalin', alistirma: undefined }
      DERSLER.push(yalin)
      try {
        location.hash = '#/ders/s0%3Ayalin'
        render(<App />)
        fireEvent.click(await screen.findByRole('button', { name: 'Anladım, alıştırmaya geç' }))
        await waitFor(() => expect(location.hash).toBe('#/ogren'))
      } finally {
        DERSLER.splice(DERSLER.indexOf(yalin), 1)
      }
    })

    it('bilinmeyen ders kimliğinde "Ders bulunamadı" ve geri bağlantısı çıkar', () => {
      location.hash = '#/ders/yok%3Ayok'
      render(<App />)
      expect(screen.getByText('Ders bulunamadı')).toBeTruthy()
      expect(screen.getByRole('link', { name: 'Öğren bölümüne dön' }).getAttribute('href')).toBe('#/ogren')
    })

    it('bozuk kodlanmış kimlik de çökmeden "Ders bulunamadı" gösterir', () => {
      location.hash = '#/ders/%E0%A4%A'
      render(<App />)
      expect(screen.getByText('Ders bulunamadı')).toBeTruthy()
    })

    it('rotaBilinir: sabit rotalar, önek + var olan kimlik; bilinmeyenler false', () => {
      expect(rotaBilinir('/')).toBe(true)
      expect(rotaBilinir('/ogren')).toBe(true)
      expect(rotaBilinir('/nota/nota-1')).toBe(true)
      expect(rotaBilinir('/nota/karisik')).toBe(true)
      expect(rotaBilinir('/ney/neva')).toBe(true)
      expect(rotaBilinir('/hazirlik/nefes')).toBe(true)
      expect(rotaBilinir('/hazirlik/baspare')).toBe(true)
      expect(rotaBilinir('/hazirlik/yok')).toBe(false)
      expect(rotaBilinir('/ders/' + encodeURIComponent(FIXTURE.id))).toBe(true)
      expect(rotaBilinir('/ders/yok')).toBe(false)
      expect(rotaBilinir('/nota/yok')).toBe(false)
      expect(rotaBilinir('/yok')).toBe(false)
      expect(rotaBilinir('/constructor')).toBe(false)
    })
  })
})
