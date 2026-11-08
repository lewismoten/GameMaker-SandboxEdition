# Lights Out: tools

- `check.ts`: the bot plays all three levels. `route.ts` reads, on the engine itself, which block each cell shows and checks what each level teaches: level 1, that every cell shows the shade it was laid in (rings round the three lamps) and that walking past a lamp changes none; level 2, that the dark air behind Kit has turned lit while the air ahead and above his head is dark, and that a jump lights blocks higher up; level 3, that the six bulbs glow 28 ticks apart and that the whole hall lights on the tick the sixth does, with no dark twin left. It also checks that no solid block is drawn like open air, that the signs stand in the dark, and the contrast table below.
- `contrast.ts`, `contrastTable.ts`: the contrast (WCAG's ratio) of the floor's edge, Kit and a wall against the air at each of the five brightness steps, so the dark is always readable; `contrastTable.ts` prints it.
- `walkthrough.ts`, `gendemo.ts`, `demoCheck.ts`: re-record the walkthrough and the title demo (the bot's whole first level), and play the demo back.
- `frames.ts`: works out which block each timed block shows a given number of ticks in (the same way PLAYGAME does), for the previews and shots.
- `preview.ts`, `shots.ts`: PNGs of the block sheets, each level at three moments (level 3 dark, bulbs half lit, lit) and every picture; and the progress shots.
- `manual.ts`: draws the shade strips and the palette ramps into `manual.json`'s "How this level is made" pages (run it again when the art changes).
