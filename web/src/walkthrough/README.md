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
The bot itself and the dialog are the editor's (`editor/check/walk/`, `editor/widgets/walkDialog.ts`).
