# Twinkle, Twinkle: tools

- `check.ts`: the bot plays both levels, walking the meadow. `route.ts` stops under each sky and counts what the stars do from the blocks the engine shows: under the first sky every star is at the same frame at every tick; under the second the stars are never all at the same frame, and never more than part of them are bright together (and the same in level 2). It also checks that no two stars within four blocks share a loop, that no life is lost and that no solid block is drawn like open sky.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the bot's first stretch of level 1, both skies).
- `frames.ts`: works out which block of each loop a cell shows a given number of ticks in (the same way PLAYGAME does), for the previews and shots.
- `preview.ts`, `shots.ts`: PNGs of the block sheets, each level at three moments and every picture; and the progress shots (the wrong sky dim and bright, the right sky at the same two moments, a star's frames).
- `manual.ts`: draws the loop frames into `manual.json`'s "How this level is made" pages as small inline pictures (run it again when the art changes).
