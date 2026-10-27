# `manual/`: the Guides, the paper in the boxes and the magazine

Part of the [source map](../README.md).

The Owner's Guide for the desk (`dosManual.ts`, its chapters in `dosManualFront.ts`,
`dosManualDesign.ts` and `dosManualBack.ts` with `dosManualKit.ts`, its pages `booklet.ts`, its
screens `figures.ts`, its registration record `regRecord.ts`), the web Guide (`webManual.ts`), and
each original game's printed manual (`gameManual.ts`). `fonts/` holds the handwriting font
(Caveat, with its OFL). `readView.ts` is how every document is read, Pages (a page at a time)
or Scroll (every page in one column; a phone's default), with the bar's Pages | Scroll pair
and the choice kept per browser; `scrollPages.ts` is the Scroll column, drawing pages as they
near the view and telling the page in view. `readSize.ts` is the size pages are shown at (Fit
width, Fit page, Actual size at 96 pixels an inch, or zoomed 10–300%), with the bar's size list,
Ctrl/Cmd with + and −, and a pinch; also kept per browser. The box viewer, the zine, TURBO BUTTON and the
Level Maps read both ways.

## `printables/`: the paper in each game’s box

Each game's box contents, with its own
[README](printables/README.md). The viewer (`viewer.ts`) shows the paper in a "What's in
the box" tray (`items.ts`); `chapterJump.ts` is its Chapters list for a booklet whose pages mark
their chapters (`BookPage.marks`: the Owner's Guide and The Ultimate Owner's Guide), and makes
their contents rows buttons that turn to the page; `gen.ts` makes what every Sandbox Software box has; `kit.ts`,
`fitSheet.ts`, `paginate.ts`, `imposition.ts` and `crisp.ts` lay paper out.

- Manuals: `manualPages.ts` and `manualCover.ts`; the hint book's cover (`hintCover.ts`,
  `hintCoverArt.ts`) and answers hidden under red film (`redFilm.ts`); the key card (`keys.ts`);
  the story (`story.ts`).
