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

  it('renders ManhwaPanel when activeNav is ai-tools', () => {
    mount('ai-tools')
    expect(host.querySelector('.manhwa-panel')).not.toBeNull()
  })

  it('renders CaptionPanel when activeNav is captions', () => {
    mount('captions')
    expect(host.querySelector('.caption-panel')).not.toBeNull()
  })

  it('renders PresetPanel when activeNav is templates', () => {
    mount('templates')
    expect(host.querySelector('.preset-panel')).not.toBeNull()
  })

  it('renders placeholder for home', () => {
    mount('home')
    expect(host.textContent).toContain('Coming soon')
  })

  it('renders ExtractorPanel when activeNav is projects', () => {
    mount('projects')
    expect(host.querySelector('.extractor-panel')).not.toBeNull()
    expect(host.textContent).toContain('Extractor')
  })

  it('renders placeholder for export', () => {
    mount('export')
    expect(host.textContent).toContain('Coming soon')
  })
})
