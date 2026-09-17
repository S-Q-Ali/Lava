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
  it('renders both AI Match and Auto Captions stacked', () => {
    mount()
    expect(host.querySelector('.ai-match-panel')).not.toBeNull()
    expect(host.querySelector('.auto-captions-panel')).not.toBeNull()
  })

  it('shows AI Match title', () => {
    mount()
    expect(host.textContent).toContain('AI Match')
  })

  it('shows Auto Captions title', () => {
    mount()
    expect(host.textContent).toContain('Auto Captions')
  })

  it('shows Voice + Images tab in AI Match', () => {
    mount()
    expect(host.textContent).toContain('Voice + Images')
  })

  it('shows Language selector in Auto Captions', () => {
    mount()
    expect(host.textContent).toContain('Language')
  })

  it('shows the selection inspector alongside AI tools', () => {
    mount()
    expect(host.textContent).toContain('Inspector')
    expect(host.textContent).toContain('Select a clip to inspect.')
  })
})
