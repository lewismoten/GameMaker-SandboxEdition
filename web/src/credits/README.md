# `credits/`: the Credits page

Part of the [source map](../README.md).

The Credits page (`#/credits`, `creditsPage.ts`, section modules sharing `section.ts`) has
one tab per part. `tabs.ts` keeps the selected tab in the address, for example
`#/credits?tab=ai`; `#/credits?go=<element id>` opens the tab holding that element, and
`gotoCredit(id)` does the same for in-page links. Print shows every part. Tests compare
the package list, original-source credits and game credits with their respective sources.

Only the BBS picture sheets simulate modem-speed arrival (`modemSheet.ts`), not the whole
Credits page. The sheet fetches the full picture bytes before starting the timed reveal,
then decodes the received-looking prefixes. It starts when its controls scroll into view;
with reduced motion, it waits for Start downloads or Show them all now.

- Software: the npm packages (`deps.json`, written by [`web/scripts/credits.ts`](../../scripts/credits.ts)
  with local `lockDeps.ts`; versions and licenses come from the root lockfile, while author
  and repository details come from installed package manifests when available;
  `depNotes.ts` says what each does) and the third-party pieces
  (`thirdParty.ts`, `piecesSection.ts`).
- The original: who the source credits for each part of RSD Game-Maker (`rsdParts.ts`) and every
  RSD intro screen (`rsdIntros.ts`), in `originalSection.ts`.
- The games' authors (`authorsSection.ts`), the AI tools and the people (`peopleSection.ts`), The
  Bard of Bizarre's table of who made what (`bardCredits.ts`, `bardTable.ts`), where to find more
  Game-Maker games (`moreGames.ts`, shared with the Guide), and the BBSes' pictures
  (`bbsPictureCredits.ts`, `bbsPicturesSection.ts`).
