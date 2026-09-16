// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useEditorStore } from '../store/editorStore'
import ExportPanel from './ExportPanel'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mount() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<ExportPanel />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

beforeEach(() => {
  useEditorStore.getState().reset()
})

afterEach(unmount)

describe('ExportPanel', () => {
  it('renders the export header', () => {
    mount()
    expect(host.querySelector('.export-panel')).not.toBeNull()
    expect(host.textContent).toContain('Export')
  })

  it('shows empty message when no clips exist', () => {
    mount()
    expect(host.textContent).toContain('Import media and add clips')
  })

  it('renders platform preset selector with youtube-1080 default', () => {
    mount()
    const select = host.querySelector('select') as HTMLSelectElement
    expect(select).not.toBeNull()
    expect(select.value).toBe('youtube-1080')
  })

  it('shows clip count and duration when clips exist', () => {
    const { addAsset, addClip } = useEditorStore.getState()
    act(() => {
      addAsset({
        id: 'a1',
        kind: 'image',
        name: 'test.png',
        url: 'blob:test',
        meta: { width: 1920, height: 1080 },
      })
      addClip({ trackId: 'track-image', assetId: 'a1', name: 'test.png', start: 0, duration: 5 })
    })
    mount()
    expect(host.textContent).toContain('Clips')
    expect(host.textContent).toContain('1')
    expect(host.textContent).toContain('5.0s')
  })

  it('export button is disabled when no clips exist', () => {
    mount()
    const btn = Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes('Export'))
    expect(btn).toBeDefined()
    expect((btn as HTMLButtonElement).disabled).toBe(true)
  })

  it('export button is enabled when clips exist', () => {
    const { addAsset, addClip } = useEditorStore.getState()
    act(() => {
      addAsset({
        id: 'a1',
        kind: 'image',
        name: 'test.png',
        url: 'blob:test',
        meta: { width: 1920, height: 1080 },
      })
      addClip({ trackId: 'track-image', assetId: 'a1', name: 'test.png', start: 0, duration: 5 })
    })
    mount()
    const btn = Array.from(host.querySelectorAll('button')).find((b) => b.textContent === 'Export')
    expect(btn).toBeDefined()
    expect((btn as HTMLButtonElement).disabled).toBe(false)
  })
})
