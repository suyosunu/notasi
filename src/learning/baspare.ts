import { median } from './smoothing'

/** Başpâre çalışmasının `LongToneRec.perdeId` değeri. */
export const BASPARE_ID = 'baspare'
/** Nefes çalışması bitince `onaylananHedefler`'e yazılan kimlik. */
export const NEFES_HEDEF_ID = 's0-nefes'

export const BASPARE_DENEME = 10
/** Ses başlangıcından kararlı Nevâ'ya en çok bu kadar sürerse deneme "anında" sayılır. */
export const BASPARE_ANINDA_MS = 1000
/** 10 denemenin en az bu kadarı "anında" olmalı. */
export const BASPARE_GECME = 8
/** Nevâ'ya göre kabul edilen sapma (sent). */
export const BASPARE_TOLERANS = 25
/** Tolerans içinde kesintisiz kalınması gereken süre. */
export const BASPARE_KARARLI_MS = 400
/** Yeni deneme için gereken kesintisiz sessizlik. */
export const BASPARE_SESSIZLIK_MS = 700
/** Ses başladıktan sonra bu kadar sürede kararlı Nevâ bulunamazsa deneme "bulunamadı" sayılır. */
export const BASPARE_ZAMAN_ASIMI_MS = 4000

export interface BaspareState {
  /** `sessizlik-bekle`: yeni deneme için sessizlik bekleniyor; `hazir`: sessizlik yetti, ilk ses denemeyi başlatır; `ariyor`: deneme sürüyor. */
  faz: 'sessizlik-bekle' | 'hazir' | 'ariyor'
  /** Biten denemelerin sonuçları: ses başlangıcından kararlı Nevâ'ya ms, ya da bulunamadıysa `null`. */
  denemeler: (number | null)[]
  /** Süren sessizliğin başladığı an (sessizlik yoksa `null`). */
  sessizBasla: number | null
  /** Süren denemenin ilk ses anı. */
  t0: number | null
  /** Süren kesintisiz tolerans içi sürenin başladığı an. */
  kararliBasla: number | null
}

export function initialBaspare(): BaspareState {
  return { faz: 'sessizlik-bekle', denemeler: [], sessizBasla: null, t0: null, kararliBasla: null }
}

function sonuclandir(s: BaspareState, sonuc: number | null): BaspareState {
  return {
    faz: 'sessizlik-bekle',
    denemeler: [...s.denemeler, sonuc],
    sessizBasla: null,
    t0: null,
    kararliBasla: null,
  }
}

/**
 * Bir örnek ilerletir. `cents`: yumuşatılmış perdenin Nevâ'ya sapması; ses yoksa `null`.
 * Deneme yalnız sessizlikten sonraki ilk sesle başlar; böylece hiç susmayan kullanıcı sayacı şişiremez.
 */
export function stepBaspare(s: BaspareState, sample: { t: number; cents: number | null }): BaspareState {
  if (s.denemeler.length >= BASPARE_DENEME) return s
  const { t, cents } = sample

  if (s.faz === 'sessizlik-bekle') {
    if (cents !== null) return s.sessizBasla === null ? s : { ...s, sessizBasla: null }
    const basla = s.sessizBasla ?? t
    if (t - basla >= BASPARE_SESSIZLIK_MS) return { ...s, faz: 'hazir', sessizBasla: basla }
    return basla === s.sessizBasla ? s : { ...s, sessizBasla: basla }
  }

  if (s.faz === 'hazir') {
    if (cents === null) return s
    // İlk ses: deneme başlar, bu örnek de denemenin ilk örneğidir.
    return aramaAdimi({ ...s, faz: 'ariyor', t0: t, kararliBasla: null }, t, cents)
  }

  return aramaAdimi(s, t, cents)
}

function aramaAdimi(s: BaspareState, t: number, cents: number | null): BaspareState {
  const t0 = s.t0 ?? t
  const icinde = cents !== null && Math.abs(cents) <= BASPARE_TOLERANS
  const kararliBasla = icinde ? (s.kararliBasla ?? t) : null
  if (kararliBasla !== null && t - kararliBasla >= BASPARE_KARARLI_MS) return sonuclandir(s, kararliBasla - t0)
  if (t - t0 > BASPARE_ZAMAN_ASIMI_MS) return sonuclandir(s, null)
  return kararliBasla === s.kararliBasla ? s : { ...s, kararliBasla }
}

export interface BaspareSonucu {
  /** `BASPARE_ANINDA_MS` içinde bulunan deneme sayısı. */
  aninda: number
  toplam: number
  gecti: boolean
  /** Bulunan denemelerin ortancası (ms); hiç bulunan yoksa `null`. */
  ortancaMs: number | null
}

export function baspareSonuc(s: BaspareState): BaspareSonucu {
  const bulunan = s.denemeler.filter((d): d is number => d !== null)
  const aninda = bulunan.filter((d) => d <= BASPARE_ANINDA_MS).length
  return {
    aninda,
    toplam: s.denemeler.length,
    gecti: aninda >= BASPARE_GECME,
    ortancaMs: bulunan.length === 0 ? null : Math.round(median(bulunan)),
  }
}

/** Sayıdan sonra gelen bulunma eki ("9'unda"); 0–10 arası sayılar için. */
const BULUNMA_EKI = ["'ında", "'inde", "'sinde", "'ünde", "'ünde", "'inde", "'sında", "'sinde", "'inde", "'unda", "'unda"]

/** "10 denemenin 9'unda anında" */
export function baspareSonucMetni(r: BaspareSonucu): string {
  if (r.toplam === 0) return 'Henüz deneme yapılmadı.'
  return `${r.toplam} denemenin ${r.aninda}${BULUNMA_EKI[r.aninda] ?? "'de"} anında`
}
