# `editor/editors/sample/`: vOC waveform editing and recording

Part of the [source map](../../../README.md).

Edits VOC waveforms with selection, audio tools, playback and microphone insertion.

## Main files

- [`sample.ts`](sample.ts): Registers VOC waveform selection, destructive audio tools, playback, microphone insertion, sample Undo and WAV download.

## Loading and development

[`registry.ts`](../registry.ts) dynamically imports this file-kind editor; module evaluation registers its renderer.

Opening keeps original VOC bytes. After edits, Undo or Revert, decoded audio is encoded again at the original rate; Revert does not restore the original byte stream. Size warnings do not make every editing operation enforce the DOS ceiling.

## Tests

No colocated tests. Related coverage: [`sampleEdit.test.ts`](../../../../test/sampleEdit.test.ts), [`registry.test.ts`](../registry.test.ts).

From `web/`:

```sh
npx vitest run test/sampleEdit.test.ts src/editor/editors/registry.test.ts
```
