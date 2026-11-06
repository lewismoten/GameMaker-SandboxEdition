# `desk/mug/`: the Sandbox BBS mug and its print page

Part of [`desk/`](../README.md) and the [source map](../../README.md). The mug on the desk, drawn in 3D, and the sublimation page composer for making your own mugs.

Entry points: `mug.ts` (the mug on the desk), `mugPrint.ts` (the page composer).

- Mug: `mug.ts` (+ `mug.css`), `mug3d.ts` (a 3D mug on a 2D canvas), `mugViewer.ts`, `mugFocus.ts`.
- Pictures: `mugArt.ts` (the round badges), `gameBadge.ts`, `gameMugArt.ts`, `bbsBadge.ts`, `bardLogoArt.ts`, `badgeInk.ts`, `badgeLettering.ts`. The badge code uses plain pixels with no canvas, so tests can run it.
- Print page: `mugPrint.ts`, `mugSheet.ts` (an SVG in real inches), `mugLayout.ts`, `mugSizes.ts`, `mugPageStore.ts`.

Print layout is in real inches (`mugLayout.ts`, `mugSizes.ts`); keep sizes true to the blank mugs when changing it.

Must not: be imported from outside `desk/` except through the dynamic load of `desk/desk.ts` (the desk is its own chunk), and never from `dos.html` or `retro/` (`dosPage/boundary.test.ts`).

Tests: `gameBadge.test.ts`, `mug3d.test.ts`, `mugArtList.test.ts`.

Check: `cd web && npx vitest run src/desk/mug`; look at the badges at 1x and zoomed, as a stranger would.
