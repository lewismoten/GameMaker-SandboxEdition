# `formats/`: Game-Maker's file formats

Integration tests remain here. The implementation now belongs to the [engine workspace](../../packages/engine/README.md), under `src/formats/`. Part of the [source map](../README.md).

The package's `src/formats/` modules read and write Game-Maker's native files
(`.gam .pal .bbl/.mbl/.cbl .chr .mon .map .snd .his .rec .bkd .lst`) and its GIF, FLI, CMF
and VOC media. `graphicScripts.ts` reads text-screen lines; `binary.ts` supplies byte-string
helpers. JPEG support for the BBS's pictures is decoding only, not a JPEG writer. The binary
helpers follow Borland C++ 16-bit layout: `int` is 2 bytes and structs are byte-packed.
These filenames are relative to the package's `src/formats/`, not this test directory.

- `cmfSong.ts`, `cmfEdit.ts` and `cmfPreview.ts` are the music editor's model of a CMF song;
  `fliFrames.ts` an `.FLI` as whole frames for editing; `fliLimits.ts` what DOS can play.
- `gifProgressive.ts` and `jpeg.ts` decode a picture as its bytes arrive (the BBS's downloads). JPEG visibility follows completed MCU blocks; partial refinement blocks keep the prior scan's coefficients. The package README documents the incremental result.
