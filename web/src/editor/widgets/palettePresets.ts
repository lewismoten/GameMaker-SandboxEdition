// The palette templates the file picker offers, named on their own: the picker imports this file
// when it lists them. Importing the tools package's ./palettes on demand instead would make the
// bundler keep every export of that module wherever it is first loaded, and editor/core/project.ts
// loads it up front for the new project's default palette (the home page, the desk and dos.html).
export { PALETTE_PRESETS, createPalettePreset } from '@lewismoten/gamemaker-sandbox-tools/palettes';
