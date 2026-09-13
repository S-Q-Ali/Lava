# Implementation Plan: template-editor (M6 module 4)

## Overview

Visual preset editor: base preset → draft edits with live preview → save as new
Custom preset or overwrite an existing Custom preset. Includes the small render
resolution fix so preset-applied captions actually render with their real style.

## Architecture decisions

- Draft editing is pure (`templateEditor.ts`): immutable drafts, slug id from
  label (mirrors backend `suggested_custom_id`), `finalizeDraft` emits a valid
  preset payload for POST/PUT.
- Overwrite only for customs: backend `PUT /api/presets/{id}` reuses
  `import_preset_payload` (Custom force, `custom-` gate, licenseRef check);
  built-ins → 403.
- Render resolution: CaptionPanel `captionToWire` resolves preset `styleId`s
  through the preset store (module-2 latent gap — without it the editor's own
  output renders as `normal`).
- UI: one Inspector panel (`TemplateEditorPanel`) built on the project's tokens
  (`.template-*` CSS), keyboard-accessible form controls, all error/empty states.

## Task list

### Task 1 — pure editor model (slice 1)
- [ ] `templateEditor.ts`: `PresetDraft` (CaptionStyle + label/description),
      `draftFromPreset`, `updateDraft` (immutable, numbered-fields clamped),
      `customIdForLabel` (`custom-<slug>`, backend-compatible), `finalizeDraft`
      (returns `Preset`-shaped payload incl. category Custom), `resolveCaptionStyle`.
  - Acceptance: criteria 1–2, 7.
  - Verify: `npx vitest run src/editor/templateEditor.test.ts` (RED) → full FE.
  - Files: `templateEditor.ts`, `templateEditor.test.ts`.

### Task 2 — API overwrite (slice 2)
- [ ] `PUT /api/presets/{id}`: 200 updated dict / 403 `BUILTIN_PRESET` / 404 /
      422 `PRESET_INVALID`; persists via `save_registry_presets`.
  - Acceptance: criteria 3–5.
  - Verify: `uv run pytest tests/test_preset_import.py` (RED) → full backend.
  - Files: `main.py`, `test_preset_import.py`.

### Task 3 — services/store + render wire (slice 3)
- [ ] `services/presets.ts` `updatePreset(id, payload)`; `presetStore.savePreset`
      (POST if absent / PUT if present, local upsert, error surface);
      CaptionPanel `captionToWire` + style select list presets.
  - Acceptance: criteria 6, 8.
  - Verify: `npx vitest run src/services src/store src/components/CaptionPanel*` (RED).
  - Files: `services/presets.ts`, `store/presetStore.ts`, `CaptionPanel.tsx`.

### Task 4 — TemplateEditorPanel (slice 4)
- [ ] Base preset select, label/description, font (text + imported-font drop),
      size, colors, outline, alignment, toggles, live preview, Save-as-new,
      Overwrite (customs only), error/empty states; mount in InspectorPanel; CSS.
  - Acceptance: criteria 9–10 + keyboard/ARIA (labeled inputs, semantic buttons).
  - Verify: component tests + full suite + build + lint.
  - Files: `TemplateEditorPanel.tsx`, `.test.tsx`, `InspectorPanel.tsx`, `App.css`.

### Task 5 — docs + graph (slice 5)
- [ ] D-024, ROADMAP template-editor tick, FEATURES, SESSION_LOG 17, todo ticks,
      graphify update, full regression (backend 203+, frontend 225+, build, lint).

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Render gap (module-2) regresses | only `captionToWire` + select touched; parity when no presets |
| Slug collisions on Save-as-new | backend duplicate → 422 `PRESET_INVALID`, surfaced; user edits label |
| Overwrite smuggling built-in edits | API 403; UI hides Overwrite for built-in base |
| Font picker licenses | dropdown lists imported fonts only (license tracked at import) |

## Checkpoints

- After slices 1–3: resolveCaptionStyle proven; save/overwrite round-trip green.
- After slice 4: full FE suite + build + lint + accessibility pass.
- After slice 5: full regression; push on go-ahead.

## Open questions

1. Default-template-for-future-captions deferred to M8 (default) vs in-module.
2. Caption style select keeps M5 15 + preset options (default: yes, M5 first).