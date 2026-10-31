import { describe, expect, it } from 'vitest'
import { MAKAMLAR } from '../content/makamlar'
import { MAKAM_TOPICS } from '../content/makam-topics'
import { NOTA_TOPICS } from '../content/nota-topics'
import { PERDE_ADLARI } from '../content/perde-adlari'
import { seededRng } from '../util/rng'
import { makeQuestion, SEQ_SEP } from './questions'

const seq = (...names: string[]) => names.join(SEQ_SEP)

const LINES = 'Çizgiler alttan: Mi, Sol, Si, Re, Fa'
const SPACES = 'Aralıklar alttan: Fa, La, Do, Mi'
const BELOW = "Portenin altındaki ilk ek çizgi Do'dur"
const ABOVE = "Portenin üstündeki ilk ek çizgi La'dır"

describe('makeQuestion', () => {
  for (const topic of NOTA_TOPICS) {
    for (const card of topic.cards) {
      it(`${card}: 4 farklı seçenek, cevap içinde, aynı seed aynı soru`, () => {
        for (let seed = 1; seed <= 20; seed++) {
          const q = makeQuestion(card, seededRng(seed))
          expect(q.options).toHaveLength(4)
          expect(new Set(q.options).size).toBe(4)
          expect(q.options).toContain(q.answer)
          expect(q.cardId).toBe(card)
          expect(q.topicId).toBe(topic.id)
          expect(makeQuestion(card, seededRng(seed))).toEqual(q)
        }
      })
    }
  }

  it('note-name soru metni ve cevabı', () => {
    const q = makeQuestion('note:D5', seededRng(1))
    expect(q.prompt).toBe('Bu notanın adı ne?')
    expect(q.answer).toBe('Re')
    expect(q.events).toEqual([expect.objectContaining({ kind: 'note', dur: 'quarter' })])
  })

  it('ipuçları perdenin yerine göre', () => {
    const hint = (c: string) => makeQuestion(c, seededRng(1)).hint
    expect(hint('note:C4')).toBe(BELOW)
    expect(hint('note:D4')).toBe(BELOW)
    expect(hint('note:A5')).toBe(ABOVE)
    expect(hint('note:G5')).toBe(ABOVE)
    for (const c of ['note:E4', 'note:G4', 'note:B4', 'note:D5', 'note:F5']) expect(hint(c)).toBe(LINES)
    for (const c of ['note:F4', 'note:A4', 'note:C5', 'note:E5']) expect(hint(c)).toBe(SPACES)
  })

  it('süre soruları', () => {
    const q = makeQuestion('dur:quarter.dotted', seededRng(3))
    expect(q.prompt).toBe('Bu hangi süre?')
    expect(q.answer).toBe('Noktalı dörtlük')
    expect(q.hint).toBe('Birlik 4, ikilik 2, dörtlük 1, sekizlik ½ vuruş; nokta yarısı kadar ekler')
    expect(makeQuestion('rest:quarter', seededRng(3)).answer).toBe('Dörtlük sus')
  })

  it('sure-1 yalnızca 3 ad içerir; seçenekler diğer süre adlarından tamamlanır', () => {
    const seen = new Set<string>()
    for (let s = 1; s <= 50; s++) makeQuestion('dur:whole', seededRng(s)).options.forEach((o) => seen.add(o))
    expect(seen.has('Birlik')).toBe(true)
    expect(seen.size).toBeGreaterThan(3)
  })

  it('sure-1 tamamlayıcı çeldiricilerinde sure-4 adları (üçleme, onaltılık) yoktur', () => {
    const sure4 = ['Sekizlik üçleme', 'Onaltılık', 'Onaltılık sus']
    for (const card of ['dur:whole', 'dur:half', 'dur:quarter']) {
      for (let s = 1; s <= 200; s++) {
        const q = makeQuestion(card, seededRng(s))
        for (const ad of sure4) expect(q.options, `${card} tohum ${s}`).not.toContain(ad)
      }
    }
  })

  it('erken süre konularında ileri konuların adları (sus) sızmaz', () => {
    for (let s = 1; s <= 50; s++) {
      const q = makeQuestion('dur:eighth', seededRng(s))
      expect(q.options.filter((o) => o.endsWith('sus')).length).toBe(0)
    }
  })

  describe('sure-4 (onaltılık ve üçleme)', () => {
    it('üçleme kartı: cevap "Sekizlik üçleme", seçeneklerde "Onaltılık", hepsi farklı, porteye 3 nota', () => {
      for (let s = 1; s <= 50; s++) {
        const q = makeQuestion('dur:eighth.uclu', seededRng(s))
        expect(q.topicId).toBe('sure-4')
        expect(q.answer).toBe('Sekizlik üçleme')
        expect(q.options).toHaveLength(4)
        expect(new Set(q.options).size).toBe(4)
        expect(q.options).toContain(q.answer)
        expect(q.events).toHaveLength(3)
        expect(q.events.every((e) => e.kind === 'note' && e.dur === 'eighth' && e.uclu === true)).toBe(true)
      }
    })
    it('"Onaltılık" seçeneklerde görülür; onaltılık ve onaltılık sus kartlarının cevapları', () => {
      const seen = new Set<string>()
      for (let s = 1; s <= 50; s++) makeQuestion('dur:eighth.uclu', seededRng(s)).options.forEach((o) => seen.add(o))
      expect(seen.has('Onaltılık')).toBe(true)
      const q = makeQuestion('dur:sixteenth', seededRng(2))
      expect(q.answer).toBe('Onaltılık')
      expect(q.events).toHaveLength(1)
      const r = makeQuestion('rest:sixteenth', seededRng(2))
      expect(r.answer).toBe('Onaltılık sus')
      expect(r.events).toEqual([{ kind: 'rest', dur: 'sixteenth' }])
    })
    it('çeldiriciler konuya özgüdür: her tohumda en yakın yanlış cevaplar seçeneklerde', () => {
      const beklenen: Record<string, string[]> = {
        'dur:eighth.uclu': ['Onaltılık', 'Sekizlik'],
        'dur:sixteenth': ['Sekizlik üçleme', 'Sekizlik'],
        'rest:sixteenth': ['Sekizlik sus'],
      }
      for (const [card, adlar] of Object.entries(beklenen)) {
        for (let s = 1; s <= 50; s++) {
          const q = makeQuestion(card, seededRng(s))
          expect(new Set(q.options).size).toBe(4)
          for (const ad of adlar) expect(q.options, `${card} tohum ${s}`).toContain(ad)
        }
      }
    })
    it('ipucu üçleme ve onaltılık kartlarının ikisini de kapsar', () => {
      const h = makeQuestion('dur:sixteenth', seededRng(1)).hint
      expect(h).toMatch(/Onaltılık/)
      expect(h).toMatch(/üçleme/)
      expect(makeQuestion('dur:eighth.uclu', seededRng(1)).hint).toBe(h)
    })
    it('önceki süre konularında üçleme/onaltılık adları sızmaz', () => {
      for (const card of ['dur:eighth', 'rest:eighth', 'dur:half.dotted']) {
        for (let s = 1; s <= 50; s++) {
          const q = makeQuestion(card, seededRng(s))
          expect(q.options.some((o) => o.includes('üçleme') || o.startsWith('Onaltılık'))).toBe(false)
        }
      }
    })
  })

  describe('sure-5 (otuzikilik)', () => {
    it('kartlar soru üretir: cevap adı, dört farklı seçenek, ipucu bayrakları söyler', () => {
      const beklenen: Record<string, string> = { 'dur:thirtysecond': 'Otuzikilik', 'rest:thirtysecond': 'Otuzikilik sus' }
      for (const [card, ad] of Object.entries(beklenen)) {
        for (let s = 1; s <= 50; s++) {
          const q = makeQuestion(card, seededRng(s))
          expect(q.topicId).toBe('sure-5')
          expect(q.answer).toBe(ad)
          expect(q.options).toHaveLength(4)
          expect(new Set(q.options).size).toBe(4)
          expect(q.options).toContain(ad)
          expect(q.hint).toMatch(/Otuzikilik/)
        }
      }
    })
    it('en yakın yanlış cevap (Onaltılık / Onaltılık sus) her tohumda seçeneklerde', () => {
      for (let s = 1; s <= 50; s++) {
        expect(makeQuestion('dur:thirtysecond', seededRng(s)).options).toContain('Onaltılık')
        expect(makeQuestion('rest:thirtysecond', seededRng(s)).options).toContain('Onaltılık sus')
      }
    })
    it('önceki süre konularında (sure-1..4) "Otuzikilik" seçenek olarak sızmaz', () => {
      for (const card of ['dur:whole', 'dur:quarter', 'dur:eighth', 'rest:eighth', 'dur:half.dotted', 'dur:sixteenth', 'dur:eighth.uclu', 'rest:sixteenth']) {
        for (let s = 1; s <= 100; s++) {
          const q = makeQuestion(card, seededRng(s))
          expect(q.options.some((o) => o.startsWith('Otuzikilik')), `${card} tohum ${s}`).toBe(false)
        }
      }
    })
  })

  describe('dizi okuma (seq:)', () => {
    it('soru metni, cevap, ipucu ve olaylar', () => {
      const q = makeQuestion('seq:D5-C5-B4-A4', seededRng(1))
      expect(q.prompt).toBe('Bu dizi nasıl okunur?')
      expect(q.answer).toBe(seq('Re', 'Do', 'Si', 'La'))
      expect(q.hint).toBe('Soldan sağa tek tek oku: önce çizgi mi aralık mı olduğuna bak.')
      expect(q.events).toHaveLength(4)
      expect(q.topicId).toBe('dizi-1')
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options).size).toBe(4)
      expect(q.options).toContain(q.answer)
    })

    it('ayraç: kopmaz boşluk + en tire + boşluk; satır "–" ile başlamaz', () => {
      expect(SEQ_SEP).toBe(' – ')
      const q = makeQuestion('seq:D5-C5-B4-A4', seededRng(1))
      for (const o of q.options) {
        expect(o).toContain(' – ')
        expect(o).not.toContain(' – ')
      }
    })

    it('seçenekler düz solfejdir (tiz yok), EN DASH ile birleşir', () => {
      const q = makeQuestion('seq:C5-E5-G5-E5', seededRng(2))
      expect(q.answer).toBe(seq('Do', 'Mi', 'Sol', 'Mi'))
      for (const o of q.options) {
        expect(o).not.toMatch(/tiz/)
        expect(o.split(SEQ_SEP)).toHaveLength(4)
      }
    })

    it('çeldiriciler C4..A5 aralığında kalır (sınır dizilerde de 3 çeldirici)', () => {
      const RANGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si']
      for (const card of ['seq:A4-C5-E5-A5', 'seq:G4-A4-B4-C5', 'seq:G5-F5-E5-D5']) {
        for (let seed = 1; seed <= 20; seed++) {
          const q = makeQuestion(card, seededRng(seed))
          expect(new Set(q.options).size).toBe(4)
          for (const o of q.options) for (const n of o.split(SEQ_SEP)) expect(RANGE).toContain(n)
        }
      }
    })

    it('A5 ile biten dizide yukarı kaydırma aday olmaz (aralık dışı)', () => {
      // A4-C5-E5-A5 bir adım yukarı → B5 üstü aralık dışı; yine de 4 farklı seçenek vardır.
      const q = makeQuestion('seq:A4-C5-E5-A5', seededRng(5))
      expect(q.options).not.toContain(seq('Si', 'Re', 'Fa', 'Si'))
      expect(q.options).toHaveLength(4)
    })

    it('bir adım aşağı kaydırılmış dizi bir çeldiricidir', () => {
      const seen = new Set<string>()
      for (let s = 1; s <= 30; s++) makeQuestion('seq:D5-C5-B4-A4', seededRng(s)).options.forEach((o) => seen.add(o))
      expect(seen.has(seq('Do', 'Si', 'La', 'Sol'))).toBe(true)
      expect(seen.has(seq('Mi', 'Re', 'Do', 'Si'))).toBe(true)
    })
  })

  it('id deterministik, farklı rng durumunda farklı', () => {
    const a = makeQuestion('note:C5', seededRng(7))
    expect(makeQuestion('note:C5', seededRng(7)).id).toBe(a.id)
    expect(makeQuestion('note:C5', seededRng(8)).id).not.toBe(a.id)
    expect(a.id.startsWith('note:C5')).toBe(true)
  })
})

