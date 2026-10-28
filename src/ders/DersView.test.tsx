import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { playCode, playWritten, stopAudio, unlockAudio } from '../audio/player'
import { buildUsulOnceCode } from '../audio/usul'
import { getUsulSesi } from '../audio/usulSamples'
import type { Ders } from '../content/dersler/types'
import { NEY_PERDELER } from '../content/ney-perdeler'
import { USULLER } from '../content/usuller'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import type { MusicEvent } from '../music/notation'
import { DEFAULT_SETTINGS, getSettings, isaretEkle, resetDbForTests, saveSettings } from '../store/db'
import { DersView } from './DersView'

vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playWritten: vi.fn(() => Promise.resolve()),
  playCode: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
}))
vi.mock('../store/db', async (orijinal) => {
  const m = await orijinal<typeof import('../store/db')>()
  return { ...m, isaretEkle: vi.fn(m.isaretEkle), getSettings: vi.fn(m.getSettings) }
})

const NOTALAR: MusicEvent[] = [
  { kind: 'note', pitch: { step: 'D', octave: 5, acc: 0 }, dur: 'quarter' },
  { kind: 'note', pitch: { step: 'C', octave: 5, acc: 0 }, dur: 'half' },
]
const SUSLAR: MusicEvent[] = [{ kind: 'rest', dur: 'quarter' }]

const DERS: Ders = {
  id: 's0:deneme',
  seviye: 0,
  baslik: 'Deneme dersi',
  bloklar: [
    { tur: 'metin', metin: 'Birinci paragraf.' },
    { tur: 'liste', maddeler: ['madde bir', 'madde iki'] },
    { tur: 'porte', olaylar: NOTALAR, aciklama: 'Re ile Do', bpm: 72 },
    { tur: 'porte', olaylar: SUSLAR, aciklama: 'Sadece sus' },
    { tur: 'parmak', perdeId: 'neva', aciklama: 'Nevâ parmağı' },
    { tur: 'gorsel', ad: 'nefes-444', aciklama: 'Nefes düzeni' },
    { tur: 'dene', adimlar: ['Birinci adım', 'İkinci adım'] },
  ],
  kaynaklar: ['S4 neyzenim.com Ders 1', 'S2 MEB'],
}

beforeEach(async () => {
  await resetDbForTests()
  vi.mocked(unlockAudio).mockReset()
  vi.mocked(unlockAudio).mockImplementation(() => Promise.resolve())
  vi.mocked(playWritten).mockReset()
  vi.mocked(playWritten).mockImplementation(() => Promise.resolve())
  vi.mocked(playCode).mockReset()
  vi.mocked(playCode).mockImplementation(() => Promise.resolve())
  vi.mocked(stopAudio).mockClear()
})
afterEach(() => cleanup())

/** Ayarlar yüklenince etkinleşen n. "▶ Dinle" düğmesine dokunur. */
async function dinle(n: number) {
  const dugmeler = screen.getAllByRole('button', { name: '▶ Dinle' }) as HTMLButtonElement[]
  await waitFor(() => expect(dugmeler[n]!.disabled).toBe(false))
  fireEvent.click(dugmeler[n]!)
}

