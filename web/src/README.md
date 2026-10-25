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
- [`theme.ts`](theme.ts): light or dark for today's web. [`edition.ts`](edition.ts): the fork's
  name, in one place. [`pageToc.ts`](pageToc.ts): "On this page" beside a reading page (the Mac,
  Windows and Linux pages, the cast).
- [`offline.ts`](offline.ts) registers [`siteWorker.ts`](siteWorker.ts), the site's service worker.
  [`prefetch.ts`](prefetch.ts) fetches what a visitor is likely to open next once the page settles.
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

### Game files, engine and player

- [`formats/`](formats): readers and writers for every Game-Maker file
  (`.gam .pal .bbl/.mbl/.cbl .chr .mon .map .snd .his .rec .bkd .lst .txt`) and the standard ones
  it uses (`.gif .fli .cmf .voc`, and `.jpg` for the BBS's pictures). Borland C++ 16-bit layout:
  `int` is 2 bytes, structs are byte-packed (`binary.ts`).
  - `cmfSong.ts`, `cmfEdit.ts` and `cmfPreview.ts` are the music editor's model of a CMF song;
    `fliFrames.ts` an `.FLI` as whole frames for editing; `fliLimits.ts` what DOS can play.
  - `gifProgressive.ts` and `jpeg.ts` decode a picture as its bytes arrive (the BBS's downloads).
- [`engine/`](engine): the game engine, a TypeScript port of `PLAYGAME.C`: `game.ts` (`DoGame`),
  `scene.ts` (`playscene`), `character.ts`, `monsters.ts`, `scroll.ts`, `world.ts`, `touch.ts`,
  `render.ts`, menus (`menus.ts`), function keys (`funcKeys.ts`), the key stack (`keys.ts`),
  recordings (`recorder.ts`), the between-scene screens (`showGraphic.ts`) and the "machine"
  (`machine.ts`: screen, keyboard, timers). `slowPc.ts` is the slow PC behind the desk's TURBO
  button.
- [`audio/`](audio): `opl.ts` (OPL2 FM emulation), `cmfPlayer.ts` (port of `PlayIt` and the SBFMDRV
  calls; `cmfLoad.ts` reads a song's header as its `load_file` did, CMF 1.0 included, and refuses
  what it refused), the AudioWorklet (`music.worklet.ts`), Web Audio output (`engine.ts`, the page's one
  `context.ts`, one volume for everything in `output.ts`), PC speaker sound sets (`vocToSpeaker.ts`
  drafts one from a `.voc`'s pitch) and sample editing (`sampleEdit.ts`).
  - Music: `compose.ts` writes `.CMF` songs from notes as text (shared with `games/kit`); the
    instrument presets are `oplPresets.ts` and `oplDrumPresets.ts` (written with `oplPatch.ts`,
    shown off by `oplPresetPreview.ts`).
  - Sound effects: `sfxSynth.ts` and `sfxPresets.ts` (the sound effect maker); `soundProfile.ts`
    sorts digital sounds into kinds by listening to them.
  - `voices.ts`: the people on the other end of the desk's phone line, in the browser's speech.
- [`gfx/`](gfx): the mode 13h screen (`screen.ts`) and 8×8 fonts (`font8x8.ts`; all of CP437 in
  `cp437Glyphs.ts`), and pictures drawn from a game's own maps: `levelPicture.ts`,
  `titlePicture.ts`, `gameShots.ts` and `sandboxShots.ts` (the Game-Maker box's and guide's).
- [`input/`](input): keyboard scan codes (`scancodes.ts`, `keyboard.ts`), arrow chords and Mac
  keys for keyboards without a keypad (`chords.ts`, `macKeys.ts`), keys pressed with the mouse or
  a finger (`virtualKeys.ts`), the gamepad (`gamepad.ts`), and the desk's game pad and ball mouse
  as the PC's joystick and mouse (`deskJoystick.ts`, `deskMouse.ts`).
- [`player/`](player): the embeddable player (`player.ts`): canvas, start overlay, whole-pixel
  scaling (`exactScale.ts`), touch controls (`touch.ts`), on-screen keys (`screenKeys.ts`) and a
  pointer that hides itself (`cursorHide.ts`). Used by `play.ts`, the editor's play test, the desk
  and exports.
- [`media/`](media): demo playback (`.REC`, `demo.ts`), previews (`demoPreview.ts`, which demo
  `demoKind.ts`), demos added for CD games (`extraDemos.ts`, `addedDemo.ts`), the attract mode
  (`attractDemo.ts`), the demos' sound choice (`demoAudio.ts`) and which player may play
  (`mediaFocus.ts`); saving the screen as video (MP4: `video.ts`, `frames.ts`, `mp4Mux.ts`),
  animated GIF (`gifEncode.ts`) or WAV (`wav.ts`). See Media below.
- [`walkthrough/`](walkthrough): a Sandbox game's walkthrough (`format.ts`): played on the real
  engine, deterministically (`runtime.ts`), in a player with chapters and a seek bar (`player.ts`;
  a jump replays the game unseen up to that frame), with made-up callers filling the empty Top Ten
  at the end (`madeUpScores.ts`), and rendered to an MP4 with its soundtrack (`exportVideo.ts`,
  `audioRender.ts`, `mp4av.ts`). `button.ts` loads it all only when Walkthrough is pressed.

### A game's files and publishing it

- [`project/`](project): a game's files (`files.ts`: `GameFiles`, 8.3 names, the CD catalog),
  streaming a hosted game (`streamGame.ts`, from its pack, `gamePack.ts`), IndexedDB storage
  (`storage.ts`), zip (`zip.ts`), the health check (`health.ts`), importing an exported page
  (`importPage.ts`), and the editor-only companion file (`companion.ts`, never exported).
  - The secret games (`secretGames.ts`; `catalogWatch.ts` keeps the listings live when one is
    revealed or hidden).
  - The Bard of Bizarre's collections (`bizarre.ts`), a game's title as boxes print it
    (`gameTitle.ts`), its DOS folder name (`dosDir.ts`) and what a 1990s buyer asked first:
    floppies, hard disk and download time (`diskFacts.ts`).
  - `saveData/` reads and writes a game's saves, high scores and save backups, shared by the web's
    Saves & scores and the desk's SAVEHACK and BACKUP.
- [`export/`](export): publishing a game: as an offline web app (`exportWebApp.ts`), a single web
  page (`exportSinglePage.ts`, `singlePage.ts`, played by `standalonePlayer.ts`), the web player
  (`exportWebPlayer.ts`), or a DOS folder with PLAYGAME (`exportDos.ts`); plus the service worker
  (`serviceWorker.ts`). See Exports below.
  - The native downloads wrap the single page in the prebuilt players: `macApp.ts` (with
    `macSign.ts`, `macIcon.ts`, and `iso9660.ts`, `dsStore.ts` and `udif.ts` for the `.dmg`),
    `winApp.ts` (`peResources.ts`, `winIcon.ts`) and `linuxApp.ts` (`tar.ts`).
  - What a download carries about itself: `notices.ts` (`THIRD-PARTY-NOTICES.txt`),
    `recordedAudio.ts` (a Bard of Bizarre game's non-commercial voice clips), `fiction.ts` (the note
    that this project's games were made in 2026), `pageSeo.ts` (an exported page's search and share
    tags) and `gameAbout.ts` (a few lines of the game's own story, for descriptions).
- [`hostedPlayer/`](hostedPlayer): the web player
  ([`docs/web-player.md`](../../docs/web-player.md)), built into one file (`web-player.html`, and
  `player/` with a `games.json` of the site's games): `main.ts` starts it, `list.ts` reads
  `games.json` and `?game=`, `load.ts` fetches a game's files from its folder (the `.gam` names
  them, as in `linkIn/fetchGame.ts`), `saves.ts` keeps what games write in IndexedDB, `bundle.ts`
  exports and imports saves as a zip, and `page.ts` draws the list, the how-to and the saves.
- [`linkIn/`](linkIn): opening a game sent by another site ([`docs/embed.md`](../../docs/embed.md)),
  from start to finish in `start.ts`: `?open=<url>` fetches it (`fetchGame.ts`), `?receive` takes it
  from the opener with postMessage (`receive.ts`); `protocol.ts` checks the addresses, messages and
  limits, `unpack.ts` reads the files (zip, pack, exported page) without trusting them, `dialogs.ts`
  asks the visitor first, `keep.ts` keeps it as a new Imported game, and `notice.ts` is the "not a
  real DOS PC" note for the desk and `dos.html`.
- [`offline/`](offline): "Make available offline": the whole site in the service worker's cache at
  once (`offlineCopy.ts`), from the web's Offline dialog (`offlineDialog.ts`) or `OFFLINE.EXE` on
  the desk (`offlineExe.ts`).
- [`seo/`](seo): page titles, descriptions and JSON-LD for the site and its game pages: `site.ts`
  (shared with the build), `route.ts` (keeps the tags in step at run time) and `siteSections.ts` (the home page's WebSite and
  magazine data and its links to the `#/…` pages, which `seoBuild.ts` writes in).

### Today's web interface

- [`editor/`](editor): today's web interface (see the next section).
- [`saves/`](saves): the home page's "Saves & scores" panel (`savesPanel.ts`, loaded by
  `button.ts`): a game's saved games (with a map of the saved level, `saveMapView.ts`) and high
  scores, with ⓘ notes (`tip.ts`).
- [`macHelp/`](macHelp), [`winHelp/`](winHelp), [`linuxHelp/`](linuxHelp): the `#/mac`,
  `#/windows` and `#/linux` pages for players: opening a downloaded game the first time, what it
  does, removing it.
- [`cast/`](cast): the Cast page (`#/cast`, `castPage.ts`, its people and things in
  `castData.ts`): the regulars of the new games on a stage (`castStage.ts`), walking with their own
  sprites (`castSprite.ts`, from `../public/cast/sprites.json`) to the Teddy games' theme
  (`castSound.ts`), and the games each appears in (`castThumbs.ts`; `cameos.json` for new cameos,
  `hidden.json` for the Easter eggs and tin hearts, written by `scripts/castHidden.ts`).
- [`credits/`](credits): the Credits page (`#/credits`, `creditsPage.ts`, one `*Section.ts` per
  part, sharing `section.ts`), all arriving at once at modem speed (`modemSheet.ts`). Tests check
  each against the lockfile, `code/` and the games' credits.
  - Software: the npm packages (`deps.json`, written from the lockfile by `scripts/credits.ts`
    with `lockDeps.ts`; `depNotes.ts` says what each does) and the third-party pieces
    (`thirdParty.ts`, `piecesSection.ts`).
  - The original: who the source credits for each part of RSD Game-Maker (`rsdParts.ts`) and every
    RSD intro screen (`rsdIntros.ts`), in `originalSection.ts`.
  - The games' authors (`authorsSection.ts`), the AI tools and the people (`peopleSection.ts`), The
    Bard of Bizarre's table of who made what (`bardCredits.ts`, `bardTable.ts`), where to find more
    Game-Maker games (`moreGames.ts`, shared with the Guide), and the BBSes' pictures
    (`bbsPictureCredits.ts`, `bbsPicturesSection.ts`).
- [`achievements/`](achievements): what the visitor has done: the catalog (`catalog.ts`), the
  record (`store.ts`, in the save store), the calls the rest of the site makes (`index.ts`, with
  `editKinds.ts`), what each page starts (`start.ts`), totals counted from the games catalog
  (`goals.ts`), the unlock note (`toast.ts`), the `#/achievements` page (`page.ts`) and the desk's
  `ACHIEVE.EXE` (`achieveExe.ts`).

### The 1994 desk and its PC

- [`desk/`](desk): the 1994 desk. `desk.ts` lays out the scene (`stage.ts` scales it to the
  window); `overlayFocus.ts` moves the keyboard into an overlay and back.
  - `pc/`: the case (`caseParts.ts`), the CRT (`crtWarp.ts`; `screenGlow.ts` lights the bezel with
    the colors of the picture on the tube), the keyboard (`keyboard.ts`) and the keyboard tray
    (`tray.ts`) with its mouse pad (its print, `padPrints.ts`, chosen in `padChooser.ts` from the
    magazine's mouse pad ad and remembered by `padChoice.ts`), the GRAVITAS game pad
    (`gamePad.ts`; its drawing `gamePadArt.ts`, its SVG parts `gamePadSvg.ts`, its large controls
    `gamePadPanel.ts`, what is held `gamePadHolds.ts`), the modem (`modem.ts`; click its speed to
    pick the line speed), the speakers (`speakers.ts`) with the SOUND BOASTER switch
    (`blasterSwitch.ts`), the key card taped to the monitor (`keyCard.ts`, `keyCardRows.ts`) and
    the capture card (`capture.ts`, loaded by `captureStub.ts` on the first press).
  - `boxes/`: the retail boxes and their shelf (`shelf.ts`, `shelfLayout.ts`), turned in the box
    viewer (`boxViewer.ts`). A game's box (`gameBox.ts`) is drawn from the game itself
    (`boxFacts.ts`, its play hours from its walkthrough in `playtime.ts`) with `boxPaint.ts`,
    `boxSeals.ts`, shelf wear (`boxWear.ts`), a glow under the black light (`boxUv.ts`) and a
    painted cover (`covers/<id>.ts`, with the brushes in `covers/paint.ts`); what came in it is
    `gameBoxContents.ts`, `boxList.ts` and `printContext.ts`. `gmBox.ts` is the Game-Maker box.
  - `disks/`: the disk box (`diskBox.ts`) and the disks' labels (`diskLabel.ts`, RSD's own in
    `rsdLabel.ts`).
  - `mug/`: the BBS mug (`mug.ts`, drawn in 3D by `mug3d.ts`, turned in `mugViewer.ts`). Its
    pictures (`mugArt.ts`) are badges: each Sandbox game's cut from its title screen
    (`gameBadge.ts`, `gameMugArt.ts`), the BBS's from its ANSI art (`bbsBadge.ts`). "Make your
    own" prints a sublimation page (`mugPrint.ts`, `mugSheet.ts`, `mugLayout.ts`, `mugSizes.ts`,
    remembered by `mugPageStore.ts`).
  - `room/`: the window (`snowWindow.ts`, as light as it is outside by `daylight.ts`), the poster
    (`wallPoster.ts`, under black light `posterUv.ts` and `motenUv.ts`), the clipping
    (`newsClipping.ts`), the clock (`wallClock.ts`; its glow-in-the-dark paint charges and fades in
    `lumeCharge.ts`), the door (`roomDoor.ts`), the waste basket (`wasteBasket.ts`), the wall phone
    (`room/phone/`: `phone.ts`, who answers in `calls.ts`, `dialPad.ts`, `sounds.ts`) and its notes
    (`phoneNotes.ts`), the shareware catalog (`catalog.ts`) and the magazine lying on the desk
    (`paperStack.ts`), and the mug, phone and lamp (`deskProps.ts`).
  - `props/`: makes the room's little things pressable (`index.ts`, `propKit.ts`, their sounds in
    `propSound.ts`): the clock, waste basket, door, window (`window.ts`, tonight's real moon in
    `moonPhase.ts`) and what goes by outside (`props/outside/`: `outside.ts` and one module each,
    such as THE CHEZ, the dogs, the plow and the mail jeep; `visible.ts` says whether the window can
    be seen), RSD's registration reply under the bedroom door (`mailDrop.ts`; its paper is
    `manual/printables/regConfirm.ts`, remembered in `retro/gmReg/replyMail.ts`), curtains, speaker,
    DEGAUSS, the black-light poster (`blacklight.ts`) and the felt eggs' glow under it
    (`eggGlow.ts`), the toy whistle with the zine under it (`props/zine/`, the zine itself in `manual/zine/`), and the room after dark with its
    overhead light (`roomLight.ts`). `chezArt.ts` draws THE CHEZ from `games/kit/chez.ts`'s side
    view.
