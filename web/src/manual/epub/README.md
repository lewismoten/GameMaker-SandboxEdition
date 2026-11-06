# `manual/epub/`: on-demand EPUB builders, packaging and validation

Part of the [source map](../../README.md).

Builds downloadable EPUB books from reader content, packages their media and provides separate structural validation helpers.

## Main files

- [`save.ts`](save.ts): Supplies the reader download control, invokes its selected builder, dynamically loads packing, and reports failures.
- [`book.ts`](book.ts): Defines book metadata, chapters, navigation parts, and embedded media records.
- [`chapter.ts`](chapter.ts): Derives chapter headings/navigation IDs from DOM nodes and converts them to XHTML.
- [`pack.ts`](pack.ts): Packages EPUB metadata, manifest/spine, navigation, NCX, styles, cover, chapters, and media.
- [`check.ts`](check.ts): Checks ZIP/package structure, XML, manifest/spine, and internal references.
- [`xmlCheck.ts`](xmlCheck.ts): Performs a limited XML well-formedness check and returns element attributes.

## Loading and development

[`webManual.ts`](../webManual.ts) supplies a lazy book builder to the download control; [`viewer.ts`](../magazine/viewer.ts) supplies the magazine EPUB builder.

Builders must supply self-contained content. Downloading packs the book but does not run checkEpub. The local checker is limited structural/XML validation, not full EPUBCheck or schema compliance.

## Tests

Colocated coverage includes [`pack.test.ts`](pack.test.ts).

From `web/`:

```sh
npx vitest run src/manual/epub
```
