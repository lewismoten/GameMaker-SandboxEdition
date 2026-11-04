// The phone kit's data and explode math: the real parts file is read and split into groups, and the stack
// offsets are worked out from the data, so extra parts (a shell, a dial) need no code.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { groupOf, parseParts, phoneSize, shows, variantBase, type PartsFile, type PhoneVariant } from './phoneData';
import { explodeStacks, moved, stackOf } from './phoneExplode';

const read = (sub: string) => {
  const dir = new URL(`../../../../../games/year2000/phone/${sub}viewer/`, import.meta.url);
  const file = JSON.parse(readFileSync(new URL('parts.json', dir), 'utf8')) as PartsFile;
  const bin = readFileSync(new URL('parts.bin', dir));
  return { file, parts: parseParts(file, bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength)) };
};
const builds: Record<PhoneVariant, ReturnType<typeof read>> = { cheap: read(''), deluxe: read('deluxe/') };
const parts = builds.cheap.parts;

const box = (group: string, side: 'front' | 'back', lo: number, hi: number) => ({
  group,
  side,
  bbox: [0, lo, 0, 1, hi, 1] as [number, number, number, number, number, number],
});

describe('groups', () => {
  it('reads every part with its own vertices and indices', () => {
    expect(parts.length).toBeGreaterThan(100);
    for (const p of [...parts, ...builds.deluxe.parts]) {
      expect(p.positions.length).toBeGreaterThan(0);
      expect(p.indices.length % 3).toBe(0);
      expect(Math.max(...p.indices)).toBeLessThan(p.positions.length / 3);
    }
  });
  it('sorts every build into board, components, battery, shell and dial', () => {
    for (const { parts: ps } of Object.values(builds)) {
      expect(ps.filter((p) => p.group === 'board')).toHaveLength(5);
      expect(ps.filter((p) => p.group === 'battery').every((p) => p.id.startsWith('BT'))).toBe(true);
      expect(new Set(ps.map((p) => p.group))).toEqual(new Set(['board', 'components', 'battery', 'shell', 'dial']));
    }
  });
  it('gives each build its shell, dial, caps and a battery box of four labeled AAA cells', () => {
    for (const { parts: ps } of Object.values(builds)) {
      const ids = new Set(ps.map((p) => p.id));
      for (const id of [
        'front-frame',
        'back-tray',
        'battery-door',
        'dial-plate',
        'dial-cam',
        'dial-spring',
        'dial-post',
        'dial-stop',
        'cap-talk',
        'cap-clear',
        'BT1',
      ])
        expect(ids.has(id), id).toBe(true);
      for (let k = 1; k <= 4; k++) {
        expect(ids.has(`BT1-cell${k}`)).toBe(true);
        expect(ps.find((p) => p.id === `BT1-label${k}`)?.label).toContain('AAA 1.5V');
      }
      expect(ps.filter((p) => p.group === 'shell' && p.side === 'front').length).toBeGreaterThan(0);
    }
    // only the cheap build has a handle past the board's edge
    expect(parts.some((p) => p.id === 'back-handle')).toBe(true);
    expect(builds.deluxe.parts.some((p) => p.id === 'back-handle')).toBe(false);
  });
  it('knows its two builds and their sizes, the cheap board being the smaller', () => {
    expect(builds.cheap.file.variant?.board).toEqual({ width: 99, height: 99 });
    expect(builds.deluxe.file.variant?.board).toEqual({ width: 73.66, height: 175.26 });
    const [cw, ch] = phoneSize(builds.cheap.parts);
    const [dw, dh] = phoneSize(builds.deluxe.parts);
    expect(cw).toBeGreaterThan(99);
    expect(dh).toBeGreaterThan(ch * 0.9);
    expect(dw).toBeLessThan(cw);
    expect(variantBase('cheap')).not.toBe(variantBase('deluxe'));
  });
  it('takes a part’s own group, or its kind', () => {
    expect(groupOf({ id: 'X1', kind: 'component', group: 'dial' })).toBe('dial');
    expect(groupOf({ id: 'front', kind: 'shell' })).toBe('shell');
    expect(groupOf({ id: 'R5', kind: 'component' })).toBe('components');
  });
  it('shows groups by view', () => {
    expect(shows('all', 'shell')).toBe(true);
    expect(shows('electronics', 'shell')).toBe(false);
    expect(shows('electronics', 'battery')).toBe(true);
    expect(shows('bare', 'components')).toBe(false);
    expect(shows('bare', 'board')).toBe(true);
  });
});

describe('explode', () => {
  it('keeps the board still and spreads the rest clear of one another', () => {
    const stacks = explodeStacks(parts);
    expect(stacks.find((s) => s.key === 'board')!.offset).toBe(0);
    const front = stacks.find((s) => s.key === 'components:front')!;
    const back = stacks.find((s) => s.key === 'components:back')!;
    expect(front.offset).toBeGreaterThan(0);
    expect(back.offset).toBeLessThan(0);
    const spans = stacks.map((s) => [s.lo + s.offset, s.hi + s.offset]).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < spans.length; i++) expect(spans[i][0]).toBeGreaterThan(spans[i - 1][1]);
  });
  it('places a shell, a dial and a battery door that arrive later by their own extents', () => {
    const more = [
      box('board', 'front', 0, 1.6),
      box('components', 'front', 1.6, 6),
      box('shell', 'front', -1, 12),
      box('dial', 'front', 8, 14),
      box('shell', 'back', -14, 1),
      box('battery', 'back', -12, -2),
    ];
    const stacks = Object.fromEntries(explodeStacks(more, 10).map((s) => [s.key, s]));
    expect(stacks.board.offset).toBe(0);
    // each stack up from the board stands 10 mm above the one inside it
    expect(stacks['components:front'].lo + stacks['components:front'].offset).toBeCloseTo(1.6 + 10);
    expect(stacks['shell:front'].lo + stacks['shell:front'].offset).toBeGreaterThan(stacks['components:front'].hi + stacks['components:front'].offset);
    expect(stacks['dial:front'].lo + stacks['dial:front'].offset).toBeGreaterThan(stacks['shell:front'].hi + stacks['shell:front'].offset);
    expect(stacks['battery:back'].offset).toBeLessThan(0);
    expect(stacks['shell:back'].hi + stacks['shell:back'].offset).toBeLessThan(stacks['battery:back'].lo + stacks['battery:back'].offset);
    expect(stackOf({ group: 'shell', side: 'front' })).toBe('shell:front');
  });
  it('eases from assembled to exploded and clamps', () => {
    expect(moved(30, 0)).toBe(0);
    expect(moved(30, 1)).toBe(30);
    expect(moved(30, 0.5)).toBeCloseTo(15);
    expect(moved(30, 2)).toBe(30);
    expect(moved(-30, -1)).toBeCloseTo(0);
  });
});
