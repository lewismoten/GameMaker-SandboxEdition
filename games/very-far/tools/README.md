# Walking Very Far: tools

- `check.ts`: the bot plays all three levels and must win without losing a life, and the maps must have no invisible walls. `route.ts` walks each level to its gate or door. In level 2 it counts the ticks: the first scene's tiny Kit takes the same steps as up close, and the second scene's small, slow steps must take more than twice as long over the same ground. That is the lesson of the sign, measured.
- `walkthrough.ts`, `gendemo.ts`, `demoCheck.ts`: re-record the walkthrough and the title demo, and check the demo. The demo is level 1's walk to the door, then on into level 2's first scene.
- `preview.ts`: PNGs of the blocks, all four maps whole, each scene as the screen shows it when it starts (16 by 10 blocks around Kit, who stands in the middle) and at the far end of the path, and every picture.

## Starter rule: show the mistake once

The mistake is level 2's first scene: the tiny Kit with the big Kit's steps zips along like a bug. The bot walks it and `route.ts` measures its ticks against the slow scene's.
