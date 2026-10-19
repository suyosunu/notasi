import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.resetModules()
  vi.doUnmock('../config')
})

describe('About', () => {
  it('Strudel ve AGPL-3.0-or-later bildirimini gösterir', async () => {
    const { About } = await import('./About')
    render(<About />)
    expect(screen.getByText('Notası, ney ve nota öğrenmek için kişisel bir uygulamadır.')).toBeTruthy()
    expect(
      screen.getByText('Ses motoru: Strudel (strudel.cc), © Strudel katkıcıları, AGPL-3.0-or-later lisansıyla.'),
    ).toBeTruthy()
    const symbtr = screen.getByRole('link', { name: 'SymbTr' })
    expect(symbtr.getAttribute('href')).toBe('https://github.com/MTG/SymbTr')
    const lisans = screen.getByRole('link', { name: 'CC BY-NC-SA 4.0' })
    expect(lisans.getAttribute('href')).toBe('https://creativecommons.org/licenses/by-nc-sa/4.0/')
    expect(symbtr.closest('p')?.textContent).toBe(
      'Parça notaları: SymbTr (Karaosmanoğlu 2012), CC BY-NC-SA 4.0. Notalar uygulamanın biçimine dönüştürülmüştür.',
    )
    expect(screen.getByText('← Ayarlar').closest('a')?.getAttribute('href')).toBe('#/ayarlar')
  })

  it("SOURCE_URL boşken bağlantı yerine '(yakında)' yazar", async () => {
    vi.doMock('../config', () => ({ SOURCE_URL: '' }))
    const { About } = await import('./About')
    render(<About />)
    expect(
      screen.getByText('Bu uygulamanın kaynak kodu AGPL-3.0-or-later lisansıyla açıktır: (yakında)'),
    ).toBeTruthy()
    // Yalnızca SymbTr ve lisans bağlantıları vardır; kaynak kodu bağlantısı yoktur.
    expect(Array.from(document.querySelectorAll('a[href^="http"]')).map((a) => a.getAttribute('href'))).toEqual([
      'https://github.com/MTG/SymbTr',
      'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    ])
  })

  it('SOURCE_URL doluyken bağlantı gösterir', async () => {
    vi.doMock('../config', () => ({ SOURCE_URL: 'https://example.org/notasi' }))
    const { About } = await import('./About')
    render(<About />)
    const link = screen.getByRole('link', { name: 'https://example.org/notasi' })
    expect(link.getAttribute('href')).toBe('https://example.org/notasi')
    expect(screen.getByText(/Bu uygulamanın kaynak kodu AGPL-3.0-or-later lisansıyla açıktır:/)).toBeTruthy()
  })
})
