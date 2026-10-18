export interface Topic {
  id: string
  section: 'nota'
  title: string
  kind: 'note-name' | 'duration' | 'sequence' | 'perde-name'
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
  {
    id: 'dizi-1',
    section: 'nota',
    title: 'Dizi okuma: adım adım',
    kind: 'sequence',
    cards: ['seq:G4-A4-B4-C5', 'seq:D5-C5-B4-A4', 'seq:E5-D5-C5-D5', 'seq:A4-B4-C5-B4', 'seq:C5-D5-E5-F5', 'seq:G5-F5-E5-D5'],
  },
  {
    id: 'perde-1',
    section: 'nota',
    title: "Perde adları: Rast'tan Nevâ'ya",
    kind: 'perde-name',
    cards: [
      'perde:G4', 'perde:A4', 'perde:B4', 'perde:C5', 'perde:D5',
      'perde-ters:G4', 'perde-ters:A4', 'perde-ters:B4', 'perde-ters:C5', 'perde-ters:D5',
    ],
  },
  {
    id: 'dizi-2',
    section: 'nota',
    title: 'Dizi okuma: atlamalı',
    kind: 'sequence',
    cards: ['seq:G4-B4-D5-G5', 'seq:D5-B4-G4-B4', 'seq:C5-E5-G5-E5', 'seq:A4-C5-E5-A5', 'seq:F5-D5-B4-G4', 'seq:E5-C5-A4-C5'],
  },
  {
    id: 'perde-2',
    section: 'nota',
    title: "Perde adları: Hüseynî'den Muhayyer'e",
    kind: 'perde-name',
    cards: [
      'perde:E5', 'perde:F5', 'perde:G5', 'perde:A5',
      'perde-ters:E5', 'perde-ters:F5', 'perde-ters:G5', 'perde-ters:A5',
    ],
  },
]
