# Spec: template-editor (M6 module 4)

## ASSUMPTIONS I'M MAKING
1. "Template" here = a caption style preset (the module-2 `Preset` model). The
   editor edits preset properties, not whole-video templates — complete-video
   templates stay a later follow-up (they are out of the M6 module-4 list).
2. The M5 flag toggles (karaoke, wordHighlight, importantWordPop, punctuation,
   emoji, rtl) ARE the draft spec's "animation controls" for this module.
   Kinetic/manga-style *auto-animation* (speed lines, `\move`, `\t` sweep) is
   module 5 `animated-captions` — the editor exposes the flags, the module-5
   renderer animates them.
3. Save targets: **Save as new** → `POST /api/presets` (Custom category, id =
   `custom-<slug(label)>` via a pure `customIdForLabel` mirror of the backend
   `suggested_custom_id`); **Overwrite** → `PUT /api/presets/{id}` (new backend
   endpoint). Built-ins are never overwritten (403) — UI hides Overwrite for
   them, so editing a built-in always produces a Custom copy.
4. **Render resolution gap (module-2 latent bug) is in scope**: a caption whose
   `styleId` is a preset id currently falls back to `normal` on render
   (`getCaptionStyle` only knows the 15 M5 styles). Template-editor output must
   actually render, so `captionToWire` resolves preset ids via the preset store
   and the CaptionPanel style select lists preset options. Small, contained.
5. No project-level "default template for future generated captions" in this
   module — deferred so the scope stays tight (see Open questions).
6. Backend `PUT /api/presets/{id}` reuses `import_preset_payload` validation
   (Custom force, `custom-` prefix, licenseRef gate) and only updates in place.

## Objective

A visual preset editor: pick a base preset, edit style + preset metadata with a
live preview, and save it as a new Custom preset or overwrite an existing Custom
preset. Presets produced here apply and render like any other preset.

## Acceptance criteria

| # | Criterion | How to verify |
|---|-----------|---------------|
| 1 | Edits on a draft never mutate the base preset | `updateDraft` returns a new object — unit test |
| 2 | `customIdForLabel` slug is `^custom-...$` that passes the backend regex | unit test cross-check |
| 3 | Overwriting a built-in via API → 403 `BUILTIN_PRESET` | API test |
| 4 | `PUT /api/presets/{id}` updates a Custom preset in place and persists | API test (registry re-read) |
| 5 | `PUT` of a missing id → 404; invalid body → 422 `PRESET_INVALID` | API test |
| 6 | `presetStore.savePreset` POSTs when unknown, PUTs when present, upserts locally | store test |
| 7 | `resolveCaptionStyle(prefab, presets)` returns preset style for preset ids, M5 fallback otherwise | unit test |
| 8 | `captionToWire`/style select resolve preset-applied captions to their real style | component test |
| 9 | Panel: pick base → edit size/color/alignment/flag → preview reflects it | component test |
| 10 | Panel: Save-as-new POSTs `{kind:lava-preset}` with custom slug; built-in base has no Overwrite | component test |
| 11 | No unrelated regressions | backend 203 → 203+n; frontend 225 → 225+n; build + lint clean |

## Slices

| Slice | Scope | RED gate |
|-------|-------|----------|
| 1 — pure | `editor/templateEditor.ts`: `PresetDraft`, `draftFromPreset`, `updateDraft`, `customIdForLabel`, `finalizeDraft` (→ valid `Preset` payload), `resolveCaptionStyle` | vitest units |
| 2 — API | `PUT /api/presets/{id}` (200 / 403 / 404 / 422) in main.py | pytest API tests |
| 3 — services/store+wire | `services/presets.ts` `updatePreset`; `presetStore.savePreset`; CaptionPanel `resolveCaptionStyle` + preset-option style select | store/component tests |
| 4 — UI | `TemplateEditorPanel.tsx`: base select, label/description, font (free text + imported-font picker), size, colors, outline, alignment, toggles, live preview, Save-as-new + Overwrite, error surface; mount in InspectorPanel; CSS | component tests |
| 5 — docs | D-024, SESSION_LOG 17, ROADMAP template-editor tick, FEATURES, graphify, regression | full green |

## Files

| File | Change |
|------|--------|
| `frontend/src/editor/templateEditor.ts` | NEW — pure draft model + resolver |
| `frontend/src/editor/templateEditor.test.ts` | NEW |
| `frontend/src/services/presets.ts` | EXTEND — `updatePreset` |
| `frontend/src/store/presetStore.ts` | EXTEND — `savePreset` (create-or-update) |
| `frontend/src/components/CaptionPanel.tsx` | EXTEND — resolve preset styles + option list |
| `frontend/src/components/TemplateEditorPanel.tsx` | NEW |
| `frontend/src/components/TemplateEditorPanel.test.tsx` | NEW |
| `frontend/src/components/InspectorPanel.tsx` | EXTEND — mount panel |
| `frontend/src/App.css` | EXTEND `.template-*` |
| `backend/src/lava_backend/main.py` | EXTEND — `PUT /api/presets/{id}` |
| `backend/tests/test_preset_import.py` | EXTEND — PUT tests |
| `docs/*` | D-024, SESSION_LOG 17, ROADMAP, FEATURES |

## Open questions

1. **Default template for future captions** — defer to M8 integrated editor, or
   should this module also add `project.templateId` used when generating
   captions? (Default: defer; ask if wanted.)
2. **GetCaptionStyle select of M5 styles** — keep the 15 M5 entries in the
   Caption select plus presets, or merge them? (Default: keep both, M5 first.)