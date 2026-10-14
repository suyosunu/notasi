const LIMIT_CENTS = 50
const MAX_ANGLE = 60
const CX = 100
const CY = 104
const R = 80
const IN_TUNE_CENTS = 5

/** İbre açısı (derece): −50 sent en solda, +50 sent en sağda; dışı sınıra yapışır. */
export function gaugeAngle(cents: number): number {
  const c = Math.max(-LIMIT_CENTS, Math.min(LIMIT_CENTS, cents))
  return (c / LIMIT_CENTS) * MAX_ANGLE
}

function point(angleDeg: number, r: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)]
}

function arc(fromDeg: number, toDeg: number, r: number): string {
  const [x1, y1] = point(fromDeg, r)
  const [x2, y2] = point(toDeg, r)
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
}

function ariaText(cents: number | null): string {
  if (cents === null) return 'Akort: ses yok'
  const n = Math.round(Math.abs(cents))
  if (Math.abs(cents) < IN_TUNE_CENTS) return 'Akort: tam'
  return `Akort: ${n} sent ${cents > 0 ? 'tiz' : 'pes'}`
}

/** Akort göstergesi: sapma ±50 sentle sınırlanır; ses yokken ibre gizlenir. */
export function TunerGauge(props: { cents: number | null; toleranceCents?: number }) {
  const { cents, toleranceCents } = props
  const band = toleranceCents !== undefined ? gaugeAngle(toleranceCents) : null
  const angle = cents === null ? null : gaugeAngle(cents)
  const inBand = cents !== null && toleranceCents !== undefined && Math.abs(cents) <= toleranceCents
  return (
    <svg class="tuner" role="img" aria-label={ariaText(cents)} viewBox="0 0 200 124" width="100%">
      <path d={arc(-MAX_ANGLE, MAX_ANGLE, R)} fill="none" stroke="currentColor" stroke-opacity={0.25} stroke-width={10} />
      {band !== null && (
        <path d={arc(-band, band, R)} fill="none" stroke="#4b8f3f" stroke-opacity={0.6} stroke-width={10} />
      )}
      <line x1={CX} y1={CY - R - 8} x2={CX} y2={CY - R + 8} stroke="currentColor" stroke-width={2} />
      <text x={point(-MAX_ANGLE, R)[0] - 4} y={CY - 18} font-size={14} text-anchor="end" fill="currentColor">
        pes
      </text>
      <text x={CX} y={CY - R - 12} font-size={14} text-anchor="middle" fill="currentColor">
        tam
      </text>
      <text x={point(MAX_ANGLE, R)[0] + 4} y={CY - 18} font-size={14} text-anchor="start" fill="currentColor">
        tiz
      </text>
      {angle !== null && (
        <line
          data-testid="needle"
          x1={CX}
          y1={CY}
          x2={point(angle, R - 6)[0]}
          y2={point(angle, R - 6)[1]}
          stroke={inBand ? '#2f6b25' : '#9a352b'}
          stroke-width={4}
          stroke-linecap="round"
        />
      )}
      <circle cx={CX} cy={CY} r={6} fill="currentColor" />
    </svg>
  )
}
