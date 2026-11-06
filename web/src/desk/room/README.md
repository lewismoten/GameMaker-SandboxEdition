# `desk/room/`: the walls, window and things on the desk

Part of [`desk/`](../README.md) and the [source map](../../README.md). The room around the PC: the window, the clock, the door, posters, notes, the catalog and the papers lying on the desk. The pressable behavior of the little things is in [`props/`](../props/README.md).

Entry points: `desk/deskScene.ts` places them; `desk/wallTrophies.ts` and `desk/desk.ts` use some.

- `snowWindow.ts`: the window with snow outside; `daylight.ts` says how light it is by the room's clock; `moonPhase` lives in `props/`.
- `wallClock.ts`, `lumeCharge.ts`: the wristwatch clock and its glow-in-the-dark paint.
- `wallPoster.ts`, `posterUv.ts`, `motenUv.ts`: a game's poster on the wall and the black-light look.
- `roomDoor.ts`, `wasteBasket.ts`, `newsClipping.ts`, `phoneNotes.ts`: the door, basket, clipping and notes.
- `catalog.ts`, `paperStack.ts`: the shareware catalog and TURBO BUTTON on the desk.
- `deskProps.ts`: the mug, wall phone and lamp placed on the desk stage.
- `*.css`: each next to the module it styles.

Must not: be imported from outside `desk/` except through the dynamic load of `desk/desk.ts` (the desk is its own chunk), and never from `dos.html` or `retro/` (`dosPage/boundary.test.ts`).

Tests: `lumeCharge.test.ts`, `posterUv.test.ts`. A `phone/` sub-folder here holds the wall phone (not read for this README).

Check: `cd web && npx vitest run src/desk/room`; look at the room by day and by night.
