// Named transitions preserve the original finalization order, mutations and lookup errors.
import { describe, expect, it } from 'vitest';
import { emptyBlock } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { applyBlockTimers } from './blockTimers';

function fixture() {
  const blocks = Array.from({ length: 3 }, (_, i) => emptyBlock(i));
  const names = new Map([
    ['first', 0],
    ['second', 1],
    ['idle', 2],
  ]);
  const resolve = (name: string): number => {
    const index = names.get(name);
    if (index === undefined) throw new Error(`No block ${name}`);
    return index;
  };
  return { blocks, resolve };
}

describe('applyBlockTimers', () => {
  it('resolves a ring, keeps block identities and leaves unrelated fields and blocks intact', () => {
    const { blocks, resolve } = fixture();
    const first = blocks[0];
    const before = structuredClone(blocks);
    const result = applyBlockTimers(blocks, resolve, [
      { name: 'first', next: 'second', ticks: 18 },
      { name: 'second', next: 'first', ticks: 7 },
    ]);
    expect(result).toBe(blocks);
    expect(result[0]).toBe(first);
    expect(blocks).toEqual([{ ...before[0], nextBl: 1, ntime: 18 }, { ...before[1], nextBl: 0, ntime: 7 }, before[2]]);
  });

  it('returns the array unchanged without resolving names when no timers exist', () => {
    const { blocks } = fixture();
    const before = structuredClone(blocks);
    expect(
      applyBlockTimers(blocks, () => {
        throw new Error('unexpected lookup');
      }, []),
    ).toBe(blocks);
    expect(blocks).toEqual(before);
  });

  it('preserves zero, fractional and long tick values, including self transitions', () => {
    const { blocks, resolve } = fixture();
    applyBlockTimers(blocks, resolve, [
      { name: 'first', next: 'first', ticks: 0 },
      { name: 'second', next: 'second', ticks: 18.2 },
      { name: 'idle', next: 'idle', ticks: 70000 },
    ]);
    expect(blocks.map(({ nextBl, ntime }) => [nextBl, ntime])).toEqual([
      [0, 0],
      [1, 18.2],
      [2, 70000],
    ]);
  });

  it('applies duplicate records in order, resolving source before destination each time', () => {
    const { blocks, resolve } = fixture();
    const lookups: string[] = [];
    applyBlockTimers(
      blocks,
      (name) => {
        lookups.push(name);
        return resolve(name);
      },
      [
        { name: 'first', next: 'second', ticks: 12 },
        { name: 'first', next: 'idle', ticks: 0 },
      ],
    );
    expect(lookups).toEqual(['first', 'second', 'first', 'idle']);
    expect(blocks[0]).toMatchObject({ nextBl: 2, ntime: 0 });
  });

  it.each(['source', 'destination'])('propagates an unknown %s without undoing earlier records', (missing) => {
    const { blocks, resolve } = fixture();
    const before = structuredClone(blocks[1]);
    expect(() =>
      applyBlockTimers(blocks, resolve, [
        { name: 'first', next: 'second', ticks: 12 },
        { name: missing === 'source' ? 'missing' : 'second', next: missing === 'destination' ? 'missing' : 'idle', ticks: 8 },
      ]),
    ).toThrow('No block missing');
    expect(blocks[0]).toMatchObject({ nextBl: 1, ntime: 12 });
    expect(blocks[1]).toEqual(before);
  });
});
