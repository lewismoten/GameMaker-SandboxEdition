# `achievements/`: achievements

Part of the [source map](../README.md).

What the visitor has done: the catalog (`catalog.ts`), the
record (`store.ts`, in the save store), the calls the rest of the site makes (`index.ts`, with
`editKinds.ts`, and its `GAME_SPOTS`: scenes of a game that count by name), what each page
starts (`start.ts`, whose `gm-achievement` event unlocks an id or tallies an item), where a game was
finished (`playedOn.ts`: the desk, the DOS page or the web player, and a phone held wide or tall), totals counted from the games catalog
(`goals.ts`), the unlock note (`toast.ts`), the `#/achievements` page (`page.ts`: badges of one size, each opening its details in
`details.ts`, with where it is earned from `where.ts`) and the desk's
`ACHIEVE.EXE` (`achieveExe.ts`).
