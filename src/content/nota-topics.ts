export interface Topic {
  id: string
  section: 'nota'
  title: string
  kind: 'note-name' | 'duration'
  cards: string[]
}

/** Sıra = açılma sırası. MEB ney sırasıyla hizalıdır: gündüz okunan perde akşam çalınır. */
export const NOTA_TOPICS: Topic[] = [
  { id: 'nota-1', section: 'nota', title: 'Re, Do, Si', kind: 'note-name', cards: ['note:D5', 'note:C5', 'note:B4'] },
  { id: 'sure-1', section: 'nota', title: 'Birlik, ikilik, dörtlük', kind: 'duration', cards: ['dur:whole', 'dur:half', 'dur:quarter'] },
  { id: 'nota-2', section: 'nota', title: 'La ve Sol', kind: 'note-name', cards: ['note:A4', 'note:G4'] },
  { id: 'sure-2', section: 'nota', title: 'Sekizlik ve noktalı süreler', kind: 'duration', cards: ['dur:eighth', 'dur:half.dotted', 'dur:quarter.dotted'] },
  { id: 'nota-3', section: 'nota', title: 'Mi, Fa, Sol (üst)', kind: 'note-name', cards: ['note:E5', 'note:F5', 'note:G5'] },
  { id: 'sure-3', section: 'nota', title: 'Sus işaretleri', kind: 'duration', cards: ['rest:whole', 'rest:half', 'rest:quarter', 'rest:eighth'] },
  { id: 'nota-4', section: 'nota', title: 'Alt notalar: Do, Re, Mi, Fa', kind: 'note-name', cards: ['note:C4', 'note:D4', 'note:E4', 'note:F4'] },
  { id: 'nota-5', section: 'nota', title: 'La (üst ek çizgi)', kind: 'note-name', cards: ['note:A5'] },
]
