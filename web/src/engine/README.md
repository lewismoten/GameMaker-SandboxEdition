# `engine/`: the game engine

Part of the [source map](../README.md).

The game engine, a TypeScript port of `PLAYGAME.C`: `game.ts` (`DoGame`),
`scene.ts` (`playscene`), `character.ts`, `monsters.ts`, `scroll.ts`, `world.ts`, `touch.ts`,
`render.ts`, menus (`menus.ts`), function keys (`funcKeys.ts`), the key stack (`keys.ts`),
recordings (`recorder.ts`), the between-scene screens (`showGraphic.ts`) and the "machine"
(`machine.ts`: screen, keyboard, timers). `slowPc.ts` is the slow PC behind the desk's TURBO
button. `playGain.ts` is the points a play scored itself, leaving out those an F6 load brought
(for the score trophies). `playerLook.ts` is what XFERPLAY's own screens show (words, matched colors, frames,
positions, times, F-keys) from a project's DOS player patches (`RunOptions.player`), the CD
player's with none; the menu, high-score, status, drop and load/save screens draw through
`drawMenu`, `drawHighScores`, `drawStatus`… so the editor's previews use the same code.
