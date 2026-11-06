# `tour/chapters/`: guided-tour chapter data and shared targets

Part of the [source map](../../README.md).

Defines the guided tour’s ordered chapter data and shared control targets; the parent tour runtime performs the actions.

## Main files

- [`index.ts`](index.ts): Orders the chapters in CHAPTERS.
- [`targets.ts`](targets.ts): Shares responsive header and Settings targets.
- [`editor.ts`](editor.ts): Defines the editor overview chapter.
- [`editMap.ts`](editMap.ts): Defines the map-editor chapter.
- [`dos.ts`](dos.ts): Defines the separate DOS-page chapter.

## Loading and development

[`tourEngine.ts`](../tourEngine.ts) consumes the ordered chapter data; [`lines.ts`](../lines.ts) extracts chapter lines for narration.

Chapter and step shapes are defined in [`../steps.ts`](../steps.ts). Add a chapter to `CHAPTERS`, its page to `CHAPTER_PAGES` in [`../tourPages.ts`](../tourPages.ts), and its control sources to `SOURCES` in [`../tourData.test.ts`](../tourData.test.ts). Only harmless controls should be pressed; preserve settings with `keep` and cleanup acts. The DOS chapter stays last because it hands off to a separate page. See the [tour authoring guide](../README.md#a-new-chapter) for selector, browser and voice checks.

## Tests

No colocated tests. Related coverage: [`tourData.test.ts`](../tourData.test.ts), [`editorChoice.test.ts`](../editorChoice.test.ts), [`voiceIndex.test.ts`](../voiceIndex.test.ts).

From `web/`:

```sh
npx vitest run src/tour/tourData.test.ts src/tour/editorChoice.test.ts src/tour/voiceIndex.test.ts
```
