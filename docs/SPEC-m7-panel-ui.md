# SPEC — M7 module 7 `panel-ui` (Frontend Manhwa Correction View)

## Objective

Give the editor a visual Manhwa correction view backed by the module 6 API —
drop a long strip, review detections, correct them in plain language, reorder by
drag, and download PNG/JPG panel exports — all without surfacing
computer-vision vocabulary.

## Capability map (module unit)

M7 module 7 `panel-ui` (per `SPEC-m7-capability-map.md`): long-strip drop, detection
review (preview + number + confidence), correction actions, drag reorder, export
downloads; original preserved in project.

## Scope

- **Long-strip drop** — file picker + drag-and-drop; multipart upload to
  `/api/manhwa/strips`; the original File is also registered into the project's
  media assets (importer) so the original is preserved in-project.
- **Detection review** — for every panel: panel number, confidence (0–100%),
  thumbnail preview (re-generated from the original via the API, never stale).
- **Correction actions** — Split panel (with a pixel split line), Merge with
  next, Merge with previous, Crop/adjust bounds, Delete false detection, Add
  panel manually, Re-detect, Reset detection — labelled in plain language, no
  CV vocabulary.
- **Reorder** — drag-and-drop on panel rows **and** Move up / Move down buttons
  (keyboard-accessible fallback).
- **Export** — PNG and JPG download buttons that open the API zip export; a
  success line reports how many panels shipped.
- **States** (UI_SPEC §7) — loading (upload/detect running), empty (no strips,
  guided first step), error (recoverable, actionable), confidence/warning
  (low-confidence panels flagged with a check suggestion), success (export).

## Out of scope

- Backend changes (module 6 shipped). Inline full-res bounding-box crop handles
  in the strip preview (panel review is row-based; geometry editing happens via
  numeric crop bounds). Automated UI a11y/E2E tooling.

## Placement & layout

UI_SPEC §4 allows an additional panel/drawer for extracted Manhwa panels. The
left column becomes a tabbed **Media | Manhwa** rail; default tab stays Media so
the main editor is untouched. The Manhwa view is one dense panel:

- Top: file picker + drop zone.
- Strip list (sourceFile, panel count, corrected count, delete).
- Selected strip: scrollable panel rows (drag handle, number, confidence,
  userCorrected marker, thumbnail, move up/down), correction toolbar, export row.

## API contract (back-front ground truth)

Base URL from `backendBaseUrl()`; all endpoints under `/api/manhwa`.

| Interaction | Request | Response |
| --- | --- | --- |
| List | `GET /strips` | `{strips: [{sourceId, sourceFile, width, height, mime, panelCount, correctedCount}]}` |
| Upload | `POST /strips` (multipart `file`) | 201 detect result `{sourceId, sourceFile, width, height, mime, panels: Panel[], saved, cachePath, analysis}` |
| Detail | `GET /strips/{id}` | `{... detail fields, panels: Panel[]}` |
| Correct | `PATCH /strips/{id}/panels` `{op, …}` | 200 detail `{panels}` |
| Re-detect | `POST /strips/{id}/redetect` | detect result with panels |
| Delete | `DELETE /strips/{id}` | 204, no body |
| Source image | `GET /strips/{id}/source` | image bytes |
| Panel image | `GET /strips/{id}/panels/{panelId}` | PNG bytes |
| Export | `GET /strips/{id}/export?format=png|jpg` | zip (attachment) |

`Panel = {id, sourceId, x, y, w, h, confidence, order, userCorrected}`.
Errors: `{error:{code,message}}`, HTTP 400/404/422/500.

Correction ops and their payloads:

- `{op:'split', panelId, y}` — y strictly inside the panel in source px.
- `{op:'merge', ids:[a,b]}` — b merged into a; adjacent.
- `{op:'adjust', panelId, x, y, w, h}` — bounds within source.
- `{op:'delete', panelId}`
- `{op:'add', x, y, w, h, afterId?}`
- `{op:'reorder', ids}` — exact permutation.
- `{op:'reset'}` — empty list.

## Store shape

`manhwaStore` (zustand):

```
status: idle | uploading | loading | error(error)
strips: ManhwaStripSummary[]
currentId: string | null
detail: ManhwaStripDetail | null
refresh()  select(id)  upload(file)  apply(op)  redetect()  remove(id)
```

`upload()`: register original into project assets first (importer), then POST;
uploads that fail still keep the file out of the failure state if registration
succeeded (original preserved). Detection-panel re-detect responses set detail.

## TDD slices

1. **services/manhwa.ts** + tests — typed client + defensive parsers +
   `ManhwaError(code)`; every fetch path stubbed.
2. **store/manhwaStore.ts** + tests — state transitions incl. error handling.
3. **ManhwaPanel** (read/review) — empty/loading/error/list/detail/thumbnails +
   tests (jsdom createRoot/act).
4. **ManhwaPanel** (actions) — split/merge/crop/delete/add/reorder(drag+buttons)/
   redetect/reset/export + tests.
5. **Wiring + CSS** — App left-rail tabs (default Media), stylesheet additions,
   App-level render sanity test.
6. **Docs + regression + commit** — D-033, ROADMAP (module 7 ✅, M7 complete),
   FEATURES, SESSION_LOG 26, CONSTRAINTS rows, graphify, push gate.

## Definition of done

All the above slices green (frontend test count must not fall), `tsc -b` clean,
oxlint clean, no `@ts-ignore`/skips, docs + CONSTRAINTS committed, graph
updated, report written; push only after user go-ahead.