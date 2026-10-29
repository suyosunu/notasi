import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getNeySesi,
  getUsulSesi,
  playCode,
  playWritten,
  setDilBelirginligi,
  setNeySesi,
  setUsulSesi,
  stopAudio,
  unlockAudio,
} from '../audio/player'
import { toToneEvents } from '../audio/pattern'
import type { NeySesi } from '../audio/pattern'
import { sesSec, soylemeyiDurdur, soyleUsul } from '../audio/soyle'
import { buildUsulOnceCode } from '../audio/usul'
import type { UsulSesi } from '../audio/usulSamples'
import { USULLER } from '../content/usuller'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { soundingHz } from '../music/ahenk'
import { exportBackup, shareOrDownloadBackup } from '../store/backup'
import { getSettings, listSessions, resetDbForTests, saveSession, saveSettings } from '../store/db'
import { Settings } from './Settings'

vi.mock('../audio/player', () => ({
  unlockAudio: vi.fn(() => Promise.resolve()),
  playWritten: vi.fn(() => Promise.resolve()),
  playCode: vi.fn(() => Promise.resolve()),
  stopAudio: vi.fn(),
  setNeySesi: vi.fn(),
  getNeySesi: vi.fn(() => 'mevcut'),
  setUsulSesi: vi.fn(),
  getUsulSesi: vi.fn(() => 'oryantal'),
  setDilBelirginligi: vi.fn(),
}))

vi.mock('../audio/soyle', () => ({
  soyleUsul: vi.fn(() => Promise.resolve()),
  soylemeyiDurdur: vi.fn(),
  sesSec: vi.fn(() => ({ ses: undefined, perde: 1, ad: 'Yelda' })),
}))

vi.mock('../store/backup', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../store/backup')>()
  return { ...actual, shareOrDownloadBackup: vi.fn(() => Promise.resolve()) }
})

const INVALID = 'Bu dosya geçerli bir Notası yedeği değil.'
const CONFIRM = 'Mevcut ilerlemenin yerine yedek yüklenecek. Emin misiniz?'

beforeEach(async () => {
  await resetDbForTests()
  vi.mocked(shareOrDownloadBackup).mockReset()
  vi.mocked(shareOrDownloadBackup).mockImplementation(() => Promise.resolve())
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.mocked(unlockAudio).mockReset().mockImplementation(() => Promise.resolve())
  vi.mocked(playWritten).mockReset().mockImplementation(() => Promise.resolve())
  vi.mocked(stopAudio).mockReset()
  let voice: NeySesi = 'shakuhachi'
  vi.mocked(setNeySesi).mockReset().mockImplementation((v) => {
    voice = v
  })
  vi.mocked(getNeySesi).mockReset().mockImplementation(() => voice)
  vi.mocked(playCode).mockReset().mockImplementation(() => Promise.resolve())
  let usulVoice: UsulSesi = 'tahta'
  vi.mocked(setUsulSesi).mockReset().mockImplementation((v) => {
    usulVoice = v
  })
  vi.mocked(getUsulSesi).mockReset().mockImplementation(() => usulVoice)
  vi.mocked(setDilBelirginligi).mockReset()
  vi.mocked(soyleUsul).mockReset().mockImplementation(() => Promise.resolve())
  vi.mocked(soylemeyiDurdur).mockReset()
  vi.mocked(sesSec).mockReset().mockImplementation(() => ({ ses: undefined, perde: 1, ad: 'Yelda' }))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  location.hash = ''
})

function pickFile(text: string) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement
  const file = new File([text], 'yedek.json', { type: 'application/json' })
  fireEvent.change(input, { target: { files: [file] } })
  return input
}

function sessionRec(id: string) {
  return {
    id,
    kind: 'gunduz' as const,
    date: '2026-10-13',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    completed: true,
    elapsedMs: 1000,
    state: { questions: [], index: 0, answers: [] },
  }
}

