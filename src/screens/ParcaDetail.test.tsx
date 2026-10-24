import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getNeySesi, playCode, stopAudio, unlockAudio } from '../audio/player'
import { melodyChain, toToneEvents } from '../audio/pattern'
import { buildPieceCode } from '../audio/piece'
import { acquireWakeLock, releaseWakeLock } from '../audio/wakeLock'
import { PARCALAR } from '../content/parcalar'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { DEFAULT_TUNING } from '../music/ahenk'
import { resetDbForTests, saveSettings } from '../store/db'
import { ParcaDetail } from './ParcaDetail'

vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playCode: vi.fn(() => Promise.resolve()),
  playLoop: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
  getNeySesi: vi.fn(() => 'shakuhachi'),
}))

vi.mock('../audio/wakeLock', () => ({
  acquireWakeLock: vi.fn(() => Promise.resolve()),
  releaseWakeLock: vi.fn(),
}))

/** Çalmayı test bitirene dek sürdürür. */
let finishPlay: () => void = () => {}

beforeEach(async () => {
  await resetDbForTests()
  vi.mocked(unlockAudio).mockReset().mockImplementation(() => Promise.resolve())
  vi.mocked(stopAudio).mockReset()
  vi.mocked(acquireWakeLock).mockClear()
  vi.mocked(releaseWakeLock).mockClear()
  vi.mocked(playCode)
    .mockReset()
    .mockImplementation(() => new Promise<void>((r) => (finishPlay = r)))
})
afterEach(() => cleanup())

const byId = (id: string) => PARCALAR.find((p) => p.id === id)!

async function listenButton() {
  const btn = screen.getByRole('button', { name: '🔊 Dinle' }) as HTMLButtonElement
  await waitFor(() => expect(btn.disabled).toBe(false))
  return btn
}
const usulBox = () => screen.getByRole('checkbox', { name: '🥁 Usul eşliği' }) as HTMLInputElement
const slider = () => screen.getByRole('slider') as HTMLInputElement

