# `walkthrough/`: a Sandbox game's walkthrough

Part of the [source map](../README.md).

A Sandbox game's walkthrough (`format.ts`): played on the real
engine, deterministically (`runtime.ts`), in a player with chapters and a seek bar (`player.ts`;
a jump replays the game unseen up to that frame), with made-up callers filling the empty Top Ten
at the end (`madeUpScores.ts`), and rendered to an MP4 with its soundtrack (`exportVideo.ts`,
`audioRender.ts`, `mp4av.ts`). `button.ts` loads it all only when Walkthrough is pressed.
