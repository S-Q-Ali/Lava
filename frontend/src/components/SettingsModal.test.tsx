// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import SettingsModal from './SettingsModal'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mount(onClose?: () => void) {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<SettingsModal onClose={onClose ?? (() => {})} />))
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

afterEach(unmount)

describe('SettingsModal', () => {
  it('renders the settings dialog', () => {
    mount()
    expect(host.querySelector('[role="dialog"]')).not.toBeNull()
    expect(host.querySelector('.settings-modal-overlay')).not.toBeNull()
    expect(host.querySelector('.settings-modal-content')).not.toBeNull()
  })

  it('renders SettingsPanel content inside', () => {
    mount()
    expect(host.querySelector('.settings-panel')).not.toBeNull()
  })

  it('renders close button', () => {
    mount()
    const closeBtn = host.querySelector('.settings-modal-close') as HTMLButtonElement
    expect(closeBtn).not.toBeNull()
    expect(closeBtn.getAttribute('aria-label')).toBe('Close settings')
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    mount(onClose)
    const closeBtn = host.querySelector('.settings-modal-close') as HTMLButtonElement
    act(() => closeBtn.click())
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    mount(onClose)
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay background is clicked', () => {
    const onClose = vi.fn()
    mount(onClose)
    const overlay = host.querySelector('.settings-modal-overlay') as HTMLDivElement
    act(() => {
      overlay.click()
    })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when content area is clicked', () => {
    const onClose = vi.fn()
    mount(onClose)
    const content = host.querySelector('.settings-modal-content') as HTMLDivElement
    act(() => {
      content.click()
    })
    expect(onClose).not.toHaveBeenCalled()
  })
})
