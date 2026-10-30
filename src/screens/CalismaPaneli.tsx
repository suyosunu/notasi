import type { JSX } from 'preact'
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { buildCalismaCode, konumBul } from '../audio/calisma'
import type { CalismaKodu } from '../audio/calisma'
import { setKayitSession, setPlaybackSession } from '../audio/ios'
import { micHataMetni, startPitchStream } from '../audio/mic'
import { getNeySesi, playCode, sesSaatiSimdi, stopAudio, unlockAudio } from '../audio/player'
import { sonIsaret } from '../audio/sesSaati'
import { acquireWakeLock, releaseWakeLock } from '../audio/wakeLock'
import { NEY_PERDELER } from '../content/ney-perdeler'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import type { Usul } from '../content/usuller'
import { ANALIZ_PENCERESI_S, beklenenNotalar, degerlendir } from '../learning/takip'
import type { NotaSonucu, TakipDurumu, TakipOrnegi, TakipSonucu } from '../learning/takip'
import type { MusicEvent } from '../music/notation'
import { samePitch, SOLFEJ } from '../music/pitch'
import { ScoreView } from '../notation/ScoreView'
import { secimGuncelle } from '../notation/secim'
import type { Secim } from '../notation/secim'
import { DEFAULT_SETTINGS, getSettings } from '../store/db'
import type { Settings } from '../store/db'

/** "Her turda hızlan": her tur sonunda tempo bu kadar (♩) artar, `bpmMax`'ı geçmez. */
export const HIZ_ADIMI = 5
const METRONOME_NOTE = 'Bu usulün vuruş kalıbı bilinmediği için eşlik metronomla yapılır.'
const IPUCU = 'Bir satıra dokun: yalnız o bölüm çalar. Başka bir satıra da dokunursan aradaki bölüm seçilir.'
const TAKIP_NOTU =
  'Deneme: telefonu neyin önüne koy. Eşlik çalar, sen neyle çalarsın; sonunda her nota için sonuç çıkar.'
const SES_BASLAMADI = 'Ses başlamadı, sonuç çıkarılamadı.'
/** Kullanıcı son bu kadar ms içinde kaydırdıysa çalan satıra otomatik kaydırılmaz. */
const KULLANICI_KAYDIRMA_MS = 2000
/** Kendi `scrollIntoView`'umuzdan sonra bu kadar ms içindeki scroll olayları (yumuşak kaydırma) kullanıcıdan sayılmaz. */
const KENDI_KAYDIRMA_MS = 1000

type Konum = { olcu: number; nota: number }

/** Çalan tur: vurgu hesabı yalnız bu turun tempo ve giriş sayımıyla yapılır. */
interface Tur {
  run: number
  tempo: number
  girisVurus: number
  /** Seçimin sonuna dek kesilmiş ölçüler (seçimden sonraki ölçü vurgulanmasın). */
  olcu: MusicEvent[][]
  bas: number
}

/** Süren mikrofon takibi: başlatmanın iptal anahtarı ve (açıldıysa) mikrofon durdurucusu. */
interface Dinleme {
  iptal: AbortController
  durdurucu: (() => void) | null
}

/** Çubuktaki uyarı; `detay` (mikrofon hatasının tanılaması) küçük satırda gösterilir. */
interface Uyari {
  metin: string
  detay?: string
}

/** Sonraki kare: `requestAnimationFrame` yoksa 50 ms `setTimeout`. Dönen işlev bekleyen kareyi iptal eder. */
function kare(cb: () => void): () => void {
  if (typeof requestAnimationFrame === 'function') {
    const id = requestAnimationFrame(cb)
    return () => cancelAnimationFrame(id)
  }
  const id = setTimeout(cb, 50)
  return () => clearTimeout(id)
}

const bolumEtiketi = (s: Secim) =>
  s.bas === s.son ? `Bölüm: ${s.bas + 1}. ölçü` : `Bölüm: ${s.bas + 1}–${s.son + 1}. ölçüler`

