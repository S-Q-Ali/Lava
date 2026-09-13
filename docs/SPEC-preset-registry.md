# Spec: preset-registry (M6 module 2)

## Scope

Build the caption-preset registry: extend the M5 `CaptionStyle` model with category, version, tags and font-binding metadata; serve the built-in 15 presets (already shipped) + any user-added presets via a backend JSON registry; provide a browsable-by-category frontend panel that applies a selected preset to one or more caption items.

Module 2 does **not** implement custom preset import (module 3) or template editing (module 4). Its API surface is therefore read-only (`GET /api/presets`) — no `POST`/`DELETE` yet. This matches the font-system pattern where the upload API shipped in slice 2 (after the pure layer).

## Architecture decisions

- **`Preset` extends `CaptionStyle`** — the M5 model gains four optional/required fields:
  ```
  { ...CaptionStyle,
    category: string,       // one of BUILTIN_CATEGORIES
    presetVersion?: string, // for user presets; absent on built-ins
    tags?: string[],        // free-text search surface
    licenseRef?: string,    // font-system id (font-<hex>) or absent
  }
  ```
  `CaptionStyle` stays the sub-type used by captions.ts / CaptionPanel / renderer — no breaking change. `Preset` is the registry type.

- **Built-in presets have stable ids** — the 15 existing `CAPTION_STYLES` ids (`normal`, `karaoke`, etc.) become `BUILTIN_PRESETS` with assigned categories. No id collision between built-in and user presets (module 3 will prefix user presets `custom-<uuid>`).

- **Registry file ships as a JSON array** — `presets/registry.json` on disk. First load: seeded from the 15 built-ins. The JSON contains the full `Preset` objects (not just ids). The backend `presets.py` pure layer loads/saves this file; the `GET /api/presets` route returns it. `save_registry` is called only from the API (module 3 import POST) or CLI seeding.

- **13 categories** — `["Trending","New","Shorts","Reels","YouTube","Anime","Manhwa","Storytelling","Cinematic","Motivation","Meme","Documentary","Custom"]`. Trending is updateable by editing the registry JSON — no live fetch.

- **Category assignment for the 15 built-ins** — sensible defaults chosen to spread across categories while leaving most in `Custom` (the 15 are generic, not tied to a platform theme):
  | preset id | category |
  |-----------|----------|
  | normal | Custom |
  | word-highlight | YouTube |
  | karaoke | Shorts |
  | important-word-pop | Reels |
  | punctuation | Custom |
  | hook | YouTube |
  | manga | Anime |
  | cinematic | Cinematic |
  | meme | Meme |
  | storytelling | Storytelling |
  | urdu | Custom |
  | roman-urdu | Custom |
  | english | Custom |
  | mixed | Custom |
  | emoji | Shorts |

- **Font binding is optional** — `licenseRef` references a font-system `FontMetadata.id`. The preset registry does **not** validate the font exists at load time (graceful degradation: captions still render; the family in `fontFamily` is a CSS string; if it references an imported family and the font is present, libass uses it). Validation happens only at preset-import time (module 3).

- **`getCaptionStyle` backward compatibility** — `captionStyles.ts` `getCaptionStyle(id)` continues to work by falling back to the hardcoded `CAPTION_STYLES` if the preset store is unavailable (offline, first render). In normal flow the frontend `presetStore` provides the canonical list; `getCaptionStyle` is called from tests and directly by `CaptionPanel` — we keep both paths: the store is the primary source; the static array is the safety net.

## Acceptance criteria

| # | Criterion | How to verify |
|---|-----------|---------------|
| 1 | 13 category constants exist | `BUILTIN_CATEGORIES.length === 13` (unit test) |
| 2 | Each built-in preset has a valid category | `BUILTIN_PRESETS.every(p => BUILTIN_CATEGORIES.includes(p.category))` |
| 3 | `validatePreset` rejects invalid category | RED test: `{...good, category:'viral'}` → raises |
| 4 | Registry round-trip | load → save → load yields same data (backend unit) |
| 5 | `GET /api/presets` returns all presets with 200 | API test |
| 6 | Frontend presetStore loads from API and exposes `byCategory` map | store test |
| 7 | PresetPanel renders category tabs and preset cards | component test (createRoot + act) |
| 8 | "Apply" button on a preset card calls `applyPreset` on the store, updating target captions' styleId | component test + store test |
| 9 | `getCaptionStyle` still works for all 15 built-in ids | existing + new unit tests |
| 10 | No unrelated regressions | full backend 165 → 165+n; frontend 193 → 193+n; build + lint clean |

## Slices

| Slice | Scope | RED gate |
|-------|-------|----------|
| 1 — pure | `preset_registry.py` (Preset, BUILTIN_PRESETS, BUILTIN_CATEGORIES, validate, load/save) + `editor/presets.ts` | Unit tests only |
| 2 — API | `GET /api/presets` + real-registry smoke | API test added |
| 3 — frontend model + store | `editor/presets.test.ts` (parser), `store/presetStore.ts` + test | Store tests |
| 4 — PresetPanel | `components/PresetPanel.tsx` (tabs + cards + apply) + InspectorPanel mount + CSS | Component test |
| 5 — docs | D-022, SESSION_LOG 15, ROADMAP M6 tick, graphify | Green full regression |

## Files

| File | Change |
|------|--------|
| `backend/src/lava_backend/preset_registry.py` | NEW — Preset model, BUILTIN_PRESETS, validate, load/save |
| `backend/src/lava_backend/config.py` | ADD `presets_dir` (already added in font-system slice 1) |
| `backend/src/lava_backend/main.py` | ADD `GET /api/presets` route |
| `backend/tests/test_preset_registry.py` | NEW — unit + API tests |
| `frontend/src/editor/presets.ts` | NEW — Preset interface, parsePreset, BUILTIN_CATEGORIES |
| `frontend/src/editor/presets.test.ts` | NEW — parsing + category tests |
| `frontend/src/store/presetStore.ts` | NEW — load + byCategory + applyPresetToCaptions |
| `frontend/src/store/presetStore.test.ts` | NEW — store tests |
| `frontend/src/components/PresetPanel.tsx` | NEW — category tabs + preset cards + apply button |
| `frontend/src/components/PresetPanel.test.tsx` | NEW — component tests |
| `frontend/src/components/InspectorPanel.tsx` | MOUNT — add PresetPanel |
| `frontend/src/App.css` | ADD `.preset-*` styles |
| `docs/DECISIONS.md` | D-022 |
| `docs/SESSION_LOG.md` | Session 15 |
| `docs/ROADMAP.md` | M6 preset-registry tick |
| `docs/FEATURES.md` | §6 update |

## Open questions

None. Trending is updateable by JSON edit (no live fetch). License binding is purely optional at this stage.
