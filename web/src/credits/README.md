# `credits/`: the Credits page

Part of the [source map](../README.md).

The Credits page (`#/credits`, `creditsPage.ts`, one `*Section.ts` per
part, sharing `section.ts`), all arriving at once at modem speed (`modemSheet.ts`). Tests check
each against the lockfile, `code/` and the games' credits.

- Software: the npm packages (`deps.json`, written from the lockfile by `web/scripts/credits.ts`
  with `lockDeps.ts`; `depNotes.ts` says what each does) and the third-party pieces
  (`thirdParty.ts`, `piecesSection.ts`).
- The original: who the source credits for each part of RSD Game-Maker (`rsdParts.ts`) and every
  RSD intro screen (`rsdIntros.ts`), in `originalSection.ts`.
- The games' authors (`authorsSection.ts`), the AI tools and the people (`peopleSection.ts`), The
  Bard of Bizarre's table of who made what (`bardCredits.ts`, `bardTable.ts`), where to find more
  Game-Maker games (`moreGames.ts`, shared with the Guide), and the BBSes' pictures
  (`bbsPictureCredits.ts`, `bbsPicturesSection.ts`).
