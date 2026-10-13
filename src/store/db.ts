import { deleteDB, openDB } from 'idb'
import type { DBSchema, IDBPDatabase } from 'idb'
import { DEFAULT_TUNING } from '../music/ahenk'
import type { Tuning } from '../music/ahenk'

export const DB_NAME = 'notasi'
export const DB_VERSION = 1

export interface AttemptRec {
  id: string
  topicId: string
  cardId: string
  correct: boolean
  at: string
}
export interface CardRec {
  id: string
  box: 1 | 2 | 3 | 4 | 5
  lastReviewedAt: string
}
export interface SessionRec {
  id: string
  kind: 'gunduz' | 'aksam'
  date: string
  startedAt: string
  endedAt?: string
  completed: boolean
  elapsedMs: number
  state: unknown
  feedback?: 'kolay' | 'tam' | 'zor'
}
export interface LongToneRec {
  id: string
  perdeId: string
  durationMs: number
  passed: boolean
  toleranceCents: number
  at: string
}
export interface FingeringFlagRec {
  id: string
  perdeId: string
  medianCents: number
  at: string
}
export interface TopicRec {
  id: string
  placedOut: boolean
  updatedAt: string
}
export interface Settings {
  tuning: Tuning
  calibrated: boolean
  soundOn: boolean
  dailyQuestionCount: number
  onboarded: boolean
  placementDone: boolean
  lastBackupAt: string | null
}

export const DEFAULT_SETTINGS: Settings = {
  tuning: DEFAULT_TUNING,
  calibrated: false,
  soundOn: true,
  dailyQuestionCount: 12,
  onboarded: false,
  placementDone: false,
  lastBackupAt: null,
}

/** `settings` deposunda tek kayıt tutulur; anahtarı bu sabittir. */
const SETTINGS_KEY = 'settings'
type SettingsRec = Settings & { id: string }

export const STORE_NAMES = [
  'attempts',
  'cards',
  'sessions',
  'longTones',
  'fingeringFlags',
  'topics',
  'settings',
] as const
export type StoreName = (typeof STORE_NAMES)[number]

interface NotasiDB extends DBSchema {
  attempts: { key: string; value: AttemptRec; indexes: { topicId: string } }
  cards: { key: string; value: CardRec }
  sessions: { key: string; value: SessionRec }
  longTones: { key: string; value: LongToneRec }
  fingeringFlags: { key: string; value: FingeringFlagRec }
  topics: { key: string; value: TopicRec }
  settings: { key: string; value: SettingsRec }
}

let dbPromise: Promise<IDBPDatabase<NotasiDB>> | null = null

function getDb(): Promise<IDBPDatabase<NotasiDB>> {
  if (!dbPromise) {
    const opening = openDB<NotasiDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const attempts = db.createObjectStore('attempts', { keyPath: 'id' })
        attempts.createIndex('topicId', 'topicId')
        db.createObjectStore('cards', { keyPath: 'id' })
        db.createObjectStore('sessions', { keyPath: 'id' })
        db.createObjectStore('longTones', { keyPath: 'id' })
        db.createObjectStore('fingeringFlags', { keyPath: 'id' })
        db.createObjectStore('topics', { keyPath: 'id' })
        db.createObjectStore('settings', { keyPath: 'id' })
      },
      blocked() {
        // Başka bir sekme eski sürümü açık tutuyor; sürüm 1 için olağan dışı.
      },
      terminated() {
        dbPromise = null
      },
    })
    opening.catch(() => {
      if (dbPromise === opening) dbPromise = null
    })
    dbPromise = opening
  }
  return dbPromise
}

function newId(): string {
  return crypto.randomUUID()
}

function nowIso(): string {
  return new Date().toISOString()
}

function byAt<T extends { at: string }>(list: T[]): T[] {
  return list.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
}

// --- settings ---------------------------------------------------------

function mergeSettings(stored: Partial<SettingsRec> | undefined): Settings {
  if (!stored) return { ...DEFAULT_SETTINGS, tuning: { ...DEFAULT_SETTINGS.tuning } }
  const { id: _id, ...rest } = stored
  return {
    ...DEFAULT_SETTINGS,
    ...rest,
    tuning: { ...DEFAULT_SETTINGS.tuning, ...(rest.tuning ?? {}) },
  }
}

export async function getSettings(): Promise<Settings> {
  const db = await getDb()
  return mergeSettings(await db.get('settings', SETTINGS_KEY))
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const db = await getDb()
  const tx = db.transaction('settings', 'readwrite')
  const merged = mergeSettings(await tx.store.get(SETTINGS_KEY))
  const next: Settings = { ...merged, ...patch }
  await Promise.all([tx.store.put({ id: SETTINGS_KEY, ...next }), tx.done])
  return next
}

// --- attempts ---------------------------------------------------------

