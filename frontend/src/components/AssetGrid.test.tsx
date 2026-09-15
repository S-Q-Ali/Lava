// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useEditorStore } from '../store/editorStore'
import { AssetGrid } from './AssetGrid'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mount(category: 'all' | 'recent' | 'image' | 'video' | 'audio' = 'all') {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<AssetGrid category={category} />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

beforeEach(() => {
  useEditorStore.getState().reset()
})

afterEach(unmount)

describe('AssetGrid', () => {
  it('shows empty state when no assets', () => {
    mount()
    expect(host.textContent).toContain('No all assets yet')
  })

  it('shows recent empty state', () => {
    mount('recent')
    expect(host.textContent).toContain('Import media')
  })

  it('renders asset thumbnails when assets exist', () => {
    const state = useEditorStore.getState()
    act(() => {
      state.addAsset({
        id: 'img-1',
        kind: 'image',
        name: 'panel-01.png',
        url: '/img/panel-01.png',
        meta: { width: 800, height: 1200 },
      })
      state.addAsset({
        id: 'img-2',
        kind: 'image',
        name: 'panel-02.png',
        url: '/img/panel-02.png',
        meta: { width: 800, height: 1200 },
      })
      state.addAsset({
        id: 'aud-1',
        kind: 'audio',
        name: 'narration.mp3',
        url: '/audio/narration.mp3',
        meta: { duration: 60 },
      })
    })
    mount()
    const thumbs = host.querySelectorAll('.asset-thumb')
    expect(thumbs.length).toBe(3)
    expect(host.textContent).toContain('panel-01.png')
    expect(host.textContent).toContain('panel-02.png')
    expect(host.textContent).toContain('narration.mp3')
  })

  it('filters to images only when category is image', () => {
    const state = useEditorStore.getState()
    act(() => {
      state.addAsset({
        id: 'img-1',
        kind: 'image',
        name: 'panel.png',
        url: '/img/panel.png',
        meta: {},
      })
      state.addAsset({
        id: 'aud-1',
        kind: 'audio',
        name: 'voice.mp3',
        url: '/audio/voice.mp3',
        meta: {},
      })
    })
    mount('image')
    const thumbs = host.querySelectorAll('.asset-thumb')
    expect(thumbs.length).toBe(1)
    expect(host.textContent).toContain('panel.png')
    expect(host.textContent).not.toContain('voice.mp3')
  })
})
