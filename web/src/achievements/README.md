# `achievements/`: achievements

Part of the [source map](../README.md).

What the visitor has done: the catalog (`catalog.ts`), the
record (`store.ts`, in the save store), the calls the rest of the site makes (`index.ts`, with
`editKinds.ts`, and its `GAME_SPOTS`: scenes of a game that count by name), what each page
starts (`start.ts`, whose `gm-achievement` event unlocks an id or tallies an item), where a game was
finished (`playedOn.ts`: the desk, the DOS page or the web player, and a phone held wide or tall), totals counted from the games catalog
(`goals.ts`), the unlock note (`toast.ts`), the `#/achievements` page (`page.ts`: badges of one size, each opening its details in
`details.ts`, with where it is earned from `where.ts`) and the desk's
`ACHIEVE.EXE` (`achieveExe.ts`). While a guided tour plays nothing counts (`store.ts`): what the
tour presses, calls or reads isn't the visitor's own doing.

Repeated events use `countOccurrence` in `store.ts`: bounded sets of unique event tokens
retain independent plays when records from tabs or backups merge. Old achievement
records need no schema migration, and Reset clears these counts too.

`repeatGoals.ts` defines tiers of 1, 3 and 10 for life losses, Game Over, and wins.
Progress is the number of currently listed playable games that have reached the tier;
non-playable catalog entries do not raise the target. `goals.ts` refreshes these totals
from the persisted event sets. Existing one-time completion records are not inflated
into repeat-event counts.

`playAchievements` attaches its scene listener to the live Session, preserving any
existing listener. The life-loss callback and end-of-play callback record repeated
real-play events; demos, walkthrough playback, bundle exports and editor projects
do not add repeat counts. Quitting does not count as losing.

`badgeArt.ts` / `badgeArt.css` render exact 20×20 game blocks in cards, details and
unlock notices. `blockArt.json` carries embedded PNGs with provenance. Hidden and
unassigned badges use a neutral question block drawn with the tools package’s micro
font; no emoji artwork is used by the renderer. Source selections and missing-art
proposals are in [the artwork inventory](../../../docs/achievement-art.md).
