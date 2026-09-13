import type { CaptionAnimation, CaptionStyle } from './captionStyles'
import { getCaptionStyle } from './captionStyles'
import type { Preset } from './presets'
import { captionStyleFromPreset } from './presets'

export interface PresetDraft {
  label: string
  description: string
  fontFamily: string
  fontSize: number
  primaryColor: string
  highlightColor: string
  outlineColor: string
  outlineWidth: number
  bold: boolean
  uppercase: boolean
  alignment: 'bottom' | 'middle' | 'top'
  rtl: boolean
  emoji: boolean
  karaoke: boolean
  wordHighlight: boolean
  importantWordPop: boolean
  punctuation: boolean
  animation: CaptionAnimation
}

export function draftFromPreset(preset: Preset | CaptionStyle): PresetDraft {
  return {
    label: preset.label,
    description: preset.description ?? '',
    fontFamily: preset.fontFamily,
    fontSize: preset.fontSize,
    primaryColor: preset.primaryColor,
    highlightColor: preset.highlightColor,
    outlineColor: preset.outlineColor,
    outlineWidth: preset.outlineWidth,
    bold: Boolean(preset.bold),
    uppercase: Boolean(preset.uppercase),
    alignment: preset.alignment,
    rtl: Boolean(preset.rtl),
    emoji: Boolean(preset.emoji),
    karaoke: Boolean(preset.karaoke),
    wordHighlight: Boolean(preset.wordHighlight),
    importantWordPop: Boolean(preset.importantWordPop),
    punctuation: Boolean(preset.punctuation),
    animation: preset.animation ?? 'none',
  }
}

const MIN_FONT_SIZE = 8
const MAX_FONT_SIZE = 240

export function updateDraft(draft: PresetDraft, patch: Partial<PresetDraft>): PresetDraft {
  const merged = { ...draft, ...patch }
  return {
    ...merged,
    fontSize:
      typeof merged.fontSize === 'number'
        ? Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, merged.fontSize))
        : draft.fontSize,
    outlineWidth:
      typeof merged.outlineWidth === 'number' ? Math.max(0, merged.outlineWidth) : draft.outlineWidth,
  }
}

const ASCII_SLUG = /[^0-9a-z]+/g

export function customIdForLabel(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(ASCII_SLUG, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `custom-${slug || 'preset'}`
}

export interface FinalizeOptions {
  id?: string
}

export function finalizeDraft(draft: PresetDraft, options: FinalizeOptions = {}): Preset {
  return {
    id: options.id ?? customIdForLabel(draft.label),
    label: draft.label,
    description: draft.description,
    category: 'Custom',
    fontFamily: draft.fontFamily,
    fontSize: draft.fontSize,
    primaryColor: draft.primaryColor,
    highlightColor: draft.highlightColor,
    outlineColor: draft.outlineColor,
    outlineWidth: draft.outlineWidth,
    bold: draft.bold,
    uppercase: draft.uppercase,
    alignment: draft.alignment,
    rtl: draft.rtl,
    emoji: draft.emoji,
    karaoke: draft.karaoke,
    wordHighlight: draft.wordHighlight,
    importantWordPop: draft.importantWordPop,
    punctuation: draft.punctuation,
    animation: draft.animation,
  }
}

export function resolveCaptionStyle(styleId: string, presets: Preset[]): CaptionStyle {
  for (const preset of presets) {
    if (preset.id === styleId) return captionStyleFromPreset(preset)
  }
  return getCaptionStyle(styleId)
}