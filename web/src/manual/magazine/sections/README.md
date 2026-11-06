# `manual/magazine/sections/`: magazine article/ad section factories

Part of the [source map](../../../README.md).

Defines the magazine’s articles and advertisements as page/block data for the issue assembler.

## Main files

- [`cover.ts`](cover.ts): Defines No. 2’s cover, cover lines, screenshots, and disc links.
- [`ads.ts`](ads.ts): Defines edition, send-away, advanced-guide, and catalog advertisements.
- [`contents.ts`](contents.ts): Produces linked contents and grouped advertiser references after pagination.
- [`reviews.ts`](reviews.ts): Defines editorial review pages with game links, screenshots, scores, and design commentary.
- [`readerService.ts`](readerService.ts): Assigns reader-service numbers and builds the linked information/reply-card page.

## Loading and development

[`issue.ts`](../issue.ts) imports and orders section factories; [`covers.ts`](../../../library/covers.ts) also renders the cover directly.

Return MagSection page/block data, not reader UI. Keep page IDs and symbolic references stable for assembly. Advertisement prices and mail forms are in-story; do not turn fictional content into historical claims.

## Subareas

[`spring93/`](spring93/README.md).

## Tests

Colocated coverage includes [`bbsListings.test.ts`](bbsListings.test.ts), [`bitsBytes.test.ts`](bitsBytes.test.ts), [`directory.test.ts`](directory.test.ts).

From `web/`:

```sh
npx vitest run src/manual/magazine/sections
```
