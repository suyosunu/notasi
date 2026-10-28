import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { USULLER } from '../content/usuller'
import { VurusDiagram } from './VurusDiagram'

afterEach(cleanup)

const usul = (id: string) => USULLER.find((u) => u.id === id)!
const kutular = () => [...document.querySelectorAll<HTMLElement>('[data-testid="vurus"]')]

describe('VurusDiagram', () => {
  it('her vuruş için bir kutu: etiketli, süreyle orantılı genişlikte; düm ve tek farklı renkte', () => {
    render(<VurusDiagram usul={usul('duyek')} active={null} />)
    expect(kutular().map((b) => b.textContent)).toEqual(['düm', 'tek', 'tek', 'düm', 'tek'])
    expect(kutular().map((b) => b.style.width)).toEqual(['12.5%', '25%', '12.5%', '25%', '25%'])
    const c = kutular().map((b) => b.className)
    expect(c[0]).toBe(c[3])
    expect(c[1]).toBe(c[2])
    expect(c[0]).not.toBe(c[1])
  })

  it('role=img ve vuruşları sayan Türkçe etiket', () => {
    render(<VurusDiagram usul={usul('sofyan')} active={null} />)
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('düm te ke')
  })

  it('active verilen kutu data-active="true" taşır; active verilmezse hiçbiri', () => {
    const { rerender } = render(<VurusDiagram usul={usul('semai')} active={1} />)
    expect(kutular().map((b) => b.getAttribute('data-active'))).toEqual([null, 'true', null])
    rerender(<VurusDiagram usul={usul('semai')} />)
    expect(kutular().map((b) => b.getAttribute('data-active'))).toEqual([null, null, null])
  })

  it('vuruşu olmayan usulde (Dolap) kutu yok, açıklama görünür', () => {
    render(<VurusDiagram usul={usul('dolap')} active={null} />)
    expect(kutular()).toHaveLength(0)
    expect(screen.getByText('Bu usulün vuruş kalıbı kaynaklarda bulunamadı; yalnızca zaman sayılır (12/8).')).toBeTruthy()
  })
})