- [`dosPage/`](dosPage): DOS Game-Maker (`dos.html`, `dosPage.ts`): the PC's page with its one-row
  bar and ⋯ menu (`moreMenu.ts`, with the modem speed, `lineSpeed.ts`), disk menu (`diskMenu.ts`),
  and one-row footer (`footer.ts`) with the on-screen keys (`keypad.ts`) and the status line.
- [`retro/`](retro): the PC, shared by the desk and `dos.html`, importing nothing from `desk/`. The
  page around it supplies `computer/setup.ts` `ComputerOptions`; `computer/monitor.css` styles its
  picture; `host.ts` is what programs on it can use.
  - `computer.ts`: power and programs, with `computer/` (`drives.ts`, game folders in
    `folders.ts`, its sound line `pcAudio.ts`, the Sound Blaster card `soundBlaster.ts`).
    `leaveProgram.ts` and `saveFirst.ts` get it back to the DOS prompt for a disk.
  - `dos/`: COMMAND.COM (`shell.ts`), the file system (`vfs.ts`, `hardDisk.ts`, what C: gained in
    `cDriveStore.ts`), the floppies (`disks.ts`), the room's one clock (`deskClock.ts`), the
    designers' file handling (`workArea.ts`) and file picker (`picker.ts`).
  - `text/`: 80×25 text mode (`textScreen.ts`, `textInput.ts`, `cp437.ts`) and Game-Maker's text UI
    (`textUi.ts`).
  - `gm.ts`: GM.EXE's menus. `gmReg/`: Game-Maker's registration and copy check (`chk.ts`,
    `registration.ts`, `copyCheck.ts`); `regSide.ts` (loaded by `regSideLater.ts`, asked for by
    `regDesk.ts`) puts the Owner's Guide and registration card (`mailCard.ts`) beside the monitor;
    `replyMail.ts` remembers RSD's reply.
  - `hexedit/`: HEXEDIT.EXE (`hexEdit.ts`, `hexFiles.ts`) and its map of each file format
    (`structure.ts`, `structureMedia.ts`). `view/`: VPIC.EXE (`vpic.ts`) and the VGA/SVGA picture
    screen (`picture.ts`).
  - `hacks/`: the BBS's utilities, SAVEHACK, BACKUP, GMCRACK, the GM30 installer and the rest
    (`saveHack.ts`, `backupExe.ts`, `gmcrack.ts`, `cracktro.ts`, `gm30Install.ts`, their words in
    `*Text.ts`, their look in `dosUi.ts`, what they add to C: in `deskFiles.ts` and `pcExtras.ts`):
    debugging tools for registration modes, saved games and backups, dressed as 1990s scene
    programs.
