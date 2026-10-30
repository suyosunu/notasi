import { describe, expect, it } from 'vitest'
import { secimGuncelle } from './secim'

describe('secimGuncelle', () => {
  it('seçim yokken dokunulan satır seçilir', () => {
    expect(secimGuncelle(null, { bas: 2, son: 3 })).toEqual({ bas: 2, son: 3 })
  })

  it('aynı satıra yeniden dokunulursa seçim kalkar (null = tümü)', () => {
    expect(secimGuncelle({ bas: 2, son: 3 }, { bas: 2, son: 3 })).toBeNull()
  })

  it('seçimin dışındaki satıra dokunulursa ikisini kapsayan aralık seçilir', () => {
    expect(secimGuncelle({ bas: 0, son: 1 }, { bas: 4, son: 5 })).toEqual({ bas: 0, son: 5 })
    expect(secimGuncelle({ bas: 4, son: 5 }, { bas: 0, son: 1 })).toEqual({ bas: 0, son: 5 })
  })

  it('geniş seçimin içindeki satıra dokunulursa yalnız o satır seçilir', () => {
    expect(secimGuncelle({ bas: 0, son: 5 }, { bas: 2, son: 3 })).toEqual({ bas: 2, son: 3 })
    expect(secimGuncelle({ bas: 0, son: 5 }, { bas: 0, son: 1 })).toEqual({ bas: 0, son: 1 })
  })
})
