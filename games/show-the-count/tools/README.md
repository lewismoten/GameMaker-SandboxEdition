# Show the Count: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: in level 1 the gate is bumped with nothing lit and stays shut, then the ledge lights five bulbs (two or three halfway along) and the gate takes all five; in level 2 three ground bulbs and three ledge bulbs light and the six-slot gate that is the exit takes them. It then asserts every coin.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1: the shut gate, then the ledge of bulbs.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks Kit was stopped by the gate with nothing lit, then lit bulbs along the ledge.
- `preview.ts`: PNGs of the blocks, the hero, the monsters, each level and every picture. `shots.ts`: PNGs of the lessons for the progress shots.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here level 1's gate is tried with nothing lit, and the check asserts that it stayed shut and took nothing.
