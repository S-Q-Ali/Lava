// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useEditorStore } from '../store/editorStore'
import RightPanel from './RightPanel'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mount() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<RightPanel />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

beforeEach(() => {
  useEditorStore.getState().reset()
})

afterEach(unmount)

describe('RightPanel', () => {
  it('renders three switcher buttons (AI Match, Auto Captions, Inspector)', () => {
    mount()
    const buttons = host.querySelectorAll('.right-panel-switcher-btn')
    expect(buttons.length).toBe(3)
  })

  it('defaults to AI Match view', () => {
    mount()
    expect(host.textContent).toContain('AI Match')
    const activeBtn = host.querySelector('.right-panel-switcher-btn.active')
    expect(activeBtn?.getAttribute('title')).toBe('AI Match')
  })

  it('switches to Auto Captions view on click', () => {
    mount()
    const buttons = host.querySelectorAll('.right-panel-switcher-btn')
    const captionsBtn = Array.from(buttons).find(
      (b) => b.getAttribute('title') === 'Auto Captions',
    ) as HTMLButtonElement
    act(() => captionsBtn.click())
    expect(host.textContent).toContain('Auto Captions')
    expect(host.textContent).toContain('Language')
  })

  it('switches to Inspector view on click', () => {
    mount()
    const buttons = host.querySelectorAll('.right-panel-switcher-btn')
    const inspectorBtn = Array.from(buttons).find(
      (b) => b.getAttribute('title') === 'Inspector',
    ) as HTMLButtonElement
    act(() => inspectorBtn.click())
    expect(host.textContent).toContain('Inspector')
  })

  it('switches back to AI Match from Inspector', () => {
    mount()
    const buttons = host.querySelectorAll('.right-panel-switcher-btn')
    const inspectorBtn = Array.from(buttons).find(
      (b) => b.getAttribute('title') === 'Inspector',
    ) as HTMLButtonElement
    act(() => inspectorBtn.click())
    const aiMatchBtn = Array.from(buttons).find(
      (b) => b.getAttribute('title') === 'AI Match',
    ) as HTMLButtonElement
    act(() => aiMatchBtn.click())
    expect(host.textContent).toContain('AI Match')
    expect(host.textContent).toContain('Voice + Images')
  })
})
