# Implementation Plan: preset-registry (M6 module 2)

## Overview

Turn the M5 hardcoded `CAPTION_STYLES` into a browsable, category-tagged preset
registry served by the backend (`presets/registry.json`), extend the model with
`category`/`presetVersion`/`tags`/`licenseRef`, and add a PresetPanel that filters
by category and applies a preset to captions. Read-only API for now (`GET
/api/presets`); import/export comes in module 3.

## Architecture decisions

- Model: `Preset` = `CaptionStyle` + optional `category`-adjacent fields.
- Registry file `presets/registry.json` (seed = the 15 built-ins).
- `getCaptionStyle` keeps the hardcoded fallback; store is the canonical source.
- `licenseRef` optional; no load-time font validation (graceful fallback).

## Task list

### Task 1 — pure layer (slice 1)
- [ ] `backend/src/lava_backend/preset_registry.py`: `BUILTIN_CATEGORIES`
      (13), `Preset` dataclass, `BUILTIN_PRESETS` (15 with categories
      by the spec table), `validate_preset`, `load_registry`, `save_registry`.
  - Verify: `uv run pytest tests/test_preset_registry.py` (RED first) →
      full backend green.
  - Files: `preset_registry.py`, `tests/test_preset_registry.py`.

### Task 2 — API (slice 2)
- [ ] `main.py`: `GET /api/presets` returning the registry list.
  - Verify: API test in `test_preset_registry.py`.
  - Files: `main.py`, `tests/test_preset_registry.py`.

### Task 3 — frontend model + store (slice 3)
- [ ] `editor/presets.ts` (Preset type, parsePreset, BUILTIN_CATEGORIES) +
      `store/presetStore.ts` (load, byCategory selector, applyPresetToCaptions).
  - Verify: `npx vitest run src/editor src/store` (RED first).
  - Files: `editor/presets.ts`, `editor/presets.test.ts`,
      `store/presetStore.ts`, `store/presetStore.test.ts`.

### Task 4 — PresetPanel (slice 4)
- [ ] `components/PresetPanel.tsx` (category tabs/pills + preset cards +
      apply) + InspectorPanel mount + CSS.
  - Verify: jsdom component tests + full frontend + build + lint.
  - Files: `PresetPanel.tsx`, `PresetPanel.test.tsx`, `InspectorPanel.tsx`,
      `App.css`.

### Task 5 — docs + graph (slice 5)
- [ ] D-022, SESSION_LOG 15, ROADMAP M6 preset-registry tick, FEATURES §6,
      graphify update, regression, commit; push on go-ahead.

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| `getCaptionStyle` drift between store and hardcoded list | keep `CAPTION_STYLES` as the seed; store loads the same ids; fallback preserves behavior |
| Registry file corrupt | load_registry falls back to BUILTIN_PRESETS |
| Applying a custom styleId no longer in registry | caption renderer already falls back to first preset (`getCaptionStyle`) |
| Categories meaningless for some built-ins | explicit spec table; `Custom` is a valid honest bucket |

## Open questions

None (module 3 owns import/export, validation there is stricter).