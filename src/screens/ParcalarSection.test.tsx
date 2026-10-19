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

  it('ana ekrana dönüş bağlantısı', () => {
    render(<ParcalarSection />)
    expect(screen.getByRole('link', { name: 'Ana ekrana dön' }).getAttribute('href')).toBe('#/')
  })
})