- The fold-out World Map (`worldMap.ts`, with `worldMapGroups.ts`, which folds conversation
  scenes into their place; `worldMapPlan.ts`, `worldMapBands.ts` and `worldMapRoute.ts`, which
  place them and route the paths between, measured by `worldMapMeasure.ts`; `worldMapThemes.ts`,
  the theme each game's map is drawn in, with `worldMapRegions.ts`, `worldMapGround.ts`,
  `worldMapGroundKit.ts`, `worldMapIndoors.ts`, `worldMapWays.ts`, `worldMapDecor.ts`,
  `worldMapTerrain.ts` and `worldMapArt.ts` drawing it; `worldMapLayout.ts` for the pages) and
  the Level Maps (`levelMaps.ts`, `levelMapLayout.ts`), which never show a tin heart or egg
  (`levelSecrets.ts`, from `levelSecrets.json` written by `web/scripts/levelSecrets.ts`) and crop to
  what the player sees (`levelViews.ts`, from `levelViews.json` written by
  `web/scripts/levelViews.ts`; a map the hero walks off the edge of is laid out as the player goes
  through it, `editor/check/unroll.ts`, and goes round forever only if the hero got round; a
  course through the wrap, `editor/check/course.ts`, prints as the strip the way runs, turned
  to run up the page in stitched panels, `levelCourse.ts` and `levelCourseSvg.ts`, and a map
  printable's panel can draw it as a poster, `levelCoursePoster.ts`),
  both looked round with `panZoom.ts`. A map of separate rooms prints each room apart
  (`levelRooms.ts`; `levelRoomHints.ts` names rooms, draws copies once and adds a cast panel),
  and a map nobody walks around in is left out; levels that show one place in several states
  (near and far planes) print as one map (`levelStates.ts`). `levelPoster.ts`
  draws one level the same way as a PNG, for the map editor's "As players see it" picture.
- Stickers: the sheet (`stickers.ts`, `gmStickers.ts` for the Game-Maker box), laid out on Print
  Then Cut sheets (`stickerArt.ts`, `stickerGeom.ts`, `stickerPaint.ts`) by the sticker rules in
  `manual/printables/README.md` (least size, bleed, spacing, die-cut border), with files for
  Design Space and other cutting machines.
- The Game-Maker box's paper: its Owner's Guide cover (`gmCover.ts`), what else is in it
  (`gmItems.ts`, `gmInserts.ts`), The Bard of Bizarre's catalog (`bardCatalog.ts`) and RSD's
  registration reply (`regConfirm.ts`). `sandboxMark.ts` is Sandbox Software's emblem and
  `scoopIssue.ts` each box's newsletter number, in the order of the months the games shipped
  (`scoopIssues.ts`), so the issues read as the studio's story.

## `zine/`: NO CARRIER #3

NO CARRIER #3, the hacker zine under the desk's toy whistle:
its pages (`zinePages.ts`), each on a quarter-letter leaf with its type fitted (`zineLeaf.ts`),
and its piece in the box viewer (`zineItem.ts`: one leaf at a time on screen, four to a letter
sheet in print), opened by the whistle and the Library.

## `ultimate/`: The Ultimate Owner’s Guide

The Ultimate Owner's Guide in the Game-Maker box.

- `ultimateItem.ts` is its piece in the box and cover (small, so the box loads without the
  chapters), `ultimateGuide.ts` its pages, `plan.ts` its running order and page sums, `chapter.ts`
  one chapter's flow.
- `chapters*.ts` are its chapters: palettes and blocks (`chaptersLook.ts`), monsters, logic and
  scenes (`chaptersPlay.ts`), sound (`chaptersSound.ts`), title screens, demos and play-testing
  (`chaptersShow.ts`), designing with a goal (`chaptersCraft.ts`), 12 level design
  (`chaptersLevels.ts`), 13 tricks from the Sandbox games (`chaptersTricks.ts`), 14 the Level
  check and walkthrough bot (`chaptersCheck.ts`), 15 and 16 designing for every player and where
  Game-Maker runs out (`chaptersPlayers.ts`), and 17 tricks from the shareware authors
  (`chaptersShareware.ts`, with the second survey's "More from the archive" in
  `archiveTricks.ts`), whose table of the words the DOS player shows, and where they sit in
  the CD's `XFERPLAY.EXE`, is `playerWords.ts` (its test reads the .EXE).
- Figures are drawn from real files (`ultimateFigures.ts`, `paletteFigures.ts`).
  `openUltimate.ts` and `openInManual.ts` open it from outside the desk.

## `magazine/`: TURBO BUTTON

TURBO BUTTON, a mid-90s game magazine (`#/magazine`, and
lying on the desk's left, `#/desk?open=magazine`).

- Putting it together: `issue.ts` holds the running order (page numbers, the contents page, the
  advertiser index, and house ads from `sections/houseAd.ts` to fill whole folded sheets);
  `masthead.ts` its name and issue; `games.ts` the games it may name (never a secret one).
- `pageRefs.ts`: the page numbers pages give each other once placed (a jumped story's "Continued
  on page N" and "Continued from", `{page:<id>}` in text) and the small ads on editorial pages for
  the advertiser index, which `sections/smallAds.ts` holds (half- and third-page ads, The Sofa
  BBS's in a cozy living room with a drawn sofa, `sofaAd.css`; a story's back half is its
  section's `*_JUMP`).
- `sections/`: one module per section, each returning pages of plain-data blocks (`types.ts`,
  built with `blocks.ts`, inline markup read by `inline.ts`) so the whole issue builds and is
  tested in Node. Among them: the cover, contents, news, reviews, the Critic's Corner, the
  strategy guide, the interviews (`lewis.ts`, `claude.ts`), the Maximus feature, the web edition
  feature, `dosBugs.ts` (what testing in real DOS found), the Mail Bag (with its Design Desk of
  readers' level troubles), `gripes.ts` (what players hate, and how to fix it), `readersPicks.ts` (polish
  over size: a finished four-level game beats a huge one and a tiny one), the character spotlight,
  the game directory, the BBS listings, the store, the reader service card and the ads
  (`ads.ts`; its inside front cover on the Owner's Guide's blueprint, `sandboxEditionAd.css`).
- Links: `go.ts` its `go:` links into the site and `goRun.ts` the ones that open a box, the store,
  the mouse pad chooser or a desk prop.
- `render.ts` draws the pages with:
  - `disc.ts`, the issue's cover-mounted CD-ROM, drawn turning, which opens the original 2014
    Game-Maker source (`sections/freeCd.ts` is its page);
  - `piece.ts`, a box's printed piece small, such as a hint book's or The Ultimate Owner's
    Guide's cover;
  - `toolShots.ts`, Game-Maker's design tools drawn at work on a game's own files;
  - `callouts.ts`, a picture with numbered spots and their key;
  - `coverFan.ts`, the issue's covers fanned out small;
  - `replyMail.ts`, a reply card's business reply mail side, with `postnet.ts`, the post office's
    address bar code under the address on it (order cards have none);
  - `mugShelf.ts`, a row of mugs wearing the desk mug's own pictures, for the mug ad
    (`sections/mugAd.ts`);
  - `shelf.ts`, a long list of titles set small in columns by letter, for The Shareware Shelf
    (`sections/shelf.ts`: every Game-Maker game in the Internet Archive's Game-Maker Archive,
    titles only, from `data/gameMakerArchive.json`, its own download fetched while the issue is
    put together, which `web/scripts/gameMakerArchive.ts` fetches again; `sections/masters.ts`
    follows it with the tricks those games' makers used).
- `art.ts`: its drawn pictures (each an `<svg>` from `svgArt.ts`), with:
  - `speakerArt.ts`, `diskBoxArt.ts` and `modemArt.ts`, the desk's speakers, disk box and modem
    drawn as the desk draws them, for their ads;
  - `soundCardArt.ts`, the Sound Boaster card and a kid's face before and after it, for the sound
    card's ad, `sections/soundCardAd.ts` (its deep blue page and burst of sound waves
    `soundCardAd.css`);
  - `blankDisk.ts`, a stack of bulk disks without labels, for the Floppy Barn ad;
  - `notcherArt.ts`, the HOLE-Y MOLEY disk notcher and a disk before and after it, for its ad,
    `sections/notcherAd.ts` (its charcoal page `notcherAd.css`);
  - `joeyDrawing.ts`, a reader's crayon drawing of Teddy driving THE CHEZ to the moon, for the
    Mail Bag;
  - `bossChain.ts`, the Design Workshop's diagram of a boss with hit points as a chain of states;
  - `deskShot.ts`, its snapshot of the 1994 desk, `web/public/magazine/desk-1994.webp`, with how to
    take it again; `webShots.ts`, its screenshots of today's web, `web/public/magazine/web-*.webp`,
    likewise; and `dosShot.ts`, Lewis's DOSBox screenshot of Carl's garbled cover,
    `web/public/magazine/dos-carl.webp`, for `sections/dosBugs.ts`.
- `viewer.ts` lays every page out at one size (a letter sheet at 96 CSS pixels to the inch, as
  printed) and scales it whole to fit the window, so no page runs over at any window size, and
  turns, zooms and prints them on letter paper.
