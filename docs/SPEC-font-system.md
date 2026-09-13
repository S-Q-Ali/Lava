# Spec: font-system (M6 module 1)

Module id: `font-system`. Depends on: M5 `caption-styles` (family names), M5 `caption-render`
(libass `ass=` filter). First M6 module per approved capability map.

## Objective

Let users import personal/original fonts so captions stop depending on safe CSS stacks. A font
is uploaded to the project-local backend `fonts/` dir, extracted for its real family name, tagged
with user-supplied license metadata, listed/removed on demand, and made available to the libass
burn-in renderer via `fontsdir`. Frontend previews with `@font-face` only — rendering stays 100%
backend/libass. No proprietary or unlicensed fonts are bundled; M6 ships no bundled fonts.

## Scope

- Backend:
  - `fonts.py` — pure helpers: `.ttf/.otf` extension + SFNT signature validation
    (0x00010000, `OTTO`, `true`, `ttcf`), hand-rolled SFNT `name`-table reader for the family
    name (platform 3/0, nameID 1 → 16 fallback → 4; no new dependency), `FontMetadata`
    dataclass + registry load/save (`fonts/licenses.json`).
  - `Config.fonts_dir`, `Config.presets_dir` added (presets used by module 2).
  - `main.py` routes (v1):
    - `POST /api/fonts` (multipart file + license fields) → 201 `FontMetadata`
      (`FONT_INVALID` 422: extension/signature; `INVALID_BODY` 422: bad license JSON).
    - `GET /api/fonts` → list; `GET /api/fonts/{id}/file` → bytes (for `@font-face`);
      `DELETE /api/fonts/{id}` → 204.
  - Render integration: `media.py` `ass=` filter gains `:fontsdir={escaped}` pointing at
    `fonts_dir`; parity preserved — when no captions or no fonts exist the graph is unchanged.
- Frontend:
  - `editor/fonts.ts` — pure model + helpers (extension/reg hints, registry parse, metadata
    validation mirror).
  - `services/fonts.ts` — API client (upload/list/file/delete).
  - `store/fontStore.ts` — `fonts: FontMetadata[]`, `refreshFonts`, `importFont`, `removeFont`;
    non-temporal (font registry is a library, not a timeline edit).
  - `components/FontPanel.tsx` — inspector: font list (family, fileName, license badge),
    Import (file picker + license type/source fields), Remove, `@font-face` preview registration.
- Strictly out of scope: preset registry/categories (module 2 `preset-registry`), template
  editor (module 4), animated ASS treatments (module 5 `animated-captions`), bundled fonts,
  font lookup by content hash, multi-user sharing.

## Commands

```
Backend:  uv run pytest tests/                (backend dir)
Frontend: npx vitest run ; npm run build ; npm run lint   (frontend dir)
```

## Project structure (touched)

```
backend/src/lava_backend/fonts.py               → validation, name extraction, registry, FontMetadata
backend/src/lava_backend/config.py              → fonts_dir, presets_dir
backend/src/lava_backend/main.py                → /api/fonts routes + font wire
backend/src/lava_backend/media.py               → ass=:fontsdir= integration
backend/tests/test_fonts.py (new)               → pure + API + real-ass smoke
frontend/src/editor/fonts.ts + test              → pure model
frontend/src/services/fonts.ts + test            → API client
frontend/src/store/fontStore.ts + test           → registry state
frontend/src/components/FontPanel.tsx + test     → import/list/remove/preview
frontend/src/components/InspectorPanel.tsx       → mount FontPanel
fontServer dirs: fonts/ (gitignored, backend-managed), root studio.config stays
```

## Code style

Project patterns: frozen dataclasses + pure helpers on the backend, no new deps, SFNT parsing
kept minimal and commented only where the format requires it; `ApiError` conventions
(`FONT_INVALID`/`INVALID_BODY`/`NOT_FOUND`/`FILE_COUNT_MISMATCH`-style codes); frontend
kebab-case modules, camelCase functions, `aria-label` on controls, scalar store selectors
(object-literal selectors wrapped in `useShallow`), no comments, no new deps. Storage ids are
`font-` + hex, files named `<id>.ttf|otf` (original name kept in metadata only) — no
path-traversal surface beyond existing `SAFE_FILENAME`/`JOB_ID` guards.

## Testing strategy

- Backend (pytest): extension+signature validation (bad magic → `FONT_INVALID`), family-name
  extraction from a real `.ttf`/`.otf` fixture (copied from system fonts at test time;
  fallback chain when the name table lacks nameID 1), registry save/load round-trip, API:
  201 upload + metadata, 422 bad extension, GET list, GET file bytes, DELETE 204 + gone, and a
  real-ffmpeg smoke — render captions whose style references an uploaded font family with
  `fontsdir`; parity smoke — no captions → graph unchanged.
- Frontend (vitest): pure model tests (extension/registry/metadata validation), store tests
  (refresh/import/remove), client tests with `fetch` mock (patterns from `services/match`),
  jsdom `FontPanel` component tests (import flow fields, list rendering, remove, error state),
  inspector mount keeps App regression green.
- Assert prior suites stay green: frontend 174, backend 140.

## Boundaries

- Always: validate extension+signature before storing; persist license metadata for every
  font; `fonts_dir` under project root; run both suites + frontend build/lint before commit.
- Ask first: adding a dependency (e.g. `fontTools`) — spec default is hand-rolled parser; any
  bundled-font plan; changing project file version.
- Never: store user font assets in git (`fonts/` gitignored); claim bundled-font licensing;
  commit binary fonts; overwrite a registry entry silently (id collisions → 422).

## Success criteria (testable)

1. Backend rejects non-`.ttf`/`.otf` files and bad SFNT magic with 422 `FONT_INVALID`.
2. Backend extracts a real family name from `.ttf` and `.otf` fixtures via the name table
   (nameID 1 with 16 as fallback), no new dependency.
3. `POST /api/fonts` stores `<id>.<ext>` under `fonts_dir`, records `FontMetadata`
   (id/family/fileName/license/licenseSource/addedAt) in `fonts/licenses.json`, returns 201.
4. `GET /api/fonts` lists registry; `GET /api/fonts/{id}/file` returns the bytes;
   `DELETE /api/fonts/{id}` removes file + registry entry (204, then 404).
5. Renderer: when captions are present and fonts exist, the `ass=` filter includes
   `:fontsdir=…`; when no captions, filter_complex is byte-identical to before (parity test).
6. Real-ffmpeg smoke: render captions styled with an uploaded system font family succeeds and
   output keeps expected duration.
7. Frontend `FontPanel` shows the list with license badge, imports a font (license fields →
   POST), removes it, and registers an `@font-face` from the file URL; App mount regression stays
   green.
8. Project model untouched (version stays 1); `CaptionStyle.fontFamily` strings can reference
   imported families without any project-schema change.

## Open questions

- None blocking. License shape frozen as `{ type: 'open'|'commercial'|'personal'|'unknown',
  source?: string; embeddingAllowed: boolean }`; editor collects these on import; `unknown`
  is the explicit default when the user skips them. Extraction fidelity for exotic name tables
  is best-effort (fallback chain documented); M9 hardware pass can revisit if needed.