// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { TemplateEditorPanel } from './TemplateEditorPanel'
import { usePresetStore } from '../store/presetStore'
import { useFontStore } from '../store/fontStore'
import { useEditorStore } from '../store/editorStore'
import type { Preset } from '../editor/presets'

const builtin: Preset[] = [
  {
    id: 'normal', label: 'Normal', description: 'Normal', category: 'Custom',
    fontFamily: 'Arial', fontSize: 42, primaryColor: '#FFFFFF', highlightColor: '#FFD54A',
    outlineColor: '#000000', outlineWidth: 2, bold: false, uppercase: false, alignment: 'bottom',
  },
]
const custom: Preset = {
  ...builtin[0], id: 'custom-neon', label: 'Neon', description: 'neon',
  category: 'Custom', fontSize: 99, primaryColor: '#00FF00',
}

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as Response
}

function stubFetch(impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(impl))
}

function findButton(host: HTMLElement, text: string) {
  return Array.from(host.querySelectorAll<HTMLElement>('button')).find((b) => b.textContent?.includes(text))
}

let host: HTMLDivElement
let root: ReturnType<typeof createRoot>
function mount() {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
  act(() => root.render(<TemplateEditorPanel />))
}
function unmount() { act(() => root.unmount()); host.remove() }

beforeEach(() => { usePresetStore.getState().clear(); useEditorStore.getState().reset(); useFontStore.getState().clear() })
afterEach(() => { unmount(); vi.unstubAllGlobals(); usePresetStore.getState().clear(); useEditorStore.getState().reset(); useFontStore.getState().clear() })

function setNumberInput(input: HTMLInputElement, value: number) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, String(value))
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('TemplateEditorPanel', () => {
  beforeEach(() => {
    stubFetch(async (_input, init) => {
      if (init?.method === 'POST') return jsonResponse(custom, true, 201)
      if (init?.method === 'PUT') return jsonResponse({ ...custom, fontSize: 99 }, true, 200)
      return jsonResponse(builtin)
    })
  })

  it('shows a preview reflecting the base preset style', async () => {
    mount()
    await act(async () => {})
    const preview = host.querySelector<HTMLElement>('.template-preview-text')
    expect(preview).not.toBeNull()
    expect(preview!.style.fontSize).toBe('42px')
  })

  it('updates the preview when font size changes', async () => {
    mount()
    await act(async () => {})
    const input = host.querySelector<HTMLInputElement>('input[aria-label="Font size"]')
    expect(input).not.toBeNull()
    act(() => setNumberInput(input!, 70))
    const preview = host.querySelector<HTMLElement>('.template-preview-text')
    expect(preview!.style.fontSize).toBe('70px')
  })

  it('toggles uppercase in the preview', async () => {
    mount()
    await act(async () => {})
    const input = host.querySelector<HTMLInputElement>('input[aria-label="Uppercase"]')
    expect(input).not.toBeNull()
    act(() => { input!.click() })
    const preview = host.querySelector<HTMLElement>('.template-preview-text')
    expect(preview!.style.textTransform).toBe('uppercase')
  })

  it('shows Overwrite only when a custom preset is selected as base', async () => {
    mount()
    await act(async () => {})
    expect(findButton(host, 'Overwrite')).toBeUndefined()
    const select = host.querySelector<HTMLSelectElement>('select[aria-label="Base preset"]')!
    act(() => { select.value = 'custom-neon'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    await act(async () => {})
    expect(findButton(host, 'Overwrite')).not.toBeNull()
  })

  it('calls POST (Save as new) with a custom slug id', async () => {
    let postedBody = ''
    stubFetch(async (_input, init) => {
      if (init?.method === 'POST') { postedBody = String(init.body); return jsonResponse({ ...custom, id: 'custom-saved', fontSize: 42 }, true, 201) }
      return jsonResponse(builtin)
    })
    mount()
    await act(async () => {})
    const labelInput = host.querySelector<HTMLInputElement>('input[aria-label="Label"]')!
    act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(labelInput, 'My preset'); labelInput.dispatchEvent(new Event('input', { bubbles: true })) })
    await act(async () => {})
    const saveBtn = findButton(host, 'Save as new')!
    expect(saveBtn).not.toBeNull()
    act(() => saveBtn.click())
    await act(async () => {})
    const body = JSON.parse(postedBody)
    expect(body.kind).toBe('lava-preset')
    expect(body.preset.id).toMatch(/^custom-/)
    expect(body.preset.label).toBe('My preset')
  })
})