describe('Settings', () => {
  it('ahengi Mansur yapınca tuning.ahenk mansur ve calibrated false olur, kalibrasyon notu çıkar', async () => {
    await saveSettings({ calibrated: true, tuning: { ahenk: 'kiz', octaveOffset: 1, tuningCents: 7 } })
    render(<Settings />)
    const select = (await screen.findByLabelText('Ney ahengi')) as HTMLSelectElement
    expect(select.value).toBe('kiz')
    expect(screen.queryByText('Yeniden kalibre edin')).toBeNull()
    fireEvent.change(select, { target: { value: 'mansur' } })
    await waitFor(async () => expect((await getSettings()).tuning.ahenk).toBe('mansur'))
    const s = await getSettings()
    expect(s.calibrated).toBe(false)
    expect(s.tuning.octaveOffset).toBe(1)
    expect(s.tuning.tuningCents).toBe(7)
    const note = await screen.findByText('Yeniden kalibre edin')
    expect(note.closest('a')?.getAttribute('href')).toBe('#/kalibrasyon')
  })

  it('aynı ahenk seçilirse kalibrasyon bozulmaz', async () => {
    await saveSettings({ calibrated: true })
    render(<Settings />)
    const select = (await screen.findByLabelText('Ney ahengi')) as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'kiz' } })
    await new Promise((r) => setTimeout(r, 30))
    expect((await getSettings()).calibrated).toBe(true)
  })

  it('Sesler açık anahtarı soundOn değerini kaydeder', async () => {
    render(<Settings />)
    const toggle = (await screen.findByLabelText('Sesler açık')) as HTMLInputElement
    expect(toggle.checked).toBe(true)
    fireEvent.click(toggle)
    await waitFor(async () => expect((await getSettings()).soundOn).toBe(false))
    expect(toggle.checked).toBe(false)
    fireEvent.click(toggle)
    await waitFor(async () => expect((await getSettings()).soundOn).toBe(true))
  })

  it('Yedeği kaydet shareOrDownloadBackup çağırır', async () => {
    render(<Settings />)
    fireEvent.click(await screen.findByRole('button', { name: 'Yedeği kaydet' }))
    await waitFor(() => expect(shareOrDownloadBackup).toHaveBeenCalledTimes(1))
  })

  it('yedek kaydı başarısız olursa hata metni gösterir', async () => {
    vi.mocked(shareOrDownloadBackup).mockRejectedValue(new Error('x'))
    render(<Settings />)
    fireEvent.click(await screen.findByRole('button', { name: 'Yedeği kaydet' }))
    expect(await screen.findByText('Yedek kaydedilemedi.')).toBeTruthy()
  })

  it('geri yükleme girdisi application/json kabul eder ve düğme onu açar', async () => {
    render(<Settings />)
    await screen.findByRole('button', { name: 'Yedeği geri yükle' })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input.getAttribute('accept')).toBe('application/json')
    const click = vi.spyOn(input, 'click')
    fireEvent.click(screen.getByRole('button', { name: 'Yedeği geri yükle' }))
    expect(click).toHaveBeenCalled()
  })

  it('geçersiz JSON dosyasında hata metni görünür ve onay sorulmaz', async () => {
    render(<Settings />)
    await screen.findByRole('button', { name: 'Yedeği geri yükle' })
    pickFile('bu json değil {')
    expect(await screen.findByText(INVALID)).toBeTruthy()
    expect(window.confirm).not.toHaveBeenCalled()
  })

  it('başka uygulamaya ait yedekte hata metni görünür ve mevcut veri silinmez', async () => {
    await saveSession(sessionRec('s1'))
    render(<Settings />)
    await screen.findByRole('button', { name: 'Yedeği geri yükle' })
    pickFile(JSON.stringify({ app: 'baska', version: 1, data: {} }))
    expect(await screen.findByText(INVALID)).toBeTruthy()
    expect(window.confirm).toHaveBeenCalledWith(CONFIRM)
    expect(await listSessions()).toHaveLength(1)
  })

  it('geçerli yedek onaydan sonra yüklenir', async () => {
    await saveSession(sessionRec('s1'))
    const backup = await exportBackup()
    await saveSession(sessionRec('s2'))
    expect(await listSessions()).toHaveLength(2)
    render(<Settings />)
    await screen.findByRole('button', { name: 'Yedeği geri yükle' })
    pickFile(JSON.stringify(backup))
    expect(await screen.findByText('Yedek yüklendi.')).toBeTruthy()
    expect(window.confirm).toHaveBeenCalledWith(CONFIRM)
    expect((await listSessions()).map((s) => s.id)).toEqual(['s1'])
  })

  it('onay reddedilirse hiçbir şey değişmez', async () => {
    await saveSession(sessionRec('s1'))
    const backup = await exportBackup()
    await saveSession(sessionRec('s2'))
    vi.mocked(window.confirm).mockReturnValue(false)
    render(<Settings />)
    await screen.findByRole('button', { name: 'Yedeği geri yükle' })
    pickFile(JSON.stringify(backup))
    await waitFor(() => expect(window.confirm).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 30))
    expect(await listSessions()).toHaveLength(2)
    expect(screen.queryByText('Yedek yüklendi.')).toBeNull()
    expect(screen.queryByText(INVALID)).toBeNull()
  })

  it('geri yüklemeden sonra ayarlar ekranı yeni ayarları gösterir', async () => {
    await saveSettings({ tuning: { ahenk: 'davud', octaveOffset: 0, tuningCents: 0 } })
    const backup = await exportBackup()
    await saveSettings({ tuning: { ahenk: 'sah', octaveOffset: 0, tuningCents: 0 } })
    render(<Settings />)
    const select = (await screen.findByLabelText('Ney ahengi')) as HTMLSelectElement
    expect(select.value).toBe('sah')
    pickFile(JSON.stringify(backup))
    await screen.findByText('Yedek yüklendi.')
    await waitFor(() => expect(select.value).toBe('davud'))
  })

  it('geri yüklemeden sonra player sesi yedekteki ney sesine ayarlanır', async () => {
    await saveSettings({ neySesi: 'nefesli' })
    const backup = await exportBackup()
    await saveSettings({ neySesi: 'mevcut' })
    render(<Settings />)
    await screen.findByRole('button', { name: 'Yedeği geri yükle' })
    expect(getNeySesi()).toBe('shakuhachi')
    pickFile(JSON.stringify(backup))
    await screen.findByText('Yedek yüklendi.')
    expect(getNeySesi()).toBe('nefesli')
    expect((screen.getByRole('radio', { name: 'Nefesli' }) as HTMLInputElement).checked).toBe(true)
  })

  it('Hakkında ve Ana ekran bağlantıları vardır', async () => {
    render(<Settings />)
    expect((await screen.findByText('Hakkında')).closest('a')?.getAttribute('href')).toBe('#/hakkinda')
    expect(screen.getByText('← Ana ekran').closest('a')?.getAttribute('href')).toBe('#/')
  })
})

