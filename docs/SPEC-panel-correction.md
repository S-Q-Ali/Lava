# SPEC — M7 module 5: `panel-correction`

## Objective

Pure, list-level correction ops over the registry's panels: **Split, Merge
(next/previous), Adjust bounds, Delete, Add, Reorder**, plus a **Re-detect**
convenience and **Reset**. Ops never touch the original image, never mutate a
`Panel` in place (frozen dataclass → `replace`), always mark affected panels
`user_corrected=True`, keep ids stable, and always return a **normalized
sequence** (1..n `order`) whose list order is the user's intent — the exact
order export honors (module 4) and the API persists (module 6).

## Sequence semantics (important — module-3 contract stays intact)

`guard_layout` (module 3) sorts `(y, x)` and renumbers — that stays for
detection. Manual correction introduces a second kind of constraint: a user
may intentionally re-sequence panels (Reorder) or insert one (Add after X).
So module 5 adds **`normalize_layout`** to `order.py`: it runs the same
validation (non-empty → `ManhwaError`, unique ids, no positive-area overlap)
but renumbers **in place, preserving the given sequence** instead of sorting.
Exports (module 4) change to honor `panel.order` + natural sequence, so a
corrected reading order is real, not cosmetic.

## Commands

```
Test:       uv run pytest tests/test_manhwa_correct.py -q
Regression: uv run pytest
```

## Functions

`order.py` additions:
```
validate_layout(panels) -> list[Panel]      validation only, no sorts/renumber
normalize_layout(panels) -> list[Panel]     validate + renumber 1..n, sequence
                                            preserved; [] is allowed (delete/reset);
                                            consumers that need a non-empty LAYOUT
                                            still call guard_layout (e.g. export).
```
`guard_layout` keeps sorting `(y,x)` (module-3 public behavior unchanged):
internally it becomes `order_panels(validate_layout(panels))`.

`correct.py`:
```
split_panel(panels, panel_id, y_split) -> list[Panel]
    y_split strictly inside the panel (y < y_split < y+h) → two panels; the top
    half keeps `id`, a fresh `pN` id goes to the bottom half; both inherit the
    parent confidence and get user_corrected=True; box math source-anchored.

merge_panels(panels, a_id, b_id) -> list[Panel]
    union box of the two; result keeps a_id, confidence = min(a,b),
    user_corrected=True; raises ManhwaError if the union overlaps a third panel.

adjust_panel(panels, panel_id, *, x, y, w, h) -> list[Panel]
    replace the panel's bounds (must stay inside source w/h and stay ≥1px);
    user_corrected=True; raises ManhwaError if bounds now overlap a neighbor.

delete_panel(panels, panel_id) -> list[Panel]
    drop the panel; remaining panels renumbered; MAY return [] (last panel).

add_panel(panels, *, x, y, w, h, after_id=None) -> list[Panel]
    fresh `pN` id, confidence 1.0 (user assertion), user_corrected=True;
    inserted after `after_id` (default: end of sequence); raises ManhwaError if
    it overlaps existing panels.

reorder_panels(panels, ordered_ids) -> list[Panel]
    `ordered_ids` must be an exact permutation of current ids (ValueError
    otherwise); every panel is re-sequenced and all get user_corrected=True
    (the whole reading order is now user-curated).

redetect(source: Image.Image, *, source_id: str) -> list[Panel]
    thin passthrough to `detect_strip` returning fresh normalized panels
    (module 2) — re-detect is "call detection again, replace the panel list".

reset(registry) -> None         registry.reset_panels() (already in module 1)
```

`normalize_layout` result of every op is what the API (module 6) persists; the
UI (module 7) renders `panel.order` as its sequence.

## Wire precedence

- `panel-order` owns validation/ordering; `correct` only orchestrates edits
  then calls `normalize_layout`.
- Export honors the sequence: `materialize_export` re-sequences by
  `panel.order` before encoding (module-4 change, documented in D-031).
- Registry persistence/HTTP stay in module 6; `correct` is pure
  `list[Panel] → list[Panel]` (plus the two IO-thin helpers above).

## Testing (TDD)

- `normalize_layout`: preserves given sequence (no resort); renumbers 1..n;
  idempotent; []; dup ids → ManhwaError; overlap → ManhwaError.
- `split_panel`: geometry (top height = y_split − y); ids stable + fresh id
  sequential; both halves user_corrected; confidence inherited; y_split on the
  boundary / outside → ManhwaError; split last panel OK.
- `merge_panels`: union box exact; confidence min; overlap-with-third →
  ManhwaError; missing id → ManhwaError.
- `adjust_panel`: bounds replaced; outside source → ManhwaError; overlap →
  ManhwaError; user_corrected set.
- `delete_panel`: removed; order renumbered 1..n; deleting all → [];
  ids stable.
- `add_panel`: fresh id (reuses gaps); after_id insertion position; overlap →
  ManhwaError; confidence 1.0.
- `reorder_panels`: permutation accepted (order field = given sequence);
  non-permutation (missing/extra id) → ValueError; all panels flagged.
- Round trips: detection (module 2) → split + adjust + export (module 4)
  builds a bundle whose manifest matches the corrected 1..n; real clean
  fixture: split → 2 exports tile exactly the source region of the parent.
- `redetect`: returns a guarded reading-ordered panel list for a fixture.

## Boundaries

- Always: pure list ops; frozen-panel discipline; ids stable across ops;
  `user_corrected` honored and never silently cleared; original image
  untouched; order number = sequence position only.
- Ask first: multi-column layouts, partition-style splits (deferred), batch
  reorder across strips, undo history/transactions.
- Never: mutate panels in place; re-sort a user's renumbered sequence; drop
  `user_corrected`; resize or crop the original.