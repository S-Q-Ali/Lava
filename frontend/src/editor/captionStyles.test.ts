import { describe, expect, it } from 'vitest'
import {
  CAPTION_STYLES,
  DEFAULT_CAPTION_STYLE_ID,
  getCaptionStyle,
  isCaptionStyleId,
} from './captionStyles'

const REQUIRED_IDS = [
  'normal',
  'word-highlight',
  'karaoke',
  'important-word-pop',
  'punctuation',
  'hook',
  'manga',
  'cinematic',
  'meme',
  'storytelling',
  'urdu',
  'roman-urdu',
  'english',
  'mixed',
  'emoji',
  'arabic',
  'hindi',
  'chinese',
  'japanese',
  'korean',
  'thai',
  'hebrew',
  'bengali',
]

describe('caption style catalog', () => {
  it('covers every supported preset family', () => {
    expect(CAPTION_STYLES.map((s) => s.id).sort()).toEqual([...REQUIRED_IDS].sort())
  })

  it('has unique ids and non-empty labels/descriptions', () => {
    const ids = new Set(CAPTION_STYLES.map((s) => s.id))
    expect(ids.size).toBe(CAPTION_STYLES.length)
    for (const style of CAPTION_STYLES) {
      expect(style.label.length).toBeGreaterThan(0)
      expect(style.description.length).toBeGreaterThan(0)
    }
  })

  it('every preset uses safe fields only', () => {
    for (const style of CAPTION_STYLES) {
      expect(style.fontSize).toBeGreaterThan(0)
      expect(style.outlineWidth).toBeGreaterThanOrEqual(0)
      expect(['bottom', 'middle', 'top']).toContain(style.alignment)
      expect(style.primaryColor).toMatch(/^#[0-9A-F]{6}$/i)
      expect(style.highlightColor).toMatch(/^#[0-9A-F]{6}$/i)
      expect(style.outlineColor).toMatch(/^#[0-9A-F]{6}$/i)
      expect(typeof style.bold).toBe('boolean')
      expect(typeof style.uppercase).toBe('boolean')
    }
  })

  it('urdu preset is rtl; emoji flag is optional and only on the emoji preset', () => {
    expect(getCaptionStyle('urdu').rtl).toBe(true)
    const emojiStyles = CAPTION_STYLES.filter((s) => s.emoji)
    expect(emojiStyles.map((s) => s.id)).toEqual(['emoji'])
  })

  it('karaoke and word-highlight flags are set on their presets', () => {
    expect(getCaptionStyle('karaoke').karaoke).toBe(true)
    expect(getCaptionStyle('word-highlight').wordHighlight).toBe(true)
    expect(getCaptionStyle('important-word-pop').importantWordPop).toBe(true)
    expect(getCaptionStyle('punctuation').punctuation).toBe(true)
  })

  it('named caption families carry their matching animation treatment', () => {
    expect(getCaptionStyle('manga').animation).toBe('manga')
    expect(getCaptionStyle('cinematic').animation).toBe('cinematic')
    expect(getCaptionStyle('meme').animation).toBe('meme')
    expect(getCaptionStyle('storytelling').animation).toBe('storytelling')
  })

  it('animation is unset (none) by default on the remaining presets', () => {
    for (const style of CAPTION_STYLES) {
      if (['manga', 'cinematic', 'meme', 'storytelling'].includes(style.id)) continue
      expect(style.animation ?? 'none').toBe('none')
    }
  })

  it('getCaptionStyle falls back to the default for unknown ids', () => {
    expect(getCaptionStyle('nope').id).toBe(DEFAULT_CAPTION_STYLE_ID)
    expect(getCaptionStyle(DEFAULT_CAPTION_STYLE_ID).id).toBe('normal')
  })

  it('isCaptionStyleId validates known ids only', () => {
    expect(isCaptionStyleId('meme')).toBe(true)
    expect(isCaptionStyleId('nope')).toBe(false)
  })
})