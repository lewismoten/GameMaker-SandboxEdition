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
  browser; `?tour=dos` its guided tour, [`tour/`](tour/README.md)). It loads no desk code (`dosPage/boundary.test.ts`); `#/dos` and `#/dos/<id>` on the
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

What kept pages small (2026-11-07, `npm run verify:perf` and its budgets):

- A page that only reads a setting or asks a yes/no question must not import the module with
  the heavy class or dialog beside it. Keep the small part in a file of its own:
  `media/demoAudio.ts` (the sound choice) and `demoAudioEngine.ts` (the audio engine);
  `player/touchWanted.ts` and `touch.ts`; `retro/bbs/warezList.ts` and `warezArea.ts` (the BBS
  terminal); `editor/shell/downloadButton.ts` and `download.ts` (the chooser and every export).
- A button imports what it opens when it is pressed (`(await import('./download')).chooseDownload`),
  and a check imports its checker when it runs (`gameHealth.ts`).
- The play page's code is in a few manual chunks (`player`, `shared-…`, `vite.config.ts`
  `playChunks`). A page that statically imports one module of the `player` chunk downloads
  the whole chunk (about 45 kB compressed): the Library did, for the demo sound choice.
- A dynamic `import()` of a module keeps every export of it in the chunk where something else
  loads it up front. The file picker's palette templates come through
  `editor/widgets/palettePresets.ts` (two named exports) rather than `import()` of the tools
  package's `./palettes`, which `editor/core/project.ts` loads for the default palette; and a
  table built at load needs a lazy function or a `/* @__PURE__ */` call to be dropped
  (`tools/src/palettePresets.ts`).
