# `library/`: the Library

Part of the [source map](../README.md).

The Library (`#/library`, the top bar's Library link): a card for
everything to read or print, sorted by game or by type (`?by=type`) and narrowed to one game or
kind (`&only=levelmap`) and, within a kind, one game (`&game=teddy`), all remembered per
browser (`prefs.ts`). Opened with no sort in the address just after a game's page, a look
inside a game or a copy of one in the editor, it starts on that game's shelf if it has one
(`../libraryStart.ts`, outside `library/` so `main.ts`'s router can note each view; used once), with a "Showing: <game> · All games"
line. Level Maps cards show the first level's picture (`levelMaps` `preview`); each box's Sandbox
Scoop shows its issue number and date and sorts by it; each game's walkthrough is a card
(`walkShelf.ts`) with its length (M:SS, or H:MM:SS from an hour up) over its title screen, shortest first by type,
played in the walkthrough player. Videos about the site (`videos.ts`, plain data: one entry a
video, with its description and chapters) show their length over a picture kept in `web/public/videos/`,
and open in `videoDialog.ts`: nothing comes from YouTube until Play (or a chapter, or a time in the
transcript, which start it there), which embeds youtube-nocookie.com; closing removes the player.
Its Transcript disclosure fetches `web/public/videos/<id>.transcript.json` when opened, written from
YouTube's automatic captions by `web/scripts/videoTranscript.ts` (see [`web/scripts/`](../../scripts/README.md)).
`shelf.ts` is the list as data (the kinds of paper, from manuals, hint books and maps to
keyboard reference, registration, business and ID, and license and warranty cards and hint
book postcards; the games, a secret one only once revealed in this browser, and the two
sorts), `siteShelf.ts` the site's own reading (TURBO BUTTON, the Guides, the desk's zine once
found), `listing.ts` builds it from the catalog (`loadCatalog`) and the boxes' pieces, and the
page lists it afresh when a secret game is revealed or hidden (`catalogWatch.ts`), `thumbs.ts` draws each
card's first sheet while it is near the window, one at a time and giving the browser back between
them (`covers.ts` draws just the cover of manuals, hint books and TURBO BUTTON), `shared.ts` lists once the pieces the same in
every box (the catalog and the BBS ad) with how many boxes they are in, and `libraryPage.ts` is
the page; a card opens its piece in the box viewer (`openBox`'s `start`), the magazine, the Guide or the zine.
`printShelf.ts` adds the print shop's cards: each listed game's Disk labels and (with a box) Retail
box, the Game-Maker box flat and its CD's label with the Game-Maker box's paper, and TURBO BUTTON's cover disc with the site's
reading, under the kinds Disk and CD labels and Retail boxes; they open in the print shop
(`../manual/printables/printShop.ts`, loaded when one is opened or drawn).
`readerAddress.ts` keeps the Game-Maker box's open piece and chapter in the address
(`&gm=ultimate&ch=12`): a link opens it there, each chapter chosen is a history entry, and Back
past the opening closes it.
