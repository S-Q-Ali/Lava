import { describe, expect, it } from 'vitest'
import { PresetError } from '../services/presets'
import { BUILTIN_CATEGORIES, isCategory, parsePreset, captionStyleFromPreset, type Preset } from './presets'

const good: Preset = {
  id: 'meme',
  label: 'Meme',
  description: 'Classic white-on-black meme caption, uppercase.',
  category: 'Meme',
  fontFamily: 'Impact',
  fontSize: 54,
  primaryColor: '#FFFFFF',
  highlightColor: '#FFFFFF',
  outlineColor: '#000000',
  outlineWidth: 3,
  bold: true,
  uppercase: true,
  alignment: 'bottom',
  licenseRef: 'font-abc123',
  tags: ['memes', 'impact'],
  rtl: false,
  emoji: false,
  karaoke: false,
  wordHighlight: false,
  importantWordPop: false,
  punctuation: false,
  animation: 'none',
}

describe('preset categories', () => {
  it('exposes exactly 13 categories', () => {
    expect(BUILTIN_CATEGORIES).toHaveLength(13)
  })

  it('isCategory accepts every defined category and rejects others', () => {
    for (const category of BUILTIN_CATEGORIES) expect(isCategory(category)).toBe(true)
    expect(isCategory('viral')).toBe(false)
    expect(isCategory(123)).toBe(false)
  })
})

describe('parsePreset', () => {
  it('parses a valid preset including optional fields', () => {
    expect(parsePreset(good)).toEqual(good)
  })

  it('rejects non-objects', () => {
    expect(() => parsePreset(null)).toThrow(PresetError)
    expect(() => parsePreset('x')).toThrow(PresetError)
  })

  it('rejects missing id or label', () => {
    expect(() => parsePreset({ ...good, id: '' })).toThrow(PresetError)
    expect(() => parsePreset({ ...good, label: undefined })).toThrow(PresetError)
  })

  it('rejects unknown categories', () => {
    expect(() => parsePreset({ ...good, category: 'viral' })).toThrow(PresetError)
  })

  it('defaults faculative fields and fixes bad alignment', () => {
    const parsed = parsePreset({ ...good, alignment: 'weird', tags: ['a', 4], licenseRef: null })
    expect(parsed.alignment).toBe('bottom')
    expect(parsed.tags).toEqual(['a'])
    expect(parsed.licenseRef).toBeUndefined()
    expect(parsed.fontSize).toBe(54)
  })

  it('round-trips a valid animation and falls back to none otherwise', () => {
    expect(parsePreset({ ...good, animation: 'kinetic' }).animation).toBe('kinetic')
    expect(parsePreset({ ...good, animation: 'swoosh' }).animation).toBe('none')
    expect(parsePreset({ ...good, animation: null }).animation).toBe('none')
  })

  it('validates a real category from the list even when case differs', () => {
    expect(isCategory('Shorts')).toBe(true)
  })
})

describe('captionStyleFromPreset', () => {
  it('strips registry-only keys, keeping the style fields', () => {
    const style = captionStyleFromPreset(good)
    expect(style).not.toHaveProperty('category')
    expect(style).not.toHaveProperty('licenseRef')
    expect(style.fontSize).toBe(54)
    expect(style.bold).toBe(true)
  })
})