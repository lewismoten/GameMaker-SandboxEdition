// What the engine shows right now, as a picture (never on the disk): the blocks of a 16x10 view as they stand this tick, every
// firefly at its place and frame, and the hero, read from the headless player's world. The shots and the route's checks use it.
import { monPicNum } from '@lewismoten/gamemaker-sandbox-engine/engine/monsters';
import { chrFrame } from '@lewismoten/gamemaker-sandbox-engine/engine/keys';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import type { GameSim } from './sim';

import { CHARBL, MLEN, MONBL } from '@lewismoten/gamemaker-sandbox-engine/engine/world';

/** A 16x10 block view with its top-left at world block (x0, y0). */
export function screenOf(sim: GameSim, x0: number, y0: number): Pixels {
  const w = sim.w;
  const p = new Pixels(320, 200);
  for (let by = 0; by < 10; by++)
    for (let bx = 0; bx < 16; bx++) {
      const pix = w.bg[w.blkmap[w.map[(y0 + by) * MLEN + x0 + bx]]].pixels;
      for (let i = 0; i < 400; i++) p.px[(by * 20 + Math.floor(i / 20)) * 320 + bx * 20 + (i % 20)] = pix[i];
    }
  const sprite = (pix: Uint8Array, sx: number, sy: number) => {
    for (let i = 0; i < 400; i++) if (pix[i] !== 255) p.set(sx + (i % 20), sy + Math.floor(i / 20), pix[i]);
  };
  const { x, y, sx, sy } = sim.pos;
  const f = chrFrame(w);
  // pic1 is the hero's top block, pic2 the bottom one (the frame's own flips are not drawn)
  if (f.pic1 < CHARBL) sprite(w.cblk[f.pic1].pixels, (x - x0) * 20 + sx, (y - 1 - y0) * 20 + sy);
  if (f.pic2 < CHARBL) sprite(w.cblk[f.pic2].pixels, (x - x0) * 20 + sx, (y - y0) * 20 + sy);
  w.mm.forEach((m, mm) => {
    if (m.monnum >= 64) return;
    const mi = w.mi[mm];
    const pic = monPicNum(w, mm);
    if (pic >= MONBL) return;
    sprite(w.mblk[pic].pixels, (mi.curx[0] - x0) * 20 + mi.curx[1], (mi.cury[0] - y0) * 20 + mi.cury[1]);
  });
  return p;
}
