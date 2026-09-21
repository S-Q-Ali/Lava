// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import ManhwaPanel from './ManhwaPanel'
import { useManhwaStore } from '../store/manhwaStore'

vi.mock('../services/manhwa', () => ({
  listStrips: vi.fn(),
  uploadStrip: vi.fn(),
  uploadPdf: vi.fn(),
  uploadStripOnly: vi.fn(),
  uploadPdfOnly: vi.fn(),
  getStrip: vi.fn(),
  correctStrip: vi.fn(),
  redetectStrip: vi.fn(),
  deleteStrip: vi.fn(),
  detectStrip: vi.fn(),
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
    resultsModalOpen: false,
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

  it('shows the dropzone', () => {
    mount()
    const dropzone = host.querySelector('.manhwa-dropzone')
    expect(dropzone).not.toBeNull()
  })

  it('shows dropzone label text', () => {
    mount()
    expect(findByText(host, 'Drop or pick a strip / PDF')).not.toBeNull()
  })

  it('shows error state', () => {
    useManhwaStore.setState({ status: { phase: 'error', error: 'Network down' } })
    mount()
    expect(findByText(host, 'Network down')).not.toBeNull()
  })

  it('shows View Results button when strips exist', () => {
    useManhwaStore.setState({ strips: [stripSummary] })
    mount()
    expect(findByText(host, 'View Results')).not.toBeNull()
  })

  it('shows panel count stats when strips exist', () => {
    useManhwaStore.setState({ strips: [stripSummary] })
    mount()
    expect(findByText(host, '1 page · 3 panels')).not.toBeNull()
  })

  it('does not show View Results when no strips', () => {
    mount()
    expect(findByText(host, 'View Results')).toBeNull()
  })

  it('does not show stats when no strips', () => {
    mount()
    expect(host.querySelector('.manhwa-stats')).toBeNull()
  })
})