export async function addAttempt(a: Pick<AttemptRec, 'topicId' | 'cardId' | 'correct'>): Promise<AttemptRec> {
  const rec: AttemptRec = {
    id: newId(),
    topicId: a.topicId,
    cardId: a.cardId,
    correct: a.correct,
    at: nowIso(),
  }
  const db = await getDb()
  await db.put('attempts', rec)
  return rec
}

/** `at`'e göre artan sırada. */
export async function listAttempts(topicId?: string): Promise<AttemptRec[]> {
  const db = await getDb()
  const list =
    topicId === undefined ? await db.getAll('attempts') : await db.getAllFromIndex('attempts', 'topicId', topicId)
  return byAt(list)
}

// --- cards ------------------------------------------------------------

export async function getCard(id: string): Promise<CardRec | undefined> {
  return (await getDb()).get('cards', id)
}

export async function putCard(c: CardRec): Promise<void> {
  await (await getDb()).put('cards', c)
}

export async function listCards(): Promise<CardRec[]> {
  return (await getDb()).getAll('cards')
}

// --- sessions ---------------------------------------------------------

/** `endedAt`'i olmayan en son oturum. */
export async function getOpenSession(kind: SessionRec['kind']): Promise<SessionRec | undefined> {
  const all = await (await getDb()).getAll('sessions')
  let best: SessionRec | undefined
  for (const s of all) {
    if (s.kind !== kind || s.endedAt) continue
    if (!best || s.startedAt > best.startedAt) best = s
  }
  return best
}

export async function saveSession(s: SessionRec): Promise<void> {
  await (await getDb()).put('sessions', s)
}

export async function listSessions(): Promise<SessionRec[]> {
  return (await getDb()).getAll('sessions')
}

// --- long tones & fingering flags --------------------------------------

export async function addLongTone(r: Omit<LongToneRec, 'id' | 'at'>): Promise<LongToneRec> {
  const rec: LongToneRec = { ...r, id: newId(), at: nowIso() }
  await (await getDb()).put('longTones', rec)
  return rec
}

export async function listLongTones(perdeId?: string): Promise<LongToneRec[]> {
  const all = await (await getDb()).getAll('longTones')
  return byAt(perdeId === undefined ? all : all.filter((r) => r.perdeId === perdeId))
}

export async function addFingeringFlag(r: Omit<FingeringFlagRec, 'id' | 'at'>): Promise<FingeringFlagRec> {
  const rec: FingeringFlagRec = { ...r, id: newId(), at: nowIso() }
  await (await getDb()).put('fingeringFlags', rec)
  return rec
}

// --- topics -----------------------------------------------------------

export async function listTopics(): Promise<TopicRec[]> {
  return (await getDb()).getAll('topics')
}

export async function setPlacedOut(topicId: string): Promise<void> {
  await (await getDb()).put('topics', { id: topicId, placedOut: true, updatedAt: nowIso() })
}

// --- backup helpers (yalnızca backup.ts kullanır) ----------------------

/** Tüm depoları tek bir okuma işleminde, tutarlı biçimde okur. */
export async function readAllStores(): Promise<Record<StoreName, unknown[]>> {
  const db = await getDb()
  const tx = db.transaction([...STORE_NAMES], 'readonly')
  const [attempts, cards, sessions, longTones, fingeringFlags, topics, settings] = await Promise.all([
    tx.objectStore('attempts').getAll(),
    tx.objectStore('cards').getAll(),
    tx.objectStore('sessions').getAll(),
    tx.objectStore('longTones').getAll(),
    tx.objectStore('fingeringFlags').getAll(),
    tx.objectStore('topics').getAll(),
    tx.objectStore('settings').getAll(),
    tx.done,
  ] as const)
  return { attempts, cards, sessions, longTones, fingeringFlags, topics, settings }
}

/**
 * Tüm depoları tek bir readwrite işleminde temizler ve verilen kayıtlarla doldurur.
 * Herhangi bir yazma başarısız olursa işlem iptal edilir ve mevcut veri korunur.
 */
export async function replaceAllStores(data: Record<StoreName, unknown[]>): Promise<void> {
  const db = await getDb()
  const tx = db.transaction([...STORE_NAMES], 'readwrite')
  const ops: Promise<unknown>[] = [tx.done]
  for (const name of STORE_NAMES) {
    const store = tx.objectStore(name as 'attempts')
    ops.push(store.clear())
    for (const rec of data[name]) ops.push(store.put(rec as AttemptRec))
  }
  try {
    await Promise.all(ops)
  } catch (err) {
    try {
      tx.abort()
    } catch {
      // işlem zaten iptal edilmiş
    }
    throw err
  }
}

// --- tests ------------------------------------------------------------

export async function resetDbForTests(): Promise<void> {
  const opening = dbPromise
  dbPromise = null
  if (opening) {
    try {
      ;(await opening).close()
    } catch {
      // açılamamış bağlantı kapatılacak bir şey bırakmaz
    }
  }
  await deleteDB(DB_NAME)
}
