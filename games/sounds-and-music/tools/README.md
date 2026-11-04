# Sounds and Music: tools

- `check.ts`: reads the built files back and asserts what the ears get: the three levels' scenes name `meadow.cmf`, `waltz.cmf` and no song; both songs read back as songs; the score, money, help, hurt and jump sounds are set and all different beeps. Then the bot plays all three levels. `route.ts` asserts what each pickup does (a coin is 10 points, two bags add 2 money, the spike takes exactly 10 hit points once, two hearts give 20 back). The run wins without losing a life.
- `songCheck.ts`: plays both songs through the web app's OPL2 and CMF sequencer, checks each is audible, doesn't clip and lasts as long as its bars say, and writes WAV files to listen to.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is the whole run as one unbroken list of keys.
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks it enters scenes 2 3 4 1 (three levels, then the ending).
- `preview.ts`, `shots.ts`: PNGs of the blocks, the hero, each level and every picture; `shots.ts` makes the progress pictures.

## Starter rule: show the lesson once

The demo and walkthrough act out each sign's lesson: the room's song plays, a coin, a bag, the spike's hurt and the hearts' help each play their sound, and the quiet room has the jump and the cut-off row of coins. The bot loses no life.
