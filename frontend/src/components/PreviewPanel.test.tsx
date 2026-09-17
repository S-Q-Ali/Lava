// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useEditorStore } from '../store/editorStore'
import { useProxyStore } from '../store/proxyStore'
import { getProxyCache, resetProxyCache } from '../services/proxy'
import PreviewPanel from './PreviewPanel'
import type { Asset } from '../editor/types'
import type { ClipInput } from '../editor/ops'

function addImageClip(url = 'blob:photo') {
  const asset: Asset = { id: 'a1', kind: 'image', name: 'sunset.png', url, meta: {} }
  useEditorStore.getState().addAsset(asset)
  const input: ClipInput = {
    trackId: 'video',
    assetId: 'a1',
    name: 'sunset.png',
    start: 0,
    duration: 2,
  }
  useEditorStore.getState().addClip(input)
}

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mountPanel() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<PreviewPanel />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

beforeEach(() => {
  useEditorStore.getState().reset()
  useProxyStore.setState({ version: 0 })
  resetProxyCache()
})

afterEach(unmount)

describe('PreviewPanel proxy preview', () => {
  it('renders the low-res proxy URL when one is cached for the active asset', () => {
    getProxyCache().set('blob:photo', 'http://127.0.0.1:7860/api/proxy/abcd1234ef567890')
    addImageClip()
    mountPanel()
    const img = host.querySelector<HTMLImageElement>('img')
    expect(img?.getAttribute('src')).toBe('http://127.0.0.1:7860/api/proxy/abcd1234ef567890')
  })

  it('falls back to the original blob URL when no proxy is available', () => {
    addImageClip()
    mountPanel()
    const img = host.querySelector<HTMLImageElement>('img')
    expect(img?.getAttribute('src')).toBe('blob:photo')
  })

  it('swaps to the proxy URL after the store version bumps', () => {
    addImageClip()
    mountPanel()
    const before = host.querySelector<HTMLImageElement>('img')
    expect(before?.getAttribute('src')).toBe('blob:photo')
    getProxyCache().set('blob:photo', 'http://127.0.0.1:7860/api/proxy/abcd1234ef567890')
    act(() => useProxyStore.getState().bump())
    const after = host.querySelector<HTMLImageElement>('img')
    expect(after?.getAttribute('src')).toBe('http://127.0.0.1:7860/api/proxy/abcd1234ef567890')
  })

  it('renders an audio transport for audio assets without touching the proxy', () => {
    const asset: Asset = { id: 'v1', kind: 'audio', name: 'vo.m4a', url: 'blob:vo', meta: {} }
    useEditorStore.getState().addAsset(asset)
    useEditorStore.getState().addClip({
      trackId: 'voice',
      assetId: 'v1',
      name: 'vo.m4a',
      start: 0,
      duration: 2,
    })
    mountPanel()
    expect(host.querySelector('audio')).not.toBeNull()
  })

  it('shows the empty state with no media at the playhead', () => {
    mountPanel()
    expect(host.textContent).toContain('No media at playhead')
    expect(host.querySelector('img, video')).toBeNull()
  })
})