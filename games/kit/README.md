# games/kit

Helpers for building the original games in `games/<id>/` in code. Each game has a
`build.ts` that draws its blocks, lays out its maps, composes its music and writes every
file through the same format code the web app reads (`@lewismoten/gamemaker-sandbox-engine/formats/*`), into
`games/<id>/disk/`. Run one with:

```sh
cd web && npx vite-node ../games/<id>/build.ts
```

Reusable builders, drawing, synthesis, native animation, layout audits and headless helpers
belong to [`web/packages/tools`](../../web/packages/tools/README.md). Its `kit/*` APIs include
`pixels`, `palette`, `palRamps`, `pcText`, `microText`, `blit`, `shading`, `transforms`,
`coverPaint`, `quantize`, `sdftext`, `raytrace`, `png`, `photo`, `levelPicture` (`renderRegion`; `cameraTop` gives the map row the engine's screen starts at when the hero stands), `actors`,
`screenText`, `saveSlots`, `road3d`, `disk`, `menuVersion`, `fadeOut`, `fliClips`,
`recordedDemo`, `synthParts`, `song`, `songFx`, `hopBot`, `align`, `sceneInit`, `routeChecks`,
and `textfit`, alongside the earlier music, sound, simulation and clip APIs.
Import them through the package rather than copying implementations here.

A name with no folder is a file here; `starter/`, `scans/`, `song/` and `cdDemos/` name subfolders.
This folder keeps game artwork and repository policy: `disk.ts` reads `about.json`, honors
`GAME_DISK_OUT` and reports build totals; `photo.ts` locates this repository's scans;
`align.ts` selects a repository disk and prints its audit. The portable work is in the package.
The descriptions below cover the remaining repository tools. Package helpers are named by their import paths.

Nested developer-only diagnostics live under `testdisks/`, with their own build/check
instructions. They are intentionally outside automatic game, Starter, download and
Pocket discovery; never add their output to a top-level game or the public tree.

Making the files:

- `@lewismoten/gamemaker-sandbox-tools/kit/pixels` — an indexed-color canvas for 20x20 blocks and 320x200 screens, seeded randomness, dithering.
- `@lewismoten/gamemaker-sandbox-tools/kit/palette` — named color ramps for a 256-color VGA palette.
- `@lewismoten/gamemaker-sandbox-tools/kit/palRamps` — `Pal`, a built palette with its ramps looked up by name, and `wrap`, which makes one from a
  `PaletteBuilder`.
- `@lewismoten/gamemaker-sandbox-tools/kit/coverPaint` — painting covers and title pictures in true color before they are reduced: tileable value noise
  (`noise2`), `mixc`, `smooth` (smoothstep) and `clamp`.
- `@lewismoten/gamemaker-sandbox-tools/kit/actors` — filling in character and monster files: a sequence's frames and settings (`set`), a monster (`mon`), a
  path `corner`, and pacing back and forth (`pace`).
- `@lewismoten/gamemaker-sandbox-tools/kit/screenText` — a text screen's lines checked to fit PLAYGAME's 30 columns and 16 lines a page (`page`), and a
  cartoon's named `sprite`.
- `@lewismoten/gamemaker-sandbox-tools/kit/blit` — sprites with 255 as the clear color (`CLEAR`): `over` another picture, `recolor`ed through a lookup,
  scaled up (`scaleBlit`) or with a one-pixel `outline`.
- `@lewismoten/gamemaker-sandbox-tools/kit/pcText` — the PC's 8x8 font in a picture at any scale (`text`, `textWidth`), `outlined` with an optional drop
  shadow, or `centered`; its ink is reported to the text bounds audit.
- `@lewismoten/gamemaker-sandbox-tools/kit/shading` — shaded drawing in a palette ramp: an ordered-dithered shade (`shadeAt`), a vertical `gradient`, a lit
  lump (`blob`), a raised box (`bevel`) and `speckle`.
- `@lewismoten/gamemaker-sandbox-tools/kit/music` — FM instruments and note strings → Sound Blaster `.CMF` songs.
- `@lewismoten/gamemaker-sandbox-tools/kit/tune` — writing songs in those note strings: a voice (`v`), joining and repeating bars (`join`, `times`), counting
  beats (`beatsOf`) and `tune`, which writes the song after checking every voice lasts the same number of beats.
- `teddyTheme.ts` — Teddy's Theme, the melody the Teddy games share (and the Cast page plays, from teddy's `title.cmf`).
- `@lewismoten/gamemaker-sandbox-tools/kit/song` — the Bard of Bizarre games' OPL2 arrangement writer: patches, drum grooves, and sections (a chord or two and a
  bar of tune each) laid out as tune, second voice, bass, three comping voices and drums; `songPreview.ts` renders a game's
  songs on the web app's OPL2 and checks them. `song/analyze.py` (tempo, key, chords, sections, sung melody) and
  `song/cutclips.py` (VOC clips; slow cues and splices kept at a lower rate) read a recording that is not in the repo;
  each game's tools name the song.
- `@lewismoten/gamemaker-sandbox-tools/kit/songFx` — tricks for those arrangements that stay plain CMF events PLAYGAME and SBFMDRV play: swells and filter
  sweeps under held chords by program changes through copies of a patch (more than 16 timbres: extra patches from 16 up),
  the rhythm section's bass drum tuned as a sub bass (a seventh melodic voice) and tuned toms, one-channel arpeggios and
  ringing harps, stepped glides (no pitch bend), a two-voice choir from vibrato twins, echoes, stutters, rolls and section
  markers (controller 0x66). Loaf #13's `src/sound/song.ts` uses all of them.
- `@lewismoten/gamemaker-sandbox-tools/kit/sound` — PC speaker sounds for `.SND` sets, and synthesized `.VOC` samples.
- `teddySounds.ts` — the sound effects the Teddy games share (woof, yelp, pop, boing, whoosh, crunch, chomp, giggle,
  honk, snore, scratch, slap, chime), synthesized as `.VOC` samples.
- `@lewismoten/gamemaker-sandbox-tools/kit/synthParts` — small pieces the games' synthesized sounds share: noise through a low-pass, a gate, an
  attack-and-decay envelope and a one-pole low-pass.
- `disk.ts` — writes the files with DOS 8.3 names and DOS text.
- `courseStamp.ts` — letters "COURSE 101" in the lower left of a Starter's `title.gif` (`Disk.write` calls it; no number for other games).
- `@lewismoten/gamemaker-sandbox-tools/kit/menuVersion` — the game's version ("v1.1", from about.json) lettered in the lower right of its menu picture,
  in the PC font with a dark outline in the picture's own lightest and darkest colors. `Disk.write()` does it for every
  game; a game whose menu has a line of its own there moves it (`disk.menuVersion = { y: 186 }`).
- `license.ts` — `LICENSE.TXT` for every disk (what's real, what's story, the MIT License), in 30-column pages.
- `sandlogo.ts` — the Sandbox Software logo sting every game's `title.lst` opens with (`SANDLOGO.FLI`): a sandbox with a
  sand castle, a red pail and a blue shovel that pats the sand, then -= S A N D B O X =- drops in, a letter at a time, in
  THE SANDBOX BBS colors over bold yellow SOFTWARE outlined in black. Ray traced with `@lewismoten/gamemaker-sandbox-tools/kit/raytrace` (boxes, cones, discs, spheres, capsules and
  triangles, Phong shading, hard shadows; only what moves is traced again each frame) and `@lewismoten/gamemaker-sandbox-tools/kit/sdftext` (extruded, beveled
  3D lettering), and reduced to 256 colors with `@lewismoten/gamemaker-sandbox-tools/kit/quantize` (median cut, ordered dither).
