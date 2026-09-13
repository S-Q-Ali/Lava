import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ManhwaError,
  applyCorrection,
  deleteStrip,
  exportUrl,
  getStrip,
  listStrips,
  manhwaBase,
  parseDetectResult,
  parseStripDetailList,
  parseStripSummaryList,
  panelUrl,
  redetectStrip,
  sourceUrl,
  uploadStrip,
} from './manhwa'

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response
}

function errorResponse(code: string, message: string, status = 422): Response {
  return jsonResponse({ error: { code, message } }, false, status)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const summary = {
  sourceId: 's1',
  sourceFile: 'strip1.png',
  width: 400,
  height: 1200,
  mime: 'png',
  panelCount: 3,
  correctedCount: 1,
}

const panel = {
  id: 'p1',
  sourceId: 's1',
  x: 0,
  y: 0,
  w: 400,
  h: 400,
  confidence: 0.92,
  order: 1,
  userCorrected: false,
}

const detail = { ...summary, panels: [panel] }

describe('manhwaBase', () => {
  it('points at the /api/manhwa namespace of the sidecar', () => {
    expect(manhwaBase('http://local:7860')).toBe('http://local:7860/api/manhwa')
  })
})

describe('parsers', () => {
  it('normalizes a strips summary list', () => {
    const strips = parseStripSummaryList({ strips: [summary] })
    expect(strips[0]).toMatchObject({
      sourceId: 's1',
      panelCount: 3,
      correctedCount: 1,
    })
    expect(parseStripSummaryList({ strips: [] })).toEqual([])
  })

  it('rejects a list without a strips array', () => {
    expect(() => parseStripSummaryList({ nope: 1 })).toThrow(ManhwaError)
  })

  it('normalizes a strip detail with panels', () => {
    const parsed = parseStripDetailList(detail)
    expect(parsed.sourceId).toBe('s1')
    expect(parsed.panels[0]).toMatchObject({ id: 'p1', y: 0, confidence: 0.92, userCorrected: false })
  })

  it('passes through an empty panel list (reset)', () => {
    expect(parseStripDetailList({ ...detail, panels: [] }).panels).toEqual([])
  })

  it('parses an upload/detect result into a detail with panels', () => {
    const result = {
      sourceId: 's1',
      sourceFile: 'strip1.png',
      width: 400,
      height: 1200,
      mime: 'png',
      panels: [panel],
      saved: true,
      cachePath: '/tmp/x',
    }
    const parsed = parseDetectResult(result)
    expect(parsed.sourceId).toBe('s1')
    expect(parsed.panels).toHaveLength(1)
  })
})

describe('listStrips', () => {
  it('GETs the strips collection', async () => {
    const send = vi.fn((_url: string, _init?: RequestInit) => jsonResponse({ strips: [summary] }))
    vi.stubGlobal('fetch', send)
    const strips = await listStrips('http://local:7860')
    expect(strips).toHaveLength(1)
    expect(send.mock.calls[0][0]).toBe('http://local:7860/api/manhwa/strips')
  })
})

describe('uploadStrip', () => {
  it('POSTs the file as multipart and returns the detect result', async () => {
    const send = vi.fn((_url: string, _init?: RequestInit) => jsonResponse({ ...detail, saved: true }, true, 201))
    vi.stubGlobal('fetch', send)
    const file = new File(['x'], 'strip.png', { type: 'image/png' })
    const result = await uploadStrip('http://local:7860', file)
    expect(result.sourceId).toBe('s1')
    const [url, init] = send.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://local:7860/api/manhwa/strips')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)
  })

  it('throws a typed error with the API code on failure', async () => {
    vi.stubGlobal('fetch', vi.fn(() => errorResponse('MANHWA_DETECT_FAILED', 'panel detection failed: nope')))
    const file = new File(['x'], 'bad.png', { type: 'image/png' })
    const err = await uploadStrip('http://local:7860', file).catch((e) => e)
    expect(err).toBeInstanceOf(ManhwaError)
    expect((err as ManhwaError).code).toBe('MANHWA_DETECT_FAILED')
    expect((err as ManhwaError).message).toContain('nope')
  })
})

describe('getStrip and applyCorrection', () => {
  it('GETs detail for a strip id', async () => {
    const send = vi.fn((_url: string) => jsonResponse(detail))
    vi.stubGlobal('fetch', send)
    const parsed = await getStrip('http://local:7860', 's1')
    expect(parsed.sourceId).toBe('s1')
    expect(send.mock.calls[0][0]).toBe('http://local:7860/api/manhwa/strips/s1')
  })

  it('PATCHes an op and returns the updated detail', async () => {
    const send = vi.fn((_url: string, _init?: RequestInit) => jsonResponse({ ...detail, panels: [panel, { ...panel, id: 'p2', y: 400, order: 2 }] }))
    vi.stubGlobal('fetch', send)
    const parsed = await applyCorrection('http://local:7860', 's1', { op: 'split', panelId: 'p1', y: 400 })
    expect(parsed.panels).toHaveLength(2)
    const [url, init] = send.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://local:7860/api/manhwa/strips/s1/panels')
    expect(init.method).toBe('PATCH')
    expect((init.body as string).length).toBeGreaterThan(0)
  })
})

describe('redetectStrip', () => {
  it('POSTs redetect and brings back fresh panels', async () => {
    const send = vi.fn((_url: string, _init?: RequestInit) => jsonResponse({ ...detail, saved: true }))
    vi.stubGlobal('fetch', send)
    const result = await redetectStrip('http://local:7860', 's1')
    expect(result.panels).toHaveLength(1)
    expect(send.mock.calls[0][0]).toBe('http://local:7860/api/manhwa/strips/s1/redetect')
  })
})

describe('deleteStrip', () => {
  it('accepts a 204 and returns true', async () => {
    const send = vi.fn((_url: string, _init?: RequestInit) => jsonResponse(null, true, 204))
    vi.stubGlobal('fetch', send)
    await expect(deleteStrip('http://local:7860', 's1')).resolves.toBe(true)
  })

  it('throws on missing strip', async () => {
    vi.stubGlobal('fetch', vi.fn(() => errorResponse('NOT_FOUND', 'no manhwa strip', 404)))
    await expect(deleteStrip('http://local:7860', 'nope')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})

describe('asset urls', () => {
  it('builds source, panel and export links', () => {
    const base = manhwaBase('http://local:7860')
    expect(sourceUrl(base, 's1')).toBe('http://local:7860/api/manhwa/strips/s1/source')
    expect(panelUrl(base, 's1', 'p2')).toBe('http://local:7860/api/manhwa/strips/s1/panels/p2')
    expect(exportUrl(base, 's1', 'png')).toBe('http://local:7860/api/manhwa/strips/s1/export?format=png')
    expect(exportUrl(base, 's1', 'jpg')).toBe('http://local:7860/api/manhwa/strips/s1/export?format=jpg')
  })
})