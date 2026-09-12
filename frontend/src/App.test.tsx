// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import App from './App'

describe('App mount (React 19 store snapshot stability)', () => {
  it('renders without hitting the maximum update depth error', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    expect(() => act(() => root.render(<App />))).not.toThrow()
    expect(container.textContent).toContain('Lava — AI Video Studio')
    act(() => root.unmount())
    container.remove()
  })
})