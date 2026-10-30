# Notices

This development toolkit is extracted from Game-Maker: Sandbox Edition by Lewis Moten, released under the MIT License. It owns the drawing and audio builders and headless reference simulation; shared native format codecs, runtime types and CP437 font data come through its declared engine dependency, and archive support through its declared archives dependency.

The reference engine is a TypeScript port of RSD Game-Maker 3.0 by Recreational Software Designs: G. Andrew Stone, G. Oliver Stone, Oliver Stone Jr. and Joan Stone. Andy Stone released the original source under the MIT License in 2014. The original copyright notice is retained in LICENSE. Peter Savage wrote the original Sound Blaster voice-file and joystick routines.

## Fonts

- **8×8 ASCII and selected CP437 glyphs:** Daniel Hepper's [font8x8](https://github.com/dhepper/font8x8), specifically `font8x8_basic`, `font8x8_ext_latin`, `font8x8_greek`, and `font8x8_misc`. Each upstream header declares **Public Domain** and credits **Marcel Sondaar** and **International Business Machines (public domain VGA fonts)** as its basis. See the [upstream source header](https://github.com/dhepper/font8x8/blob/master/font8x8_basic.h). This data is used in `web/packages/engine/src/gfx/font8x8.ts` and the marked entries of `web/packages/engine/src/gfx/cp437Glyphs.ts`, exposed here through `FONT8X8` and `FONT_CP437`.
- **Additional CP437 glyphs:** the other symbols and box-drawing glyphs in `web/packages/engine/src/gfx/cp437Glyphs.ts` were drawn for Game-Maker: Sandbox Edition using **Anthropic Claude Opus 5.5**, under **Lewis Moten's** direction, and are distributed under the project's **MIT License**. These additions were not copied from IBM's ROM; the full 256-glyph table combines them with the public-domain data above.
- **3×5 micro font (`MICRO_GLYPHS`):** the project's small sign font, introduced in `games/teddy/draw.ts` by **Lewis Moten using Anthropic Claude Opus 5.5**, then maintained in `games/teddy/src/art/draw.ts`. Its provenance is recorded in [commit 7241036f49cab9dea52f58541e30ce6c9ce86052](https://github.com/lewismoten/GameMaker-SandboxEdition/commit/7241036f49cab9dea52f58541e30ce6c9ce86052). It is distributed under the project's **MIT License**, not the public-domain dedication of Hepper's font. **OpenAI Codex (GPT-6/6.1)** extracted the table into this toolkit's `src/microFont.ts` and added the reusable rendering APIs under Lewis's direction.

## Other formats and tooling

The lighting presets were written for this project. GIF, FLI, Creative Voice File, Creative Music File, and ZIP/PNG support follow their respective file formats; CRC-32 uses the reflected polynomial 0xEDB88320.

The underlying web port and game-building tools were written with Anthropic Claude Opus 5.5 under Lewis Moten's direction. OpenAI Codex (GPT-6/6.1) prepared the toolkit packaging, consumer migration, documentation, and verification under his direction.

No game-specific artwork, palettes, characters, recordings, or complete games are included. Consumers supply and credit their own content.

## Optional source audio conversion

