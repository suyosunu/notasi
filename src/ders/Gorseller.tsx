import type { ComponentChildren } from 'preact'
import type { GorselAdi } from '../content/dersler/types'

const INK = 'currentColor'
const SOLUK = 0.55

/** Tüm çizimler `width="100%"` ve `viewBox` ile ölçeklenir; telefonda yatay kaydırma olmaz. */
function Cerceve(props: { w: number; h: number; etiket: string; ad: GorselAdi; children: ComponentChildren }) {
  const { w, h, etiket, ad, children } = props
  return (
    <svg
      class="gorsel"
      data-gorsel={ad}
      role="img"
      aria-label={etiket}
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      style={{ maxWidth: `${w * 1.5}px`, display: 'block' }}
    >
      {children}
    </svg>
  )
}

// --- ney bölümleri ------------------------------------------------------

const NEY_X0 = 24
const NEY_X1 = 336
const NEY_Y = 70
const NEY_H = 20
/** Ön delik konumları (soldan, başpâreden uzaklaşan sırayla). */
const ON_DELIK_X = [150, 172, 194, 238, 260, 282]
/** Boğumlar (kamışın düğümleri). */
const BOGUMLAR = [105, 215, 305]

function NeyBolumleri() {
  return (
    <Cerceve
      w={360}
      h={150}
      ad="ney-bolumleri"
      etiket="Ney çizimi: soldan başpâre, parazvane, boğumlar, altı ön delik; arkada aşîrân deliği."
    >
      {/* gövde */}
      <rect x={NEY_X0} y={NEY_Y - NEY_H / 2} width={NEY_X1 - NEY_X0} height={NEY_H} rx={4} fill="none" stroke={INK} stroke-width={1.6} />
      {/* başpâre: üst uçtaki kalın parça */}
      <rect x={NEY_X0 - 8} y={NEY_Y - NEY_H / 2 - 3} width={22} height={NEY_H + 6} rx={4} fill={INK} fill-opacity={0.2} stroke={INK} stroke-width={1.6} />
      {/* parazvane: başpârenin hemen ardındaki kısa kısım */}
      <line x1={NEY_X0 + 30} x2={NEY_X0 + 30} y1={NEY_Y - NEY_H / 2} y2={NEY_Y + NEY_H / 2} stroke={INK} stroke-width={1.2} stroke-dasharray="2 2" />
      {/* boğumlar */}
      {BOGUMLAR.map((x) => (
        <line key={x} data-bogum="" x1={x} x2={x} y1={NEY_Y - NEY_H / 2 - 2} y2={NEY_Y + NEY_H / 2 + 2} stroke={INK} stroke-width={2.4} />
      ))}
      {/* ön delikler */}
      {ON_DELIK_X.map((x, i) => (
        <circle key={i} data-on-delik="" cx={x} cy={NEY_Y} r={5} fill="none" stroke={INK} stroke-width={1.6} />
      ))}
      {/* aşîrân deliği: arkada, kesikli */}
      <circle data-asiran="" cx={128} cy={NEY_Y} r={5} fill="none" stroke={INK} stroke-width={1.4} stroke-dasharray="3 2" stroke-opacity={SOLUK + 0.2} />

      {/* etiketler */}
      <text x={NEY_X0 + 3} y={26} font-size={12} text-anchor="middle" fill={INK}>
        Başpâre
      </text>
      <line x1={NEY_X0 + 3} x2={NEY_X0 + 3} y1={31} y2={NEY_Y - NEY_H / 2 - 5} stroke={INK} stroke-opacity={SOLUK} />
      <text x={NEY_X0 + 40} y={48} font-size={12} text-anchor="start" fill={INK}>
        Parazvane
      </text>
      <text x={BOGUMLAR[1]} y={26} font-size={12} text-anchor="middle" fill={INK}>
        Boğum
      </text>
      <line x1={BOGUMLAR[1]} x2={BOGUMLAR[1]} y1={31} y2={NEY_Y - NEY_H / 2 - 4} stroke={INK} stroke-opacity={SOLUK} />
      <text x={(ON_DELIK_X[0]! + ON_DELIK_X[5]!) / 2 + 6} y={118} font-size={12} text-anchor="middle" fill={INK}>
        Ön delikler (6)
      </text>
      <line x1={ON_DELIK_X[0]} x2={ON_DELIK_X[5]} y1={104} y2={104} stroke={INK} stroke-opacity={SOLUK} />
      <text x={110} y={140} font-size={12} text-anchor="middle" fill={INK}>
        Aşîrân deliği (arkada)
      </text>
      <line x1={128} x2={128} y1={NEY_Y + 9} y2={128} stroke={INK} stroke-opacity={SOLUK} stroke-dasharray="3 2" />
    </Cerceve>
  )
}

