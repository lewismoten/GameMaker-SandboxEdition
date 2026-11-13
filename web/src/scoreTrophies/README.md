# `scoreTrophies/`: the score trophies

Part of the [source map](../README.md).

The desk's two score trophies, at the back left of the desk
under the game shelves. `scores.ts` keeps each catalog game's best final score, replacing it
only when a play's score exceeds the previous best, whether that play was won, lost or left
with Escape. It also adds up the points each ended play scored itself: F6 banks the gain
before the load and starts a new stretch at the loaded score, so loaded points are not
counted again (the engine package's `engine/playGain.ts`).

The records live in the save store as `site:scores`. This folder's `hook.ts` receives
`Session.onPlayEnd` for games played under `game:<id>` (the play page and the desk's PC),
never during demo or walkthrough playback. `tiers.ts` turns the sums into tiers (none, plastic, bronze, silver, gold, the gaudy
tower) and keeps EGG.EXE's chosen tiers; `trophyArt.ts` draws them, `trophySpot.ts` puts them in the
room (hover or press: the tier, the sum and what the next tier needs, never a game's name), and
`trophyExe.ts` is EGG.EXE's score trophy page (S from the egg ledger; X resets both, as X resets every
egg or heart on the other pages). These choices are display overrides in localStorage
(`gm-score-trophies`), separate from the stored scores: X restores both trophies to their
earned tiers, not to zero points. `scores.ts` queues writes within this module instance
and announces changes locally and, when available, through BroadcastChannel; that is not
a cross-tab write lock or a guarantee that persistence succeeds.
