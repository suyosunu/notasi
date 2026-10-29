import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { playCode, stopAudio, unlockAudio } from '../audio/player'
import { buildVurmaCode } from '../audio/usul'
import { acquireWakeLock, releaseWakeLock } from '../audio/wakeLock'
import { usulDersleri } from '../content/dersler'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import { USULLER } from '../content/usuller'
import type { Usul } from '../content/usuller'
import { DersKapisi } from '../ders/DersKapisi'
import {
  VURMA_OLCU,
  VURMA_TOLERANS_MS,
  beklenenVuruslar,
  degerlendir,
  vurusSirasi,
} from '../learning/usul-vurma'
import type { Dokunus, VurmaSonucu, VurmaTuru } from '../learning/usul-vurma'
import { VurusDiagram } from '../notation/VurusDiagram'
import { DEFAULT_SETTINGS, getSettings, isaretEkle } from '../store/db'
import type { Settings } from '../store/db'

const BPM_MIN = 40
const BPM_MAX = 90
const BPM_DEFAULT = 60
/**
 * Gecikme payı (ms; UsulSection'daki HIGHLIGHT_LATENCY_MS ile aynı): Strudel desenleri ~0.1 sn ileriden planlar, yani
 * ilk ses `onStart`'tan yaklaşık bu kadar sonra duyulur. Sabittir; cihazdan kalan fark ortalama sapma olarak görünür
 * (cihaza göre kalibrasyon ertelendi).
 */
const GECIKME_PAYI_MS = 100
/** Bu kadar (ms) erken ya da geç ortalama sapmada kullanıcı uyarılır. */
const SAPMA_UYARI_MS = 60
const ONAY_NOTU = 'Usul sesini kapatıp yalnız metronomla geçersen sayılır.'

/** `/usul/vur/:id`: usulün dersleri okunduktan sonra vurma alıştırması. Bilinmeyen ya da vuruşsuz usulde bulunamadı. */
export function UsulVurma({ usulId }: { usulId: string }) {
  const usul = USULLER.find((u) => u.id === usulId)
  if (!usul || usul.vurus === null) {
    return (
      <main class="screen">
        <h1>Usul bulunamadı</h1>
        <p class="muted">Bu usul yok ya da vuruş kalıbı bilinmiyor.</p>
        <a class="back" href="#/usul">
          Usul bölümüne dön
        </a>
      </main>
    )
  }
  return (
    <DersKapisi dersId={usulDersleri(usul.id)} geri={{ href: '#/usul', label: 'Usul bölümüne dön' }}>
      <main class="screen">
        <VurmaCalisma usul={usul} />
        <div class="links">
          <a class="back" href="#/usul">
            Usul bölümüne dön
          </a>
        </div>
      </main>
    </DersKapisi>
  )
}

/** Çalan alıştırmanın saati: ilk vuruşun (giriş ölçüsünden sonra) duyulduğu an, performance.now() cinsinden. */
interface Saat {
  sifir: number
  bpm: number
}

