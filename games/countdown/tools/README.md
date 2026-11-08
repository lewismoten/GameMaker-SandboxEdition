# Countdown: tools

- `check.ts`: the bot plays both levels. `route.ts` watches every tick: in level 1 the digit goes 9 to 0 with a change every 18 ticks (a second, give or take two), the door is shut and solid until the 0 and opens on tick 162, and a push into it gets nowhere; in level 2 the tens and ones digits agree on every tick from 99 to 00, the floor flashes at tick 1728 (number 03) and opens at 1782 with the 00, and the drop takes the hero out. It then asserts the coins (4 and 4). The run wins with no life lost.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1: bump the shut door once, wait for the 0, go in).
- `demoCheck.ts`: plays the built `demo.rec` on the real engine and checks the hero is held at the shut door, the door opens, and he goes through.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture. `shots.ts`: pictures of the lessons for the progress shots (9, 3, 0 with the door open; 99, the floor flashing, the drop).

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the bot walks up to level 1's door while the number is still above 0 and pushes on into it before waiting; level 2 has no way to go wrong, which is its lesson.
