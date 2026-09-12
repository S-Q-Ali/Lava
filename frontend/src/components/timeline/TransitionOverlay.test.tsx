// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useEditorStore } from '../../store/editorStore'
import TransitionOverlay from './TransitionOverlay'
import { PX_PER_SECOND } from './scale'
import type { Asset } from '../../editor/types'


const imageA: Asset = { id: 'a', kind: 'image', name: 'sunset.png', url: 'blob:a', meta: {} }
const imageB: Asset = { id: 'b', kind: 'image', name: 'forest.png', url: 'blob:b', meta: {} }

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mount(clips: unknown) {
  host = document.createElement('div')
  host.style.position = 'relative'
  document.body.appendChild(host)
  root = createRoot(host)
  act(() =>
    root.render(
      // @ts-expect-error test slice: clips passed as Clip[]
      <TransitionOverlay clips={clips} />,
    ),
  )
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
      { trackId: 'track-video', assetId: 'a', name: 'a', start: 0, end: 2, confidence: 0.6, beatId: 'b0' },
      { trackId: 'track-video', assetId: 'a', name: 'a', start: 2, end: 4, confidence: 0.6, beatId: 'b1' },
      { trackId: 'track-video', assetId: 'b', name: 'b', start: 4.5, end: 6.5, confidence: 0.6, beatId: 'b2' },
    ],
    [],
  )
  const clips = [...useEditorStore.getState().clips].sort((x, y) => x.start - y.start)
  useEditorStore.getState().suggestTransitions()
  return clips
}

describe('TransitionOverlay', () => {
  it('renders between chips centred on the cut boundary with a clamped minimum width', () => {
    const clips = applyVideoClips()
    mount(clips)
    const chips = host.querySelectorAll<HTMLDivElement>('.transition-chip[data-kind="between"]')
    expect(chips.length).toBe(2)
    const match = useEditorStore
      .getState()
      .transitions.find((t) => t.kind === 'between' && t.type === 'match')
    if (!match || match.kind !== 'between') throw new Error('missing match')
    const boundary = clips[0].start + clips[0].duration
    const expectedWidth = Math.max(match.duration * PX_PER_SECOND, 36)
    const chip = chips[0]
    expect(chip.style.width).toBe(`${expectedWidth}px`)
    expect(Number.parseFloat(chip.style.left)).toBeCloseTo(boundary * PX_PER_SECOND - expectedWidth / 2, 0)
    unmount()
  })

  it('wider transition durations scale the chip width', () => {
    const clips = applyVideoClips()
    const dissolve = useEditorStore
      .getState()
      .transitions.find((t) => t.kind === 'between' && t.type === 'dissolve')
    if (!dissolve) throw new Error('missing dissolve')
    useEditorStore.getState().overrideTransition(dissolve.id, 'dissolve', 1.5)
    mount(clips)
    const chip = host.querySelector<HTMLDivElement>('.transition-chip[data-kind="between"][data-type="dissolve"]')
    expect(chip?.style.width).toBe(`${1.5 * PX_PER_SECOND}px`)
    unmount()
  })

  it('renders edge chips at the track start and end', () => {
    const clips = applyVideoClips()
    const state = useEditorStore.getState()
    state.loadProject({
      tracks: state.tracks,
      assets: state.assets,
      clips,
      playhead: 0,
      selectedClipId: null,
      transitions: [
        { kind: 'edge', id: 'e1', at: 'start', clipId: clips[0].id, type: 'fade', duration: 0.4, source: 'auto' },
        { kind: 'edge', id: 'e2', at: 'end', clipId: clips[clips.length - 1].id, type: 'fade', duration: 0.3, source: 'auto' },
      ],
    })
    mount(clips)
    const chips = host.querySelectorAll<HTMLDivElement>('.transition-chip[data-kind="edge"]')
    expect(chips.length).toBe(2)
    unmount()
  })

  it('clicking a chip selects the transition', () => {
    const clips = applyVideoClips()
    mount(clips)
    const chip = host.querySelector<HTMLDivElement>('.transition-chip')
    if (!chip) throw new Error('missing chip')
    act(() => chip.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(useEditorStore.getState().selectedTransitionId).toBe(chip.dataset.transitionId)
    unmount()
  })
})