/** Birlerin (0–9) ve onların (10–90) okunuşuna göre iyelik eki: bir-i, iki-si, üç-ü …; on-u, yirmi-si, otuz-u … */
const BIRLER_EKI = ['ı', 'i', 'si', 'ü', 'ü', 'i', 'sı', 'si', 'i', 'u']
const ONLAR_EKI = ['', 'u', 'si', 'u', 'ı', 'si', 'ı', 'i', 'i', 'ı']

/** Sayı ve iyelik eki, okunuşun son sözcüğüne göre: "12'si", "16'sı", "3'ü", "40'ı", "100'ü". */
function iyelikli(n: number): string {
  let ek: string
  if (n === 0 || n % 10 !== 0) ek = BIRLER_EKI[n % 10]!
  else if (n % 100 !== 0) ek = ONLAR_EKI[(n / 10) % 10]!
  else if (n % 1000 !== 0) ek = 'ü' // yüz
  else ek = 'i' // bin
  return `${n}'${ek}`
}

/** Adları sayar; çoktan aza (eşitlikte ilk görülen önce). */
function say(adlar: string[]): [string, number][] {
  const m = new Map<string, number>()
  for (const a of adlar) m.set(a, (m.get(a) ?? 0) + 1)
  return [...m].sort((a, b) => b[1] - a[1])
}

/**
 * Takip sonucunun özeti: başlık ("16 notadan 12'si doğru."), varsa ayrıntı satırları (pes, tiz, başka perde, duyulmadı,
 * kısa tutuldu, değerlendirilmeyen) ve tanılama satırı. Perde adı beklenen notanın yazılı perdesinden (`NEY_PERDELER`;
 * listede yoksa solfej adı); `olcu` sonucun ölçü indislerinin işaret ettiği (bütün) nota dizisidir.
 */
export function takipOzeti(sonuc: TakipSonucu, olcu: MusicEvent[][]): { baslik: string; satirlar: string[]; tani: string } {
  const ad = (s: NotaSonucu) => {
    const e = olcu[s.olcu]?.[s.nota]
    if (!e || e.kind !== 'note') return '?'
    return NEY_PERDELER.find((p) => samePitch(p.written, e.pitch))?.name ?? SOLFEJ[e.pitch.step]
  }
  const durumda = (d: TakipDurumu) => sonuc.notalar.filter((s) => s.durum === d)
  const satirlar: string[] = []
  for (const [d, etiket] of [
    ['pes', 'Pes'],
    ['tiz', 'Tiz'],
  ] as const) {
    const sayim = say(durumda(d).map(ad))
    if (sayim.length) satirlar.push(`${etiket}: ${sayim.map(([a, k]) => `${a} (${k})`).join(', ')}`)
  }
  const yanlis = say(durumda('yanlis').map((s) => `${ad(s)} yerine ${s.calinan ?? 'başka bir perde'}`))
  if (yanlis.length) satirlar.push(`Başka perde: ${yanlis.map(([a, k]) => (k > 1 ? `${a} (${k})` : a)).join(', ')}`)
  const yok = durumda('yok').length
  if (yok) satirlar.push(`Duyulmadı: ${yok} nota`)
  const kisa = durumda('kisa').length
  if (kisa) satirlar.push(`Kısa tutuldu: ${kisa} nota`)
  if (sonuc.atlanan) satirlar.push(`${sonuc.atlanan} nota çok kısa olduğu için değerlendirilmedi.`)
  return {
    baslik: `${sonuc.notalar.length} notadan ${iyelikli(durumda('dogru').length)} doğru.`,
    satirlar,
    tani: `Gecikme ${sonuc.gecikmeMs} ms · ses duyulan kare %${Math.round(sonuc.sesliOran * 100)}`,
  }
}

