import { cleanup, render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { gaugeAngle, TunerGauge } from './TunerGauge'

afterEach(() => {
  cleanup()
})

describe('TunerGauge', () => {
  it('pes / tam / tiz etiketlerini gösterir', () => {
    render(<TunerGauge cents={0} />)
    expect(screen.getByText('pes')).toBeTruthy()
    expect(screen.getByText('tam')).toBeTruthy()
    expect(screen.getByText('tiz')).toBeTruthy()
  })

  it('ibre sapmayı ±50 sentle sınırlar; pes sola, tiz sağa', () => {
    expect(gaugeAngle(0)).toBe(0)
    expect(gaugeAngle(-25)).toBeLessThan(0)
    expect(gaugeAngle(25)).toBeGreaterThan(0)
    expect(gaugeAngle(400)).toBe(gaugeAngle(50))
    expect(gaugeAngle(-1200)).toBe(gaugeAngle(-50))
  })

  it('sapmayı erişilebilir metinle bildirir', () => {
    render(<TunerGauge cents={12.4} />)
    expect(screen.getByRole('img', { name: 'Akort: 12 sent tiz' })).toBeTruthy()
    cleanup()
    render(<TunerGauge cents={-80} />)
    expect(screen.getByRole('img', { name: 'Akort: 80 sent pes' })).toBeTruthy()
    cleanup()
    render(<TunerGauge cents={2} />)
    expect(screen.getByRole('img', { name: 'Akort: tam' })).toBeTruthy()
  })

  it('ses yokken ibre gizlenir', () => {
    render(<TunerGauge cents={null} />)
    expect(screen.getByRole('img', { name: 'Akort: ses yok' })).toBeTruthy()
    expect(document.querySelector('[data-testid="needle"]')).toBeNull()
  })
})
