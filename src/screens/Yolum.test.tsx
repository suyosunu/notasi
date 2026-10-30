import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SEVIYELER } from '../content/seviyeler'
import { addLongTone, getSettings, isaretEkle, resetDbForTests } from '../store/db'
import { loadIlerleme } from '../learning/seviye'
import { Yolum } from './Yolum'

vi.mock('../learning/seviye', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../learning/seviye')>()
  return { ...actual, loadIlerleme: vi.fn(actual.loadIlerleme) }
})

beforeEach(async () => {
  await resetDbForTests()
  location.hash = ''
})
afterEach(() => {
  cleanup()
  location.hash = ''
})

/** Hedef satırı: metni içeren `li`. */
function satir(metin: string | RegExp): HTMLElement {
  return screen.getByText(metin).closest('li')!
}

describe('Yolum', () => {
  it('mevcut seviye üstte açık: ad, süre ve hedef listesi', async () => {
    render(<Yolum />)
    const bolum = (await screen.findByRole('heading', { name: /Seviye 0 · Hazırlık/ })).closest('section')!
    expect(bolum.textContent).toContain('1–3 hafta')
    expect(within(bolum).getAllByRole('listitem')).toHaveLength(SEVIYELER[0]!.hedefler.length)
    expect(within(bolum).getByText('Neyin bölümlerini öğrendim')).toBeTruthy()
    // Diğer seviyeler <details> içindedir ve mevcut seviye onlardan ayrıdır.
    expect(bolum.closest('details')).toBeNull()
    expect(document.querySelectorAll('details')).toHaveLength(SEVIYELER.length - 1)
  })

  it('tamam hedef ✓, eksik hedef ○ ile gösterilir; ilerleme yazılır', async () => {
    await isaretEkle('okunanDersler', 's0:neyi-tani')
    await addLongTone({ perdeId: 'neva', durationMs: 4200, passed: true, toleranceCents: 20 })
    render(<Yolum />)
    await screen.findByText('Neyin bölümlerini öğrendim')
    expect(within(satir('Neyin bölümlerini öğrendim')).getByRole('img', { name: 'tamam' }).textContent).toBe('✓')
    expect(within(satir('Duruş ve tutuş dersini okudum')).getByRole('img', { name: 'eksik' }).textContent).toBe('○')
    expect(satir(/Nevâ'da 5 sn kararlı ses/).textContent).toContain('en iyi 4,2 sn')
  })

  it('geçmemiş uzun ses denemesi ilerleme yazdırmaz', async () => {
    await addLongTone({ perdeId: 'neva', durationMs: 5800, passed: false, toleranceCents: 20 })
    render(<Yolum />)
    await screen.findByText('Neyin bölümlerini öğrendim')
    const li = satir(/Nevâ'da 5 sn kararlı ses/)
    expect(li.textContent).not.toContain('en iyi')
    expect(within(li).getByRole('img', { name: 'eksik' })).toBeTruthy()
  })

  it('ilerleme okunamazsa başlık, kısa bir not ve ana ekrana dönüş bağlantısı görünür', async () => {
    vi.mocked(loadIlerleme).mockRejectedValueOnce(new Error('db'))
    render(<Yolum />)
    expect(screen.getByRole('heading', { name: /Yolum/ })).toBeTruthy()
    expect(await screen.findByText('İlerleme okunamadı.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ana ekrana dön' }).getAttribute('href')).toBe('#/')
    expect(screen.queryByText('Diğer seviyeler')).toBeNull()
  })

  it('onay kutusu işaretlenince kaydedilir, yeniden açılınca işaretli kalır ve kaldırılabilir', async () => {
    const { unmount } = render(<Yolum />)
    const kutu = (await within(await waitSatir('Duruşumu ve tutuşumu aynada kontrol ettim')).findByRole(
      'checkbox',
    )) as HTMLInputElement
    expect(kutu.checked).toBe(false)
    fireEvent.click(kutu)
    await waitFor(async () => expect((await getSettings()).onaylananHedefler).toContain('s0-ayna'))
    await waitFor(() => expect(kutu.checked).toBe(true))

    unmount()
    render(<Yolum />)
    const yeni = within(await waitSatir('Duruşumu ve tutuşumu aynada kontrol ettim')).getByRole(
      'checkbox',
    ) as HTMLInputElement
    expect(yeni.checked).toBe(true)

    fireEvent.click(yeni)
    await waitFor(async () => expect((await getSettings()).onaylananHedefler).not.toContain('s0-ayna'))
    await waitFor(() => expect(yeni.checked).toBe(false))
  })

  it('"Git" bağlantıları hedefin rotasına gider; ders hedefleri ders sayfasına götürür', async () => {
    render(<Yolum />)
    await screen.findByText('Neyin bölümlerini öğrendim')
    expect(within(satir('4-4-4 nefes egzersizini tamamladım')).getByRole('link', { name: 'Git' }).getAttribute('href')).toBe(
      '#/hazirlik/nefes',
    )
    expect(within(satir('İlk sesi çıkardım')).getByRole('link', { name: 'Git' }).getAttribute('href')).toBe('#/aksam')
    expect(within(satir(/Başpâreyi koyunca/)).getByRole('link', { name: 'Git' }).getAttribute('href')).toBe(
      '#/hazirlik/baspare',
    )
    const git = (ad: string) => within(satir(ad)).getByRole('link', { name: 'Git' }).getAttribute('href')
    expect(git('Neyin bölümlerini öğrendim')).toBe('#/ders/s0%3Aneyi-tani')
    expect(git('Duruş ve tutuş dersini okudum')).toBe('#/ders/s0%3Adurus')
    expect(git('Duruşumu ve tutuşumu aynada kontrol ettim')).toBe('#/ders/s0%3Adurus')
  })

  it('hedefsiz seviyede özet ve "sonraki aşamalarda" metni görünür', async () => {
    render(<Yolum />)
    await screen.findByText('Neyin bölümlerini öğrendim')
    const ozet = [...document.querySelectorAll('details')].find((d) => d.textContent?.includes('Seviye 4 ·'))!
    expect(ozet.textContent).toContain('Seviye 4 · Tiz sesler, basit makamlar')
    expect(ozet.textContent).toContain(SEVIYELER[4]!.ozet)
    expect(ozet.textContent).toContain('Bu seviyenin hedefleri sonraki aşamalarda gelecek.')
  })

  it('Seviye 3 hedefleri listelenir; okunmuş makam:giris ✓', async () => {
    await isaretEkle('okunanDersler', 'makam:giris')
    render(<Yolum />)
    await screen.findByText('Neyin bölümlerini öğrendim')
    const bolum = [...document.querySelectorAll('details')].find((d) => d.textContent?.includes('Seviye 3 ·'))!
    expect(within(bolum as HTMLElement).getAllByRole('listitem')).toHaveLength(SEVIYELER[3]!.hedefler.length)
    expect(bolum.textContent).not.toContain('Bu seviyenin hedefleri sonraki aşamalarda gelecek.')
    expect(bolum.textContent).toContain('Nim Hisar: 8 sn uzun ses')
    expect(bolum.textContent).toContain('Nevâ makamı dizisi')
    const git = (ad: string | RegExp) => within(satir(ad)).getByRole('link', { name: 'Git' }).getAttribute('href')
    expect(git('Nevâ makamı dizisi')).toBe('#/etut/dizi-neva')
    expect(git(/Yine Bağlandı Dil aranağmesi/)).toBe('#/parcalar/yine-baglandi-dil-aranagme')
    expect(git("Hak Teâlâ'yı baştan sona çaldım")).toBe('#/parcalar/hak-teala')
    // Makam dersini okumak ✓ verir; okunmamış beşli dersi ○ kalır.
    const makam = SEVIYELER[3]!.hedefler.find((h) => h.id === 's3-makam')!
    expect(within(satir(makam.metin)).getByRole('img', { name: 'tamam' }).textContent).toBe('✓')
    const besli = SEVIYELER[3]!.hedefler.find((h) => h.id === 's3-besli')!
    expect(within(satir(besli.metin)).getByRole('img', { name: 'eksik' })).toBeTruthy()
  })

  it('Seviye 2 hedefleri liste olarak görünür; s2-ezgi onaylanabilir', async () => {
    render(<Yolum />)
    await screen.findByText('Neyin bölümlerini öğrendim')
    const bolum = [...document.querySelectorAll('details')].find((d) => d.textContent?.includes('Seviye 2 ·'))!
    expect(within(bolum as HTMLElement).getAllByRole('listitem')).toHaveLength(SEVIYELER[2]!.hedefler.length)
    expect(bolum.textContent).toContain('Nim Sofyan usulünü vurdum')
    expect(bolum.textContent).toContain('Üç usulde birer etüt')
    expect(bolum.textContent).toContain('Çârgâh, Kürdî ve Hicaz dörtlüleri')
    expect(bolum.textContent).not.toContain('Bu seviyenin hedefleri sonraki aşamalarda gelecek.')

    const vur = within(satir('Semâî usulünü vurdum')).getByRole('link', { name: 'Git' })
    expect(vur.getAttribute('href')).toBe('#/usul/vur/semai')
    expect(within(satir('Semâî usulünü vurdum')).getByRole('img', { name: 'eksik' })).toBeTruthy()

    const kutu = within(satir(/Benim Adım Dertli Dolap/)).getByRole('checkbox') as HTMLInputElement
    expect(kutu.checked).toBe(false)
    fireEvent.click(kutu)
    await waitFor(async () => expect((await getSettings()).onaylananHedefler).toContain('s2-ezgi'))
    await waitFor(() => expect(kutu.checked).toBe(true))
  })

  it('vurulan usul Yolum’da ✓ görünür', async () => {
    await isaretEkle('vurulanUsuller', 'semai')
    render(<Yolum />)
    await screen.findByText('Neyin bölümlerini öğrendim')
    expect(within(satir('Semâî usulünü vurdum')).getByRole('img', { name: 'tamam' }).textContent).toBe('✓')
    expect(within(satir('Sofyan usulünü vurdum')).getByRole('img', { name: 'eksik' })).toBeTruthy()
  })

  it('sayıların öneri olduğu notu görünür; ana ekrana dönüş bağlantısı vardır', async () => {
    render(<Yolum />)
    await screen.findByText('Neyin bölümlerini öğrendim')
    expect(screen.getByText('Sayılar öneridir; bir ney hocasıyla doğrulanması iyi olur.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ana ekrana dön' }).getAttribute('href')).toBe('#/')
  })
})

async function waitSatir(metin: string): Promise<HTMLElement> {
  await screen.findByText(metin)
  return satir(metin)
}