describe('Settings: Ney sesi', () => {
  const radio = (name: string) => screen.getByRole('radio', { name }) as HTMLInputElement

  it('başlık ve üç seçenek; varsayılan Shakuhachi seçilidir; her birinin Dene düğmesi vardır', async () => {
    render(<Settings />)
    expect(await screen.findByRole('heading', { name: 'Ney sesi' })).toBeTruthy()
    expect(radio('Mevcut').checked).toBe(false)
    expect(radio('Nefesli').checked).toBe(false)
    expect(radio('Shakuhachi').checked).toBe(true)
    const group = screen.getByRole('radiogroup', { name: 'Ney sesi' })
    const dene = within(group).getAllByRole('button', { name: /▶ Dene/ })
    expect(dene.map((b) => b.textContent)).toEqual(['▶ Dene', '▶ Dene', '▶ Dene'])
  })

  it('kayıtlı ses seçili görünür', async () => {
    await saveSettings({ neySesi: 'nefesli' })
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Ney sesi' })
    expect(radio('Nefesli').checked).toBe(true)
    expect(radio('Shakuhachi').checked).toBe(false)
  })

  it("seçim kaydedilir ve hemen player'a uygulanır", async () => {
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Ney sesi' })
    fireEvent.click(radio('Nefesli'))
    expect(setNeySesi).toHaveBeenCalledWith('nefesli')
    await waitFor(async () => expect((await getSettings()).neySesi).toBe('nefesli'))
    await waitFor(() => expect(radio('Nefesli').checked).toBe(true))
  })

  it('Dene: önce unlockAudio, sonra kullanıcının ahenginde Dügâh–Segâh–Çârgâh–Nevâ o sesle 72 bpm çalar', async () => {
    const tuning = { ahenk: 'mansur' as const, octaveOffset: 0, tuningCents: 12 }
    await saveSettings({ tuning })
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Ney sesi' })
    fireEvent.click(screen.getByRole('button', { name: '▶ Dene (Nefesli)' }))
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    expect(vi.mocked(unlockAudio).mock.invocationCallOrder[0]!).toBeLessThan(
      vi.mocked(playWritten).mock.invocationCallOrder[0]!,
    )
    const [events, t, bpm, voice] = vi.mocked(playWritten).mock.calls[0]!
    expect(t).toEqual(tuning)
    expect(bpm).toBe(72)
    expect(voice).toBe('nefesli')
    expect(events).toEqual([
      { kind: 'note', pitch: { step: 'A', octave: 4, acc: 0 }, dur: 'quarter' },
      { kind: 'note', pitch: { step: 'B', octave: 4, acc: -1 }, dur: 'quarter' },
      { kind: 'note', pitch: { step: 'C', octave: 5, acc: 0 }, dur: 'quarter' },
      { kind: 'note', pitch: { step: 'D', octave: 5, acc: 0 }, dur: 'quarter' },
    ])
    const hz = toToneEvents(events, tuning).map((e) => e.hz)
    expect(hz).toEqual(
      events.map((e) => (e.kind === 'note' ? soundingHz(e.pitch, tuning) : null)),
    )
    // Dene seçimi değiştirmez.
    expect(setNeySesi).not.toHaveBeenCalled()
    expect((await getSettings()).neySesi).toBe('shakuhachi')
  })

  it('ses kapalıyken Dene çalmaz, SOUND_OFF gösterir', async () => {
    await saveSettings({ soundOn: false })
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Ney sesi' })
    fireEvent.click(screen.getByRole('button', { name: '▶ Dene (Nefesli)' }))
    expect(await screen.findByText(SOUND_OFF)).toBeTruthy()
    expect(unlockAudio).not.toHaveBeenCalled()
    expect(playWritten).not.toHaveBeenCalled()
  })

  it('çalma başarısız olursa SOUND_WARNING gösterir', async () => {
    vi.mocked(playWritten).mockImplementation(() => Promise.reject(new Error('ses yok')))
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Ney sesi' })
    fireEvent.click(screen.getByRole('button', { name: '▶ Dene (Mevcut)' }))
    expect(await screen.findByText(SOUND_WARNING)).toBeTruthy()
  })

  it('unlockAudio beklerken sayfadan çıkılırsa deneme çalmaya başlamaz', async () => {
    let release: () => void = () => {}
    vi.mocked(unlockAudio).mockImplementation(() => new Promise<void>((res) => (release = res)))
    const { unmount } = render(<Settings />)
    await screen.findByRole('heading', { name: 'Ney sesi' })
    fireEvent.click(screen.getByRole('button', { name: '▶ Dene (Nefesli)' }))
    await waitFor(() => expect(unlockAudio).toHaveBeenCalledTimes(1))
    unmount()
    release()
    await new Promise((r) => setTimeout(r, 30))
    expect(playWritten).not.toHaveBeenCalled()
  })

  it('unlockAudio beklerken başka Dene basılırsa yalnızca sonuncusu çalar', async () => {
    const releases: (() => void)[] = []
    vi.mocked(unlockAudio).mockImplementation(() => new Promise<void>((res) => releases.push(res)))
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Ney sesi' })
    fireEvent.click(screen.getByRole('button', { name: '▶ Dene (Nefesli)' }))
    await waitFor(() => expect(releases).toHaveLength(1))
    fireEvent.click(screen.getByRole('button', { name: '▶ Dene (Shakuhachi)' }))
    await waitFor(() => expect(releases).toHaveLength(2))
    releases.forEach((r) => r())
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    await new Promise((r) => setTimeout(r, 30))
    expect(playWritten).toHaveBeenCalledTimes(1)
    expect(vi.mocked(playWritten).mock.calls[0]![3]).toBe('shakuhachi')
  })

  it('sayfadan çıkınca ses durur', async () => {
    const { unmount } = render(<Settings />)
    await screen.findByRole('heading', { name: 'Ney sesi' })
    unmount()
    expect(stopAudio).toHaveBeenCalled()
  })
})

