// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useEditorStore } from '../store/editorStore'
import AIMatchPanel from './AIMatchPanel'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mount() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<AIMatchPanel />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

beforeEach(() => {
  useEditorStore.getState().reset()
})

afterEach(unmount)

describe('AIMatchPanel', () => {
  it('renders the panel header with lightning icon and title', () => {
    mount()
    expect(host.textContent).toContain('⚡')
    expect(host.textContent).toContain('AI Match')
  })

  it('renders Voice + Images and Settings tabs', () => {
    mount()
    expect(host.textContent).toContain('Voice + Images')
    expect(host.textContent).toContain('Settings')
  })

  it('defaults to Voice + Images tab', () => {
    mount()
    const voiceTab = host.querySelector('[role="tab"][aria-selected="true"]')
    expect(voiceTab?.textContent).toContain('Voice + Images')
  })

  it('switches to Settings tab on click', () => {
    mount()
    const tabs = host.querySelectorAll('[role="tab"]')
    const settingsTab = Array.from(tabs).find((t) => t.textContent?.includes('Settings'))
    act(() => (settingsTab as HTMLButtonElement).click())
    const selectedTab = host.querySelector('[role="tab"][aria-selected="true"]')
    expect(selectedTab?.textContent).toContain('Settings')
    expect(host.textContent).toContain('Match settings will be available here')
  })

  it('switches back to Voice + Images tab', () => {
    mount()
    const tabs = host.querySelectorAll('[role="tab"]')
    const settingsTab = Array.from(tabs).find((t) => t.textContent?.includes('Settings'))
    act(() => (settingsTab as HTMLButtonElement).click())
    const voiceTab = Array.from(tabs).find((t) => t.textContent?.includes('Voice + Images'))
    act(() => (voiceTab as HTMLButtonElement).click())
    const selectedTab = host.querySelector('[role="tab"][aria-selected="true"]')
    expect(selectedTab?.textContent).toContain('Voice + Images')
  })
})