describe('DersView', () => {
  it('başlık ve her blok türü çizilir', () => {
    const { container } = render(<DersView ders={DERS} onDone={() => undefined} />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('📖 Deneme dersi')
    expect(screen.getByText('Birinci paragraf.')).toBeTruthy()
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(
      expect.arrayContaining(['madde bir', 'madde iki']),
    )
    expect(container.querySelectorAll('[data-testid="notehead"]')).toHaveLength(2) // yalnız ilk porte notalı
    expect(screen.getByText('Re ile Do')).toBeTruthy()
    expect(screen.getByLabelText(/^Ney parmak şeması/)).toBeTruthy()
    expect(screen.getByText('Nevâ parmağı')).toBeTruthy()
    expect(container.querySelector('[data-gorsel="nefes-444"]')).toBeTruthy()
    expect(screen.getByText('Nefes düzeni')).toBeTruthy()
  })

  it('porte bloklarında bir vuruştaki iki sekizlik kirişlenir (bayrak yerine kiriş, 4/4)', () => {
    const sekizlik = (step: 'D' | 'C'): MusicEvent => ({ kind: 'note', pitch: { step, octave: 5, acc: 0 }, dur: 'eighth' })
    const ders: Ders = { ...DERS, bloklar: [{ tur: 'porte', olaylar: [sekizlik('D'), sekizlik('C')] }] }
    const { container } = render(<DersView ders={ders} onDone={() => undefined} />)
    expect(container.querySelectorAll('[data-beam-group]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-flag]')).toHaveLength(0)
  })

  it('"Kendin dene" kutusu başlığıyla ve adımlarıyla görünür', () => {
    render(<DersView ders={DERS} onDone={() => undefined} />)
    expect(screen.getByRole('heading', { name: 'Kendin dene' })).toBeTruthy()
    expect(screen.getByText('Birinci adım')).toBeTruthy()
    expect(screen.getByText('İkinci adım')).toBeTruthy()
  })

  it('kaynaklar küçük ve soluk yazılır', () => {
    render(<DersView ders={DERS} onDone={() => undefined} />)
    const k = screen.getByText('Kaynak: S4 neyzenim.com Ders 1 · S2 MEB')
    expect(k.className).toBe('ders-kaynak')
  })

  it('notalı porte ve parmak için "▶ Dinle" var; yalnız sus içeren porte için yok', () => {
    render(<DersView ders={DERS} onDone={() => undefined} />)
    expect(screen.getAllByRole('button', { name: '▶ Dinle' })).toHaveLength(2)
  })

  it('porte Dinle: önce sesi açar, sonra olayları kullanıcı ahengiyle ve bloğun bpm değeriyle çalar', async () => {
    const tuning = { ahenk: 'kiz' as const, octaveOffset: 0, tuningCents: -20 }
    await saveSettings({ tuning })
    render(<DersView ders={DERS} onDone={() => undefined} />)
    await dinle(0)
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    expect(playWritten).toHaveBeenCalledWith(NOTALAR, tuning, 72)
    expect(vi.mocked(unlockAudio).mock.invocationCallOrder[0]!).toBeLessThan(
      vi.mocked(playWritten).mock.invocationCallOrder[0]!,
    )
  })

  it('bpm verilmeyen porte 60 ile çalar', async () => {
    const ders: Ders = { ...DERS, bloklar: [{ tur: 'porte', olaylar: NOTALAR }] }
    render(<DersView ders={ders} onDone={() => undefined} />)
    await dinle(0)
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    expect(vi.mocked(playWritten).mock.calls[0]![2]).toBe(60)
  })

  it('röprizli porte iki kez çalar', async () => {
    const ders: Ders = { ...DERS, bloklar: [{ tur: 'porte', olaylar: NOTALAR, ropriz: true }] }
    const { container } = render(<DersView ders={ders} onDone={() => undefined} />)
    expect(container.querySelector('[data-ropriz="bas"]')).toBeTruthy()
    expect(container.querySelector('[data-ropriz="son"]')).toBeTruthy()
    await dinle(0)
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    const calan = vi.mocked(playWritten).mock.calls[0]![0]
    expect(calan).toHaveLength(NOTALAR.length * 2)
    expect(calan).toEqual([...NOTALAR, ...NOTALAR])
  })

  it('olcuCizgileri verilen portede ölçü çizgileri ve satır sonu çizgisi çizilir; verilmeyende çizgi yok', () => {
    const dortluk = (step: 'D' | 'C'): MusicEvent => ({ kind: 'note', pitch: { step, octave: 5, acc: 0 }, dur: 'quarter' })
    const olaylar = [dortluk('D'), dortluk('C'), dortluk('D'), dortluk('C')]
    const ders: Ders = { ...DERS, bloklar: [{ tur: 'porte', olaylar, olcuCizgileri: [1] }] }
    const { container } = render(<DersView ders={ders} onDone={() => undefined} />)
    expect(container.querySelectorAll('[data-barline]')).toHaveLength(2)
    cleanup()
    const duz = render(<DersView ders={{ ...DERS, bloklar: [{ tur: 'porte', olaylar }] }} onDone={() => undefined} />)
    expect(duz.container.querySelectorAll('[data-barline]')).toHaveLength(0)
  })

  it('röprizsiz porte çizgisiz ve bir kez çalar', async () => {
    const ders: Ders = { ...DERS, bloklar: [{ tur: 'porte', olaylar: NOTALAR }] }
    const { container } = render(<DersView ders={ders} onDone={() => undefined} />)
    expect(container.querySelector('[data-ropriz]')).toBeNull()
    await dinle(0)
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    expect(vi.mocked(playWritten).mock.calls[0]![0]).toEqual(NOTALAR)
  })

  it('parmak Dinle: perdenin yazılı notasını yarımlık çalar', async () => {
    render(<DersView ders={DERS} onDone={() => undefined} />)
    await dinle(1)
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    const neva = NEY_PERDELER.find((p) => p.id === 'neva')!
    expect(vi.mocked(playWritten).mock.calls[0]![0]).toEqual([{ kind: 'note', pitch: neva.written, dur: 'half' }])
  })

  it('soundOn:false → SOUND_OFF, hiçbir şey çalmaz', async () => {
    await saveSettings({ soundOn: false })
    render(<DersView ders={DERS} onDone={() => undefined} />)
    await dinle(0)
    expect((await screen.findByRole('status')).textContent).toBe(SOUND_OFF)
    expect(unlockAudio).not.toHaveBeenCalled()
    expect(playWritten).not.toHaveBeenCalled()
  })

  it('çalma hatası → SOUND_WARNING', async () => {
    vi.mocked(playWritten).mockRejectedValueOnce(new Error('çalamadı'))
    render(<DersView ders={DERS} onDone={() => undefined} />)
    await dinle(0)
    expect((await screen.findByRole('status')).textContent).toBe(SOUND_WARNING)
  })

  it('unmount sesi durdurur; bekleyen unlockAudio çıkıştan sonra çalmaz', async () => {
    let bitir!: () => void
    vi.mocked(unlockAudio).mockImplementation(() => new Promise<void>((r) => (bitir = r)))
    const { unmount } = render(<DersView ders={DERS} onDone={() => undefined} />)
    await dinle(0)
    await waitFor(() => expect(unlockAudio).toHaveBeenCalled())
    vi.mocked(stopAudio).mockClear()
    unmount()
    expect(stopAudio).toHaveBeenCalled()
    bitir()
    await new Promise((r) => setTimeout(r, 0))
    expect(playWritten).not.toHaveBeenCalled()
  })

  it('ayarlar okunamazsa Dinle yine de çalışır (varsayılan ayarlarla)', async () => {
    vi.mocked(getSettings).mockRejectedValueOnce(new Error('IndexedDB okunamadı'))
    render(<DersView ders={DERS} onDone={() => undefined} />)
    await dinle(0)
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    expect(vi.mocked(playWritten).mock.calls[0]![1]).toEqual(DEFAULT_SETTINGS.tuning)
  })

  it('"Anladım, alıştırmaya geç" okundu kaydını yazar ve onDone çağrılır', async () => {
    const onDone = vi.fn()
    render(<DersView ders={DERS} onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    expect((await getSettings()).okunanDersler).toEqual(['s0:deneme'])
  })

  it('isaretEkle reddederse de onDone çağrılır', async () => {
    vi.mocked(isaretEkle).mockRejectedValueOnce(new Error('IndexedDB yazılamadı'))
    const onDone = vi.fn()
    render(<DersView ders={DERS} onDone={onDone} />)
    fireEvent.click(screen.getByRole('button', { name: 'Anladım, alıştırmaya geç' }))
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1))
    expect((await getSettings()).okunanDersler).toEqual([])
  })

  it('geri bağlantısı yalnız verilirse çıkar', () => {
    const { rerender } = render(<DersView ders={DERS} onDone={() => undefined} />)
    expect(screen.queryByRole('link')).toBeNull()
    rerender(<DersView ders={DERS} onDone={() => undefined} geri={{ href: '#/ogren', label: 'Öğren bölümüne dön' }} />)
    expect(screen.getByRole('link', { name: 'Öğren bölümüne dön' }).getAttribute('href')).toBe('#/ogren')
  })
})

