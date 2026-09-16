// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useEditorStore } from '../store/editorStore'
import AssetsPanel from './AssetsPanel'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mount() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<AssetsPanel />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

beforeEach(() => {
  useEditorStore.getState().reset()
})

afterEach(unmount)

describe('AssetsPanel', () => {
  it('renders sidebar with category tabs', () => {
    mount()
    expect(host.querySelector('.assets-sidebar')).not.toBeNull()
    const tabs = host.querySelectorAll('.assets-sidebar-tab')
    expect(tabs.length).toBe(5)
    expect(host.textContent).toContain('Media')
    expect(host.textContent).toContain('Images')
    expect(host.textContent).toContain('Audio')
    expect(host.textContent).toContain('Videos')
    expect(host.textContent).toContain('Documents')
  })

  it('renders Project Assets title', () => {
    mount()
    expect(host.textContent).toContain('Project Assets')
  })

  it('defaults to Media tab', () => {
    mount()
    const activeTab = host.querySelector('.assets-sidebar-tab.active')
    expect(activeTab?.textContent).toContain('Media')
  })

  it('switches to Images tab on click', () => {
    mount()
    const tabs = host.querySelectorAll('.assets-sidebar-tab')
    const imgTab = Array.from(tabs).find((t) => t.textContent?.includes('Images'))
    act(() => (imgTab as HTMLButtonElement).click())
    const activeTab = host.querySelector('.assets-sidebar-tab.active')
    expect(activeTab?.textContent).toContain('Images')
  })

  it('shows Recent section', () => {
    mount()
    expect(host.textContent).toContain('Recent')
  })

  it('shows Image to Image section', () => {
    mount()
    expect(host.querySelector('.assets-i2i-section')).not.toBeNull()
  })

  it('shows Tips section', () => {
    mount()
    expect(host.querySelector('.assets-tips-section')).not.toBeNull()
  })

  it('shows empty state when no assets exist', () => {
    mount()
    expect(host.textContent).toContain('Import media')
  })
})
