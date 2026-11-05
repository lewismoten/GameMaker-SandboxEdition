# Waves on the Shore: tools

- `check.ts`: the bot plays both levels, walking east along the pier and the beach. `route.ts` asserts what each sign teaches: the water stops Kit, the first sea (one block laid everywhere) shows one frame at a time, the second (four starts) shows four, a shore block goes round all four of its frames in 40 ticks, and the doors at the end of the point lead on. No life may be lost. It also checks that no solid block is drawn like open sky.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the bot's whole run as one unbroken list of keys).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters the levels it should.
- `frames.ts`: works out which block of each loop a cell shows a given number of ticks in (the same way PLAYGAME does), for the previews and shots.
- `preview.ts`, `shots.ts`: PNGs of the block sheets, Kit's top-down poses, each level at three moments and every picture; and the progress shots (the sea and the shore at two moments, the frames side by side).
- `manual.ts`: draws the loop frames into `manual.json`'s "How this level is made" pages as small inline pictures (run it again when the art changes).

## Starter rule: show the mistake once

The demo and walkthrough walk Kit into the water once (he stops) before he crosses.
