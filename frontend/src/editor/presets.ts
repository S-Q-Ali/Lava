import { PresetError } from '../services/presets'
import type { CaptionStyle } from './captionStyles'

export const BUILTIN_CATEGORIES = [
  'Trending',
  'New',
  'Shorts',
  'Reels',
  'YouTube',
  'Anime',
  'Manhwa',
  'Storytelling',
  'Cinematic',
  'Motivation',
  'Meme',
  'Documentary',
  'Custom',
] as const

export type PresetCategory = (typeof BUILTIN_CATEGORIES)[number]

export interface Preset extends CaptionStyle {
  category: PresetCategory
  presetVersion?: string
  tags?: string[]
  licenseRef?: string
}

export function isCategory(value: unknown): value is PresetCategory {
  return typeof value === 'string' && (BUILTIN_CATEGORIES as readonly string[]).includes(value)
}

export function parsePreset(raw: unknown): Preset {
  if (typeof raw !== 'object' || raw === null) {
    throw new PresetError('Preset must be a non-null object.')
  }
  const obj = raw as Record<string, unknown>
  if (typeof obj.id !== 'string' || !obj.id) throw new PresetError('Preset must include an id.')
  if (typeof obj.label !== 'string' || !obj.label) {
    throw new PresetError('Preset must include a label.')
  }
  if (!isCategory(obj.category)) {
    throw new PresetError(`Preset category must be one of: ${BUILTIN_CATEGORIES.join(', ')}`)
  }
  const alignment =
    obj.alignment === 'middle' || obj.alignment === 'top' || obj.alignment === 'bottom'
      ? obj.alignment
      : 'bottom'
  const tags = Array.isArray(obj.tags) ? obj.tags.filter((t): t is string => typeof t === 'string') : []
  const licenseRef = typeof obj.licenseRef === 'string' ? obj.licenseRef : undefined
  const presetVersion = typeof obj.presetVersion === 'string' ? obj.presetVersion : undefined

  return {
    id: obj.id,
    label: obj.label,
    description: typeof obj.description === 'string' ? obj.description : '',
    category: obj.category,
    fontFamily: typeof obj.fontFamily === 'string' ? obj.fontFamily : 'Arial, sans-serif',
    fontSize: typeof obj.fontSize === 'number' ? obj.fontSize : 42,
    primaryColor: typeof obj.primaryColor === 'string' ? obj.primaryColor : '#FFFFFF',
    highlightColor: typeof obj.highlightColor === 'string' ? obj.highlightColor : '#FFD54A',
    outlineColor: typeof obj.outlineColor === 'string' ? obj.outlineColor : '#000000',
    outlineWidth: typeof obj.outlineWidth === 'number' ? obj.outlineWidth : 2,
    bold: Boolean(obj.bold),
    uppercase: Boolean(obj.uppercase),
    alignment,
    rtl: Boolean(obj.rtl),
    emoji: Boolean(obj.emoji),
    karaoke: Boolean(obj.karaoke),
    wordHighlight: Boolean(obj.wordHighlight),
    importantWordPop: Boolean(obj.importantWordPop),
    punctuation: Boolean(obj.punctuation),
    presetVersion,
    tags,
    licenseRef,
  }
}

export function presetStyleId(preset: Preset): string {
  return preset.id
}

export function captionStyleFromPreset(preset: Preset): CaptionStyle {
  const { category: _category, presetVersion: _version, tags: _tags, licenseRef: _ref, ...style } = preset
  return style
}