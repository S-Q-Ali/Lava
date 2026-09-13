# Plan — M6 module 6 (final): license-tracking

Sequential slices, each committed after full local regression. RED first per task.

## Task 1 (slice 1) — Backend pure resolver
- `backend/src/lava_backend/licensing.py`:
  - `ResolvedRenderFont(family, fontId, license)` — small frozen dataclass.
  - `resolve_render_font_licenses(caption_specs, font_entries, fonts_dir)`:
    distinct `style.font_name` values across captions → exact family match
    against `font_entries` (first wins) → build descriptors or violations
    (embedding-restricted / file missing at `fonts_dir / f"{id}.{ext}"`).
  - Return `(list[ResolvedRenderFont], list[dict])`; violations carry
    `code` + `family` + human message.
- `backend/tests/test_licensing.py` — RED: empty captions, system stack pass,
  embedding-allowed import listed, embedding-restricted violation,
  registered-but-missing-file violation, family dedup across multiple captions,
  missing/empty `fonts_dir`.

## Task 2 (slice 2) — Render integration
- `main.py` render endpoint: after `parse_captions`, call resolver with
  `_list_font_entries(config)` + `config.fonts_dir`; any violation →
  `ApiError(422, "FONT_LICENSE", detail)` (message names the family + reason).
- `RenderResult` (media.py dataclass) gains `fonts: list`; build the list of
  descriptors from the resolver output and carry it through `render(...)`.
- `backend/tests/test_render_license.py` or extend the render API tests — RED:
  201 + `fonts: []` for system stacks; 422 `FONT_LICENSE` for restricted font;
  422 for missing file; 201 + `fonts` populated for allowed imports.

## Task 3 (slice 3) — Frontend parity + badge
- `services/ffmpeg.ts`: `RenderResult.fonts?: FontRenderInfo[]`
  (`{family, fontId, license}` mirror) and `RenderCaptionStyle.animation?`
  (fixes the module-5 divergence).
- `PresetPanel.tsx`: for a preset with `licenseRef`, resolve the font entry
  from `fontStore.fonts` and set the badge title to
  `"<family> — embedding <allowed/limited>"`.
- Tests: ffmpeg service type/round-trip (or add where render parsing lives),
  PresetPanel badge title; full regression + build + lint.

## Task 4 (slice 4) — Docs + graphify + regression + push
- D-026 (render guard + manifest + system-stack limitation), SESSION_LOG 19,
  ROADMAP license row tick + Milestone 6 ✅, FEATURES block, todo ticks.
- `graphify update .`, backend + frontend full regression + build + lint.
- Report → commit → ask push go-ahead.