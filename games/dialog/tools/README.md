# Everybody Talks: tools

- `check.ts`: the bot plays both levels and must win without losing a life. `route.ts` asserts that walking into Pip (level 1) and into the group (level 2) opens the right talk scene (4 and 5) and brings Kit back to the room a few blocks past, then counts all eighteen coins.
- `walkthrough.ts`, `gendemo.ts`: re-record the walkthrough and the title demo (level 1 up to the walk into Pip).
- `demoCheck.ts`: plays the built `demo.rec` headless and checks it walks into Pip.
- `preview.ts`: PNGs of the blocks, the hero, each level and every picture (the talk cards included).

A talk has no mistake to show: nothing here hurts, and a friend always talks when touched, so the demo and walkthrough act out each lesson once (reading the boards, a talk of two, a talk of four across two cards).
