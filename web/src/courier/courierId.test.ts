// Courier ids: UUID v4 in shape with the 'c' mark and a Luhn mod 16 check digit; every single-digit
// typo caught, most swapped neighbors caught, a random v4 UUID nearly always refused, and every bit
// but the fixed version, mark and variant ones random (nothing from time or hardware).
import { describe, expect, it } from 'vitest';
import { isCourierId, luhn16, makeCourierId } from './courierId';

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const hexAt = (id: string) =>
  [...id]
    .map((c, i) => [c, i] as const)
    .filter(([c]) => c !== '-')
    .map(([, i]) => i);

describe('courier ids', () => {
  it('are UUID v4 with the courier mark, both ways of making them', () => {
    for (const viaRandomUUID of [true, false]) {
      const id = makeCourierId(viaRandomUUID);
      expect(id).toMatch(V4);
      expect(id.slice(14, 16)).toBe('4c');
      expect(isCourierId(id)).toBe(true);
    }
  });

  it('are random in every bit but the version, mark and variant ones', () => {
    for (const viaRandomUUID of [true, false]) {
      const ids = Array.from({ length: 400 }, () => makeCourierId(viaRandomUUID));
      expect(new Set(ids).size).toBe(ids.length);
      const bits = (id: string) => [...id.replace(/-/g, '')].flatMap((d) => [...parseInt(d, 16).toString(2).padStart(4, '0')]);
      const fixed = new Set([48, 49, 50, 51, 52, 53, 54, 55, 64, 65]);
      const all = ids.map(bits);
      for (let i = 0; i < 128; i++) expect(new Set(all.map((b) => b[i])).size, `bit ${i}`).toBe(fixed.has(i) ? 1 : 2);
    }
  });

  it('catches every single-digit typo', () => {
    for (let n = 0; n < 20; n++) {
      const id = makeCourierId();
      for (const i of hexAt(id))
        for (const d of '0123456789abcdef') {
          if (d === id[i]) continue;
          expect(isCourierId(id.slice(0, i) + d + id.slice(i + 1)), `${id} digit ${i} → ${d}`).toBe(false);
        }
    }
  });

  it('catches most swapped neighbors', () => {
    let swaps = 0;
    let caught = 0;
    for (let n = 0; n < 200; n++) {
      const id = makeCourierId();
      const at = hexAt(id);
      for (let k = 0; k + 1 < at.length; k++) {
        const [i, j] = [at[k], at[k + 1]];
        if (id[i] === id[j]) continue;
        const c = [...id];
        [c[i], c[j]] = [c[j], c[i]];
        swaps++;
        if (!isCourierId(c.join(''))) caught++;
      }
    }
    expect(caught / swaps).toBeGreaterThan(0.9);
  });

  it('refuses nearly every random v4 UUID, and one with the mark about 15 times in 16', () => {
    let passed = 0;
    let marked = 0;
    for (let n = 0; n < 4000; n++) {
      const u = crypto.randomUUID();
      if (isCourierId(u)) passed++;
      if (isCourierId(`${u.slice(0, 15)}c${u.slice(16)}`)) marked++;
    }
    expect(passed).toBeLessThan(60); // about 1 in 256
    expect(marked / 4000).toBeGreaterThan(0.03);
    expect(marked / 4000).toBeLessThan(0.1); // about 1 in 16
  });

  it('enforces the version, mark and variant, and the check digit itself', () => {
    const id = makeCourierId();
    const at = (i: number, d: string) => id.slice(0, i) + d + id.slice(i + 1);
    expect(isCourierId(at(14, '1'))).toBe(false); // version
    expect(isCourierId(at(15, 'd'))).toBe(false); // mark
    expect(isCourierId(at(19, 'c'))).toBe(false); // variant
    expect(isCourierId(id.toUpperCase())).toBe(false);
    expect(isCourierId(42)).toBe(false);
    expect(luhn16([1, 2, 3])).toBe(luhn16([1, 2, 3]));
  });
});
