# games/kit

Helpers for building the original games in `games/<id>/` in code. Each game has a
`build.ts` that draws its blocks, lays out its maps, composes its music and writes every
file through the same format code the web app reads (`web/src/formats`), into
`games/<id>/disk/`. Run one with:

```sh
cd web && npx vite-node ../games/<id>/build.ts
```

Making the files:

- `pixels.ts` — an indexed-color canvas for 20x20 blocks and 320x200 screens, seeded randomness, dithering.
- `palette.ts` — named color ramps for a 256-color VGA palette.
- `music.ts` — FM instruments and note strings → Sound Blaster `.CMF` songs.
- `teddyTheme.ts` — Teddy's Theme, the melody the Teddy games share (and the Cast page plays, from teddy's `title.cmf`).
- `song.ts` — the Bard of Bizarre games' OPL2 arrangement writer: patches, drum grooves, and sections (a chord or two and a
  bar of tune each) laid out as tune, second voice, bass, three comping voices and drums; `songPreview.ts` renders a game's
  songs on the web app's OPL2 and checks them. `song/analyze.py` (tempo, key, chords, sections, sung melody) and
  `song/cutclips.py` (VOC clips; slow cues and splices kept at a lower rate) read a recording that is not in the repo;
  each game's tools name the song.
- `songFx.ts` — tricks for those arrangements that stay plain CMF events PLAYGAME and SBFMDRV play: swells and filter
  sweeps under held chords by program changes through copies of a patch (more than 16 timbres: extra patches from 16 up),
  the rhythm section's bass drum tuned as a sub bass (a seventh melodic voice) and tuned toms, one-channel arpeggios and
  ringing harps, stepped glides (no pitch bend), a two-voice choir from vibrato twins, echoes, stutters, rolls and section
  markers (controller 0x66). Loaf #13's `src/sound/song.ts` uses all of them.
- `sound.ts` — PC speaker sounds for `.SND` sets, and synthesized `.VOC` samples.
- `disk.ts` — writes the files with DOS 8.3 names and DOS text.
- `license.ts` — `LICENSE.TXT` for every disk (what's real, what's story, the MIT License), in 30-column pages.
- `sandlogo.ts` — the Sandbox Software logo sting every game's `title.lst` opens with (`SANDLOGO.FLI`): a sandbox with a
  sand castle, a red pail and a blue shovel that pats the sand, then -= S A N D B O X =- drops in, a letter at a time, in
  THE SANDBOX BBS colors over chrome SOFTWARE. Ray traced with `raytrace.ts` (boxes, cones, discs, spheres, capsules and
  triangles, Phong shading, hard shadows; only what moves is traced again each frame) and `sdftext.ts` (extruded, beveled
  3D lettering), and reduced to 256 colors with `quantize.ts` (median cut, ordered dither).
