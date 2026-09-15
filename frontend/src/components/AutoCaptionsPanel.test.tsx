// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useEditorStore } from '../store/editorStore'
import { AutoCaptionsPanel } from './AutoCaptionsPanel'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mount() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<AutoCaptionsPanel />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

beforeEach(() => {
  useEditorStore.getState().reset()
})

afterEach(unmount)

describe('AutoCaptionsPanel', () => {
  it('renders the panel header with icon and title', () => {
    mount()
    expect(host.textContent).toContain('💬')
    expect(host.textContent).toContain('Auto Captions')
  })

  it('renders a toggle that is on by default', () => {
    mount()
    const toggle = host.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(toggle).not.toBeNull()
    expect(toggle.checked).toBe(true)
  })

  it('renders language and style selects', () => {
    mount()
    const selects = host.querySelectorAll('select')
    expect(selects.length).toBeGreaterThanOrEqual(2)
  })

  it('renders Auto/Manual timing buttons', () => {
    mount()
    expect(host.textContent).toContain('Auto')
    expect(host.textContent).toContain('Manual')
  })

  it('renders Customize button', () => {
    mount()
    expect(host.textContent).toContain('Customize')
  })

  it('shows hint when no voice assets analyzed', () => {
    mount()
    expect(host.textContent).toContain('Analyze a voice-over first')
  })

  it('hides body when toggle is off', () => {
    mount()
    const toggle = host.querySelector('input[type="checkbox"]') as HTMLInputElement
    act(() => toggle.click())
    expect(toggle.checked).toBe(false)
    expect(host.textContent).not.toContain('Language')
  })
})
