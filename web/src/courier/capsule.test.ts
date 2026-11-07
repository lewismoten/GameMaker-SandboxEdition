// Capsule v1: a round trip keeps every id and stamp, a game stamp the receiver does not know arrives
// as the mystery stamp, and a file that is too big, not a capsule, from a newer version, changed or
// malformed is refused. The format has no text at all, so a world's name never rides along.
import { describe, expect, it } from 'vitest';
import { CAPSULE_MAX, CapsuleError, crc32, decodeCapsule, encodeCapsule, gameHash, type Capsule } from './capsule';
import { makeCourierId } from './courierId';
import { WORLDS } from './tables';

const A = makeCourierId();
const B = makeCourierId();
const TRIP = makeCourierId();
const known = new Map([[gameHash('snowbound'), 'snowbound']]);
const game = (h: number) => known.get(h);
const cap = (over: Partial<Capsule> = {}): Capsule => ({
  trip: TRIP,
  home: A,
  world: 3,
  from: B,
  packages: [],
  postcards: [{ from: B, world: 5, stamps: [{ kind: 'sample-cd' }, { kind: 'game', game: 'snowbound' }, { kind: 'mystery' }] }],
  ...over,
});
const problem = (bytes: Uint8Array) => {
  try {
    decodeCapsule(bytes, game);
  } catch (e) {
    return e instanceof CapsuleError ? e.problem : 'other';
  }
  return 'none';
};
/** `bytes` with its CRC-32 made right again, so only the change under test is wrong. */
const resealed = (bytes: Uint8Array) => {
  const b = bytes.slice();
  new DataView(b.buffer).setUint32(b.length - 4, crc32(b.subarray(0, b.length - 4)), true);
  return b;
};

describe('capsule', () => {
  it('round-trips ids, worlds and stamps', () => {
    const bytes = encodeCapsule(cap());
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('SCT1');
    expect(decodeCapsule(bytes, game)).toEqual(cap());
  });

  it('turns a game the receiver does not know into the mystery stamp', () => {
    const c = decodeCapsule(encodeCapsule(cap()), () => undefined);
    expect(c.postcards[0].stamps).toEqual([{ kind: 'sample-cd' }, { kind: 'mystery' }, { kind: 'mystery' }]);
  });

  it('carries no text: no world name or game id appears in the bytes', () => {
    const text = new TextDecoder('latin1').decode(encodeCapsule(cap()));
    for (const w of WORLDS) expect(text).not.toContain(w);
    expect(() => encodeCapsule(cap({ from: A.replace(/.$/, (d) => (d === '0' ? '1' : '0')) }))).toThrow(CapsuleError); // a typo'd id
    expect(text).not.toContain('snowbound');
  });

  it('refuses ids that are not courier ids (a v1 UUID holds a time and a MAC)', () => {
    expect(() => encodeCapsule(cap({ home: 'c232ab00-9414-11ec-b3c8-9f6bdeced846' }))).toThrow(CapsuleError);
    const b = encodeCapsule(cap());
    b[8 + 6] = (b[8 + 6] & 0x0f) | 0x10; // the trip id made version 1
    expect(problem(resealed(b))).toBe('malformed');
  });

  it('will not write one past 512 bytes', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      from: makeCourierId(),
      world: i,
      stamps: Array.from({ length: 20 }, () => ({ kind: 'game' as const, game: 'snowbound' })),
    }));
    expect(() => encodeCapsule(cap({ postcards: many }))).toThrow(CapsuleError);
  });

  it('refuses a file too big, too small, not a capsule or from a newer version', () => {
    const good = encodeCapsule(cap());
    expect(problem(new Uint8Array(CAPSULE_MAX + 1))).toBe('size');
    expect(problem(good.slice(0, 20))).toBe('size');
    const png = resealed(good);
    png.set([0x89, 0x50, 0x4e, 0x47]);
    expect(problem(png)).toBe('not-capsule');
    const v2 = good.slice();
    v2[4] = 2;
    expect(problem(resealed(v2))).toBe('version');
  });

  it('refuses a changed byte (CRC-32)', () => {
    const b = encodeCapsule(cap());
    b[60] ^= 1;
    expect(problem(b)).toBe('tampered');
  });

  it('refuses malformed contents even with a good CRC', () => {
    const good = encodeCapsule(cap());
    const world = good.slice();
    world[7] = 250; // no such world
    expect(problem(resealed(world))).toBe('malformed');
    const flags = good.slice();
    flags[6] = 1;
    expect(problem(resealed(flags))).toBe('malformed');
    const kind = good.slice();
    kind[58 + 18] = 9; // the first stamp's kind
    expect(problem(resealed(kind))).toBe('malformed');
    const zero = good.slice();
    zero.fill(0, 24, 40); // home id all zeros
    expect(problem(resealed(zero))).toBe('malformed');
    const extra = new Uint8Array(good.length + 1);
    extra.set(good.subarray(0, good.length - 4));
    expect(problem(resealed(extra))).toBe('malformed');
    const twice = cap({ postcards: [cap().postcards[0], cap().postcards[0]] });
    expect(problem(encodeCapsule(twice))).toBe('malformed');
  });
});
