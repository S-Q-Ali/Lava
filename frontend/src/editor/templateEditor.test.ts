// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  draftFromPreset,
  customIdForLabel,
  finalizeDraft,
  resolveCaptionStyle,
  updateDraft,
} from './templateEditor'
import type { Preset } from './presets'
import { getCaptionStyle, DEFAULT_CAPTION_STYLE_ID } from './captionStyles'

const BASE: Preset = {
  id: 'custom-base',
  label: 'Base preset',
  description: 'A base',
  category: 'Custom',
  fontFamily: 'Arial',
  fontSize: 40,
  primaryColor: '#FFFFFF',
  highlightColor: '#FFD54A',
  outlineColor: '#000000',
  outlineWidth: 2,
  bold: false,
  uppercase: false,
  alignment: 'bottom',
  rtl: false,
  emoji: false,
  karaoke: false,
  wordHighlight: false,
  importantWordPop: false,
  punctuation: false,
}

describe('draftFromPreset', () => {
  it('copies style + metadata fields into a draft', () => {
    const draft = draftFromPreset(BASE)
    expect(draft).toMatchObject({
      label: 'Base preset',
      description: 'A base',
      fontFamily: 'Arial',
      fontSize: 40,
      primaryColor: '#FFFFFF',
      alignment: 'bottom',
    })
  })

  it('normalizes missing boolean flags to false', () => {
    const minimal = { ...BASE, rtl: undefined as unknown as boolean }
    const draft = draftFromPreset(minimal)
    expect(draft.rtl).toBe(false)
  })
})

describe('updateDraft', () => {
  it('returns a new object and never mutates the draft', () => {
    const draft = draftFromPreset(BASE)
    const next = updateDraft(draft, { fontSize: 50 })
    expect(next).not.toBe(draft)
    expect(draft.fontSize).toBe(40)
    expect(next.fontSize).toBe(50)
  })

  it('clamps font size and outline width to sane bounds', () => {
    const negative = updateDraft(draftFromPreset(BASE), { fontSize: -5, outlineWidth: -1 })
    expect(negative.fontSize).toBe(8)
    expect(negative.outlineWidth).toBe(0)
    const huge = updateDraft(draftFromPreset(BASE), { fontSize: 9999 })
    expect(huge.fontSize).toBe(240)
  })

  it('coerces booleans for flag fields', () => {
    const next = updateDraft(draftFromPreset(BASE), { karaoke: true, uppercase: true })
    expect(next.karaoke).toBe(true)
    expect(next.uppercase).toBe(true)
  })
})

describe('customIdForLabel', () => {
  it('produces a backend-compatible custom slug', () => {
    expect(customIdForLabel('My Urdu Preset!')).toBe('custom-my-urdu-preset')
  })

  it('is lowercase ascii dashes only and always prefixed', () => {
    const id = customIdForLabel('کیا 100% Top؟')
    expect(id).toMatch(/^custom-[0-9a-z-]+$/)
  })

  it('falls back to a stable id for an empty label', () => {
    expect(customIdForLabel('   ')).toMatch(/^custom-[0-9a-z-]+$/)
  })
})

describe('finalizeDraft', () => {
  it('creates a new Custom preset with a slug id from the label', () => {
    const preset = finalizeDraft(draftFromPreset(BASE), {})
    expect(preset.id).toBe('custom-base-preset')
    expect(preset.category).toBe('Custom')
    expect(preset.label).toBe('Base preset')
    expect(preset.fontSize).toBe(40)
  })

  it('keeps an explicit id for overwrite flows', () => {
    const preset = finalizeDraft(draftFromPreset(BASE), { id: 'custom-base' })
    expect(preset.id).toBe('custom-base')
  })
})

describe('resolveCaptionStyle', () => {
  it('resolves a custom preset id to its real style', () => {
    const overrides: Preset = {
      ...BASE,
      id: 'custom-neon',
      fontFamily: 'Impact',
      fontSize: 99,
      primaryColor: '#00FF00',
    }
    const style = resolveCaptionStyle('custom-neon', [overrides])
    expect(style.fontSize).toBe(99)
    expect(style.primaryColor).toBe('#00FF00')
  })

  it('resolves built-in preset ids through the registry', () => {
    const meme = getCaptionStyle('meme')
    const registryMeme: Preset = { ...meme, id: 'meme', category: 'Meme' }
    const style = resolveCaptionStyle('meme', [registryMeme])
    expect(style).toEqual(meme)
  })

  it('falls back to the default style for unknown ids', () => {
    const style = resolveCaptionStyle('nope-123', [])
    expect(style.id).toBe(DEFAULT_CAPTION_STYLE_ID)
  })

  it('handles empty preset lists without custom ids gracefully', () => {
    const style = resolveCaptionStyle('normal', [])
    expect(style.id).toBe('normal')
  })
})