- [`retro/bbs/`](retro/bbs): the terminal (`term.ts`) and the BBSes.
  - The boards: THE -= S A N D B O X =- BBS (`bbs.ts`, its name in `bbsName.ts`, ANSI art in
    `ansiArt.ts`) and The Sofa (`sofa.ts`, its number in `sofaPhone.ts` for the printed pieces; its
    files, pictures and SPAM in `sofaFiles.ts`, `sofaPictures.ts` and `sofaSpam.ts`).
  - Their file areas: listings a screen at a time (`pager.ts`) with FILE_ID.DIZ (`fileId.ts`), the
    GIF Gallery (`gallery.ts`, `gifArea.ts`), the Warez area (`warezArea.ts`), the upload/download
    ratio (`ratio.ts`) and PKUNZIP after a download (`pkunzip.ts`).
  - The line: modem sound (`modem.ts`); `lineSpeed.ts` is the modem's speed, 300 baud to Unlimited,
    `pacedQueue.ts` sends the boards' text and `transfer.ts` their files at it, and
    `lineSpeedControls.ts` picks it on the desk's modem and in `dos.html`'s ⋯ menu; `pickup.ts` is
    someone picking up the kitchen extension.
  - `tdd.ts` calls a TTY from TERMINAL, in Baudot (`baudot.ts`), to Mrs. Novak's script
    (`ttyTalk.ts`), with `ttyInfo.ts` on TTYs in 1994.
  - The Sandbox BBS's door game, TIC-TAC-TOE BY MODEM, is `ticTacToe.ts` (rules, the other caller,
    the saved game) and `ticTacToeDoor.ts` (its screen); its R)egister menu, `rsdLine.ts`, is RSD's
    registration line: a name and serial number get TELLREG's registration number.
