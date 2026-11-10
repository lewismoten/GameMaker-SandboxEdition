# `editor/shell/`: home, workspace, asset browsing and project actions

Part of the [source map](../../README.md).

Builds Home and the project workspace, including asset browsing, import/save actions, content search and editor lifetime.

## Main files

- [`home.ts`](home.ts): Renders the featured game, collection tabs, library tiles, filters, imports, and focus-triggered deeper search.
- [`homeDemoStart.ts`](homeDemoStart.ts): Gates demo inspection, notes and playback behind a painted title picture, viewport visibility and an idle callback (with a timeout). Pointer or keyboard interest can start sooner; Save-Data and reduced-data visitors use Watch demo. Replacing the game or leaving Home cancels pending work.
- [`workspace.ts`](workspace.ts): Owns project navigation, file operations, editor mounting/disposal, Overview, and copy-based play tests.
- [`overview.ts`](overview.ts): Hosts Files, Controls, DOS player, and Tools tabs; loads non-Files panels dynamically.
- [`assetBrowser.ts`](assetBrowser.ts): Builds category/file galleries with viewport-triggered thumbnails, asset commands, search, and scoped cleanup.
- [`searchIndex.ts`](searchIndex.ts): Indexes native filenames/text, companion strings, and DOS player fields in asynchronous slices.
- [`deepIndexWorker.ts`](deepIndexWorker.ts): Extracts one supplied game’s searchable text and returns request-ID-tagged results, or an empty result on failure.

## Loading and development

[`main.ts`](../../main.ts) loads Home directly on home routes. [`modernUi.ts`](../../modernUi.ts) opens projects and dynamically loads Workspace, without a static Home re-export.

Home search, Overview content search and sidebar filename filtering are separate flows. Play tests use copies. Dispose mounted editors and galleries when replacing them.

## Tests

Colocated coverage includes [`assetFiles.test.ts`](assetFiles.test.ts), [`assetGroups.test.ts`](assetGroups.test.ts), [`assetUsedBy.test.ts`](assetUsedBy.test.ts).

From `web/`:

```sh
npx vitest run src/editor/shell
```

File categories keep monster blocks beside monsters and character blocks beside characters. Deep search restores cached entries without waiting for an idle callback for each game; uncached extraction still yields before reading.
