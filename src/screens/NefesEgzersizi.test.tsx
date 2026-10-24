import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NEFES_HEDEF_ID } from '../learning/baspare'
import { getSettings, isaretEkle, resetDbForTests } from '../store/db'
import { NefesEgzersizi } from './NefesEgzersizi'

beforeEach(async () => {
  await resetDbForTests()
  location.hash = ''
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  location.hash = ''
})

/** Yalnız aralık zamanlayıcısı sahte; IndexedDB ve bekleme yardımcıları gerçek zamanda çalışır. */
function sahteAralik() {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
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
})