describe('DersView: usul bloğu', () => {
  const usulDers = (usulId: string): Ders => ({
    ...DERS,
    bloklar: [{ tur: 'usul', usulId, aciklama: 'Usul açıklaması' }],
  })
  const kutular = () => [...document.querySelectorAll<HTMLElement>('[data-testid="vurus"]')]
  const usul = (id: string) => USULLER.find((u) => u.id === id)!

  it.each(['nim-sofyan', 'semai', 'sofyan'])('%s: düm-tek kutuları usulün vuruş sayısı kadar çizilir; açıklama görünür', (id) => {
    render(<DersView ders={usulDers(id)} onDone={() => undefined} />)
    expect(kutular().map((k) => k.textContent)).toEqual(usul(id).vurus!.map((v) => v.ses))
    expect(screen.getByText('Usul açıklaması')).toBeTruthy()
  })

  it('Dinle bir kez playCode çağırır: önce sesi açar, bir ölçüyü ♩ = 60 hızında iki kez çalar (kullanıcının usul sesiyle)', async () => {
    render(<DersView ders={usulDers('sofyan')} onDone={() => undefined} />)
    expect(screen.getAllByRole('button', { name: '▶ Dinle' })).toHaveLength(1)
    await dinle(0)
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    const bekle = buildUsulOnceCode(usul('sofyan'), 60, getUsulSesi(), 2)
    expect(vi.mocked(playCode).mock.calls[0]).toEqual([bekle.code, bekle.durationMs])
    expect(bekle.durationMs).toBe(8000)
    expect(bekle.code).toContain('.mask("<1 1 0@1000000>")')
    expect(vi.mocked(unlockAudio).mock.invocationCallOrder[0]!).toBeLessThan(vi.mocked(playCode).mock.invocationCallOrder[0]!)
    expect(playWritten).not.toHaveBeenCalled()
  })

  it('soundOn:false → SOUND_OFF, hiçbir şey çalmaz', async () => {
    await saveSettings({ soundOn: false })
    render(<DersView ders={usulDers('semai')} onDone={() => undefined} />)
    await dinle(0)
    expect((await screen.findByRole('status')).textContent).toBe(SOUND_OFF)
    expect(unlockAudio).not.toHaveBeenCalled()
    expect(playCode).not.toHaveBeenCalled()
  })

  it('çalma hatası → SOUND_WARNING', async () => {
    vi.mocked(playCode).mockRejectedValueOnce(new Error('çalamadı'))
    render(<DersView ders={usulDers('semai')} onDone={() => undefined} />)
    await dinle(0)
    expect((await screen.findByRole('status')).textContent).toBe(SOUND_WARNING)
  })

  it('unmount sesi durdurur; bekleyen unlockAudio çıkıştan sonra çalmaz', async () => {
    let bitir!: () => void
    vi.mocked(unlockAudio).mockImplementation(() => new Promise<void>((r) => (bitir = r)))
    const { unmount } = render(<DersView ders={usulDers('nim-sofyan')} onDone={() => undefined} />)
    await dinle(0)
    await waitFor(() => expect(unlockAudio).toHaveBeenCalled())
    vi.mocked(stopAudio).mockClear()
    unmount()
    expect(stopAudio).toHaveBeenCalled()
    bitir()
    await new Promise((r) => setTimeout(r, 0))
    expect(playCode).not.toHaveBeenCalled()
  })

  it('vuruş kalıbı olmayan usulde (Dolap) şema ve Dinle yok, açıklama görünür', () => {
    render(<DersView ders={usulDers('dolap')} onDone={() => undefined} />)
    expect(kutular()).toHaveLength(0)
    expect(screen.queryByRole('button', { name: '▶ Dinle' })).toBeNull()
    expect(screen.getByText('Usul açıklaması')).toBeTruthy()
  })

  it('bilinmeyen usul kimliğinde çökmez; yalnız açıklama görünür', () => {
    render(<DersView ders={usulDers('yok')} onDone={() => undefined} />)
    expect(kutular()).toHaveLength(0)
    expect(screen.queryByRole('button', { name: '▶ Dinle' })).toBeNull()
  })
})
