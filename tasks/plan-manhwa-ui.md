# plan — M7 module 7 `panel-ui`

Contract: `docs/SPEC-m7-panel-ui.md`. UI rules: `docs/UI_SPEC.md` §5 (§7 states).

## Slices

### Slice 1 — services/manhwa.ts (RED→GREEN)

- Types: `ManhwaPanel`, `ManhwaStripSummary`, `ManhwaStripDetail`, `UploadResult`
  (detect response with `panels`), `ManhwaOp` discriminated union, `ManhwaError`.
- Defensive parsers `parseStripSummaryList / parseStripDetail / parseDetectResult`
  (`match.ts` style — normalize, tolerate junk, `ManhwaError` on wrong shape).
- Calls: `manhwaBase()`, `listStrips`, `uploadStrip` (multipart), `getStrip`,
  `applyCorrection` (PATCH), `redetectStrip`, `deleteStrip` (expects 204),
  `sourceUrl`, `panelUrl`, `exportUrl`.
- Errors surface `{error.code}` + message on non-OK.
- Tests: parsers + each call via stubbed `fetch` (node env), incl. error paths.

### Slice 2 — store/manhwaStore.ts (RED→GREEN)

- Status: `idle | uploading | loading | error(error)`; `strips`, `currentId`, `detail`.
- `refresh()` sets loading→lists; `select(id)` loads detail; `upload(file)` imports
  the File into project assets (editorStore.addAsset) then POSTs and selects;
  `apply(op)` PATCHes, updates detail; `redetect()`; `remove(id)` 204 then refresh.
- Any failure → `{phase:'error', error}`; guard actions that need a strip/panel.
- Tests: node env, stubbed fetch; assert each state transition + error.

### Slice 3 — ManhwaPanel (review) (jsdom)

- Render `ManhwaPanel`:
  - Empty: drop zone + "Add long strip" (still image-ish hint), no fake buttons.
  - Uploading/loading: disabled controls + status text (aria-busy).
  - Error: message + retry (re-call refresh/upload attempt).
  - List: strip rows (sourceFile, panelCount, correctedCount), select + delete.
  - Detail: rows per panel — number, confidence %, userCorrected marker,
    thumbnail (`panelUrl`), low-confidence flag + "check" hint.
- `aria-selected`; row buttons; keyboard-focusable.
- Tests: empty state; list render; select → detail; thumbnail src uses API URL;
  low-confidence flag; delete first then list updates.

### Slice 4 — ManhwaPanel (actions)

- Toolbar (per selected panel): Split (slider → pixel y, Apply), Merge next,
  Merge previous, Crop/adjust (x/y/w/h number inputs + Apply), Delete.
- Add panel manually (full-width band below previous / top when none).
- Strip-level: Re-detect, Reset detection.
- Reorder: HTML5 drag rows + Move up/down buttons.
- Export PNG / JPG → anchor href to `exportUrl`; success row "N panels exported";
  export error state for non-2xx.
- Tests: split button dispatches `{op:'split',panelId,y}`; merge/delete/add/
  adjust; reorder dispatch order; export hrefs; success line.

### Slice 5 — wiring + CSS

- `App.tsx` left rail: tabs `Media | Manhwa` (default Media), renders ManhwaPanel.
- `App.css` styles: rail tabs, drop zone, strip rows, panel rows, toolbar,
  low-confidence accent (consistent tokens; no AI-slop).
- App render test still passes; lint + tsc clean.

### Slice 6 — docs/regression

- D-033; ROADMAP module 7 ✅ + M7 complete status; FEATURES block; SESSION_LOG 26;
  CONSTRAINTS frontend count + backend row if affected; `graphify update .`;
  full `vitest run` + `npm run build` + `npm run lint`; commit; push gate.

## Verification commands

- Service/store: `npx vitest run src/services/manhwa.test.ts src/store/manhwaStore.test.ts`
- Component: `npx vitest run src/components/ManhwaPanel.test.tsx`
- Full: `npx vitest run && npm run build && npm run lint`
- Backend unchanged this module (module 6 shipped).