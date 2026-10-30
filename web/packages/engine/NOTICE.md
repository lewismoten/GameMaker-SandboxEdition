# Notices for @lewismoten/gamemaker-sandbox-engine

This package contains the browser game engine and audio worklet from
[Game-Maker: Sandbox Edition](https://github.com/lewismoten/GameMaker-SandboxEdition).
It is licensed under the MIT License; see [LICENSE](LICENSE). It contains no games,
site editor, DOS executables, or native player shells.

## Source and contributors

- **RSD Game-Maker** was created by G. Andrew (Andy) Stone, G. Oliver Stone,
  Oliver Stone Jr., and Joan Stone for Recreational Software Designs. Andy Stone
  released its source under the MIT License in 2014. The browser engine follows
  that source and its game file formats, including the behavior of its CMF music
  player. The original project is at
  [gandrewstone/GameMaker](https://github.com/gandrewstone/GameMaker).
- **Game-Maker: Sandbox Edition** is Lewis Moten's fork. Its TypeScript web port
  was written with Claude Opus 5.5 (Anthropic), directed and reviewed by Lewis.
  This npm package was extracted and documented with OpenAI Codex (GPT-6) in
  Visual Studio Code, directed by Lewis.

## Data, formats, and hardware

- **8×8 text font:** `font8x8_basic`, `font8x8_ext_latin`, `font8x8_misc`, and
  `font8x8_greek` by Daniel Hepper are public domain. They supply the ASCII and
  selected code page 437 glyphs in the engine. The other glyphs were drawn for
  this project. [Source](https://github.com/dhepper/font8x8).
- **GIF:** Graphics Interchange Format is a format and trademark of CompuServe
  Incorporated. The engine implements GIF decoding from the format description.
- **FLI:** Autodesk Animator's animation format, implemented from its public
  documentation. Autodesk Animator is a product of Autodesk, Inc.
- **Sound Blaster formats:** CMF, VOC, and SBI are Creative Technology Ltd.
  formats. The CMF player follows RSD Game-Maker's `SBMUSIC.C` and the behavior
  of Creative's SBFMDRV driver. The VOC decoder's Creative ADPCM tables refer
  to the Sound Blaster DSP behavior documented in
  [DOSBox's `sblaster.cpp`](https://github.com/joncampbell123/dosbox-x/blob/master/src/hardware/sblaster.cpp)
  (GPL-2.0-or-later).
- **OPL2 / YM3812:** Yamaha Corporation's FM synthesis chip. The engine's
  emulation was written for this project from the chip's published register
  documentation.

The package does not bundle DOSBox, Creative software, or Autodesk software.
