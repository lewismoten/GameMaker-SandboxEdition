# web/src: a map

Game-Maker: Sandbox Edition in the browser. Two pages load this code:

- `index.html` → [`main.ts`](main.ts): the site. It opens on the **1994 desk** (`desk/`, a
  simulated DOS PC running the ported designers; no DOS or x86 code runs) or **today's web**
  interface (`editor/`), whichever the visitor used last (`localStorage` `gm-ui`).
  [`urlState.ts`](urlState.ts) keeps the place in the hash (`#/`, `#/game/cd:nebula`,
  `#/p/<project>/<file>?scene=3`, `#/help/<section>`, `#/cast`, `#/credits`, `#/achievements`,
  `#/mac`, `#/windows`, `#/linux`, `#/magazine?page=<n>`, `#/library?by=type`, `#/desk`), so a reload or a shared link
  comes back to it; [`seo/route.ts`](seo/route.ts) keeps the page's title and share tags in step
  with what is on screen. `?open=<url>` and `?receive` open a game sent by another site
  ([`linkIn/`](linkIn), [`docs/embed.md`](../../docs/embed.md)).
- `dos.html` → [`dosPage/dosPage.ts`](dosPage/dosPage.ts): DOS Game-Maker, the desk's PC on its
  own (`?game=<id>` opens that game in Game-Maker, `?run=dos` or `?run=bbs`, with `&dial=sandbox`
  or `&dial=sofa` to dial that board; `?project=<id>&run=play|design` a game kept in this
  browser). It loads no desk code (`dosPage/boundary.test.ts`); `#/dos` and `#/dos/<id>` on the
  site lead to it. [`viewSwitch.ts`](viewSwitch.ts) is the Desk | DOS | Web switch in all three
  headers.
- `play.html` → [`play.ts`](play.ts): a full-window player for one game
  (`?game=<id>`, `?project=<id>`, or the game bundled in an exported web app). Each
  bundled game also has its own copy of the page, `play-<id>.html` (made at build time,
  naming its game with `<meta name="gm:game">`), so link previews show that game.

Every module starts with a comment saying what it is for. Code ported from the original C
source names the file it came from (`code/GM/*.C` in the repository root).
[`keepTogether.ts`](keepTogether.ts) is the one phrase no word wrap splits, THE CHEZ: the
canvases' and BBS screens' wrappers split their text with its `words()`; HTML text uses a
no-break space.

What loads up front stays small: each editor, the desk, today's web, the Guide and the magazine
are their own downloads, and parts used only on demand are imported dynamically.
[`firstLoad.test.ts`](firstLoad.test.ts) says what each page and editor must not bring in up
front (the magazine, the desk, the level check's explorer, the engine…), walking imports with
[`importWalk.ts`](importWalk.ts) (a test helper, also behind `dosPage/boundary.test.ts`).

## Modules at the top

- [`main.ts`](main.ts), [`modernUi.ts`](modernUi.ts): the site's entry and today's web interface
  (see Main flows).
- [`play.ts`](play.ts): the play page's entry. [`dosPage/`](dosPage) is `dos.html`'s.
- [`urlState.ts`](urlState.ts): what the address bar keeps. [`viewSwitch.ts`](viewSwitch.ts): the
  Desk | DOS | Web switch.
- [`settingsMenu.ts`](settingsMenu.ts): today's web header's ⚙ Settings menu (play offline, the source, the theme, AI setup), its items also in the narrow ⋯ menu.
- [`theme.ts`](theme.ts): light or dark for today's web, as the Settings menu's Theme item. [`edition.ts`](edition.ts): the fork's
  name, in one place. [`pageToc.ts`](pageToc.ts): "On this page" beside a reading page (the Mac,
  Windows and Linux pages, the cast, credits and achievements), or a row of its section links
  before the first section on a narrower window.
- [`offline.ts`](offline.ts) registers [`siteWorker.ts`](siteWorker.ts), the site's service worker.
  [`prefetch.ts`](prefetch.ts) fetches what a visitor is likely to open next once the page settles.
- [`phoneScreen.ts`](phoneScreen.ts): whether the screen is a phone's (touch, its shorter side 500
  pixels or less) and how it is held, for the achievements and the documents' default view.
- [`keepTogether.ts`](keepTogether.ts): THE CHEZ kept on one line (above).
  [`seededRandom.ts`](seededRandom.ts): the seeded random numbers (Mulberry32, xorshift32) and
  string hash (FNV-1a) that pictures, songs, maps and walkthroughs use to come out the same every
  time.
