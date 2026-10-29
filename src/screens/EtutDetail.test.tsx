import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildEtutCode } from '../audio/etut'
import { getNeySesi, playCode, stopAudio, unlockAudio } from '../audio/player'
import { SHAKUHACHI_SOUND } from '../audio/shakuhachi'
import { acquireWakeLock, releaseWakeLock } from '../audio/wakeLock'
import { ETUTLER } from '../content/etutler'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { USULLER } from '../content/usuller'
import { DEFAULT_TUNING } from '../music/ahenk'
import { getSettings, isaretEkle, resetDbForTests, saveSettings } from '../store/db'
import { EtutCalisma, EtutDetail } from './EtutDetail'

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

const etut = (id: string) => ETUTLER.find((e) => e.id === id)!
const NEVA = etut('tek-neva')
const SES = { melodi: true, metronom: true, voice: 'shakuhachi' } as const

/** Etüt dersleri okunmuş sayılır; kapı açılır. */
async function dersleriOku() {
  await isaretEkle('okunanDersler', 'etut:giris')
  await isaretEkle('okunanDersler', 'etut:rast-besli')
}
async function dinleBtn() {
  const btn = (await screen.findByRole('button', { name: '▶ Dinle' })) as HTMLButtonElement
  await waitFor(() => expect(btn.disabled).toBe(false))
  return btn
}
const metronomlaBtn = () => screen.getByRole('button', { name: '🎵 Metronomla çal' }) as HTMLButtonElement
const metronomBox = () => screen.getByRole('checkbox', { name: '🥁 Metronom' }) as HTMLInputElement
const slider = () => screen.getByRole('slider') as HTMLInputElement

describe('EtutDetail', () => {
  it('ders okunmamışsa önce ders gelir; "Anladım"dan sonra etüt açılır, ders yeniden gelmez', async () => {
    render(<EtutDetail etutId="tek-neva" />)
    expect(await screen.findByRole('heading', { name: /Etüt nasıl çalışılır/ })).toBeTruthy()
    expect(screen.queryByRole('slider')).toBeNull()
    expect(screen.queryByRole('button', { name: '🎵 Metronomla çal' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    expect(await screen.findByRole('heading', { name: /Tek perde: Nevâ/ })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Etüt nasıl çalışılır/ })).toBeNull()
    expect((await getSettings()).okunanDersler).toContain('etut:giris')
  })

  it('rast beşlisi etütleri kendi dersini ister', async () => {
    await isaretEkle('okunanDersler', 'etut:giris')
    render(<EtutDetail etutId="rast-besli-1" />)
    expect(await screen.findByRole('heading', { name: /Rast beşlisi$/ })).toBeTruthy()
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('usul etüdü önce ölçü ve nefes, sonra "Usul nedir?", sonra usulün kendi dersini ister; okunanlar atlanır', async () => {
    const anladim = () => fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    const { unmount } = render(<EtutDetail etutId="usul-nim-sofyan" />)
    expect(await screen.findByRole('heading', { name: /Ölçü, ölçü çizgisi ve nefes işareti/ })).toBeTruthy()
    unmount()

    await isaretEkle('okunanDersler', 'okuma:olcu')
    render(<EtutDetail etutId="usul-nim-sofyan" />)
    expect(await screen.findByRole('heading', { name: '📖 Usul nedir?' })).toBeTruthy()
    expect(screen.queryByRole('slider')).toBeNull()
    anladim()
    expect(await screen.findByRole('heading', { name: '📖 Nim Sofyan' })).toBeTruthy()
    expect(screen.queryByRole('slider')).toBeNull()
    anladim()
    expect(await screen.findByRole('heading', { name: '🎼 Usul: Nim Sofyan' })).toBeTruthy()
    expect(screen.getByRole('slider')).toBeTruthy()
    const okunan = (await getSettings()).okunanDersler
    expect(okunan).toContain('usul:giris')
    expect(okunan).toContain('usul:nim-sofyan')
  })

  it('ders okunmuşsa doğrudan etüt: başlık, nota satırları, Ney bölümüne dön bağlantısı', async () => {
    await dersleriOku()
    render(<EtutDetail etutId="iki-neva-cargah" />)
    expect(await screen.findByRole('heading', { name: /İki perde: Nevâ–Çârgâh/ })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: /Etüt nasıl çalışılır/ })).toBeNull()
    expect(screen.getByRole('link', { name: 'Ney bölümüne dön' }).getAttribute('href')).toBe('#/ney')
  })

  it('telefonda nota satırlara bölünür (satırda en çok iki ölçü) ve SVG genişliğe ölçeklenir', async () => {
    await dersleriOku()
    render(<EtutDetail etutId="iki-neva-cargah" />)
    await screen.findByRole('heading', { name: /İki perde/ })
    const rows = document.querySelectorAll('[data-testid="score-row"]')
    expect(rows.length).toBeGreaterThanOrEqual(4) // 8 ölçü, satırda ≤ 2
    for (const row of rows) {
      const svg = row.querySelector('svg')!
      expect(svg.getAttribute('width')).toBe('100%')
      expect(svg.getAttribute('viewBox')).toBeTruthy()
    }
  })

  it('bilinmeyen etüt için bulunamadı mesajı', () => {
    render(<EtutDetail etutId="yok" />)
    expect(screen.getByText('Etüt bulunamadı.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ney bölümüne dön' }).getAttribute('href')).toBe('#/ney')
  })
})

