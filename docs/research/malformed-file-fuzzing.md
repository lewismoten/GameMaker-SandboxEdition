# Case study: fuzzing the file readers

Written by Claude (Sonnet 5.5). Run 2026-11-04.

## Question

The editor and importer read files people bring from elsewhere. When a file is damaged, does a reader fail with a clear message, or does it hang, run out of memory or throw from deep inside?

## Method

`npm run fuzz:files` (`web/scripts/fuzzFiles.ts`) is seeded, so a run repeats. Each case runs in a child process with an 8 s limit and a 1.5 GB heap cap; a case that grows by more than 256 MB counts as a memory failure.

- **Sources:** four files of each type from the original Game-Maker CD, and three small game archives.
- **Mutations:** truncation (0, 1, 2, 4, 16, 64 bytes, half, minus one, random), 1, 8 and 64 bit flips, header integers set to extreme values, 4 MiB of zero padding and 1 MiB of random padding, another file type's bytes, noise, all 0xFF, all zeros.
- **Verdicts:** ok (returned), clear (a plain `Error` with a readable message), bad (`TypeError`, `RangeError` or a native message), hang, memory.

## Before the fixes

- The FLI frame decoder hung and used over 256 MB on a file whose header declared a 65535 x 65535 picture: it allocated the canvas from the header.
- The FLI readers threw a `RangeError` ("Offset is outside the bounds of the DataView") on any file under 128 bytes.
- The CMF song previewer threw the same on a cut under 40 bytes.
- The ZIP reader and the archive importer threw an empty `TypeError` or a native stream message on damaged deflate data.
- Clean from the start: the readers for games, maps, blocks, characters, monsters, sounds, palettes, slide lists, backdrops, recordings, the partial GIF decoder and the folder importer.

## Fixes (commit `b23b35107`)

- FLI: a file under 128 bytes throws "Not an FLI file: shorter than its 128-byte header". A picture over 4096 x 4096 throws before any canvas is made. Decoding refuses frame count x picture size over 128 MiB.
- CMF: a file shorter than 40 bytes gets a zero-padded header. Valid files are unchanged.
- ZIP: a damaged deflate stream throws "The ZIP entry <name> is damaged", with the original error as the cause.
- Regression tests: `web/test/malformedFiles.test.ts`, using synthetic bytes only.

## After the fixes

Two seeds, four rounds each: 0 bad, 0 hang, 0 memory in both. With seed 1 and 236 cases per reader, the game, map, character, monster, sound, palette, slide list and recording readers returned something every time. The FLI readers returned 176 times and gave a clear error 60 times; the VOC reader 167 and 69; the GIF reader 137 and 99; the CMF reader 192 and 44. The ZIP readers gave a clear error for 89 to 135 of 180 cases.

## What this cannot show

- No sample file was a JPEG or a high-score file, so those two readers got no cases.
- The editor's on-page interface is not exercised, only the readers and the importer.
- "Returned something" is not "found the file valid". Many readers, like the original program, read zeros past the end of a short file, so a zero-filled game is not flagged as damaged. That follows the original's behavior and was left alone.
- The ZIP reader has no inflate size cap when called without limits, so a zip bomb would inflate fully. The importer passes limits. Not changed.
- Fuzzing finds crashes and hangs, not wrong answers.

## Reproduce

```sh
cd web
npm run fuzz:files
npx vitest run test/malformedFiles.test.ts
```
