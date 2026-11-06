# `editor/shell/`: home, workspace, asset browsing and project actions

Part of the [source map](../../README.md).

Builds Home and the project workspace, including asset browsing, import/save actions, content search and editor lifetime.

## Main files

- [`home.ts`](home.ts): Renders the featured game, collection tabs, library tiles, filters, imports, and focus-triggered deeper search.
- [`workspace.ts`](workspace.ts): Owns project navigation, file operations, editor mounting/disposal, Overview, and copy-based play tests.
- [`overview.ts`](overview.ts): Hosts Files, Controls, DOS player, and Tools tabs; loads non-Files panels dynamically.
- [`assetBrowser.ts`](assetBrowser.ts): Builds category/file galleries with viewport-triggered thumbnails, asset commands, search, and scoped cleanup.
- [`searchIndex.ts`](searchIndex.ts): Indexes native filenames/text, companion strings, and DOS player fields in asynchronous slices.
- [`deepIndexWorker.ts`](deepIndexWorker.ts): Extracts one supplied game’s searchable text and returns request-ID-tagged results, or an empty result on failure.

## Loading and development

[`modernUi.ts`](../../modernUi.ts) shows Home and dynamically loads Workspace.

Home search, Overview content search and sidebar filename filtering are separate flows. Play tests use copies. Dispose mounted editors and galleries when replacing them.

## Tests

Colocated coverage includes [`assetFiles.test.ts`](assetFiles.test.ts), [`assetGroups.test.ts`](assetGroups.test.ts), [`assetUsedBy.test.ts`](assetUsedBy.test.ts).

From `web/`:

```sh
npx vitest run src/editor/shell
```
