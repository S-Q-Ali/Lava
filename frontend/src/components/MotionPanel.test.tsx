// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useEditorStore } from '../store/editorStore'
import MotionPanel from './MotionPanel'
import ClipBlock from './timeline/ClipBlock'
import type { Asset, Clip } from '../editor/types'

const imageAsset: Asset = { id: 'img', kind: 'image', name: 'sunset.png', url: 'blob:img', meta: {} }
const videoAsset: Asset = { id: 'vid', kind: 'video', name: 'clip.mov', url: 'blob:vid', meta: {} }

function clipWith(overrides: Partial<Clip> = {}): Clip {
  return {
    id: 'clip-img',
    trackId: 'track-video',
    assetId: 'img',
    name: 'sunset.png',
    start: 0,
    duration: 2,
    ...overrides,
  }
}

function applyClips() {
  const s = useEditorStore.getState()
  s.addAsset(imageAsset)
  s.addAsset(videoAsset)
  useEditorStore.setState({
    clips: [clipWith(), clipWith({ id: 'clip-vid', assetId: 'vid', name: 'clip.mov' })],
  })
}

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mount(node: React.ReactNode) {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(node))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

beforeEach(() => {
  useEditorStore.getState().reset()
})

describe('MotionPanel', () => {
  it('renders type select and strength slider for an image clip', () => {
    applyClips()
    const selected = useEditorStore
      .getState()
      .clips.find((c) => c.id === 'clip-img')!
    mount(<MotionPanel clip={selected} />)
    expect(host.querySelector('select[aria-label="Motion type"]')).not.toBeNull()
    expect(host.querySelector('input[aria-label="Motion strength"]')).toBeNull()
    unmount()
  })

  it('shows the strength slider once a motion type is chosen', () => {
    applyClips()
    useEditorStore.getState().setClipMotion('clip-img', { type: 'zoom-in', strength: 0.6 })
    const selected = useEditorStore
      .getState()
      .clips.find((c) => c.id === 'clip-img')!
    mount(<MotionPanel clip={selected} />)
    const slider = host.querySelector<HTMLInputElement>('input[aria-label="Motion strength"]')
    expect(slider).not.toBeNull()
    expect(slider?.value).toBe('0.6')
    expect(host.textContent).toContain('zoom-in')
    unmount()
  })

  it('changing the type updates the selected clip motion', () => {
    applyClips()
    const selected = useEditorStore
      .getState()
      .clips.find((c) => c.id === 'clip-img')!
    mount(<MotionPanel clip={selected} />)
    const select = host.querySelector<HTMLSelectElement>('select[aria-label="Motion type"]')
    if (!select) throw new Error('missing select')
    act(() => {
      select.value = 'pan-left'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const updated = useEditorStore
      .getState()
      .clips.find((c) => c.id === 'clip-img')
    expect(updated?.motion).toEqual({ type: 'pan-left', strength: 0.5 })
    unmount()
  })

  it('changing the slider updates strength', () => {
    applyClips()
    useEditorStore.getState().setClipMotion('clip-img', { type: 'zoom-out', strength: 0.4 })
    const selected = useEditorStore
      .getState()
      .clips.find((c) => c.id === 'clip-img')!
    mount(<MotionPanel clip={selected} />)
    const slider = host.querySelector<HTMLInputElement>('input[aria-label="Motion strength"]')
    if (!slider) throw new Error('missing slider')
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(slider, '0.9')
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const updated = useEditorStore
      .getState()
      .clips.find((c) => c.id === 'clip-img')
    expect(updated?.motion?.strength).toBe(0.9)
    unmount()
  })

  it('choosing none clears motion', () => {
    applyClips()
    useEditorStore.getState().setClipMotion('clip-img', { type: 'zoom-in', strength: 1 })
    const selected = useEditorStore
      .getState()
      .clips.find((c) => c.id === 'clip-img')!
    mount(<MotionPanel clip={selected} />)
    const select = host.querySelector<HTMLSelectElement>('select[aria-label="Motion type"]')
    if (!select) throw new Error('missing select')
    act(() => {
      select.value = 'none'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const updated = useEditorStore
      .getState()
      .clips.find((c) => c.id === 'clip-img')
    expect(updated?.motion).toBeUndefined()
    unmount()
  })

  it('renders nothing for a video clip', () => {
    applyClips()
    const selected = useEditorStore
      .getState()
      .clips.find((c) => c.id === 'clip-vid')!
    mount(<MotionPanel clip={selected} />)
    expect(host.textContent).toBe('')
    unmount()
  })
})

describe('ClipBlock motion marker', () => {
  it('shows a marker when the clip has motion', () => {
    mount(
      <ClipBlock
        clip={clipWith({ motion: { type: 'pan-up', strength: 0.8 } })}
        selected={false}
      />,
    )
    const marker = host.querySelector<HTMLElement>('.clip-motion')
    expect(marker).not.toBeNull()
    expect(marker?.getAttribute('title')).toContain('pan-up')
    unmount()
  })

  it('shows no marker without motion', () => {
    mount(<ClipBlock clip={clipWith()} selected={false} />)
    expect(host.querySelector('.clip-motion')).toBeNull()
    unmount()
  })
})