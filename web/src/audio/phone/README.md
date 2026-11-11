# `audio/phone/`: recorded phone voices

Part of the [source map](../../README.md).

Defines phone dialogue, voice casting and clip selection, then plays recordings through a shared Web Audio phone-line filter with browser speech as a fallback.

## Main modules

- [`phoneScript.ts`](phoneScript.ts): Lists fixed lines, caller IDs, menus and spoken number templates.
- [`phoneCast.ts`](phoneCast.ts): Assigns caller voice samples, pitch, tempo and sentence pauses.
- [`hintGames.ts`](hintGames.ts): Lists hint-menu entries and short hints adapted from their hint books.
- [`phoneClips.ts`](phoneClips.ts): Splits sentences and selects fixed or spliced number clips without playing audio.
- [`phonePlayer.ts`](phonePlayer.ts): Loads and plays clips through the Voice channel, with filtering, hiss and cancellation.

## Loading

The wall-phone module imports the player and script statically after its own dynamic load. [`retro/bbs/pickup.ts`](../../retro/bbs/pickup.ts) dynamically imports the player for the extension. The narration scripts also import the data; this folder is not one independent lazy chunk.

## Tests

[`phoneLines.test.ts`](../../../scripts/narrate/phoneLines.test.ts) checks script and clip coverage, casting and sentence splitting. [`hintTree.test.ts`](../../desk/room/phone/hintTree.test.ts) checks hint-menu paths and eligibility. No tests are colocated here.

Related areas: [audio](../README.md), [wall phone](../../desk/room/phone/README.md), [narration scripts](../../../scripts/README.md).
