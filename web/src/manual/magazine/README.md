# `manual/magazine/`: tURBO BUTTON issue assembly and reading/rendering

Part of the [source map](../../README.md).

Assembles TURBO BUTTON issues and renders them for reading, printing, EPUB export and static-text extraction.

## Main files

- [`viewer.ts`](viewer.ts): Mounts issue reading, page/spread/scroll navigation, printing, EPUB download, and link execution.
- [`issue.ts`](issue.ts): Assembles ordered section pages, pads folded sheets, assigns folios, fills contents/advertisers, and resolves page references.
- [`types.ts`](types.ts): Defines block/page/section/context/assembled-issue data contracts.
- [`render.ts`](render.ts): Renders placed pages as HTML and exposes asynchronous image readiness.
- [`go.ts`](go.ts): Parses/checks magazine targets and maps them to context-sensitive URLs.
- [`staticText.ts`](staticText.ts): Builds section-grouped plain text from assembled issues, excluding contents pages.

## Loading and development

[`main.ts`](../../main.ts) dynamically loads the web reader; [`desk.ts`](../../desk/desk.ts) dynamically loads the overlay reader.

Issue assembly and static extraction are DOM-free; page rendering and measurement are not. URL mapping belongs to go.ts; viewer actions execute through goRun.ts. Printing waits for rendered media.

## Subareas

[`sections/`](sections/README.md).

## Tests

Colocated coverage includes [`issues.test.ts`](issues.test.ts), [`jumps.test.ts`](jumps.test.ts), [`magazine.test.ts`](magazine.test.ts).

From `web/`:

```sh
npx vitest run src/manual/magazine
```
