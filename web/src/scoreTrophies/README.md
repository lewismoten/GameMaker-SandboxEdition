# `scoreTrophies/`: the score trophies

Part of the [source map](../README.md).

The desk's two score trophies, at the back left of the desk
under the game shelves. `scores.ts` keeps each catalog game's best final score (counted only when
beaten) and the total of the points every finished play scored itself (after an F6 load, only the
points since it: the engine's `playGain.ts`), in the save store as `site:scores`,
heard as play ends from the engine's `Session.onPlayEnd` (never during a demo's or walkthrough's
playback) through the player's `hook.ts`, for games played under `game:<id>` (the play page and
the desk's PC). `tiers.ts` turns the sums into tiers (none, plastic, bronze, silver, gold, the gaudy
tower) and keeps EGG.EXE's chosen tiers; `trophyArt.ts` draws them, `trophySpot.ts` puts them in the
room (hover or press: the tier, the sum and what the next tier needs, never a game's name), and
`trophyExe.ts` is EGG.EXE's score trophy page (S from the egg ledger; X resets both, as X resets every
egg or heart on the other pages).
