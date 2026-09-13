# Plan — M6 module 5: animated-captions

Sequential slices, each committed after full local regression. RED first per task.

## Task 1 (slice 1) — Backend ASS animation
- `backend/src/lava_backend/captions.py`:
  - `ANIMATIONS = ("none", "kinetic", "manga", "cinematic", "meme", "storytelling")`
  - `CaptionStyleSpec.animation: str = "none"`, validated in `from_wire`
    (not in set → `CaptionError`).
  - `_word_offsets(item)` → list of (word_text, rel_ms) using `words[]`
    absolute `start`, else even split of the (uppercased) text across duration.
  - `_kinetic_text(item)` — per-word reveal wrapper (alpha + `\fscx\fscy` `\t`).
  - `_animate_line(item, text)` — wraps a finished text (rtl already handled)
    in the treatment recipe; `none` returns text unchanged; `karaoke` wins.
  - `build_dialogue_line` applies `_animate_line` and uses the animated-text
    path so `\\t` timing is relative to the line start.
- `backend/tests/test_captions.py` — RED: exact strings for each of the five
  treatments (kinetic with words and without), karaoke precedence, rtl+animate
  composition, invalid animation rejected.

## Task 2 (slice 2) — Backend preset schema
- `preset_registry.py`: `Preset.animation: str = "none"` (+ `_ANIMATION_SET`),
  `validate_preset` enum check with actionable message.
- `preset_import.py`: passthrough automatic via `validate_preset`; import of a
  payload with a valid animation round-trips; invalid → `PRESET_INVALID`.
- Backend imports/parity tests updated; full backend regression.

## Task 3 (slice 3) — Frontend model + wire
- `captionStyles.ts`: `export type CaptionAnimation`, `ANIMATION_OPTIONS`,
  optional `animation` on `CaptionStyle`; annotate `manga`, `cinematic`,
  `meme`, `storytelling` presets with matching values.
- `presets.ts`: `parsePreset` accepts + validates `animation` (enum, default
  `none`); `captionStyleFromPreset` passes it through.
- `CaptionPanel.tsx`: `captionToWire` emits `animation: style.animation ?? 'none'`.
- Tests: M5 parity (four presets annotated), parsePreset round-trip, invalid
  animation rejected, wire passthrough.

## Task 4 (slice 4) — Editor + panel
- `templateEditor.ts`: `PresetDraft.animation: CaptionAnimation`;
  `draftFromPreset` (`?? 'none'`), `finalizeDraft` round-trip.
- `TemplateEditorPanel.tsx`: Animation select (None + five, labeled), placed
  with the flag toggles; preview unchanged (motion preview is M8).
- Tests: draft round-trip, updateDraft set, panel select updates draft
  (`finalizeDraft` payload carries it).

## Task 5 (slice 5) — Docs + graphify + regression + push
- D-025 (recipes + deferrals), SESSION_LOG 18, ROADMAP animated-captions tick
  (+ status), FEATURES block, todo ticks.
- `graphify update .`, backend + frontend full regression + build + lint.
- Report → commit → ask push go-ahead.