# `manual/ultimate/`: ultimate Owner's Guide chapter content and booklet flow

Part of the [source map](../../README.md).

Builds The Ultimate Owner’s Guide from ordered chapters, figures and measured booklet pages, behind a lightweight box item.

## Main files

- [`ultimateItem.ts`](ultimateItem.ts): Defines the lightweight cover/box item, pending chapter target, and lazy page/EPUB builders.
- [`ultimateGuide.ts`](ultimateGuide.ts): Fills chapter figures, measures/paginates content, computes starts, and adds contents/notes/covers.
- [`chapter.ts`](chapter.ts): Defines chapter records and shared opening/tip/Sample-CD HTML helpers.
- [`plan.ts`](plan.ts): Orders chapters and computes folded-sheet padding and chapter start pages.
- [`openUltimate.ts`](openUltimate.ts): Opens/selects the guide in the box viewer with an optional chapter target.

## Loading and development

[`gmItems.ts`](../printables/gmItems.ts) supplies the lightweight item; [`webManual.ts`](../webManual.ts) dynamically opens the guide.

Keep the item definition lightweight: plan.ts statically imports chapter content. Pagination needs a document. openUltimate.ts dynamically loads a desk box helper and is not a desk-independent reader.

## Tests

Colocated coverage includes [`chapterRefs.test.ts`](chapterRefs.test.ts), [`plan.test.ts`](plan.test.ts), [`playerWords.test.ts`](playerWords.test.ts).

From `web/`:

```sh
npx vitest run src/manual/ultimate
```
