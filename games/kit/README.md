# games/kit

Helpers for building the original games in `games/<id>/` in code. Each game has a
`build.ts` that draws its blocks, lays out its maps, composes its music and writes every
file through the same format code the web app reads (`web/src/formats`), into
`games/<id>/disk/`. Run one with:

```sh
cd web && npx vite-node ../games/<id>/build.ts
```

- `pixels.ts` — an indexed-color canvas for 20x20 blocks and 320x200 screens, seeded randomness, dithering.
- `palette.ts` — named color ramps for a 256-color VGA palette.
- `music.ts` — FM instruments and note strings → Sound Blaster `.CMF` songs.
- `sound.ts` — PC speaker sounds for `.SND` sets, and synthesized `.VOC` samples.
- `disk.ts` — writes the files with DOS 8.3 names and DOS text.
- `sandlogo.ts` — the Sandbox Software logo sting every game's `title.lst` opens with (`SANDLOGO.FLI`), ray traced
  with `sdftext.ts` (extruded, beveled 3D lettering) and reduced to 256 colors with `quantize.ts` (median cut, ordered dither).
- `photo.ts` — real photos for the endings: the small scans in `scans/` (made once from the owner's photos by
  `scans/scan.ts`) resized for VGA's tall pixels, given a picture's unused palette entries and dithered in; polaroid frames.
- `png.ts` — a PNG writer and block sheets for design previews (used by the games' `tools/`, never on a disk).
