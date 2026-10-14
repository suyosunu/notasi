import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const startPitchStream = vi.fn()
vi.mock('../audio/mic', async (orig) => {
  const actual = await orig<typeof import('../audio/mic')>()
  return { ...actual, startPitchStream: (...a: unknown[]) => startPitchStream(...a) }
})

import { MicError } from '../audio/mic'
import { MicGate } from './MicGate'

beforeEach(() => {
  startPitchStream.mockReset()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true })
})

function renderGate(onSample = vi.fn()) {
  return render(
    <MicGate onSample={onSample}>
      {(start, stop, running) => (
        <div>
          <button onClick={() => void start()}>Başlat</button>
          <button onClick={stop}>Durdur</button>
          <span data-testid="state">{running ? 'açık' : 'kapalı'}</span>
        </div>
      )}
    </MicGate>,
  )
}

describe('MicGate', () => {
  it('izin reddedilince (NotAllowedError) Türkçe açıklama ve Tekrar dene gösterir', async () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        resume = () => Promise.resolve()
        close = () => Promise.resolve()
      },
    )
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn(() => Promise.reject(new DOMException('izin yok', 'NotAllowedError'))) },
      configurable: true,
    })
    // Gerçek mic.ts akışı kullanılsın.
    const actual = await vi.importActual<typeof import('../audio/mic')>('../audio/mic')
    startPitchStream.mockImplementation(actual.startPitchStream)

    renderGate()
    fireEvent.click(screen.getByText('Başlat'))
    expect(await screen.findByText(/Mikrofon izni verilmedi/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tekrar dene' })).toBeTruthy()
    // Uygulamanın geri kalanı (çocuk içerik) çalışmaya devam eder.
    expect(screen.getByText('Başlat')).toBeTruthy()
  })

  it('desteklenmiyorsa ilgili mesajı gösterir', async () => {
    startPitchStream.mockImplementation(() => Promise.reject(new MicError('desteklenmiyor')))
    renderGate()
    fireEvent.click(screen.getByText('Başlat'))
    expect(await screen.findByText('Bu tarayıcı mikrofonu desteklemiyor.')).toBeTruthy()
  })

  it('izin-yok mesajı tam metindir', async () => {
    startPitchStream.mockImplementation(() => Promise.reject(new MicError('izin-yok')))
    renderGate()
    fireEvent.click(screen.getByText('Başlat'))
    expect(
      await screen.findByText(
        "Mikrofon izni verilmedi. Akort göstergesi için Ayarlar › Safari › Mikrofon'dan izin verin.",
      ),
    ).toBeTruthy()
  })

  it('bilinmeyen hata desteklenmiyor mesajına düşer', async () => {
    startPitchStream.mockImplementation(() => Promise.reject(new Error('beklenmedik')))
    renderGate()
    fireEvent.click(screen.getByText('Başlat'))
    expect(await screen.findByText('Bu tarayıcı mikrofonu desteklemiyor.')).toBeTruthy()
  })

  it('Tekrar dene yeniden başlatır ve başarılıysa hatayı kaldırır', async () => {
    startPitchStream.mockImplementationOnce(() => Promise.reject(new MicError('izin-yok')))
    startPitchStream.mockResolvedValueOnce(() => {})
    renderGate()
    fireEvent.click(screen.getByText('Başlat'))
    fireEvent.click(await screen.findByRole('button', { name: 'Tekrar dene' }))
    await waitFor(() => expect(screen.queryByText(/Mikrofon izni verilmedi/)).toBeNull())
    expect(startPitchStream).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('state').textContent).toBe('açık')
  })

  it('başarılı başlatma running=true yapar; stop durdurucuyu çağırır', async () => {
    const stopper = vi.fn()
    startPitchStream.mockResolvedValue(stopper)
    renderGate()
    fireEvent.click(screen.getByText('Başlat'))
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('açık'))
    fireEvent.click(screen.getByText('Durdur'))
    expect(stopper).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('state').textContent).toBe('kapalı')
  })

  it('en güncel onSample kullanılır; yeniden render akışı yeniden başlatmaz', async () => {
    startPitchStream.mockResolvedValue(() => {})
    const first = vi.fn()
    const second = vi.fn()
    const view = renderGate(first)
    fireEvent.click(screen.getByText('Başlat'))
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('açık'))
    view.rerender(<MicGate onSample={second}>{() => <div data-testid="state">açık</div>}</MicGate>)
    expect(startPitchStream).toHaveBeenCalledTimes(1)
    const forwarded = startPitchStream.mock.calls[0][0] as (s: unknown) => void
    forwarded({ t: 0, hz: 440, clarity: 1 })
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('kaldırılınca akış durdurulur', async () => {
    const stopper = vi.fn()
    startPitchStream.mockResolvedValue(stopper)
    const view = renderGate()
    fireEvent.click(screen.getByText('Başlat'))
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('açık'))
    view.unmount()
    await waitFor(() => expect(stopper).toHaveBeenCalledTimes(1))
  })

  it('başlatma bitmeden kaldırılırsa gelen akış hemen durdurulur', async () => {
    const stopper = vi.fn()
    let resolve!: (s: () => void) => void
    startPitchStream.mockReturnValue(new Promise((r) => (resolve = r)))
    const view = renderGate()
    fireEvent.click(screen.getByText('Başlat'))
    view.unmount()
    resolve(stopper)
    await waitFor(() => expect(stopper).toHaveBeenCalledTimes(1))
  })
})
