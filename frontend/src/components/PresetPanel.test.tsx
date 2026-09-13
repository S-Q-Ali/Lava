// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { PresetPanel } from './PresetPanel'
import { usePresetStore } from '../store/presetStore'
import { useEditorStore } from '../store/editorStore'
import type { Preset } from '../editor/presets'

const presets: Preset[] = [
  {
    id: 'normal',
    label: 'Normal subtitles',
    description: 'Clean readable subtitles.',
    category: 'Custom',
    fontFamily: 'Arial',
    fontSize: 42,
    primaryColor: '#FFFFFF',
    highlightColor: '#FFD54A',
    outlineColor: '#000000',
    outlineWidth: 2,
    bold: false,
    uppercase: false,
    alignment: 'bottom',
    rtl: false,
    emoji: false,
    karaoke: false,
    wordHighlight: false,
    importantWordPop: false,
    punctuation: false,
  },
  {
    id: 'meme',
    label: 'Meme',
    description: 'White-on-black.',
    category: 'Meme',
    fontFamily: 'Impact',
    fontSize: 54,
    primaryColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 3,
    bold: true,
    uppercase: true,
    alignment: 'bottom',
    rtl: false,
    emoji: false,
    karaoke: false,
    wordHighlight: false,
    importantWordPop: false,
    punctuation: false,
  },
  {
    id: 'karaoke',
    label: 'Karaoke',
    description: 'Sweep.',
    category: 'Shorts',
    fontFamily: 'Arial',
    fontSize: 44,
    primaryColor: '#FFFFFF',
    highlightColor: '#39D98A',
    outlineColor: '#000000',
    outlineWidth: 2,
    bold: true,
    uppercase: false,
    alignment: 'bottom',
    rtl: false,
    emoji: false,
    karaoke: true,
    wordHighlight: false,
    importantWordPop: false,
    punctuation: false,
  },
]

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response
}

function fakeFileList(file: File): FileList {
  return {
    0: file,
    length: 1,
    item: (i: number) => (i === 0 ? file : null),
  } as unknown as FileList
}

function findByText(host: HTMLElement, text: string): HTMLElement | null {
  return (
    Array.from(host.querySelectorAll<HTMLElement>('*')).find(
      (el) => el.textContent?.trim() === text && !el.querySelector('*'),
    ) ?? null
  )
}

function findByRoleButton(host: HTMLElement, text: string): HTMLElement | undefined {
  return Array.from(host.querySelectorAll<HTMLElement>('button')).find((b) =>
    b.textContent?.includes(text),
  )
}

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mountPanel() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<PresetPanel />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

function withCaptions() {
  useEditorStore.getState().reset()
  useEditorStore.setState({
    captions: [
      { id: 'cap-1', trackId: 'track-captions', start: 0, duration: 1, text: 'a', styleId: 'normal', source: 'auto' },
    ],
  })
}

beforeEach(() => {
  usePresetStore.getState().clear()
  usePresetStore.getState().setCategory('All')
})

afterEach(() => {
  unmount()
  vi.unstubAllGlobals()
  usePresetStore.getState().clear()
  useEditorStore.getState().reset()
})

describe('PresetPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(presets)))
  })

  it('lists presets as cards after loading', async () => {
    mountPanel()
    await act(async () => {})
    expect(findByText(host, 'Normal subtitles')).not.toBeNull()
    expect(findByText(host, 'Meme')).not.toBeNull()
  })

  it('filters cards by the selected category', async () => {
    mountPanel()
    await act(async () => {})
    const memeTab = findByText(host, 'Meme')
    expect(memeTab).not.toBeNull()
    act(() => memeTab?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await act(async () => {})
    expect(findByText(host, 'Normal subtitles')).toBeNull()
    expect(findByText(host, 'Meme')).not.toBeNull()
  })

  it('applies a preset to all captions via the store', async () => {
    withCaptions()
    mountPanel()
    await act(async () => {})
    const apply = findByRoleButton(host, 'Apply')
    expect(apply).not.toBeNull()
    act(() => apply?.click())
    await act(async () => {})
    const caption = useEditorStore.getState().captions[0]
    expect(caption.styleId).toBe('normal')
    expect(caption.source).toBe('manual')
  })

  it('shows the load error when the sidecar is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'No sidecar reachable.' } }, false, 0)),
    )
    mountPanel()
    await vi.waitFor(() => expect(findByText(host, 'No sidecar reachable.')).not.toBeNull())
  })

  it('imports a valid preset JSON file and shows it as a custom card', async () => {
    const imported: Preset = {
      ...presets[0],
      id: 'custom-imported',
      label: 'Imported preset',
      description: 'From a file',
    }
    let importCalled = false
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'POST') {
          importCalled = true
          return jsonResponse(imported, true, 201)
        }
        return jsonResponse(presets)
      }),
    )
    mountPanel()
    await act(async () => {})
    const file = new File(['{}'], 'preset.json', { type: 'application/json' })
    const input = host.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).not.toBeNull()
    act(() => {
      Object.defineProperty(input!, 'files', { configurable: true, value: fakeFileList(file) })
      input!.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await vi.waitFor(() => expect(findByText(host, 'Imported preset')).not.toBeNull())
    expect(importCalled).toBe(true)
  })

  it('shows an error for invalid preset JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(presets)))
    mountPanel()
    await act(async () => {})
    const file = new File(['{not json'], 'bad.json', { type: 'application/json' })
    const input = host.querySelector<HTMLInputElement>('input[type="file"]')
    act(() => {
      Object.defineProperty(input!, 'files', { configurable: true, value: fakeFileList(file) })
      input!.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await vi.waitFor(() => {
      const error = host.querySelector<HTMLElement>('.preset-error')
      expect(error?.textContent).toContain('Invalid preset JSON')
    })
  })

  it('exports a custom preset as a downloadable file', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse([
          ...presets,
          { ...presets[0], id: 'custom-export', label: 'Export me', description: 'x' },
        ]),
      ),
    )
    const createObjectURL = vi.fn(() => 'blob:preset')
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL: vi.fn() })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    mountPanel()
    await vi.waitFor(() => expect(findByText(host, 'Export me')).not.toBeNull())
    const exportButton = Array.from(host.querySelectorAll<HTMLElement>('button')).find((b) =>
      b.textContent?.includes('Export'),
    )
    expect(exportButton).not.toBeNull()
    act(() => exportButton?.click())
    await act(async () => {})
    expect(createObjectURL).toHaveBeenCalled()
    clickSpy.mockRestore()
  })

  it('removes a custom preset card after delete', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'DELETE') return jsonResponse(null, true, 204)
        return jsonResponse([
          ...presets,
          { ...presets[0], id: 'custom-gone', label: 'Delete me', description: 'x' },
        ])
      }),
    )
    mountPanel()
    await vi.waitFor(() => expect(findByText(host, 'Delete me')).not.toBeNull())
    const removeButton = Array.from(host.querySelectorAll<HTMLElement>('button')).find((b) =>
      b.textContent?.includes('Remove'),
    )
    expect(removeButton).not.toBeNull()
    act(() => removeButton?.click())
    await vi.waitFor(() => expect(findByText(host, 'Delete me')).toBeNull())
  })
})