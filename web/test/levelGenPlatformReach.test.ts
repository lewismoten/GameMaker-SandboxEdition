import { describe, expect, it } from 'vitest';
import { arcOf, heroPhysics, weaker } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen/jumpModel';
import { capability } from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen/platformCap';
import { starterHero } from './platformTestHero';

describe('jump model', () => {
  const p = (() => {
    const o = heroPhysics(starterHero());
    if (!o.ok) throw new Error(o.message);
    return o.physics;
  })();
  it('reads walking, the jump push and climbing from the character', () => {
    expect(p.vx).toBe(4);
    expect(p.push[0]).toBe(-12);
    expect(p.steer).toBe(true);
    expect(p.climb).toBe(true);
  });
  it('matches the engine arc measured tick by tick (rise 66 px, back down on tick 22, 4 px a tick across, from the second tick)', () => {
    const a = arcOf(p, 'jump', 1, 90);
    expect(p.rise).toBe(66);
    let y = 0,
      peak = 0,
      land = -1;
    a.dy.forEach((d, t) => {
      y -= d;
      peak = Math.max(peak, y);
      if (land < 0 && t > 3 && y <= 0) land = t;
    });
    expect(peak).toBe(66);
    expect(land).toBe(22);
    expect(a.dx.slice(0, 23).reduce((s, d) => s + d, 0)).toBe(88);
  });
  it('measures how far and how high he can go', () => {
    const c = capability(p);
    expect(c.maxRise).toBeGreaterThanOrEqual(3);
    expect(c.maxGap).toBeGreaterThanOrEqual(3);
    expect(c.maxGap).toBeLessThanOrEqual(5);
    const w = capability(weaker(p, 0.7, 0.8));
    expect(w.maxGap).toBeLessThan(c.maxGap);
  });
});
