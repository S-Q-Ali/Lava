import type { CaptionItem } from '../editor/captions'
import type { Preset } from '../editor/presets'
import { resolveCaptionStyle } from '../editor/templateEditor'
import { usePresetStore } from '../store/presetStore'

export function captionToWire(caption: CaptionItem, presets: Preset[]) {
  const style = resolveCaptionStyle(caption.styleId, presets)
  const firstFamily = style.fontFamily.split(',')[0]?.replace(/'/g, '').trim() || 'Arial'
  return {
    start: caption.start,
    duration: caption.duration,
    text: caption.text,
    style: {
      fontFamily: firstFamily,
      fontSize: style.fontSize,
      primaryColor: style.primaryColor,
      highlightColor: style.highlightColor,
      outlineColor: style.outlineColor,
      outlineWidth: style.outlineWidth,
      bold: style.bold,
      uppercase: style.uppercase,
      alignment: style.alignment,
      rtl: style.rtl ?? false,
      karaoke: style.karaoke ?? false,
      animation: style.animation ?? 'none',
    },
    words: caption.words,
  }
}

export function captionsRenderPayload(captions: CaptionItem[], presets: Preset[] = usePresetStore.getState().presets) {
  return captions.map((caption) => captionToWire(caption, presets))
}
