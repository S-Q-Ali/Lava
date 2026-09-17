// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useEditorStore } from '../store/editorStore'
import LeftWorkspace from './LeftWorkspace'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mount(activeNav: string) {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<LeftWorkspace activeNav={activeNav} />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

beforeEach(() => {
  useEditorStore.getState().reset()
})

afterEach(unmount)

describe('LeftWorkspace', () => {
  it('renders MediaPanel when activeNav is media', () => {
    mount('media')
    expect(host.querySelector('.media-panel')).not.toBeNull()
  })

  it('renders ExtractorPanel with tabs when activeNav is ai-tools', () => {
    mount('ai-tools')
    expect(host.querySelector('.ai-tools-tabs')).not.toBeNull()
    expect(host.querySelector('.extractor-panel')).not.toBeNull()
  })

  it('renders CaptionPanel when activeNav is captions', () => {
    mount('captions')
    expect(host.querySelector('.caption-panel')).not.toBeNull()
  })

  it('renders PresetPanel when activeNav is templates', () => {
    mount('templates')
    expect(host.querySelector('.preset-panel')).not.toBeNull()
  })

  it('renders useful home guidance', () => {
    mount('home')
    expect(host.textContent).toContain('Start by importing media')
  })

  it('renders project save guidance', () => {
    mount('projects')
    expect(host.textContent).toContain('local .lava.json files')
  })

  it('renders ExportPanel when activeNav is export', () => {
    mount('export')
    expect(host.querySelector('.export-panel')).not.toBeNull()
  })
})
