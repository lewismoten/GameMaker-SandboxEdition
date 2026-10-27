# `vga/`: Game-Maker's designers

Part of the [source map](../README.md).

Game-Maker's eight designers ported from their C source (PALCHOS, BLOCEDIT,
MONEDIT, MAPMAKER, CHAREDIT, IMAGE, SNDEDIT, GRATOR). One file per `.EXE` at the top (each exports
`program`; `retro/gm.ts` finds them with `import.meta.glob`); a large designer's parts are in a
folder of the same name (`layout.ts` its tables, `state.ts` its globals, then layers such as
`screen.ts` and `paint.ts`), and `shared/` has the VGA screen (`vga.ts`), block routines
(`blocc.ts`), the title and Design bars (`designer.ts`) and Game-Maker's look (`facelift.ts`).
