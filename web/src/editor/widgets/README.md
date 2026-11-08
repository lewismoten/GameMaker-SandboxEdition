# `editor/widgets/`: reusable editor controls, previews and check/play dialogs

Part of the [source map](../../README.md).

Shares file controls, thumbnails, auditions and report/play/walkthrough dialogs across editor surfaces.

## Main files

- [`filePicker.ts`](filePicker.ts): Provides visual selection/import/library-copy dialogs and reusable linked file fields.
- [`thumbs.ts`](thumbs.ts): Dispatches native-file thumbnail rendering, using neighboring files where needed and fallbacks for unavailable previews.
- [`preview.ts`](preview.ts): Controls file auditions and stop handling; loads audio/character/sound-set playback helpers when played.
- [`checkReport.ts`](checkReport.ts): Presents supplied findings with filters, acceptance controls, CSV export, and printable checklists.
- [`walkDialog.ts`](walkDialog.ts): Routes watching/making/redoing walkthroughs, manages worker progress/stop, and keeps results in companion extras.
- [`playScene.ts`](playScene.ts): Runs a seeded scene-recording dialog, accumulates heat, and optionally keeps an exit-reaching take.

## Loading and development

[`workspace.ts`](../shell/workspace.ts) uses shared file selection; [`integrator.ts`](../editors/integrator/integrator.ts) dynamically opens walkthrough dialogs.

Report widgets display supplied findings rather than running checks themselves. Walkthroughs and kept scene takes are companion metadata. Helper tests do not establish full browser-dialog coverage.

## Tests

Colocated coverage includes [`checkRows.test.ts`](checkRows.test.ts), [`limitNote.test.ts`](limitNote.test.ts), [`rovingFocus.test.ts`](rovingFocus.test.ts).

From `web/`:

```sh
npx vitest run src/editor/widgets
```

The asset picker separates Starters from Sandbox & Bizarre and offers an explicit source-game filter alongside filename search.
