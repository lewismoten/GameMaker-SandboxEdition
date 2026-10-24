import { describe, expect, it } from 'vitest';
import { blobPath, circleEdge, hsl, lookOf, mix, regions, scatter, terrainOf, trailBetween } from './worldMapTerrain';

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

  it('runs trails edge to edge with a bend, the same each time', () => {
    const t = trailBetween({ x: 0, y: 0 }, { x: 20, y: 0 }, 5, 7);
    expect(t).toEqual(trailBetween({ x: 0, y: 0 }, { x: 20, y: 0 }, 5, 7));
    const [p, q] = [t.samples[0], t.samples.at(-1)!];
    expect(Math.hypot(p.x, p.y)).toBeCloseTo(5);
    expect(Math.hypot(q.x - 20, q.y)).toBeCloseTo(5);
    expect(Math.abs(t.mid.y)).toBeGreaterThan(0.5);
    expect(circleEdge({ x: 0, y: 0 }, 2, { x: 0, y: 10 })).toEqual({ x: 0, y: 2 });
  });

  it('scatters drawings inside a country, off the places and apart', () => {
    const avoid = [{ p: { x: 0, y: 0 }, r: 4 }];
    const spots = scatter({ x: 0, y: 0 }, 12, 10, 8, 3, avoid, [{ x: 30, y: 0 }]);
    expect(spots.length).toBe(8);
    for (const s of spots) {
      expect(Math.hypot(s.x, s.y)).toBeGreaterThanOrEqual(4);
      expect(Math.hypot(s.x - 30, s.y)).toBeGreaterThan(Math.hypot(s.x, s.y));
    }
    expect(scatter({ x: 0, y: 0 }, 12, 10, 8, 3, avoid, [{ x: 30, y: 0 }])).toEqual(spots);
  });

  it('groups linked scenes on one map into a region', () => {
    expect(
      regions(
        [undefined, 'a.map', 'a.map', 'b.map', 'a.map'],
        [
          [1, 2],
          [2, 3],
          [0, 1],
        ],
      ),
    ).toEqual([[1, 2], [3], [4]]);
  });
});
