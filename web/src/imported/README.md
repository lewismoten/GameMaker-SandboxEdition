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

`localJson.ts` returns an empty value when storage cannot be read or its JSON cannot be
parsed, and silently drops failed writes; it has no in-memory persistence fallback.
In `noteDialog.ts`, Save applies the draft rating and trimmed note; Cancel or Escape leaves
them unchanged. A closed dialog is not proof that a storage write succeeded.

## Tags

- `contentFingerprint.ts`: a table-lookup key, the first eight bytes of SHA-256 written as
  16 hex digits. It hashes sorted text containing the .gam's CRC-32 and each referenced
  data file's lowercased name and CRC-32, not the files' raw bytes. A missing file contributes
  `missing`; if the .gam parser throws, no key is returned. Saves, scores and players are left out.
  A key does not establish that the game is valid or intact. The separate `fingerprint.ts` uses .gam
  CRC-32s and compares player CRC-32s only when both fingerprints have them; it stays for
  held-game and removed-game matching.
- `gameTags.ts`: the deterministic tagger (gravity, a shot that births a monster, monster count,
  keys and whether the hero faces up and down). A tag has to be earned (rules in the file's header). No AI. Its tags are suggestions, never written to DOS files.
- `knownGames.json`: content fingerprint to a `knownGame.ts` row for the CD's games and the public archive's (340 games, about 22 KB, 5 KB gzipped): tags curated by looking at each game (`knownGames.curated.json`, keyed by folder or zip name: a view, a genre and up to three themes, from the contact sheets of `web/scripts/knownGamesSheets.ts`), else the rules' guesses; its level count and, when recorded, whether the archive walk bot finished it. Built by `web/scripts/knownGamesTable.ts`. The neighboring [`editor/shell/homeTags.ts`](../editor/shell/homeTags.ts) loads it when a game's saved-version tag cache misses, after the Imported list is up.
- `knownGame.ts`: a table row's shape, the curated words, and `tagInfo`: a curated row shows as "Tags", anything else as "Suggested tags".