- [`vga/`](vga): Game-Maker's eight designers ported from their C source (PALCHOS, BLOCEDIT,
  MONEDIT, MAPMAKER, CHAREDIT, IMAGE, SNDEDIT, GRATOR). One file per `.EXE` at the top (each exports
  `program`; `retro/gm.ts` finds them with `import.meta.glob`); a large designer's parts are in a
  folder of the same name (`layout.ts` its tables, `state.ts` its globals, then layers such as
  `screen.ts` and `paint.ts`), and `shared/` has the VGA screen (`vga.ts`), block routines
  (`blocc.ts`), the title and Design bars (`designer.ts`) and Game-Maker's look (`facelift.ts`).
- [`eggs/`](eggs): the felt eggs hidden in the Sandbox games (`eggs.ts`): which are found
  (`eggState.ts`, from saved games), the shadow box on the desk (`eggDisplay.ts`), its viewer
  (`eggViewer.ts`), and `EGG.EXE` (`eggExe.ts`).
  - `eggUv.ts` is what black light brings out on them (the shelf's `desk/props/eggGlow.ts` and the
    viewer agree on it), laid out on `eggTexture.ts`'s covering size so the desk needn't load the
    egg art (`eggArt.ts`).
  - `teddyEgg.ts` is Teddy's special egg, a bonus (never one of the felt eggs) that joins the
    shadow box once all three Teddy adventures' eggs are found; `eggPile.ts` draws it, a little
    pile of felt sausages with a whiff rising, not an egg shape.
  - `bonus.ts` holds two more eggs kept apart from the felt eggs, loaded only once the felt eggs are
    all found (drawn by `bonusArt.ts`, looked at in `bonusViewer.ts`); `musicBox.ts` is a little
    synthesized music box.
- [`tinHearts/`](tinHearts): the tin heart hunt: which games hide one and where (`hearts.json`,
  `manifest.ts`), which are found (`tinHearts.ts`, as a line of text in `progress.ts`), EGG.EXE's
  tin heart page (`tinHeartExe.ts`), and the desk's trophy (`trophySpot.ts` loads `trophy.ts` and
  Mystery Robot Joe's scene, `reveal.ts` with `joeArt.ts`, only once every heart is found).

### The Guides, the paper in the boxes and the magazine

