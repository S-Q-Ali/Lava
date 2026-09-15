# Graph Report - frontend  (2026-09-15)

## Corpus Check
- 87 files · ~34,626 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 606 nodes · 1476 edges · 18 communities (16 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3bb73a70`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- vitest
- PreviewPanel.tsx
- PresetPanel.test.tsx
- editorStore.ts
- matchingStore.ts
- manhwa.ts
- useEditorStore
- transitions.ts
- package.json
- ops.ts
- project.ts
- captions.ts
- compilerOptions
- compilerOptions
- .oxlintrc.json
- .prettierrc.json
- tsconfig.json
- README.md

## God Nodes (most connected - your core abstractions)
1. `useEditorStore` - 59 edges
2. `vitest` - 34 edges
3. `EditorActions` - 33 edges
4. `react` - 20 edges
5. `Asset` - 18 edges
6. `compilerOptions` - 18 edges
7. `backendBaseUrl()` - 16 edges
8. `compilerOptions` - 15 edges
9. `PreviewPanel()` - 14 edges
10. `Preset` - 14 edges

## Surprising Connections (you probably didn't know these)
- `ProjectFile` --references--> `TimelineModel`  [EXTRACTED]
  frontend/src/editor/project.ts → frontend/src/editor/types.ts
- `App()` --calls--> `getFFmpegProvider()`  [EXTRACTED]
  frontend/src/App.tsx → frontend/src/services/ffmpeg.ts
- `App()` --calls--> `useEditorStore`  [EXTRACTED]
  frontend/src/App.tsx → frontend/src/store/editorStore.ts
- `CaptionPanel()` --calls--> `useEditorStore`  [EXTRACTED]
  frontend/src/components/CaptionPanel.tsx → frontend/src/store/editorStore.ts
- `FontPanel()` --calls--> `backendBaseUrl()`  [EXTRACTED]
  frontend/src/components/FontPanel.tsx → frontend/src/services/ffmpeg.ts

## Import Cycles
- None detected.

## Communities (18 total, 2 thin omitted)

### Community 0 - "vitest"
Cohesion: 0.07
Nodes (50): vitest, CaptionPanel(), captionToWire(), transcript, unmount(), voice, FLAGS, TemplateEditorPanel() (+42 more)

### Community 1 - "PreviewPanel.tsx"
Cohesion: 0.07
Nodes (32): captionsRenderPayload(), formatTime(), MediaElement, PreviewPanel(), unmount(), clipsAtTime(), DEFAULT_BASE_URL, detectProvider() (+24 more)

### Community 2 - "PresetPanel.test.tsx"
Cohesion: 0.08
Nodes (29): FONT_EXTENSIONS, FontPanel(), LICENSE_TYPES, arial, unmount(), PresetPanel(), jsonResponse(), presets (+21 more)

### Community 3 - "editorStore.ts"
Cohesion: 0.09
Nodes (35): MOTION_TYPES, MotionPanel(), applyClips(), clipWith(), imageAsset, unmount(), videoAsset, DragMode (+27 more)

### Community 4 - "matchingStore.ts"
Cohesion: 0.07
Nodes (35): MatchPanel(), Beat, labelFor(), PAUSE_BEAT_THRESHOLD, segmentBeats(), splitSegment(), wordsInPart(), hasTimingOverride() (+27 more)

### Community 5 - "manhwa.ts"
Cohesion: 0.11
Nodes (32): ManhwaPanel(), ManhwaPanelRow(), ManhwaPanelRowProps, stripDetail, stripSummary, unmount(), backendBaseUrl(), CorrectionOp (+24 more)

### Community 6 - "useEditorStore"
Cohesion: 0.07
Nodes (18): ClipBlock(), attachPauses(), buildNodes(), confidenceLabel(), lowConfidence(), Node, TranscriptPanel(), parseTranscript() (+10 more)

### Community 7 - "transitions.ts"
Cohesion: 0.08
Nodes (31): betweenLabel(), clipName(), imageA, imageB, unmount(), TransitionsPanel(), BetweenTransition, clampTransitionDuration() (+23 more)

### Community 8 - "package.json"
Cohesion: 0.06
Nodes (35): dependencies, react, react-dom, zundo, zustand, devDependencies, jsdom, oxlint (+27 more)

### Community 9 - "ops.ts"
Cohesion: 0.11
Nodes (26): InspectorPanel(), kindOf(), MediaPanel(), TimelinePanel(), addClip(), addClips(), ClipInput, createClip() (+18 more)

### Community 10 - "project.ts"
Cohesion: 0.16
Nodes (23): react, App(), LeftTab, isAsset(), isClip(), isRecord(), isTrack(), isTranscript() (+15 more)

### Community 11 - "captions.ts"
Cohesion: 0.19
Nodes (18): CAPTION_PAUSE_SPLIT_THRESHOLD, CAPTION_TRACK_ID, CaptionSource, CaptionWord, clampCaptionDuration(), DEFAULT_CAPTION_STYLE_ID, isCaption(), isRecord() (+10 more)

### Community 12 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 13 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 14 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 15 - ".prettierrc.json"
Cohesion: 0.40
Nodes (4): printWidth, semi, singleQuote, trailingComma

## Knowledge Gaps
- **155 isolated node(s):** `$schema`, `plugins`, `react/rules-of-hooks`, `react/only-export-components`, `semi` (+150 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 230 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `vitest` connect `vitest` to `PreviewPanel.tsx`, `PresetPanel.test.tsx`, `editorStore.ts`, `matchingStore.ts`, `manhwa.ts`, `useEditorStore`, `transitions.ts`, `package.json`, `ops.ts`, `project.ts`, `captions.ts`?**
  _High betweenness centrality (0.219) - this node is a cross-community bridge._
- **Why does `useEditorStore` connect `useEditorStore` to `vitest`, `PreviewPanel.tsx`, `PresetPanel.test.tsx`, `editorStore.ts`, `matchingStore.ts`, `transitions.ts`, `ops.ts`, `project.ts`, `captions.ts`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `react` connect `project.ts` to `vitest`, `PreviewPanel.tsx`, `PresetPanel.test.tsx`, `editorStore.ts`, `manhwa.ts`, `transitions.ts`, `package.json`, `ops.ts`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `$schema`, `plugins`, `react/rules-of-hooks` to the rest of the system?**
  _155 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `vitest` be split into smaller, more focused modules?**
  _Cohesion score 0.06738738738738739 - nodes in this community are weakly interconnected._
- **Should `PreviewPanel.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06638714185883997 - nodes in this community are weakly interconnected._
- **Should `PresetPanel.test.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07756813417190776 - nodes in this community are weakly interconnected._