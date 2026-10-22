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
  `song/cutclips.py` (VOC clips) read a recording that is not in the repo; each game's tools name the song.
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
- `saveSlots.ts` — where PLAYGAME writes the save names, marker and message on a game's load and save
  pictures, so a picture can leave dark and light strips under them.

Checking the games:

- `sceneSim.ts` — a headless copy of PLAYGAME's main loop for one scene, built from the build's own data
  (no disk). The bots of teddy, teddy2, logic and brief play on it.
- `gameSim.ts` — a headless PLAYGAME that plays a built disk scene after scene (links, deaths, the ending),
  keeps the keys per scene and can snapshot and restore. depth, realm and snowbound play on it.
- `walkthrough.ts` — writes a game's `walkthrough.json` from its bot's keys, after replaying them on the web
  app's real engine to check the run reaches the ending and to time its chapters.
- `textfit.ts` — the text-fit audit: every screen where PLAYGAME draws text over a game's own pictures must
  have the text on plain paper with enough contrast. Run it with
  `cd web && npx vite-node ../games/kit/textfitCheck.ts <id> [--png <dir>] [--all]`.
- `png.ts` — a PNG writer and block sheets for design previews (used by the games' `tools/`, never on a disk).

`cdDemos/` is apart from the Sandbox games: a curious bot (`bot.ts`, `probe.ts`) that plays any Game-Maker
game on the real engine run headless (`headless.ts`), used by `make.ts` to record title demos for the CD
games that shipped without one (`cd web && npx vite-node ../games/kit/cdDemos/make.ts [ids…]`).