- [`library/`](library): the Library (`#/library`, the top bar's Library link): a card for
  everything to read or print, sorted by game or by type (`?by=type`) and narrowed to one game or
  kind (`&only=levelmap`) and, within a kind, one game (`&game=teddy`), all remembered per
  browser (`prefs.ts`). Level Maps cards show the first level's picture (`levelMaps` `preview`); each box's Sandbox
  Scoop shows its issue number and date and sorts by it; each game's walkthrough is a card
  (`walkShelf.ts`) with its length as HH:MM:SS over its title screen, shortest first by type,
  played in the walkthrough player.
  `shelf.ts` is the list as data (the kinds of paper, from manuals, hint books and maps to
  keyboard reference, registration, business and ID, and license and warranty cards and hint
  book postcards; the games, never a secret one, and the two
  sorts), `siteShelf.ts` the site's own reading (TURBO BUTTON, the Guides, the desk's zine once
  found), `listing.ts` builds it from the catalog and the boxes' pieces, `thumbs.ts` draws each
  card's first sheet while it is near the window, one at a time and giving the browser back between
  them (`covers.ts` draws just the cover of manuals, hint books and TURBO BUTTON), `shared.ts` lists once the pieces the same in
  every box (the catalog and the BBS ad) with how many boxes they are in, and `libraryPage.ts` is
  the page; a card opens its piece in the box viewer (`openBox`'s `start`), the magazine, the Guide or the zine.

- [`manual/`](manual): the Owner's Guide for the desk (`dosManual.ts`, its pages `booklet.ts`, its
  screens `figures.ts`, its registration record `regRecord.ts`), the web Guide (`webManual.ts`), and
  each original game's printed manual (`gameManual.ts`). `fonts/` holds the handwriting font
  (Caveat, with its OFL).
- [`manual/printables/`](manual/printables): each game's box contents, with its own
  [README](manual/printables/README.md). The viewer (`viewer.ts`) shows the paper in a "What's in
  the box" tray (`items.ts`); `gen.ts` makes what every Sandbox Software box has; `kit.ts`,
  `fitSheet.ts`, `paginate.ts`, `imposition.ts` and `crisp.ts` lay paper out.
  - Manuals: `manualPages.ts` and `manualCover.ts`; the hint book's cover (`hintCover.ts`,
    `hintCoverArt.ts`) and answers hidden under red film (`redFilm.ts`); the key card (`keys.ts`);
    the story (`story.ts`).
  - The fold-out World Map (`worldMap.ts`, with `worldMapLayout.ts`, `worldMapTerrain.ts`,
    `worldMapArt.ts` and `worldMapGroups.ts`, which folds conversation scenes into their place) and
    the Level Maps (`levelMaps.ts`, `levelMapLayout.ts`), which never show a tin heart or egg
    (`levelSecrets.ts`, from `levelSecrets.json` written by `scripts/levelSecrets.ts`) and crop to
    what the player sees (`levelViews.ts`, from `levelViews.json` written by
    `scripts/levelViews.ts`; a map the hero walks off the edge of is laid out as the player goes
    through it, `editor/check/unroll.ts`, and goes round forever only if the hero got round),
    both looked round with `panZoom.ts`. A map of separate rooms prints each room apart
    (`levelRooms.ts`; `levelRoomHints.ts` names rooms, draws copies once and adds a cast panel),
    and a map nobody walks around in is left out. `levelPoster.ts`
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
- [`manual/zine/`](manual/zine): NO CARRIER #3, the hacker zine under the desk's toy whistle:
  its pages (`zinePages.ts`), each on a quarter-letter leaf with its type fitted (`zineLeaf.ts`),
  and its piece in the box viewer (`zineItem.ts`: one leaf at a time on screen, four to a letter
  sheet in print), opened by the whistle and the Library.
- [`manual/ultimate/`](manual/ultimate): The Ultimate Owner's Guide in the Game-Maker box.
  - `ultimateItem.ts` is its piece in the box and cover (small, so the box loads without the
    chapters), `ultimateGuide.ts` its pages, `plan.ts` its running order and page sums, `chapter.ts`
    one chapter's flow.
  - `chapters*.ts` are its chapters: palettes and blocks (`chaptersLook.ts`), monsters, logic and
    scenes (`chaptersPlay.ts`), sound (`chaptersSound.ts`), title screens, demos and play-testing
    (`chaptersShow.ts`), designing with a goal (`chaptersCraft.ts`), 12 level design
    (`chaptersLevels.ts`), 13 tricks from the Sandbox games (`chaptersTricks.ts`), 14 the Level
    check and walkthrough bot (`chaptersCheck.ts`), 15 and 16 designing for every player and where
    Game-Maker runs out (`chaptersPlayers.ts`), and 17 tricks from the shareware authors
    (`chaptersShareware.ts`).
  - Figures are drawn from real files (`ultimateFigures.ts`, `paletteFigures.ts`).
    `openUltimate.ts` and `openInManual.ts` open it from outside the desk.
