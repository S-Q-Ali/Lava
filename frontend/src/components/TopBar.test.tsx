// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { useEditorStore } from '../store/editorStore'
import TopBar from './TopBar'

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>

function mount(props?: { onOpenSettings?: () => void }) {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<TopBar onOpenSettings={props?.onOpenSettings} />))
}

function mountWithProps(props: { onOpenSettings?: () => void }) {
  mount(props)
}

function unmount() {
  act(() => root.unmount())
  host.remove()
}

beforeEach(() => {
  useEditorStore.getState().reset()
})

afterEach(unmount)

describe('TopBar', () => {
  it('renders the brand title and subtitle', () => {
    mount()
    expect(host.textContent).toContain('AI Studio')
    expect(host.textContent).toContain('Create · Edit · Inspire')
  })

  it('renders the default project name', () => {
    mount()
    expect(host.textContent).toContain('Untitled Project')
  })

  it('renders undo and redo buttons', () => {
    mount()
    const buttons = host.querySelectorAll('button')
    const titles = Array.from(buttons).map((b) => b.getAttribute('title'))
    expect(titles).toContain('Undo')
    expect(titles).toContain('Redo')
  })

  it('renders the saved status indicator', () => {
    mount()
    expect(host.textContent).toContain('Saved')
  })

  it('renders the aspect ratio selector with 16:9 default', () => {
    mount()
    const select = host.querySelector('select')
    expect(select).not.toBeNull()
    expect(select?.value).toBe('16:9')
  })

  it('renders Preview and Export buttons', () => {
    mount()
    expect(host.textContent).toContain('Preview')
    expect(host.textContent).toContain('Export')
  })

  it('renders profile and settings buttons', () => {
    mount()
    const buttons = host.querySelectorAll('button')
    const titles = Array.from(buttons).map((b) => b.getAttribute('title'))
    expect(titles).toContain('Profile')
    expect(titles).toContain('Settings')
  })

  it('opens profile dropdown on click', () => {
    mount()
    const profileBtn = Array.from(host.querySelectorAll('button')).find(
      (b) => b.getAttribute('title') === 'Profile',
    ) as HTMLButtonElement
    expect(profileBtn).not.toBeNull()
    act(() => profileBtn.click())
    expect(host.textContent).toContain('Profile')
    expect(host.textContent).toContain('Account')
  })

  it('calls onOpenSettings when settings button is clicked', () => {
    const onOpenSettings = vi.fn()
    mountWithProps({ onOpenSettings })
    const settingsBtn = Array.from(host.querySelectorAll('button')).find(
      (b) => b.getAttribute('title') === 'Settings',
    ) as HTMLButtonElement
    expect(settingsBtn).not.toBeNull()
    act(() => settingsBtn.click())
    expect(onOpenSettings).toHaveBeenCalledTimes(1)
  })

  it('allows editing the project name', () => {
    mount()
    const nameBtn = host.querySelector('.topbar-v2-project-name') as HTMLButtonElement
    expect(nameBtn).not.toBeNull()
    act(() => nameBtn.click())
    const input = host.querySelector('.topbar-v2-title-input') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.value).toBe('Untitled Project')
  })
})
