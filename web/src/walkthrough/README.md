# `walkthrough/`: a Sandbox game's walkthrough

Part of the [source map](../README.md).

A Sandbox game's walkthrough (`format.ts`): played on the real
engine, deterministically (`runtime.ts`), in a player with chapters and a seek bar (`player.ts`;
a jump replays the game unseen up to that frame), with made-up callers filling the empty Top Ten
at the end (`madeUpScores.ts`), and rendered to an MP4 with its soundtrack (`exportVideo.ts`,
`audioRender.ts`, `mp4av.ts`). `button.ts` is the home page panel's Walkthrough, for every game:
one dialog (`editor/widgets/walkDialog.ts`) to watch the game's own walkthrough or yours, and to
make your own with the walkthrough bot; it loads it all only when pressed.
A walkthrough the bot made only partway (`partial`, with its `ending`) plays as far as it got and
ends on a closing card (`endCard.ts`), in the player and for a few seconds at the end of its MP4.
A game that already has a walkthrough (one kept in this browser or in its companion, one just
made, or a catalog game's shipped one: `editor/widgets/walkRoute.ts`) opens in the player; its
Redo… (`redoMenu.ts`) redoes the whole walkthrough (the making dialog), one level (the bot
replays the game with the other levels' old keys tried first, `editor/check/walk/redoLevel.ts`),
or opens a walkthrough file. A scene the bot could not get through is kept as an incomplete
segment (its furthest try, `editor/check/walk/bestAttempt.ts`; the chapter reads "(didn’t finish)"),
so the player shows how far it got. On the dev server only, a game with no walkthrough plays one
from the maintainer's git-ignored `.for-lewis/research/archive-walks/` folder
(`editor/widgets/devLocalWalk.ts`; the production build drops it). A look-only game's redone walkthrough is kept in this browser.

The bot itself and the dialog are the editor's (`editor/check/walk/`, `editor/widgets/walkDialog.ts`).