describe('perde isimleri (perde: / perde-ters:)', () => {
  const NINE = ['Rast', 'Dügâh', 'Segâh', 'Çârgâh', 'Nevâ', 'Hüseynî', 'Acem', 'Gerdâniye', 'Muhayyer']

  it('perde:D5 → nota göster, perde adı sor', () => {
    const q = makeQuestion('perde:D5', seededRng(1))
    expect(q.prompt).toBe('Bu notanın perde adı ne?')
    expect(q.answer).toBe('Nevâ')
    expect(q.events).toEqual([expect.objectContaining({ kind: 'note', dur: 'quarter', pitch: { step: 'D', octave: 5, acc: 0 } })])
    expect(q.hint).toBe(
      'Sırayla: Rast (Sol), Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer (tiz La).',
    )
  })

  // perde-2 artık son konudur: önündeki bütün perde konularının (perde-1, -3, -4) adları da öğrenilmiştir.
  const ONBES = [...NINE, 'Bûselik', 'Kürdî', 'Dik Kürdî', 'Nim Hicaz', 'Hicaz', 'Eviç']

  it('perde: çeldiricileri öğrenilmiş perde adlarından gelir (perde-2 için)', () => {
    for (let s = 1; s <= 30; s++) {
      for (const card of ['perde:E5', 'perde:A5']) {
        for (const o of makeQuestion(card, seededRng(s)).options) expect(ONBES).toContain(o)
      }
    }
  })

  it('perde-1 ileri soruda seçenekler yalnızca perde-1 notalarının beş adıdır', () => {
    const FIVE = ['Rast', 'Dügâh', 'Segâh', 'Çârgâh', 'Nevâ']
    for (let s = 1; s <= 30; s++) {
      for (const card of ['perde:G4', 'perde:A4', 'perde:B4b1', 'perde:C5', 'perde:D5']) {
        const opts = makeQuestion(card, seededRng(s)).options
        expect(opts).toHaveLength(4)
        expect(new Set(opts).size).toBe(4)
        for (const o of opts) expect(FIVE).toContain(o)
      }
    }
  })

  it('perde-2 ileri soru çeldiricileri önce kendi konusundan: Acem, Gerdâniye, Muhayyer', () => {
    const KENDI = ['Acem', 'Gerdâniye', 'Muhayyer']
    for (let s = 1; s <= 200; s++) {
      const q = makeQuestion('perde:F5', seededRng(s))
      expect(q.answer).toBe('Acem')
      expect(q.options).toHaveLength(4)
      for (const k of KENDI) expect(q.options).toContain(k)
      // Dördüncü seçenek en yakın önceki perde konusundan (perde-4: Nim Hicaz, Hicaz, Eviç, Hüseynî).
      expect(['Nim Hicaz', 'Hicaz', 'Eviç', 'Hüseynî']).toContain(q.options.find((x) => !KENDI.includes(x)))
    }
  })

  it('perde:E5 (Hüseynî) perde-4 konusundadır; çeldiricileri önce o konudandır: Nim Hicaz, Hicaz, Eviç', () => {
    for (let s = 1; s <= 200; s++) {
      const q = makeQuestion('perde:E5', seededRng(s))
      expect(q.topicId).toBe('perde-4')
      expect(q.answer).toBe('Hüseynî')
      expect([...q.options].sort()).toEqual(['Hüseynî', 'Nim Hicaz', 'Hicaz', 'Eviç'].sort())
    }
  })

  it('perde-5 ileri soruda konunun öbür adı her zaman çeldiricidir; kalanlar en yakın önceki konudan (perde-2)', () => {
    const PERDE_2 = ['Hüseynî', 'Acem', 'Gerdâniye', 'Muhayyer']
    for (let s = 1; s <= 200; s++) {
      for (const [card, other] of [['perde:G5#4', 'Nim Hisar'], ['perde:E5b5', 'Nim Şehnaz']] as const) {
        const q = makeQuestion(card, seededRng(s))
        expect(q.options).toContain(other)
        for (const o of q.options.filter((x) => x !== q.answer && x !== other)) expect(PERDE_2).toContain(o)
      }
    }
  })

  it('perde-4 ileri soruda konunun üç öbür adı çeldiricidir: Hicaz, Eviç, Hüseynî', () => {
    for (let s = 1; s <= 100; s++) {
      const q = makeQuestion('perde:C5#4', seededRng(s))
      expect([...q.options].sort()).toEqual(['Nim Hicaz', 'Hicaz', 'Eviç', 'Hüseynî'].sort())
    }
  })

  it('perde-ters:D5 → porte yok, perde adından nota sor', () => {
    const q = makeQuestion('perde-ters:D5', seededRng(1))
    expect(q.prompt).toBe('Nevâ hangi nota?')
    expect(q.answer).toBe('Re')
    expect(q.events).toEqual([])
    expect(q.hint).toBe(
      'Sırayla: Rast (Sol), Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer (tiz La).',
    )
  })

  it('perde-ters çeldiricileri konunun notalarındandır (oktav karşılığı hariç)', () => {
    for (let s = 1; s <= 30; s++) {
      const opts = makeQuestion('perde-ters:D5', seededRng(s)).options
      for (const o of opts) expect(['Sol', 'La', 'Si (koma bemolü)', 'Do', 'Re']).toContain(o)
    }
  })

  it('perde-ters:A5 → "tiz La"; oktav karşılığı "La" çeldirici olarak her zaman bulunur', () => {
    for (let s = 1; s <= 30; s++) {
      const q = makeQuestion('perde-ters:A5', seededRng(s))
      expect(q.prompt).toBe('Muhayyer hangi nota?')
      expect(q.answer).toBe('tiz La')
      expect(q.options).toContain('La')
      expect(q.options).toContain('tiz La')
      expect(new Set(q.options).size).toBe(4)
    }
  })

  it('perde-ters:G4 → "Sol"; seçeneklerde "tiz Sol" bulunur', () => {
    for (let s = 1; s <= 30; s++) {
      const q = makeQuestion('perde-ters:G4', seededRng(s))
      expect(q.answer).toBe('Sol')
      expect(q.options).toContain('tiz Sol')
      expect(new Set(q.options).size).toBe(4)
    }
  })

  it.each([
    ['perde-ters:A4', 'La', 'tiz La'],
    ['perde-ters:G5', 'tiz Sol', 'Sol'],
  ])('%s → cevap %j, oktav karşılığı %j seçenekte', (card, answer, counterpart) => {
    for (let s = 1; s <= 30; s++) {
      const q = makeQuestion(card, seededRng(s))
      expect(q.answer).toBe(answer)
      expect(q.options).toContain(counterpart)
      expect(new Set(q.options).size).toBe(4)
    }
  })

  it('G/A olmayan perde-ters sorularında oktav karşılığı eklenmez', () => {
    for (let s = 1; s <= 30; s++) {
      for (const o of makeQuestion('perde-ters:D5', seededRng(s)).options) expect(o).not.toMatch(/tiz/)
    }
  })
})

