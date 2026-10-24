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

const NEY_Y = 72
const NEY_H = 18
const NEY_UST = NEY_Y - NEY_H / 2
const NEY_ALT = NEY_Y + NEY_H / 2
const NEY_X0 = 32
const NEY_X1 = 288
/** Parazvane: kamışın iki ucundaki dolu halkalar (üstteki başpârenin hemen altında). */
const HALKA_W = 7
const PARAZVANE_X = [NEY_X0, NEY_X1 - HALKA_W]
/** Boğumlar kamışın boyunca eşit aralıklıdır; kenarlarda ince çentik olarak çizilir. */
const BOGUMLAR = [52, 84, 116, 148, 180, 212, 244, 268]
/** Ön delikler: ilk üç ve son üç arasında küçük bir boşluk vardır. */
const ON_DELIK_X = [124, 146, 168, 202, 224, 246]
/** Aşîrân deliği arkadadır (kesik çizgi yalnız bunu gösterir); 1. deliğin hizasına yakın durur. */
const ASIRAN_X = 106

function NeyBolumleri() {
  return (
    <Cerceve
      w={300}
      h={150}
      ad="ney-bolumleri"
      etiket="Ney çizimi: üstte başpâre, kamışın iki ucunda parazvane halkaları, gövde boyunca boğumlar, altı ön delik; arkada aşîrân deliği."
    >
      {/* gövde */}
      <rect x={NEY_X0} y={NEY_UST} width={NEY_X1 - NEY_X0} height={NEY_H} rx={3} fill="none" stroke={INK} stroke-width={1.6} />
      {/* başpâre: üst uçtaki kalın parça */}
      <rect data-baspare="" x={NEY_X0 - 22} y={NEY_UST - 3} width={22} height={NEY_H + 6} rx={4} fill={INK} fill-opacity={0.2} stroke={INK} stroke-width={1.6} />
      {/* parazvane: iki uçtaki dolu halkalar */}
      {PARAZVANE_X.map((x) => (
        <rect key={x} data-parazvane="" x={x} y={NEY_UST - 2} width={HALKA_W} height={NEY_H + 4} fill={INK} />
      ))}
      {/* boğumlar: kenarlarda çentik */}
      {BOGUMLAR.map((x) => (
        <g key={x} data-bogum="" stroke={INK} stroke-width={1.3}>
          <line x1={x} x2={x} y1={NEY_UST - 3} y2={NEY_UST + 4} />
          <line x1={x} x2={x} y1={NEY_ALT - 4} y2={NEY_ALT + 3} />
        </g>
      ))}
      {/* ön delikler */}
      {ON_DELIK_X.map((x, i) => (
        <circle key={i} data-on-delik="" cx={x} cy={NEY_Y} r={4.5} fill="none" stroke={INK} stroke-width={1.6} />
      ))}
      {/* aşîrân deliği: arkada, kesik çizgi */}
      <circle data-asiran="" cx={ASIRAN_X} cy={NEY_Y} r={4.5} fill="none" stroke={INK} stroke-width={1.5} stroke-dasharray="3 2" />

      {/* etiketler ve gösterme çizgileri (düz çizgi) */}
      <text x={NEY_X0 - 22} y={16} font-size={12} fill={INK}>
        Başpâre
      </text>
      <line x1={NEY_X0 - 11} x2={NEY_X0 - 11} y1={21} y2={NEY_UST - 5} stroke={INK} stroke-opacity={SOLUK} />
      <text x={64} y={40} font-size={12} fill={INK}>
        Parazvane (iki uçta)
      </text>
      <line x1={62} x2={NEY_X0 + HALKA_W / 2} y1={44} y2={NEY_UST - 3} stroke={INK} stroke-opacity={SOLUK} />
      <text x={212} y={16} font-size={12} text-anchor="middle" fill={INK}>
        Boğumlar
      </text>
      <line x1={212} x2={212} y1={21} y2={NEY_UST - 5} stroke={INK} stroke-opacity={SOLUK} />
      <line x1={ON_DELIK_X[0]} x2={ON_DELIK_X[5]} y1={98} y2={98} stroke={INK} stroke-opacity={SOLUK} />
      <text x={(ON_DELIK_X[0]! + ON_DELIK_X[5]!) / 2} y={114} font-size={12} text-anchor="middle" fill={INK}>
        Ön delikler (6)
      </text>
      <text x={ASIRAN_X} y={140} font-size={12} text-anchor="middle" fill={INK}>
        Aşîrân deliği (arkada)
      </text>
      <line x1={ASIRAN_X} x2={ASIRAN_X} y1={NEY_Y + 7} y2={129} stroke={INK} stroke-opacity={SOLUK} />
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
