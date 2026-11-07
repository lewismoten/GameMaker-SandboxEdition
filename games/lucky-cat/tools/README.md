# Lucky Cat: tools

A Special (a limited-time game): six levels, 13 lucky charms.

- `check.ts`: the bot plays all six levels without losing a life and takes all 13 charms (13 points each). It also fails on an invisible wall (a solid block drawn as sky). `route.ts` holds each level's orders (human timing: it reads each sign, waits for each crow to fly up, runs the fair in about two thirds of the gate's time); `routeKit.ts` has the shared orders, including `mirrored`, which swaps the bot's Left and Right keys for the Mirror Maze (the level loads `mirror.chr`, whose Left key walks right).
- `gateCheck.ts`: Race to the Fair's gate really shuts when the last bell goes dark, and opens again.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1).
- `preview.ts`: PNGs of each level's blocks and map, every picture on the disk, and a contact sheet of each cartoon. `catPreview.ts`: Midnight's poses. `reelInfo.ts`: how long each cartoon runs.