describe('perde-3 / perde-4 ipuçları ve Irak', () => {
  const OLD = 'Sırayla: Rast (Sol), Dügâh, Segâh, Çârgâh, Nevâ, Hüseynî, Acem, Gerdâniye, Muhayyer (tiz La).'
  const H3 = 'Si üzerindeki işaretler: işaretsiz Si Bûselik, Dik Kürdî bakiye bemolü, Kürdî küçük mücenneb bemolü.'
  const H4 =
    'Do üzerinde: Nim Hicaz bakiye diyezi, Hicaz küçük mücenneb diyezi; Fa üzerinde: Eviç bakiye diyezi; işaretsiz Mi: Hüseynî.'

  it('perde-3 ve perde-4 kendi ipucunu kullanır; perde-1/2 eskisini korur', () => {
    for (const c of ['perde:B4', 'perde-ters:B4b5']) expect(makeQuestion(c, seededRng(1)).hint).toBe(H3)
    for (const c of ['perde:C5#4', 'perde-ters:F5#4', 'perde:E5', 'perde-ters:E5']) expect(makeQuestion(c, seededRng(1)).hint).toBe(H4)
    for (const c of ['perde:G4', 'perde-ters:D5', 'perde:F5', 'perde-ters:A5', 'perde:B4b1', 'perde-ters:B4b1']) {
      expect(makeQuestion(c, seededRng(1)).hint).toBe(OLD)
    }
  })

  it('perde-1 ipucu Segâh’ı sayar, Bûselik’i saymaz; perde-3 ipucu Bûselik’i işaretsiz Si olarak anar', () => {
    const h1 = makeQuestion('perde:B4b1', seededRng(1)).hint!
    expect(h1).toContain('Segâh')
    expect(h1).not.toContain('Bûselik')
    const h3 = makeQuestion('perde:B4', seededRng(1)).hint!
    expect(h3).toContain('işaretsiz Si Bûselik')
    expect(h3).not.toContain('Segâh')
  })

  it('hiçbir perde sorusunda Irak adı seçenek olmaz (ters sorularda etiketi Eviç ile aynı olduğundan yalnızca ad denetlenir)', () => {
    for (const topic of NOTA_TOPICS.filter((t) => t.kind === 'perde-name')) {
      for (const card of topic.cards) {
        for (let seed = 1; seed <= 40; seed++) {
          for (const o of makeQuestion(card, seededRng(seed)).options) {
            expect(o).not.toBe('Irak')
          }
        }
      }
    }
  })
})

