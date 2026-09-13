# Implementation Plan: font-system (M6 module 1)

## Overview

User fonts become first-class: import `.ttf/.otf` into the project-local backend `fonts/` with
license metadata, list/remove them, preview via `@font-face`, and render caption burn-in with
`ass=:fontsdir=` so libass resolves imported families. No new dependencies (hand-rolled SFNT
name reading), no bundled fonts, project version untouched.

## Architecture decisions

- **Backend owns storage.** Rendering is backend/libass; fonts therefore live on the sidecar
  filesystem (`Config.fonts_dir` → `fonts/`), not in the downloadable project JSON. The
  project continues to reference fonts by family-name string (`CaptionStyle.fontFamily`);
  libass falls back to system fonts when a family is absent.
- **Id-based files.** Stored as `font-<hex>.ttf|otf`; original filename + family live in
  metadata. Registry is a JSON file (`fonts/licenses.json`) — keeps font assets out of git.
- **Hand-rolled name reader.** SFNT header (0x00010000 / `OTTO` / `true` / `ttcf`), table
  directory, `name` table record scan for nameID 1 (platform 3/0, Unicode) → fallback 16 → 4.
  Best-effort; no fontTools.
- **Parity rule.** `ass=` gains `:fontsdir=` **only** when captions render; with no captions the
  graph stays byte-identical.

## Task list

### Task 1 — backend core (slice 1)
- [ ] `fonts.py`: signature validation, SFNT name extraction, `FontMetadata`, registry
      load/save; `config.py` adds `fonts_dir` + `presets_dir`.
  - Acceptance: criteria 1–3 (pure).
  - Verify: `uv run pytest tests/test_fonts.py` (RED first) → full backend green (140+n).
  - Files: `backend/src/lava_backend/fonts.py`, `config.py`, `tests/test_fonts.py`.

### Task 2 — API + renderer wire (slice 2)
- [ ] `main.py` routes (`POST/GET /api/fonts`, `GET /api/fonts/{id}/file`,
      `DELETE /api/fonts/{id}`); `media.py` `ass=:fontsdir=` integration.
  - Acceptance: criteria 4–6 (HTTP + real smoke + parity).
  - Verify: `uv run pytest tests/test_fonts.py` + `tests/test_render.py` parity tests.
  - Files: `main.py`, `media.py`, `tests/test_fonts.py`.

### Checkpoint 1–2
- [ ] Backend green (140 + n), parity tests + real smoke pass.

### Task 3 — frontend model + store + client (slice 3)
- [ ] `editor/fonts.ts`, `services/fonts.ts`, `store/fontStore.ts` + tests.
  - Acceptance: criteria 7 (store/client side).
  - Verify: `npx vitest run src/store src/services src/editor` (RED first) → full frontend.
  - Files: frontend `editor/fonts.*`, `services/fonts.*`, `store/fontStore.*`.

### Task 4 — FontPanel UI (slice 4)
- [ ] `components/FontPanel.tsx` + CSS + mount in `InspectorPanel`; `@font-face` preview
      registration.
  - Acceptance: criteria 7 (UI); App mount regression stays green.
  - Verify: jsdom component tests + full frontend (174+n) + `npm run build` + `npm run lint`.
  - Files: `FontPanel.tsx`+test, `InspectorPanel.tsx`, `App.css`.

### Task 5 — docs + graph (slice 5)
- [ ] D-021 in `DECISIONS.md`, ROADMAP M6 font-system tick, FEATURES note, SESSION_LOG 14,
      `tasks/plan-font.md` + todo ticks, `graphify update .`, regression, commit; push on
      go-ahead.

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Hand-rolled name reader misses exotics | fallback chain (1→16→4), best-effort, documented; upload still accepted with `family` from filename as last resort |
| `fontsdir` affecting ASS fallback for system fonts | libass still falls back to system scan path; smoke test covers an uploaded family render |
| Registry drift (file deleted, metadata stale) | registry is source of truth; DELETE removes both; GET list skips missing files defensively |
| Big fonts bloat localStorage/project | fonts never enter project JSON — only family strings do |

## Open questions

- None. License defaults: `unknown` unless the user fills the fields; `embeddingAllowed` kept
  from user input (brand-decision, not technical).