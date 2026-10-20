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
