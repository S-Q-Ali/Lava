# SPEC — M6 module 6: `license-tracking` (closes the M6 license-metadata row)

## Goal
Make preset/render font licensing a first-class, verified part of the pipeline:
fonts already carry `{type, source, embeddingAllowed}` (font-system, module 1)
and presets bind fonts via `licenseRef` (module 3). This module adds a
**render-time license guard** plus a **render font manifest**, so a font whose
license forbids embedding — or a registered font whose file has gone missing —
can never be burned into an export silently.

## Scope

### In scope
- Pure backend resolver `backend/src/lava_backend/licensing.py`:
  `resolve_render_font_licenses(caption_specs, font_entries, fonts_dir)` →
  `(used_fonts, violations)`.
  - A caption style's `fontFamily` (family string on the wire) is matched
    against the fonts registry by `family`.
  - Registry match with `license.embeddingAllowed is False` → violation
    `FONT_LICENSE_NOT_EMBEDDABLE` (outlines may not be embedded/redistributed).
  - Registry match whose file (`{id}.{ext}`) is absent from `fonts_dir` →
    violation `FONT_MISSING` (actionable: re-import the font or switch styles).
  - No registry match ⇒ system stack ⇒ allowed, not listed as an imported font.
  - Deduplicates by font id; each used font reported with
    `{family, fontId, license: {type, source, embeddingAllowed}}`.
- Render integration (`main.py`/`media.py`): `POST /api/render` resolves
  licenses before burning; violations abort with a single actionable
  `FONT_LICENSE` 422 (`FONT_MISSING` or `FONT_LICENSE_NOT_EMBEDDABLE` detail
  is carried in the message). `RenderResult` gains a `fonts` list
  (`[{family, fontId, license}]`) so the API documents what fonts an export
  used — no silent fallback in either direction.
- Frontend wire parity: `RenderResult` gains optional `fonts`; the
  `RenderCaptionStyle` mirror type gains `animation` (it had silently diverged
  from `captionToWire` in module 5). PresetPanel's "imported font" badge title
  shows the font family and embedding status resolved from `fontStore`.

### Out of scope (documented, not silent)
- Detecting a font that was fully **removed from the registry** after a preset
  was bound: without a registry entry the family matches nothing and is treated
  as a system stack. (Predictable from the data; a removed font's family re-used
  by a system font would pass.) The registry-backed cases — restricted
  embedding and registered-but-missing-file — are caught.
- Font bundling/download licensing screens, OFL file shipping, or redistribution
  amount display.

## Assumptions
1. `licenseRef` binds preset→font id at import (module 3); at render time the
   style's `fontFamily` string is the reliable joiner (a given imported font's
   family matches at most one registry entry in practice; first match wins).
2. `embeddingAllowed` is the user-declared permission at import (module 1
   stores it; it is advisory-by-contract, so rejecting is correct).
3. Render guard failures are hard errors (422), not warnings — consistent with
   "no silent overwrite / no silent fallback" (PRODUCT_SPEC/AGENTS) and with
   import-time `licenseRef` enforcement (D-023).
4. System font stacks never trip the guard: not registered ⇒ not tracked as
   imported ⇒ allowed.

## Acceptance criteria
- [ ] `resolve_render_font_licenses` returns used-font descriptors and
      violations per the rules above (pure, byte-deterministic, unit-tested).
- [ ] Render with captions whose (imported) font forbids embedding → 422
      `FONT_LICENSE`; registered-but-missing file → 422 `FONT_LICENSE` with a
      `FONT_MISSING` message.
- [ ] Render with system-stack-only captions → unchanged 201; `fonts: []`.
- [ ] Render with an embedding-allowed imported font → 201 and `fonts`
      contains `{family, fontId, license}`.
- [ ] Frontend `RenderResult.fonts` + `RenderCaptionStyle.animation` match the
      backend contract; PresetPanel badge title shows family + embedding
      status.
- [ ] Backend 227 → ~236+; frontend 250 → ~254+; regression + build + lint
      green; docs + graphify updated; M6 row closed.

## Slices
1. Backend pure `licensing.py` resolver + RED unit tests (match/dedup,
   embedding-restricted, missing-file, system-stack pass, whole-registry vs
   empty `fonts_dir`).
2. Render integration: endpoint guard (422 propagation), `RenderResult.fonts`,
   RED API tests; backend regression.
3. Frontend: `RenderResult.fonts`, `RenderCaptionStyle.animation`, PresetPanel
   badge title via `fontStore`; RED mirrors + regression + build + lint.
4. Docs D-026 + SESSION_LOG 19 + ROADMAP tick (M6 complete) + FEATURES + todo
   + `graphify update .` + full regression + push go-ahead.

## Definition of done (this module)
Guard + manifest green with tests; no silent fallback on the render path for
registry-backed fonts; docs record D-026; M6 license-metadata row ticked and
Milestone 6 marked complete; report lists files, behavior, tests, limitations,
next step.