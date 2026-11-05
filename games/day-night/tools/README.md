# Day and Night: tools

- `check.ts`: the bot plays all five scenes: level 1 by day (three signs, four coins, the door), the same room at night (four coins, the door), then level 2 by day (the first gate), at dusk (three coins; once back through the first gate, which does nothing, then the second gate) and by night (the cottage door). `route.ts` checks that each scene loads the palette file for its hour and that file holds the palette. The run wins with no life lost; the score is 120.
- `paletteCheck.ts`: the three palettes and how the scenes use them: one map and one block file for each level's stages, the star slot the sky's own color by day, lamps lit and the moon bright by night, the designer and text colors the same everywhere, and Kit and the sign letters readable at night (contrast ratios, as suggestions).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1 by day to its door, which loads the same room at night).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks the hero goes in the door and arrives in a scene with the same map and blocks and the night palette.
- `preview.ts`: PNGs of the blocks (by day and by night), the hero, each level in each palette and every picture. `shots.ts`: pictures of the lessons for the progress shots (the room by day and by night, the street at day, dusk and night, the cottage).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Nothing in this game can go wrong, so the one thing to try is level 2's: at dusk the bot walks back through the first gate, and nothing happens, because a gate is a link in one scene and goes one way.