/**
 * Etüt ve parçanın ortak çalışma paneli: dokunulabilir nota (satır seçimi → yalnız o bölüm çalar), hız, eşlik
 * (usul ya da metronom) anahtarı, tekrar ve her turda hızlanma, dinle / usulle (metronomla) çal / durdur ve çalan
 * notanın vurgusu (ses saati işaretinden; çalan satır görünüme kaydırılır). Bölüm satırı ve çalma düğmeleri notanın
 * ardındaki yapışkan çubuktadır. `durdurRef`: üst ekran (ör. "Çaldım") çalan sesi durdurabilsin diye panelin durdurma
 * işlevi buraya yazılır. `takip` (deneme, yalnız etüt): "🎤 Çal, dinlesin" seçili bölümü eşlikle bir tur çalarken
 * mikrofonu dinler; tur bitince her notanın sonucu notada ve özette gösterilir.
 */
export function CalismaPaneli(props: {
  olcu: MusicEvent[][]
  soz?: string[][]
  usul?: Usul
  varsayilanBpm: number
  bpmMin: number
  bpmMax: number
  olcuPerSatir?: number
  beamBeats?: number
  durdurRef?: { current: (() => void) | null }
  takip?: boolean
}): JSX.Element {
  const { olcu, soz, usul, varsayilanBpm, bpmMin, bpmMax, olcuPerSatir, beamBeats, durdurRef, takip } = props
  const [settings, setSettings] = useState<Settings | null>(null)
  const [bpm, setBpm] = useState(varsayilanBpm)
  const [eslik, setEslik] = useState(true)
  const [tekrar, setTekrar] = useState(false)
  const [hizlan, setHizlan] = useState(false)
  const [secim, setSecim] = useState<Secim | null>(null)
  const [playing, setPlaying] = useState(false)
  const [turNo, setTurNo] = useState(1)
  const [warn, setWarn] = useState<Uyari | null>(null)
  const [vurgu, setVurgu] = useState<Konum | null>(null)
  /** Süren çalım mikrofon takibi mi ("🎤 Dinliyorum…"). */
  const [dinliyor, setDinliyor] = useState(false)
  /** Son biten takibin sonucu; yeni çalım, yeni seçim ya da "Sonucu temizle" kaldırır. */
  const [sonuc, setSonuc] = useState<TakipSonucu | null>(null)
  /** Süren mikrofon takibi; `dinlemeyiBitir` kapatır. */
  const dinlemeRef = useRef<Dinleme | null>(null)
  /** Her başlatma/durdurmada artar: yalnızca son çalmanın sonucu ekranı değiştirir. */
  const runRef = useRef(0)
  /** Tekrar ve hızlanma çalarken değişebilir; tur sonunda buradan okunur. */
  const tekrarRef = useRef(false)
  const hizlanRef = useRef(false)
  const turRef = useRef<Tur | null>(null)
  /** Vurgu döngüsünün bekleyen karesini iptal eder. */
  const vurguIptalRef = useRef<(() => void) | null>(null)
  /** Yapışkan çalma çubuğu; hemen önündeki öğe nota (`.score`). */
  const cubukRef = useRef<HTMLDivElement>(null)
  /** Otomatik kaydırma: son kaydırılan satır, kullanıcının ve bizim son kaydırma anımız (Date.now). */
  const kaydirilanSatirRef = useRef<Element | null>(null)
  const kullaniciKaydirdiRef = useRef(-Infinity)
  const kendiKaydirdiRef = useRef(-Infinity)

  useEffect(() => {
    let alive = true
    getSettings()
      .catch(() => DEFAULT_SETTINGS) // ayarlar okunamazsa varsayılanlarla çalınır
      .then((cfg) => {
        if (alive) setSettings(cfg)
      })
    return () => {
      alive = false
    }
  }, [])

  // Sayfadan çıkınca çalan ses susar, bekleyen tur ya da unlockAudio çıkıştan sonra çalmaz. Preact edilgen
  // (useEffect) temizliklerini çizimden sonraya erteler; geçersiz kılma eşzamanlı çalışsın diye useLayoutEffect'tedir.
  useLayoutEffect(
    () => () => {
      runRef.current++
      dinlemeyiBitir()
      stopAudio()
      releaseWakeLock()
      vurguIptalRef.current?.()
    },
    [],
  )

  // Kullanıcı kaydırması: dokunma ve tekerlek her zaman kullanıcıdır; scroll olayı yalnız kendi yumuşak kaydırmamızın
  // ardından gelmiyorsa.
  useEffect(() => {
    const kullanici = () => {
      kullaniciKaydirdiRef.current = Date.now()
    }
    const kaydirma = () => {
      if (Date.now() - kendiKaydirdiRef.current > KENDI_KAYDIRMA_MS) kullanici()
    }
    const secenek = { passive: true }
    window.addEventListener('scroll', kaydirma, secenek)
    window.addEventListener('touchmove', kullanici, secenek)
    window.addEventListener('wheel', kullanici, secenek)
    return () => {
      window.removeEventListener('scroll', kaydirma)
      window.removeEventListener('touchmove', kullanici)
      window.removeEventListener('wheel', kullanici)
    }
  }, [])

  // Üst ekranın durdurabilmesi için; panel kalkınca boşalır. `stop` yalnız ref ve setter kullanır, ilk çizimdeki yeter.
  useLayoutEffect(() => {
    if (!durdurRef) return
    durdurRef.current = stop
    return () => {
      durdurRef.current = null
    }
  }, [durdurRef])

  // Vurgu: çalarken her karede `t0 = sonIsaret()` ve `sesSaatiSimdi()`'den çalan olay bulunur.
  useEffect(() => {
    if (!playing) {
      setVurgu(null)
      return
    }
    let iptal: (() => void) | null = null
    let alive = true
    let son: Konum | null = null
    const tick = () => {
      if (!alive) return
      const tur = turRef.current
      const t0 = sonIsaret()
      const simdi = sesSaatiSimdi()
      let k: Konum | null = null
      if (tur && tur.run === runRef.current && t0 !== null && simdi !== null) {
        k = konumBul(tur.olcu, tur.bas, ((simdi - t0) * tur.tempo) / 60 - tur.girisVurus)
      }
      if (k?.olcu !== son?.olcu || k?.nota !== son?.nota) {
        son = k
        setVurgu(k)
      }
      iptal = kare(tick)
    }
    const durdur = () => {
      alive = false
      iptal?.()
    }
    vurguIptalRef.current = durdur
    tick()
    return () => {
      durdur()
      setVurgu(null)
    }
  }, [playing])

  // Çalarken vurgu yeni satıra geçince satır görünüme kaydırılır (yapışkan çubuğun altında kalmasın: CSS
  // `scroll-margin-bottom`); kullanıcı son 2 sn içinde kaydırdıysa dokunulmaz. Vurgulu satır DOM'a yazılır yazılmaz
  // bakılsın diye useLayoutEffect'tedir.
  useLayoutEffect(() => {
    if (!playing) {
      kaydirilanSatirRef.current = null
      return
    }
    const satir = cubukRef.current?.previousElementSibling?.querySelector('[data-highlight]')?.closest('.score-row')
    if (!satir || satir === kaydirilanSatirRef.current) return
    kaydirilanSatirRef.current = satir
    if (Date.now() - kullaniciKaydirdiRef.current < KULLANICI_KAYDIRMA_MS) return
    if (typeof satir.scrollIntoView !== 'function') return
    kendiKaydirdiRef.current = Date.now()
    satir.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [vurgu, playing])

  /**
   * Dokunuş işleyicisinden çağrılır: unlockAudio eşzamanlı, ilk await'ten önce başlatılır (iOS). Her tur seçili
   * ölçüleri o anki tempoyla çalar; tekrar açıksa tur bitince yeniden başlar, hızlanma açıksa tempo `HIZ_ADIMI` artar.
   */
  async function calis(melodi: boolean) {
    if (!settings) return
    dinlemeyiBitir()
    const run = ++runRef.current
    setWarn(null)
    setSonuc(null)
    setDinliyor(false)
    if (!settings.soundOn) {
      setWarn({ metin: SOUND_OFF })
      return
    }
    const { bas, dilim, kesik } = bolum()
    const tuning = settings.tuning
    const voice = getNeySesi()
    // "Usulle / Metronomla çal": yalnız eşlik; melodi kapalıyken anahtar anlamsızdır.
    const tur = (tempo: number): CalismaKodu =>
      buildCalismaCode(dilim, tuning, tempo, {
        melodi,
        eslik: melodi ? (eslik ? 'usul' : 'yok') : 'usul',
        voice,
        ...(usul ? { usul } : {}),
      })
    let tempo = bpm
    setTurNo(1)
    setPlaying(true)
    void acquireWakeLock() // uzun çalışmada ekran kararmasın
    try {
      const unlocked = unlockAudio()
      unlocked.catch(() => {}) // kod üretimi fırlatırsa işlenmemiş ret kalmasın; hata aşağıda await ile yakalanır
      let kod = tur(tempo)
      await unlocked
      for (let n = 1; ; n++) {
        if (run !== runRef.current) return
        setTurNo(n)
        // playCode önce stopAudio ile eski işareti siler; vurgu bu turun değerleriyle hesaplanır.
        const calan = playCode(kod.code, kod.durationMs)
        turRef.current = { run, tempo, girisVurus: kod.girisVurus, olcu: kesik, bas }
        await calan
        if (turRef.current?.run === run) turRef.current = null
        if (run !== runRef.current || !tekrarRef.current) return
        if (hizlanRef.current) {
          tempo = Math.min(bpmMax, tempo + HIZ_ADIMI)
          setBpm(tempo) // kaydırıcı ulaşılan hızı gösterir
        }
        kod = tur(tempo)
      }
    } catch {
      if (run === runRef.current) setWarn({ metin: SOUND_WARNING })
    } finally {
      if (turRef.current?.run === run) turRef.current = null
      if (run === runRef.current) {
        setPlaying(false)
        releaseWakeLock()
      }
    }
  }

  /** Seçili bölüm: ilk ölçü, çalınacak ölçüler ve seçimin sonuna dek kesilmiş ölçüler (vurgu için). */
  function bolum() {
    const bas = secim?.bas ?? 0
    const sonOlcu = secim ? secim.son : olcu.length - 1
    return { bas, dilim: olcu.slice(bas, sonOlcu + 1), kesik: olcu.slice(0, sonOlcu + 1) }
  }

  /**
   * Takibin tek çıkış noktası (doğal bitiş, Durdur, seçim/hız/eşlik değişimi, yeni çalım, çıkış, hata): açılmakta olan
   * mikrofon iptal edilir, açık olan durdurulur ve ses oturumu `playback`'e döner. Takip yoksa bir şey yapmaz. Yalnız
   * ref kullanır: ilk çizimdeki kopya (çıkış temizliği, `durdurRef`) da geçerlidir.
   */
  function dinlemeyiBitir() {
    const d = dinlemeRef.current
    if (!d) return
    dinlemeRef.current = null
    d.iptal.abort()
    d.durdurucu?.()
    setPlaybackSession()
  }

  /**
   * "🎤 Çal, dinlesin": seçili bölüm melodisiz, tek tur çalar (Tekrarla ve Hızlan yok sayılır; eşlik anahtarı kapalıysa
   * yalnız giriş sayımı) ve mikrofon dinlenir. Dokunuş işleyicisinden çağrılır: unlockAudio, kayıt oturumu ve mikrofon
   * sırayla, eşzamanlı, ilk await'ten önce başlar (iOS; unlockAudio oturumu `playback` yaptığı için kayıt oturumu
   * ondan sonra). Eşlik mikrofon açılınca çalar. Tur doğal bitince örnekler ses saati işaretine göre değerlendirilir.
   */
  async function takipEt() {
    if (!settings) return
    dinlemeyiBitir()
    const run = ++runRef.current
    setWarn(null)
    setSonuc(null)
    if (!settings.soundOn) {
      setWarn({ metin: SOUND_OFF })
      return
    }
    const { bas, dilim, kesik } = bolum()
    const tuning = settings.tuning
    const tempo = bpm
    const ornekler: TakipOrnegi[] = []
    const dinleme: Dinleme = { iptal: new AbortController(), durdurucu: null }
    setDinliyor(true)
    setPlaying(true)
    void acquireWakeLock()
    try {
      const kod = buildCalismaCode(dilim, tuning, tempo, {
        melodi: false,
        eslik: eslik ? 'usul' : 'yok',
        voice: getNeySesi(),
        ...(usul ? { usul } : {}),
      })
      dinlemeRef.current = dinleme
      const unlocked = unlockAudio()
      unlocked.catch(() => {}) // mikrofon açılamazsa beklenmez; işlenmemiş ret kalmasın
      setKayitSession()
      const mic = startPitchStream((s) => {
        // Örnek ses saatiyle damgalanır; analiz penceresi geriye baktığı için yarısı kadar önceye aittir.
        const t = sesSaatiSimdi()
        if (t === null) return
        ornekler.push({ t: t - ANALIZ_PENCERESI_S, hz: s.hz })
      }, dinleme.iptal.signal)
      const durdurucu = await mic.then(
        (d) => d,
        (err: unknown) => {
          if (run === runRef.current) setWarn(micHataMetni(err))
          return null
        },
      )
      if (!durdurucu) return
      if (dinlemeRef.current !== dinleme) {
        durdurucu() // açılırken durduruldu
        return
      }
      dinleme.durdurucu = durdurucu
      await unlocked
      if (run !== runRef.current) return
      const calan = playCode(kod.code, kod.durationMs)
      turRef.current = { run, tempo, girisVurus: kod.girisVurus, olcu: kesik, bas }
      await calan
      if (run !== runRef.current) return
      dinlemeyiBitir()
      const t0 = sonIsaret()
      if (t0 === null) {
        setWarn({ metin: SES_BASLAMADI })
        return
      }
      setSonuc(degerlendir(beklenenNotalar(dilim, bas, tuning, tempo, t0, kod.girisVurus), ornekler, tuning))
    } catch {
      if (run === runRef.current) setWarn({ metin: SOUND_WARNING })
    } finally {
      if (dinlemeRef.current === dinleme) dinlemeyiBitir()
      if (turRef.current?.run === run) turRef.current = null
      if (run === runRef.current) {
        setPlaying(false)
        releaseWakeLock()
      }
    }
  }

  function stop() {
    runRef.current++
    turRef.current = null
    dinlemeyiBitir()
    stopAudio()
    releaseWakeLock()
    setPlaying(false)
  }

  return (
    <>
      <ScoreView
        olcu={olcu}
        soz={soz}
        olcuPerSatir={olcuPerSatir}
        beamBeats={beamBeats}
        secim={secim}
        onSatirDokun={(satir) => {
          setSecim(secimGuncelle(secim, satir))
          setSonuc(null)
          if (playing) stop()
        }}
        vurgu={vurgu}
        sonuclar={sonuc?.notalar ?? null}
      />
      {/* Yapışkan çalma çubuğu: nota uzunken de bölüm ve çalma düğmeleri ekranın altında elde kalır. */}
      <div class="calisma-cubugu" ref={cubukRef}>
        {secim && (
          <div class="calisma-bolum">
            <span>{bolumEtiketi(secim)}</span>
            <button
              type="button"
              class="tool"
              onClick={() => {
                setSecim(null)
                setSonuc(null)
                if (playing) stop()
              }}
            >
              Tümü
            </button>
          </div>
        )}
        <div class="calisma-dugmeler">
          {playing ? (
            <button type="button" class="primary" onClick={stop}>
              ⏹ Durdur
            </button>
          ) : (
            <>
              <button type="button" class="primary" disabled={!settings} onClick={() => void calis(true)}>
                ▶ Dinle
              </button>
              <button type="button" class="tool" disabled={!settings} onClick={() => void calis(false)}>
                {usul ? '🥁 Usulle çal' : '🎵 Metronomla çal'}
              </button>
              {takip && (
                <button type="button" class="tool" disabled={!settings} onClick={() => void takipEt()}>
                  🎤 Çal, dinlesin
                </button>
              )}
            </>
          )}
          {playing && dinliyor && (
            <span class="muted" role="status">
              🎤 Dinliyorum…
            </span>
          )}
          {playing && tekrar && !dinliyor && (
            <span class="muted" role="status">
              {`Tur ${turNo} · ♩ = ${bpm}`}
            </span>
          )}
        </div>
        {warn && (
          <p class="notice" role="status">
            {warn.metin}
          </p>
        )}
        {warn?.detay && <p class="mic-error-detail">Ayrıntı: {warn.detay}</p>}
      </div>
      {sonuc && <TakipOzetKutusu ozet={takipOzeti(sonuc, olcu)} onTemizle={() => setSonuc(null)} />}
      <p class="muted">{IPUCU}</p>
      {takip && <p class="muted">{TAKIP_NOTU}</p>}

      <label class="usul-speed">
        <span>{`Hız: ♩ = ${bpm}`}</span>
        <input
          type="range"
          min={bpmMin}
          max={bpmMax}
          step={1}
          value={bpm}
          onInput={(e) => setBpm(Number(e.currentTarget.value))}
          // Bırakınca: çalıyorsa durur, yeni hızla yeniden başlatılır.
          onChange={(e) => {
            setBpm(Number(e.currentTarget.value))
            if (playing) stop()
          }}
        />
      </label>

      <label class="toggle">
        <input
          type="checkbox"
          checked={eslik}
          onChange={(e) => {
            setEslik(e.currentTarget.checked)
            if (playing) stop()
          }}
        />
        {usul ? ` 🥁 Usul eşliği (${usul.name})` : ' 🥁 Metronom'}
      </label>
      {eslik && usul?.vurus === null && <p class="muted">{METRONOME_NOTE}</p>}

      {/* Tekrar ve hızlanma çalarken değişebilir; durdurmaz, tur sonunda okunur. */}
      <label class="toggle">
        <input
          type="checkbox"
          checked={tekrar}
          onChange={(e) => {
            tekrarRef.current = e.currentTarget.checked
            setTekrar(e.currentTarget.checked)
          }}
        />
        {' 🔁 Tekrarla'}
      </label>
      {tekrar && (
        <label class="toggle">
          <input
            type="checkbox"
            checked={hizlan}
            onChange={(e) => {
              hizlanRef.current = e.currentTarget.checked
              setHizlan(e.currentTarget.checked)
            }}
          />
          {` ⏫ Her turda hızlan (♩ +${HIZ_ADIMI})`}
        </label>
      )}

    </>
  )
}

/** Takip özeti: çubuğun altında, akışta. */
function TakipOzetKutusu(props: { ozet: ReturnType<typeof takipOzeti>; onTemizle: () => void }): JSX.Element {
  const { ozet, onTemizle } = props
  return (
    <div class="takip-ozet" role="status">
      <p class="takip-ozet-baslik">{ozet.baslik}</p>
      {ozet.satirlar.map((s) => (
        <p key={s}>{s}</p>
      ))}
      <p class="muted takip-tani">{ozet.tani}</p>
      <button type="button" class="tool" onClick={onTemizle}>
        Sonucu temizle
      </button>
    </div>
  )
}
