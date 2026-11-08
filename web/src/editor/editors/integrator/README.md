# `editor/editors/integrator/`: GAM scenes, links and boards

Part of the [source map](../../../README.md).

Edits GAM scenes and links on a board of cards, with companion-backed boards and groups for organizing large games.

## Main files

- [`integrator.ts`](integrator.ts): Registers GAM editing and coordinates scene files/settings, validated link fields, board rendering, scene creation/deletion, play-test copies, and game-file Undo.
- [`board.ts`](board.ts): Computes card geometry and renders scene/group cards, song controls, aggregated link arrows, and board pictures.
- [`boardsController.ts`](boardsController.ts): Manages named boards/groups, arrangement tools, suggestions, active-board selection, and separate companion-layout Undo.
- [`linkEdits.ts`](linkEdits.ts): Mutates an in-memory Game’s links with cell clamping, scene-kind restrictions, free-slot checks, and entrance/exit conflict validation.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

Native scene/link changes and companion board layout have separate save and Undo paths. Normal board moves update companion placement. Link helpers mutate the parsed game; their caller saves it.

## Subareas

[`dosPlayer/`](dosPlayer/README.md).

## Tests

Colocated coverage includes [`activeBoard.test.ts`](activeBoard.test.ts), [`boardLayout.test.ts`](boardLayout.test.ts), [`boardSuggest.test.ts`](boardSuggest.test.ts).

From `web/`:

```sh
npx vitest run src/editor/editors/integrator
```

The side panel scrolls in both directions within its height limit, including at the narrowest resize setting. Its tabs omit counts and the collapse button stays at the right edge; the collapsed panel has a single vertical opener on wide screens. Scene fields list each file once. Level scenes link directly to layout generation; creation actions name the instructions, intro, opening files, or recording they produce.
