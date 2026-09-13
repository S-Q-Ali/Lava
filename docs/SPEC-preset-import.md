# Spec: preset-import (M6 module 3)

## ASSUMPTIONS I'M MAKING
1. Preset import/export uses **custom JSON it is `Preset` schema** (the same
   `{...CaptionStyle, category, presetVersion?, tags[], licenseRef?}` shape the
   registry already serves) — not a fragment of the project file.
2. Imported presets **always land in the `Custom` category** (spec's module
   breakdown: "Imported presets appear in Custom category"). The client may send
   any category but the backend forces `Custom`.
3. Imported preset ids get a **`custom-` prefix** (ids come from the file or the
   service; duplicates are rejected, not silently overwritten).
4. `licenseRef` **must reference an existing imported font** at import time —
   strict, actionable `PRESET_INVALID` (422) otherwise. This is the validation
   gate the registry deferred in D-022.
5. Export = download the single preset as JSON (browser-side download, mirroring
   `projectIO.ts`); there is also a `GET /api/presets/{id}/file` serving the same
   JSON from the backend for tests/parity.
6. Storage: customs append to `presets/registry.json` (already seeded from
   built-ins in module 2). No new file format, no DB.
7. The existing `tasks/todo.md` M6 module-2 rows stay unticked until module 3's
   summary; module 3 rows are added below them (planning skill's no-overwrite rule).
8. Deleting a custom preset is allowed; built-ins are **never deletable**
   (`DELETE /api/presets/{id}` → 403 `BUILTIN_PRESET`).

## Objective

Let users save, share and reload their own caption presets: import a preset JSON
file (validated strictly), export a preset back to JSON, and manage the Custom
category in the UI. Builds directly on module 2 (`validate_preset`, the registry
file, PresetPanel).

## Acceptance criteria

| # | Criterion | How to verify |
|---|-----------|---------------|
| 1 | Import validates against the full Preset schema | `validate_imported_preset(bad)` raises `PresetError` — test |
| 2 | Import forces `category = Custom` | API test: send `category: "Meme"` → stored as `Custom` |
| 3 | Import requires a `custom-` id prefix; duplicate id → `PRESET_INVALID` | unit + API test |
| 4 | `licenseRef` must reference an existing font id; unknown font → 422 | API test with an uploaded font vs unknown id |
| 5 | `POST /api/presets` returns 201 + stored Preset; `GET /api/presets` includes it | API test |
| 6 | `DELETE /api/presets/{id}` removes a custom preset (204); built-in → 403 | API test |
| 7 | `GET /api/presets/{id}/file` serves the preset JSON | API test |
| 8 | Export downloads a valid Preset JSON from the frontend | service/store/component test |
| 9 | Import empty/invalid JSON → actionable `PRESET_INVALID` message | API test |
| 10 | No unrelated regressions | backend 178 → 178+n; frontend 213 → 213+n; build + lint clean |

## Slices

| Slice | Scope | RED gate |
|-------|-------|----------|
| 1 — pure | `preset_import.py` (`import_preset_from_payload`, `custom-` id enforcement, licenseRef cross-check helper, `preset_to_export_dict`) | unit tests |
| 2 — API | `POST/DELETE /api/presets`, `GET /api/presets/{id}/file`, registry save on write | API tests |
| 3 — frontend services+store | `services/presets.ts` (`importPreset`, `deletePreset`, `exportPreset`), `presetStore` `importPreset`/`removePreset` | store/service tests |
| 4 — UI | PresetPanel: Import JSON button (file picker), export/download per custom card, Remove under Custom, error surfaces | component tests |
| 5 — docs | D-023, SESSION_LOG 16, ROADMAP M6 preset-import tick, FEATURES, graphify, regression | full green |

## Files

| File | Change |
|------|--------|
| `backend/src/lava_backend/preset_import.py` | NEW — payload→Preset import, cross-checks |
| `backend/src/lava_backend/main.py` | NEW routes (POST/DELETE `/api/presets`, GET `/api/presets/{id}/file`) |
| `backend/src/lava_backend/preset_registry.py` | Minor — expose `__dict__` helper already used; add lookup-by-id |
| `backend/tests/test_preset_import.py` | NEW — unit + API tests |
| `frontend/src/services/presets.ts` | EXTEND — import/delete/export |
| `frontend/src/store/presetStore.ts` | EXTEND — actions |
| `frontend/src/components/PresetPanel.tsx` | EXTEND — import/export/remove UI |
| `frontend/src/components/PresetPanel.test.tsx` | EXTEND |
| `frontend/src/App.css` | EXTEND `.preset-*` |
| `docs/*` | D-023, SESSION_LOG 16, ROADMAP, FEATURES |

## Open questions

None — the assumptions above define them away. If the user disagrees with any,
they are flagged before implementation.