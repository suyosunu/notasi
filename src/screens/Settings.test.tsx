import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportBackup, shareOrDownloadBackup } from '../store/backup'
import { getSettings, listSessions, resetDbForTests, saveSession, saveSettings } from '../store/db'
import { Settings } from './Settings'

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

  it('Hakkında ve Ana ekran bağlantıları vardır', async () => {
    render(<Settings />)
    expect((await screen.findByText('Hakkında')).closest('a')?.getAttribute('href')).toBe('#/hakkinda')
    expect(screen.getByText('← Ana ekran').closest('a')?.getAttribute('href')).toBe('#/')
  })
})