describe('Settings: Usul sesi', () => {
  const radio = (name: string) => screen.getByRole('radio', { name }) as HTMLInputElement
  const sofyan = USULLER.find((u) => u.id === 'sofyan')!

  it('başlık ve dört seçenek; varsayılan Tahta seçilidir; her birinin Dene düğmesi vardır', async () => {
    render(<Settings />)
    expect(await screen.findByRole('heading', { name: 'Usul sesi' })).toBeTruthy()
    const group = screen.getByRole('radiogroup', { name: 'Usul sesi' })
    expect(within(group).getAllByRole('radio').map((r) => r.closest('label')?.textContent)).toEqual([
      'Oryantal',
      'Konga',
      'Tahta',
      'Darbuka',
    ])
    expect(radio('Tahta').checked).toBe(true)
    expect(radio('Oryantal').checked).toBe(false)
    expect(within(group).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      '▶ Dene (Oryantal)',
      '▶ Dene (Konga)',
      '▶ Dene (Tahta)',
      '▶ Dene (Darbuka)',
    ])
  })

  it("seçim kaydedilir ve hemen player'a uygulanır", async () => {
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Usul sesi' })
    fireEvent.click(radio('Darbuka'))
    expect(setUsulSesi).toHaveBeenCalledWith('darbuka')
    await waitFor(async () => expect((await getSettings()).usulSesi).toBe('darbuka'))
    await waitFor(() => expect(radio('Darbuka').checked).toBe(true))
  })

  it('kayıtlı ses seçili görünür', async () => {
    await saveSettings({ usulSesi: 'konga' })
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Usul sesi' })
    expect(radio('Konga').checked).toBe(true)
    expect(radio('Tahta').checked).toBe(false)
  })

  it('Dene: önce unlockAudio, sonra Sofyan\'ın bir ölçüsü ♩ = 80\'de o sesle tek seferlik çalar', async () => {
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Usul sesi' })
    for (const [label, ses] of [
      ['Konga', 'konga'],
      ['Oryantal', 'oryantal'],
    ] as const) {
      vi.mocked(playCode).mockClear()
      fireEvent.click(screen.getByRole('button', { name: `▶ Dene (${label})` }))
      await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
      const { code, durationMs } = buildUsulOnceCode(sofyan, 80, ses)
      expect(playCode).toHaveBeenCalledWith(code, durationMs)
      expect(vi.mocked(unlockAudio).mock.invocationCallOrder.at(-1)!).toBeLessThan(
        vi.mocked(playCode).mock.invocationCallOrder[0]!,
      )
    }
    // Dene seçimi değiştirmez.
    expect(setUsulSesi).not.toHaveBeenCalled()
    expect((await getSettings()).usulSesi).toBe('tahta')
  })

  it('ses kapalıyken Dene çalmaz, SOUND_OFF gösterir', async () => {
    await saveSettings({ soundOn: false })
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Usul sesi' })
    fireEvent.click(screen.getByRole('button', { name: '▶ Dene (Tahta)' }))
    expect(await screen.findByText(SOUND_OFF)).toBeTruthy()
    expect(unlockAudio).not.toHaveBeenCalled()
    expect(playCode).not.toHaveBeenCalled()
  })

  it('çalma başarısız olursa (ör. kayıt yüklenemedi) SOUND_WARNING gösterir', async () => {
    vi.mocked(playCode).mockImplementation(() => Promise.reject(new Error('yüklenemedi')))
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Usul sesi' })
    fireEvent.click(screen.getByRole('button', { name: '▶ Dene (Darbuka)' }))
    expect(await screen.findByText(SOUND_WARNING)).toBeTruthy()
  })

  it('unlockAudio beklerken sayfadan çıkılırsa deneme çalmaya başlamaz', async () => {
    let release: () => void = () => {}
    vi.mocked(unlockAudio).mockImplementation(() => new Promise<void>((res) => (release = res)))
    const { unmount } = render(<Settings />)
    await screen.findByRole('heading', { name: 'Usul sesi' })
    fireEvent.click(screen.getByRole('button', { name: '▶ Dene (Konga)' }))
    await waitFor(() => expect(unlockAudio).toHaveBeenCalledTimes(1))
    unmount()
    release()
    await new Promise((r) => setTimeout(r, 30))
    expect(playCode).not.toHaveBeenCalled()
    expect(stopAudio).toHaveBeenCalled()
  })

  it('unlockAudio beklerken başka Dene (ney ya da usul) basılırsa yalnızca sonuncusu çalar', async () => {
    const releases: (() => void)[] = []
    vi.mocked(unlockAudio).mockImplementation(() => new Promise<void>((res) => releases.push(res)))
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Usul sesi' })
    fireEvent.click(screen.getByRole('button', { name: '▶ Dene (Konga)' }))
    await waitFor(() => expect(releases).toHaveLength(1))
    fireEvent.click(screen.getByRole('button', { name: '▶ Dene (Nefesli)' }))
    await waitFor(() => expect(releases).toHaveLength(2))
    fireEvent.click(screen.getByRole('button', { name: '▶ Dene (Darbuka)' }))
    await waitFor(() => expect(releases).toHaveLength(3))
    releases.forEach((r) => r())
    await waitFor(() => expect(playCode).toHaveBeenCalledTimes(1))
    await new Promise((r) => setTimeout(r, 30))
    expect(playCode).toHaveBeenCalledTimes(1)
    expect(playWritten).not.toHaveBeenCalled()
    expect(vi.mocked(playCode).mock.calls[0]![0]).toBe(buildUsulOnceCode(sofyan, 80, 'darbuka').code)
  })

  it('geri yüklemeden sonra player usul sesi yedekteki sese ayarlanır', async () => {
    await saveSettings({ usulSesi: 'konga' })
    const backup = await exportBackup()
    await saveSettings({ usulSesi: 'oryantal' })
    render(<Settings />)
    await screen.findByRole('button', { name: 'Yedeği geri yükle' })
    expect(getUsulSesi()).toBe('tahta')
    pickFile(JSON.stringify(backup))
    await screen.findByText('Yedek yüklendi.')
    expect(getUsulSesi()).toBe('konga')
    expect(radio('Konga').checked).toBe(true)
  })
})