- A picture shown minutes later (Doc Leo's glance on the desk) loads shortly before it shows,
  not with the page.
- `verify:perf` counts the bytes the page fetched from the network; a file the service worker
  serves counts as a request of 0 bytes, so figures swing a few kB between runs. Measure the
  same scratch build twice before and after a change.
- `games/catalog.json` (about 77 kB compressed, on the home page, the desk and dos.html) and the
  built `index.html` (about 22 kB) are written by `scripts/cdGames.ts` and `scripts/seoBuild.ts`,
  which `vite.config.ts` imports: changing them restarts the dev server, so they need a quiet
  moment.

## Modules at the top

- [`challenges/`](challenges/README.md): reviewed challenge descriptors and the guest-state isolation design and storage seam.

- [`main.ts`](main.ts), [`modernUi.ts`](modernUi.ts): the site's entry and today's web interface
  (see Main flows).
- `archive.html` → [`archive/archive.ts`](archive/archive.ts) ([README](archive/README.md); nothing links to it): fetches every file in `archive.json` (the build writes it from the whole built site: the offline copy plus link previews, the pocket firmware, crawler files, trinkets and laser kits; never a secret game's or the gate lists), four at a time with a progress bar, so a web archive's "Save page" records them ([`archive/plan.ts`](archive/plan.ts) orders them: shell, home and desk, the rest, then game packs with `?games=1`; `?part=N` slices). [`offline/replay.ts`](offline/replay.ts) spots a Wayback replay (its `__wm` / `_WBWombat` globals or a `/web/<14 digits>/` address); there `offline.ts` registers no service worker and a missing chunk gets a calm note, not the reload notice.
- [`play.ts`](play.ts): the play page's entry. [`dosPage/`](dosPage/README.md) is `dos.html`'s.
- [`libraryStart.ts`](libraryStart.ts): the game the Library starts on, noted from the last game page, look or
  project view (`library/libraryPage.ts` reads it once).
- [`urlState.ts`](urlState.ts): what the address bar keeps. [`viewSwitch.ts`](viewSwitch.ts): the
  Desk | DOS | Web switch.
- [`settingsMenu.ts`](settingsMenu.ts): today's web header's ⚙ Settings menu (play offline, the source, the theme, the guided tour, AI setup, back up / restore), its items also in the narrow ⋯ menu.
- [`soundSettings/`](soundSettings/README.md): the ⚙ menu's Sound and tour dialog: music, voice and sound effects (on, volume) and the tour switch.
- [`theme.ts`](theme.ts): light or dark for today's web, as the Settings menu's Theme item. [`edition.ts`](edition.ts): the fork's
  name, in one place. [`pageToc.ts`](pageToc.ts): "On this page" beside a reading page (the Mac,
  Windows and Linux pages, the cast, credits and achievements), or a row of its section links
  before the first section on a narrower window.
- [`offline.ts`](offline.ts) registers [`siteWorker.ts`](siteWorker.ts), the site's service worker. A new version waits in [`offline/updateState.ts`](offline/updateState.ts): the notice is held on play pages and fades after about 15 s, and Settings keeps "New version ready".
  [`prefetch.ts`](prefetch.ts) fetches what a visitor is likely to open next once the page settles.
- [`phoneScreen.ts`](phoneScreen.ts): whether the screen is a phone's (touch, its shorter side 500
  pixels or less) and how it is held, for the achievements and the documents' default view.
- [`keepTogether.ts`](keepTogether.ts): THE CHEZ kept on one line (above).
- [`routeFocus.ts`](routeFocus.ts): after a link or button opens another page, focus moves to its h1 (never on first load, Back, code-made hash changes, or while a dialog or text box has focus).
  [`seededRandom.ts`](seededRandom.ts): the seeded random numbers (Mulberry32, xorshift32) and
  string hash (FNV-1a) that pictures, songs, maps and walkthroughs use to come out the same every
  time.
- [`devReload.ts`](devReload.ts): development only, a Reload button in place of reloading the page, labeling generated game files separately from source changes; the dev server keeps serving the old code until it is pressed (`manualReload` in `vite.config.ts` holds back Vite's invalidation)
- [`devLog/`](devLog/README.md): `interactionLog.ts`: development on localhost only, opt in with the 🙈/🐵 corner switch (remembered): logs screen size, pointer, clicks, keys (never what is typed in a field), routes, slow paints, long tasks and every JavaScript error to `.for-lewis/debug/interaction-log/<date>.jsonl` through `scripts/devLog.ts`; it pauses after 5 minutes with no mouse or keyboard
- [`devLog/gameLog.ts`](devLog/gameLog.ts), [`devLog/replayCore.ts`](devLog/replayCore.ts): with the 🐵 switch on, a running game also logs `game-start` (game, .gam hash, random seed, hardware), `game-input` (the keys the game applied, `[clock, scan, ...]`), `game-snap` (scene, hero, hit points, lives, score, about every second and on scene change, hurt, death, pickup and win), `game-note` and `game-end`; `npm run replay:log -- <log.jsonl>` (`scripts/replayLog.ts`) replays it headless and checks each snapshot
  (which would switch off the desk's PC) whenever a source file changes.
- [`firstLoad.test.ts`](firstLoad.test.ts) and [`importWalk.ts`](importWalk.ts): the up-front
  download checks (above).

Most tests sit beside their module (`*.test.ts`); older ones and those that cover several
modules are in [`../test`](../test).

## Folders

Each area's own README says what each of its files does; the short ones are described here.

### Game files, engine and player

SDK implementation lives in the packages below; the app imports their declared exports. Runtime screen/fonts/keyboard/CP437 data belong to the engine package, archive and scan modules to archives, and generic drawing/music/PNG/simulation builders to tools. See [workspace development](../../docs/monorepo.md).

- [`formats/`](formats/README.md): integration tests for the engine package's readers and writers for every Game-Maker file and the standard
  ones it uses (Borland C++ 16-bit layout).
- [`engine/`](engine/README.md): engine integration tests; the engine package owns the TypeScript port of `PLAYGAME.C`, and what
  XFERPLAY's own screens show.
- [`../packages/engine/`](../packages/engine/README.md): the npm package build and usage guide for
  the reusable browser engine.
- [`../packages/archives/`](../packages/archives/README.md): portable browser/Node game discovery, ZIP/SFX unpacking, and ZIP creation.
- [`../packages/tools/`](../packages/tools/README.md): the development-only npm toolkit for native formats, drawing, audio generation and headless checks.
- [`audio/`](audio/README.md): OPL2 music, the CMF player, Web Audio output, PC speaker sounds, and
  making songs and sound effects.
  Subareas:
  - [`audio/chez/`](audio/chez/README.md): THE CHEZ's synthesized motor and pass-by sounds.
  - [`audio/phone/`](audio/phone/README.md): phone scripts, voice casting, recorded clips and playback.
- [`gfx/`](gfx/README.md): pictures drawn from a game's own maps: `levelPicture.ts`,
  `titlePicture.ts`, `titlePoster.ts` (the click-to-play title for projects and bundles), `gameShots.ts` and `sandboxShots.ts` (the Game-Maker box's and guide's), and
  screenshots that are a moment of play (`shotFrame.ts`, shown by `frameShot.ts`).
- [`input/`](input/README.md): Mac keys for keyboards without a keypad (`macKeys.ts`), keys pressed with the mouse or
  a finger (`virtualKeys.ts`), the gamepad (`gamepad.ts`), and the desk's game pad and ball mouse
  as the PC's joystick and mouse (`deskJoystick.ts`, with the pad's TURBO switch in `padTurbo.ts`; the portable mouse state lives in the engine package).
- [`player/`](player/README.md): the embeddable player (`player.ts`): canvas, start overlay, optional first-run video/audio setup (`hardwareSetup.ts`) and remembered per-game choices (`hardwarePrefs.ts`, backed up with preferences; on the 1994 PC the setup is PLAYGAME's own DOS Configure screen, `dosConfig/`), whole-pixel
  scaling (`exactScale.ts`), touch controls (`touch.ts`, with what the d-pad sends for each
  direction and which keys that leaves off the touch strip in `moveKeys.ts`), on-screen keys (`screenKeys.ts`) and a
  pointer that hides itself (`cursorHide.ts`). Used by `play.ts`, the editor's play test, the desk
  and exports.
  Subarea:
  - [`player/dosConfig/`](player/dosConfig/README.md): PLAYGAME's DOS Configure screen, hardware choices and setup loop.
- [`media/`](media/README.md): demos (`.REC`), the attract mode, and saving the screen as MP4, GIF
  or WAV.
- [`walkthrough/`](walkthrough/README.md): a Sandbox game's walkthrough: played on the real engine,
  watched with chapters, rendered to MP4.

### A game's files and publishing it

- [`project/`](project/README.md): a game's files, streaming and storing them, importing, the health
  check, saves and the companion file.
  Subareas:
  - [`project/saveData/`](project/saveData/README.md): save slots, high scores, level changes and save backups.
- [`imported/`](imported/README.md): what this browser remembers about imported games: ratings,
  notes and fingerprints.
- [`export/`](export/README.md): publishing a game: web app, single page, web player, DOS folder,
  and the Mac, Windows and Linux downloads.
- [`dosPlayer/`](dosPlayer/README.md): the DOS player customizer's core: patching XFERPLAY.EXE's
  words, colors, frames and keys, and an imported game's own player (its build and kept bytes).
- [`hostedPlayer/`](hostedPlayer/README.md): the web player, one file that plays Game-Maker game
  folders on any web host.
- [`linkIn/`](linkIn/README.md): opening a game another site links to or sends by postMessage.
- [`community/`](community/README.md): reviewed links to independently hosted games and
  the Community submission form; [contribution guide](../../docs/community-games.md).
- [`offline/`](offline/README.md): "Make available offline": the app's offline manifest and the visible
  games in the service worker's cache at once (`offlineCopy.ts`), from the web's Offline dialog (`offlineDialog.ts`) or `OFFLINE.EXE` on
  the desk (`offlineExe.ts`); `loadFailure.ts` says so when a part of the site cannot load.
- [`courier/`](courier/README.md): what Scoot, the desk buddy, carries: mail (a letter from each BBS
  on its first call), postcards and packages, in one store read by its card on the desk and by
  `SCOOT.EXE` on the PC.
- [`seo/`](seo/README.md): page titles, descriptions and JSON-LD for the site and its game pages: `site.ts`
  (shared with the build), `route.ts` (keeps the tags in step at run time) and `siteSections.ts` (the home page's WebSite and
  magazine data and its links to the `#/…` pages, which `seoBuild.ts` writes in).

### Today's web interface

- [`editor/`](editor/README.md): today's web interface: the home page, the workspace, the editors,
  the Level check and the Guide.
  Subareas:
  - [`editor/check/`](editor/check/README.md): level check orchestration, worker protocol, exploration and reporting.
  - [`editor/check/checks/`](editor/check/checks/README.md): individual static and play-derived design checks.
  - [`editor/check/generators/`](editor/check/generators/README.md): one-click fixes and maze setup using ordinary game data.
  - [`editor/check/walk/`](editor/check/walk/README.md): walkthrough generation, replay verification and kept author/bot routes.
  - [`editor/colorHelp/`](editor/colorHelp/README.md): optional color naming, look-alike warnings and simulated previews.
  - [`editor/core/`](editor/core/README.md): shared editor project, history, DOM and indexed drawing helpers.
  - [`editor/editors/`](editor/editors/README.md): file-kind dispatch and lazy editor registration.
  - [`editor/editors/animation/`](editor/editors/animation/README.md): FLI frame editing and Scene/Frames workflows.
  - [`editor/editors/animation/scene/`](editor/editors/animation/scene/README.md): companion-backed animation Scene maker and renderer.
  - [`editor/editors/animation/shrink/`](editor/editors/animation/shrink/README.md): worker-backed FLI size reduction and real result preview.
  - [`editor/editors/backdrop/`](editor/editors/backdrop/README.md): BKD picture-window editing and picture resolution.
  - [`editor/editors/blocks/`](editor/editors/blocks/README.md): block-set pixel and behavior editor.
  - [`editor/editors/character/`](editor/editors/character/README.md): hero starting values, sequences and character frames.
  - [`editor/editors/highScores/`](editor/editors/highScores/README.md): HIS table editing.
  - [`editor/editors/integrator/`](editor/editors/integrator/README.md): GAM scenes, links and boards.
  - [`editor/editors/integrator/dosPlayer/`](editor/editors/integrator/dosPlayer/README.md): DOS player customization UI and preview.
  - [`editor/editors/map/`](editor/editors/map/README.md): map painting, monsters, viewport and play entry.
  - [`editor/editors/map/check/`](editor/editors/map/check/README.md): level-check UI, heat maps and author play sessions.
  - [`editor/editors/map/generate/`](editor/editors/map/generate/README.md): seeded map-generation dialog and placement.
  - [`editor/editors/map/links/`](editor/editors/map/links/README.md): integrator link markers and detail popover on maps.
  - [`editor/editors/map/tools/`](editor/editors/map/tools/README.md): map selection, terrain, stamps and building tools.
  - [`editor/editors/monsters/`](editor/editors/monsters/README.md): monster values, animation and movement-path UI.
  - [`editor/editors/music/`](editor/editors/music/README.md): CMF tracks, instruments, piano-roll integration and playback.
  - [`editor/editors/music/arrange/`](editor/editors/music/arrange/README.md): seeded accompaniment and melody-copy transforms.
  - [`editor/editors/music/roll/`](editor/editors/music/roll/README.md): layered piano-roll input and cached rendering.
  - [`editor/editors/picture/`](editor/editors/picture/README.md): GIF viewing/import and copying regions into blocks.
  - [`editor/editors/recording/`](editor/editors/recording/README.md): REC demo recording, playback and trimming.
  - [`editor/editors/sample/`](editor/editors/sample/README.md): VOC waveform editing and recording.
  - [`editor/editors/slideShow/`](editor/editors/slideShow/README.md): LST media sequencing on a timeline.
  - [`editor/editors/sounds/`](editor/editors/sounds/README.md): SND speaker and Sound Blaster effect editing.
  - [`editor/editors/textScreen/`](editor/editors/textScreen/README.md): TXT page editing and game-accurate preview.
  - [`editor/keymap/`](editor/keymap/README.md): computed game controls and reusable Keys dialog.
  - [`editor/shell/`](editor/shell/README.md): home, workspace, asset browsing and project actions.
  - [`editor/tools/`](editor/tools/README.md): file-maker registry, import/conversion and generators.
  - [`editor/tools/cards/`](editor/tools/cards/README.md): instruction and level-card dialogs and generated files.
  - [`editor/tools/opening/`](editor/tools/opening/README.md): opening-sting selection, previews and scene wiring.
  - [`editor/widgets/`](editor/widgets/README.md): reusable editor controls, previews and check/play dialogs.
- [`editor/disk/`](editor/disk/README.md): the disk-space tool: merges of monster files, block sets and palettes, and the floppy disks a game needs.
- [`editor/editors/palette/`](editor/editors/palette/README.md): VGA palette editing, role reservations and contrast checks.
- [`saves/`](saves/README.md): the home page's Saves & scores panel: saved games, high scores and
  backups.
- [`backup/`](backup/README.md): Settings › Back up / restore: what this site keeps in a browser in one
  `.gmbackup` file, and bringing it back part by part.
  Subareas:
  - [`backup/sections/`](backup/sections/README.md): validation and merge rules for each kind of backed-up data.
- [`macHelp/`](macHelp/README.md), [`winHelp/`](winHelp/README.md), [`linuxHelp/`](linuxHelp/README.md): the `#/mac`,
  `#/windows` and `#/linux` pages for players: opening a downloaded game the first time, what it
  does, removing it.
- [`cast/`](cast/README.md): the Cast page: the regulars on a stage, and the games each appears in.
- [`credits/`](credits/README.md): the Credits page: software, the original, the games' authors, the
  AI tools and the people.
- [`errorNotice/`](errorNotice/README.md): the notice with Copy error details when something breaks.
- [`artCourses/`](artCourses/README.md): the art courses (`#/art-courses`): drawing blocks, tiles and scenery, with real blocks drawn in code.
- [`programmersGuide/`](programmersGuide/README.md): The Programmer's Guide to Game-Maker 3.0 (`#/programmers-guide`) and the words of the 1994 Technical Reference booklet.
- [`piRemote/`](piRemote/README.md): the Pi remote (`#/pi-remote`, unlisted): a keyboard for the Raspberry
  Pi Zero W running Game-Maker OS, over its USB serial port with Web Serial.
- [`privacy/`](privacy/README.md): the Privacy page: what the site keeps on the device, how to clear it,
  what is sent and when.
- [`achievements/`](achievements/README.md): what the visitor has done: the catalog, the record, the
  page and ACHIEVE.EXE.

- [`tour/`](tour/README.md): the guided tour: characters from the games point at and press the
  page's controls while another explains them, with captions, a Sandbox game's music and a
  recording mode; started from the header's ? button, ⚙ Settings or `#/?tour=all`.
  Subarea:
  - [`tour/chapters/`](tour/chapters/README.md): guided-tour chapter data and shared targets.

### The assistant: AI tools working on a game

- [`assistant/`](assistant/README.md): the tools an AI uses to open, check and change a game, the
  Assistant chat, and the MCP bridge.
  Sub-areas: [`tools/`](assistant/tools/README.md), [`chat/`](assistant/chat/README.md), [`bridge/`](assistant/bridge/README.md), [`shared/`](assistant/shared/README.md).

### The 1994 desk and its PC

- [`desk/`](desk/README.md): the 1994 desk: the room, the PC's case, keyboard and monitor, the
  boxes, disks and props.
  Sub-areas: [`pc/`](desk/pc/README.md), [`room/`](desk/room/README.md), [`props/`](desk/props/README.md), [`diploma/`](desk/diploma/README.md), [`disks/`](desk/disks/README.md), [`mug/`](desk/mug/README.md), [`boxes/`](desk/boxes/README.md).
  Subareas:
  - [`desk/buddy/`](desk/buddy/README.md): Scoot's desk toy, event responses, courier card and preferences.
  - [`desk/boxes/covers/`](desk/boxes/covers/README.md): on-demand painted box-cover artwork.
  - [`desk/boxes/phone/`](desk/boxes/phone/README.md): phone kit mesh data and interactive 3D views.
  - [`desk/props/outside/`](desk/props/outside/README.md): scheduled scenes outside the window.
  - [`desk/room/phone/`](desk/room/phone/README.md): wall-phone calls, keypad, captions and hint menu.
- [`dosPage/`](dosPage/README.md): DOS Game-Maker (`dos.html`, `dosPage.ts`): the PC's page with its one-row
  bar and ⋯ menu (`moreMenu.ts`, with the modem speed, `lineSpeed.ts`), disk menu (`diskMenu.ts`),
  and one-row footer (`footer.ts`) with the on-screen keys (`keypad.ts`) and the status line.
- [`retro/`](retro/README.md): the PC shared by the desk and `dos.html`: DOS, Game-Maker's menus and
  registration, the utilities and the BBSes.
  Sub-areas: [`computer/`](retro/computer/README.md), [`dos/`](retro/dos/README.md), [`gmReg/`](retro/gmReg/README.md), [`hexedit/`](retro/hexedit/README.md), [`view/`](retro/view/README.md), [`text/`](retro/text/README.md), [`hacks/`](retro/hacks/README.md), [`bbs/`](retro/bbs/README.md).
- [`vga/`](vga/README.md): Game-Maker's eight designers, ported from their C source.
  Subareas:
  - [`vga/blocedit/`](vga/blocedit/README.md): Block Designer layers.
  - [`vga/charedit/`](vga/charedit/README.md): Character Maker layers.
  - [`vga/grator/`](vga/grator/README.md): Integrator layers.
  - [`vga/image/`](vga/image/README.md): Graphics Image Reader layout, GIF drawing and block capture screen.
  - [`vga/mapmaker/`](vga/mapmaker/README.md): Map Maker layers.
  - [`vga/monedit/`](vga/monedit/README.md): Monster Maker layers.
  - [`vga/shared/`](vga/shared/README.md): indexed screen, input and common designer controls.
- [`chicken/`](chicken/README.md): the rubber chicken's state (Sir Reginald or Lady Regina, following Tune-Up's story), its words and tiara, and the desk's restore utility.
- [`eggs/`](eggs/README.md): the felt eggs hidden in the Sandbox games, their shadow box and
  EGG.EXE.
- [`tinHearts/`](tinHearts/README.md): the tin heart hunt and its trophy.
- [`specials/`](specials/README.md): the Specials, limited-time games: their calendar, registry, what a browser keeps, the desk's arrivals and SPECIALS.EXE.
- [`scoreTrophies/`](scoreTrophies/README.md): the desk's two score trophies.
- [`fortKnox/`](fortKnox/README.md): money left when a catalog game is won, and Teddy's toy safe with its treat store.

### The Guides, the paper in the boxes and the magazine

- [`library/`](library/README.md): the Library: a card for everything to read or print, the
  print shop's disk labels, CD labels and retail boxes, the site's videos and each game's walkthrough video.
- [`manual/`](manual/README.md): the Owner's Guide, the web Guide, each game's manual and box
  contents, the zine, the Ultimate Owner's Guide and TURBO BUTTON.
  Subareas:
  - [`manual/epub/`](manual/epub/README.md): on-demand EPUB builders, packaging and validation.
  - [`manual/magazine/`](manual/magazine/README.md): TURBO BUTTON issue assembly and reading/rendering.
  - [`manual/magazine/sections/`](manual/magazine/sections/README.md): magazine article/ad section factories.
  - [`manual/magazine/sections/spring93/`](manual/magazine/sections/spring93/README.md): spring 1993 issue-specific sections.
  - [`manual/printables/`](manual/printables/README.md): manuals, printable box extras and Level Maps metadata.
  - [`manual/ultimate/`](manual/ultimate/README.md): ultimate Owner's Guide chapter content and booklet flow.
  - [`manual/zine/`](manual/zine/README.md): NO CARRIER and Tiny Pockets Press paper items.

## Main flows

**Desk or modern UI.** `main.ts` loads `desk/desk.ts`, `editor/shell/home.ts` or `modernUi.ts`
(opening a project; the Guide is its own download) only for the route being shown,
and the editors (`editor/editors/registry.ts` `loadEditor`) one at a time, as files of each kind
are opened, so each interface is its own download. `offline.ts` registers the service worker
(`siteWorker.ts`), which precaches only the app shell and caches games as they are used; a new
deploy waits for the visitor to say "Reload". A hosted game comes as a DOS distribution ZIP
(a split one fetches its own and shared pieces and joins them); `streamHostedGame` starts play once the ZIP has loaded
(`loadHostedGame`). Only a legacy GMPK pack (`<id>.<hash>.gmpak`, all its files gzipped in play order, written by
`web/packages/archives/src/project/gamePack.ts`) or loose-file catalog is read as it arrives, so play starts once the .gam is in. Single files go
through `fetchGameFile` (`project/files.ts`), which shares each request and reads from a pack
already at hand. The build also puts in the catalog what pages would otherwise fetch files to work
out (the quick health check, a box's captions). Lists load `games/catalog.json`
(`loadCatalogList`), and a game's notice, manual and printables come from
`games/details/<id>.json` when it is opened (`withDetails`; every original game's controls and player look, and a Starter's blurb, label and box art, so `catalog.json` keeps only what the home page and dos.html read at load, `pageCatalog` in `scripts/cdGames.ts`; each game's file names and sizes are in `games/catalog-files.json`, fetched when something needs them: `loadGameList` fills them in, `loadLeanGameList` leaves them out, and `withFiles` / `hydrateFiles` fill an entry in place); pictures of listed games are prebuilt
in `games/shots/` (`gfx/levelPicture.ts`; the tiles' title screens, `gfx/titlePicture.ts`).
`main.ts` starts one or the other and switches between them; the desk's PC can also open today's
editors full screen on its monitor (`retro/computer.ts` `openEditor`, through the same editor
registry).

**Formats → engine → player.** A game is a `GameFiles` (`project/files.ts`): loaded from the CD
catalog, IndexedDB, a zip or a folder. A hosted game on the play page loads through
`project/streamGame.ts`: a ZIP starts once it has loaded, and a legacy pack or loose-file game starts once its `.gam` is in,
with the engine asking for each file just before reading it (the engine package's `src/engine/machine.ts` `need`).
`player/player.ts` mounts a canvas and runs the engine package's `src/engine/game.ts`, which parses the `.gam` and the
files each scene names with its `src/formats/`, and plays them on the `machine.ts` screen, keyboard and timers (an 18.2 Hz game clock, 145.6 Hz
for scrolling and sound) with `audio/` for music and sound.

**Editors, exports and media.** How the editors work is in [`editor/`](editor/README.md), how a
download is made in [`export/`](export/README.md), and how demos, video and recordings fit together
in [`media/`](media/README.md).

## Build-time code

The build's Vite plugins and the scripts run by hand are in [`../scripts`](../scripts/README.md).