// --- el yerleşimi -------------------------------------------------------

/**
 * Delik→parmak eşlemesi `ney-perdeler.ts` başındaki yorumdandır: sağ el üstte, sağ başparmak arkadaki
 * aşîrân deliğinde; 1–3. delikler sağ elin işaret/orta/yüzük, 4–6. delikler sol elin işaret/orta/yüzük parmağı.
 */
export const EL_YERLESIMI: { delik: string; parmak: string }[] = [
  { delik: 'Aşîrân (arka)', parmak: 'sağ başparmak' },
  { delik: '1. delik', parmak: 'sağ işaret' },
  { delik: '2. delik', parmak: 'sağ orta' },
  { delik: '3. delik', parmak: 'sağ yüzük' },
  { delik: '4. delik', parmak: 'sol işaret' },
  { delik: '5. delik', parmak: 'sol orta' },
  { delik: '6. delik', parmak: 'sol yüzük' },
]
const EL_Y = [28, 66, 92, 118, 162, 188, 214]

function ElYerlesimi() {
  return (
    <Cerceve
      w={300}
      h={250}
      ad="el-yerlesimi"
      etiket="El yerleşimi: üstte sağ el (başparmak arkadaki aşîrân deliğinde, sonra işaret, orta, yüzük parmağı), altta sol el (işaret, orta, yüzük parmağı)."
    >
      <rect x={52} y={6} width={26} height={238} rx={13} fill="none" stroke={INK} stroke-opacity={0.35} stroke-width={1.2} />
      {EL_YERLESIMI.map((d, i) => (
        <g key={d.delik} data-delik={d.delik}>
          <circle
            cx={65}
            cy={EL_Y[i]}
            r={8}
            fill="none"
            stroke={INK}
            stroke-width={1.6}
            stroke-dasharray={i === 0 ? '3 2' : undefined}
          />
          <text x={92} y={EL_Y[i]! + 4} font-size={13} fill={INK}>
            {`${d.delik} · ${d.parmak}`}
          </text>
        </g>
      ))}
      <text x={10} y={14} font-size={11} fill={INK} fill-opacity={SOLUK}>
        sağ el
      </text>
      <text x={10} y={150} font-size={11} fill={INK} fill-opacity={SOLUK}>
        sol el
      </text>
      <line x1={10} x2={290} y1={(EL_Y[3]! + EL_Y[4]!) / 2} y2={(EL_Y[3]! + EL_Y[4]!) / 2} stroke={INK} stroke-opacity={0.25} stroke-dasharray="2 3" />
    </Cerceve>
  )
}

// --- 4-4-4 nefes --------------------------------------------------------

const NEFES: { ad: string; sayi: string }[] = [
  { ad: 'Al', sayi: '4' },
  { ad: 'Tut', sayi: '4' },
  { ad: 'Ver', sayi: '4' },
]

function Nefes444() {
  const kutuW = 100
  return (
    <Cerceve w={330} h={80} ad="nefes-444" etiket="Nefes çalışması: 4 saniye nefes al, 4 saniye tut, 4 saniye ver.">
      {NEFES.map((b, i) => (
        <g key={b.ad} data-bolme={b.ad}>
          <rect
            x={5 + i * (kutuW + 10)}
            y={10}
            width={kutuW}
            height={60}
            rx={10}
            fill={INK}
            fill-opacity={0.06 + i * 0.06}
            stroke={INK}
            stroke-width={1.4}
          />
          <text x={5 + i * (kutuW + 10) + kutuW / 2} y={46} font-size={20} font-weight={600} text-anchor="middle" fill={INK}>
            {`${b.ad} ${b.sayi}`}
          </text>
        </g>
      ))}
    </Cerceve>
  )
}

/** Derslerde kullanılan üç çizim. */
export function Gorsel(props: { ad: GorselAdi }) {
  switch (props.ad) {
    case 'ney-bolumleri':
      return <NeyBolumleri />
    case 'el-yerlesimi':
      return <ElYerlesimi />
    case 'nefes-444':
      return <Nefes444 />
  }
}
