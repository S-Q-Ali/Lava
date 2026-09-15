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
  it('renders all category tabs', () => {
    mount()
    const tabs = host.querySelectorAll('.assets-tab')
    expect(tabs.length).toBe(7)
    expect(host.textContent).toContain('Recent')
    expect(host.textContent).toContain('All')
    expect(host.textContent).toContain('Images')
    expect(host.textContent).toContain('Videos')
    expect(host.textContent).toContain('Audio')
    expect(host.textContent).toContain('Image to Image')
    expect(host.textContent).toContain('Tips')
  })

  it('defaults to Recent tab', () => {
    mount()
    const activeTab = host.querySelector('.assets-tab.active')
    expect(activeTab?.textContent).toContain('Recent')
  })

  it('switches to All tab on click', () => {
    mount()
    const tabs = host.querySelectorAll('.assets-tab')
    const allTab = Array.from(tabs).find((t) => t.textContent?.includes('All'))
    act(() => (allTab as HTMLButtonElement).click())
    const activeTab = host.querySelector('.assets-tab.active')
    expect(activeTab?.textContent).toContain('All')
  })

  it('shows empty state when no assets exist', () => {
    mount()
    expect(host.textContent).toContain('Import media')
  })

  it('switches to Tips tab and shows tips content', () => {
    mount()
    const tabs = host.querySelectorAll('.assets-tab')
    const tipsTab = Array.from(tabs).find((t) => t.textContent?.includes('Tips'))
    act(() => (tipsTab as HTMLButtonElement).click())
    expect(host.textContent).toContain('Import Media')
    expect(host.textContent).toContain('AI Voice Matching')
  })

  it('switches to Image to Image tab', () => {
    mount()
    const tabs = host.querySelectorAll('.assets-tab')
    const i2iTab = Array.from(tabs).find((t) => t.textContent?.includes('Image to Image'))
    act(() => (i2iTab as HTMLButtonElement).click())
    expect(host.textContent).toContain('Image to Image')
    expect(host.textContent).toContain('Drop an image here')
    expect(host.textContent).toContain('Generate')
  })

  it('switches to Images tab and shows empty state', () => {
    mount()
    const tabs = host.querySelectorAll('.assets-tab')
    const imgTab = Array.from(tabs).find((t) => t.textContent?.includes('Images'))
    act(() => (imgTab as HTMLButtonElement).click())
    expect(host.textContent).toContain('No image assets yet')
  })
})
