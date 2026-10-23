// The living room ride's blocks: the spinning rug, its hub and bulbs, and the velvet-rope exit to the couch.
// Part of REMOTE.BBL (blocks.ts adds them after the living room's, in this order).
import { micro } from '../../../snowbound/src/art/font';
import { SOLID } from '../../../snowbound/src/blocks/book';
import { PLAY } from '../ids';
import { type Ctx, GRAV, type LivingRoom } from './blocks';

export function rideBlocks(ctx: Ctx, lr: LivingRoom): void {
  const { book, P, c, solid } = ctx;
  const { carpet, wallTop } = lr;
  // ---------- the living room ride ----------
  // the spinning rug: red and yellow carnival stripes, its arrows the way it carries you
  const spin = (dir: keyof typeof GRAV, f: number) => {
    const p = P();
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, (dir === 'up' || dir === 'down' ? Math.floor(x / 5) : Math.floor(y / 5)) % 2 ? c('red', 2) : c('yellow', 2));
    const arrow = (ax: number, ay: number) => {
      const [dx, dy] = dir === 'right' ? [1, 0] : dir === 'left' ? [-1, 0] : dir === 'down' ? [0, 1] : [0, -1];
      for (let k = -3; k <= 3; k++) p.set(ax + dx * k, ay + dy * k, c('white', 2));
      for (let k = 1; k <= 2; k++) p.set(ax + dx * (3 - k) - dy * k, ay + dy * (3 - k) - dx * k, c('white', 2)).set(ax + dx * (3 - k) + dy * k, ay + dy * (3 - k) + dx * k, c('white', 2));
    };
    const o = f * 5;
    if (dir === 'right' || dir === 'left') arrow((10 + (dir === 'right' ? o : -o) + 20) % 20, 10);
    else arrow(10, (10 + (dir === 'down' ? o : -o) + 20) % 20);
    return p;
  };
  for (const dir of ['right', 'down', 'left', 'up'] as const) {
    book.add(`spin${dir}`, spin(dir, 0), { grav: GRAV[dir], next: `spin${dir}2`, ntime: 4 });
    book.add(`spin${dir}2`, spin(dir, 1), { grav: GRAV[dir], next: `spin${dir}`, ntime: 4 });
  }
  // the hub in the middle of the ride, and the bulbs round its edge
  const hub = carpet(80);
  hub.disc(10, 10, 9, c('red', 1)).disc(10, 10, 7, c('yellow', 2)).disc(10, 10, 3, c('red', 2));
  for (let a = 0; a < 6.28; a += 0.785) hub.set(10 + Math.cos(a) * 8, 10 + Math.sin(a) * 8, c('lamp', 2));
  book.add('hub', hub, solid);
  const bulbs = (f: number) => {
    const p = wallTop.crop(0, 0, 20, 20);
    for (let x = 2; x < 20; x += 5) p.disc(x, 10, 2, (x + f * 5) % 10 < 5 ? c('lamp', 2) : c('lamp', 0));
    return p;
  };
  book.add('bulbs', bulbs(0), { solid: SOLID, next: 'bulbs2', ntime: 6 });
  book.add('bulbs2', bulbs(1), { solid: SOLID, next: 'bulbs', ntime: 6 });
  // the ride's way off, a velvet rope between two posts: it only lets you off with the tape
  // playing, and there, beneath the cushion you sit on... the remote ("There you are, you sneaky
  // guy." plays as you walk to the couch)
  const exit = (open: boolean) => {
    const p = carpet(81);
    p.rect(2, 12, 16, 7, c('white', 2)).rect(2, 18, 16, 1, c('silver', 0));
    micro(p, 3, 13, 'EXIT', open ? c('led', 0) : c('red', 1));
    for (const x of [0, 18]) p.rect(x, 3, 2, 15, c('silver', 1)).rect(x, 2, 2, 1, c('silver', 3)).rect(x, 17, 2, 1, c('silver', 0));
    const sag = (x: number) => Math.round(Math.sin(((x - 2) / 16) * Math.PI) * 4);
    if (open) p.line(2, 4, 3, 10, c('red', 1)).line(3, 4, 4, 10, c('red', 2));
    else for (let x = 2; x < 18; x++) p.set(x, 4 + sag(x), c('red', 1)).set(x, 5 + sag(x), c('red', 2));
    return p;
  };
  book.add('rideExit', exit(false), { solid: SOLID, effect: PLAY, eamt: -1, score: 1000, touch: 'rideExitOpen' });
  book.add('rideExitOpen', exit(true));
}
