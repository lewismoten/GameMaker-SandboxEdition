// Palette templates preserve DOS slots, hardware counts, six-bit limits and independent copies.
import { describe, expect, it } from 'vitest';
import { PALETTE_PRESETS, createPalettePreset } from '@lewismoten/gamemaker-sandbox-tools/palettes';

const unique = (id: string, entries: number) => {
  const palette = createPalettePreset(id);
  return new Set(Array.from({ length: entries }, (_, i) => Array.from(palette.subarray(i * 3, i * 3 + 3)).join(','))).size;
};

describe('ready-made palette templates', () => {
  it('returns fresh DOS palettes with protected endpoints and valid filename stems', () => {
    expect(PALETTE_PRESETS).toHaveLength(20);
    expect(new Set(PALETTE_PRESETS.map((preset) => preset.id)).size).toBe(20);
    expect(Object.isFrozen(PALETTE_PRESETS)).toBe(true);
    for (const preset of PALETTE_PRESETS) {
      expect(preset.stem).toMatch(/^[a-z0-9_]{1,8}$/);
      const palette = createPalettePreset(preset.id);
      expect(palette.length).toBe(768);
      expect(palette.every((value) => value <= 63)).toBe(true);
      expect(palette.subarray(0, 3)).toEqual(Uint8Array.of(0, 0, 0));
      expect(palette.subarray(preset.entries * 3).every((value) => value === 0)).toBe(true);
      palette.fill(63);
      expect(createPalettePreset(preset.id)[0]).toBe(0);
      expect(Object.isFrozen(preset)).toBe(true);
    }
    expect(() => createPalettePreset('missing')).toThrow(RangeError);
  });
  it('keeps reference color counts and exact RGBI and two-bit channel mappings', () => {
    expect(PALETTE_PRESETS.find((preset) => preset.id === 'atari-ntsc')!.entries).toBe(128);
    expect(unique('atari-pal', 104)).toBe(104);
    expect(unique('nes', 54)).toBe(54);
    expect(unique('c64', 16)).toBe(16);
    expect(unique('websafe', 216)).toBe(216);
    expect(unique('sega', 64)).toBe(64);
    expect(createPalettePreset('ega').subarray(18, 21)).toEqual(Uint8Array.of(42, 21, 0));
    expect(createPalettePreset('sega').subarray(39, 42)).toEqual(Uint8Array.of(21, 63, 0));
    expect(unique('gameboy', 5)).toBe(5);
  });
  it('explains and preserves repeated 128-step grayscale within VGA limits', () => {
    expect(unique('gray-128', 128)).toBe(64);
    expect(createPalettePreset('gray-128').subarray(381, 384)).toEqual(Uint8Array.of(63, 63, 63));
    expect(PALETTE_PRESETS.find((preset) => preset.id === 'gray-128')!.description).toContain('64 distinct gray shades');
  });
});
