import { cleanup, fireEvent, render, screen } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PARCALAR } from '../content/parcalar'
import { parcaSeviyesi } from '../learning/parca-seviye'
import { ParcalarSection } from './ParcalarSection'

beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const satirlar = () => screen.queryAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('#/parcalar/'))
const hrefler = () => satirlar().map((a) => a.getAttribute('href')!.replace('#/parcalar/', ''))
const sec = (ad: string, deger: string) => fireEvent.change(screen.getByLabelText(ad), { target: { value: deger } })
const seviyeOf = (id: string) => parcaSeviyesi(PARCALAR.find((p) => p.id === id)!.olcu)
const etiket = (ad: string) => screen.getByText(ad).closest('a')!.querySelector('.seviye-etiket')?.textContent
const hepsi = PARCALAR.map((p) => p.id)

describe('ParcalarSection', () => {
  it('her parçayı ad, makam, usul ve besteciyle listeler; parça sayfasına bağlanır', () => {
    render(<ParcalarSection />)
    expect(screen.getByRole('heading', { name: /Parçalar/ })).toBeTruthy()
    expect([...hrefler()].sort()).toEqual([...hepsi].sort())
    const hak = screen.getByText('Hak Teâlâ').closest('a')!
    expect(hak.textContent).toContain('Uşşak · Sofyan · Ali Ufkî')
    const daglar = screen.getByText('Dağlar ile Taşlar ile').closest('a')!
    expect(daglar.textContent).toContain('Hicaz · Sofyan · Kutbî Dede')
    const dolap = screen.getByText('Benim Adım Dertli Dolap').closest('a')!
    expect(dolap.textContent).toContain('Uşşak · Dolap · Anonim')
  })

  it('makam ve usul adları doğru', () => {
    render(<ParcalarSection />)
    const satir = (ad: string) => screen.getByText(ad).closest('a')!
    const beklenen: [string, string][] = [
      ['Allah Emrin Tutalım', 'Uşşak · Düyek · Zekâî Dede'],
      ['Hicran Oku (aranağme)', 'Hüseynî · Türk Aksağı · Şevki Bey'],
      ['Gül Yüzlülerin (1–16. ölçü)', "Bayâtî · Yürük Semâî (6/4) · Tab'î Mustafa Efendi"],
      ['Çeçen Kızı', 'Hüseynî · Nim Sofyan · Tanburi Cemil Bey'],
      ['Yine Bağlandı Dil (aranağme)', 'Nevâ · Yürük Semâî · Zekâî Dede'],
    ]
    for (const [ad, bilgi] of beklenen) expect(satir(ad).textContent).toContain(bilgi)
  })

  it('neyzen.com eserleri: Segâh adı makam sayfası olmasa da yazılır; Uşşak ve Rast adı korunur', () => {
    render(<ParcalarSection />)
    const satir = (ad: string) => screen.getByText(ad).closest('a')!
    expect(satir('Şol Cennetin Irmakları (Segâh)').textContent).toContain('Segâh · Yürük Semâî · Münir Nüreddin Selçuk')
    expect(satir("Kâbe'nin Yolları").textContent).toContain('Rast · Sofyan · Bilinmiyor')
    expect(satir('Bilmem Nideyim Aşkın Elinden').textContent).toContain('Uşşak · Sofyan · Hâfız Mehmet Nezih Tolan')
  })

  it('seviye etiketi parçanın notasından hesaplanan değeri gösterir', () => {
    render(<ParcalarSection />)
    for (const p of PARCALAR) expect(etiket(p.title), p.id).toBe(`Seviye ${parcaSeviyesi(p.olcu) ?? '?'}`)
    expect(etiket('Benim Adım Dertli Dolap')).toBe('Seviye 2')
    expect(etiket('Hak Teâlâ')).toBe('Seviye 3')
    expect(etiket('Çeçen Kızı')).toBe('Seviye 4')
    // Fa 4 diyez (4 koma) uygulama perdelerinde yok.
    expect(etiket('Dağlar ile Taşlar ile')).toBe('Seviye ?')
  })

  it('liste seviyeye göre sıralanır; seviyesizler sonda, aynı seviyede mevcut sıra korunur', () => {
    render(<ParcalarSection />)
    const sira = hrefler()
    const sayi = (id: string) => seviyeOf(id) ?? Infinity
    for (let i = 1; i < sira.length; i++) {
      const [onceki, sonraki] = [sira[i - 1]!, sira[i]!]
      expect(sayi(onceki)).toBeLessThanOrEqual(sayi(sonraki))
      if (sayi(onceki) === sayi(sonraki)) expect(hepsi.indexOf(onceki)).toBeLessThan(hepsi.indexOf(sonraki))
    }
    expect(seviyeOf(sira[0]!)).toBe(1)
    expect(sira[sira.length - 1]).toBe('daglar-ile-taslar-ile')
  })

  it('üç filtre vardır; seviye 1–4 ve "?", makam ve usul seçenekleri listede bulunanlardır', () => {
    render(<ParcalarSection />)
    const secenekler = (ad: string) => [...(screen.getByLabelText(ad) as HTMLSelectElement).options].map((o) => o.textContent)
    expect(secenekler('Seviye')).toEqual(['Tümü', '1', '2', '3', '4', '?'])
    expect(secenekler('Makam')).toContain('Uşşak')
    expect(secenekler('Makam')).toContain('Hüseynî')
    expect(secenekler('Makam')).toContain('Rast')
    expect(secenekler('Makam')).toContain('Segâh')
    expect(secenekler('Makam')).not.toContain('Muhayyer')
    expect(secenekler('Usul')).toContain('Düyek')
    expect(secenekler('Usul')).not.toContain('Devr-i Hindî')
  })

  it('seviye filtresi süzer', () => {
    render(<ParcalarSection />)
    sec('Seviye', '4')
    expect(hrefler()).toEqual(hepsi.filter((id) => seviyeOf(id) === 4))
    sec('Seviye', '?')
    expect(hrefler()).toEqual(['daglar-ile-taslar-ile'])
    sec('Seviye', '')
    expect(hrefler()).toHaveLength(hepsi.length)
  })

  it('makam ve usul filtreleri süzer, seviyeyle birlikte çalışır; sonuç boşsa ileti çıkar', () => {
    render(<ParcalarSection />)
    sec('Makam', 'ussak')
    expect(hrefler()).toEqual(expect.arrayContaining(['hak-teala', 'allah-emrin-tutalim', 'benim-adim-dertli-dolap']))
    for (const id of hrefler()) expect(PARCALAR.find((p) => p.id === id)!.makam).toBe('ussak')
    sec('Usul', 'sofyan')
    expect(hrefler()).toEqual(
      expect.arrayContaining(['hak-teala', 'urumda-acemde', 'urumda-acemde--yemen-ellerinde', 'bilmem-nideyim']),
    )
    for (const id of hrefler()) expect(PARCALAR.find((p) => p.id === id)!.usul).toBe('sofyan')
    sec('Seviye', '3')
    expect(hrefler()).toEqual(['hak-teala', 'ben-melamet-hirkasini', 'bilmem-nideyim'])
    expect(screen.queryByText('Bu seçime uyan parça yok.')).toBeNull()
    sec('Seviye', '4')
    expect(satirlar()).toHaveLength(0)
    expect(screen.getByText('Bu seçime uyan parça yok.')).toBeTruthy()
  })

  it('seçim localStorage’da tutulur ve yeniden açılışta geri gelir', () => {
    render(<ParcalarSection />)
    sec('Makam', 'ussak')
    sec('Seviye', '3')
    expect(JSON.parse(localStorage.getItem('notasi.parcaFiltre')!)).toEqual({ seviye: '3', makam: 'ussak', usul: '' })
    cleanup()
    render(<ParcalarSection />)
    expect((screen.getByLabelText('Makam') as HTMLSelectElement).value).toBe('ussak')
    expect((screen.getByLabelText('Seviye') as HTMLSelectElement).value).toBe('3')
    expect(hrefler()).toContain('hak-teala')
    for (const id of hrefler()) expect(seviyeOf(id)).toBe(3)
  })

  it('listede artık olmayan kayıtlı seçim Tümü sayılır; bozuk kayıt sayfayı bozmaz', () => {
    localStorage.setItem('notasi.parcaFiltre', JSON.stringify({ seviye: '9', makam: 'yok', usul: 5 }))
    render(<ParcalarSection />)
    expect(hrefler()).toHaveLength(hepsi.length)
    cleanup()
    localStorage.setItem('notasi.parcaFiltre', '{bozuk')
    render(<ParcalarSection />)
    expect(hrefler()).toHaveLength(hepsi.length)
  })

  it('localStorage okuma ve yazma hata atsa da sayfa açılır ve filtre çalışır', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('erişim yok')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('kota')
    })
    render(<ParcalarSection />)
    expect(hrefler()).toHaveLength(hepsi.length)
    sec('Seviye', '2')
    expect(hrefler()).toEqual(hepsi.filter((id) => seviyeOf(id) === 2))
  })

  it('ana ekrana dönüş bağlantısı', () => {
    render(<ParcalarSection />)
    expect(screen.getByRole('link', { name: 'Ana ekrana dön' }).getAttribute('href')).toBe('#/')
  })
})
