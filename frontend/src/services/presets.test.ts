// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { updatePreset } from './presets'
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
  return { ok, status, json: async () => body } as Response
}

afterEach(() => vi.unstubAllGlobals())

describe('updatePreset', () => {
  it('sends a PUT with the preset payload for the id', async () => {
    let called = ''
    let sent = ''
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        called = `${init?.method} ${String(input)}`
        sent = String(init?.body)
        return jsonResponse({ ...aPreset, fontSize: 64 }, true, 200)
      }),
    )
    const updated = await updatePreset('custom-1', { kind: 'lava-preset', version: 1, preset: { ...aPreset, fontSize: 64 } })
    expect(called).toBe('PUT http://127.0.0.1:7860/api/presets/custom-1')
    expect(JSON.parse(sent)).toMatchObject({ kind: 'lava-preset', version: 1 })
    expect(updated.fontSize).toBe(64)
  })

  it('raises PresetError on a 403 for a built-in preset', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { message: 'built-in' } }, false, 403)),
    )
    await expect(updatePreset('normal', aPreset)).rejects.toThrow('built-in')
  })
})