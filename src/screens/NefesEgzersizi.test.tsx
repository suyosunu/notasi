import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { acquireWakeLock, releaseWakeLock } from '../audio/wakeLock'
import { NEFES_HEDEF_ID } from '../learning/baspare'
import { getSettings, isaretEkle, resetDbForTests } from '../store/db'
import { NefesEgzersizi } from './NefesEgzersizi'

vi.mock('../audio/wakeLock', () => ({
  acquireWakeLock: vi.fn(() => Promise.resolve()),
  releaseWakeLock: vi.fn(),
}))

beforeEach(async () => {
  vi.mocked(acquireWakeLock).mockClear()
  vi.mocked(releaseWakeLock).mockClear()
  await resetDbForTests()
  location.hash = ''
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  location.hash = ''
})

/** Yalnız aralık zamanlayıcısı ve saat sahte (süre duvar saatinden hesaplanır); IndexedDB ve bekleme yardımcıları gerçek. */
function sahteAralik() {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
}

function gec(sn: number) {
  act(() => {
    vi.advanceTimersByTime(sn * 1000)
  })
}

async function hazirla() {
  await isaretEkle('okunanDersler', 's0:nefes')
  render(<NefesEgzersizi />)
  const btn = await screen.findByRole('button', { name: 'Başla' })
  sahteAralik()
  return btn
}

describe('NefesEgzersizi', () => {
  it('başlamadan önce yönergeyi gösterir, sayaç çalışmaz', async () => {
    await hazirla()
    expect(screen.getByText(/4 tur/)).toBeTruthy()
    expect(screen.queryByText('Nefes al')).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('faz sırası Al → Tut → Ver ilerler; geri sayım 4’ten 1’e iner ve tur sayısı artar', async () => {
    const btn = await hazirla()
    fireEvent.click(btn)
    expect(screen.getByText('Nefes al')).toBeTruthy()
    expect(screen.getByTestId('nefes-sayac').textContent).toBe('4')
    expect(screen.getByText('Tur 1/4')).toBeTruthy()
    gec(1)
    expect(screen.getByTestId('nefes-sayac').textContent).toBe('3')
    gec(3)
    expect(screen.getByText('Nefes tut')).toBeTruthy()
    expect(screen.getByTestId('nefes-sayac').textContent).toBe('4')
    gec(4)
    expect(screen.getByText('Nefes ver')).toBeTruthy()
    gec(3)
    expect(screen.getByTestId('nefes-sayac').textContent).toBe('1')
    gec(1)
    expect(screen.getByText('Nefes al')).toBeTruthy()
    expect(screen.getByText('Tur 2/4')).toBeTruthy()
  })

  it('48 sn sonra "Tamamlandı ✓" görünür ve hedef işareti yazılır; öncesinde yazılmaz', async () => {
    const btn = await hazirla()
    fireEvent.click(btn)
    gec(47)
    expect(screen.getByText('Tur 4/4')).toBeTruthy()
    expect(screen.queryByText('Tamamlandı ✓')).toBeNull()
    expect((await getSettings()).onaylananHedefler).not.toContain(NEFES_HEDEF_ID)
    gec(1)
    expect(screen.getByText('Tamamlandı ✓')).toBeTruthy()
    expect(vi.getTimerCount()).toBe(0)
    await waitFor(async () => expect((await getSettings()).onaylananHedefler).toContain(NEFES_HEDEF_ID))
    // Tamamlanınca yeniden çalışmak serbest.
    fireEvent.click(screen.getByRole('button', { name: 'Yeniden başla' }))
    expect(screen.getByText('Nefes al')).toBeTruthy()
    expect(screen.getByText('Tur 1/4')).toBeTruthy()
  })

  it('zamanlayıcı yavaşlatılsa da süre duvar saatine göre ilerler (tik sayısına göre değil)', async () => {
    const btn = await hazirla()
    fireEvent.click(btn)
    // iOS zamanlayıcıyı dondurdu: 20 sn geçti ama tek tik bile çalışmadı; sonraki tik gerçek süreyi okur.
    act(() => {
      vi.setSystemTime(Date.now() + 20_000)
      vi.advanceTimersByTime(250)
    })
    expect(screen.getByText('Tur 2/4')).toBeTruthy()
    expect(screen.getByText('Nefes ver')).toBeTruthy() // 20. sn: tur 2'nin 9. sn'si → ver
    // Uzun donma 48 sn'yi aşarsa çalışma tamamlanır.
    act(() => {
      vi.setSystemTime(Date.now() + 40_000)
      vi.advanceTimersByTime(250)
    })
    expect(screen.getByText('Tamamlandı ✓')).toBeTruthy()
    await waitFor(async () => expect((await getSettings()).onaylananHedefler).toContain(NEFES_HEDEF_ID))
  })

  it('"Durdur" zamanlayıcıyı temizler ve başa döndürür; işaret yazılmaz', async () => {
    const btn = await hazirla()
    fireEvent.click(btn)
    gec(5)
    expect(vi.getTimerCount()).toBe(1)
    fireEvent.click(screen.getByRole('button', { name: 'Durdur' }))
    expect(vi.getTimerCount()).toBe(0)
    expect(screen.getByRole('button', { name: 'Başla' })).toBeTruthy()
    gec(60)
    expect(screen.queryByText('Tamamlandı ✓')).toBeNull()
    expect((await getSettings()).onaylananHedefler).not.toContain(NEFES_HEDEF_ID)
  })

  it('sayfadan çıkınca (unmount) zamanlayıcı temizlenir', async () => {
    const btn = await hazirla()
    fireEvent.click(btn)
    gec(2)
    expect(vi.getTimerCount()).toBe(1)
    act(() => cleanup())
    expect(vi.getTimerCount()).toBe(0)
  })

  it('ses kullanılmaz ve geri bağlantısı vardır', async () => {
    await hazirla()
    expect(screen.getByRole('link', { name: 'Öğren bölümüne dön' }).getAttribute('href')).toBe('#/ogren')
  })

  it('ders okunmamışsa önce ders gelir, "Anladım"dan sonra alıştırma açılır', async () => {
    render(<NefesEgzersizi />)
    expect(await screen.findByRole('heading', { name: '📖 Nefes' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Başla' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    expect(await screen.findByRole('button', { name: 'Başla' })).toBeTruthy()
  })

  it('ekran uyanık kilidi çalışırken alınır, "Durdur"da bırakılır; başlamadan alınmaz', async () => {
    const btn = await hazirla()
    expect(acquireWakeLock).not.toHaveBeenCalled()
    fireEvent.click(btn)
    expect(acquireWakeLock).toHaveBeenCalledTimes(1)
    expect(releaseWakeLock).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Durdur' }))
    expect(releaseWakeLock).toHaveBeenCalledTimes(1)
  })

  it('48 sn sonra bitince kilit bırakılır', async () => {
    const btn = await hazirla()
    fireEvent.click(btn)
    gec(48)
    expect(screen.getByText('Tamamlandı ✓')).toBeTruthy()
    expect(releaseWakeLock).toHaveBeenCalled()
  })

  it('çalışırken sayfadan çıkılınca kilit bırakılır', async () => {
    const btn = await hazirla()
    fireEvent.click(btn)
    expect(acquireWakeLock).toHaveBeenCalledTimes(1)
    act(() => cleanup())
    expect(releaseWakeLock).toHaveBeenCalledTimes(1)
  })
})
