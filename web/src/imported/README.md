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
  keys and whether the hero faces up and down). A tag has to be earned (rules in the file's header). No AI. Its tags are suggestions, never written to DOS files.
- `knownGames.json`: content fingerprint to a `knownGame.ts` row for the CD's games and the public archive's (340 games, about 22 KB, 5 KB gzipped): tags curated by looking at each game (`knownGames.curated.json`, keyed by folder or zip name: a view, a genre and up to three themes, from the contact sheets of `web/scripts/knownGamesSheets.ts`), else the rules' guesses; its level count and whether the archive walk bot finished it. Built by `web/scripts/knownGamesTable.ts`. Loaded only when the Imported tab reads tags (`editor/shell/homeTags.ts`).
- `knownGame.ts`: a table row's shape, the curated words, and `tagInfo`: a curated row shows as "Tags", anything else as "Suggested tags".