- [`devReload.ts`](devReload.ts): development only, a Reload button in place of reloading the page
  (which would switch off the desk's PC) whenever a source file changes.
- [`firstLoad.test.ts`](firstLoad.test.ts) and [`importWalk.ts`](importWalk.ts): the up-front
  download checks (above).

Most tests sit beside their module (`*.test.ts`); older ones and those that cover several
modules are in [`../test`](../test).

## Folders

Each area's own README says what each of its files does; the short ones are described here.

### Game files, engine and player

- [`formats/`](formats/README.md): readers and writers for every Game-Maker file and the standard
  ones it uses (Borland C++ 16-bit layout).
- [`engine/`](engine/README.md): the game engine, a TypeScript port of `PLAYGAME.C`, and what
  XFERPLAY's own screens show.
- [`audio/`](audio/README.md): OPL2 music, the CMF player, Web Audio output, PC speaker sounds, and
  making songs and sound effects.
- [`gfx/`](gfx): the mode 13h screen (`screen.ts`) and 8×8 fonts (`font8x8.ts`; all of CP437 in
  `cp437Glyphs.ts`), and pictures drawn from a game's own maps: `levelPicture.ts`,
  `titlePicture.ts`, `gameShots.ts` and `sandboxShots.ts` (the Game-Maker box's and guide's), and
  screenshots that are a moment of play (`shotFrame.ts`, shown by `frameShot.ts`).
- [`input/`](input): keyboard scan codes (`scancodes.ts`, `keyboard.ts`), arrow chords and Mac
  keys for keyboards without a keypad (`chords.ts`, `macKeys.ts`), keys pressed with the mouse or
  a finger (`virtualKeys.ts`), the gamepad (`gamepad.ts`), and the desk's game pad and ball mouse
  as the PC's joystick and mouse (`deskJoystick.ts`, `deskMouse.ts`).
- [`player/`](player): the embeddable player (`player.ts`): canvas, start overlay, whole-pixel
  scaling (`exactScale.ts`), touch controls (`touch.ts`, with what the d-pad sends for each
  direction and which keys that leaves off the touch strip in `moveKeys.ts`), on-screen keys (`screenKeys.ts`) and a
  pointer that hides itself (`cursorHide.ts`). Used by `play.ts`, the editor's play test, the desk
  and exports.
- [`media/`](media/README.md): demos (`.REC`), the attract mode, and saving the screen as MP4, GIF
  or WAV.
- [`walkthrough/`](walkthrough/README.md): a Sandbox game's walkthrough: played on the real engine,
  watched with chapters, rendered to MP4.

### A game's files and publishing it

- [`project/`](project/README.md): a game's files, streaming and storing them, importing, the health
  check, saves and the companion file.
- [`imported/`](imported/README.md): what this browser remembers about imported games: ratings,
  notes and fingerprints.
- [`export/`](export/README.md): publishing a game: web app, single page, web player, DOS folder,
  and the Mac, Windows and Linux downloads.
- [`dosPlayer/`](dosPlayer/README.md): the DOS player customizer's core: patching XFERPLAY.EXE's
  words, colors, frames and keys.
- [`hostedPlayer/`](hostedPlayer/README.md): the web player, one file that plays Game-Maker game
  folders on any web host.
- [`linkIn/`](linkIn/README.md): opening a game another site links to or sends by postMessage.
- [`offline/`](offline): "Make available offline": the whole site in the service worker's cache at
  once (`offlineCopy.ts`), from the web's Offline dialog (`offlineDialog.ts`) or `OFFLINE.EXE` on
  the desk (`offlineExe.ts`).
- [`seo/`](seo): page titles, descriptions and JSON-LD for the site and its game pages: `site.ts`
  (shared with the build), `route.ts` (keeps the tags in step at run time) and `siteSections.ts` (the home page's WebSite and
  magazine data and its links to the `#/…` pages, which `seoBuild.ts` writes in).

### Today's web interface

- [`editor/`](editor/README.md): today's web interface: the home page, the workspace, the editors,
  the Level check and the Guide.
- [`saves/`](saves/README.md): the home page's Saves & scores panel: saved games, high scores and
  backups.
- [`macHelp/`](macHelp), [`winHelp/`](winHelp), [`linuxHelp/`](linuxHelp): the `#/mac`,
  `#/windows` and `#/linux` pages for players: opening a downloaded game the first time, what it
  does, removing it.
- [`cast/`](cast/README.md): the Cast page: the regulars on a stage, and the games each appears in.
- [`credits/`](credits/README.md): the Credits page: software, the original, the games' authors, the
  AI tools and the people.
- [`achievements/`](achievements/README.md): what the visitor has done: the catalog, the record, the
  page and ACHIEVE.EXE.

### The assistant: AI tools working on a game

- [`assistant/`](assistant/README.md): the tools an AI uses to open, check and change a game, the
  Assistant chat, and the MCP bridge.

### The 1994 desk and its PC

- [`desk/`](desk/README.md): the 1994 desk: the room, the PC's case, keyboard and monitor, the
  boxes, disks and props.
- [`dosPage/`](dosPage): DOS Game-Maker (`dos.html`, `dosPage.ts`): the PC's page with its one-row
  bar and ⋯ menu (`moreMenu.ts`, with the modem speed, `lineSpeed.ts`), disk menu (`diskMenu.ts`),
  and one-row footer (`footer.ts`) with the on-screen keys (`keypad.ts`) and the status line.
- [`retro/`](retro/README.md): the PC shared by the desk and `dos.html`: DOS, Game-Maker's menus and
  registration, the utilities and the BBSes.
- [`vga/`](vga/README.md): Game-Maker's eight designers, ported from their C source.
- [`eggs/`](eggs/README.md): the felt eggs hidden in the Sandbox games, their shadow box and
  EGG.EXE.
- [`tinHearts/`](tinHearts/README.md): the tin heart hunt and its trophy.
- [`scoreTrophies/`](scoreTrophies/README.md): the desk's two score trophies.

### The Guides, the paper in the boxes and the magazine

- [`library/`](library/README.md): the Library: a card for everything to read or print, and the
  site's videos.
- [`manual/`](manual/README.md): the Owner's Guide, the web Guide, each game's manual and box
  contents, the zine, the Ultimate Owner's Guide and TURBO BUTTON.

## Main flows

**Desk or modern UI.** `main.ts` is a tiny entry: it loads `desk/desk.ts` or `modernUi.ts`
(today's home and workspace; the Guide is its own download) only for the interface being shown,
and the editors (`editor/editors/registry.ts` `loadEditor`) one at a time, as files of each kind
are opened, so each interface is its own download. `offline.ts` registers the service worker
(`siteWorker.ts`), which precaches only the app shell and caches games as they are used; a new
deploy waits for the visitor to say "Reload". A hosted game comes in one request: its pack
(`<id>.<hash>.gmpak`, all its files gzipped in play order, `project/gamePack.ts`), read as it
arrives so play starts once the .gam is in (`loadHostedGame`, `streamHostedGame`). Single files go
through `fetchGameFile` (`project/files.ts`), which shares each request and reads from a pack
already at hand. The build also puts in the catalog what pages would otherwise fetch files to work
out (the quick health check, a box's captions). Lists load `games/catalog.json`
(`loadCatalogList`), and a game's notice, manual and printables come from
`games/details/<id>.json` when it is opened (`withDetails`); pictures of listed games are prebuilt
in `games/shots/` (`gfx/levelPicture.ts`; the tiles' title screens, `gfx/titlePicture.ts`).
`main.ts` starts one or the other and switches between them; the desk's PC can also open today's
editors full screen on its monitor (`retro/computer.ts` `openEditor`, through the same editor
registry).

**Formats → engine → player.** A game is a `GameFiles` (`project/files.ts`): loaded from the CD
catalog, IndexedDB, a zip or a folder. A hosted game on the play page streams in
(`project/streamGame.ts`): it starts once its `.gam` is in, and the engine asks for each file just
before reading it (`engine/machine.ts` `need`). `player/player.ts` mounts a canvas and runs
`engine/game.ts`, which parses the `.gam` and the files each scene names with `formats/`, and
plays them on the `engine/machine.ts` screen, keyboard and timers (an 18.2 Hz game clock, 145.6 Hz
for scrolling and sound) with `audio/` for music and sound.

**Editors, exports and media.** How the editors work is in [`editor/`](editor/README.md), how a
download is made in [`export/`](export/README.md), and how demos, video and recordings fit together
in [`media/`](media/README.md).

## Build-time code

The build's Vite plugins and the scripts run by hand are in [`../scripts`](../scripts/README.md).
