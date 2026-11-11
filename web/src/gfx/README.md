# `gfx/`: pictures of games drawn from their own data

Part of the [source map](../README.md). Screenshots, title pictures and level pictures made from
a game's real maps, blocks and palettes, as palette-indexed pixels. Used by boxes, labels, manuals,
posters and the assistant's render tool.

Entry points: `desk/boxes/gameBox.ts`, `desk/disks/diskLabel.ts`, `assistant/tools/renderTools.ts`,
`play.ts` and the build scripts `scripts/shotFrames.ts`, `castArt.ts` and `cdGames.ts`.

- `levelPicture.ts`: a level as the player first sees it: the map around the start, as indexed pixels.
- `titlePicture.ts`: a game's 320 x 200 title screen, drawn the way PLAYGAME draws it.
- `titlePoster.ts`: click-to-play artwork for imported projects and bundles, from their own title files.
- `gameShots.ts`: a game's "screenshots" drawn from its maps (the area where its first level starts). Built title PNGs load without the live title renderer and FLI decoder; those load only when a title must be drawn from game files.
- `sandboxShots.ts`: screenshots of the Sandbox Software games, for the Game-Maker box.
- `shotFrame.ts`: a shot that is a real moment of play: the screen N ticks after the walkthrough enters a map.
- `frameShot.ts`: uses the frame `scripts/shotFrames.ts` drew in `public/frames/`, or the map view when there is none (a secret game, or a frame not drawn yet).

Must not: import the DOM or a canvas in the picture functions (inferred from "palette-indexed
pixels"); name a secret game in any caption.

Tests: `cp437Glyphs.test.ts`; the pictures are also exercised by tests in `desk/boxes` and `manual`.

Check: `cd web && npx vitest run src/gfx`, then look at a box and a manual page that use the picture.