describe('Settings: İnsan sesi (hazır ses, deneme)', () => {
  const sofyan = USULLER.find((u) => u.id === 'sofyan')!
  const soyle = (tur: 'Kadın' | 'Erkek' = 'Kadın') => screen.findByRole('button', { name: `▶ ${tur} (İnsan sesi)` })

  it('▶ Kadın: çalan sesi durdurur, Sofyan ♩ = 80 iki ölçüyü hazır sesle söyler; sesin adını gösterir', async () => {
    render(<Settings />)
    fireEvent.click(await soyle())
    await waitFor(() => expect(soyleUsul).toHaveBeenCalledWith(sofyan, 80, 2, 'kadin'))
    expect(stopAudio).toHaveBeenCalled()
    expect(playCode).not.toHaveBeenCalled()
    expect(await screen.findByText('Söyleyen ses: Yelda')).toBeTruthy()
  })

  it('▶ Erkek: erkek sesle söyler', async () => {
    vi.mocked(sesSec).mockImplementation(() => ({ ses: undefined, perde: 0.6, ad: 'Yelda, kalınlaştırılmış' }))
    render(<Settings />)
    fireEvent.click(await soyle('Erkek'))
    await waitFor(() => expect(soyleUsul).toHaveBeenCalledWith(sofyan, 80, 2, 'erkek'))
    expect(sesSec).toHaveBeenCalledWith('erkek')
    expect(await screen.findByText('Söyleyen ses: Yelda, kalınlaştırılmış')).toBeTruthy()
  })

  it('ses kapalıysa söylemez, uyarı gösterir', async () => {
    await saveSettings({ soundOn: false })
    render(<Settings />)
    fireEvent.click(await soyle())
    expect(await screen.findByText(SOUND_OFF)).toBeTruthy()
    expect(soyleUsul).not.toHaveBeenCalled()
  })

  it('cihazda konuşma sesi yoksa bunu söyler', async () => {
    vi.mocked(soyleUsul).mockImplementation(() => Promise.reject(new Error('yok')))
    vi.mocked(sesSec).mockImplementation(() => {
      throw new ReferenceError('speechSynthesis is not defined')
    })
    render(<Settings />)
    fireEvent.click(await soyle('Erkek'))
    expect(await screen.findByText('Bu cihazda hazır konuşma sesi bulunamadı.')).toBeTruthy()
    expect(screen.queryByText(/Söyleyen ses/)).toBeNull()
  })

  it('sayfadan çıkınca söyleme durur', async () => {
    const { unmount } = render(<Settings />)
    await soyle()
    unmount()
    expect(soylemeyiDurdur).toHaveBeenCalled()
  })
})

