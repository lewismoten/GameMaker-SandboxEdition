# `imported/`: what this browser remembers about imported games

Part of the [source map](../README.md).

What this browser remembers about imported games, editor-only and
never in a game's files (localStorage through `localJson.ts`): each game's 1–5 star rating
(Unrated by default), its note, source and fingerprint (`gameNotes.ts`); the fingerprint itself,
the CRC-32s of its .gam files and player .EXEs (`fingerprint.ts`); the small record kept when one
is removed (`removedGames.ts`), which a later import marks "Previously removed"; moving the
rating and note between the two as games come and go (`noteMoves.ts`); grouping and filtering by
rating (`ratings.ts`) and the Library's notes list and search (`noteSearch.ts`). On screen: the
stars as a radio group, Unrated first (`ratingStars.ts`), the "Rating and note" dialog
(`noteDialog.ts`), and the Library's section of them, removed games marked and forgettable
(`notesShelf.ts`, loaded by the Library page); `imported.css` styles them.
