export interface SectionDef {
  id: 'nota' | 'ney' | 'makam' | 'usul' | 'parcalar' | 'piyano'
  title: string
  icon: string
  status: 'aktif' | 'yakinda' | 'ileride'
  route?: string
}

export const SECTIONS: SectionDef[] = [
  { id: 'nota', title: 'Nota', icon: '🎼', status: 'aktif', route: '/nota' },
  { id: 'ney', title: 'Ney', icon: '🪈', status: 'aktif', route: '/ney' },
  { id: 'makam', title: 'Makam', icon: '🧭', status: 'aktif', route: '/makam' },
  { id: 'usul', title: 'Usul', icon: '🥁', status: 'yakinda' },
  { id: 'parcalar', title: 'Parçalar', icon: '🎧', status: 'yakinda' },
  { id: 'piyano', title: 'Piyano', icon: '🎹', status: 'ileride' },
]
