// Tests: finding your copies of a catalog game before making another (editor/shell/homeCopies.ts).
import { describe, expect, it } from 'vitest';
import { copiesOf } from '../src/editor/shell/homeCopies';

const p = (id: string, gam: string, updated: number) => ({ id, name: id, gam, updated });
const origins: Record<string, string> = { a: 'cd:nebula', b: 'cd:pipemare' };
const origin = (id: string) => origins[id];

describe('copies of a catalog game', () => {
  it('finds copies made from it, newest first', () => {
    const list = [p('a', 'nebula.gam', 1), p('c', 'other.gam', 3), p('a2', 'NEBULA.GAM', 5)];
    expect(copiesOf('cd:nebula', 'nebula.gam', list, origin).map((c) => c.id)).toEqual(['a2', 'a']);
  });

  it('a copy made from another game with the same .gam name is not one', () => {
    expect(copiesOf('cd:nebula', 'pipemare.gam', [p('b', 'pipemare.gam', 1)], origin)).toEqual([]);
  });

  it('none: an empty list', () => {
    expect(copiesOf('cd:zark', 'zark.gam', [], origin)).toEqual([]);
  });
});
