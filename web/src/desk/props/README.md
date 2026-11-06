# `desk/props/`: the room's little things, made pressable

Part of [`desk/`](../README.md) and the [source map](../../README.md). Each prop is a small module: a click or a press does something (the watch beeps, the curtains tug, the window fogs, the basket is rummaged). They sit in the room drawn by [`room/`](../room/README.md).

Entry point: `index.ts` installs every prop. `propKit.ts` is what all of them share (making a thing clickable, focus, labels); `propSound.ts` makes their sounds on the spot (no files).

- `clock.ts`, `clockHeart.ts`: the wall watch and the tin heart in it.
- `curtains.ts`, `window.ts`, `moonPhase.ts`, `roomLight.ts`: the window's side of the room, the real moon, and the room after dark.
- `door.ts`, `wastebasket.ts`, `mailDrop.ts`, `speaker.ts`, `degauss.ts`: the door knob, basket, RSD's reply on paper, the left speaker and the DEGAUSS plate.
- `blacklight.ts`, `eggGlow.ts`, `chezArt.ts`, `tinHeartArt.ts`: black-light art and eggs, THE CHEZ drawn from the side, the tin heart.

Must not: be imported from outside `desk/` except through the dynamic load of `desk/desk.ts` (the desk is its own chunk), and never from `dos.html` or `retro/` (`dosPage/boundary.test.ts`).

Sub-folders `outside/` and `zine/` are not covered here (not read for this README).

Tests: `chezArt.test.ts`, `moonPhase.test.ts`, `propSoundBark.test.ts`, `tinHeartArt.test.ts`.

Check: `cd web && npx vitest run src/desk/props`; then press each prop with the keyboard as well as the pointer.
