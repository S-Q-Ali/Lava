// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePresetStore } from './presetStore'
import { useEditorStore } from './editorStore'
import type { Preset } from '../editor/presets'

const presets: Preset[] = [
  {
    id: 'meme',
    label: 'Meme',
    description: 'Meme',
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
  },
  {
    id: 'normal',
    label: 'Normal',
    description: 'Normal',
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
  },
]

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response
}

beforeEach(() => {
  usePresetStore.getState().clear()
  useEditorStore.getState().reset()
})

afterEach(() => vi.unstubAllGlobals())

describe('usePresetStore', () => {
  it('loads presets from the registry endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(presets)))
    await usePresetStore.getState().load()
    expect(usePresetStore.getState().presets).toHaveLength(2)
    expect(usePresetStore.getState().status).toBe('idle')
  })

  it('records an error status on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'nope' } }, false, 500)),
    )
    await usePresetStore.getState().load()
    expect(usePresetStore.getState().status).toBe('error')
    expect(usePresetStore.getState().error).toBe('nope')
  })

  it('filters by category through byCategory', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(presets)))
    await usePresetStore.getState().load()
    expect(usePresetStore.getState().byCategory('Meme').map((p) => p.id)).toEqual(['meme'])
    expect(usePresetStore.getState().byCategory('Custom').map((p) => p.id)).toEqual(['normal'])
    expect(usePresetStore.getState().byCategory('All')).toHaveLength(2)
  })

  it('tracks the selected category', () => {
    usePresetStore.getState().setCategory('Cinematic')
    expect(usePresetStore.getState().selectedCategory).toBe('Cinematic')
  })

  it('applies a preset to all captions when no ids given', async () => {
    useEditorStore.getState().addClip({
      trackId: 'track-image',
      assetId: 'a',
      name: 'a.png',
      duration: 2,
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
        if (String(input).includes('/captions')) return jsonResponse([])
        return jsonResponse(presets)
      }),
    )
    await usePresetStore.getState().load()
    useEditorStore.setState({
      captions: [
        { id: 'cap-1', trackId: 'track-captions', start: 0, duration: 1, text: 'a', styleId: 'normal', source: 'auto' },
        { id: 'cap-2', trackId: 'track-captions', start: 1, duration: 1, text: 'b', styleId: 'normal', source: 'auto' },
      ],
    })
    usePresetStore.getState().applyPreset('meme')
    const captions = useEditorStore.getState().captions
    expect(captions.every((c) => c.styleId === 'meme')).toBe(true)
    expect(captions.every((c) => c.source === 'manual')).toBe(true)
  })

  it('applies a preset only to the given caption ids', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(presets)))
    await usePresetStore.getState().load()
    useEditorStore.setState({
      captions: [
        { id: 'cap-1', trackId: 'track-captions', start: 0, duration: 1, text: 'a', styleId: 'normal', source: 'auto' },
        { id: 'cap-2', trackId: 'track-captions', start: 1, duration: 1, text: 'b', styleId: 'normal', source: 'auto' },
      ],
    })
    usePresetStore.getState().applyPreset('meme', ['cap-2'])
    const captions = useEditorStore.getState().captions
    expect(captions[0].styleId).toBe('normal')
    expect(captions[1].styleId).toBe('meme')
  })

  it('uses one undo step for a bulk apply', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(presets)))
    await usePresetStore.getState().load()
    useEditorStore.setState({
      captions: [
        { id: 'cap-1', trackId: 'track-captions', start: 0, duration: 1, text: 'a', styleId: 'normal', source: 'auto' },
        { id: 'cap-2', trackId: 'track-captions', start: 1, duration: 1, text: 'b', styleId: 'normal', source: 'auto' },
      ],
    })
    usePresetStore.getState().applyPreset('meme')
    useEditorStore.getState().undo()
    const captions = useEditorStore.getState().captions
    expect(captions.every((c) => c.styleId === 'normal')).toBe(true)
  })

  it('imports a preset and appends it to the list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(presets)))
    await usePresetStore.getState().load()
    const imported: Preset = { ...presets[0], id: 'custom-fresh', category: 'Custom' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(imported, true, 201)))
    const created = await usePresetStore.getState().importPreset(imported)
    expect(created.id).toBe('custom-fresh')
    expect(usePresetStore.getState().getPreset('custom-fresh')).toBeDefined()
  })

  it('surfaces an error when the preset cannot be imported', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'already exists' } }, false, 422)),
    )
    await expect(usePresetStore.getState().importPreset(presets[0])).rejects.toThrow('already exists')
    expect(usePresetStore.getState().status).toBe('error')
  })

  it('removes a custom preset from the local list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(presets)))
    await usePresetStore.getState().load()
    const imported: Preset = { ...presets[0], id: 'custom-gone', category: 'Custom' }
    usePresetStore.setState({ presets: [...usePresetStore.getState().presets, imported] })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, true, 204)))
    await usePresetStore.getState().removePreset('custom-gone')
    expect(usePresetStore.getState().getPreset('custom-gone')).toBeUndefined()
  })
})