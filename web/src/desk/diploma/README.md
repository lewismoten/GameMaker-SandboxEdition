# `desk/diploma/`: the framed certificate

Part of [`desk/`](../README.md) and the [source map](../../README.md). The framed certificate above the wall phone: nothing until a graduation is finished, then a frame whose look depends on how far you got.

Entry points: `desk/wallTrophies.ts` hangs it through `diplomaSpot.ts`.

- `diplomaSpot.ts`: the place on the wall and its behavior (+ `diploma.css`).
- `frameLevel.ts`: picks the level and frame to show.
- `diplomaArt.ts`: the certificate as an SVG string.

Must not: be imported from outside `desk/` except through the dynamic load of `desk/desk.ts` (the desk is its own chunk), and never from `dos.html` or `retro/` (`dosPage/boundary.test.ts`).

Tests: `frameLevel.test.ts`.

Check: `cd web && npx vitest run src/desk/diploma`.
