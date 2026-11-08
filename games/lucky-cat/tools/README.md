# Lucky Cat: tools

A Special (a limited-time game): fifteen levels, 13 lucky charms; Rascal plays Earlier That Morning, Earlier Still and Wash Day (rascal.chr, rascal.cbl). Seven levels have no charms (Saucer Alley, Thirteen Steps, The Mirror Shop, The Other Side, Earlier Still, Wash Day, The Night Market): they score in saucers, ropes, keys and shakers.

- `check.ts`: the bot plays all fifteen levels without losing a life and takes all 13 charms (13 points each). It also fails on an invisible wall (a solid block drawn as sky). `route.ts` and `routeMore.ts` hold each level's orders (human timing: it reads each sign, waits for each crow to fly up, runs the fair in about two thirds of the gate's time); `routeKit.ts` has the shared orders, including `mirrored`, which swaps the bot's Left and Right keys for the Mirror Maze (the level loads `mirror.chr`, whose Left key walks right).
- `gateCheck.ts`: Race to the Fair's gate really shuts when the last bell goes dark, and opens again.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1).
- `preview.ts`: PNGs of each level's blocks and map, every picture on the disk, and a contact sheet of each cartoon. `catPreview.ts`: Midnight's poses. `reelInfo.ts`: how long each cartoon runs.