describe('perde-5 soruları (Nim Şehnaz, Nim Hisar)', () => {
  const H5 = 'Sol üzerinde: Nim Şehnaz bakiye diyezi; Mi üzerinde: Nim Hisar küçük mücenneb bemolü.'

  it('perde:E5b5 ve perde-ters:G5#4: dört farklı seçenek, cevap içinde (50 tohum)', () => {
    for (let s = 1; s <= 50; s++) {
      const ileri = makeQuestion('perde:E5b5', seededRng(s))
      expect(ileri.answer).toBe('Nim Hisar')
      expect(ileri.prompt).toBe('Bu notanın perde adı ne?')
      expect(ileri.options).toHaveLength(4)
      expect(new Set(ileri.options).size).toBe(4)
      expect(ileri.options).toContain(ileri.answer)
      const ters = makeQuestion('perde-ters:G5#4', seededRng(s))
      expect(ters.prompt).toBe('Nim Şehnaz hangi nota?')
      expect(ters.answer).toBe('Sol (bakiye diyezi)')
      expect(ters.options).toHaveLength(4)
      expect(new Set(ters.options).size).toBe(4)
      expect(ters.options).toContain(ters.answer)
    }
  })

  it('diğer perde-5 kartları da dört farklı seçenek üretir', () => {
    for (const card of ['perde:G5#4', 'perde-ters:E5b5']) {
      for (let s = 1; s <= 50; s++) {
        const q = makeQuestion(card, seededRng(s))
        expect(new Set(q.options).size).toBe(4)
        expect(q.options).toContain(q.answer)
      }
    }
    expect(makeQuestion('perde-ters:E5b5', seededRng(1)).answer).toBe('Mi (küçük mücenneb bemolü)')
  })

  it('perde-5 ipucu Nim Şehnaz’ın Sol üzerindeki bakiye diyezini ve Nim Hisar’ın Mi üzerindeki küçük mücenneb bemolünü anar', () => {
    for (const c of ['perde:G5#4', 'perde:E5b5', 'perde-ters:G5#4', 'perde-ters:E5b5']) {
      const hint = makeQuestion(c, seededRng(1)).hint!
      expect(hint).toBe(H5)
      expect(hint).toContain('Sol')
      expect(hint).toContain('bakiye diyezi')
      expect(hint).toContain('Mi')
      expect(hint).toContain('küçük mücenneb bemolü')
    }
  })

  it('perde-5 soruları Irak adı içermez', () => {
    for (const card of ['perde:G5#4', 'perde:E5b5']) {
      for (let s = 1; s <= 40; s++) expect(makeQuestion(card, seededRng(s)).options).not.toContain('Irak')
    }
  })
})

