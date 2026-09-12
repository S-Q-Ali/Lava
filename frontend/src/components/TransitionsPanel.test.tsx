// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useEditorStore } from '../store/editorStore'
import TransitionsPanel from './TransitionsPanel'
import type { Asset } from '../editor/types'
import type { EdgeTransition } from '../editor/transitions'

const imageA: Asset = { id: 'a', kind: 'image', name: 'sunset.png', url: 'blob:a', meta: {} }
const imageB: Asset = { id: 'b', kind: 'image', name: 'forest.png', url: 'blob:b', meta: {} }

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mountPanel() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<TransitionsPanel />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

beforeEach(() => {
  useEditorStore.getState().reset()
})

function applyVideoClips() {
  useEditorStore.getState().addAsset(imageA)
  useEditorStore.getState().addAsset(imageB)
  useEditorStore.getState().applyMatch(
    [
      { trackId: 'video', assetId: 'a', name: 'a', start: 0, end: 2, confidence: 0.6, beatId: 'b0' },
      { trackId: 'video', assetId: 'a', name: 'a', start: 2, end: 4, confidence: 0.6, beatId: 'b1' },
      { trackId: 'video', assetId: 'b', name: 'b', start: 4.5, end: 6.5, confidence: 0.6, beatId: 'b2' },
    ],
    [],
  )
}

describe('TransitionsPanel', () => {
  it('shows guidance and a disabled Suggest button with no clips', () => {
    mountPanel()
    const button = host.querySelector<HTMLButtonElement>('button')
    expect(button?.disabled).toBe(true)
    expect(host.textContent).toContain('Suggest')
    unmount()
  })

  it('suggests transitions and renders rationale text', () => {
    applyVideoClips()
    useEditorStore.getState().suggestTransitions()
    mountPanel()
    expect(host.textContent).toContain('Same image continues')
    expect(host.textContent).toContain('passage of time')
    expect(host.querySelectorAll('.transition-row').length).toBe(2)
    unmount()
  })

  it('editing the type flips the transition to manual', () => {
    applyVideoClips()
    useEditorStore.getState().suggestTransitions()
    mountPanel()
    const select = host.querySelector<HTMLSelectElement>('select[aria-label*="Type"]')
    if (!select) throw new Error('missing type select')
    act(() => {
      select.value = 'fade'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const t = useEditorStore.getState().transitions.find((x) => select.dataset.transitionId === x.id)
    expect(t?.source).toBe('manual')
    expect(t?.type).toBe('fade')
    unmount()
  })

  it('duration input overrides the transition duration', () => {
    applyVideoClips()
    useEditorStore.getState().suggestTransitions()
    mountPanel()
    const input = host.querySelector<HTMLInputElement>('input[type="number"]')
    if (!input) throw new Error('missing duration input')
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(input, '0.8')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const t = useEditorStore.getState().transitions.find((x) => input.dataset.transitionId === x.id)
    expect(t?.duration).toBe(0.8)
    unmount()
  })

  it('Remove deletes the transition', () => {
    applyVideoClips()
    useEditorStore.getState().suggestTransitions()
    mountPanel()
    const before = useEditorStore.getState().transitions.length
    const button = host.querySelector<HTMLButtonElement>('button[aria-label*="Remove transition"]')
    if (!button) throw new Error('missing remove button')
    act(() => button.click())
    expect(useEditorStore.getState().transitions).toHaveLength(before - 1)
    unmount()
  })

  it('surfaces invalid transitions and resolves them explicitly', () => {
    applyVideoClips()
    useEditorStore.getState().suggestTransitions()
    const clips = [...useEditorStore.getState().clips]
    const missingId = `no-such-clip-${clips[0].id}`
    const edge: EdgeTransition = {
      kind: 'edge',
      id: 'e1',
      at: 'start',
      clipId: missingId,
      type: 'fade',
      duration: 0.4,
      source: 'auto',
    }
    const state = useEditorStore.getState()
    useEditorStore.getState().loadProject({
      tracks: state.tracks,
      assets: state.assets,
      clips,
      playhead: 0,
      selectedClipId: null,
      transitions: [edge],
    })
    mountPanel()
    expect(host.textContent).toContain('invalid')
    const resolve = host.querySelector<HTMLButtonElement>('button[aria-label="Resolve invalid transitions"]')
    if (!resolve) throw new Error('missing resolve button')
    act(() => resolve.click())
    expect(useEditorStore.getState().transitions).toHaveLength(0)
    unmount()
  })
})