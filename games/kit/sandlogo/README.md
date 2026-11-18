# Sandbox logo sting

`../sandlogo.ts` keeps the public `SANDLOGO` file name and `sandLogoFli()` encoder.
The sting is a software ray-traced sandbox on a checkered lawn under a cloudy sky.
A shovel pats the sand, colored beveled letters drop in, SOFTWARE zooms in, and
highlights and star glints precede the fade to black. Its 54 frames preserve the
walkthrough timelines. Still areas are cached so the FLI stores only changes.

| File | Responsibility |
| --- | --- |
| `settings.ts` | Camera, frame dimensions and animation timing |
| `materials.ts` | Sand, wood and toy-plastic surfaces |
| `scene.ts` | Static sandbox, sand castle and pail geometry |
| `motion.ts` | Shovel, sand puffs, flag and moving/resting part states |
| `lettering.ts` | Extruded letter shapes, BBS colors, falling motion and highlight |
| `render.ts` | Sky, lawn, lighting, ray tracing, cached layers and star glints |
| `software.ts` | Flat SOFTWARE overlay and its reserved palette entries |
| `frames.ts` | Frame quantization, palette fades and animation cache |

Geometry and rendering use the tools package's `raytrace` and `sdftext` modules;
`quantize` supplies median-cut palettes and ordered dithering. The entry encodes
an Autodesk Animator FLI with its own palette, suitable for `sandlogo.fli 0` in a
game's title slide show. The build can supply the shared render through
`SANDLOGO_FLI`; the entry retains its in-process cache and rendering fallback.
