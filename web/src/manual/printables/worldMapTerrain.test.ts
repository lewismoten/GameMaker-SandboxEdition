// The World Map's land: countries from colors, and coasts drawn the same every time.
import { describe, expect, it } from 'vitest';
import { blobPath, hsl, lookOf, mix, terrainOf } from './worldMapTerrain';

describe('World Map terrain', () => {
  it('reads a country from a color', () => {
    expect(terrainOf(0x1f6b2a)).toBe('forest');
    expect(terrainOf(0x6fc04a)).toBe('grass');
    expect(terrainOf(0x2a64c8)).toBe('water');
    expect(terrainOf(0xe8d090)).toBe('sand');
    expect(terrainOf(0x7a5230)).toBe('rock');
    expect(terrainOf(0xf4f6fa)).toBe('snow');
    expect(terrainOf(0xd8301c)).toBe('ember');
    expect(terrainOf(0x050510)).toBe('night');
    expect(terrainOf(0xb8b8b8)).toBe('town');
    expect(hsl(0xff0000)).toEqual([0, 1, 0.5]);
  });

  it('takes a scene’s look from its commonest lit color, muted onto the paper', () => {
    const look = lookOf(
      new Map([
        [0x000000, 50],
        [0x2a64c8, 30],
        [0x6fc04a, 20],
      ]),
    );
    expect(look.terrain).toBe('water');
    expect(look.fill).toBe(mix('#2a64c8', '#efe3c4', 0.5));
    // nearly all black: a dark country
    expect(
      lookOf(
        new Map([
          [0x000000, 95],
          [0x2a64c8, 5],
        ]),
      ).terrain,
    ).toBe('night');
    expect(lookOf(new Map()).terrain).toBe('grass');
  });

  it('draws the same wobbly coast every time', () => {
    const a = blobPath(10, 10, 5, 4, 42);
    expect(a).toBe(blobPath(10, 10, 5, 4, 42));
    expect(a).not.toBe(blobPath(10, 10, 5, 4, 43));
    expect(a.startsWith('M') && a.endsWith('Z')).toBe(true);
  });
});
