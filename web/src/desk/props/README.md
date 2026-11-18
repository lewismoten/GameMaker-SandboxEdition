# `desk/props/`: the room's little things, made pressable

Part of [`desk/`](../README.md) and the [source map](../../README.md). Each prop is a small module: a click or a press does something (the watch beeps, the curtains tug, the window fogs, the basket is rummaged). They sit in the room drawn by [`room/`](../room/README.md).

Entry point: `index.ts` installs every prop. `propKit.ts` is what all of them share (making a thing clickable, focus, labels); `propSound.ts` synthesizes their sounds on the spot, plays the tour's recorded Teddy and Gwinn barks (a synthesized woof when a clip is unavailable) and can load a game's VOC effect.

- `clock.ts`, `clockHeart.ts`: the wall watch and the tin heart in it.
- `curtains.ts`, `window.ts`, `moonPhase.ts`, `roomLight.ts`: the window's side of the room, the real moon, and the room after dark.
- `door.ts`, `wastebasket.ts`, `mailDrop.ts`, `speaker.ts`, `degauss.ts`: the door knob, basket, RSD's reply on paper, the left speaker and the DEGAUSS plate.
- `blacklight.ts`, `eggGlow.ts`, `chezArt.ts`, `tinHeartArt.ts`: black-light art and eggs, THE CHEZ drawn from the side, the tin heart.
- `specialFloppy.ts`: a Special's lone floppy beside the Game-Maker box, during its window, until it is picked up.

Must not: be reached from `dos.html`'s page or the PC core, `retro/computer.ts` (`dosPage/boundary.test.ts`); nothing in `retro/` imports it. The desk loads it through `desk/desk.ts`, its own chunk, which `main.ts` imports dynamically. Outside `desk/`, the desk's toy safe and score trophies share the props' kit statically (`fortKnox/safeSpot.ts`, `fortKnox/safeDialog.ts` and `scoreTrophies/trophySpot.ts` import `propKit.ts`; `safeDialog.ts` also imports `propSound.ts`), and TURBO BUTTON's `manual/magazine/art.ts` imports `chezArt.ts` statically.

Sub-folders: `outside/`, what goes by outside the window, has [its own README](outside/README.md); `zine/` holds `whistle.ts` (the toy whistle lying over the NO CARRIER zine), which `index.ts` also installs.

Tests: `chezArt.test.ts`, `moonPhase.test.ts`, `propSoundBark.test.ts`, `tinHeartArt.test.ts`.

Check: `cd web && npx vitest run src/desk/props`; then press each prop with the keyboard as well as the pointer.
