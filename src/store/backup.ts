import { STORE_NAMES, readAllStores, replaceAllStores, saveSettings } from './db'
import type { StoreName } from './db'
import { todayLocal } from '../util/date'

export interface BackupFile {
  app: 'notasi'
  version: 1
  exportedAt: string
  data: Record<string, unknown[]>
}

export class BackupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BackupError'
  }
}

const REMINDER_AFTER_MS = 7 * 24 * 60 * 60 * 1000

export async function exportBackup(): Promise<BackupFile> {
  const data = await readAllStores()
  return { app: 'notasi', version: 1, exportedAt: new Date().toISOString(), data }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Dosyayı hiçbir depoya dokunmadan tamamen doğrular. */
function validateBackup(json: unknown): Record<StoreName, unknown[]> {
  if (!isRecord(json)) throw new BackupError('Bu dosya bir Notası yedeği değil.')
  if (json.app !== 'notasi') throw new BackupError('Bu dosya Notası uygulamasına ait değil.')
  if (json.version !== 1) throw new BackupError('Bu yedek dosyasının sürümü desteklenmiyor.')
  const data = json.data
  if (!isRecord(data)) throw new BackupError('Yedek dosyasında veri bulunamadı.')
  const out = {} as Record<StoreName, unknown[]>
  for (const name of STORE_NAMES) {
    const list = data[name]
    if (!Array.isArray(list)) throw new BackupError(`Yedek dosyası eksik veya bozuk: ${name}`)
    for (const rec of list) {
      if (!isRecord(rec) || typeof rec.id !== 'string' || rec.id === '') {
        throw new BackupError(`Yedek dosyasında bozuk kayıt var: ${name}`)
      }
    }
    out[name] = list
  }
  return out
}

/** Doğrulama geçerse tek işlemde tüm depoları yedekle değiştirir; geçmezse veri aynen kalır. */
export async function importBackup(json: unknown): Promise<void> {
  const data = validateBackup(json)
  try {
    await replaceAllStores(data)
  } catch (err) {
    throw new BackupError(`Yedek geri yüklenemedi, mevcut veri korundu. (${err instanceof Error ? err.message : String(err)})`)
  }
}

function download(file: File): void {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Paylaşım sayfasını (destekleniyorsa) açar, yoksa dosyayı indirir. Başarılı olursa `lastBackupAt` güncellenir. */
export async function shareOrDownloadBackup(): Promise<void> {
  const backup = await exportBackup()
  const name = `notasi-yedek-${todayLocal()}.json`
  const file = new File([JSON.stringify(backup)], name, { type: 'application/json' })

  const canShare = typeof navigator.canShare === 'function' && typeof navigator.share === 'function'
  if (canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name })
      await saveSettings({ lastBackupAt: new Date().toISOString() })
      return
    } catch (err) {
      // Kullanıcı paylaşımı kapattı: yedek alınmış sayılmaz, indirme de başlatılmaz.
      if (err instanceof Error && err.name === 'AbortError') return
      // Başka bir hatada (ör. kullanıcı etkileşimi yok) indirmeye düş.
    }
  }
  download(file)
  await saveSettings({ lastBackupAt: new Date().toISOString() })
}

export function needsBackupReminder(lastBackupAt: string | null, hasCompletedSession: boolean, now: Date): boolean {
  const last = lastBackupAt === null ? NaN : Date.parse(lastBackupAt)
  if (Number.isNaN(last)) return hasCompletedSession
  return now.getTime() - last > REMINDER_AFTER_MS
}
