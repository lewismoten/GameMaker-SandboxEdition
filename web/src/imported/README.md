# `imported/`: what this browser remembers about imported games

Part of the [source map](../README.md).

What this browser remembers about imported games, editor-only and
never in a game's files (localStorage through `localJson.ts`): each game's 1–5 star rating
(Unrated by default), its note, source and fingerprint (`gameNotes.ts`); the fingerprint itself,
the CRC-32s of its .gam files and player .EXEs (`fingerprint.ts`); the small record kept when one
is removed (`removedGames.ts`), which a later import marks "Previously removed"; the last 20 imports
with their failures (`importHistory.ts`, shown by the Imported tab's Import history…); the totals and held marks
the import chooser shows (`collectionPreview.ts`, `alreadyHave.ts`); moving the
rating and note between the two as games come and go (`noteMoves.ts`); grouping and filtering by
rating (`ratings.ts`) and the Library's notes list and search (`noteSearch.ts`). On screen: the
stars as a radio group, Unrated first (`ratingStars.ts`), the "Rating and note" dialog
(`noteDialog.ts`), and the Library's section of them, removed games marked and forgettable
(`notesShelf.ts`, loaded by the Library page); `imported.css` styles them.

## Tags

- `contentFingerprint.ts`: a game's content fingerprint, SHA-256 over the .gam and every data file
  it names (by lowercased name and CRC-32); saves, scores and players are left out. The CRC-only
  `fingerprint.ts` stays for the removed-game check.
- `gameTags.ts`: the deterministic tagger (gravity, a shot that births a monster, monster count,
  keys, scrolling and level count). No AI. Its tags are suggestions, never written to DOS files.
- `knownGames.json`: content fingerprint to tags for the CD's games, built by
  `web/scripts/knownGamesTable.ts` (a curated `knownGames.curated.json`, keyed by folder, replaces
  a guess). Loaded only when the Imported tab reads tags (`editor/shell/homeTags.ts`).
