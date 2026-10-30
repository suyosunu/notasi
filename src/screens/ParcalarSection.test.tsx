import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { PARCALAR } from '../content/parcalar'
import { ParcalarSection } from './ParcalarSection'

afterEach(cleanup)

describe('ParcalarSection', () => {
  it('her parçayı ad, makam, usul ve besteciyle listeler; parça sayfasına bağlanır', () => {
    render(<ParcalarSection />)
    expect(screen.getByRole('heading', { name: /Parçalar/ })).toBeTruthy()
    const links = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('#/parcalar/'))
    expect(links.map((a) => a.getAttribute('href'))).toEqual(PARCALAR.map((p) => `#/parcalar/${p.id}`))
    const hak = screen.getByText('Hak Teâlâ').closest('a')!
    expect(hak.textContent).toContain('Uşşak · Sofyan · Ali Ufkî')
    const daglar = screen.getByText('Dağlar ile Taşlar ile').closest('a')!
    expect(daglar.textContent).toContain('Hicaz · Sofyan · Kutbî Dede')
    const dolap = screen.getByText('Benim Adım Dertli Dolap').closest('a')!
    expect(dolap.textContent).toContain('Uşşak · Dolap · Anonim')
  })

  it('sekiz parça Global Constraints sırasıyla; dört yeni eser "Seviye 4" etiketli, makam ve usul adları doğru', () => {
    render(<ParcalarSection />)
    const links = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('#/parcalar/'))
    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      [
        'benim-adim-dertli-dolap',
        'yine-baglandi-dil-aranagme',
        'hak-teala',
        'allah-emrin-tutalim',
        'hicran-oku-aranagme',
        'gul-yuzlulerin',
        'daglar-ile-taslar-ile',
        'cecen-kizi',
      ].map((id) => `#/parcalar/${id}`),
    )
    const satir = (ad: string) => screen.getByText(ad).closest('a')!
    const beklenen: [string, string][] = [
      ['Allah Emrin Tutalım', 'Uşşak · Düyek · Zekâî Dede'],
      ['Hicran Oku (aranağme)', 'Hüseynî · Türk Aksağı · Şevki Bey'],
      ['Gül Yüzlülerin (1–16. ölçü)', "Bayâtî · Yürük Semâî (6/4) · Tab'î Mustafa Efendi"],
      ['Çeçen Kızı', 'Hüseynî · Nim Sofyan · Tanburi Cemil Bey'],
    ]
    for (const [ad, bilgi] of beklenen) {
      expect(satir(ad).textContent).toContain(bilgi)
      expect(satir(ad).querySelector('.seviye-etiket')?.textContent, ad).toBe('Seviye 4')
    }
  })

  it('aranağme "Seviye 3" etiketiyle ikinci sırada; makam Nevâ, usul Yürük Semâî', () => {
    render(<ParcalarSection />)
    const links = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.startsWith('#/parcalar/'))
    const ikinci = links[1]!
    expect(ikinci.getAttribute('href')).toBe('#/parcalar/yine-baglandi-dil-aranagme')
    expect(ikinci.textContent).toContain('Yine Bağlandı Dil (aranağme)')
    expect(ikinci.textContent).toContain('Nevâ · Yürük Semâî · Zekâî Dede')
    expect(ikinci.querySelector('.seviye-etiket')?.textContent).toBe('Seviye 3')
  })

  it('önerilen seviye etiketi: Dolap 2, Hak Teâlâ 3, Dağlar ile Taşlar ile 4', () => {
    render(<ParcalarSection />)
    const etiket = (ad: string) => screen.getByText(ad).closest('a')!.querySelector('.seviye-etiket')?.textContent
    expect(etiket('Hak Teâlâ')).toBe('Seviye 3')
    expect(etiket('Dağlar ile Taşlar ile')).toBe('Seviye 4')
    expect(etiket('Benim Adım Dertli Dolap')).toBe('Seviye 2')
  })

  it('ana ekrana dönüş bağlantısı', () => {
    render(<ParcalarSection />)
    expect(screen.getByRole('link', { name: 'Ana ekrana dön' }).getAttribute('href')).toBe('#/')
  })
})
