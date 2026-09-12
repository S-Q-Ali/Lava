// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useEditorStore } from '../store/editorStore'
import { CaptionPanel, captionsRenderPayload } from './CaptionPanel'
import type { Asset, Transcript } from '../editor/types'

const voice: Asset = { id: 'v', kind: 'audio', name: 'narration.mp3', url: 'blob:v', meta: { duration: 4.4 } }

const transcript: Transcript = {
  text: 'Warm sunsets feel rare.',
  language: 'en',
  segments: [
    {
      id: 0,
      text: 'Warm sunsets feel rare.',
      start: 0,
      end: 2,
      avgLogprob: -0.2,
      confidence: 0.9,
      words: [
        { word: 'Warm', start: 0, end: 0.5, confidence: 0.9 },
        { word: 'sunsets', start: 0.5, end: 1, confidence: 0.9 },
        { word: 'feel', start: 1, end: 1.5, confidence: 0.9 },
        { word: 'rare.', start: 1.5, end: 2, confidence: 0.9 },
      ],
    },
  ],
  pauses: [],
}

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mountPanel() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<CaptionPanel />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

beforeEach(() => {
  useEditorStore.getState().reset()
})

describe('CaptionPanel', () => {
  it('shows the analyze-first empty state without a transcript', () => {
    mountPanel()
    expect(host.textContent).toContain('Analyze a voice-over')
    unmount()
  })

  it('offers generate buttons for analyzed voice assets', () => {
    useEditorStore.getState().addAsset(voice)
    useEditorStore.getState().setTranscript('v', transcript)
    mountPanel()
    const button = host.querySelector<HTMLButtonElement>('.caption-generate button')
    expect(button?.textContent).toContain('Generate captions')
    act(() => button?.click())
    expect(useEditorStore.getState().captions).toHaveLength(1)
    expect(useEditorStore.getState().captions[0].text).toBe('Warm sunsets feel rare.')
    unmount()
  })

  it('editing caption text flips it to manual', () => {
    useEditorStore.getState().addAsset(voice)
    useEditorStore.getState().setTranscript('v', transcript)
    useEditorStore.getState().generateCaptions('v')
    mountPanel()
    const input = host.querySelector<HTMLInputElement>('input.caption-text')
    if (!input) throw new Error('missing caption text input')
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(input, 'edited by hand')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const caption = useEditorStore.getState().captions[0]
    expect(caption.text).toBe('edited by hand')
    expect(caption.source).toBe('manual')
    unmount()
  })

  it('style select flips the caption to manual with the chosen preset', () => {
    useEditorStore.getState().addAsset(voice)
    useEditorStore.getState().setTranscript('v', transcript)
    useEditorStore.getState().generateCaptions('v')
    mountPanel()
    const select = host.querySelector<HTMLSelectElement>('.caption-item-controls select')
    if (!select) throw new Error('missing style select')
    act(() => {
      select.value = 'karaoke'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const caption = useEditorStore.getState().captions[0]
    expect(caption.styleId).toBe('karaoke')
    expect(caption.source).toBe('manual')
    unmount()
  })

  it('Remove deletes the caption', () => {
    useEditorStore.getState().addAsset(voice)
    useEditorStore.getState().setTranscript('v', transcript)
    useEditorStore.getState().generateCaptions('v')
    mountPanel()
    const remove = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent?.includes('Remove'),
    )
    if (!remove) throw new Error('missing remove button')
    act(() => remove.click())
    expect(useEditorStore.getState().captions).toHaveLength(0)
    unmount()
  })
})

describe('captionsRenderPayload', () => {
  it('maps a caption item onto the render wire shape', () => {
    useEditorStore.getState().addAsset(voice)
    useEditorStore.getState().setTranscript('v', transcript)
    useEditorStore.getState().generateCaptions('v')
    const payload = captionsRenderPayload(useEditorStore.getState().captions)
    expect(payload).toHaveLength(1)
    expect(payload[0]).toMatchObject({
      start: 0,
      duration: 2,
      text: 'Warm sunsets feel rare.',
      style: {
        fontFamily: 'Helvetica Neue',
        fontSize: 42,
        primaryColor: '#FFFFFF',
        alignment: 'bottom',
        rtl: false,
        karaoke: false,
      },
    })
    expect(payload[0].words).toHaveLength(4)
  })
})