# Notices

This development toolkit is extracted from Game-Maker: Sandbox Edition by Lewis Moten, released under the MIT License. It includes the fork's native format codecs, drawing and audio builders, and headless reference simulation.

The reference engine is a TypeScript port of RSD Game-Maker 3.0 by Recreational Software Designs: G. Andrew Stone, G. Oliver Stone, Oliver Stone Jr. and Joan Stone. Andy Stone released the original source under the MIT License in 2014. The original copyright notice is retained in LICENSE. Peter Savage wrote the original Sound Blaster voice-file and joystick routines.

## Fonts

- **8×8 ASCII and selected CP437 glyphs:** Daniel Hepper's [font8x8](https://github.com/dhepper/font8x8), specifically `font8x8_basic`, `font8x8_ext_latin`, `font8x8_greek`, and `font8x8_misc`. Each upstream header declares **Public Domain** and credits **Marcel Sondaar** and **International Business Machines (public domain VGA fonts)** as its basis. See the [upstream source header](https://github.com/dhepper/font8x8/blob/master/font8x8_basic.h). This data is used in `web/src/gfx/font8x8.ts` and the marked entries of `web/src/gfx/cp437Glyphs.ts`, exposed here through `FONT8X8` and `FONT_CP437`.
- **Additional CP437 glyphs:** the other symbols and box-drawing glyphs in `web/src/gfx/cp437Glyphs.ts` were drawn for Game-Maker: Sandbox Edition using **Anthropic Claude Opus 5.5**, under **Lewis Moten's** direction, and are distributed under the project's **MIT License**. These additions were not copied from IBM's ROM; the full 256-glyph table combines them with the public-domain data above.
- **3×5 micro font (`MICRO_GLYPHS`):** the project's small sign font, introduced in `games/teddy/draw.ts` by **Lewis Moten using Anthropic Claude Opus 5.5**, then maintained in `games/teddy/src/art/draw.ts`. Its provenance is recorded in [commit 7241036f49cab9dea52f58541e30ce6c9ce86052](https://github.com/lewismoten/GameMaker-SandboxEdition/commit/7241036f49cab9dea52f58541e30ce6c9ce86052). It is distributed under the project's **MIT License**, not the public-domain dedication of Hepper's font. **OpenAI Codex (GPT-6/6.1)** extracted the table into this toolkit's `src/microFont.ts` and added the reusable rendering APIs under Lewis's direction.

## Other formats and tooling

The lighting presets were written for this project. GIF, FLI, Creative Voice File, Creative Music File, and ZIP/PNG support follow their respective file formats; CRC-32 uses the reflected polynomial 0xEDB88320.

The underlying web port and game-building tools were written with Anthropic Claude Opus 5.5 under Lewis Moten's direction. OpenAI Codex (GPT-6/6.1) prepared the toolkit packaging, consumer migration, documentation, and verification under his direction.

No game-specific artwork, palettes, characters, recordings, or complete games are included. Consumers supply and credit their own content.