describe('EtutCalisma', () => {
  it('hız kaydırıcısı 40–90, varsayılan etüdün tempo değeri; metronom anahtarı varsayılan açık', () => {
    render(<EtutCalisma etut={NEVA} />)
    expect(slider().min).toBe('40')
    expect(slider().max).toBe('90')
    expect(slider().value).toBe('60')
    expect(screen.getByText('Hız: ♩ = 60')).toBeTruthy()
    expect(metronomBox().checked).toBe(true)
  })

  it('Dinle: önce sesi açar; etüdü kullanıcının ahengiyle, melodi + metronomla çalar', async () => {
    const tuning = { ahenk: 'mansur' as const, octaveOffset: 0, tuningCents: 10 }
    await saveSettings({ tuning })
    render(<EtutCalisma etut={NEVA} />)
    fireEvent.click(await dinleBtn())
    expect(unlockAudio).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    const expected = buildEtutCode(NEVA.olcu, tuning, 60, SES)
    const [code, durationMs] = vi.mocked(playCode).mock.calls[0]!
    expect(code).toBe(expected.code)
    expect(durationMs).toBe(expected.durationMs)
    expect(code).toContain(SHAKUHACHI_SOUND)
    expect(vi.mocked(unlockAudio).mock.invocationCallOrder[0]!).toBeLessThan(
      vi.mocked(playCode).mock.invocationCallOrder[0]!,
    )
  })

  it('metronom anahtarı kapalıyken Dinle yalnız giriş sayımını tıklar; hız yeni tempoyla çalar', async () => {
    render(<EtutCalisma etut={NEVA} />)
    const btn = await dinleBtn()
    fireEvent.click(metronomBox())
    fireEvent.input(slider(), { target: { value: '80' } })
    fireEvent.change(slider(), { target: { value: '80' } })
    expect(screen.getByText('Hız: ♩ = 80')).toBeTruthy()
    fireEvent.click(btn)
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    expect(vi.mocked(playCode).mock.calls[0]![0]).toBe(
      buildEtutCode(NEVA.olcu, DEFAULT_TUNING, 80, { ...SES, metronom: false }).code,
    )
  })

  it('Metronomla çal: yalnız metronom; melodi yok (anahtardan bağımsız)', async () => {
    render(<EtutCalisma etut={NEVA} />)
    await dinleBtn()
    fireEvent.click(metronomBox())
    fireEvent.click(metronomlaBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    const [code, durationMs] = vi.mocked(playCode).mock.calls[0]!
    const expected = buildEtutCode(NEVA.olcu, DEFAULT_TUNING, 60, { ...SES, melodi: false })
    expect(code).toBe(expected.code)
    expect(durationMs).toBe(expected.durationMs)
    expect(code).not.toContain(SHAKUHACHI_SOUND)
    expect(unlockAudio).toHaveBeenCalledTimes(1)
  })

  it('seçili ney sesiyle çalar', async () => {
    vi.mocked(getNeySesi).mockReturnValue('nefesli')
    render(<EtutCalisma etut={NEVA} />)
    fireEvent.click(await dinleBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    expect(vi.mocked(playCode).mock.calls[0]![0]).toBe(
      buildEtutCode(NEVA.olcu, DEFAULT_TUNING, 60, { ...SES, voice: 'nefesli' }).code,
    )
    vi.mocked(getNeySesi).mockReturnValue('shakuhachi')
  })

  it('çalarken Durdur gösterir; Durdur sesi keser ve düğmeler geri gelir; bitince de geri gelir', async () => {
    render(<EtutCalisma etut={NEVA} />)
    fireEvent.click(await dinleBtn())
    const stop = await screen.findByRole('button', { name: '⏹ Durdur' })
    expect(screen.queryByRole('button', { name: '▶ Dinle' })).toBeNull()
    vi.mocked(stopAudio).mockClear()
    fireEvent.click(stop)
    expect(stopAudio).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: '▶ Dinle' })).toBeTruthy()
    fireEvent.click(metronomlaBtn())
    await screen.findByRole('button', { name: '⏹ Durdur' })
    finishPlay()
    expect(await screen.findByRole('button', { name: '▶ Dinle' })).toBeTruthy()
  })

  it('çalarken hız ya da metronom anahtarı değişirse çalma durur', async () => {
    render(<EtutCalisma etut={NEVA} />)
    fireEvent.click(await dinleBtn())
    await screen.findByRole('button', { name: '⏹ Durdur' })
    vi.mocked(stopAudio).mockClear()
    fireEvent.change(slider(), { target: { value: '70' } })
    expect(stopAudio).toHaveBeenCalledTimes(1)
    fireEvent.click(await dinleBtn())
    await screen.findByRole('button', { name: '⏹ Durdur' })
    vi.mocked(stopAudio).mockClear()
    fireEvent.click(metronomBox())
    expect(stopAudio).toHaveBeenCalledTimes(1)
  })

  it('ses kapalıyken uyarır, sesi açmaz ve çalmaz', async () => {
    await saveSettings({ soundOn: false })
    render(<EtutCalisma etut={NEVA} />)
    fireEvent.click(await dinleBtn())
    expect(await screen.findByText(SOUND_OFF)).toBeTruthy()
    fireEvent.click(metronomlaBtn())
    expect(unlockAudio).not.toHaveBeenCalled()
    expect(playCode).not.toHaveBeenCalled()
    expect(acquireWakeLock).not.toHaveBeenCalled()
  })

  it('çalma ya da sesi açma başarısız olursa ses uyarısı gösterir ve düğmeler geri gelir', async () => {
    vi.mocked(playCode).mockImplementation(() => Promise.reject(new Error('strudel yok')))
    render(<EtutCalisma etut={NEVA} />)
    fireEvent.click(await dinleBtn())
    expect(await screen.findByText(SOUND_WARNING)).toBeTruthy()
    expect(screen.getByRole('button', { name: '▶ Dinle' })).toBeTruthy()
    expect(releaseWakeLock).toHaveBeenCalled()
    cleanup()
    vi.mocked(unlockAudio).mockImplementation(() => Promise.reject(new Error('kilitli')))
    vi.mocked(playCode).mockClear()
    render(<EtutCalisma etut={NEVA} />)
    fireEvent.click(await dinleBtn())
    expect(await screen.findByText(SOUND_WARNING)).toBeTruthy()
    expect(playCode).not.toHaveBeenCalled()
  })

  it('sayfadan çıkınca (unmount) ses durur ve ekran kilidi bırakılır', async () => {
    const { unmount } = render(<EtutCalisma etut={NEVA} />)
    fireEvent.click(await dinleBtn())
    await screen.findByRole('button', { name: '⏹ Durdur' })
    expect(acquireWakeLock).toHaveBeenCalledTimes(1)
    vi.mocked(stopAudio).mockClear()
    vi.mocked(releaseWakeLock).mockClear()
    unmount()
    expect(stopAudio).toHaveBeenCalledTimes(1)
    expect(releaseWakeLock).toHaveBeenCalledTimes(1)
  })

  it('bekleyen sesi açma çıkıştan sonra çalmaz', async () => {
    let unlock: () => void = () => {}
    vi.mocked(unlockAudio).mockImplementation(() => new Promise<void>((r) => (unlock = r)))
    const { unmount } = render(<EtutCalisma etut={NEVA} />)
    fireEvent.click(await dinleBtn())
    unmount()
    unlock()
    await new Promise((r) => setTimeout(r, 20))
    expect(playCode).not.toHaveBeenCalled()
  })

  it('"✓ Çaldım" işareti yazar, "Çalındı ✓" rozeti çıkar ve onDone çağrılır', async () => {
    const onDone = vi.fn()
    render(<EtutCalisma etut={NEVA} onDone={onDone} />)
    expect(screen.queryByText('Çalındı ✓')).toBeNull()
    await dinleBtn()
    fireEvent.click(screen.getByRole('button', { name: '✓ Çaldım' }))
    expect(await screen.findByText('Çalındı ✓')).toBeTruthy()
    expect((await getSettings()).calinanEtutler).toEqual(['tek-neva'])
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('"✓ Çaldım" çalan sesi durdurur; onDone olmadan da çalışır', async () => {
    render(<EtutCalisma etut={NEVA} />)
    fireEvent.click(await dinleBtn())
    await screen.findByRole('button', { name: '⏹ Durdur' })
    vi.mocked(stopAudio).mockClear()
    fireEvent.click(screen.getByRole('button', { name: '✓ Çaldım' }))
    expect(stopAudio).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('Çalındı ✓')).toBeTruthy()
  })

  it('önceden çalınmış etütte rozet baştan görünür', async () => {
    await isaretEkle('calinanEtutler', 'tek-neva')
    render(<EtutCalisma etut={NEVA} />)
    expect(await screen.findByText('Çalındı ✓')).toBeTruthy()
  })

  it('usullü etütte anahtar "Usul (Semâî)" ve "Usulle çal"; usulsüzde eski etiketler', async () => {
    const semaiEtut = etut('usul-semai')
    const semai = USULLER.find((u) => u.id === 'semai')!
    render(<EtutCalisma etut={semaiEtut} />)
    const box = screen.getByRole('checkbox', { name: '🥁 Usul (Semâî)' }) as HTMLInputElement
    expect(box.checked).toBe(true)
    expect(screen.queryByRole('checkbox', { name: '🥁 Metronom' })).toBeNull()
    expect(screen.queryByRole('button', { name: '🎵 Metronomla çal' })).toBeNull()
    fireEvent.click(await dinleBtn())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    const dinle = buildEtutCode(semaiEtut.olcu, DEFAULT_TUNING, 60, { ...SES, usul: semai })
    expect(vi.mocked(playCode).mock.calls[0]).toEqual([dinle.code, dinle.durationMs])
    fireEvent.click(screen.getByRole('button', { name: '⏹ Durdur' }))
    fireEvent.click(await screen.findByRole('button', { name: '🥁 Usulle çal' }))
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(2))
    const usulle = buildEtutCode(semaiEtut.olcu, DEFAULT_TUNING, 60, { ...SES, melodi: false, usul: semai })
    expect(vi.mocked(playCode).mock.calls[1]).toEqual([usulle.code, usulle.durationMs])
    // 3/4: satırda üç ölçü (8 ölçü → 3 satır).
    expect(document.querySelectorAll('[data-testid="score-row"]')).toHaveLength(3)
    cleanup()
    render(<EtutCalisma etut={etut('dortlu-cargah')} />)
    expect(metronomBox().checked).toBe(true)
    expect(metronomlaBtn()).toBeTruthy()
    expect(screen.queryByRole('button', { name: '🥁 Usulle çal' })).toBeNull()
    expect(document.querySelectorAll('[data-testid="score-row"]')).toHaveLength(4)
  })

  it('Nim Sofyan (2/4) satırda üç ölçü, Sofyan (4/4) satırda iki ölçü', () => {
    render(<EtutCalisma etut={etut('usul-nim-sofyan')} />)
    expect(screen.getByRole('checkbox', { name: '🥁 Usul (Nim Sofyan)' })).toBeTruthy()
    expect(document.querySelectorAll('[data-testid="score-row"]')).toHaveLength(3)
    cleanup()
    render(<EtutCalisma etut={etut('usul-sofyan')} />)
    expect(screen.getByRole('checkbox', { name: '🥁 Usul (Sofyan)' })).toBeTruthy()
    expect(document.querySelectorAll('[data-testid="score-row"]')).toHaveLength(4)
  })

  it('baslikGizle: başlık çizilmez (akşam adımında üst başlık vardır)', () => {
    render(<EtutCalisma etut={NEVA} baslikGizle />)
    expect(screen.queryByRole('heading')).toBeNull()
    expect(document.querySelectorAll('[data-testid="score-row"]').length).toBeGreaterThan(0)
  })
})
