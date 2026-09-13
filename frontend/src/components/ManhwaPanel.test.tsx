// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import ManhwaPanel from './ManhwaPanel'
import { useManhwaStore } from '../store/manhwaStore'

vi.mock('../services/manhwa', () => ({
  listStrips: vi.fn(),
  uploadStrip: vi.fn(),
  getStrip: vi.fn(),
  correctStrip: vi.fn(),
  redetectStrip: vi.fn(),
  deleteStrip: vi.fn(),
  exportUrl: (id: string, fmt: string) => `http://localhost/api/manhwa/strips/${id}/export?format=${fmt}`,
  panelImageUrl: (sid: string, pid: string) => `http://localhost/api/manhwa/strips/${sid}/panels/${pid}`,
  sourceImageUrl: (id: string) => `http://localhost/api/manhwa/strips/${id}/source`,
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

function findByText(host: HTMLElement, text: string): HTMLElement | null {
  return (
    Array.from(host.querySelectorAll<HTMLElement>('*')).find(
      (el) => el.textContent?.trim() === text && !el.querySelector('*'),
    ) ?? null
  )
}

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mount() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<ManhwaPanel />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

function resetStore() {
  useManhwaStore.setState({
    status: { phase: 'idle' },
    strips: [],
    currentId: null,
    detail: null,
  })
}

describe('ManhwaPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  afterEach(() => {
    unmount()
    resetStore()
  })

  it('shows empty state when no strips exist', async () => {
    const { listStrips } = await import('../services/manhwa')
    vi.mocked(listStrips).mockResolvedValue([])
    mount()
    await act(async () => {})
    expect(findByText(host, 'No strips yet. Drop a long vertical image to begin.')).not.toBeNull()
  })

  it('shows the dropzone button', async () => {
    const { listStrips } = await import('../services/manhwa')
    vi.mocked(listStrips).mockResolvedValue([])
    mount()
    await act(async () => {})
    const button = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Drop or pick a long strip'),
    )
    expect(button).not.toBeNull()
  })

  it('lists strips after loading', async () => {
    const { listStrips } = await import('../services/manhwa')
    vi.mocked(listStrips).mockResolvedValue([stripSummary])
    mount()
    await act(async () => {})
    expect(findByText(host, 'strip.png')).not.toBeNull()
    expect(findByText(host, '3 panels · 1 corrected')).not.toBeNull()
  })

  it('shows panel detail when a strip is selected', async () => {
    const { listStrips } = await import('../services/manhwa')
    vi.mocked(listStrips).mockResolvedValue([stripSummary])
    useManhwaStore.setState({ currentId: 'sabc123', detail: stripDetail })
    mount()
    await act(async () => {})
    expect(findByText(host, '95%')).not.toBeNull()
    expect(findByText(host, '35%')).not.toBeNull()
    expect(findByText(host, 'corrected')).not.toBeNull()
  })

  it('shows error state', async () => {
    const { listStrips } = await import('../services/manhwa')
    vi.mocked(listStrips).mockRejectedValue(new Error('Network down'))
    mount()
    await act(async () => {})
    expect(findByText(host, 'Network down')).not.toBeNull()
  })

  it('shows export success message after export', async () => {
    const { listStrips } = await import('../services/manhwa')
    vi.mocked(listStrips).mockResolvedValue([stripSummary])
    useManhwaStore.setState({ currentId: 'sabc123', detail: stripDetail })
    mount()
    await act(async () => {})
    const exportBtn = Array.from(host.querySelectorAll('button')).find((b) => b.textContent === 'Export')
    act(() => exportBtn?.click())
    await act(async () => {})
    expect(findByText(host, 'Exported 2 panels as PNG.')).not.toBeNull()
  })

  it('calls delete when the strip delete button is clicked', async () => {
    const { listStrips, deleteStrip } = await import('../services/manhwa')
    vi.mocked(listStrips).mockResolvedValue([stripSummary])
    vi.mocked(deleteStrip).mockResolvedValue(undefined)
    mount()
    await act(async () => {})
    const deleteBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.getAttribute('aria-label')?.includes('Remove strip.png'),
    )
    act(() => deleteBtn?.click())
    await act(async () => {})
    expect(deleteStrip).toHaveBeenCalledWith('sabc123')
  })

  it('shows low confidence styling for panels below 50%', async () => {
    const { listStrips } = await import('../services/manhwa')
    vi.mocked(listStrips).mockResolvedValue([stripSummary])
    useManhwaStore.setState({ currentId: 'sabc123', detail: stripDetail })
    mount()
    await act(async () => {})
    const lowConf = Array.from(host.querySelectorAll('.manhwa-panel-confidence.low'))
    expect(lowConf.length).toBe(1)
    expect(lowConf[0]?.textContent).toBe('35%')
  })
})