describe('Settings: Dil belirginliği', () => {
  const slider = () => screen.getByRole('slider', { name: 'Dil belirginliği (yüzde)' }) as HTMLInputElement

  it('varsayılan %50; kaydırınca hemen uygulanır, bırakınca kaydedilir', async () => {
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Dil belirginliği' })
    expect(slider().value).toBe('50')
    expect(screen.getByText('Dil (tu): %50')).toBeTruthy()
    fireEvent.input(slider(), { target: { value: '80' } })
    expect(setDilBelirginligi).toHaveBeenLastCalledWith(0.8)
    expect(screen.getByText('Dil (tu): %80')).toBeTruthy()
    fireEvent.change(slider(), { target: { value: '80' } })
    await waitFor(async () => expect((await getSettings()).dilBelirginligi).toBe(80))
  })

  it('kayıtlı değer görünür', async () => {
    await saveSettings({ dilBelirginligi: 20 })
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Dil belirginliği' })
    expect(slider().value).toBe('20')
  })

  it('Dene: seçili ney sesiyle önce dört dilli nota, sus, sonra aynıları bağlı çalar', async () => {
    await saveSettings({ neySesi: 'nefesli' })
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Dil belirginliği' })
    fireEvent.click(screen.getByRole('button', { name: '▶ Dene (Dil belirginliği)' }))
    await waitFor(() => expect(playWritten).toHaveBeenCalledTimes(1))
    const [events, , bpm, voice] = vi.mocked(playWritten).mock.calls[0]!
    expect(voice).toBe('nefesli')
    expect(bpm).toBe(72)
    expect(events.map((e) => e.kind)).toEqual(['note', 'note', 'note', 'note', 'rest', 'note', 'note', 'note', 'note'])
    expect(events.map((e) => (e.kind === 'note' ? Boolean(e.bag) : null))).toEqual([
      false, false, false, false, null, true, true, true, false,
    ])
  })

  it('ses kapalıyken Dene çalmaz, SOUND_OFF gösterir', async () => {
    await saveSettings({ soundOn: false })
    render(<Settings />)
    await screen.findByRole('heading', { name: 'Dil belirginliği' })
    fireEvent.click(screen.getByRole('button', { name: '▶ Dene (Dil belirginliği)' }))
    expect(await screen.findByText(SOUND_OFF)).toBeTruthy()
    expect(playWritten).not.toHaveBeenCalled()
  })

  it('geri yüklemeden sonra player yedekteki değere ayarlanır', async () => {
    await saveSettings({ dilBelirginligi: 30 })
    const backup = await exportBackup()
    await saveSettings({ dilBelirginligi: 90 })
    render(<Settings />)
    await screen.findByRole('button', { name: 'Yedeği geri yükle' })
    pickFile(JSON.stringify(backup))
    await screen.findByText('Yedek yüklendi.')
    expect(setDilBelirginligi).toHaveBeenLastCalledWith(0.3)
    expect(slider().value).toBe('30')
  })
})
