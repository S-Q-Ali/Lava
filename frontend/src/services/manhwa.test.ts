import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  listStrips,
  uploadStrip,
  getStrip,
  correctStrip,
  redetectStrip,
  deleteStrip,
  exportUrl,
  panelImageUrl,
  sourceImageUrl,
  ManhwaError,
  type ManhwaStripSummary,
  type ManhwaStripDetail,
} from './manhwa'

const stripSummary: ManhwaStripSummary = {
  sourceId: 'sabc123',
  sourceFile: 'strip.png',
  width: 800,
  height: 2400,
  mime: 'image/png',
  panelCount: 3,
  correctedCount: 1,
}

const stripDetail: ManhwaStripDetail = {
  sourceId: 'sabc123',
  sourceFile: 'strip.png',
  width: 800,
  height: 2400,
  mime: 'image/png',
  panels: [
    {
      id: 'p1',
      sourceId: 'sabc123',
      x: 0,
      y: 0,
      w: 800,
      h: 800,
      confidence: 0.95,
      order: 1,
      userCorrected: false,
    },
    {
      id: 'p2',
      sourceId: 'sabc123',
      x: 0,
      y: 800,
      w: 800,
      h: 800,
      confidence: 0.35,
      order: 2,
      userCorrected: true,
    },
  ],
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response
}

describe('manhwa service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('listStrips parses a valid strips list', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ strips: [stripSummary] }))
    const result = await listStrips()
    expect(result).toHaveLength(1)
    expect(result[0].sourceId).toBe('sabc123')
    expect(result[0].panelCount).toBe(3)
    expect(result[0].correctedCount).toBe(1)
  })

  it('listStrips throws on unexpected shape', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}))
    await expect(listStrips()).rejects.toThrow(ManhwaError)
  })

  it('uploadStrip sends multipart and parses detail', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(stripDetail))
    const file = new File(['x'], 'strip.png', { type: 'image/png' })
    const result = await uploadStrip(file)
    expect(result.sourceId).toBe('sabc123')
    expect(result.panels).toHaveLength(2)
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[1]?.method).toBe('POST')
    expect(call[1]?.body).toBeInstanceOf(FormData)
  })

  it('getStrip fetches and parses detail', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(stripDetail))
    const result = await getStrip('sabc123')
    expect(result.sourceId).toBe('sabc123')
    expect(result.panels[0].confidence).toBe(0.95)
    expect(result.panels[1].userCorrected).toBe(true)
  })

  it('correctStrip sends PATCH with JSON op', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(stripDetail))
    const result = await correctStrip('sabc123', { op: 'delete', panelId: 'p1' })
    expect(result.sourceId).toBe('sabc123')
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[1]?.method).toBe('PATCH')
    expect(JSON.parse(String(call[1]?.body))).toEqual({ op: 'delete', panelId: 'p1' })
  })

  it('redetectStrip sends POST', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(stripDetail))
    const result = await redetectStrip('sabc123')
    expect(result.sourceId).toBe('sabc123')
    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe('POST')
  })

  it('deleteStrip sends DELETE', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 204, json: async () => null } as Response)
    await deleteStrip('sabc123')
    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe('DELETE')
  })

  it('exportUrl returns the correct URL', () => {
    expect(exportUrl('sabc123')).toContain('/api/manhwa/strips/sabc123/export?format=png')
    expect(exportUrl('sabc123', 'jpg')).toContain('format=jpg')
  })

  it('panelImageUrl returns the correct URL', () => {
    expect(panelImageUrl('sabc123', 'p1')).toContain('/api/manhwa/strips/sabc123/panels/p1')
  })

  it('sourceImageUrl returns the correct URL', () => {
    expect(sourceImageUrl('sabc123')).toContain('/api/manhwa/strips/sabc123/source')
  })

  it('throws ManhwaError with code on API error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'MANHWA_DETECT_FAILED', message: 'Detection failed.' } }, false, 422),
    )
    await expect(getStrip('sabc123')).rejects.toThrow(ManhwaError)
    await expect(getStrip('sabc123')).rejects.toMatchObject({ code: 'MANHWA_DETECT_FAILED' })
  })

  it('parses panel with defaults for missing fields', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        sourceId: 'sabc123',
        sourceFile: 'strip.png',
        width: 800,
        height: 2400,
        mime: 'image/png',
        panels: [{ id: 'p1' }],
      }),
    )
    const result = await getStrip('sabc123')
    expect(result.panels[0]).toEqual({
      id: 'p1',
      sourceId: '',
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      confidence: 0,
      order: 0,
      userCorrected: false,
    })
  })
})

describe('uploadPdf', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('uploads PDF and returns strips', async () => {
    const pdfResponse = {
      strips: [
        { ...stripDetail, sourceId: 'spdf1', sourceFile: 'page_001.png' },
        { ...stripDetail, sourceId: 'spdf2', sourceFile: 'page_002.png' },
      ],
    }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(pdfResponse))
    const file = new File(['dummy'], 'chapter.pdf', { type: 'application/pdf' })
    const { uploadPdf } = await import('./manhwa')
    const result = await uploadPdf(file)
    expect(result.strips).toHaveLength(2)
    expect(result.strips[0].sourceId).toBe('spdf1')
    expect(result.strips[1].sourceId).toBe('spdf2')
  })

  it('sends POST with FormData', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ strips: [] }))
    const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' })
    const { uploadPdf } = await import('./manhwa')
    await uploadPdf(file)
    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe('POST')
    expect(vi.mocked(fetch).mock.calls[0][1]?.body).toBeInstanceOf(FormData)
  })

  it('throws ManhwaError on API error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'PDF_EXTRACT_FAILED', message: 'Failed.' } }, false, 422),
    )
    const file = new File(['dummy'], 'bad.pdf', { type: 'application/pdf' })
    const { uploadPdf } = await import('./manhwa')
    await expect(uploadPdf(file)).rejects.toThrow(ManhwaError)
  })
})