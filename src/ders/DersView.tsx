import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks'
import { playWritten, stopAudio, unlockAudio } from '../audio/player'
import { NEY_PERDELER, visibleFingering } from '../content/ney-perdeler'
import { SOUND_OFF, SOUND_WARNING } from '../content/ses-mesajlari'
import type { Ders, DersBlok } from '../content/dersler/types'
import type { MusicEvent } from '../music/notation'
import { FingeringDiagram } from '../ney/Fingering'
import { Staff } from '../notation/Staff'
import { DEFAULT_SETTINGS, getSettings, isaretEkle } from '../store/db'
import type { Settings } from '../store/db'
import { Gorsel } from './Gorseller'

const STAFF_WIDTH = 320
const VARSAYILAN_BPM = 60
/** Ders portelerindeki örnekler 4/4'tür: bir dörtlük içindeki sekizlikler kirişlenir. */
const DERS_VURUS = 1

function sesliMi(olaylar: MusicEvent[]): boolean {
  return olaylar.some((e) => e.kind === 'note')
}

/**
 * Tek ders sayfası: kısa anlatım, görseller, "▶ Dinle" örnekleri, "Kendin dene" kutusu ve en sonda
 * "Anladım, alıştırmaya geç". Hem ders kapısında hem `/ders/:id` rotasında aynı görünür.
 * `geri` yalnız rota kipinde verilir (kapıda ders, alıştırmanın önünde durur).
 */
export function DersView(props: { ders: Ders; onDone: () => void; geri?: { href: string; label: string } }) {
  const { ders, onDone, geri } = props
  const [settings, setSettings] = useState<Settings | null>(null)
  const [uyari, setUyari] = useState<{ blok: number; mesaj: string } | null>(null)

  useEffect(() => {
    let alive = true
    getSettings()
      .catch(() => DEFAULT_SETTINGS) // ayarlar okunamazsa varsayılanlarla çalınır; Dinle sessizce kilitli kalmaz
      .then((cfg) => {
        if (alive) setSettings(cfg)
      })
    return () => {
      alive = false
    }
  }, [])

  // Sayfadan çıkınca çalan ses susar; bekleyen unlockAudio çıkıştan sonra çalmasın. Preact edilgen (useEffect)
  // temizliklerini çizimden sonraya erteler; bu yüzden geçersiz kılma eşzamanlı çalışan useLayoutEffect'tedir.
  const runRef = useRef(0)
  useLayoutEffect(
    () => () => {
      runRef.current++
      stopAudio()
    },
    [],
  )

  async function dinle(blok: number, olaylar: MusicEvent[], bpm: number) {
    if (!settings) return
    setUyari(null)
    if (!settings.soundOn) {
      setUyari({ blok, mesaj: SOUND_OFF })
      return
    }
    const run = ++runRef.current
    try {
      // unlockAudio dokunuş işleyicisinde, ilk iş olarak çağrılmalıdır (iOS).
      await unlockAudio()
      if (run !== runRef.current) return
      await playWritten(olaylar, settings.tuning, bpm)
    } catch {
      if (run === runRef.current) setUyari({ blok, mesaj: SOUND_WARNING })
    }
  }

  async function bitir() {
    try {
      await isaretEkle('okunanDersler', ders.id)
    } catch {
      // Kayıt yazılamasa da kullanıcı alıştırmaya geçebilmeli.
    }
    onDone()
  }

  function dinleDugmesi(blok: number, olaylar: MusicEvent[], bpm: number) {
    return (
      <>
        <div class="tools">
          <button type="button" class="tool" disabled={!settings} onClick={() => void dinle(blok, olaylar, bpm)}>
            ▶ Dinle
          </button>
        </div>
        {uyari?.blok === blok && (
          <p class="notice" role="status">
            {uyari.mesaj}
          </p>
        )}
      </>
    )
  }

  function blokCiz(b: DersBlok, i: number) {
    switch (b.tur) {
      case 'metin':
        return <p key={i}>{b.metin}</p>
      case 'liste':
        return (
          <ul key={i} class="ders-liste">
            {b.maddeler.map((m, j) => (
              <li key={j}>{m}</li>
            ))}
          </ul>
        )
      case 'porte': {
        // Röprizli bölüm iki kez çalınır.
        const calinan = b.ropriz ? [...b.olaylar, ...b.olaylar] : b.olaylar
        return (
          <figure key={i} class="ders-figur">
            <div class="staff-wrap">
              <Staff
                events={b.olaylar}
                width={STAFF_WIDTH}
                beamBeats={DERS_VURUS}
                barlinesAfter={b.olcuCizgileri}
                ropriz={b.ropriz ? { bas: true, son: true } : undefined}
              />
            </div>
            {b.aciklama && <figcaption class="muted">{b.aciklama}</figcaption>}
            {sesliMi(b.olaylar) && dinleDugmesi(i, calinan, b.bpm ?? VARSAYILAN_BPM)}
          </figure>
        )
      }
      case 'parmak': {
        const perde = NEY_PERDELER.find((p) => p.id === b.perdeId)
        const fingering = perde ? visibleFingering(perde) : null
        return (
          <figure key={i} class="ders-figur">
            {fingering && (
              <div class="ders-parmak">
                <FingeringDiagram fingering={fingering} />
              </div>
            )}
            {b.aciklama && <figcaption class="muted">{b.aciklama}</figcaption>}
            {perde && dinleDugmesi(i, [{ kind: 'note', pitch: perde.written, dur: 'half' }], VARSAYILAN_BPM)}
          </figure>
        )
      }
      case 'gorsel':
        return (
          <figure key={i} class="ders-figur">
            <Gorsel ad={b.ad} />
            {b.aciklama && <figcaption class="muted">{b.aciklama}</figcaption>}
          </figure>
        )
      case 'dene':
        return (
          <section key={i} class="ders-dene" aria-labelledby={`dene-${i}`}>
            <h2 id={`dene-${i}`}>Kendin dene</h2>
            <ol>
              {b.adimlar.map((a, j) => (
                <li key={j}>{a}</li>
              ))}
            </ol>
          </section>
        )
    }
  }

  return (
    <main class="screen ders">
      <h1>📖 {ders.baslik}</h1>
      {ders.bloklar.map(blokCiz)}
      {ders.kaynaklar.length > 0 && <p class="ders-kaynak">{`Kaynak: ${ders.kaynaklar.join(' · ')}`}</p>}
      <button type="button" class="primary" onClick={() => void bitir()}>
        Anladım, alıştırmaya geç
      </button>
      {geri && (
        <div class="links">
          <a class="back" href={geri.href}>
            {geri.label}
          </a>
        </div>
      )}
    </main>
  )
}
