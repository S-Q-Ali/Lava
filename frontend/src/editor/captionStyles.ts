/**
 * Original caption style presets (M5 caption-styles).
 *
 * Every preset is a static, original definition — no trending claims, no
 * proprietary fonts. Fonts are safe CSS stacks; user font import + license
 * metadata arrive with M6. Colors are #RRGGBB hex (the renderer converts to
 * ASS &HBBGGRR when burning in).
 */

export interface CaptionStyle {
  id: string
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
  rtl?: boolean
  emoji?: boolean
  karaoke?: boolean
  wordHighlight?: boolean
  importantWordPop?: boolean
  punctuation?: boolean
}

const SANS = "'Helvetica Neue', Arial, sans-serif"
const SERIF = "Georgia, 'Times New Roman', serif"
const IMPACT = 'Impact, Haettenschweiler, Arial Black, sans-serif'
const URDU = "'Noto Nastaliq Urdu', 'Jameel Noori Nastaleeq', 'Noto Naskh Arabic', serif"

export const CAPTION_STYLES: CaptionStyle[] = [
  {
    id: 'normal',
    label: 'Normal subtitles',
    description: 'Clean readable subtitles at the bottom — the default.',
    fontFamily: SANS,
    fontSize: 42,
    primaryColor: '#FFFFFF',
    highlightColor: '#FFD54A',
    outlineColor: '#000000',
    outlineWidth: 2,
    bold: false,
    uppercase: false,
    alignment: 'bottom',
  },
  {
    id: 'word-highlight',
    label: 'Word highlight',
    description: 'The spoken word is tinted as narration progresses.',
    fontFamily: SANS,
    fontSize: 44,
    primaryColor: '#FFFFFF',
    highlightColor: '#FFD54A',
    outlineColor: '#000000',
    outlineWidth: 2,
    bold: true,
    uppercase: false,
    alignment: 'bottom',
    wordHighlight: true,
  },
  {
    id: 'karaoke',
    label: 'Karaoke',
    description: 'Classic karaoke sweep across the line in time with speech.',
    fontFamily: SANS,
    fontSize: 44,
    primaryColor: '#FFFFFF',
    highlightColor: '#39D98A',
    outlineColor: '#000000',
    outlineWidth: 2,
    bold: true,
    uppercase: false,
    alignment: 'bottom',
    karaoke: true,
  },
  {
    id: 'important-word-pop',
    label: 'Important-word pop',
    description: 'Key words pop in the accent color; the rest stays calm.',
    fontFamily: SANS,
    fontSize: 46,
    primaryColor: '#FFFFFF',
    highlightColor: '#FF5A5F',
    outlineColor: '#000000',
    outlineWidth: 2,
    bold: true,
    uppercase: false,
    alignment: 'bottom',
    importantWordPop: true,
  },
  {
    id: 'punctuation',
    label: 'Punctuation emphasis',
    description: 'Punctuation kept visible and emphasized for read-along pacing.',
    fontFamily: SANS,
    fontSize: 42,
    primaryColor: '#FFFFFF',
    highlightColor: '#8AB4FF',
    outlineColor: '#000000',
    outlineWidth: 2,
    bold: false,
    uppercase: false,
    alignment: 'bottom',
    punctuation: true,
  },
  {
    id: 'hook',
    label: 'Hook',
    description: 'Big top-centered opener for the first seconds of a video.',
    fontFamily: IMPACT,
    fontSize: 58,
    primaryColor: '#FFFFFF',
    highlightColor: '#FFD54A',
    outlineColor: '#000000',
    outlineWidth: 3,
    bold: true,
    uppercase: true,
    alignment: 'top',
  },
  {
    id: 'manga',
    label: 'Manga / anime',
    description: 'Sharp outlined comic-style line, middle-centered.',
    fontFamily: IMPACT,
    fontSize: 48,
    primaryColor: '#FFFFFF',
    highlightColor: '#FF5A5F',
    outlineColor: '#1A1A1A',
    outlineWidth: 3,
    bold: true,
    uppercase: false,
    alignment: 'middle',
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    description: 'Serif, letterboxed feel for calm narrative footage.',
    fontFamily: SERIF,
    fontSize: 40,
    primaryColor: '#F5F1E6',
    highlightColor: '#D9B36C',
    outlineColor: '#000000',
    outlineWidth: 1,
    bold: false,
    uppercase: false,
    alignment: 'bottom',
  },
  {
    id: 'meme',
    label: 'Meme',
    description: 'Classic white-on-black meme caption, uppercase.',
    fontFamily: IMPACT,
    fontSize: 54,
    primaryColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 3,
    bold: true,
    uppercase: true,
    alignment: 'bottom',
  },
  {
    id: 'storytelling',
    label: 'Storytelling',
    description: 'Warm serif line for voice-over storytelling.',
    fontFamily: SERIF,
    fontSize: 42,
    primaryColor: '#FFF6E5',
    highlightColor: '#E8A87C',
    outlineColor: '#2B1D0E',
    outlineWidth: 2,
    bold: false,
    uppercase: false,
    alignment: 'bottom',
  },
  {
    id: 'urdu',
    label: 'Urdu',
    description: 'Right-to-left Nastaliq line for Urdu narration.',
    fontFamily: URDU,
    fontSize: 46,
    primaryColor: '#FFFFFF',
    highlightColor: '#FFD54A',
    outlineColor: '#000000',
    outlineWidth: 2,
    bold: false,
    uppercase: false,
    alignment: 'bottom',
    rtl: true,
  },
  {
    id: 'roman-urdu',
    label: 'Roman Urdu',
    description: 'Left-to-right line tuned for Roman Urdu phrasing.',
    fontFamily: SANS,
    fontSize: 42,
    primaryColor: '#FFFFFF',
    highlightColor: '#FFD54A',
    outlineColor: '#000000',
    outlineWidth: 2,
    bold: false,
    uppercase: false,
    alignment: 'bottom',
  },
  {
    id: 'english',
    label: 'English',
    description: 'Neutral English subtitle preset.',
    fontFamily: SANS,
    fontSize: 42,
    primaryColor: '#FFFFFF',
    highlightColor: '#8AB4FF',
    outlineColor: '#000000',
    outlineWidth: 2,
    bold: false,
    uppercase: false,
    alignment: 'bottom',
  },
  {
    id: 'mixed',
    label: 'Mixed language',
    description: 'One line, any script — safe stack covers mixed narration.',
    fontFamily: SANS,
    fontSize: 42,
    primaryColor: '#FFFFFF',
    highlightColor: '#FFD54A',
    outlineColor: '#000000',
    outlineWidth: 2,
    bold: false,
    uppercase: false,
    alignment: 'bottom',
  },
  {
    id: 'emoji',
    label: 'Emoji optional',
    description: 'Subtitle preset that allows emoji when the transcript has them.',
    fontFamily: SANS,
    fontSize: 44,
    primaryColor: '#FFFFFF',
    highlightColor: '#FFD54A',
    outlineColor: '#000000',
    outlineWidth: 2,
    bold: false,
    uppercase: false,
    alignment: 'bottom',
    emoji: true,
  },
]

export const DEFAULT_CAPTION_STYLE_ID = 'normal'

export function getCaptionStyle(id: string): CaptionStyle {
  return CAPTION_STYLES.find((style) => style.id === id) ?? CAPTION_STYLES[0]
}

export function isCaptionStyleId(id: string): boolean {
  return CAPTION_STYLES.some((style) => style.id === id)
}