- `madewith.ts` — the "Made with Game-Maker: Sandbox Edition" sting the web editor offers new games (not a Sandbox game's):
  yellow GAME-MAKER letters drop onto a floor of the site's blue blocks between MADE WITH and SANDBOX EDITION, then fade.
  Ray traced like `sandlogo.ts`; run it once (`cd web && npx vite-node ../games/kit/madewith.ts`, `PREVIEW=<folder>` for
  frame PNGs) to write `web/public/opening/madewith.fli` and its still `madewith.gif`, which the app ships. The web app
  never imports it.
- `bard.ts` — The Bard of Bizarre's logo sting for his games' `title.lst` (`BARD.FLI`): stage curtains part on the logo,
  Doc Leo's photo pops in, a lute strums notes, the tagline types out, fade to black.
- `reel.ts` — FLI cartoons drawn in code, frame by frame: each reel opens on black, fades by palette alone and stores
  only what changed (run-coded line deltas), so a cartoon costs little more than its first picture. `irisOut` closes a round
  iris on a spot (a cartoon made of the title's own art ends on a view that isn't the title), then `fadeOut`.
- `fadeOut.ts` — the fade to black an intro ends on before its title picture (PLAYGAME cuts an FLI's last frame
  straight to black): `encodeFliFadeOut` adds about half a second of palette-only frames to a plain frame list (a Reel
  has `fadeOut`).
- `photo.ts` — real photos for the endings: the small scans in `scans/` (made once from the owner's photos by
  `scans/scan.ts`) resized for VGA's tall pixels, given a picture's unused palette entries and dithered in; polaroid frames.
- `chez.ts` — THE CHEZ, the red CitiCar, as a two-block side view (or smaller, seen through a window) for a
  cameo in a game's lot or at its curb, drawn in the game's own palette; facing left shows the charge port for a cord.
- `tinHeart.ts` — the tin heart, a small riveted heart that ticks, as a 20x20 block in any game's palette, with a
  glint across its frames and a soft tick-tock on the PC speaker; `looksLikeTinHeart` knows the block in any palette.
- `tinHearts.ts` / `tinHeartDisk.ts` — the tin heart hunt: writes web/src/tinHearts/hearts.json from each about.json
  `"tinHeart"`, finds a heart on a disk, and checks it is there and found when touched (recipe: `TIN-HEARTS.md`).
- `cameos.ts` — Mystery Robot Joe, Watt, Will and Teenage Lewie drawn by their own games and recolored into
  another game's palette (`TIN-HEARTS.md`, "Cameos").
- `easterEgg.ts` — the decorated Easter egg, a painted egg block in any game's palette, hidden like the tin heart.
- `carlCameo.ts` — Carl the fly (A Fly Named Carl) as a guest in another game, drawn in the host game's palette.
- `saveSlots.ts` — where PLAYGAME writes the save names, marker and message on a game's load and save
  pictures, so a picture can leave dark and light strips under them.

Checking the games:

- `checkGames.ts` — `cd web && npm run check:games`: every game's checks, one game at a time, and a table; exits 1 on
  any failure. Per game: a rebuild into a temp folder (`GAME_DISK_OUT`) that must match the committed `disk/` byte for
  byte and cut off no text (`textBounds.ts`), `tools/check.ts`, `walkCheck.ts`, `textfitCheck.ts`, `hiddenView.ts` and `levelCheck.ts`; then `tinHearts.ts check`
  and `syncCheck.ts` once. `--game <id>` (repeatable), `--quick` (no rebuild compare), `--no-level`, `--verbose`, and `--play`
  (also lists each game's play findings from `levelCheck.ts --play`; slow, and never fails). Secret games are left
  out unless named.
- `walkCheck.ts` — replays a committed `walkthrough.json` on the real engine: it must reach the ending with the frames and
  chapter marks it was recorded with, and cut off no clip.
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
- `syncCheck.ts` — `levelSecrets.json` and every box's play hours are current (what `scripts/levelSecrets.ts` and
  `playtime.ts` would write), and `levelViews.json` was scanned from the game's disk and walkthrough as they are now
  (else rerun `npx vite-node scripts/levelViews.ts <id>`), without writing anything.
- `sceneSim.ts` — a headless copy of PLAYGAME's main loop for one scene, built from the build's own data
  (no disk). The bots of teddy, teddy2, logic and brief play on it.
- `gameSim.ts` — a headless PLAYGAME that plays a built disk scene after scene (links, deaths, the ending),
  keeps the keys per scene and can snapshot and restore. depth, realm and snowbound play on it.
  `diskSim(new URL('../disk', import.meta.url))` is a game's whole `tools/sim.ts`.
- `hopBot.ts` — the play-testing bot of the games whose hero hops (walk to a column hopping what blocks it, hop
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
  walkthrough walks the roads instead of cutting across. Realm's build writes its roads and streets; its
  `tools/check.ts` and `tools/walkthrough.ts` set `bot.keepTo`.
- `textfit.ts` — the text-fit audit: every screen where PLAYGAME draws text over a game's own pictures must
  have the text on plain paper with enough contrast. Run it with
  `cd web && npx vite-node ../games/kit/textfitCheck.ts <id> [--png <dir>] [--all]`.
- `textBounds.ts` — no text cut off at the edge of its picture: the games' text helpers (`text`, `micro`, a canvas's
  `text`) report each string's ink, and a build run with `TEXT_BOUNDS=<file>` writes every string that runs past its
  picture (or a clip area the helper was given) and is never shown whole there; a scroll or a drop-in shown whole in
  another frame is fine. Off, it changes no pixel. `cd web && npx vite-node ../games/kit/textBoundsCheck.ts [<id>...]
[--moving]` builds into a temp folder and lists them; `checkGames.ts` reads it from its rebuild (the `bounds` column).
  A text helper in a new game should report its ink the same way (`textInk(p, s)`, `add`, `end`).
- `clips.ts` — does every digitized clip play to the end? A walkthrough's run, with its sound written down, checked
  for a clip cut off by the scene ending or by the next sound; `walkthrough.ts` runs it on every
  walkthrough it writes (failing on a cut clip when the game asks), and `cd web && npx vite-node ../games/kit/clipCheck.ts <id>...` runs it alone.
- `align.ts` — multi-block objects (trees, houses, cars, signs): every map puts their parts together, and the art
  joins up across block edges. Each game's `tools/align.ts` names its objects; its `tools/check.ts` runs it.
- `playtime.ts` — sets each box's "Over N hours of gameplay!" (`about.json` `box.hours`) from the walkthroughs:
  `cd web && npx vite-node ../games/kit/playtime.ts` after any walkthrough changes.
- `png.ts` — a PNG writer and block sheets for design previews (used by the games' `tools/`, never on a disk).

`cdDemos/` is apart from the Sandbox games: a curious bot (`bot.ts`, `probe.ts`) that plays any Game-Maker
game on the real engine run headless (`headless.ts`), used by `make.ts` to record title demos for the CD
games that shipped without one (`cd web && npx vite-node ../games/kit/cdDemos/make.ts [ids…]`).
