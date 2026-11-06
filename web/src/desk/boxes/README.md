# `desk/boxes/`: retail boxes, the shelf and the feelies

Part of [`desk/`](../README.md) and the [source map](../../README.md). Sandbox Software's boxes and the Game-Maker box: drawn, shelved, turned in 3D, and what came in them. The parent README has the long account. Sub-folders: `covers/` (painted covers) and `phone/` (The Phone of the Future kit).

Entry points: `desk/deskShelf.ts` and `desk/deskGmBox.ts` use `shelf.ts` and `boxViewer.ts`; `gameBox.ts` and `gmBox.ts` draw the faces.

- Faces: `gameBox.ts`, `gmBox.ts`, `boxPaint.ts`, `boxSeals.ts`, `boxSpine.ts`, `boxWear.ts`, `boxUv.ts`, `boxFacts.ts`, `playtime.ts`.
- Shelf: `shelf.ts`, `shelfLayout.ts`.
- Viewer: `boxViewer.ts`, `boxAddress.ts` (the address `#/desk?open=box:<id>`), `texturedGl.ts` (a small WebGL viewer), `stageBoxModel.ts`, `coinModel.ts`, `patchModel.ts`.
- In the box: `gameBoxContents.ts`, `boxList.ts`, `printContext.ts`, `paperFeelies.ts`.
- Feelies: `feelies.ts`, `feelieModels.ts`, `feelieThumbs.ts`, `trinketData.ts`, `trinketGl.ts`, `trinketShelf.ts`, `trinketSnap.ts`, `trinketTurntable.ts`, `laserKits.ts`.

Never name, count or hint at a secret game on a box, shelf or list.

Must not: be imported from outside `desk/` except through the dynamic load of `desk/desk.ts` (the desk is its own chunk), and never from `dos.html` or `retro/` (`dosPage/boundary.test.ts`).

Tests: `boxAddress`, `boxUv`, `feelies`, `laserKits` and `playtime`, each a `.test.ts` here.

Check: `cd web && npx vitest run src/desk/boxes`; then turn a box and a trinket in the viewer and look at them zoomed.
