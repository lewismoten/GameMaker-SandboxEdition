// Fresh native palette templates; reference swatches and licenses are documented in ../NOTICE.md.
import type { Palette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { colorRamp, type RGB } from './colors';
import { ATARI_NTSC_RGB, ATARI_PAL_RGB, NES_RGB, C64_RGB } from './palettePresetData';

export interface PalettePreset {
  readonly id: string;
  readonly name: string;
  readonly stem: string;
  /** Occupied entries, including menu black; index 255 is always reserved. */
  readonly entries: number;
  readonly description: string;
}
interface Spec extends PalettePreset {
  colors: () => readonly RGB[];
}
const hex = (text: string): RGB[] =>
  text
    .trim()
    .split(/\s+/)
    .map((color) => [0, 2, 4].map((at) => parseInt(color.slice(at, at + 2), 16)) as [number, number, number]);
const gray = (count: number): RGB[] => colorRamp(count, [0, 0, 0], [255, 255, 255]);
const ega = (): RGB[] =>
  Array.from({ length: 16 }, (_, i) => (i === 6 ? [170, 85, 0] : ([4, 2, 1].map((bit) => (i & bit ? 170 : 0) + (i & 8 ? 85 : 0)) as [number, number, number])));
const spec = (id: string, name: string, stem: string, entries: number, description: string, colors: Spec['colors']): Spec => ({
  id,
  name,
  stem,
  entries,
  description,
  colors,
});

const SPECS: readonly Spec[] = [
  spec('amber', 'Monochrome amber', 'monoamb', 32, '32 shades from black to warm amber.', () => colorRamp(32, [0, 0, 0], [255, 184, 48])),
  spec('green', 'Monochrome green', 'monogrn', 32, '32 shades from black to phosphor green.', () => colorRamp(32, [0, 0, 0], [64, 255, 96])),
  spec('white', 'Monochrome white', 'monowht', 32, '32 shades from black to white.', () => gray(32)),
  spec('atari-ntsc', 'Atari 2600 NTSC', 'atntsc', 128, '128 TIA color slots, using Ricardo Cancho Niemietz’s RGB reference approximation.', () =>
    hex(ATARI_NTSC_RGB),
  ),
  spec('atari-pal', 'Atari 2600 PAL', 'atpal', 104, '104 colors after removing repeated gray columns from the PAL reference.', () => hex(ATARI_PAL_RGB)),
  spec('nes', 'NES · 54 colors', 'nes54', 54, 'Persune’s unemphasized 2C02G US reference, adapted to VGA.', () => hex(NES_RGB)),
  spec('cga-cyan', 'CGA cyan / magenta', 'cga0', 4, 'Black, bright cyan, bright magenta and white.', () => [ega()[0], ega()[11], ega()[13], ega()[15]]),
  spec('cga-green', 'CGA green / red / brown', 'cga1', 4, 'Black, green, red and orange-brown, with the RGBI brown correction.', () => [
    ega()[0],
    ega()[2],
    ega()[4],
    ega()[6],
  ]),
  spec('ega', 'EGA · 16 colors', 'ega16', 16, 'The standard 16 RGBI colors, with brown corrected.', ega),
  spec('ega-skin', 'EGA + skin tones & hair', 'egaskin', 28, 'The 16 EGA colors plus three project-designed four-color skin and hair ramps.', () => [
    ...ega(),
    ...colorRamp(4, [92, 48, 28], [255, 226, 194]),
    ...colorRamp(4, [46, 26, 22], [163, 107, 74]),
    ...colorRamp(4, [20, 15, 15], [158, 123, 60]),
  ]),
  spec('gameboy', 'Game Boy greens', 'gbgreen', 5, 'Four project-designed LCD greens, plus black at index 0 for menus.', () =>
    colorRamp(4, [20, 52, 20], [188, 212, 96]),
  ),
  spec('sega', 'Sega Master System · 64 colors', 'sms64', 64, 'SMS2 RGB colors: two bits per channel.', () =>
    Array.from({ length: 64 }, (_, i) => [(i & 3) * 85, ((i >> 2) & 3) * 85, ((i >> 4) & 3) * 85]),
  ),
  spec('c64', 'Commodore 64 · 16 colors', 'c64ntsc', 16, 'Groepaz’s NTSC CXA2025 reference, with menu black normalized.', () => hex(C64_RGB)),
  spec('websafe', 'Web-safe · 216 colors', 'websafe', 216, 'The six-level RGB cube, rounded to VGA’s channel levels.', () =>
    Array.from({ length: 216 }, (_, i) => [Math.floor(i / 36) * 51, (Math.floor(i / 6) % 6) * 51, (i % 6) * 51]),
  ),
  ...[4, 8, 16, 32, 64, 128].map((count) =>
    spec(
      `gray-${count}`,
      `Grayscale · ${count} steps`,
      `gray${count}`,
      count,
      count === 128 ? '128 steps; VGA can represent 64 distinct gray shades, so adjacent steps repeat.' : `${count} evenly spaced gray shades.`,
      () => gray(count),
    ),
  ),
];

export const PALETTE_PRESETS: readonly PalettePreset[] = Object.freeze(SPECS.map(({ colors: _colors, ...metadata }) => Object.freeze(metadata)));

/** A fresh 768-byte VGA palette. Black is moved to index 0; unused entries and 255 are black. */
export function createPalettePreset(id: string): Palette {
  const preset = SPECS.find((item) => item.id === id);
  if (!preset) throw new RangeError(`Unknown palette preset: ${id}`);
  const colors = [...preset.colors()];
  const black = colors.findIndex((color) => color.every((component) => component === 0));
  if (black >= 0) colors.splice(black, 1);
  colors.unshift([0, 0, 0]);
  const palette = new Uint8Array(768);
  colors.slice(0, 255).forEach((color, i) =>
    palette.set(
      color.map((component) => Math.round((component * 63) / 255)),
      i * 3,
    ),
  );
  return palette;
}
