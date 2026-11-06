# `manual/zine/`: NO CARRIER and Tiny Pockets Press paper items

Part of the [source map](../../README.md).

Provides NO CARRIER’s reader and printed leaves, plus Tiny Pockets Press’s separate story-sheet format.

## Main files

- [`zineItem.ts`](zineItem.ts): Provides NO CARRIER’s paged/scroll reader, four-leaf print sheets, EPUB source, cover, and opening function.
- [`zinePages.ts`](zinePages.ts): Holds NO CARRIER’s page text, annotations, and fictional desk-tool/phone material.
- [`zineLeaf.ts`](zineLeaf.ts): Renders and measures quarter-letter leaves, fitting typography and preserving readable headings.
- [`briefStoryZine.ts`](briefStoryZine.ts): Groups source stories into eight-panel volumes and supplies one-sheet imposition and a separate paged reader.

## Loading and development

[`whistle.ts`](../../desk/props/zine/whistle.ts) dynamically opens NO CARRIER; [`libraryPage.ts`](../../library/libraryPage.ts) also opens it from the Library.

NO CARRIER’s quarter-letter leaves and Tiny Pockets’ eight-panel sheets are different formats. Only NO CARRIER declares an EPUB source here; Tiny Pockets has its own reader and imposition.

## Tests

No colocated tests. Related coverage: [`briefStoryZine.test.ts`](../../../test/briefStoryZine.test.ts), [`bookLinks.test.ts`](../bookLinks.test.ts).

From `web/`:

```sh
npx vitest run test/briefStoryZine.test.ts src/manual/bookLinks.test.ts
```