- [`manual/magazine/`](manual/magazine): TURBO BUTTON, a mid-90s game magazine (`#/magazine`, and
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
    readers' level troubles), `gripes.ts` (what players hate, and how to fix it), the character spotlight,
    the game directory, the BBS listings, the store, the reader service card and the ads.
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
      put together, which `../scripts/gameMakerArchive.ts` fetches again; `sections/masters.ts`
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
    - `deskShot.ts`, its snapshot of the 1994 desk, `../public/magazine/desk-1994.webp`, with how to
      take it again; `webShots.ts`, its screenshots of today's web, `../public/magazine/web-*.webp`,
      likewise; and `dosShot.ts`, Lewis's DOSBox screenshot of Carl's garbled cover,
      `../public/magazine/dos-carl.webp`, for `sections/dosBugs.ts`.
  - `viewer.ts` lays every page out at one size (a letter sheet at 96 CSS pixels to the inch, as
    printed) and scales it whole to fit the window, so no page runs over at any window size, and
    turns, zooms and prints them on letter paper.

### `editor/`: today's web interface

- `core/`: what everything in the editor uses: DOM helpers and downloads (`ui.ts`), the open
  project (`project.ts`) and a finished game kept read-only (`readOnly.ts`), Undo and Redo
  (`history.ts` snapshots; `fileUndo.ts` for editors that rewrite whole files), drawing indexed
  graphics (`draw.ts`), the CD library (`library.ts`), "what uses this?" (`uses.ts`), plain error
  messages (`plainError.ts`), and `fitPane.ts`, which keeps an editor's columns inside the window
  (each scrolls by itself, the pane never does).
- `shell/`: the pages.
  - Home: `home.ts` with `homeShowcase.ts` (the selected game at the top), `homeCards.ts`,
    `homeBlurb.ts`, `homeAuthors.ts` and `homePack.ts` (the tabs' collections), `homeIcons.ts`,
    `homeTime.ts`, `homeCopies.ts` and `homeOrigin.ts` (copies of a finished game),
    `homeProjectActions.ts`, `homeImport.ts` (new game and importing, loaded when first used) and
    `projectExport.ts`; the health badge (`gameHealth.ts`).
  - The workspace (`workspace.ts`: file list + editor), with the open file's actions
    (`fileActions.ts`), "Used by" (`usedBy.ts`), the save note (`saveNote.ts`), the quick switcher
    (`quickOpen.ts`), folding hints (`hintFold.ts`) and the Download chooser (`download.ts`).
  - New games (`starter.ts`, with the "First steps" checklist, `firstSteps.ts` and
    `firstStepsPanel.ts`), new-file templates (`templates.ts`), Look inside (`released.ts`,
    `lookId.ts`), and the shared stylesheet `editor.css`.
- `widgets/`: shared pieces: file picker (`filePicker.ts`), block chooser (`blockChooser.ts`), the
  Show with palette choice (`paletteChooser.ts`), thumbnails (`thumbs.ts`), previews (`preview.ts`),
  waveform (`waveform.ts`), roving grid (`rovingGrid.ts`), big-target color choice
  (`colorChoice.ts`), the ? shortcuts list (`shortcuts.ts`), and the game-accurate graphic previews
  used by the media editors (`mediaPictures.ts`, `mediaShared.ts`).
  - The level check's parts outside the map: badges in the block, monster and sound editors
    (`checkBadges.ts`), the self-ticking Before You Upload list (`uploadChecklist.ts`), Make a
    walkthrough (`walkDialog.ts`), the findings as a report with a CSV and a printable checklist
    (`checkReport.ts`, its rows in `checkRows.ts`), Play and record, the one play session of a scene
    that adds to the author's heat map and keeps their play for the walkthrough (`playScene.ts`),
    watching the bot's route or the author's play of a scene, and making the bot's route again
    (`watchScene.ts`), and links into the Ultimate guide (`guideLink.ts`).
- `editors/`: one folder per file kind, each with its `.ts`, `.css` and helpers (a big editor's
  parts, such as the integrator's board camera and input, sit beside it). `registry.ts` maps a file
  kind to its editor and loads each editor the first time a file of its kind opens (`loadEditor`);
  the editor registers itself as it loads. The kinds: `palette/`, `blocks/`, `character/`,
  `monsters/`, `map/` (its newer tools in `map/tools/`, its Level check panel in `map/check/`),
  `integrator/`, `sounds/`, `sample/`, `music/` (the piano roll in `music/roll/`, accompaniment in
  `music/arrange/`), `picture/`, `animation/` (the Scene maker in `animation/scene/`), `backdrop/`,
  `slideShow/`, `textScreen/`, `recording/` and `highScores/`.
- `tools/`: ways to make files beyond "new": importing pictures (`importPicture.ts`,
  `convert.ts`), composing songs (`songMaker.ts`), recording or synthesizing samples
  (`vocMaker.ts`, `sfxMaker.ts`), speaker effects (`speakerFx.ts`), textures (`textures.ts`), a
  new game's opening (`opening/`) and the integrator's instruction and level cards (`cards/`: the
  words from the game's keys in `cardText.ts`, a plain backdrop in `cardBackdrop.ts`, the files in
  the scene's slot by `cardWire.ts`, and the dialogs in `cardDialog.ts`). `makers.ts` is their registry, offered by the file picker;
  `all.ts` imports them all.
- `check/`: the level check and the walkthrough bot, with no DOM.
  - Playing: `sim.ts` plays a scene on the engine's own calls with small snapshots, `explore.ts`
    tries every move (`inputs.ts`, `drive.ts`) from every resting place for the heat map, `stuck.ts`
    finds places with no way out and `escape.ts` whether the hero can get out of harm;
    `sceneData.ts` parses each level scene once, and `sceneLinks.ts` gives the level scenes and the
    links into a scene (apart from `playtest.ts`, so the editors' badges don't load the explorer and
    engine).
  - `checks/`: the file checks (hazard art, opposites, waits, look-alike footing, density, contrast, sounds, keys…:
    `blockChecks.ts`, `monsterChecks.ts`, `gameChecks.ts`, `keyReach.ts`, `facing.ts`,
    `mazeCheck.ts`, `sealed.ts` (a prize the other plane of two reaches counts as reachable);
    `inView.ts` prizes in view but out of reach; `helpKeys.ts` keys the help names that nothing
    uses; `textContrast.ts` text pages and the menu hard to read against their pictures (the pages
    and the pictures under them from `../textScreens.ts`); `heroStart.ts` starting values PLAYGAME
    ignores and a blank Idle; `shotPrize.ts` shots that destroy prize monsters; `keyHabits.ts` a
    fire key that roots the hero, ammunition for each key and keys whose job changes between
    levels; `screenText.ts` long help or story and placeholder pages; `levelExits.ts` doors that
    lead nowhere, a level with no link out and levels with no music (or a song DOS won't play);
    `flashing.ts` blocks that flash faster than three times a second; `stakes.ts` many lives and
    an unarmed start among enemies; `playerChecks.ts` a tap that moves twice, scenery that looks like
    a prize and keys never taught at the start; `fliCheck.ts` animations DOS can't play, from
    `formats/fliLimits.ts`, which the health check also uses; `solidPush.ts` the wall glitch's causes:
    solid monsters on the map's edge rows, paths that stop right against a block, solid pacers that
    close in, and monsters that are solid and hurt) and the play checks
    (`playChecks.ts`, `landings.ts`; `wayBack.ts`: one-way spots, things left behind by a
    whole-game run carrying the least it can, and Steady hands, a second run with one key at a
    time from `inputs.ts` `steadyMoves`).
  - Findings: `report.ts` gathers them (`findings.ts`: each with why players mind and its section
    of The Ultimate Owner's Guide; a `taste` check measures a design preference, so its warnings
    show as suggestions); `generators/` holds the one-click fixes (`fixes.ts`, `blockArt.ts`,
    `mapFixes.ts`) and the maze maker (`mazeFor.ts`); `accepted.ts` keeps the findings a designer
    marked as meant to be (by a stable key; `sameEverySide.ts` is the facing check's own list).
  - `walk/`: the walkthrough bot. `pace.ts` measures how tight a walkthrough's key changes are;
    `autoWalk.ts` walks, checked on the engine by `verify.ts`; `takes.ts` cuts the author's own play
    of a scene from the player's recorder, `mine.ts` keeps it, and `replayMine.ts` plays it in place
    of the bot's; `botRoutes.ts` keeps the bot's route of one scene with a fingerprint of the scene,
    to tell when the map changed since. `walkPaths.ts` keeps a block set's walking paths and roads
    (companion section `walkPaths` of the .bbl, which a look-only game keeps in memory) and guesses
    them from its terrains (the block editor's Walking path box, `editors/blocks/walkPathPanel.ts`,
    marks them); with them the explorer's `paths` option searches along the roads, and
    `pathRoute.ts` decides whether that route, more on the paths for modestly more time, replaces
    the quickest one.
  - A map as the player goes through it: `unroll.ts` follows the hero over the map's wrapping
    edges in unwrapped blocks (folding a way that goes round forever to one lap), and
    `unrollMap.ts` explores one map from every way in for the map editor's "As players see it"
    picture (`editors/map/mapPoster.ts`, drawn by `manual/printables/levelPoster.ts`).
  - They run in Web Workers (`worker.ts` started by `client.ts`, `walk/walkWorker.ts` by
    `walk/walkClient.ts`, `unrollWorker.ts` by `unrollClient.ts`); `live.ts` turns a running check into the worker's once-a-second posts
    (changed heat cells, deaths, time left). `testGame.ts` and `gitDisk.ts` are for the tests.
  - The map editor's Level check panel is `editors/map/check/` (`checkPanel.ts`, its report and
    play buttons `checkExtras.ts`; `markInfo.ts` puts its marks into words for the map's tooltip
    and legend; `myHeat.ts` and `myHeatControls.ts` keep the author's own heat map and compare it
    with the bot's, and `playSession.ts` is what a Play and record session keeps (heat and a
    take)); the badges, the Before You Upload checklist and Make a walkthrough are in `widgets/`.
- `keymap/`: working out which keys a game uses (`keyMap.ts`, also behind the desk's key card) and
  the ⌨ Keys dialog (`keyMapView.ts`, also shown by the player).

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

**Editors.** Each `editor/editors/<kind>/<kind>.ts` calls `registerEditor([...kinds], fn)`
(`editors/registry.ts`). The workspace (`shell/workspace.ts`) lists the project's files by kind
and renders `editors[kind]` for the one chosen; edits go through `core/project.ts`, which
autosaves to IndexedDB (`shell/saveNote.ts` says so under Download, says why if a save fails, and
makes Ctrl+S save at once). Files are always written in the original binary formats.

- **Look inside.** A finished game opened with Look inside (`shell/released.ts`, at
  `#/p/look:<id>`, see `shell/lookId.ts`) is an in-memory project that `core/readOnly.ts` makes
  read-only: every change through `core/project.ts` is refused before it happens and nothing is
  saved, and the refusal offers Edit a copy's flow (shareware stays look-only, with its notice).
- **Block groups.** The block set editor (`editors/blocks/`) and the character editor share block
  groups (`blockGroups.ts`: a picture drawn across several blocks, kept in the companion file), the
  group shown assembled (`groupView.ts`), and live animation previews at the game's tick rate
  (`animClip.ts` builds them from block chains, monsters and character sequences; `animPlayer.ts`
  plays them).
- **Mirrors.** The character editor makes a sequence's mirror
  (`editors/character/characterMirror.ts`, pure: both blocks of each frame mirrored and each move's
  x negated, on the same blocks turned or on new mirrored blocks; `characterMirrorPanel.ts`, its
  bar) and keeps the links between a sequence and its twin, and a block and its mirror, in the
  companion file.
- **Accompaniment.** The music editor's Accompany… and Copy tune…
  (`editors/music/accompanyDialog.ts`, `copyTuneDialog.ts`) use `editors/music/arrange/`, pure:
  `harmony.ts` hears a tune's key and chords, `styles.ts` holds the band's patterns and preset
  sounds, `accompany.ts` writes bass, chords and drums in rhythm mode around the tune, and
  `copyTune.ts` copies a tune at a new speed and pitch.
- **Bot demos.** The demo recordings editor's Let the bot play…
  (`editors/recording/botDemoDialog.ts`) runs `botDemoWorker.ts` (through `botDemoClient.ts`): the
  walkthrough bot plays to the chosen scene, and `botDemo.ts` plays its walkthrough on the engine
  and writes the keys down at the demo recorder's ticks as a `.REC`.
- **Scene maker.** The animation editor's Scene maker (`editors/animation/scene/`) draws an `.FLI`
  from a scene kept in the companion file: `sceneModel.ts` (backgrounds and tracks of timed items),
  `sceneText.ts` (the 8x8 font, text motions, and the warnings and fit that keep text inside
  320x200), `sceneAssets.ts` (the game's pictures, maps and sprites, sprite colors matched into each
  background's palette), `sceneRender.ts` (frames, fades and the `.FLI`) and `sceneGenerate.ts`
  (Intro, Cast and Story made from the game's files; a monster's name for its Cast card is the one
  the monster editor keeps in the companion, `editors/monsters/monsterNames.ts`); `sceneCtx.ts` is
  what its parts share, `sceneEditor.ts`, `sceneTimeline.ts` and `sceneInspector.ts` are its
  picture, timeline and settings, and `sceneMaker.ts` offers it when a new animation is made.
- **Opening.** A new game's opening (`tools/opening/`): "+ Make a new game" and the start scene's
  🎬 Opening sting… (`openingDialog.ts`) offer the intros in `openingIntros.ts` (four "Made with
  Game-Maker: Sandbox Edition" animations, the first one's still picture, the CD's classic RSD logo
  animation RSDTBOX.FLI, or none) and a "<name> PRESENTS" card (`openingFields.ts`); a ▶ beside each
  plays it on the fields' screen first (`openingPreview.ts`, with the file picker's FLI preview). The
  four are made once by `games/kit/madewith.ts` and `madewithMore.ts` into `public/opening/`, the
  classic one is the CD's file as it is, and each is fetched only when previewed or chosen;
  `openingCards.ts` draws the presents card with the Scene maker's renderer, and `openingWire.ts`
  puts them first in the title `.LST` as the game's own files (what was added is kept in the
  companion, so it comes out again exactly, or is swapped for another). The Sandbox, CD and
  imported games never get one.
- **Color vision.** The palette editor's Color vision tab (`editors/palette/visionPanel.ts`) shows
  a level as seen in grayscale and with color-vision differences (`colorVision.ts`) and lists
  colors that look alike there (`visionWarnings.ts`); `visionDismissed.ts` keeps the ones a
  designer dismissed as meant to look alike, in the companion file on the `.pal`.

**Exports.** A game's one Download button opens the chooser in `editor/shell/download.ts`, which
calls `export/`: `exportWebApp.ts` (the built player listed in `player-files.json`, the game's
files, a manifest and a service worker), `exportSinglePage.ts` (`standalone.html` with the game
embedded, built by `../scripts/singlePageBuild.ts`), `exportWebPlayer.ts` (the web player,
`web-player.html`, with the game's folder and a `games.json`), `exportDos.ts` (the files plus the
CD's `XFERPLAY.EXE`, renamed after the game), and the Mac, Windows and Linux downloads
(`macApp.ts`, `winApp.ts`, `linuxApp.ts`), which put the single page into the players in
`../public/mac`, `win` and `linux`, with `THIRD-PARTY-NOTICES.txt` (`notices.ts`).
`export/downloadable.ts` says which catalog games may be downloaded, for the button and for
`../scripts/macDmg.ts`, `winExe.ts` and `linuxTar.ts`, which run the same code from the command
line.

**Media.** `media/demo.ts` plays a `.REC` demo in the player; `media/demoPreview.ts` plays one
inside a picture on the home page, with the demos' sound choice (`demoAudio.ts`). `walkthrough/`
plays a Sandbox game's `walkthrough.json` and renders it to MP4 (`exportVideo.ts`, `mp4av.ts`).
`media/video.ts` turns canvases into video: frame by frame with WebCodecs and `mp4Mux.ts`, or live
with MediaRecorder (with the game's sound from `audioTap.ts`). `gifEncode.ts` writes animated GIFs
and `wav.ts` sounds. The desk's capture card (`desk/pc/capture.ts`) takes screenshots and
recordings of the PC's screen with `screenCapture.ts` and the live recorder; every download is
saved with `editor/core/ui.ts` `download`.

## Build-time code

[`../scripts`](../scripts) holds the build's Vite plugins and the scripts run by hand (from
`web/`, `npx vite-node scripts/<name>.ts`).

- Vite plugins, imported by `../vite.config.ts` (which also emits the service worker and
  `player-files.json`):
  - `cdGames.ts` serves the CD's games and `../games` (and writes them into the build, with the
    catalogs and gzip copies);
  - `gameShots.ts` draws each listed game's pictures into `games/shots/`;
  - `singlePageBuild.ts` builds `standalone.html`, and `hostedPlayerBuild.ts` the web player
    (`web-player.html`, `player/index.html` and `player/games.json`);
  - `seoBuild.ts` puts tags, JSON-LD and readable text into the pages and writes (and serves in dev)
    `robots.txt`, `sitemap.xml`, `llms.txt`, each game's `play-<id>.html` and its preview picture
    `og/<id>.png` (drawn by `ogImage.ts`), each Guide section's page `help-<id>.html` (its text from
    `manual/guideSections.ts`, which `webManual.ts` shows), and The Sandbox Scoop's RSS feed `scoop.xml`
    (`scoopFeed.ts`: every game's `printables.json` news story, dated from `scoopDates.json`).
- Data files the site reads, written by hand-run scripts (their tests fail until they are rerun):
  - `credits.ts` writes the Credits page's `deps.json`;
  - `scoopDates.ts` the day each Sandbox Scoop story was first committed, `scoopDates.json` (the
    site's build checks out only the latest commit, so it can't ask git);
  - `levelSecrets.ts` (with `levelSecretsScan.ts`) the Level Maps' `levelSecrets.json`;
  - `levelViews.ts` (with `levelViewsScan.ts` and `levelViewsPlay.ts`; slow, so give it the game ids
    that changed) their `levelViews.json`;
  - `castHidden.ts` (with `castHiddenScan.ts`) the cast page's `hidden.json`;
  - `gameMakerArchive.ts` the Shareware Shelf's `gameMakerArchive.json`.
- Pictures made once by hand: `bbsGifs.ts` made the BBS gallery's pictures in `../public/bbs`;
  `castArt.ts` and `castSprites.ts` make the Cast page's pictures in `../public/cast`, from the
  other `cast*.ts` drawings (`castEgg.ts`, `castLeoSide.ts`, `castNeedle.ts`, `castTinHeart.ts`).
- Downloads from the command line: `macDmg.ts`, `winExe.ts` and `linuxTar.ts` run the same code as
  the Download button (see Exports).
- `dosbox.ts` (`npm run dosbox`) lays out `../../dosbox/` (git-ignored) to mount as drive C: in
  DOSBox, with Game-Maker installed and every Sandbox and Bard of Bizarre game's disk beside the
  samples; `npm run dosbox:open` starts DOSBox on it.
