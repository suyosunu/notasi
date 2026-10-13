import { render, screen } from '@testing-library/preact'
import { afterEach, describe, expect, it } from 'vitest'
import { App } from './app'

afterEach(() => {
  location.hash = ''
})

describe('App', () => {
  it('#/hakkinda rotasında "Hakkında" metnini gösterir', () => {
    location.hash = '#/hakkinda'
    render(<App />)
    expect(screen.getAllByText('Hakkında').length).toBeGreaterThan(0)
  })
})
