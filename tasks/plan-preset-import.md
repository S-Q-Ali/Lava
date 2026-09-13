# Implementation Plan: preset-import (M6 module 3)

## Overview

Strict import of caption-preset JSON (validation + `custom-` id + font
`licenseRef` cross-check), backend Custom-category registry writes, export the
preset as JSON, and PresetPanel import/export/remove controls. Builds on
module 2's registry and `validate_preset`.

## Architecture decisions

- Imported presets are forced into `Custom`; ids prefixed `custom-`; duplicates
  rejected (no silent overwrite — D-018/D-022 rule extended to presets).
- `licenseRef` is validated against the fonts registry at import, not at render.
- Storage stays `presets/registry.json` (customs appended); built-ins never
  written/deleted.
- Export is backend-served JSON (`GET /api/presets/{id}/file`) + a browser
  download helper mirroring `projectIO.ts`.

## Task list

### Task 1 — pure import layer (slice 1)
- [ ] `preset_import.py`: `IPRESET_INVALID`-style checks — enforce `custom-`
      prefix, force `category=Custom`, validate licenseRef against font ids,
      `preset_to_export_dict`.
  - Acceptance: criteria 1–4 (pure side).
  - Verify: `uv run pytest tests/test_preset_import.py` (RED) → full backend.
  - Files: `preset_import.py`, `tests/test_preset_import.py`.

### Task 2 — API (slice 2)
- [ ] `POST /api/presets` (201, custom-write into registry file),
      `DELETE /api/presets/{id}` (204 / 403 builtin / 404),
      `GET /api/presets/{id}/file` (JSON download).
  - Acceptance: criteria 5–7, 9.
  - Verify: API tests + final registry retains exports.
  - Files: `main.py`, `tests/test_preset_import.py`.

### Task 3 — frontend services + store (slice 3)
- [ ] `services/presets.ts`: `importPreset(blob/json)`, `deletePreset(id)`,
      `exportPreset(preset)` (normalized JSON, browser download). `presetStore`:
      `importPreset`, `removePreset`, reload on change.
  - Acceptance: criterion 8 (service side).
  - Verify: `npx vitest run src/services src/store` (RED) → full frontend.
  - Files: `services/presets.ts`(+test), `store/presetStore.ts`(+test).

### Task 4 — PresetPanel controls (slice 4)
- [ ] Import JSON button (file picker → payload → store), export button per
      custom card, Remove under Custom tab, inline errors.
  - Acceptance: criterion 8 (UI) + loading/error states.
  - Verify: jsdom component tests + full suite + build + lint + App mounts.
  - Files: `PresetPanel.tsx`(+test), `App.css`.

### Task 5 — docs + graph (slice 5)
- [ ] D-023 (DECISIONS), ROADMAP M6 preset-import tick + status, FEATURES,
      SESSION_LOG 16, `tasks/todo.md` ticks, graphify update, full regression.

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| LicenseRef font deleted after import | render already falls back (D-022); import-time check is the gate |
| Custom id collision in registry | duplicate → `PRESET_INVALID`, user renames |
| Builtin delete attempt | 403 `BUILTIN_PRESET` |
| Corrupt registry after writes | load_registry builtin fallback (module 2) |

## Checkpoints

- After slices 1–2: backend 178 → 178+n green, registry round-trip verified.
- After slices 3–4: frontend 213 → 213+n green, build + lint clean.
- After slice 5: full regression green + docs updated; push on go-ahead.

## Open questions

None. Assumptions listed in SPEC-preset-import.md (approved with the spec).