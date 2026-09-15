// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useEditorStore } from '../store/editorStore'
import ExtractorPanel from './ExtractorPanel'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mount() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<ExtractorPanel />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

beforeEach(() => {
  useEditorStore.getState().reset()
})

afterEach(unmount)

describe('ExtractorPanel', () => {
  it('renders header with icon and title', () => {
    mount()
    expect(host.textContent).toContain('📄')
    expect(host.textContent).toContain('Extractor')
  })

  it('renders upload zone with format hints', () => {
    mount()
    expect(host.textContent).toContain('Drop presentation files')
    expect(host.textContent).toContain('PDF, PPT, PPTX, KEY, ODP')
  })

  it('renders file input accepting presentation formats', () => {
    mount()
    const input = host.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.accept).toContain('.pdf')
    expect(input.accept).toContain('.pptx')
    expect(input.multiple).toBe(true)
  })

  it('hides toolbar and extract button when no pages loaded', () => {
    mount()
    expect(host.textContent).not.toContain('selected')
    expect(host.querySelector('.extractor-extract-btn')).toBeNull()
    expect(host.querySelector('.extractor-toolbar')).toBeNull()
  })

  it('has correct upload zone label structure', () => {
    mount()
    const label = host.querySelector('.extractor-upload-zone')
    expect(label).not.toBeNull()
    const input = label?.querySelector('input[type="file"]')
    expect(input).not.toBeNull()
  })

  it('shows upload icon and text', () => {
    mount()
    expect(host.textContent).toContain('📎')
    expect(host.textContent).toContain('browse')
  })
})
