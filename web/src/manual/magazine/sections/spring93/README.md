# `manual/magazine/sections/spring93/`: spring 1993 issue-specific sections

Part of the [source map](../../../../README.md).

Defines the spring 1993 issue’s own cover, disk article, interview and news while reusing shared magazine sections.

## Main files

- [`cover.ts`](cover.ts): Defines the spring cover and Snowbound floppy link.
- [`disk.ts`](disk.ts): Builds the cover-disk article using catalog title/price with fallbacks.
- [`interview.ts`](interview.ts): Defines the period interview and separately identified ad-reprint page.
- [`pcNews.ts`](pcNews.ts): Defines spring news blocks, including the hint line and Game-Maker article.
- [`hintLineFacts.ts`](hintLineFacts.ts): Holds magazine-local hint-line number/rate constants without desk imports.

## Loading and development

[`issue.ts`](../../issue.ts) imports the spring sections into SECTIONS_1.

The internal issue-1 selector means Vol. 1, No. 4, April 1993, not printed No. 1. Keep content within the issue’s dated game constraints and shared hint-line facts. The fact tests do not exercise runtime phone behavior.

## Tests

Colocated coverage includes [`games.test.ts`](games.test.ts), [`hintLineFacts.test.ts`](hintLineFacts.test.ts).

From `web/`:

```sh
npx vitest run src/manual/magazine/sections/spring93
```
