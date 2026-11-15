# `achievements/`: achievements

Part of the [source map](../README.md).

What the visitor has done: the catalog (`catalog.ts`), the
record (`store.ts`, in the save store), the calls the rest of the site makes (`index.ts`, with
`editKinds.ts`, and its `GAME_SPOTS`: scenes of a game that count by name), what each page
starts (`start.ts`, whose `gm-achievement` event unlocks an id or tallies an item), where a game was
finished (`playedOn.ts`: the desk, the DOS page or the web player, and a phone held wide or tall), totals counted from the games catalog
(`goals.ts`), the unlock note (`toast.ts`, with `notesPlacer.ts` apart so the DOS page can place notes without loading it), the `#/achievements` page (`page.ts`: a row of tabs, one per part of the site with its "n of m" (ARIA tabs: arrow keys, Home and End, the chosen one kept in sessionStorage across redraws; Previous and Next in the details still walk every badge, switching tab as they go), then that part's badges (the icon, title, level, and a lock or check; the description is only in the details, and a card is as tall as its own content, so a row grows only if one of its cards shows a progress bar; with 📅 on, an earned badge carries its date turned along its right edge, said as "Unlocked <date>" to a screen reader, and an unearned one shows none; with 🙈 on, Previous and Next in the details skip the hidden unearned badges), each opening its details in
`details.ts`, with where it is earned from `where.ts`) and the desk's
`ACHIEVE.EXE` (`achieveExe.ts`). While a guided tour plays nothing counts (`store.ts`): what the
tour presses, calls or reads isn't the visitor's own doing. Reset lives last on the page behind a closed "Start over…" and asks the visitor to type RESET before its red Reset button works; cancelling returns focus to the button that asked.

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
It also hands each real play (first scene) and win (Game Won) to Scoot's stamps
(`courier/stamps.ts` `earnStamp`, loaded only then); demos and walkthroughs earn none.

`badgeArt.ts` / `badgeArt.css` render exact 20×20 game blocks in cards, details and
unlock notices. `blockArt.json` carries embedded PNGs with provenance; badges drawn by hand are added to it directly (and to
`HAND_DRAWN` in `scripts/achievementArtKeep.ts`) without a `generator` mark, so `scripts/achievementArt.ts` keeps them. Hidden and
unassigned badges use a neutral question block drawn with the tools package’s micro
font; no emoji artwork is used by the renderer. Source selections and missing-art
proposals are in [the artwork inventory](../../../docs/achievement-art.md).

## Levels and the hard ones

A counter can level up (`levels.ts`): each level is an achievement of its own (`level: { family, n, of }`),
so every level counts in the totals, the tab counts and "n of m". The every-life, every-loss and every-win
badges (1, 3, 10 in every listed game) are levels 1 to 3 of three families and keep their stored ids;
games played, games finished and walkthroughs watched are count families (`count`: 3, 10, 20 different
listed games, read in `goals.ts` from the record's `played`, `finished` and `watched` sets; a game the lists
keep out of sight never counts). A level's art changes in shape (pips, the number, a sign for life, loss and
win) and lightness as well as color; the last level is gold. The details dialog says "Level n of m", the level
the family is at and the next goal (`levelStanding`). Nothing in a saved record changes, so older records,
`mergeRecords`, backups and Reset need no migration. Tests: `levels.test.ts`.

`hard: true` marks the genuinely difficult ones (every game finished, every tin heart, every walkthrough, the top
trophy, every felt egg and the three Teddy eggs, every modem speed, every export, every kind of file, a hidden
find or two, and the last level of each family). Once earned a card or dialog icon gets a gold frame and a slow
sheen (`.is-gold` in `page.css` and `details.css`); with reduced motion the sheen holds still. A hidden one
stays hidden until earned, so the gold never gives it away.

## The page's header and views

`page.ts` keeps a sticky header (title, an ℹ️ button that opens the lead paragraph in a dialog,
"n of m unlocked", three toggle buttons with `aria-pressed`, and the tab row, which scrolls sideways
at phone width). The toggles are 📅 dates, 📊 progress and 🙈 hide unearned, kept in localStorage
(`gm-ach-dates`, `gm-ach-progress`, `gm-ach-hide-unearned`, listed in `backup/inventory.ts`). Dates
and progress are off by default. Cards have a minimum height, not a fixed height per mode
(`.ach-card` in `page.css`); a row stretches to fit its tallest card. With
unearned hidden a "n not yet earned are hidden" line remains. Earned badges have a solid accent frame
and a check; unearned ones a dashed frame and a lock, so they differ without color.

## Reset sticks

Tin hearts, felt eggs and score trophies are read from saves that Reset leaves alone.
`resetMark.ts` is what stops them returning: when Reset is confirmed, the record stores
a `reset` mark (the time, the hearts and eggs the saves held, and the best-score and total-score
sums). `start.ts` counts only hearts and eggs not in the mark (a heart whose find date is after the
reset counts again; eggs have no date, so an egg already held stays ignored), and `scoreTrophies/scores.ts`
counts only score growth beyond the sums. `mergeRecords` keeps the later mark, so a restored older
backup or a stale tab brings back the unlocks it holds but doesn't lift the cutoff. Tests:
`resetSticks.test.ts`.

## High-score tables

`highScores.ts` checks one game's persisted `.his` overlay: ten complete DOS records,
nonzero scores (the engine's display rule), and the same nonblank name after trimming
and case folding. It never pools games or falls back to another table on the disk.
`playSaves.ts` supplies the actual web and desk/DOS `onFileWrite` callback: keep the
usual save badge, persist first, then reread the authoritative table. Opening either
player also checks its saved table; `start.ts` scans on startup and coalesced save changes.
Bundles/standalone players do not earn site badges. There is no account or play ledger:
imported/edited tables can qualify too; table contents cannot prove ten separate plays.
Reset remembers qualifying tables, and unchanged tables stay forgotten across reload;
a changed qualifying table can earn All Mine again. Existing backups include the new
catalog id and reset baseline automatically. Tests: `highScores.test.ts`, `highScoresWatch.test.ts`.

## Course grades

`courseGrades.ts` keeps, per numbered Starter course, the best letter grade ever earned
(`gm-course-grades`, in the backup under Achievements, emptied by Reset). A `CourseRun` is fed
by `playAchievements` from the player's scene and life-lost hooks and by a move key or pointer
press on the page (the engine is untouched); the rules, course numbers (101 ...), GPA and
transcript are in `project/grades.ts` and `project/ceremonies.ts`. Entering a later level or
Game Won saves a grade that improves the stored best; a first-level grade (C-, C, D+) waits
until the play ends, including a quit. A failed localStorage write leaves no saved-grade
fallback; `loadGrades` rereads storage.

`honorDates.ts` keeps the day each graduation was first finished (`gm-honors-dates`, in the backup and cleared by Reset) for the certificate; `noteFinished` writes it. The Honors tab's name field is `gm-certificate-name` (in the backup, kept by Reset, never sent anywhere).

The seven honors badges (`honor-<graduation id>`: one per stage's honors and one for the diploma) are unlocked in `goals.ts` `refreshGoals` from the finished set and drawn in code by `web/scripts/achievementHonors.ts`.
