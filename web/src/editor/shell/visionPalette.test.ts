import { describe, expect, it } from 'vitest';
import { visionPalette } from './visionPalette';

const flat = new Uint8Array(768);
const varied = Uint8Array.from({ length: 768 }, (_, i) => i % 64);

describe('visionPalette', () => {
  const files: Record<string, Uint8Array> = { 'dark.pal': flat, 'day.pal': varied };
  const get = (n: string) => files[n];
  it('skips a one-color palette', () => expect(visionPalette(['dark.pal', 'day.pal'], get)).toBe('day.pal'));
  it('keeps the first when it has colors', () => expect(visionPalette(['day.pal', 'dark.pal'], get)).toBe('day.pal'));
  it('falls back to the first when all are one color', () => expect(visionPalette(['dark.pal'], get)).toBe('dark.pal'));
  it('has none for no palettes', () => expect(visionPalette([], get)).toBeUndefined());
});
