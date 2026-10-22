// Tests: Depth Perception's block book (games/depth/src/tiles/book.ts): a level's two focus
// planes share block numbers, behave by plane, and the felt egg keeps its pinned number.
import { describe, expect, it } from 'vitest';
import { SOLBOT, SOLLEF, SOLRIG, SOLTOP } from '../src/formats/blocks';
import { TileBook } from '../../games/depth/src/tiles/book';
import { rulesFor } from '../../games/depth/src/tiles/rules';
import { buildLevel } from '../../games/depth/src/levels/map';
import { lensCounters } from '../../games/depth/src/ids';

const SOLID = SOLTOP | SOLRIG | SOLBOT | SOLLEF;

function level(rows: string[]) {
  const book = new TileBook('checker', rulesFor({ level: 1 }));
  const built = buildLevel(book, { rows, at: [0, 0] });
  return { book, built, near: book.blocks('near'), far: book.blocks('far') };
}

describe('Depth Perception blocks', () => {
  it('makes a near cube solid only in the near plane and a far cube only in the far', () => {
    const { built, near, far } = level(['#####', '#@nf#', '#..X#', '#####']);
    const n = built.maps.near.blocks[1 * 100 + 2];
    const f = built.maps.near.blocks[1 * 100 + 3];
    expect(near[n].solid).toBe(SOLID);
    expect(far[n].solid).toBe(0);
    expect(near[f].solid).toBe(0);
    expect(far[f].solid).toBe(SOLID);
    // both planes' maps hold the same block numbers
    expect([...built.maps.far.blocks]).toEqual([...built.maps.near.blocks]);
  });

  it('opens a gate only for its lens, and turns it into the floor beside it', () => {
    const { built, near } = level(['######', '#@R.r#', '#...X#', '######']);
    const gate = near[built.maps.near.blocks[1 * 100 + 4]];
    const [red] = lensCounters(1);
    expect(gate.effect).toBe(red);
    expect(gate.eamt).toBe(-1);
    expect(near[gate.touchBl].solid).toBe(0);
  });

  it('only makes the block variants a level uses', () => {
    const { book } = level(['#####', '#@..#', '#..X#', '#####']);
    expect(book.used).toBeLessThan(12);
  });

  it('keeps the felt egg at its pinned block number, as an object', () => {
    const book = new TileBook('mirror', rulesFor({ level: 3 }));
    book.pin('egg', 149);
    buildLevel(book, { rows: ['#####', '#@E.#', '#..X#', '#####'], at: [0, 0] });
    const blocks = book.blocks('far');
    expect(blocks[149].obj).toBe(1);
    expect(blocks.filter((b) => b.obj).length).toBe(1);
  });
});