describe('perde-6 soruları (tiz perdeler)', () => {
  const H6 = 'Porte üstünde: Si koma bemolü Tiz Segâh, Do Tiz Çârgâh, Re Tiz Nevâ; Do üzerindeki bakiye diyezi Tiz Nim Hicaz.'
  const KARTLAR = ['perde:B5b1', 'perde:C6', 'perde:D6', 'perde:C6#4', 'perde-ters:B5b1', 'perde-ters:C6', 'perde-ters:D6', 'perde-ters:C6#4']

  it('perde-6 konusu perde-5 sonrasında gelir ve sekiz kartı vardır', () => {
    const t = NOTA_TOPICS.find((x) => x.id === 'perde-6')!
    expect(NOTA_TOPICS.at(-2)).toBe(t)
    expect(t.title).toBe('Tiz perdeler')
    expect(t.cards).toEqual(KARTLAR)
  })

  it('dört farklı seçenek, cevap içinde (50 tohum)', () => {
    for (const card of KARTLAR) {
      for (let s = 1; s <= 50; s++) {
        const q = makeQuestion(card, seededRng(s))
        expect(q.options, card).toHaveLength(4)
        expect(new Set(q.options).size, card).toBe(4)
        expect(q.options, card).toContain(q.answer)
        expect(q.topicId).toBe('perde-6')
      }
    }
  })

  it('ileri soru: cevap Tiz adıdır, çeldiriciler konunun öbür üç adıdır', () => {
    const TIZ = ['Tiz Segâh', 'Tiz Çârgâh', 'Tiz Nevâ', 'Tiz Nim Hicaz']
    const q = makeQuestion('perde:D6', seededRng(3))
    expect(q.prompt).toBe('Bu notanın perde adı ne?')
    expect(q.answer).toBe('Tiz Nevâ')
    expect([...q.options].sort()).toEqual([...TIZ].sort())
  })

  it('ters soru: cevap "tiz" önekli etikettir', () => {
    expect(makeQuestion('perde-ters:D6', seededRng(1)).answer).toBe('tiz Re')
    expect(makeQuestion('perde-ters:B5b1', seededRng(1)).answer).toBe('tiz Si (koma bemolü)')
    expect(makeQuestion('perde-ters:C6#4', seededRng(1)).answer).toBe('tiz Do (bakiye diyezi)')
    expect(makeQuestion('perde-ters:D6', seededRng(1)).prompt).toBe('Tiz Nevâ hangi nota?')
  })

  it('perde-6 ipucu Tiz Segâh, Çârgâh, Nevâ ve Nim Hicaz’ın yerini söyler', () => {
    for (const c of KARTLAR) {
      const hint = makeQuestion(c, seededRng(1)).hint!
      expect(hint).toBe(H6)
      expect(hint).toContain('Tiz Segâh')
      expect(hint).toContain('Tiz Nim Hicaz')
    }
  })

  it('perde-6 soruları Irak adı içermez', () => {
    for (const card of KARTLAR) {
      for (let s = 1; s <= 30; s++) expect(makeQuestion(card, seededRng(s)).options).not.toContain('Irak')
    }
  })
})

