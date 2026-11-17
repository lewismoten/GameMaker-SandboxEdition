// Timer visibility in the Specials' street, roof and pond-bed views, including sub-tile scrolling and map wrap.
import { describe, expect, it } from 'vitest';
import { createWorld, NEVER } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { changeBlocks } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import { basePal, buildPalette } from '../pass-the-pie/src/palette';
import { buildLevels as pieLevels, finishBook } from '../pass-the-pie/src/levels';
import { buildLevels as paradeLevels } from '../thank-you-parade/src/levels';

const pie = pieLevels(basePal(buildPalette()));
const parade = paradeLevels().levels;
const timed = [
  ...pie.filter((l) => ['gravy', 'dojo', 'doors', 'freezer', 'gobble'].includes(l.file)).map((l) => ({ l, prefix: 'seg', ground: 17 })),
  ...parade
    .filter((l) => ['gust', 'bakery', 'thaw'].includes(l.file))
    .map((l) => ({ l, prefix: l.file === 'bakery' ? 'shut' : l.file, ground: l.file === 'bakery' ? 28 : l.file === 'thaw' ? 19 : 10 })),
];

describe.each(timed)('$l.file countdown', ({ l, prefix, ground }) => {
  it('keeps a complete meter in every camera window, including alternate heights', () => {
    const map = l.map.done();
    const names = new Map([...l.book.index].map(([n, i]) => [i, n.split('~')[0]]));
    const rects: [number, number, number][] = [];
    for (let y = 0; y < 100; y++)
      for (let x = 0; x < 100; x++) {
        const name = names.get(map.blocks[y * 100 + x]);
        if (name === 'mini0' || name === `${prefix}Mini0`) rects.push([x - 10, y - 10, 1]);
        if (
          name === `${prefix}0${prefix === 'seg' ? '.on' : ''}` &&
          x <= 95 &&
          Array.from({ length: 5 }, (_, i) => names.get(map.blocks[y * 100 + x + i]) === `${prefix}${i}${prefix === 'seg' ? '.on' : ''}`).every(Boolean)
        )
          rects.push([x - 10, y - 10, 5]);
      }
    const missed: [number, number][] = [];
    // At every pixel offset, 312x196 contains at least 14 whole columns and eight whole rows.
    for (let y = l.file === 'freezer' ? -15 : -4; y <= ground - 3; y++)
      for (let x = -5; x <= l.map.width - 8; x++) {
        // Only the pond lets Penny stand below the banks; its bed is the lowest playable surface.
        if (l.file === 'thaw' && y > 9 && (x < 16 || x > 57)) continue;
        if (!rects.some(([a, b, w]) => a >= x && a + w <= x + 14 && b >= y && b + 1 <= y + 8)) missed.push([x, y]);
      }
    expect(missed).toEqual([]);
  });

  if ('timed' in l || l.file !== 'thaw')
    it('drains the small meter on the same ticks as all five large segments', () => {
      const blocks = 'timed' in l ? finishBook(l) : l.book.finish();
      const w = createWorld(l.map.done(), { play: () => false });
      w.bg = blocks;
      w.nxtchg = blocks.map((b) => (b.ntime > 0 ? b.ntime : NEVER));
      const mini = l.book.n(prefix === 'seg' ? 'mini0' : `${prefix}Mini0`);
      const off = l.book.n(prefix === 'seg' ? 'mini5' : `${prefix}Mini5`);
      const bars = Array.from({ length: 5 }, (_, i) => l.book.n(`${prefix}${i}${prefix === 'seg' ? '.on' : ''}`));
      const names = new Map([...l.book.index].map(([name, i]) => [i, name]));
      const each = blocks[mini].ntime;
      const mismatches: number[] = [];
      for (let tick = 0; tick <= each * 5 + 1; tick++) {
        w.clock = tick;
        changeBlocks(w);
        const gone = bars.filter((n) => /(?:\.off|Off)$/.test(names.get(w.blkmap[n]) ?? '')).length;
        const stage = Number((names.get(w.blkmap[mini]) ?? '').match(/(\d+)$/)?.[1]);
        if (stage !== gone) mismatches.push(tick);
      }
      expect(mismatches).toEqual([]);
      expect(w.blkmap[mini]).toBe(off);
    });
});
