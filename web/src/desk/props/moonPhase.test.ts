import { describe, expect, it } from 'vitest';
import { moonPhase } from './moonPhase';

// distance round the month, so 0.99 is close to 0
const off = (a: number, b: number) => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));

describe('moonPhase', () => {
  it('finds real new and full moons within about a day', () => {
    expect(off(moonPhase(new Date(Date.UTC(2024, 3, 8, 18, 21))).age, 0)).toBeLessThan(0.04);
    expect(off(moonPhase(new Date(Date.UTC(2024, 3, 23, 23, 49))).age, 0.5)).toBeLessThan(0.04);
    expect(off(moonPhase(new Date(Date.UTC(2026, 0, 3, 10, 3))).age, 0.5)).toBeLessThan(0.04);
  });
  it('names the phase and how much is lit', () => {
    const full = moonPhase(new Date(Date.UTC(2024, 3, 23, 23, 49)));
    expect(full.name).toBe('a full moon');
    expect(full.lit).toBeGreaterThan(0.98);
    const quarter = moonPhase(new Date(Date.UTC(2024, 3, 15, 19, 13)));
    expect(quarter.name).toBe('the first quarter');
    expect(quarter.lit).toBeGreaterThan(0.4);
    expect(quarter.lit).toBeLessThan(0.6);
  });
});