describe('ParcaDetail', () => {
  it('başlık, makam (bağlantı), usul (bağlantı), besteci ve satırlara bölünmüş nota', () => {
    render(<ParcaDetail parcaId="hak-teala" />)
    expect(screen.getByRole('heading', { name: /Hak Teâlâ/ })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Uşşak' }).getAttribute('href')).toBe('#/makam/ussak')
    expect(screen.getByRole('link', { name: 'Sofyan' }).getAttribute('href')).toBe('#/usul')
    expect(screen.getByText('Ali Ufkî')).toBeTruthy()
    expect(document.querySelectorAll('[data-testid="score-row"]').length).toBeGreaterThanOrEqual(16)
    expect(document.querySelectorAll('text[data-syllable]').length).toBeGreaterThan(0)
  })

  it('kiriş vuruş birimi usulden gelir: Dolap (12/8) üçlü, Sofyan (4/4) ikili gruplar', () => {
    render(<ParcaDetail parcaId="benim-adim-dertli-dolap" />)
    // Her ölçü "e e e q e q e. s q": 12/8'de ilk üç sekizlik ve (yedek geçişle) e. s birer grup olur;
    // e. s grubundaki onaltılığın kısa ikinci kirişi vardır.
    const dolap = byId('benim-adim-dertli-dolap')
    expect(document.querySelectorAll('[data-beam="1"]')).toHaveLength(2 * dolap.olcu.length)
    expect(document.querySelectorAll('[data-beam="2"]')).toHaveLength(dolap.olcu.length)
    expect(document.querySelectorAll('line[data-beamed]')).toHaveLength(5 * dolap.olcu.length)
    cleanup()
    render(<ParcaDetail parcaId="hak-teala" />)
    // Hak Teâlâ 1. ölçü "q q e e e e": iki ayrı ikili grup.
    const firstRow = document.querySelector('[data-testid="score-row"]')!
    const beamed = [...firstRow.querySelectorAll('line[data-beamed]')]
    expect(beamed.length).toBeGreaterThanOrEqual(4)
    expect(firstRow.querySelectorAll('[data-beam="1"]').length).toBeGreaterThanOrEqual(2)
  })

  it('Dolap parçasında usul bağlantısı Dolap adını gösterir; parmak şeması yoktur', () => {
    render(<ParcaDetail parcaId="benim-adim-dertli-dolap" />)
    expect(screen.getByRole('link', { name: 'Dolap' }).getAttribute('href')).toBe('#/usul')
    expect(document.querySelectorAll('[data-testid="hole"]')).toHaveLength(0)
  })

  it('Nota: SymbTr bağlantısı SymbTr deposunun sayfasına gider (ham TSV değil)', () => {
    render(<ParcaDetail parcaId="hak-teala" />)
    expect(screen.getByRole('link', { name: 'SymbTr' }).getAttribute('href')).toBe('https://github.com/MTG/SymbTr')
  })

  it('hız kaydırıcısı 40–100, varsayılan 60; usul eşliği varsayılan açık', () => {
    render(<ParcaDetail parcaId="hak-teala" />)
    expect(slider().min).toBe('40')
    expect(slider().max).toBe('100')
    expect(slider().value).toBe('60')
    expect(screen.getByText('Hız: ♩ = 60')).toBeTruthy()
    expect(usulBox().checked).toBe(true)
  })

  it('Dinle: önce sesi açar; parçayı kullanıcının ahengiyle, doğru olay sayısıyla ve usul eşliğiyle çalar', async () => {
    const tuning = { ahenk: 'mansur' as const, octaveOffset: 0, tuningCents: 10 }
    await saveSettings({ tuning })
    render(<ParcaDetail parcaId="hak-teala" />)
    // düğme ayarlar (ahenk) yüklenince etkinleşir
    fireEvent.click(await listenButton())
    expect(unlockAudio).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    const p = byId('hak-teala')
    const expected = buildPieceCode(p, tuning, 60, true)
    const [code, durationMs] = vi.mocked(playCode).mock.calls[0]!
    expect(code).toBe(expected.code)
    expect(durationMs).toBe(expected.durationMs)
    const steps = /freq\("([^"]*)"\)/.exec(code)![1]!.split(' ')
    expect(steps).toHaveLength(toToneEvents(p.olcu.flat(), tuning).length)
    expect(code).toContain('usul_tahta') // usul deseni (varsayılan usul sesi)
    expect(vi.mocked(unlockAudio).mock.invocationCallOrder[0]!).toBeLessThan(
      vi.mocked(playCode).mock.invocationCallOrder[0]!,
    )
  })

  it('parça seçili ney sesiyle çalar', async () => {
    vi.mocked(getNeySesi).mockReturnValue('nefesli')
    render(<ParcaDetail parcaId="hak-teala" />)
    fireEvent.click(await listenButton())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    const [code] = vi.mocked(playCode).mock.calls[0]!
    expect(code).toBe(buildPieceCode(byId('hak-teala'), DEFAULT_TUNING, 60, true, 'nefesli').code)
    expect(code).toContain(melodyChain('nefesli'))
    vi.mocked(getNeySesi).mockReturnValue('shakuhachi')
  })

  it('usul eşliği kapalıyken yalnızca melodi; hız değişince yeni tempoyla çalar', async () => {
    render(<ParcaDetail parcaId="hak-teala" />)
    const btn = await listenButton()
    fireEvent.click(usulBox())
    fireEvent.input(slider(), { target: { value: '90' } })
    fireEvent.change(slider(), { target: { value: '90' } })
    expect(screen.getByText('Hız: ♩ = 90')).toBeTruthy()
    fireEvent.click(btn)
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    const [code] = vi.mocked(playCode).mock.calls[0]!
    expect(code).toBe(buildPieceCode(byId('hak-teala'), DEFAULT_TUNING, 90, false).code)
    expect(code).not.toContain('usul_')
  })

  it('çalarken Durdur gösterir; Durdur sesi keser ve Dinle geri gelir', async () => {
    render(<ParcaDetail parcaId="hak-teala" />)
    fireEvent.click(await listenButton())
    const stop = await screen.findByRole('button', { name: '■ Durdur' })
    vi.mocked(stopAudio).mockClear()
    fireEvent.click(stop)
    expect(stopAudio).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: '🔊 Dinle' })).toBeTruthy()
  })

  it('parça bitince Dinle geri gelir', async () => {
    render(<ParcaDetail parcaId="hak-teala" />)
    fireEvent.click(await listenButton())
    await screen.findByRole('button', { name: '■ Durdur' })
    finishPlay()
    expect(await screen.findByRole('button', { name: '🔊 Dinle' })).toBeTruthy()
  })

  it('çalarken hız ya da usul anahtarı değişirse çalma durur', async () => {
    render(<ParcaDetail parcaId="hak-teala" />)
    fireEvent.click(await listenButton())
    await screen.findByRole('button', { name: '■ Durdur' })
    vi.mocked(stopAudio).mockClear()
    fireEvent.change(slider(), { target: { value: '70' } })
    expect(stopAudio).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: '🔊 Dinle' })).toBeTruthy()

    fireEvent.click(await listenButton())
    await screen.findByRole('button', { name: '■ Durdur' })
    vi.mocked(stopAudio).mockClear()
    fireEvent.click(usulBox())
    expect(stopAudio).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: '🔊 Dinle' })).toBeTruthy()
  })

  it('ses kapalıyken uyarır, çalmaz', async () => {
    await saveSettings({ soundOn: false })
    render(<ParcaDetail parcaId="hak-teala" />)
    fireEvent.click(await listenButton())
    expect(await screen.findByText(SOUND_OFF)).toBeTruthy()
    expect(unlockAudio).not.toHaveBeenCalled()
    expect(playCode).not.toHaveBeenCalled()
  })

  it('çalma başarısız olursa ses uyarısı gösterir ve Dinle geri gelir', async () => {
    vi.mocked(playCode).mockImplementation(() => Promise.reject(new Error('strudel yok')))
    render(<ParcaDetail parcaId="hak-teala" />)
    fireEvent.click(await listenButton())
    expect(await screen.findByText(SOUND_WARNING)).toBeTruthy()
    expect(screen.getByRole('button', { name: '🔊 Dinle' })).toBeTruthy()
  })

  it('sesi açma başarısız olursa da ses uyarısı gösterir', async () => {
    vi.mocked(unlockAudio).mockImplementation(() => Promise.reject(new Error('kilitli')))
    render(<ParcaDetail parcaId="hak-teala" />)
    fireEvent.click(await listenButton())
    expect(await screen.findByText(SOUND_WARNING)).toBeTruthy()
    expect(playCode).not.toHaveBeenCalled()
  })

  it('sayfadan çıkınca (unmount) ses durur', async () => {
    const { unmount } = render(<ParcaDetail parcaId="hak-teala" />)
    fireEvent.click(await listenButton())
    await screen.findByRole('button', { name: '■ Durdur' })
    vi.mocked(stopAudio).mockClear()
    unmount()
    await waitFor(() => expect(stopAudio).toHaveBeenCalledTimes(1))
  })

  it('çalarken ekran kilidi istenir; Durdur, bitiş, hata ve unmount bırakır', async () => {
    // Durdur
    const first = render(<ParcaDetail parcaId="hak-teala" />)
    fireEvent.click(await listenButton())
    await screen.findByRole('button', { name: '■ Durdur' })
    expect(acquireWakeLock).toHaveBeenCalledTimes(1)
    vi.mocked(releaseWakeLock).mockClear() // önceki testin geç temizliği sayıma karışmasın
    fireEvent.click(screen.getByRole('button', { name: '■ Durdur' }))
    expect(releaseWakeLock).toHaveBeenCalledTimes(1)
    // Bitiş
    fireEvent.click(await listenButton())
    await screen.findByRole('button', { name: '■ Durdur' })
    vi.mocked(releaseWakeLock).mockClear()
    finishPlay()
    await screen.findByRole('button', { name: '🔊 Dinle' })
    expect(releaseWakeLock).toHaveBeenCalledTimes(1)
    // Unmount
    fireEvent.click(await listenButton())
    await screen.findByRole('button', { name: '■ Durdur' })
    vi.mocked(releaseWakeLock).mockClear()
    first.unmount()
    await waitFor(() => expect(releaseWakeLock).toHaveBeenCalledTimes(1))
  })

  it('çalma hatasında ekran kilidi bırakılır; ses kapalıyken istenmez', async () => {
    vi.mocked(playCode).mockImplementation(() => Promise.reject(new Error('strudel yok')))
    render(<ParcaDetail parcaId="hak-teala" />)
    fireEvent.click(await listenButton())
    await screen.findByText(SOUND_WARNING)
    expect(releaseWakeLock).toHaveBeenCalled()
    cleanup()
    vi.mocked(acquireWakeLock).mockClear()
    await saveSettings({ soundOn: false })
    render(<ParcaDetail parcaId="hak-teala" />)
    fireEvent.click(await listenButton())
    await screen.findByText(SOUND_OFF)
    expect(acquireWakeLock).not.toHaveBeenCalled()
  })

  it('bilinmeyen parça için bulunamadı mesajı', () => {
    render(<ParcaDetail parcaId="yok" />)
    expect(screen.getByText('Parça bulunamadı.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Parçalar bölümüne dön' }).getAttribute('href')).toBe('#/parcalar')
  })
})
