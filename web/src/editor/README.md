# `editor/`: today's web interface

Part of the [source map](../README.md).

- `core/`: what everything in the editor uses: DOM helpers and downloads (`ui.ts`), the open
  project (`project.ts`) and a finished game kept read-only (`readOnly.ts`), Undo and Redo
  (`history.ts` snapshots; `fileUndo.ts` for editors that rewrite whole files), drawing indexed
  graphics (`draw.ts`), the CD library (`library.ts`), "what uses this?" (`uses.ts`), plain error
  messages (`plainError.ts`), and `fitPane.ts`, which keeps an editor's columns inside the window
  (each scrolls by itself, the pane never does).
- `shell/`: the pages.
  - Home: `home.ts` with `homeShowcase.ts` (the selected game at the top), `homeCategories.ts`
    (the tabs in order, the first one opened, and the random game featured when one is chosen), `homeCards.ts`,
    `homeBlurb.ts`, `homeAuthors.ts` and `homePack.ts` (the tabs' collections), `homeLibrary.ts`
    (each collection's games, no DOM) and `homeLibraryCards.ts` (its tiles and headings), packed by
    `homeTilePack.ts`, walked with the arrow keys by `homeTileKeys.ts`; the import tile and drops
    (`homeDrop.ts`), Getting started (`homeGettingStarted.ts`), `homeIcons.ts`,
    `homeTime.ts`, `homeCopies.ts` and `homeOrigin.ts` (copies of a finished game),
    `homeProjectActions.ts`, `homeImport.ts` (new game and importing, loaded when first used; an import holding several games
    lists them to tick, with progress and Cancel while looking and importing: `importChooser.ts`,
    each row with a small title screen drawn as it scrolls into view: `importThumbs.ts`; removing all
    the imported games, or one import's, which `importBatch.ts` remembers: `importRemove.ts`) and
    `projectExport.ts`; the health badge (`gameHealth.ts`). Imported games' ratings on the home
    page (`homeRatings.ts`: a tile's stars, the Show picker, grouping by rating, and the stars and
    note in the panel at the top); "Remove all imported…" can take only some ratings.
  - The workspace (`workspace.ts`: file list + editor), with Play Game and the Play Level split
    button at its top (`playButtons.ts`; its menu of every way the game's links bring the player
    into a level, the pick it plays and the copy of the game that starts there in `playLevel.ts`,
    the last pick per game in `playPickStore.ts`), the open file's actions
    (`fileActions.ts`), "Used by" (`usedBy.ts`), the save note (`saveNote.ts`), the quick switcher
    (`quickOpen.ts`), folding hints (`hintFold.ts`) and the Download chooser (`download.ts`).
  - New games (`starter.ts`, with the "First steps" checklist, `firstSteps.ts` and
    `firstStepsPanel.ts`), new-file templates (`templates.ts`; + New music's empty song is
    `audio/compose.ts` `blankSong`), Look inside (`released.ts`,
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
  `monsters/` (the path editor `monsterPathEditor.ts`, its state in `monsterPathState.ts`, the
  pointer and keys in `monsterPathInput.ts`, a corner's picture and speed in `monsterPathCorner.ts`,
  the tabs and toolbar in `monsterPathToolbar.ts`, the notice and corners in `monsterPathSide.ts`),
  `map/` (its newer tools in `map/tools/`, its Level check panel in `map/check/`, the
  integrator's links as markers to drag, nudge and open in `map/links/`: `markerMath.ts` with no
  DOM, `linkMarkers.ts` on the map and `linkPopover.ts` for one link's details and pictures),
  `integrator/` (its links read as places on the maps, ways in and exits, in `linkSpots.ts`, and
  changed from a map with GRATOR's rules in `linkEdits.ts`; its toolbar's DOS player dialog in `integrator/dosPlayer/`: `playerPanel.ts`, a
  tab per screen (`screenTabs.ts` groups the patches, `screenFields.ts` lays out a tab,
  `playerFields.ts` makes each field) and a Files tab for the DOS download's extensions (`fileFields.ts`), `playerPreview.ts`, which draws XFERPLAY's screens with the
  engine's own `draw*` functions, and dragging words and frames on that preview: `dragItems.ts`
  (what moves and the clamped math, no DOM) and `dragStage.ts` (pointer, Move list, arrow keys)), `sounds/`, `sample/`, `music/` (the piano roll in `music/roll/`, accompaniment in
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
    and the pictures under them from `../textScreens.ts`); `colorZero.ts` level palettes (and, under a first level card that is a bare text
    page, the menu picture) whose color 0 isn't black, the background of the name prompt and the
    F-key screens; `heroStart.ts` starting values PLAYGAME
    ignores and a blank Idle; `shotPrize.ts` shots that destroy prize monsters; `keyHabits.ts` a
    fire key that roots the hero, ammunition for each key and keys whose job changes between
    levels; `screenText.ts` long help or story and placeholder pages; `dosChars.ts` in-game words
    with characters 128-255, which DOS's player draws as scribbles; `levelExits.ts` doors that
    lead nowhere, a level with no link out and levels with no music (or a song DOS won't play);
    `flashing.ts` blocks that flash faster than three times a second; `stakes.ts` many lives and
    an unarmed start among enemies; `playerChecks.ts` a tap that moves twice, scenery that looks like
    a prize and keys never taught at the start; `fliCheck.ts` animations DOS can't play, from
    `formats/fliLimits.ts`, which the health check also uses; `solidPush.ts` the wall glitch's causes:
    solid monsters on the map's edge rows, paths that stop right against a block, solid pacers that
    close in, and monsters that are solid and hurt; `linkChecks.ts` links that misfire, as
    PLAYGAME's chklnk reads them: two on one cell, a scene that starts on its own link, a link left
    at (0, 0), links and landings in walls, links off the map, and no chain of links to the won
    scene; `missingParts.ts` .VOC files and level files that aren't there, block numbers and
    counters past their sets and monsters from empty slots) and the play checks
    (`playChecks.ts`, `landings.ts`; `wayBack.ts`: one-way spots, things left behind by a
    whole-game run carrying the least it can, and Slower hands, a second run with one key at a
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
  - A course through the wrap: `course.ts` finds, from the walkthrough's ride, a map ridden lap
    after lap corner to corner through the wrapping edges without coming back to a block (Virus
    Blaster's ribbon cable), for the Level Maps to print as one strip.
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

## How the editors work

Each `editor/editors/<kind>/<kind>.ts` calls `registerEditor([...kinds], fn)`
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
- **Copying tracks between songs.** The music editor's ⧉ on a track, Paste track and Add a track
  from another song…: `editors/music/trackClip.ts` (pure) copies a track's notes, instruments
  (SBI bytes), program changes and channel events and adds them to a song on its next free
  channel, rescaled to the same beats, a drum kept on its drum channel (turning the drum kit on
  when tracks 7-9 are empty); `trackClipboard.ts` keeps the copy in localStorage (and a JSON copy
  on the system clipboard); `trackPaste.ts` pastes as one undo step with a toast;
  `trackPickDialog.ts` picks a track from the game's other songs.
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
  four are made once by `games/kit/madewith.ts` and `madewithMore.ts` into `web/public/opening/`, the
  classic one is the CD's file as it is, and each is fetched only when previewed or chosen;
  `openingCards.ts` draws the presents card with the Scene maker's renderer, and `openingWire.ts`
  puts them first in the title `.LST` as the game's own files (what was added is kept in the
  companion, so it comes out again exactly, or is swapped for another). The Sandbox, CD and
  imported games never get one.
- **Color vision.** The palette editor's Color vision tab (`editors/palette/visionPanel.ts`) shows
  a level as seen in grayscale and with color-vision differences (`colorVision.ts`) and lists
  colors that look alike there (`visionWarnings.ts`); `visionDismissed.ts` keeps the ones a
  designer dismissed as meant to look alike, in the companion file on the `.pal`.
- **Color 0.** The palette editor's note by color 0 opens `editors/palette/colorZeroDialog.ts`:
  each player screen drawn on color 0 (`colorZeroScreens.ts`: the high-score name prompt and
  table, F1, F2, F5, F10), drawn with the engine's own functions in the palette and the
  project's DOS player patches, with the palette entry each word color matched.
