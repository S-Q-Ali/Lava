# Spec: M5 Module 3 — caption-render

> Module 3 of 4 per `docs/SPEC-m5-capability-map.md`. Depends on caption-core
> (item shape) + caption-styles (preset fields). UI module consumes the wire
> contract defined here.

## WHAT

`/api/render` accepts an optional `captions` JSON form field (array of caption
items with style fields resolved). When present and non-empty, the renderer
generates a libass `.ass` file, writes it into the job's cache dir, and overlays
it on the final concatenated stream with the `ass` filter. When absent/empty the
filter graph is byte-identical to before (parity preserved).

### Wire shape (per item)

```json
{
  "start": 0.0, "duration": 2.0, "text": "Warm sunsets feel rare.",
  "style": {
    "fontFamily": "Arial", "fontSize": 42, "primaryColor": "#FFFFFF",
    "highlightColor": "#FFD54A", "outlineColor": "#000000",
    "outlineWidth": 2, "bold": true, "uppercase": false,
    "alignment": "bottom", "rtl": false, "karaoke": false,
    "words": [{"word": "Warm", "start": 0.0, "end": 0.5}]
  }
}
```

- `fontFamily` is the FIRST family of the style stack (frontend resolves the
  stack; burn-in can only use fonts installed on the machine — documented
  limitation, M6 adds bundled fonts).
- Validation: malformed captions or style → 422 `CAPTION_INVALID`. Unknown
  fields ignored.

### ASS generation (pure, `captions.py`)

- Header: PlayResX/PlayResY = render settings (so font sizes are resolution-relative).
- One style (`Cap`) built from the style fields: colors converted `#RRGGBB` →
  `&HAABBGGRR` (alpha 00 = opaque), alignment mapped bottom=2 / middle=5 / top=8,
  outline = outlineWidth, bold flag -1/0.
- Dialogue lines: `start, start+duration`, text HTML-escaped
  (`&` `<` `>`), newline → `\N`.
- Uppercase: text uppercased when `uppercase` true (casing happens before escaping).
- Karaoke: when `karaoke` is true and per-word timings exist, text becomes
  `{\k<centisecs>}word` sequences; else plain text.
- RTL: when `rtl` is true, `{\rtl}` is prepended to each line (libass handles
  bidi; the flag forces right-to-left paragraph direction).
- Overflow guard: dialogue outside the render duration is clamped, not dropped —
  libass clamps visually; the renderer does not enforce.

### Errors

- `CAPTION_INVALID` (422) — captions not an array, item missing start/duration/text,
  or style with non-numeric fontSize / unknown alignment.
- Empty array = no captions (parity path, not an error).

## WHY

- Burn-in at render (not preview) matches the capability-map boundary: M5 has no
  live preview overlay; the user's captions stay editable items in the project.
- libass handles bidi/complex scripts (Urdu Nastaliq falls back to installed
  fonts) — hand-rolling drawtext would lose shaping.
- Karaoke via `\k` centiseconds is the canonical ASS mechanism and needs only
  word timings caption-core already persists.

## Boundaries / non-goals

- Animated kinetic/manga/meme treatments stay static styled lines (M6 templates).
- No font bundling or license metadata (M6). Missing fonts fall back via libass.
- No per-word pop animation; important-word pop renders as a highlighted word
  color span only when words exist (static color, no animation).

## Verify

Unit tests (pure generator): header, style line, colors, alignment map, escaping,
uppercase, karaoke centiseconds, rtl flag. HTTP tests: 201 with captions (duration
unchanged), parity when absent, 422 `CAPTION_INVALID` cases. Real-ffmpeg smoke:
one burned-in caption visible (frame differs from no-caption render).