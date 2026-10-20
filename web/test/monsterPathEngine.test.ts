// The path preview must move monsters exactly like the game engine does.
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { parseMonsters } from '../src/formats/monster';
import { newMap } from '../src/formats/map';
import { createWorld, padBlocks } from '../src/engine/world';
import { birthMon, moveAllMonsters, resetMonInfo } from '../src/engine/monsters';
import { PathWalker } from '../src/editor/editors/monsterPath';
import type { Character } from '../src/formats/character';

const SETS = ['../cd/gameware/nebula/monshad.mon', '../cd/gameware/pipemare/pipes.mon'].map((f) => new URL(`../${f}`, import.meta.url));

describe.skipIf(!SETS.every((u) => existsSync(u)))('PathWalker matches moveallmons', () => {
  for (const url of SETS) {
    it(url.pathname.split('/').pop()!, () => {
      const mons = parseMonsters(new Uint8Array(readFileSync(url)));
      let checked = 0;
      mons.forEach((mon, n) => {
        if (!mon.used || mon.towards !== 0 || mon.activate === 1) return;
        for (const p of mon.activate === 2 ? ([0, 1] as const) : ([0] as const)) {
          const chr = p === 1 ? { x: 53, y: 51 } : { x: 5, y: 5 };
          const w = createWorld(newMap(), { play: () => false }, () => 0.5);
          w.mon = mons;
          w.mblk = padBlocks(undefined, 100);
          w.chr = { x: [chr.x, 0], y: [chr.y, 0] } as unknown as Character;
          w.mx = 0;
          w.my = 0;
          const slot = birthMon(w, 0, n, 50, 50);
          resetMonInfo(w.mi[slot]);
          const walker = new PathWalker(mon, p, { x: 50, y: 50 }, chr);
          const mi = w.mi[slot];
          for (let t = 0; t < 600; t++) {
            moveAllMonsters(w);
            w.clock++;
            walker.tick();
            if (w.mm[slot].monnum !== n) break; // died at the end of its path or its lifetime
            const got = {
              x: ((walker.bx % 100) + 100) % 100,
              y: ((walker.by % 100) + 100) % 100,
              px: walker.px,
              py: walker.py,
              o: walker.orient,
              f: walker.frame,
            };
            expect(got, `monster ${n} path ${p} tick ${t}`).toEqual({
              x: mi.curx[0],
              y: mi.cury[0],
              px: mi.curx[1],
              py: mi.cury[1],
              o: mi.orient,
              f: mi.curPic,
            });
          }
          checked++;
        }
      });
      expect(checked).toBeGreaterThan(10);
    });
  }
});
