// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PresetError,
  deletePreset,
  exportPresetPayload,
  importPreset,
} from './presets'
import { parsePreset, type Preset } from '../editor/presets'

const aPreset: Preset = parsePreset({
  id: 'custom-1',
  label: 'My preset',
  description: 'desc',
  category: 'Custom',
  fontFamily: 'Arial',
  fontSize: 40,
  primaryColor: '#FFFFFF',
  highlightColor: '#000000',
  outlineColor: '#111111',
  outlineWidth: 1,
  bold: false,
  uppercase: false,
  alignment: 'bottom',
})

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response
}

function stubFetch(impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(impl))
}

afterEach(() => vi.unstubAllGlobals())

describe('importPreset', () => {
  it('posts the payload and returns the parsed preset', async () => {
    stubFetch(async (input, init) => {
      expect(String(input)).toContain('/api/presets')
      expect(init?.method).toBe('POST')
      expect(init?.headers).toMatchObject({ 'Content-Type': 'application/json' })
      const body = JSON.parse(String(init?.body))
      expect(body.kind).toBe('lava-preset')
      return jsonResponse({ ...aPreset })
    })
    const created = await importPreset(exportPresetPayload(aPreset))
    expect(created.id).toBe('custom-1')
    expect(created.category).toBe('Custom')
  })

  it('raises PresetError on a 422 with a code', async () => {
    stubFetch(async () =>
      jsonResponse({ error: { code: 'PRESET_INVALID', message: 'id already exists' } }, false, 422),
    )
    await expect(importPreset({})).rejects.toThrow(PresetError)
  })
})

describe('deletePreset', () => {
  it('sends a DELETE for the id', async () => {
    let called = ''
    stubFetch(async (input) => {
      called = String(input)
      return jsonResponse(null, true, 204)
    })
    await deletePreset('custom-1')
    expect(called).toContain('/api/presets/custom-1')
  })

  it('raises PresetError when the backend forbids a builtin', async () => {
    stubFetch(async () => jsonResponse({ error: { message: 'built-in presets cannot be deleted' } }, false, 403))
    await expect(deletePreset('normal')).rejects.toThrow(PresetError)
  })
})

describe('exportPresetPayload', () => {
  it('emits the lava-preset envelope that round-trips through parsePreset', () => {
    const payload = exportPresetPayload(aPreset)
    expect(payload.kind).toBe('lava-preset')
    expect(payload.version).toBe(1)
    const back = parsePreset(payload.preset)
    expect(back.id).toBe('custom-1')
    expect(back.fontSize).toBe(40)
  })
})