/** Saat varken her karede o anki vuruşun sırasını hesaplar (giriş ölçüsünde ve sonrasında vurgu yok). */
function useAktifVurus(usul: Usul, saat: Saat | null): number | null {
  const [aktif, setAktif] = useState<number | null>(null)
  useEffect(() => {
    if (!saat) {
      setAktif(null)
      return
    }
    let raf = 0
    let alive = true
    const tick = () => {
      if (!alive) return
      setAktif(vurusSirasi(usul, saat.bpm, performance.now() - saat.sifir))
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => {
      alive = false
      cancelAnimationFrame(raf)
      setAktif(null)
    }
  }, [usul, saat])
  return aktif
}

function VurmaCalisma({ usul }: { usul: Usul }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [bpm, setBpm] = useState(BPM_DEFAULT)
  const [usulSesi, setUsulSesi] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [warn, setWarn] = useState<string | null>(null)
  const [sonuc, setSonuc] = useState<{ s: VurmaSonucu; usulSesi: boolean } | null>(null)
  const [saat, setSaat] = useState<Saat | null>(null)
  const aktif = useAktifVurus(usul, saat)
  /** Her başlatma/durdurmada artar: yalnızca son çalmanın sonucu ekranı değiştirir ve kaydedilir. */
  const runRef = useRef(0)
  /** Çalan alıştırmanın ilk vuruş anı (dokunuş zamanının sıfırı); çalmıyorsa null ve dokunuşlar atılır. */
  const sifirRef = useRef<number | null>(null)
  const dokunuslarRef = useRef<Dokunus[]>([])

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

  // Sayfadan çıkınca ses susar, bekleyen unlockAudio çıkıştan sonra çalmaz ve sonuç yazılmaz. Geçersiz kılma
  // eşzamanlı çalışsın diye useLayoutEffect'tedir (EtutCalisma ile aynı).
  useLayoutEffect(
    () => () => {
      runRef.current++
      sifirRef.current = null
      stopAudio()
      releaseWakeLock()
    },
    [],
  )

  /** Dokunuş işleyicisinden çağrılır: unlockAudio eşzamanlı, kod üretiminden önce başlatılır (iOS). */
  async function basla() {
    if (!settings) return
    const run = ++runRef.current
    sifirRef.current = null
    dokunuslarRef.current = []
    setWarn(null)
    setSonuc(null)
    setSaat(null)
    if (!settings.soundOn) {
      setWarn(SOUND_OFF)
      return
    }
    const hiz = bpm
    const sesli = usulSesi
    setPlaying(true)
    void acquireWakeLock() // alıştırma sürerken ekran kararmasın
    let basladi = false
    try {
      const unlocked = unlockAudio()
      unlocked.catch(() => {}) // kod üretimi fırlatırsa işlenmemiş ret kalmasın; hata aşağıda await ile yakalanır
      const { code, durationMs, girisMs } = buildVurmaCode(usul, hiz, { usulSesi: sesli, olcuSayisi: VURMA_OLCU })
      await unlocked
      if (run !== runRef.current) return
      await playCode(code, durationMs, () => {
        if (run !== runRef.current) return
        basladi = true
        const sifir = performance.now() + GECIKME_PAYI_MS + girisMs
        sifirRef.current = sifir
        setSaat({ sifir, bpm: hiz })
      })
      if (run !== runRef.current || !basladi) return
      const s = degerlendir(beklenenVuruslar(usul, hiz, VURMA_OLCU), dokunuslarRef.current)
      setSonuc({ s, usulSesi: sesli })
      if (s.gecti && !sesli) {
        // Kayıt yazılamasa da sonuç gösterilir.
        isaretEkle('vurulanUsuller', usul.id).catch(() => {})
      }
    } catch {
      if (run === runRef.current) setWarn(SOUND_WARNING)
    } finally {
      if (run === runRef.current) {
        sifirRef.current = null
        setSaat(null)
        setPlaying(false)
        releaseWakeLock()
      }
    }
  }

  function durdur() {
    runRef.current++
    sifirRef.current = null
    stopAudio()
    releaseWakeLock()
    setSaat(null)
    setPlaying(false)
  }

  /** Yalnız onPointerDown'dan: bir dokunuş bir kez sayılır (click dinlenmez). */
  function dokun(tur: VurmaTuru) {
    const sifir = sifirRef.current
    if (sifir === null) return
    const t = performance.now() - sifir
    // Giriş ölçüsündeki dokunuşlar atılır; ilk vuruşa tolerans içinde erken dokunuş sayılır.
    if (t < -VURMA_TOLERANS_MS) return
    dokunuslarRef.current.push({ t, tur })
  }

  return (
    <>
      <h1>{`👏 ${usul.name} · ${usul.zaman}/${usul.mertebe}`}</h1>
      <p class="muted">
        Önce bir ölçü metronom sayar. Sonra {VURMA_OLCU} ölçü boyunca düm'de Düm'e, tek'te Tek'e dokun (te ve ke de
        Tek'tir).
      </p>
      <VurusDiagram usul={usul} active={aktif} />

      <label class="usul-speed">
        <span>{`Hız: ${usul.mertebe === 8 ? '♪' : '♩'} = ${bpm}`}</span>
        <input
          type="range"
          min={BPM_MIN}
          max={BPM_MAX}
          step={1}
          value={bpm}
          onInput={(e) => setBpm(Number(e.currentTarget.value))}
          // Bırakınca: çalıyorsa durur (yarım alıştırma yeni hızla değerlendirilmez).
          onChange={(e) => {
            setBpm(Number(e.currentTarget.value))
            if (playing) durdur()
          }}
        />
      </label>

      <label class="toggle">
        <input
          type="checkbox"
          checked={usulSesi}
          onChange={(e) => {
            setUsulSesi(e.currentTarget.checked)
            if (playing) durdur()
          }}
        />
        {' 🥁 Usul sesiyle (öğrenirken)'}
      </label>

      <div class="tools">
        {playing ? (
          <button type="button" class="primary" onClick={durdur}>
            ⏹ Durdur
          </button>
        ) : (
          <button type="button" class="primary" disabled={!settings} onClick={() => void basla()}>
            ▶ Başla
          </button>
        )}
      </div>

      <div class="vurma-pad">
        <button type="button" class="vurma-btn vurma-dum" onPointerDown={() => dokun('düm')}>
          Düm
        </button>
        <button type="button" class="vurma-btn vurma-tek" onPointerDown={() => dokun('tek')}>
          Tek
        </button>
      </div>

      {warn && (
        <p class="notice" role="status">
          {warn}
        </p>
      )}
      {sonuc && <SonucKutusu s={sonuc.s} usulSesi={sonuc.usulSesi} />}
    </>
  )
}

/** Doğru vuruşların ortalama sapması, ms'ye yuvarlanmış: "Ortalama: 45 ms geç" / "… erken" / "tam zamanında". */
function ortalamaMetni(sapma: number): string {
  const ms = Math.round(Math.abs(sapma))
  if (ms === 0) return 'Ortalama: tam zamanında'
  return `Ortalama: ${ms} ms ${sapma < 0 ? 'erken' : 'geç'}`
}

function SonucKutusu({ s, usulSesi }: { s: VurmaSonucu; usulSesi: boolean }) {
  const sapma = s.ortalamaSapma
  return (
    <div class="result" role="status">
      <p>{`${s.isabet}/${s.toplam} vuruş doğru`}</p>
      <p class="muted">{`Kaçan: ${s.kacan} · Yanlış: ${s.yanlisTur} · Fazla: ${s.fazla}`}</p>
      {sapma !== null && Math.abs(sapma) > SAPMA_UYARI_MS && (
        <p>{sapma < 0 ? 'Biraz erken vuruyorsun' : 'Biraz geç vuruyorsun'}</p>
      )}
      {sapma !== null && <p class="muted">{ortalamaMetni(sapma)}</p>}
      <p class={s.gecti ? 'result-ok' : 'result-bad'}>{s.gecti ? '✓ Geçtin' : 'Bir daha dene'}</p>
      {s.gecti && usulSesi && <p class="hint">{ONAY_NOTU}</p>}
    </div>
  )
}
