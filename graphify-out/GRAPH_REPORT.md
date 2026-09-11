# Graph Report - Lava  (2026-09-12)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 203 nodes · 314 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- package.json
- useEditorStore
- localDirs
- compilerOptions
- types.ts
- compilerOptions
- editorStore.ts
- ops.ts
- ffmpeg.ts
- fetch-ffmpeg.mjs
- .oxlintrc.json
- tsconfig.json
- graphify.js

## God Nodes (most connected - your core abstractions)
1. `useEditorStore` - 26 edges
2. `compilerOptions` - 18 edges
3. `EditorActions` - 15 edges
4. `compilerOptions` - 15 edges
5. `localDirs` - 9 edges
6. `MediaPanel()` - 8 edges
7. `projectDuration()` - 8 edges
8. `ClipBlock()` - 7 edges
9. `importFiles()` - 7 edges
10. `Asset` - 6 edges

## Surprising Connections (you probably didn't know these)
- `EditorBase` --references--> `Asset`  [EXTRACTED]
  frontend/src/store/editorStore.ts → frontend/src/editor/types.ts
- `MediaPanel()` --calls--> `importFiles()`  [EXTRACTED]
  frontend/src/components/MediaPanel.tsx → frontend/src/media/importer.ts
- `importFiles()` --calls--> `newId()`  [EXTRACTED]
  frontend/src/media/importer.ts → frontend/src/editor/ops.ts
- `TrackRow()` --calls--> `useEditorStore`  [EXTRACTED]
  frontend/src/components/timeline/TrackRow.tsx → frontend/src/store/editorStore.ts
- `EditorBase` --references--> `Clip`  [EXTRACTED]
  frontend/src/store/editorStore.ts → frontend/src/editor/types.ts

## Import Cycles
- None detected.

## Communities (13 total, 2 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.06
Nodes (31): dependencies, react, react-dom, zundo, zustand, devDependencies, oxlint, @types/node (+23 more)

### Community 1 - "useEditorStore"
Cohesion: 0.14
Nodes (13): App(), InspectorPanel(), kindOf(), MediaPanel(), formatTime(), PreviewPanel(), ClipBlock(), TimelinePanel() (+5 more)

### Community 2 - "localDirs"
Cohesion: 0.10
Nodes (20): backend, host, port, ffmpeg, bin, source, localDirs, cache (+12 more)

### Community 3 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 4 - "types.ts"
Cohesion: 0.16
Nodes (14): Asset, AssetKind, AssetMeta, DEFAULT_TRACKS, TimelineModel, TRACK_TYPES, TrackType, importFiles() (+6 more)

### Community 5 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 6 - "editorStore.ts"
Cohesion: 0.26
Nodes (10): PX_PER_SECOND, TRACK_HEIGHT, TrackRow(), Clip, Track, EditorBase, EditorState, initialState() (+2 more)

### Community 7 - "ops.ts"
Cohesion: 0.29
Nodes (11): addClip(), ClipInput, createClip(), duplicateClip(), moveClip(), newId(), removeClip(), replaceClipAsset() (+3 more)

### Community 8 - "ffmpeg.ts"
Cohesion: 0.18
Nodes (5): FFmpegProbe, FFmpegProvider, ffmpegService, local, UnavailableFFmpegProvider

### Community 9 - "fetch-ffmpeg.mjs"
Cohesion: 0.24
Nodes (10): args, binDir, cacheDir, download(), extract(), findBinary(), main(), root (+2 more)

### Community 10 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

## Knowledge Gaps
- **98 isolated node(s):** `TimelineModel`, `TrackType`, `EditorState`, `ClipInput`, `FFmpegProbe` (+93 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 107 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useEditorStore` connect `useEditorStore` to `types.ts`, `editorStore.ts`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `react` connect `useEditorStore` to `package.json`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `TimelineModel`, `TrackType`, `EditorState` to the rest of the system?**
  _98 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `useEditorStore` be split into smaller, more focused modules?**
  _Cohesion score 0.13978494623655913 - nodes in this community are weakly interconnected._
- **Should `localDirs` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._