describe('makam soruları', () => {
  const MAKAM_CARDS = MAKAM_TOPICS.flatMap((t) => t.cards)

  it('makam-dizi kartları yalnız dizisi tek olan makamlara üretilir: Rast, Kürdî, Hicaz', () => {
    expect(MAKAM_CARDS.filter((c) => c.startsWith('makam-dizi:'))).toEqual(['makam-dizi:rast', 'makam-dizi:kurdi', 'makam-dizi:hicaz'])
  })

  for (const card of MAKAM_CARDS) {
    it(`${card}: 4 farklı seçenek, cevap içinde, aynı seed aynı soru`, () => {
      for (let seed = 1; seed <= 100; seed++) {
        const q = makeQuestion(card, seededRng(seed))
        expect(q.options).toHaveLength(4)
        expect(new Set(q.options).size).toBe(4)
        expect(q.options).toContain(q.answer)
        expect(q.cardId).toBe(card)
        expect(q.topicId).toBe('makam')
        expect(q.hint.length).toBeGreaterThan(0)
        expect(makeQuestion(card, seededRng(seed))).toEqual(q)
      }
    })
  }

  it('makam-dizi: porte gösterilir, cevap makam adı, seçenekler makam adlarından', () => {
    const q = makeQuestion('makam-dizi:hicaz', seededRng(3))
    expect(q.prompt).toBe('Bu dizi hangi makamın?')
    expect(q.answer).toBe('Hicaz')
    expect(q.events).toHaveLength(8)
    const adlar = MAKAMLAR.map((m) => m.name)
    for (const o of q.options) expect(adlar).toContain(o)
  })

  it('makam-dizi ipucu yalnız dizi kartı olan makamları anlatır: Rast, Kürdî, Hicaz', () => {
    const hint = makeQuestion('makam-dizi:kurdi', seededRng(1)).hint
    expect(hint).toContain('Rast:')
    expect(hint).toContain('Kürdî:')
    expect(hint).toContain('Hicaz:')
    for (const ad of ['Nevâ', 'Uşşak', 'Bayâtî', 'Hüseynî', 'Muhayyer']) expect(hint).not.toContain(ad)
  })

  it('makam-durak / makam-guclu: soru metni, cevap ve Irak içermeyen perde adı seçenekleri', () => {
    const d = makeQuestion('makam-durak:ussak', seededRng(2))
    expect(d.prompt).toBe('Uşşak makamının durağı hangi perde?')
    expect(d.answer).toBe('Dügâh')
    expect(d.events).toEqual([])
    const g = makeQuestion('makam-guclu:rast', seededRng(2))
    expect(g.prompt).toBe('Rast makamının güçlüsü hangi perde?')
    expect(g.answer).toBe('Nevâ')
    const names = Object.values(PERDE_ADLARI)
    for (let seed = 1; seed <= 40; seed++) {
      for (const card of ['makam-durak:rast', 'makam-durak:hicaz', 'makam-guclu:ussak']) {
        for (const o of makeQuestion(card, seededRng(seed)).options) {
          expect(names).toContain(o)
          expect(o).not.toBe('Irak')
        }
      }
    }
  })

  it('makam-dizi ipucu "İşaretli" (noktalı İ) ile başlar', () => {
    expect(makeQuestion('makam-dizi:rast', seededRng(1)).hint.startsWith('İşaretli notalara bak.')).toBe(true)
  })

  it('geçersiz makam kartı hata verir', () => {
    expect(() => makeQuestion('makam-dizi:yok', seededRng(1))).toThrow('Geçersiz kart kimliği')
    expect(() => makeQuestion('makam-dizi:toString', seededRng(1))).toThrow('Geçersiz kart kimliği')
    expect(() => makeQuestion('makam-x:rast', seededRng(1))).toThrow('Geçersiz kart kimliği')
  })
})
