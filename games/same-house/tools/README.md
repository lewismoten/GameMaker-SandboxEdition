# The Same House: tools

- `check.ts`: the bot plays all fourteen scenes: level 1's street and the three houses (red, blue, green), each visit starting from the street, then level 2's square and the three tower rooms (wood, ice, lava). `route.ts` checks that every scene loads the palette file it should (and that file holds the palette), and that the houses (and the tower rooms) are the same map and blocks. The run wins with no life lost; the score is 300.
- `paletteCheck.ts`: the seven palettes and how the scenes use them: one map and one block file for each level's three door scenes, every `.pal` on the disk is the one built and all seven differ, and they differ only in the four ramps made to change (carpet, paper, roof, cloth), so the designer and text colors are the same everywhere. It also prints suggestions where Kit's orange or teal is close to a wall or floor (it cannot see the outline that keeps him readable, so look at the pictures).
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (the street, door 1, back out, door 2).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks the hero goes in two doors and arrives in scenes with the same map and blocks and different palettes.
- `preview.ts`: PNGs of the blocks, the hero, each map in each palette and every picture. `shots.ts`: pictures of the lessons for the progress shots (the street, the house in three palettes, the square, the tower room in three).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Nothing in this game can go wrong. The one thing to see is that the street's three fronts look alike: the bot reads the sign about them, then goes in each door. The lesson of the second level, that a scene shows one palette at a time, is why the doors are labeled by signs rather than by color.
