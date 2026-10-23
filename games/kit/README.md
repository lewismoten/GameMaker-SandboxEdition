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
- `sandlogo.ts` — the Sandbox Software logo sting every game's `title.lst` opens with (`SANDLOGO.FLI`), ray traced
  with `sdftext.ts` (extruded, beveled 3D lettering) and reduced to 256 colors with `quantize.ts` (median cut, ordered dither).
- `bard.ts` — The Bard of Bizarre's logo sting for his games' `title.lst` (`BARD.FLI`): stage curtains part on the logo,
  Doc Leo's photo pops in, a lute strums notes, the tagline types out, fade to black.
- `reel.ts` — FLI cartoons drawn in code, frame by frame: each reel opens on black, fades by palette alone and stores
  only what changed (run-coded line deltas), so a cartoon costs little more than its first picture.
- `photo.ts` — real photos for the endings: the small scans in `scans/` (made once from the owner's photos by
  `scans/scan.ts`) resized for VGA's tall pixels, given a picture's unused palette entries and dithered in; polaroid frames.
- `chez.ts` — THE CHEZ, the red CitiCar, as a two-block side view (or smaller, seen through a window) for a
  cameo in a game's lot or at its curb, drawn in the game's own palette; facing left shows the charge port for a cord.
- `tinHeart.ts` — the tin heart, a small riveted heart that ticks, as a 20x20 block in any game's palette, with a
  glint across its frames and a soft tick-tock on the PC speaker.
- `carlCameo.ts` — Carl the fly (A Fly Named Carl) as a guest in another game, drawn in the host game's palette.
- `saveSlots.ts` — where PLAYGAME writes the save names, marker and message on a game's load and save
  pictures, so a picture can leave dark and light strips under them.

Checking the games:

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
- `textfit.ts` — the text-fit audit: every screen where PLAYGAME draws text over a game's own pictures must
  have the text on plain paper with enough contrast. Run it with
  `cd web && npx vite-node ../games/kit/textfitCheck.ts <id> [--png <dir>] [--all]`.
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
