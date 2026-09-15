// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import NavRail from './NavRail'
import { NAV_ITEMS } from './navItems'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>
let selected: string | null

function mount(active = 'media') {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  selected = null
  act(() => root.render(<NavRail active={active} onSelect={(id) => (selected = id)} />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

beforeEach(() => {
  selected = null
})

afterEach(unmount)

describe('NavRail', () => {
  it('renders all 7 nav items', () => {
    mount()
    const buttons = host.querySelectorAll('.nav-rail-item')
    expect(buttons.length).toBe(NAV_ITEMS.length)
  })

  it('renders each nav item label', () => {
    mount()
    for (const item of NAV_ITEMS) {
      expect(host.textContent).toContain(item.label)
    }
  })

  it('highlights the active nav item', () => {
    mount('ai-tools')
    const buttons = host.querySelectorAll('.nav-rail-item')
    const aiToolsBtn = Array.from(buttons).find(
      (b) => b.textContent?.includes('AI Tools'),
    )
    expect(aiToolsBtn?.classList.contains('active')).toBe(true)
  })

  it('calls onSelect when a nav item is clicked', () => {
    mount()
    const buttons = host.querySelectorAll('.nav-rail-item')
    act(() => (buttons[3] as HTMLButtonElement).click())
    expect(selected).toBe('ai-tools')
  })

  it('sets aria-current on the active item', () => {
    mount('captions')
    const buttons = host.querySelectorAll('.nav-rail-item')
    const captionsBtn = Array.from(buttons).find(
      (b) => b.textContent?.includes('Captions'),
    )
    expect(captionsBtn?.getAttribute('aria-current')).toBe('page')
  })

  it('does not set aria-current on inactive items', () => {
    mount('media')
    const buttons = host.querySelectorAll('.nav-rail-item')
    const homeBtn = Array.from(buttons).find(
      (b) => b.textContent?.includes('Home'),
    )
    expect(homeBtn?.getAttribute('aria-current')).toBeNull()
  })
})