`audio-files` invokes an independently installed [FFmpeg](https://ffmpeg.org/) executable
by the FFmpeg developers; no FFmpeg code or binary is included in this package. FFmpeg is
LGPL-2.1-or-later, or GPL-2.0-or-later when its GPL components are enabled; see its
[licensing information](https://ffmpeg.org/legal.html). FLAC is the lossless audio format
maintained by Xiph.Org; its [FAQ](https://xiph.org/flac/faq.html) describes sample-exact
compression. The process wrapper and VOC conversion APIs were implemented with OpenAI
Codex under Lewis Moten's direction, using this project's existing native VOC encoder.

The native mono 8-bit PCM WAV reader uses RIFF/WAVE chunk layout and PCM format fields
from [Microsoft's WAVEFORMATEX documentation](https://learn.microsoft.com/en-us/windows/win32/api/mmeapi/ns-mmeapi-waveformatex).
No Microsoft implementation code is included. The reader was implemented with OpenAI
Codex under Lewis Moten's direction and is distributed under this project's MIT License.

## Additional micro-font glyphs and variants

The extended rounded repertoire and square technical-label variant are project-owned
font data by Lewis Moten using Anthropic Claude Opus 5.5, under this project's MIT License.
They consolidate the existing tables in the public games' art helpers (including the
expanded punctuation in `games/brief/src/art/draw.ts` and `games/blaster/src/art/draw.ts`,
and the cent sign in `games/year2000/src/art/font.ts`). The square face originated in
[the original Ohm Sweet Ohm drawing helpers](https://github.com/lewismoten/GameMaker-SandboxEdition/commit/1a746bffa).
OpenAI Codex consolidated the data and APIs under Lewis Moten's direction.
These fonts are distinct from the separately credited public-domain CP437 glyphs above.

## Shared rendering methods and stroke lettering

The rounded stroke lettering in `kit/sdftext` is project font data by Lewis Moten using
Anthropic Claude Opus 5.5, introduced with the original software-rendered logo helpers
([source commit](https://github.com/lewismoten/GameMaker-SandboxEdition/commit/7bb0e7b7c)).
It is distributed under the project's MIT License, alongside the project-owned rendering,
quantization, synthesis and object-building code extracted from `games/kit`. OpenAI Codex
consolidated these modules and their consumers under Lewis Moten's direction.

Method references: Paul S. Heckbert, *Color Image Quantization for Frame Buffer Display*
([author's publication list](https://www.cs.cmu.edu/~ph/)), for median-cut quantization;
John C. Hart, *Sphere Tracing: A Geometric Method for the Antialiased Ray Tracing of
Implicit Surfaces* ([paper](https://graphics.stanford.edu/courses/cs348b-20-spring-content/uploads/hart.pdf)),
for distance-based sphere tracing. The implementations and project font data here use
the project's MIT License.

## Original CD Library palette

`src/palettes.ts` embeds a byte-for-byte copy of `cd/gameware/library/default.pal`
from the original RSD Game-Maker CD, by Recreational Software Designs (G. Andrew
Stone, G. Oliver Stone, Oliver Stone Jr. and Joan Stone). It is distributed under
the original project's MIT License; this package retains that license in `LICENSE`.
[Source palette](https://github.com/lewismoten/GameMaker-SandboxEdition/blob/master/cd/gameware/library/default.pal).
OpenAI Codex packaged this data and the fresh-copy API under Lewis Moten's direction.

## Ready-made palette reference data

`src/palettePresetData.ts` contains RGB swatches adapted to six-bit VGA by OpenAI Codex
under Lewis Moten's direction. Analog console colors are reference approximations, not
a claim that every television or hardware revision produces identical RGB. No third-party
font, image, emulator or generator executable is bundled with these swatches.

- Atari 2600 NTSC and PAL: Ricardo Cancho Niemietz, 2008, released by the author into the
  public domain (with unrestricted-use fallback). Swatches sampled at the centers of the
  16×8 color charts; NTSC retains 128 hardware slots, including one duplicated RGB value;
  PAL's repeated gray columns are removed to give 104 slots. Sources and release statements:
  [NTSC](https://commons.wikimedia.org/wiki/File:Atari2600_NTSC_palette.png),
  [PAL](https://commons.wikimedia.org/wiki/File:Atari2600_PAL_palette.png).
- NES: Persune, Pally, MIT No Attribution (MIT-0), copyright 2024 Persune. The first 64 RGB
  entries (no emphasis) of `docs/NESDev/2C02G_U_wiki.pal` are reduced to 54 distinct swatches.
  [Source at commit 9635e9b71505f969014c7efa15dca3ba35ade871](https://github.com/Gumball2415/pally/blob/9635e9b71505f969014c7efa15dca3ba35ade871/docs/NESDev/2C02G_U_wiki.pal),
  [license](https://github.com/Gumball2415/pally/blob/9635e9b71505f969014c7efa15dca3ba35ade871/LICENSE).
- Commodore 64 NTSC CXA2025 reference: Groepaz, unrestricted free use, including
  redistribution, commercial use and modification; attribution appreciated. Sixteen
  color-bar centers sampled from the reference, with color 0 normalized to menu black.
  [Author's reference](https://hitmen.c02.at/linked/c64_ntsc_cxa2025.bmp.png),
  [permission and provenance](https://commons.wikimedia.org/wiki/File:C64_ntsc_cxa2025.bmp.png).

Pally's MIT-0 license:

```text
MIT No Attribution

Copyright 2024 Persune

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify,
merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
