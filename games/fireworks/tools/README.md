# Fireworks: tools

- `check.ts`: the bot plays both levels. `route.ts` stops under the fireworks and follows the engine's monster slots tick by tick: each launcher launches on its own time (70 and 97 ticks) and its rockets burst five blocks up; every small burst goes out; Enter launches a rocket that bursts over Mara; each big firework's nine blocks burst in their square, to the pixel, again and again, and its rocket shows only while it climbs. It also checks that no life is lost and that no solid block is drawn like open sky.
- `walkthrough.ts`, `gendemo.ts`, `demoCheck.ts`: re-record the walkthrough and the title demo (the bot's run through level 1, ending with a rocket launched with Enter), and play the demo on the real engine.
- `preview.ts`: PNGs of the block sheet, the monster pictures, every burst's frames whole with the rocket, and every picture on the disk.
- `shots.ts`: the progress shots, from the walkthrough played on the real engine: each level's screen with the most fireworks, and close-ups of level 2's bursts frame by frame.
- `manual.ts`: draws the rocket's pictures and the bursts' frames into `manual.json`'s "How this level is made" pages as small inline pictures (run it again when the art changes).