- `madewith.ts` — the "Made with Game-Maker: Sandbox Edition" sting the web editor offers new games (not a Sandbox game's):
  yellow GAME-MAKER letters drop onto a floor of the site's blue blocks between MADE WITH and SANDBOX EDITION, then fade.
  Ray traced like `sandlogo.ts`; run it once (`cd web && npx vite-node ../games/kit/madewith.ts`, `PREVIEW=<folder>` for
  frame PNGs) to write `web/public/opening/madewith.fli` and its still `madewith.gif`, which the app ships. The web app
  never imports it.
- `madewithMore.ts` — three more of those openings, drawn flat as Reel cartoons (`@lewismoten/gamemaker-sandbox-tools/kit/reel`) from `madewithArt.ts` (the
  palette, the navy sky, the wall of blue blocks, GAME-MAKER built of little gold blocks from the 8x8 font, outlined 8x8
  lettering): `mwblocks.fli` (the letters stacked up block by block), `mwwipe.fli` (the wall of blue blocks turns over in
  a diagonal wave to show the card) and `mwtype.fli` (a DOS prompt runs GM and the card types in). Each ends with a fade
  to black. Run it once (`cd web && npx vite-node ../games/kit/madewithMore.ts`, `PREVIEW=<folder>` for frame PNGs) to
  write them to `web/public/opening/`.
- `bard.ts` — The Bard of Bizarre's logo sting for his games' `title.lst` (`BARD.FLI`): stage curtains part on the logo,
  Doc Leo's photo pops in, a lute strums notes, the tagline types out, fade to black.
- `@lewismoten/gamemaker-sandbox-tools/kit/reel` — FLI cartoons drawn in code, frame by frame: each reel opens on black, fades by palette alone and stores
  only what changed (run-coded line deltas), so a cartoon costs little more than its first picture. `irisOut` closes a round
  iris on a spot (a cartoon made of the title's own art ends on a view that isn't the title), then `fadeOut`.
- `@lewismoten/gamemaker-sandbox-tools/kit/fadeOut` — the fade to black an intro ends on before its title picture (PLAYGAME cuts an FLI's last frame
  straight to black): `encodeFliFadeOut` adds about half a second of palette-only frames to a plain frame list (a Reel
  has `fadeOut`).
- `@lewismoten/gamemaker-sandbox-tools/kit/fliClips` — a long intro cut into clips of about 4 seconds for its slide list (`fliClips`, `clipEntries`; `clipLists`
  does it on a whole disk, for every list that plays the cartoon; `clipEveryList` does it for every list on the disk, so the
  endings, game overs and cut scenes are cut too).
  PLAYGAME plays a whole FLI before it reads Esc, so a list of short clips lets the player skip within a few seconds.
  Cuts fall where the palette holds and least changes; the clips play exactly the frames of the whole one
  (`web/src/formats/fliClips.test.ts`). Opt-in `ClipOptions`: `noLoopFrame` drops each clip's ring frame
  (PLAYGAME plays only the header's frame count), `cheapCuts` cuts where opening on a whole frame adds the
  fewest bytes (a scene change), in no more clips; `shrink` runs `@lewismoten/gamemaker-sandbox-tools/kit/fliShrink` steps (e.g. `sparsePalettes`: a fade
  sends only the colors a frame draws) on each FLI before it is cut.
- `photo.ts` — real photos for the endings: the small scans in `scans/` (made once from the owner's photos by
  `scans/scan.ts`) resized for VGA's tall pixels, given a picture's unused palette entries and dithered in; polaroid frames.
- `chez.ts` — THE CHEZ, the red CitiCar, as a two-block side view (or smaller, seen through a window) for a
  cameo in a game's lot or at its curb, drawn in the game's own palette; facing left shows the charge port for a cord.
- `sandscript.ts` — Sandscript, the Sandbox games' own secret alphabet for little hidden messages: 26 letters
  hanging from a rim (strokes and pebbles on a 3 × 3 grid), and `sandPixels(text, scale)` to stamp a message as
  pixels (scale 2: 5 × 5 letters, three to a 20-pixel block). Its only key is the folded note in the Library
  room (`web/src/library/sandNote.ts`); keep it out of manuals, hint books and site pages.
- `tinHeart.ts` — the tin heart, a small riveted heart that ticks, as a 20x20 block in any game's palette, with a
  glint across its frames and a soft tick-tock on the PC speaker; `looksLikeTinHeart` knows the block in any palette.
- `postcardGrille.ts` / `postcardGrilleLaser.ts` — the postcard and grille decoder (`web/src/manual/printables/postcardMath.ts`): the generator draws a postcard's border pictures and writes its words so exactly one placement of the grille reads a game's answer, the others that match their marks read decoys, and every other cell is whole postcard sentences (a game's own script, e.g. `games/teddy2/tools/postcard.ts`, holds its words and splices the item into printables.json); the laser script writes the grille's front and back SVGs (`npx vite-node ../games/kit/postcardGrilleLaser.ts <id> <outdir>`)
- `tinHearts.ts` / `tinHeartDisk.ts` — the tin heart hunt: writes web/src/tinHearts/hearts.json from each about.json
  `"tinHeart"`, finds a heart on a disk, and checks it is there and found when touched (recipe: `TIN-HEARTS.md`).
- `cameos.ts` — Mystery Robot Joe, Watt, Will and Teenage Lewie drawn by their own games and recolored into
  another game's palette (`TIN-HEARTS.md`, "Cameos").
- `easterEgg.ts` — the decorated Easter egg, a painted egg block in any game's palette, hidden like the tin heart.
- `saveSign.ts` — the save sign: a cream board with a blue floppy disk, SAVE and F5 in a dashed pink stitch, on two
  posts, put into any game's palette by nearest color. Each felt-egg game has exactly one, in the level after the egg's
  (about.json `"saveSign"`: `{ map, at, after }`); ordinary save reminders keep the game's own look. `putSaveSign` gives a
  game whose block set is full a copy of the set for that one map, with the sign in blocks the map never shows.
  The `starter/` kit gives the Starters matching parts. Copy `games/first-steps` for a new one.
  Commands below run from `web/`; a game adds its songs, words, levels and route.

- `starter/blocks.ts` — the shared sky, ground, platforms, ladders, doors, pickups and spikes, in a fixed block order.
- `starter/book.ts` — `Book`, a block set built one named block at a time, with `SOLID`, `LEDGE` and `PULL`.
- `starter/bot.ts` — `StarterBot`, walking, jumping and climbing with arrows and Space.
- `starter/framesSvg.ts` — inline SVG block frames and captions for a manual’s “How this level is made” figures.
- `starter/grid.ts` — re-exports the tools package’s `Grid` for Starter maps.
- `starter/hero.ts` — the side-view hero’s blocks: teal beanie, orange hoodie, gray pants and white sneakers, recolored for each helper.
- `starter/heroChar.ts` — the hero’s character sequences for walking, Space jumping and ladder climbing, with WASD twins.
- `starter/heroFor.ts` — picks the Starter’s hero from the shared table and reads its `about.json` hero.
- `starter/heroFor.test.ts` — checks the hero table, each Starter’s manifest and Kit leading each group’s first game.
- `starter/heroLook.ts` — Kit’s five palette ramps, helper and alien recolors, and two-letter name blocks.
- `starter/heroLook.test.ts` — checks helper names and that recoloring changes only Kit’s palette ranges.
- `starter/ids.ts` — shared sequence, key, monster and sound numbers.
- `starter/invisibleWalls.ts` — `assertNoInvisibleWalls`, rejecting solid blocks drawn as open sky.
- `starter/kitPoses.ts` — Kit’s side-view poses, from idle and walking to climbing, ducking and cheering.
- `starter/kitSheet.ts` — draws the pose, helper and size design sheet: `npx vite-node ../games/kit/starter/kitSheet.ts <out.png>`.
- `starter/kitSizes.ts` — near, far and very far poses from the same drawing and palette ramps.
- `starter/kitSlim.ts` — slim one-block poses in four straight and four diagonal facings.
- `starter/kitSlim.test.ts` — checks the slim poses’ proportions, crouching and recognizable far sizes.
- `starter/locks.ts` — silver keys and counter-spending locked doors, added after the shared blocks.
- `starter/map.ts` — `StarterMap`, levels painted as text rows, with signs and walls extended through sky.
- `starter/mapShots.ts` — renders the maps of the six Starters in its `LOADERS` table with their surroundings: `npx vite-node ../games/kit/starter/mapShots.ts <outDir> [id ...]` (from `web/`). An id outside the table renders nothing; add a loader for a new Starter.
- `starter/monsters.ts` — the gumdrop, buzzer and shelly monsters and their two-frame pictures.
- `starter/palette.ts` — shared bright color ramps, `skyOf` and a palette using the chosen hero’s ramps.
- `starter/screens.ts` — title, menu, paper, cards and ending pictures, with the title’s group style.
- `starter/shop.ts` — coin, price, purchase and sold blocks for Starter shops, using the DOS Money counter.
- `starter/sign.ts` — short words on a wooden board, cut into blocks, with two posts.
- `starter/songStyle.ts` — each group’s instruments, bass, comping, drums and tempo, arranged around a game’s A and B sections.
- `starter/sounds.ts` — short PC-speaker effects using the shared sound numbers.
- `starter/sparkle.ts` — the tapered four-point sparkle a monster leaves behind.
- `starter/sting.ts` — the silent STARTER.FLI opening: blocks stack into STARTER and the chosen hero cheers on top.
- `starter/stuck.ts` — the bot’s blocked-movement rule, including an optional check for jitter without progress.
- `starter/stuck.test.ts` — checks unchanged-position and jitter detection, resets and movement toward either goal.
- `starter/text.ts` — wraps text pages to 30 columns and 16 lines, preserving lines marked with `|`.
- `starter/titleSamples.ts` — renders one sample title per group look: `npx vite-node ../games/kit/starter/titleSamples.ts <outDir>`.
- `starter/titleStyles.ts` — each Starter group’s title sky, lettering colors and frame.
- `starter/topHero.ts` — four top-down facings and two strides, with an arrow/WASD character and no gravity.

- `starter/returnScenes.ts` — `addReturnScenes(game, levelScenes)`: PLAYGAME shows a scene's intro card on every entry, so a level the hero leaves for a talk, a picture or a room and comes back to would show its level card again. It appends a copy of each level scene without the card (same files and links) and points every return link into the level at that copy, so the card shows only on the first arrival. Entering the copy is an ordinary scene entry (the map and monsters load fresh, what the hero carries, the score and meters stay).
- `starter/graduationArrive.ts`, `starter/graduationArriveArt.ts`, `starter/graduationNods.ts`, `starter/graduationNodRoutes.ts` — a graduation's first level, the outside arrival (the second is the hall, `starter/graduationLevel.ts`). `buildArrival(cfg, pal)` lays a campus path with trees, banner poles and the hall's front, with the stage's nods (`cfg.arrive.nods`, ids from the `NODS` catalog) in a row along it; each nod is a few blocks echoing one Starter (a ladder, a key before a gate, wind, a lever, twinkling stars ...), its sign names the course (`COURSE 211 WIND LIFTS YOU`), and nothing in it hurts or traps. The level has its own block set (`arrive.bbl`, so the diploma's full hall set is not crowded). `arrivalRoute(ids)` is the bot's way through and asserts each nod happened; `games/kit/graduationManual.ts` writes the arrival's pages and "How do I" questions into each graduation's manual.json.
- `starter/graduationBuild.ts` — writes the shared graduation disk files from its configuration and levels. Each graduation supplies its own `src/song.ts` through `Graduation.song`; `starter/graduationBuild.ts` writes that score without changing the shared hall data. The scores use `starterSong` and their stage’s band; First Steps retains “Up the Aisle” as its A section.
- `starter/graduationConfetti.ts` — the graduation monster set: the diploma's existing paper art on a clear background, falling four rows past the balcony and resetting at the top; other halls keep the ordinary Starter monsters. `starter/graduationLevel.ts` shares the balcony's rail row; the halls seat everyone in two compact tiers beside the lectern, with a block of headroom in the standing camera. `starter/graduationTools.ts` pauses the recorded ceremony for about five seconds before collecting the certificate. After rebuilding all seven disks, run `npx vitest run --dir ../games/kit/starter graduationLevel.test.ts`: it replays each actual walkthrough and checks every guest's full horizontal and vertical bounds on every final ceremony frame, including a sustained motionless pause. The separate `inViewCheck --standing 19` CLI checks the whole aisle route with alternative rectangles, not all guests simultaneously.
- `carlCameo.ts` — Carl the fly (A Fly Named Carl) as a guest in another game, drawn in the host game's palette.
- `@lewismoten/gamemaker-sandbox-tools/kit/road3d` — a road that comes at you, the pseudo-3D one-screen scene of year2000's Cloud Lane and blaster's data
  bus rides: the road's perspective (`roadView`), the spawner chains that turn a timetable into blocks giving birth once
  each (`spawnChains`), the traffic's leap onto the vanishing point and slide down its lane (`leapTo`, `laneSlide`,
  `roadCorners`), its sizes in step (`growPics`) and a full-size picture shrunk to them (`shrinkSprite`, `ROAD_SIZES`).
  Each game draws its own pictures and places its own blocks.
- `@lewismoten/gamemaker-sandbox-tools/kit/saveSlots` — where PLAYGAME writes the save names, marker and message on a game's load and save
  pictures, so a picture can leave dark and light strips under them.

Checking the games:

- `checkGames.ts` — `cd web && npm run check:games`: every game's checks and a table (builds one at a time, then `--jobs N` games checked at once, default half the CPUs; a lock in the temp folder makes a second run wait); exits 1 on
  any failure. Per game: two builds into temporary folders (`GAME_DISK_OUT`) that must match each other byte for
  byte and cut off no text (`@lewismoten/gamemaker-sandbox-tools/kit/textBounds`); unchanged working output is kept in place, `tools/check.ts`, `walkCheck.ts`, `textfitCheck.ts`, `hiddenView.ts`, `levelCheck.ts` and
  `playerCheck.ts` (when the game has a player.json), `controlsCheck.ts` (when it has a controls.json), `palCheck.ts`; then `tinHearts.ts check`,
  `saveSignCheck.ts`, `syncCheck.ts` and `versionCheck.ts` once. `--game <id>` (repeatable), `--quick` (no reproducibility rebuild), `--jobs N`, `--no-level`, `--verbose`, and `--play`
  (also lists each game's play findings from `levelCheck.ts --play`; slow, and never fails). Secret games are left
  out unless named.
- `flashMeter.ts`, `flashCheck.ts` and `flashCheckCli.ts` — `npx vite-node ../games/kit/flashCheckCli.ts [<id>...]`: flashing, measured. It replays each game's walkthrough on the real engine and, in every second, counts the flashes the W3C's WCAG 2.3.1 describes on the 320x200 frames: a general flash (a tenth of the screen or more, net, changing by 0.1 or more of relative luminance, lighter then darker) and a red flash (a change to or from a saturated red). More than three in a second prints OVER 3 (exit 1 for a game named on the command line). A suggestion an author can dismiss: it can't see the player's screen size, and a fast scroll over a striped picture can read as flashing. No ids: every game with a walkthrough, a table (it takes a while: it replays each game). It also reports the busiest 20x20 spot (`LocalFlashMeter`), advice only: it catches a small patch blinking that the area rule lets through, but a walking hero reads as about 6 a second at the feet, so see what the spot is. Not part of `checkGames.ts`, which would replay every game a second time; Flash Safe has its own `tools/flash.ts`.
- `colorCues.ts` (with `colorCuesCli.ts`, `colorCuesShots.ts`) — `npx vite-node ../games/kit/colorCuesCli.ts [<id>...] [--pairs]`: color cues. For each game (no id: every Starter) it finds the pairs a player must tell apart (keys that add to different counters, locks that spend different ones, a hurting block against a pickup or a plain block, a hurting monster against a harmless one) and measures them under normal, protan, deutan and tritan eyes (the engine's `gfx/colorVision`): lightness difference (20 L* or more), shape (a seventh of the cells differ in ink) and pattern (the light and dark inside differ). A pair that none of these tells apart differs by hue alone, and is listed. A suggestion an author can dismiss: it measures two blocks, not a screen, and can't see animation or a sign. `checkGames.ts` prints a count line (advisory, never fails). `colorCuesShots.ts <id> <scene> <b12 m3 ...> --out <folder>` draws blocks as the four kinds of eyes see them.
- `keyAccess.ts` — `npm run check:keys [-- <id>...]`: keyboard accessibility. Each game's walkthrough's share of presses on the basic keys (the arrows, Space and Enter; `web/src/editor/check/keyLimit.ts`), its number-pad diagonals and every other key it presses, with suggestions where extra keys carry more than a fifth of the play or a diagonal is pressed (games may use extra keys, but less often: many laptops have no number pad and most players stick to the arrows). Never fails; `npm run walk:auto -- <disk> --basic-keys` tries a game with the basic keys alone. Secret games are left out unless named or `--all`.
- `dast.ts` (with `dastImage.ts`, `dastSymmetry.ts`) — the DAST tool (the "what would a child point out?" pass): `npm run dast -- <id>... | --all [--out dir] [--no-search] [--sheet]` reads each game's built `disk/` and writes `<out>/<id>/` (default `.for-lewis/research/dast/renders/`): every GIF at 1x and 3x, every FLI as a contact sheet of its frames (48 evenly spaced at most), block, monster and character sheets at 3x, every map whole at 1x, one sheet per picture with its silhouette turned 0, 90 and 180 degrees, and an `index.html` contact page. `--sheet` adds `<id>/sheet.png`: one contact sheet of every GIF, the middle frame of every FLI, the block, monster and character sheets and the maps (shrunk to fit), the sheets with their silhouette beside them, so a first look at a game is one picture; `--unseen` leaves out pictures an earlier game in the same run already put on a sheet (starters share their art), so the rest of a run is short. It also searches single blocks, each background block repeated 3x3, and every map laid out whole (which holds every 2x2 and 3x3 neighborhood of blocks), for swastika-like shapes (one connected shape with four-fold turn symmetry and no mirror symmetry, four arms) and lists crops of the candidates. Pinwheels and some frets turn up too; a person decides. It writes only to `<out>`.
- `textPurple.ts` (with `textPurpleCheck.ts`) — `npx vite-node ../games/kit/textPurpleCheck.ts [<id>...] [--all]`: text-page ink. PLAYGAME prints a .txt page in RGBPurple (50,10,50) matched to the palette that is up (the picture before it in a slide list, the menu picture's, or the level's), so a palette without that purple shows the page in another color. For every place a page can show (title, menu items, F1 in each level, level intros and endings, won and lost) it lists the ink it lands on, its distance from (50,10,50) (or the player.json's `color.rgb.purple`) and its contrast on the paper behind (palette entry 0 when no picture is behind). It lists pages off purple or under 3:1 and counts those under 4.5:1 (purple on light paper reaches about 4.3). A suggestion: it can't see a level's last frame behind a page. `checkGames.ts` prints a count line (advisory, never fails). The fix is an exact (50,10,50) in an entry no pixel uses.
- `facingCheck.ts` — `npx vite-node ../games/kit/facingCheck.ts [<id>...] [--strict]`: advice, not in `checkGames.ts`. Lists heroes whose shot can fly one way while they are shown facing the other: Game-Maker sends a hero's birthed monster the way the hero last moved (PLAYGAME `CharBirthMon`, `ci.netx`), but the fire sequence and the idle sequence show the same pictures whichever way that was. It flags a fire sequence that does not step before its birth and shows a side-view head, and that hero's side-view idle. Pictures facing the player (Pass the Pie's heroes) or a step the way the pictures face before the birth settle it. It can't tell a chase monster (which ignores the direction) or a hero only meant to walk one way. `--strict` exits 1 on a finding.
- `leapCheck.ts` — `npx vite-node ../games/kit/leapCheck.ts [<id>...]`: for every lock (a solid block that takes a key counter, 20 to 29) in every scene of a built game, puts the hero without the key on each standing spot within 9 blocks and leaps at it (run-up, Space, arrow held); fails when he gets past the lock's column above it. A spot with a key on it is skipped. A spot nobody can reach can be a false alarm. In a Starter, `StarterMap.wallToSky(x)` carries a locked wall up through the sky rows (ORIGIN) to the top of the world. `checkGames.ts` runs it as the `leap` column.
- `palCheck.ts` — `npx vite-node ../games/kit/palCheck.ts [<id>...]`: fails when a game's `disk/` holds byte-identical `.pal` files. Every game's `Disk.write()` merges them first (`web/packages/tools/src/kit/palMerge.ts`: the first palette in scene order is kept, every scene that opened a duplicate opens it, the duplicates are dropped; scenes keep their numbers, and a DOS saved game stores scene numbers, not file names), so a failure means a build bypassed the shared writer.
- `midairJump.ts` — `npx vite-node ../games/kit/midairJump.ts [--md] [--strict] [<id>...]`: advisory. Lists every hero sequence that pushes upward (a keyed momentum sequence) and says whether the key can start another one before landing (PLAYGAME starts a keyed sequence whenever the current one is not uninterruptible, so the default jump can be tapped again in the air). Results: `REJUMP`, `bounded` (a held direct rise, push a tick up to gravity's cap 44; the rule and its engine lines are in `midairRule.ts`), `counted` (a finite meter), `locked` (uninterruptible for the whole flight), `allowed` (`midairJump.allow.json`, with a reason: jet packs and lessons). Not in `check:games` yet, since most games report REJUMP; `--strict` exits 1 on one.
- `heldRiseProof.ts` — `npx vite-node ../games/kit/heldRiseProof.ts`: the proof behind the default hero's optional held-rise jump (hold Space to rise, steer after letting go). Plays First Steps (held-rise) and Jump Boots' first level (the default momentum jump) headless: the hero jumps, waits until he falls, taps Space again, and it prints how much higher each gets. The held-rise hero gains nothing; the default hero's taps stack on purpose. `--sweep` also plays First Steps' hero with other pushes (8 to 48) and fails if `midairJump`'s verdict differs from what the engine does (a push above 44 can lift again, 44 and below cannot).
- `controlsCheck.ts` — `npx vite-node ../games/kit/controlsCheck.ts [<id>...]`: a game's `controls.json` (keys by scan code, joystick
  buttons, counters by meter, sound names by slot; the shape of `editor/core/gameControls.ts`) describes exactly what its built disk uses, by the
  editor's `gameKeyMap`, `counterUses` and `soundUses` (a custom slot past the engine's nine that a character plays must be named): lists used-but-not-described, described-but-not-used and text over the limits (32/240/80, sound names 40).
- `saveSignCheck.ts` — `npx vite-node ../games/kit/saveSignCheck.ts [<id>...]`: every felt-egg game has exactly one save
  sign, where its about.json says, on the egg's map or one it links to; no other game has one.
- `walkCheck.ts` — replays a committed `walkthrough.json` on the real engine: it must reach the ending with the frames and
  chapter marks it was recorded with, and cut off no clip.
- `integrator.json` (optional, per game) — how the web editor's Game Integrator arranges a big game's scenes into named boards
  and stacked groups (`web/src/editor/editors/integrator/boardLayout.ts`: `{ boards, place, groups }`, scenes by index). "Look inside"
  opens with it (`shippedBoards.ts`, found with `import.meta.glob`). Editor-only: never in `disk/`, a download or the DOS export.
- `player.ts` / `playerCheck.ts` — a game's DOS player look, `games/<id>/player.json`: the `{ "base": "xferplay-3.00",
"patches": { … } }` record a project keeps in its companion (`web/src/dosPlayer/playerRecord.ts`; ids and limits in
  `web/packages/engine/src/player/patchTable.ts`). The site shows it wherever the game plays or ships (`web/src/dosPlayer/
catalogPatches.ts`) and the DOS download writes it into XFERPLAY.EXE; it never goes on `disk/`, so Game-Maker's own
  PLAYGAME still shows the stock words (keep in-game text that names an F2 label neutral: "F2 counts your sugar").
  Words, colors, frames and positions only: no timing or F-key patch (they would change play, and the bots and
  walkthroughs play without the look) and no renamed extensions. `npx vite-node ../games/kit/playerCheck.ts [<id>...]`
  checks each against the rules, writes it into the CD's player, and checks that a color it changes on the black
  screens (F2, the drop picker, F1's no-help line, F10, the name prompt) stands 3 : 1 against color 0 in every level's
  palette. `levelCheck.ts` judges the menu's words and the color 0 check with it.
- `levelCheck.ts` — the editor's Level check (static part) on a built disk; only an error or warning missing from
  `levelCheck.baseline.json` fails. After looking at new findings and judging them fine (or after tuning the checks), run
  `npx vite-node ../games/kit/levelCheck.ts <id> --update` to rewrite that game's baseline. A game's about.json
  `"sameEverySide"` (`["ship.chr", "hive.mon#0"]`) lists heroes and monsters meant to look the same from every side,
  which the facing check leaves alone (the editor keeps the same list in the companion file). Its `"acceptedFindings"`
  (`["hurt-lock s2 Monster 9 holds the hero while it hurts"]`) lists findings kept on purpose, by the editor's stable key
  (check, scene and title without where it was first seen, `web/src/editor/check/accepted.ts`); they never fail, as
  the map panel's "Mark as checked: it's meant to be" ("That's on purpose" on a suggestion) leaves them out.
  `levelCheck.ts <id> --play [--steady <ms>] [--budget <s>]` also plays the game with the Level check's bot (the
  whole game, once as it comes and once leaving behind all it can; then each level scene alone, heading for its links,
  and again with steady hands at 300 ms between keys unless told) and lists one-way spots, things left behind, steady
  hands and stuck spots, which scenes it found no way through, and how tight the walkthrough's key changes are
  (`web/src/editor/check/walk/pace.ts`). It only reports: play findings depend on the time the bot has, so they are
  not in the baseline.
- `optimizeProof.ts [<id>...] [--write <dir>]` (`npm run optimize:proof`, from `web/`) — applies every disk-tool step to a copy of each built game and proves each scene draws the same (pixel for pixel in RGB) and carried block numbers keep their picture; prints steps and bytes saved, exits 1 on a difference. `optimizeProofReserve.ts` adds a second line per game: proposed palette reservations, the reductions and syncs they need, the extra bytes the steps then save, and the delta E of any scene against the original (`--no-reserve` skips it).
- `diskSpace.ts [<id>...] [--write] [--strict]` — runs the editor's disk-space tool (`web/src/editor/disk`) over built
  games: what it would merge, what it leaves alone and why, and the size in 1.44 MB and 720 KB floppies. It reads
  `games/<id>/disk` and changes nothing; `--write` also writes `.for-lewis/research/disk-space-findings.md`, `--strict`
  exits 1 when a step is left to apply.
- `syncCheck.ts` — `levelSecrets/<id>.json` and every box's play hours are current (what `scripts/levelSecrets.ts` and
  `playtime.ts` would write), and `levelViews/<id>.json` was scanned from the game's disk and walkthrough as they are now
  (else rerun `npx vite-node scripts/levelViews.ts <id>`), without writing anything.
- `versionCheck.ts` / `versions.ts` — each game's version is `"version": "major.minor"` in its about.json, the one
  place it is written: the game's text reads it from there (the in-story date beside it stays as written), and the
  site shows it. Once a game's `disk/` differs from the last push to master (`git merge-base HEAD origin/master`, else
  the local master), its version must be higher than it was there (historical disks are rebuilt from source when untracked): bump the **major** (1.1 → 2.0) for new, removed or
  reordered levels or a big gameplay change, the **minor** (1.0 → 1.1) for anything else (art, text, sounds, a level's
  layout). One bump covers every change until the next push. `npx vite-node ../games/kit/versionCheck.ts [<id>...]`
  names each game to bump; with no master to compare with (no git history) it skips with a note.
  `hardCodedVersion.ts` (run by `versionCheck.ts`) also fails a game whose `src/` types its own version by hand
  (`v1.2`, `Version 1.2`, `VER 1.2`) instead of reading `about.version`; a line naming another program's version
  goes in its `ALLOWED` list (now: the software box in Snowbound's scene art). Engine and format versions
  ("Game-Maker 3.0", "MS-DOS 5.0", CMF, VOC) don't match the pattern.
- `@lewismoten/gamemaker-sandbox-tools/kit/sceneSim` — a headless copy of PLAYGAME's main loop for one scene, built from the build's own data
  (no disk). The bots of teddy, teddy2, teddy3, logic and brief play on it.
- `@lewismoten/gamemaker-sandbox-tools/kit/gameSim` — a headless PLAYGAME that plays a built disk scene after scene (links, deaths, the ending),
  keeps the keys per scene and can snapshot and restore. depth, realm, snowbound and the Bard's games play on it.
  `diskSim(new URL('../disk', import.meta.url))` is a game's whole `tools/sim.ts`.
- `@lewismoten/gamemaker-sandbox-tools/kit/hopBot` — the play-testing bot of the games whose hero hops (walk to a column hopping what blocks it, hop
  and steer, land, hold a key, climb): reckoning, risi, loofah, sweats, mustard, needle and loaf extend it.
- `levelRun.ts` — `playLevels()`, a game's `tools/play.ts` run: its levels' routes in a row, `BOT_LOG`, and the
  rule that a whole run wins without losing a life.
- `demoRecord.ts` — `recordDemo()`, what a game's `tools/gendemo.ts` does: the bot's first ticks into `src/demo.ts`.
- `walkthrough.ts` — writes a game's `walkthrough.json` from its bot's keys, after replaying them on the web
  app's real engine to check the run reaches the ending and to time its chapters. `writeSimWalkthrough()`
  does it for a GameSim run (a segment and a chapter a scene), the body of most games' `tools/walkthrough.ts`.
- `walkPaths.ts` — a game's walking paths and roads: `games/<id>/walkPaths.json` (block numbers by block set, as
  the editor's companion section `walkPaths`), written by the game's build (`writeWalkPaths`) and read by its bot
  (`keepToPaths`: a step off them costs `OFF_PATH_COST` more in its shortest-path search), so the recorded
  walkthrough walks the roads instead of cutting across. The top-down games with ways to keep to have one: realm
  (roads and streets), brief (book 15's street), goat (the field's path, Bethlehem's cobbles), year2000 (sidewalks
  and skyway decks), snowbound (sidewalks, front walks, driveways), smirked (the foyer's runner);
  each bot's path search adds the cost (`keepTo`, or year2000's `paths` option). Side-view games and rooms floored
  wall to wall have none.
- `@lewismoten/gamemaker-sandbox-tools/kit/textfit` — the text-fit audit: every screen where PLAYGAME draws text over a game's own pictures must
  have the text on plain paper with enough contrast. `textfitCheck.ts` also fails any character 128-255 in the
  words the player draws in play (text pages, the menu's name, a shipped .his), which DOS draws as scribbles
  (the Level check's `dos-chars`). It also checks each level's card (the picture shown between levels, words
  baked in) and fails words that run past the edge of its parchment box (`cardOverflow`). Run it with
  `cd web && npx vite-node ../games/kit/textfitCheck.ts <id> [--png <dir>] [--all]`.
- `@lewismoten/gamemaker-sandbox-tools/kit/textBounds` — no text cut off at the edge of its picture: the games' text helpers (`text`, `micro`, a canvas's
  `text`) report each string's ink, and a build run with `TEXT_BOUNDS=<file>` writes every string that runs past its
  picture (or a clip area the helper was given) and is never shown whole there; a scroll or a drop-in shown whole in
  another frame is fine. Off, it changes no pixel. `cd web && npx vite-node ../games/kit/textBoundsCheck.ts [<id>...] [--moving]` builds into a temp folder and lists them; `checkGames.ts` reads it from its rebuild (the `bounds` column).
  A text helper in a new game should report its ink the same way (`textInk(p, s)`, `add`, `end`).
- `@lewismoten/gamemaker-sandbox-tools/kit/clips` — does every digitized clip play to the end? A walkthrough's run, with its sound written down, checked
  for a clip cut off by the scene ending or by the next sound; `walkthrough.ts` runs it on every
  walkthrough it writes (failing on a cut clip when the game asks), and `cd web && npx vite-node ../games/kit/clipCheck.ts <id>...` runs it alone.
- `align.ts` — multi-block objects (trees, houses, cars, signs): every map puts their parts together, and the art
  joins up across block edges. Each game's `tools/align.ts` names its objects; its `tools/check.ts` runs it.
- `playtime.ts` — sets each box's "Over N hours of gameplay!" (`about.json` `box.hours`) from the walkthroughs:
  `cd web && npx vite-node ../games/kit/playtime.ts` after any walkthrough changes.
- `pixelPicture.ts` — reads the sprite a pixel-trinket definition names (a hero's standing frame or a monster's first picture, with the game's palette) from a built disk; shared by `pixelTrinkets.ts` and `laserNickels.ts`.
- `phoneDownloads.ts` — the Phone of the Future kit's files for the box (`web/public/trinkets/phone/`, git-ignored): a pack of the 3D-printer parts (`pack/meshPack`'s `packFiles`; the site zips them on a download, every STL the same bytes), a ZIP of the circuit board files (KiCad projects, Gerbers and the PIC firmware), the two parts lists (CSV), the README and parts lists as Markdown for the box's instructions book, and the phone viewer's committed `parts.bin` packed as `parts.bin.pack` (named in the copied `parts.json`). `build-games.mjs` runs it; by hand: `cd web && npx vite-node ../games/kit/phoneDownloads.ts`.
- `pixelTrinkets.ts` (with `trinketRender.ts`, and `pixelTrinketDefs.ts` listing each game's figures) — pixel-figure 3D-print trinkets: each non-secret game's hero and one signature figure (Logic's Watt has none), a character's standing frame or a monster's picture from the game's own built disk as a standee on a base, a multi-color 3MF (at most 4 bodies) and a single-color STL into git-ignored `web/public/trinkets/<game>/` with a `manifest.json` that carries a `source` key (figures, options, mesh code): `build-games.mjs` runs it after the games and a game whose key matches is skipped (`--force` remakes). `--png DIR` writes front, three-quarter and contact-sheet renders (never skipped): `cd web && npx vite-node ../games/kit/pixelTrinkets.ts [--game id[,id]] [--force] [--colors 3|4] [--out ROOT] [--png DIR]`. To add a game, add its entries to `pixelTrinketDefs.ts` and look at the `--png` sheet.
- `trinketPacks.ts` — packs the trinket files the site serves: each STL a `web/public/trinkets/<game>/manifest.json` lists becomes `<file>.pack` (`pack/meshPack`, raw-deflated; about an eighth of the size), each 3MF too (`pack/threeMfPack`, about half), and the manifest's `packed` names them; the site makes the real files back in the browser (an STL byte for byte, a 3MF with the same files inside) (`web/src/desk/boxes/trinketData.ts`). `build-games.mjs` runs it after the trinkets; a packed folder is skipped.
- `scoreAudit.ts` — replays committed walkthroughs without rebuilding disks and prints each completed game's final score plus its score at every scene entrance. Use it to compare score curves before changing a game's point values: `cd web && npx vite-node ../games/kit/scoreAudit.ts [id...]`.
- `dosStates.ts` — replays each CD game's `demo.rec` through the web engine and compares it with the DOS-recorded tables in `dosStates/` (see its README), printing the first differing line per game: `cd web && npx vite-node ../games/kit/dosStates.ts [game...]`. Local only (nebula and peach are long).
- `@lewismoten/gamemaker-sandbox-tools/kit/png` — a PNG writer and block sheets for design previews (used by the games' `tools/`, never on a disk).

`cdDemos/` records title demos for CD games that shipped without one, apart from the Sandbox games:

- `cdDemos/bot.ts` — explores with each character’s own keys, favoring new ground and pickups while avoiding harm.
- `cdDemos/probe.ts` — copies and steps a level so the bot can try keys before pressing them.
- `cdDemos/headless.ts` — runs the engine and recorder in Node with a virtual canvas and clock.
- `cdDemos/demo.ts` — records bot demos and replays recordings to report movement, score and deaths, with screenshots.
- `cdDemos/make.ts` — writes missing CD title demos: `npx vite-node ../games/kit/cdDemos/make.ts [ids…]` from `web/`.

Recorded source clips use lossless PCM WAV for inline GitHub audio previews. The cutters in `song/cutclips.py` write that
format with the nominal sample rate; game builders use
`@lewismoten/gamemaker-sandbox-tools/audio-files` to decode samples or create native VOCs.
The native WAV conversion needs no external decoder; FFmpeg is only needed for cutting
recordings or converting compressed sources such as Ogg. Keep `.wav` authoring sources outside
`disk/`; native 8.3 `.VOC` output must remain byte-identical in this format migration.

`versionDisks.ts` compares current build output to a Git revision. It reads legacy tracked disk blobs directly; for source-only revisions it extracts a temporary source snapshot, reuses installed third-party dependencies, resolves workspace packages from that snapshot, and builds the historical disk. `files(id)` returns a game's disk at the revision as name to bytes (used by `npm run disk:diff -- <id> --since`), and `lastPushToMaster(root)` picks the default revision. This stays local, outside CI.
`moneyAudit.ts` replays the committed walkthroughs without rebuilding disks and reports each game's visible money counter at scene starts and its win.

Laser wooden nickels for a Glowforge are made by `laserNickels.ts` (with `laserNickelDefs.ts` for each token's concept, art and words, `laserNickelParts.ts` for the shapes it draws with, and the builder in `web/packages/tools/src/kit/`: `@lewismoten/gamemaker-sandbox-tools/kit/laserSvg` millimeter SVG layers, `@lewismoten/gamemaker-sandbox-tools/kit/laserPixels` pixel text, arcs and tone-engraved figures, `@lewismoten/gamemaker-sandbox-tools/kit/laserClearance` the spacing check, `@lewismoten/gamemaker-sandbox-tools/kit/laserPreview` PNG previews). Each is a 1.5 inch (38.1 mm) wooden token that is the money of its game's own world, a 1994 collectible in a series of 26 (the order below, kept in the defs; secret games are not counted). Every coin has a reeded rim of engraved ticks inside its cut, a front (the game's name in an arc over the top, the token's art, a line in an arc along the bottom, sometimes a hole cut through) and a back ("GOOD FOR ..." in the game's words, `NO.nn/26`, the year, `SM` for Sandbox Mint, and one Sandscript letter, `games/kit/sandscript.ts`; in series order the 26 letters spell `BE KIND AND KEEP PLAYING FRIEND`, kept as `MESSAGE` in the defs). Figures are engraved by tone from their own colors: dark colors solid, mid colors (clothes, hair) as a checker or lines, skin and light colors left bare, with every outline kept, so a person never looks undressed.

Colors, one per operation (the Glowforge app only groups steps by color: you pick Cut, Score or Engrave for each): **cut** red `#ff0000`, stroke only, fill none; **engrave** blue `#0000ff`, filled shapes with stroke none (the app takes a stroke as a cut); **score** magenta `#ff00ff`, strokes only, for paper kits (folds), and never on a coin. The coin's only cut is its outer circle (plus a hole, where the token has one); every engraved shape is inside it, and the rim ticks end 1 mm short of it. Letters are at least 2.5 mm tall, nothing is engraved past 15.1 mm from the center except the rim, holes leave 3 mm of wood to the rim, and the build **fails when any two elements** (each text line, arc, the figure or motif, the series number, the mint mark, the Sandscript letter, the rim, a hole) come within 0.6 mm of each other (1 mm to a hole), naming the pair.

It writes git-ignored `web/public/laser/<game>/`: `front.svg` and `back.svg` (38.1 x 38.1 mm each), `sheet.svg` (270 x 150 mm: twelve fronts in a 4 x 3 grid at a 44 mm pitch, and the flip jig, a 38.0 mm cut-out in the same board with a triangle marking 12 o'clock), `sheet-back.svg` (the same page with only the back's engraving placed on the jig: no cut paths at all), a PNG preview of each, and `manifest.json` (a `source` key of figures, words and builder code: a game that matches is skipped, `--force` remakes), and `web/public/laser/checklist.svg` and `.png`, a tick-box page for all 26. `build-games.mjs` runs it after the games (`GM_SKIP_LASER_NICKELS=1` skips). The desk shows them: a game's box lists its kit beside the trinkets (previews, a one-line description, download links; `web/src/desk/README.md`). A manifest for another laser kit under `web/public/laser/<game>/manifest.json` needs only a `kit` entry (`title`, `summary`, `previews`, `downloads`) to appear there. **Order of work:** on the first pass run engrave, then cut (the Glowforge runs steps by type, so check the app's order: engraving before cutting keeps the coins from shifting), take the coins out and leave the board with the jig hole where it is; drop a coin in back side up (turn it left to right so the top stays on top; the back is drawn the way you read it, so it is not mirrored) and run `sheet-back.svg` as engrave only. Test the jig's fit on scrap first: it allows for about 0.2 mm of kerf. To add a game, add its entry to `laserNickelDefs.ts` and look at the PNG previews: `cd web && npx vite-node ../games/kit/laserNickels.ts [--game id[,id]] [--force] [--out ROOT]`.

Laser puzzle-box kits are built beside their game, not here: Final Curtain's **Stage Box** (`games/sleuth/laser/`, see its README) is a 3 mm plywood box with an etched proscenium front, two sliding curtains and a prop-dagger lever that release a trap-room drawer when worked in the playbill's order. It uses the same `laserSvg`/`laserPixels`/`laserClearance`/`laserPreview` tools plus the shared `laserJoints` and `laserLayout`, and writes ignored `web/public/laser/finalcurtain/` (SVG sheets, PNG previews, `assembly.svg`, `manifest.json` with `kind: 'kit'`): `cd web && npx vite-node ../games/sleuth/laser/stageBox.ts [--kerf 0.2]`. Three more sit beside their games, each with its own README: Snowbound's **Plowed Street** box (`games/snowbound/laser/`, `plowedStreet.ts`), the Year 2000 **cryptex** (`games/year2000/laser/`, `cryptex.ts`) and Tune-Up's paper THE CHEZ (`games/tuneup/laser/`, `chezPapercraft.ts`: laser sheet plus print PDFs). The Plowed Street, Stage Box and paper THE CHEZ builders accept `--sheet 12x12` (default), `12x20`, `6x12` or `8x12` inches and include four-size fitting tables in their README and manifest. Their layouts use `kit/laserLayout` and `kit/laserStock` for cutter margins, quarter turns and small parts in waste holes; the paper car stays cardstock. Each writes ignored `web/public/laser/<game>/<kit>/`, is built by `scripts/build-games.mjs` and shows on the desk's Feelies shelf.

The series, in order:

| No. | Game        | The token                                                                                           |
| --- | ----------- | --------------------------------------------------------------------------------------------------- |
| 1   | `blaster`   | An arcade token: a star cut clean through, "1 PLAY", "NO CASH VALUE".                               |
| 2   | `brief`     | A library token: a big "100" and "WORDS", exactly.                                                  |
| 3   | `carl`      | A buzz token: Carl himself, small, over "ONE BUZZ".                                                 |
| 4   | `depth`     | A depth token: rings receding to a bold sphere, "NO GLASSES".                                       |
| 5   | `goat`      | A shepherds' + "'" + ' tally token: the third goat from the left.                                   |
| 6   | `loaf`      | A basket token: Loaf #13, the one nobody picked.                                                    |
| 7   | `logic`     | Just an Ω, big and bold.                                                                            |
| 8   | `loofah`    | A scrub token: the loofah beside the horned imp, "CLEANSE ME".                                      |
| 9   | `maximus`   | A Galactic Courier star credit: a rocket along a dotted star route, "PAID ON DELIVERY".             |
| 10  | `mustard`   | A faith token: the smallest hole in the land, "SMALLEST THING IN THE LAND".                         |
| 11  | `needle`    | A road token: Brother Camel alone, and the eye he has to get through.                               |
| 12  | `realm`     | The Round Tuit itself: a ringed boss, "A ROUND TUIT".                                               |
| 13  | `reckoning` | A fridge-door token: the clock reads "3:17 A.M." with Doc Leo, in his pajamas, in the kitchen.      |
| 14  | `remote`    | A couch token: the remote, and "PLAY".                                                              |
| 15  | `risi`      | A Roman coin: Marcus in a laurel wreath, "VENI VIDI RISI".                                          |
| 16  | `sandcast`  | A beach token: a sand dollar that hides a knight’s crest.                                           |
| 17  | `sleuth`    | The Paragon Theatre’s admission token: "ADMIT ONE", row and seat, a perforation, and the two masks. |
| 18  | `smirked`   | The bravery award: a rosette with a star, "BRAVERY BADGE", "SHE SMIRKED".                           |
| 19  | `snowbound` | Shoveling scrip: "$1" a driveway, with a snowflake.                                                 |
| 20  | `sweats`    | An open-mic token: Will in his ruff and sweatpants, "ONE OPEN MIC SLOT".                            |
| 21  | `teddy`     | A trick token: a paw print and "ONE TRICK".                                                         |
| 22  | `teddy2`    | A Tri-County Fair ride ticket: a Ferris wheel with a hole for its hub.                              |
| 23  | `teddy3`    | A birthday token: a party hat and "BIG DAY".                                                        |
| 24  | `tickle`    | A rat token: the lab rat from the game, "CERTIFIED".                                                |
| 25  | `tuneup`    | A tuning token: a tuning fork, "NO WRENCHES".                                                       |
| 26  | `year2000`  | A Teleport-A-Phone token: a hole through the middle like a subway token, "25 CENT".                 |

Depth Perception's plastic trinkets (STL files for its box) are made by `games/depth/tools/trinkets.ts`, from `games/depth/src/trinkets/` (`fields.ts` turns the tracer's shapes into distance fields, `make.ts` builds one's field and hands it to the shared `meshFieldTrinket`; the tool is the shared `runTrinketTool`). Quest for the Round Tuit's (`games/realm/src/trinkets/`: the Round Tuit in three pieces, a crown coin, a key tag) use the same pipeline with the shared `sdfShapes` and `trinketKinds`, and are made by `games/realm/tools/trinkets.ts`; `trinketSheet.ts <game>` writes a contact sheet (top, three-quarter and side views of the color bodies) and mesh stats for either: `cd web && npx vite-node ../games/kit/trinketSheet.ts realm`. `node scripts/build-games.mjs` runs it beside the games (worker threads of one bundle, `--workers N`) and it skips when its sources are unchanged. Each trinket is sampled once, thinned by `mesh/decimate`, and written as an STL, a 3MF of at most four color bodies and, where it leans out over nothing, a supports STL (about 5 MB for all seven); `plinth` and `palette` in a trinket's entry choose its stand's color and its filaments.

### Embroidered patch

Maximus has a machine-embroidery patch as a feelie (`games/maximus/patch/`: `design.ts` the shapes and threads, `build.ts` the files). It is built on the generic generator in `web/packages/tools/src/embroidery/` (see that package's README) and draws no art from the game's disk: its colors are the box's navy and amber and the cyan and red of the palette's visor and heart ramps, and its star has one point for each of the ten star-shards. `cd web && npx vite-node ../games/maximus/patch/build.ts [--out DIR] [--zoom cx,cy,size]` writes `web/public/laser/maximus/patch/` (git-ignored build output; `scripts/build-games.mjs` runs it whenever Maximus is built): `maximus-patch.dst`, `.exp` and `.pes` for a 4 x 4 in (100 mm) hoop, `threads.txt`, `design.svg`, `preview.png` (a stitch simulation) and `manifest.json` (a `kit` entry with `id: "embroidery-patch"`, which the box lists as a feelie, drawn as a thin disc with a raised satin rim by `web/src/desk/boxes/patchModel.ts`). Each file is read back and checked (stitch count, longest stitch, hoop, color changes); the script exits 1 on a problem. `--zoom` writes `zoom.png`, a close look at one part. `web/test/embroidery.test.ts` holds the tests.

- `vocCues.ts` — `npx vite-node ../games/kit/vocCuesCli.ts <id>...` (logic in `vocCues.ts`): the editor's `voc-stutter` suggestions for a built game: a `.VOC` of 10,000 bytes or more (a 286 reading it from a hard disk loses about a game tick; 32,000 about two) and a long sound on a score or healing block that stays put, so DOS restarts it every tick. Estimates from the programmer's guide notes, dismissible; it can't see the player's disk. `checkGames.ts` prints a count line (advisory, never fails).
- `inViewCheck.ts` (logic in `inView.ts`) — `npx vite-node ../games/kit/inViewCheck.ts <id> --scene <n> [--standing <row>] --rect x,y,w,h [--rect ...] [--scene ...]`: in view. Replays the game's walkthrough on the engine and checks that something the player must watch (a timer bar, a meter, a sign) is on screen: every frame of the scene, at least one of the rectangles (map cells, world blocks) is wholly inside the 312x196 picture PLAYGAME shows. `--standing` counts only the frames the hero stands with his feet in that map row (not mid-jump or falling). Prints PASS or FAIL per scene with the frames that missed; exits 1 on a FAIL. `--rows` lists the map rows and columns each scene ever shows. It sees only the walkthrough's route, not every way a player could scroll.
- `viewCheck.ts` (with `viewCheckCli.ts`) — `npx vite-node ../games/kit/viewCheckCli.ts [<id>...]` (logic in `viewCheck.ts`): view edge. Replays each game's walkthrough on the engine and lists monsters PLAYGAME doesn't draw (so they can't hurt) because their map cell is in the screen's left column or top row, or past the right or bottom bound (`ScrnLowBnd`/`onscrn`, PLAYGAME.C:294), while most of their pixels would be on screen for half a second or more at a stretch: scene, monster number, frames hidden, edge, first cell. A suggestion an author can dismiss: it can't tell a monster meant to hide, and sees only the walkthrough's route. `checkGames.ts` prints a count line (advisory, never fails).

Colors That Work plays both lessons with a simulated scene palette (`alike.pal`); its cards still compare the original and simulated colors. Beat the Clock writes valid empty monster and monster-block sets because its maps place no monsters.

- `starter/graduationLevel.ts` — builds the aisle level, with the hall, audience, stage and certificate.
- `starter/graduationLevel.test.ts` — replays the graduation walkthroughs and checks every guest’s complete bounds during the ceremony pause.
- `starter/graduationTools.ts` — shared arrival and aisle routes, play checks, demo recording and walkthrough writing.

## Other kit files

- `coolSign.ts` — draws and places the two-block cOoL plaque on a copy of a scene’s block set, without covering used cells.
- `cdDemos/games.ts` — the CD games missing title demos, bot settings for each and reasons for skipping others.
- `scans/blacklight.py` — makes the desk’s day and night black-light portraits from the maintainer’s private photo (`python3 games/kit/scans/blacklight.py` from the root; needs Pillow and NumPy).
- `starter/graduationCameo.ts` — recolors the Cast’s existing sprites, Teddy, Gwinn and THE CHEZ into a graduation hall’s palette.
- `starter/graduationCast.ts` — allocates and recolors the Starter helpers’ and Doc Leo’s hall blocks.
- `starter/graduationConfig.ts` — the `Graduation` data shape for the stage, hall, arrival, text, song and guests.
- `starter/graduationFriends.ts` — draws the Starter friends in their own colors, clapping in graduation robes.
- `starter/graduationGame.ts` — builds the graduation’s title, ending and level scenes and their links.
- `starter/graduationHall.ts` — draws hall blocks, the stage, balcony, drapes, lectern, certificate and guests.
- `starter/graduationPreview.ts` — writes block, hero, monster, whole-map and disk-picture PNG previews for a game’s `tools/preview.ts`.
- `starter/graduationScreens.ts` — draws the academic title and menu, with the stage’s colors, seal and borders.
- `starter/graduationShots.ts` — writes title, menu, sting and walkthrough PNGs: `npx vite-node ../games/kit/starter/graduationShots.ts <game id> <outDir> [prefix] [walkEvery]`.
- `starter/graduationSting.ts` — draws the silent GRADSTNG.FLI opening with curtains, gold lettering and tossed mortarboards.
- `starter/graduationText.ts` — shared instructions, credits and lost pages; each graduation supplies its story and win pages.
- `starter/graduationTheme.ts` — the hall theme’s optional block overrides and wall decorations.
- `starter/graduationThemes.ts` — draws the later halls’ gym, castle, theater, lab and gallery themes in the shared ramps.

- [README.md](README.md) — this kit’s file and command map.
- [TIN-HEARTS.md](TIN-HEARTS.md) — placing and checking hearts, cameos and Easter eggs.
- [dosStates/README.md](dosStates/README.md) — the source and fields of the DOS reference tables.
- `dosStates/bcuda.txt` — recorded DOS demo states for `bcuda`, compared by `dosStates.ts`.
- `dosStates/houses.txt` — recorded DOS demo states for `houses`, compared by `dosStates.ts`.
- `dosStates/nebula.txt` — recorded DOS demo states for `nebula`, compared by `dosStates.ts`.
- `dosStates/peach.txt` — recorded DOS demo states for `peach`, compared by `dosStates.ts`.
- `dosStates/pipemare.txt` — recorded DOS demo states for `pipemare`, compared by `dosStates.ts`.
- `dosStates/tutor.txt` — recorded DOS demo states for `tutor`, compared by `dosStates.ts`.
- `dosStates/volume.txt` — recorded DOS demo states for `volume`, compared by `dosStates.ts`.
- `dosStates/zark.txt` — recorded DOS demo states for `zark`, compared by `dosStates.ts`.
- `scans/bardlogo.jpg` — repository photo scan used by game artwork.
- `scans/chez.jpg` — repository photo scan used by game artwork.
- `scans/colonial.jpg` — repository photo scan used by game artwork.
- `scans/docleo.jpg` — repository photo scan used by game artwork.
- `scans/gazebo.jpg` — repository photo scan used by game artwork.
- `scans/goatcover.jpg` — repository photo scan used by game artwork.
- `scans/gwinn.jpg` — repository photo scan used by game artwork.
- `scans/leo.jpg` — repository photo scan used by game artwork.
- `scans/library.jpg` — repository photo scan used by game artwork.
- `scans/needle1.jpg` — repository photo scan used by game artwork.
- `scans/needle10.jpg` — repository photo scan used by game artwork.
- `scans/needle11.jpg` — repository photo scan used by game artwork.
- `scans/needle12.jpg` — repository photo scan used by game artwork.
- `scans/needle13.jpg` — repository photo scan used by game artwork.
- `scans/needle14.jpg` — repository photo scan used by game artwork.
- `scans/needle2.jpg` — repository photo scan used by game artwork.
- `scans/needle3.jpg` — repository photo scan used by game artwork.
- `scans/needle4.jpg` — repository photo scan used by game artwork.
- `scans/needle5.jpg` — repository photo scan used by game artwork.
- `scans/needle6.jpg` — repository photo scan used by game artwork.
- `scans/needle7.jpg` — repository photo scan used by game artwork.
- `scans/needle8.jpg` — repository photo scan used by game artwork.
- `scans/needle9.jpg` — repository photo scan used by game artwork.
- `scans/seed1.jpg` — repository photo scan used by game artwork.
- `scans/seed2.jpg` — repository photo scan used by game artwork.
- `scans/seed3.jpg` — repository photo scan used by game artwork.
- `scans/seed4.jpg` — repository photo scan used by game artwork.
- `scans/seed5.jpg` — repository photo scan used by game artwork.
- `scans/seed6.jpg` — repository photo scan used by game artwork.
- `scans/seed7.jpg` — repository photo scan used by game artwork.
- `scans/teddy.jpg` — repository photo scan used by game artwork.
- `scans/scan.ts` — makes the small repository scans from private source photos: `npx vite-node ../games/kit/scans/scan.ts` from `web/` (needs ffmpeg and cjpeg).

## Sound-stress diagnostic

[testdisks/sound-stress/README.md](testdisks/sound-stress/README.md) gives the build, check and floppy-image commands and the listening procedure. Physical PS/1 playback and audio timing are hardware-untested by these automated checks.

- `testdisks/sound-stress/README.md` — the diagnostic’s build, emulator, listening and verification instructions.
- `testdisks/sound-stress/audio.ts` — the deterministic nine-part CMF band and its instruments.
- `testdisks/sound-stress/build.ts` — writes the private diagnostic disk (`npx vite-node ../games/kit/testdisks/sound-stress/build.ts [--out <directory>]`).
- `testdisks/sound-stress/check.ts` — compares independent builds, walks both rooms and renders software OPL2 loops (`npx vite-node ../games/kit/testdisks/sound-stress/check.ts [--out <evidence directory>]`).
- `testdisks/sound-stress/disk.ts` — assembles diagnostic game files, pictures, help, rooms, music and effects.
- `testdisks/sound-stress/effects.ts` — four deterministic PCM effects, including the intentional 65,536-byte DOS boundary probe.
- `testdisks/sound-stress/floppy.ts` — makes a nonbootable 1.44 MB FAT12 image with the DOS runtime and notices.
- `testdisks/sound-stress/image.ts` — writes a new private floppy image and refuses replacement (`npx vite-node ../games/kit/testdisks/sound-stress/image.ts --out <new SOUNDTST.img>`).
- `testdisks/sound-stress/rooms.ts` — two flat rooms with one-shot effect pads, score pads and doors that reset the course.
