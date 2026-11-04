// The Starters' background blocks (.BBL): the small, tidy set every Starter game begins with.
// A block is 20x20 pixels. In the editor's Blocks tab each one is listed by the name used
// here, and its rules (solid, pull, score, what it turns into) are on the same tab.
//
// The order matters (a block's number is its place) and is the same in every Starter:
//   air:      sky, edge (sky you can't walk through), cloudL + cloudR (one cloud, two blocks wide)
//   ground:   grass, dirt, brick, plank (a floor you can jump up through)
//   scenery:  bush, flower
//   climbing: ladder
//   doors:    doorTop + doorBottom (the exit), doorwayTop + doorwayBottom (the entrance)
//   things:   coin, key, spikes
// A game then adds its sign blocks (sign.ts) after these.
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { bevel, speckle } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Book, LEDGE, PULL, SOLID } from './book';
import { skyOf, type Pal } from './palette';

/** The counter a key adds to (counters 20 to 29 are free for a game). */
export const KEYS = 20;

/** Adds the Starter block set to `book` (empty), in the order listed above. */
export function addStarterBlocks(book: Book, pal: Pal): void {
  const { c, r } = pal;
  const sky = () => new Pixels(20, 20, skyOf(pal));
  const air = { grav: PULL.down };
  const ink = c('ink', 0);

  // ---- air
  book.add('sky', sky(), air);
  book.add('edge', sky(), { ...air, solid: SOLID });
  {
    // one fluffy cloud, two blocks wide
    const p = new Pixels(40, 20, skyOf(pal));
    const puffs: [number, number, number][] = [
      [9, 12, 6],
      [17, 9, 7],
      [26, 11, 7],
      [32, 13, 5],
      [21, 14, 7],
    ];
    for (const [x, y, rad] of puffs) p.disc(x, y, rad, c('white', 2));
    for (const [x, y, rad] of puffs) p.disc(x - 1, y - 1, rad - 2, c('white', 3));
    p.rect(6, 15, 29, 3, c('white', 2)).rect(7, 15, 26, 1, c('white', 1));
    book.add('cloudL', p.crop(0, 0, 20, 20), air);
    book.add('cloudR', p.crop(20, 0, 20, 20), air);
  }

  // ---- ground
  {
    const g = r('grass');
    const d = r('dirt');
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, d, 3, 1, 11, 0.3);
    const rand = rng(5);
    for (let i = 0; i < 4; i++) p.rect(2 + Math.floor(rand() * 15), 8 + Math.floor(rand() * 10), 2, 1, d[1]);
    for (let x = 0; x < 20; x++) {
      const h = 5 + ((x * 7) % 5 < 2 ? 1 : 0) + ((x * 3) % 7 === 0 ? 1 : 0);
      for (let y = 0; y < h; y++) p.set(x, y, y === 0 ? g[5] : y < 3 ? g[4] : y < h - 1 ? g[3] : g[2]);
      p.set(x, h, d[1]);
    }
    for (let x = 1; x < 20; x += 4) p.set(x, 1, g[5]).set(x + 1, 0, g[4]);
    book.add('grass', p, { solid: SOLID });
  }
  {
    const d = r('dirt');
    const p = speckle(new Pixels(20, 20), 0, 0, 20, 20, d, 3, 1, 12, 0.3);
    const rand = rng(8);
    for (let i = 0; i < 5; i++) {
      const x = 1 + Math.floor(rand() * 16);
      const y = 1 + Math.floor(rand() * 16);
      p.rect(x, y, 2, 2, d[2]).rect(x, y, 1, 1, d[4]);
    }
    book.add('dirt', p, { solid: SOLID });
  }
  {
    // brick: rows of bricks laid with half a brick's offset
    const b = r('brick');
    const mortar = c('parch', 2);
    const p = new Pixels(20, 20, mortar);
    for (let row = 0; row < 4; row++) {
      for (let k = -1; k < 3; k++) {
        const x = k * 10 + (row % 2) * 5;
        const y = row * 5;
        const w = 9;
        for (let yy = 0; yy < 4; yy++)
          for (let xx = 0; xx < w; xx++) {
            const px = x + xx;
            if (px < 0 || px > 19) continue;
            p.set(px, y + yy, yy === 0 ? b[4] : yy === 3 ? b[1] : xx === 0 ? b[3] : b[2]);
          }
      }
    }
    book.add('brick', p, { solid: SOLID });
  }
  {
    // a plank to stand on: solid from above only, so you can jump up through it
    const w = r('wood');
    const p = sky();
    p.rect(0, 0, 20, 8, w[2]).rect(0, 0, 20, 2, w[4]).rect(0, 6, 20, 2, w[1]);
    p.rect(9, 2, 1, 4, w[1]).rect(0, 2, 20, 1, w[3]);
    p.set(2, 4, w[0]).set(17, 4, w[0]);
    p.rect(0, 8, 20, 1, w[0]);
    book.add('plank', p, { solid: LEDGE, grav: PULL.down });
  }

  // ---- scenery
  {
    const g = r('grass');
    const p = sky();
    for (const [x, y, rad] of [
      [6, 15, 6],
      [13, 14, 7],
      [10, 17, 6],
    ] as const)
      p.disc(x, y, rad, g[2]);
    for (const [x, y, rad] of [
      [6, 13, 4],
      [13, 12, 5],
    ] as const)
      p.disc(x, y, rad, g[3]);
    p.set(5, 11, g[5]).set(12, 9, g[5]).set(13, 9, g[5]).set(7, 12, g[5]);
    p.rect(0, 19, 20, 1, skyOf(pal));
    book.add('bush', p, air);
  }
  {
    const p = sky();
    const stem = r('green');
    p.rect(10, 12, 1, 8, stem[2]).rect(11, 15, 2, 1, stem[3]).rect(8, 16, 2, 1, stem[3]);
    for (const [x, y] of [
      [10, 8],
      [7, 11],
      [13, 11],
      [10, 14],
    ] as const)
      p.disc(x, y, 2.4, c('pink', 2));
    p.disc(10, 11, 2, c('gold', 4)).set(10, 10, c('gold', 5));
    book.add('flower', p, air);
  }

  // ---- climbing
  {
    const w = r('wood');
    const p = sky();
    p.rect(3, 0, 3, 20, w[2]).rect(3, 0, 1, 20, w[4]).rect(5, 0, 1, 20, w[1]);
    p.rect(14, 0, 3, 20, w[2]).rect(14, 0, 1, 20, w[4]).rect(16, 0, 1, 20, w[1]);
    for (const y of [2, 7, 12, 17])
      p.rect(5, y, 9, 3, w[3])
        .rect(5, y, 9, 1, w[4])
        .rect(5, y + 2, 9, 1, w[1]);
    book.add('ladder', p, { grav: PULL.none });
  }

  // ---- doors: the exit (closed, glowing lamp) and the entrance (open, with light inside)
  {
    const w = r('wood');
    const top = new Pixels(20, 20, skyOf(pal));
    const bottom = new Pixels(20, 20, skyOf(pal));
    const door = new Pixels(20, 40, skyOf(pal));
    bevel(door, 2, 2, 16, 38, w, 2, 2);
    door.rect(5, 5, 10, 14, w[3]).frame(5, 5, 10, 14, w[1]);
    door.rect(5, 22, 10, 14, w[3]).frame(5, 22, 10, 14, w[1]);
    door.rect(6, 6, 8, 1, w[4]).rect(6, 23, 8, 1, w[4]);
    door.disc(14.5, 22, 1.8, c('gold', 3)).set(14, 21, c('gold', 5));
    // the lamp over the door: a gold arrow pointing in
    door.disc(10, 0, 0, c('gold', 4));
    door.rect(4, 0, 12, 2, c('gold', 3));
    top.px.set(door.crop(0, 0, 20, 20).px);
    bottom.px.set(door.crop(0, 20, 20, 20).px);
    book.add('doorTop', top, air);
    book.add('doorBottom', bottom, air);
  }
  {
    const w = r('wood');
    const arch = new Pixels(20, 40, skyOf(pal));
    arch.rect(2, 4, 16, 36, c('ink', 0));
    for (let y = 4; y < 40; y++) arch.rect(3, y, 14, 1, y < 14 ? c('gold', 1) : c('ink', 1));
    arch.rect(3, 4, 14, 3, c('ink', 0));
    arch.disc(10, 6, 0, c('ink', 0));
    // an open door swung back against the left side
    arch.rect(0, 4, 3, 36, w[2]).rect(0, 4, 1, 36, w[4]).rect(2, 4, 1, 36, w[1]);
    // the frame
    arch.rect(2, 2, 16, 2, w[1]).rect(17, 4, 2, 36, w[1]).rect(18, 4, 1, 36, w[0]);
    // a doormat at the foot
    arch.rect(4, 38, 12, 2, c('red', 2)).rect(4, 38, 12, 1, c('red', 3));
    // light spilling in
    for (let y = 8; y < 34; y++) arch.rect(5, y, 4, 1, y < 20 ? c('gold', 2) : c('gold', 1));
    book.add('doorwayTop', arch.crop(0, 0, 20, 20), air);
    book.add('doorwayBottom', arch.crop(0, 20, 20, 20), air);
  }

  // ---- things to pick up, and to keep away from
  {
    // a coin: touch it for 10 points and it is gone
    const p = sky();
    p.disc(9.5, 9.5, 7, c('gold', 0)).disc(9.5, 9.5, 6, c('gold', 3)).disc(9.5, 9.5, 4, c('gold', 4));
    p.rect(9, 6, 2, 8, c('gold', 2)).rect(7, 8, 6, 1, c('gold', 1));
    p.set(6, 6, c('gold', 5)).set(7, 5, c('gold', 5)).set(6, 7, c('gold', 5));
    book.add('coin', p, { ...air, score: 10, touch: 'sky' });
  }
  {
    // a key: touch it and the key counter goes up by one
    const p = sky();
    const gold = r('gold');
    p.disc(5.5, 9.5, 4.5, gold[1]).disc(5.5, 9.5, 3.5, gold[4]).disc(5.5, 9.5, 1.6, skyOf(pal));
    p.rect(9, 9, 9, 2, gold[3]).rect(9, 9, 9, 1, gold[5]).rect(9, 11, 9, 1, gold[1]);
    p.rect(14, 11, 2, 3, gold[3]).rect(17, 11, 2, 4, gold[3]);
    p.set(3, 7, gold[5]).set(4, 6, gold[5]);
    book.add('key', p, { ...air, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
  }
  {
    // spikes: they hurt, so you jump over them
    const p = sky();
    const s = r('stone');
    p.rect(0, 15, 20, 5, s[1]).rect(0, 15, 20, 1, s[3]);
    for (const x of [1, 7, 13]) {
      for (let y = 0; y < 15; y++) {
        const half = Math.ceil(((y + 1) / 15) * 3);
        p.rect(x + 3 - half, 15 - 15 + y, half * 2, 1, y < 4 ? s[4] : s[3]);
      }
      for (let y = 0; y < 15; y++) p.set(x + 3 + Math.ceil(((y + 1) / 15) * 3) - 1, y, s[2]);
    }
    book.add('spikes', outline(p, ink, { transparent: skyOf(pal) }), { solid: SOLID, hp: -10 });
  }
}
