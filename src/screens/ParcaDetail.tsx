import { PARCALAR } from '../content/parcalar'
import { USULLER } from '../content/usuller'
import { DersKapisi } from '../ders/DersKapisi'
import { beamBeatsFor } from '../notation/beams'
import { ScoreView } from '../notation/ScoreView'
import { CalismaPaneli } from './CalismaPaneli'
import { makamAdi, makamSayfasiVar, usulAdi } from './ParcalarSection'

/** SymbTr deposunun sayfası; ham TSV bağlantısı (`piece.source`) kaynak olarak veri dosyasında kalır. */
const SYMBTR_URL = 'https://github.com/MTG/SymbTr'
/** neyzen.com notalarından elle yazılan parçaların kaynağı bu adresle başlar. */
const NEYZEN_ONEK = 'https://www.neyzen.com/'
const BPM_MIN = 40
const BPM_MAX = 100
const BPM_DEFAULT = 60
/** Usulü `USULLER`'de bulunmayan parça: neden çalınamadığı. */
const USUL_YOK = 'Bu parçanın usulü tanımlı olmadığı için çalınamıyor.'

/** Tek parça: başlık bilgileri, çalışma paneli (nota, bölüm seçimi, hız, usul eşliği, tekrar ve hızlanma) ve kaynak. */
export function ParcaDetail({ parcaId }: { parcaId: string }) {
  const parca = PARCALAR.find((p) => p.id === parcaId)
  if (!parca) {
    return (
      <main class="screen">
        <p class="muted">Parça bulunamadı.</p>
        <a class="back" href="#/parcalar">
          Parçalar bölümüne dön
        </a>
      </main>
    )
  }
  const piece = parca
  const usul = USULLER.find((u) => u.id === piece.usul)

  return (
    <DersKapisi dersId="eser:giris" geri={{ href: '#/parcalar', label: 'Parçalara dön' }}>
      <main class="screen">
        <h1>🎧 {piece.title}</h1>
        <dl class="makam-info">
          <div>
            <dt>Makam</dt>
            <dd>
              {makamSayfasiVar(piece) ? <a href={`#/makam/${piece.makam}`}>{makamAdi(piece)}</a> : makamAdi(piece)}
            </dd>
          </div>
          <div>
            <dt>Usul</dt>
            <dd>
              <a href="#/usul">{usulAdi(piece)}</a>
              {usul && <small class="muted">{` ${usul.zaman}/${usul.mertebe}`}</small>}
            </dd>
          </div>
          <div>
            <dt>Besteci</dt>
            <dd>{piece.composer}</dd>
          </div>
          {piece.lyricist && (
            <div>
              <dt>Güfte</dt>
              <dd>{piece.lyricist}</dd>
            </div>
          )}
        </dl>

        {usul ? (
          <CalismaPaneli
            olcu={piece.olcu}
            soz={piece.soz}
            usul={usul}
            varsayilanBpm={BPM_DEFAULT}
            bpmMin={BPM_MIN}
            bpmMax={BPM_MAX}
            beamBeats={beamBeatsFor(usul)}
          />
        ) : (
          // Usulü bilinmeyen parça sessizce 4/4 metronomla çalınmaz: nota gösterilir, çalım yerine nedeni yazılır.
          <>
            <ScoreView olcu={piece.olcu} soz={piece.soz} beamBeats={beamBeatsFor(usul)} />
            <p class="notice" role="status">
              {USUL_YOK}
            </p>
          </>
        )}

        {piece.source.startsWith(NEYZEN_ONEK) ? (
          <p class="muted">
            Nota:{' '}
            <a href={piece.source} target="_blank" rel="noopener">
              neyzen.com
            </a>
            . Çarpmalar gösterilmez, tekrarlar açılmaz.
          </p>
        ) : (
          <p class="muted">
            Nota: <a href={SYMBTR_URL}>SymbTr</a> (Karaosmanoğlu 2012), CC BY-NC-SA 4.0.
          </p>
        )}
        <div class="links">
          <a class="back" href="#/parcalar">
            Parçalar bölümüne dön
          </a>
        </div>
      </main>
    </DersKapisi>
  )
}
