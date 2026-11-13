# `desk/mug/`: the Sandbox BBS mug and its print page

Part of [`desk/`](../README.md) and the [source map](../../README.md). The mug on the desk, drawn in 3D, and the sublimation page composer for making your own mugs.

Entry points: `mug.ts` (the mug on the desk), `mugPrint.ts` (the page composer).

- Mug: `mug.ts` (+ `mug.css`), `mug3d.ts` (a 3D mug on a 2D canvas), `mugViewer.ts`, `mugFocus.ts`.
- Pictures: `mugArt.ts` (the round badges), `gameBadge.ts`, `gameMugArt.ts`, `bbsBadge.ts`, `bardLogoArt.ts`, `badgeInk.ts`, `badgeLettering.ts`. `gameBadge.ts`, `badgeInk.ts` and `badgeLettering.ts` work on plain pixels without a canvas. The BBS badge renderer, game-art wrapper and logo loader use DOM and canvas APIs.
- Print page: `mugPrint.ts`, `mugSheet.ts` (an SVG in real inches), `mugLayout.ts`, `mugSizes.ts`, `mugPageStore.ts`.

Print layout is in real inches (`mugLayout.ts`, `mugSizes.ts`); keep sizes true to the blank mugs when changing it.

Must not: be imported from outside `desk/` except through the dynamic load of `desk/desk.ts` (the desk is its own chunk), and never from `dos.html` or `retro/` (`dosPage/boundary.test.ts`).

Tests: `gameBadge.test.ts`, `mug3d.test.ts`, `mugArtList.test.ts`. The image-based badge tests in `gameBadge.test.ts` are skipped when their required built game disks are absent; a passing run without those fixtures does not check the badge images.

Check: `cd web && npx vitest run src/desk/mug`; look at the badges at 1x and zoomed, as a stranger would.
