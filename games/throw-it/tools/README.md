# Throw It: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts what each sign teaches: the first star pops the near gumdrop for 50 points, a star thrown from too far pops nothing, a star from close by pops the far one, a star thrown the wrong way in level 2 pops nothing, and the next one clears the grump. No star may still be flying a minute after a throw. It then asserts all twelve coins.
- `bumpCheck.ts`: Kit pushes on into the grump for 3 seconds. He must stop in front of it with his hit points and lives unchanged and the grump still there. It also checks what the manual says about aim: a star thrown right after a jump flies up, and after a step it flies along the ground.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo. The demo is level 1: a pop, a star that falls short, a pop.
- `demoCheck.ts`: plays the built `demo.rec` headless and checks its three throws are pop, miss, pop.
- `preview.ts`: PNGs of the blocks, the hero (with the three throw poses), the monsters, each level and every picture.

## Starter rule: show the mistake once

A Starter's demo and walkthrough show what each sign teaches, including the mistake once. Here the bot throws from too far (level 1) and the wrong way (level 2) before it throws right, and each check asserts that the first throw missed.
