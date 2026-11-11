# `desk/boxes/`: retail boxes, the shelf and the feelies

Part of [`desk/`](../README.md) and the [source map](../../README.md). Sandbox Software's boxes and the Game-Maker box: drawn, shelved, turned in 3D, and what came in them. The parent README has the long account. Sub-folders: `covers/` (painted covers) and `phone/` (The Phone of the Future kit).

Entry points: `desk/deskShelf.ts` and `desk/deskGmBox.ts` use `shelf.ts` and `boxViewer.ts`; `gameBox.ts` and `gmBox.ts` draw the faces.

- Faces: `gameBox.ts`, `gmBox.ts`, `boxPaint.ts`, `boxSeals.ts`, `boxSpine.ts`, `boxWear.ts`, `boxUv.ts`, `boxFacts.ts`, `playtime.ts`.
- Shelf: `shelf.ts`, `shelfLayout.ts`.
- Viewer: `boxViewer.ts`, `boxAddress.ts` (the address `#/desk?open=box:<id>`), `texturedGl.ts` (a small WebGL viewer), `stageBoxModel.ts`, `coinModel.ts`, `patchModel.ts`.
- In the box: `gameBoxContents.ts`, `boxList.ts`, `printContext.ts`, `paperFeelies.ts`.
- Feelies: `feelies.ts`, `feelieModels.ts`, `feelieThumbs.ts`, `trinketData.ts` (with `madeDownload.ts`, a link that saves a file the page makes), `trinketGl.ts`, `trinketShelf.ts`, `trinketSnap.ts`, `trinketTurntable.ts`, `laserKits.ts`.

Never name, count or hint at a secret game on a box, shelf or list.

Must not: be imported from outside `desk/` except through the dynamic load of `desk/desk.ts` (the desk is its own chunk), and never from `dos.html` or `retro/` (`dosPage/boundary.test.ts`).

Tests: `boxAddress`, `boxUv`, `feelies`, `laserKits` and `playtime`, each a `.test.ts` here.

Check: `cd web && npx vitest run src/desk/boxes`; then turn a box and a trinket in the viewer and look at them zoomed.

`kitAssemblyModel.ts` uses the Snowbound and Year 2000 laser builders' nominal cut loops and engraving directly,
with a pose and assembly caption for each physical piece. `kitAssemblyDraw.ts` extrudes these loops (including holes)
through 3 mm plywood and shares the feelie turntable camera. `kitAssemblyViewer.ts` loads only when a supported kit
is selected: labeled step slider, Back/Next/Play, no automatic playback, and immediate steps for reduced motion.
The kit tiles use their existing sheet preview PNGs without loading the assembly chunk.
A kit with sub-assemblies (the cryptex, `kitAssemblyCryptex.ts`, from `games/year2000/laser/cryptexGroups.ts`) has steps of three
kinds: a part slides into its group, the finished group is shown as one solid with its ID (the other groups are left out and the
view fits it), and a whole group moves (into the kit, then out and back for "Set your own code": a washer lifted, turned and
dropped back). `poseAt` gives a part's offset and spin; a "Jump to" list in the viewer goes to each group, the final assembly and
setting a code. Each slab is painted whole, from the bottom up, so hollow rings stack correctly.
