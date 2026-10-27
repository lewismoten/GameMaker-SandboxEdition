# `formats/`: Game-Maker's file formats

Part of the [source map](../README.md).

Readers and writers for every Game-Maker file
(`.gam .pal .bbl/.mbl/.cbl .chr .mon .map .snd .his .rec .bkd .lst .txt`) and the standard ones
it uses (`.gif .fli .cmf .voc`, and `.jpg` for the BBS's pictures). Borland C++ 16-bit layout:
`int` is 2 bytes, structs are byte-packed (`binary.ts`).

- `cmfSong.ts`, `cmfEdit.ts` and `cmfPreview.ts` are the music editor's model of a CMF song;
  `fliFrames.ts` an `.FLI` as whole frames for editing; `fliLimits.ts` what DOS can play.
- `gifProgressive.ts` and `jpeg.ts` decode a picture as its bytes arrive (the BBS's downloads).
