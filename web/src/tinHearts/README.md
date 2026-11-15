# `tinHearts/`: the tin heart hunt

Part of the [source map](../README.md).

The tin heart hunt: which games hide one and where (`hearts.json`,
`manifest.ts`), the one in the desk's wall clock (`deskHearts.ts`: the chicken's pops, its find,
and grandfathering whoever had every game's heart before it; the desk's side is
`desk/props/clockHeart.ts`, drawn by `desk/props/tinHeartArt.ts`, and DOS's TIME stands in for the clock
where it isn't drawn, `retro/dos/dosTimeEvent.ts`), which are found (`tinHearts.ts`, as a line of text in `progress.ts`), EGG.EXE's
tin heart page (`tinHeartExe.ts`), and the desk's trophy (`trophySpot.ts`, `trophy.ts` and
Mystery Robot Joe's scene in `reveal.ts` with `joeArt.ts`). The trophy becomes available when
`huntComplete` passes: every counted heart is found, or every game's heart is found and the
visitor qualifies for the stored pre-clock completion rule. That rule is decided on the
first completion check; it is not reconstructed from historical find dates.

Game finds live in `tinheart.dat` beside that game's saves. The clock find and EGG.EXE's
overrides use localStorage instead; changing an override does not rewrite a game's find.
The trophy drawing and dialog load after completion, but `trophySpot.ts` already imports
`reveal.ts` for its seen-state bookkeeping. Reduced motion skips the scene and automatic
rotation; the closer look still supports manual turning.
