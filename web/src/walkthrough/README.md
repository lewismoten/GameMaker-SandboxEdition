# `walkthrough/`: recorded game walkthroughs

Part of the [source map](../README.md).

A recorded walkthrough (`format.ts`): played on the web
engine, deterministically (`runtime.ts`), in a player with chapters and a seek bar (`player.ts`;
a jump plays ahead unseen, restarting first when going backward), with made-up callers filling the empty Top Ten
at the end (`madeUpScores.ts`), and exported to MP4 (`exportVideo.ts`, `audioRender.ts`,
`mp4av.ts`). Export requires a WebCodecs H.264 encoder; audio uses AAC, then Opus if supported,
or is omitted if neither encoder is available or the sound choice is None. This exporter has
no live-recording fallback. `button.ts` adds the home page panel's Walkthrough button when
the game has a .gam and a project or catalog .gam entry. It opens
one dialog ([`editor/widgets/walkDialog.ts`](../editor/widgets/walkDialog.ts)) to watch the game's own walkthrough or yours, and to
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

Previous item / Next item (⏮ ⏭, the `,` and `.` keys; `items.ts`): the run records each picture, cartoon,
text page, slide list, level, menu, high-score list and credits roll as it plays (kept only in the
run, so walkthrough files are unchanged), the player names the current one under the screen, and a
jump goes to the last mark before now (the one before when within a second of it) or plays ahead
unseen to the next.

The bot itself and the dialog are the editor's (`editor/check/walk/`, `editor/widgets/walkDialog.ts`).
All `editor/` paths above are relative to `web/src/`, not this folder. Playback uses a private
clock and seeded random numbers; this is web-engine replay, not execution of the DOS player.
