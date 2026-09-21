import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useManhwaStore } from './manhwaStore'
import {
  listStrips,
  uploadStrip,
  getStrip,
  correctStrip,
  redetectStrip,
  deleteStrip,
  fetchGroups,
  deleteGroup,
} from '../services/manhwa'

vi.mock('../services/manhwa', () => ({
  listStrips: vi.fn(),
  uploadStrip: vi.fn(),
  getStrip: vi.fn(),
  correctStrip: vi.fn(),
  redetectStrip: vi.fn(),
  deleteStrip: vi.fn(),
  fetchGroups: vi.fn().mockResolvedValue([]),
  deleteGroup: vi.fn(),
}))

const stripSummary = {
  sourceId: 'sabc123',
  sourceFile: 'strip.png',
  width: 800,
  height: 2400,
  mime: 'image/png',
  panelCount: 3,
  correctedCount: 1,
}

const stripDetail = {
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
  ],
}

function resetStore() {
  useManhwaStore.setState({
    status: { phase: 'idle' },
    strips: [],
    groups: [],
    currentId: null,
    detail: null,
  })
}

describe('manhwaStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  afterEach(() => {
    resetStore()
  })

  it('refresh loads strips and sets idle', async () => {
    vi.mocked(listStrips).mockResolvedValue([stripSummary])
    await useManhwaStore.getState().refresh()
    const state = useManhwaStore.getState()
    expect(state.status).toEqual({ phase: 'idle' })
    expect(state.strips).toHaveLength(1)
    expect(state.strips[0].sourceId).toBe('sabc123')
  })

  it('refresh sets error on failure', async () => {
    vi.mocked(listStrips).mockRejectedValue(new Error('Network down'))
    await useManhwaStore.getState().refresh()
    const state = useManhwaStore.getState()
    expect(state.status).toEqual({ phase: 'error', error: 'Network down' })
  })

  it('select loads detail', async () => {
    vi.mocked(getStrip).mockResolvedValue(stripDetail)
    await useManhwaStore.getState().select('sabc123')
    const state = useManhwaStore.getState()
    expect(state.currentId).toBe('sabc123')
    expect(state.detail?.sourceId).toBe('sabc123')
    expect(state.detail?.panels).toHaveLength(1)
  })

  it('select(null) clears detail', async () => {
    await useManhwaStore.getState().select(null)
    const state = useManhwaStore.getState()
    expect(state.currentId).toBeNull()
    expect(state.detail).toBeNull()
  })

  it('upload sets uploading then idle with detail', async () => {
    vi.mocked(uploadStrip).mockResolvedValue(stripDetail)
    vi.mocked(listStrips).mockResolvedValue([stripSummary])
    const file = new File(['x'], 'strip.png', { type: 'image/png' })
    await useManhwaStore.getState().upload(file)
    const state = useManhwaStore.getState()
    expect(state.status).toEqual({ phase: 'idle' })
    expect(state.currentId).toBe('sabc123')
    expect(state.detail?.sourceId).toBe('sabc123')
    expect(state.strips).toHaveLength(1)
  })

  it('upload sets error on failure', async () => {
    vi.mocked(uploadStrip).mockRejectedValue(new Error('Upload failed'))
    const file = new File(['x'], 'strip.png', { type: 'image/png' })
    await useManhwaStore.getState().upload(file)
    const state = useManhwaStore.getState()
    expect(state.status).toEqual({ phase: 'error', error: 'Upload failed' })
  })

  it('apply corrects the current strip', async () => {
    useManhwaStore.setState({ currentId: 'sabc123' })
    vi.mocked(correctStrip).mockResolvedValue(stripDetail)
    vi.mocked(listStrips).mockResolvedValue([stripSummary])
    await useManhwaStore.getState().apply({ op: 'delete', panelId: 'p1' })
    const state = useManhwaStore.getState()
    expect(state.detail?.sourceId).toBe('sabc123')
    expect(correctStrip).toHaveBeenCalledWith('sabc123', { op: 'delete', panelId: 'p1' })
  })

  it('apply does nothing when no current strip', async () => {
    await useManhwaStore.getState().apply({ op: 'reset' })
    expect(correctStrip).not.toHaveBeenCalled()
  })

  it('redetect re-detects the current strip', async () => {
    useManhwaStore.setState({ currentId: 'sabc123' })
    vi.mocked(redetectStrip).mockResolvedValue(stripDetail)
    vi.mocked(listStrips).mockResolvedValue([stripSummary])
    await useManhwaStore.getState().redetect()
    const state = useManhwaStore.getState()
    expect(state.detail?.sourceId).toBe('sabc123')
  })

  it('remove deletes and clears current if selected', async () => {
    useManhwaStore.setState({ currentId: 'sabc123', detail: stripDetail })
    vi.mocked(listStrips).mockResolvedValue([])
    await useManhwaStore.getState().remove('sabc123')
    const state = useManhwaStore.getState()
    expect(deleteStrip).toHaveBeenCalledWith('sabc123')
    expect(state.currentId).toBeNull()
    expect(state.detail).toBeNull()
    expect(state.strips).toHaveLength(0)
  })

  it('remove keeps current if different strip deleted', async () => {
    useManhwaStore.setState({ currentId: 'sabc123', detail: stripDetail })
    vi.mocked(listStrips).mockResolvedValue([stripSummary])
    await useManhwaStore.getState().remove('sother')
    const state = useManhwaStore.getState()
    expect(state.currentId).toBe('sabc123')
    expect(state.detail).toEqual(stripDetail)
  })
})