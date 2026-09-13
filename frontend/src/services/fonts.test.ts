import { afterEach, describe, expect, it, vi } from 'vitest'
import { FontError, listFonts, uploadFont, deleteFont } from '../services/fonts'
import { parseFontMetadata } from '../editor/fonts'

const meta = {
  id: 'font-abc',
  family: 'Arial',
  fileName: 'Arial.ttf',
  ext: 'ttf',
  license: { type: 'open', source: null, embeddingAllowed: true },
  addedAt: '2026-09-13T00:00:00Z',
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('parseFontMetadata', () => {
  it('normalises a valid metadata record', () => {
    expect(parseFontMetadata(meta)).toEqual(meta)
  })

  it('rejects non-objects', () => {
    expect(() => parseFontMetadata(null)).toThrow(FontError)
  })

  it('rejects records without an id or family', () => {
    expect(() => parseFontMetadata({ ...meta, id: undefined })).toThrow(FontError)
    expect(() => parseFontMetadata({ ...meta, family: undefined })).toThrow(FontError)
  })

  it('defaults an unknown license type to unknown', () => {
    const parsed = parseFontMetadata({
      ...meta,
      license: { type: 'viral', embeddingAllowed: true },
    })
    expect(parsed.license.type).toBe('unknown')
  })
})

describe('listFonts', () => {
  it('returns a parsed font list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([meta])))
    await expect(listFonts()).resolves.toEqual([meta])
  })

  it('throws FontError with the sidecar message on error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'X', message: 'boom' } }, false, 500)),
    )
    await expect(listFonts()).rejects.toThrow('boom')
  })

  it('throws a friendly error when the sidecar is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, false, 0)))
    await expect(listFonts()).rejects.toThrow(/No sidecar reachable/i)
  })
})

describe('uploadFont', () => {
  it('uploads a file with license metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(meta))
    vi.stubGlobal('fetch', fetchMock)
    const file = new File(['x'], 'Arial.ttf', { type: 'font/ttf' })
    const result = await uploadFont(file, { type: 'open', source: null, embeddingAllowed: true })
    expect(result).toEqual(meta)
    const [, init] = fetchMock.mock.calls[0]
    expect(init?.method).toBe('POST')
    const form = init?.body as FormData
    expect(form.get('file')).toStrictEqual(file)
    expect(JSON.parse(String(form.get('license'))).type).toBe('open')
  })
})

describe('deleteFont', () => {
  it('deletes by id and returns silently on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 } as Response)
    vi.stubGlobal('fetch', fetchMock)
    await expect(deleteFont('font-abc')).resolves.toBeUndefined()
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/fonts/font-abc')
    expect(fetchMock.mock.calls[0][1]?.method).toBe('DELETE')
  })

  it('throws FontError when the sidecar reports a problem', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'NOT_FOUND', message: 'missing' } }, false, 404)),
    )
    await expect(deleteFont('font-abc')).rejects.toThrow('missing')
  })
})