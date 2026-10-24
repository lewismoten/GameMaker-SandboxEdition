// Level 1's background blocks, Doc Leo's house at dawn: three floors and a basement cut
// open like a dollhouse. Wallpaper for every room, floorboards between the floors (solid,
// but for the stairwell, the laundry chute and the hatch over the bed), ledge stairs, the
// furniture (the couch, counters and shelves to stand on), a bed that bounces Teddy up
// through the attic hatch (gravity up), a washer that shakes (next/ntime), a toaster that
// pops toast (a block giving birth to a monster), the laundry basket in the basement, and
// outside the doggy door, the driveway where THE CHEZ is charging.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, gradient, micro, speckle } from '../art/draw';
import { GRAV, Tiles } from './level';
import { bricks, c, canvas, cloud, copy, cut, dirt, grassTop, hedge, r, sky, tuft, windowOn } from '../blocks/tiles';
import { bandAt, floorboards, road, wallpaper, wideSign } from './common';

/** The ground floor's floor row (Teddy walks on it at row 39). */
export const G = 40;
/** The upstairs floor, the attic floor and the basement floor. */
export const UP = 33;
export const ATTIC = 26;
export const BASE = 47;

/** Draws a w x h block picture over per-cell bases and adds its blocks as `name<x><y>`. */
export function art(
  t: Tiles,
  name: string,
  w: number,
  h: number,
  base: (bx: number, by: number) => Pixels,
  draw: (p: Pixels) => void,
  kind: (bx: number, by: number) => 'air' | 'wall' | 'ledge' = () => 'air',
): void {
  const p = canvas(w, h, base);
  draw(p);
  const cells = cut(p);
  for (let by = 0; by < h; by++) for (let bx = 0; bx < w; bx++) t[kind(bx, by)](`${name}${bx}${by}`, cells[by][bx]);
}

/** A door frame (the way from one room to the next) over a wall. */
function doorFrame(wall: Pixels, top: boolean): Pixels {
  const p = copy(wall);
  p.rect(1, top ? 2 : 0, 18, top ? 18 : 20, c('peach', 0));
  p.rect(0, top ? 0 : 0, 2, 20, c('wood', 3)).rect(18, 0, 2, 20, c('wood', 3));
  if (top) p.rect(0, 0, 20, 3, c('wood', 3)).rect(0, 3, 20, 1, c('wood', 1));
  p.rect(2, top ? 4 : 0, 1, top ? 16 : 20, c('wood', 1));
  return p;
}

/** The floor between two stories: boards on top, plaster ceiling underneath. */
function storyFloor(seed: number, ceiling: Pixels): Pixels {
  const p = floorboards(seed);
  p.rect(0, 7, 20, 13, c('paint', 2));
  speckle(p, 0, 8, 20, 12, r('paint'), 2, 1, seed + 3, 0.1);
  p.rect(0, 7, 20, 2, c('wood', 1));
  p.rect(0, 18, 20, 2, c('paint', 1));
  void ceiling;
  return p;
}

export function houseTiles(): Tiles {
  const t = new Tiles();
  // Outside: a pink dawn sky, clouds, the lawn and the driveway.
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let part = 0; part < 3; part++) t.air(`cloud${part}`, cloud(1, part, 7));
  t.wall('grass', grassTop(1));
  t.wall('dirt', dirt(3));
  t.wall('deep', dirt(5, true));
  t.wall('drive', road(false, 7));
  t.air('tuft', tuft(sky(3), 11));
  t.air('hedgeTop', hedge(true, 21, sky(bandAt(29, G))));
  t.wall('hedgeWall', hedge(false, 25));

  // The house outside: a shingled roof and a chimney.
  const roofRow = (k: number, slope: 'L' | 'R' | '') => {
    const p = sky(k);
    for (let y = 0; y < 20; y++) {
      const inset = slope ? 19 - y : 0;
      const x0 = slope === 'L' ? inset : 0;
      const x1 = slope === 'R' ? 20 - inset : 20;
      for (let x = x0; x < x1; x++) p.set(x, y, (y + (x >> 2)) % 5 === 4 ? c('roof', 0) : c('roof', y < 2 ? 3 : 2));
    }
    return p;
  };
  t.air('roofL', roofRow(0, 'L'));
  t.air('roofR', roofRow(0, 'R'));
  t.wall('roof', roofRow(1, ''));
  t.air(
    'chimney',
    (() => {
      const p = bricks(9);
      p.rect(0, 0, 20, 3, c('stone', 2));
      return p;
    })(),
  );

  // The rooms. Each has its own wallpaper.
  const papers: [string, Pixels][] = [
    ['living', wallpaper('peach', 'stripes', 1)],
    ['hall', wallpaper('yellow', 'sprig', 2, 'red')],
    ['kitchen', wallpaper('teal', 'tiles', 3, 'paint')],
    ['laundry', wallpaper('paint', 'diamonds', 4)],
    ['bedroom', wallpaper('blue', 'stars', 6, 'yellow')],
    ['bath', wallpaper('teal', 'tiles', 7, 'teal')],
    ['craft', wallpaper('pink', 'sprig', 8, 'purple')],
  ];
  const windows = ['living', 'hall', 'kitchen', 'bedroom', 'bath', 'craft'];
  const doors = ['hall', 'craft'];
  for (const [name, px] of papers) {
    t.air(name, px);
    if (windows.includes(name)) t.air(`${name}Win`, windowOn(px, false, name === 'bedroom' ? 'blue' : 'red'));
    if (doors.includes(name)) {
      t.air(`${name}Door`, doorFrame(px, false));
      t.air(`${name}DoorTop`, doorFrame(px, true));
    }
  }
  // Attic rafters and the basement's cinder blocks.
  const attic = (() => {
    const p = new Pixels(20, 20, c('wood', 0));
    speckle(p, 0, 0, 20, 20, r('wood'), 1, 1, 12, 0.2);
    p.rect(8, 0, 4, 20, c('wood', 2)).rect(8, 0, 1, 20, c('wood', 3));
    return p;
  })();
  t.air('attic', attic);
  const cinder = (() => {
    const p = new Pixels(20, 20, c('stone', 1));
    for (let row = 0; row < 2; row++)
      for (let bx = -1; bx < 2; bx++) {
        const x = bx * 20 + (row % 2) * 10;
        speckle(p, x + 1, row * 10 + 1, 18, 8, r('stone'), 2, 1, 13 + row + bx, 0.2);
      }
    return p;
  })();
  t.air('cinder', cinder);
  t.air(
    'cinderWin',
    (() => {
      const p = copy(cinder);
      p.rect(3, 2, 14, 7, c('ink', 1)).rect(4, 3, 12, 5, c('sky', 3)).rect(9, 3, 1, 5, c('stone', 2));
      return p;
    })(),
  );

  // Floors: boards between the stories, kitchen checkers, basement concrete, attic planks.
  t.wall('floor', storyFloor(1, t.pic('living')));
  t.wall(
    'kfloor',
    (() => {
      const p = storyFloor(3, t.pic('kitchen'));
      for (let x = 0; x < 20; x += 5) p.rect(x, 0, 5, 6, (x / 5) % 2 ? c('ink', 1) : c('paint', 3));
      p.rect(0, 6, 20, 1, c('ink', 0));
      return p;
    })(),
  );
  t.wall(
    'concrete',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('stone'), 2, 1, 14, 0.25);
      p.rect(0, 0, 20, 2, c('stone', 3));
      return p;
    })(),
  );
  // The outer walls of the house, seen cut away: siding outside, studs inside.
  t.wall(
    'outer',
    (() => {
      const p = new Pixels(20, 20, c('wood', 2));
      p.rect(0, 0, 6, 20, c('siding', 2)).rect(0, 0, 1, 20, c('siding', 3));
      p.rect(6, 0, 1, 20, c('ink', 1)).rect(13, 0, 7, 20, c('paint', 2));
      for (let y = 2; y < 20; y += 5) p.rect(7, y, 6, 1, c('wood', 0));
      return p;
    })(),
  );
  t.wall(
    'outerR',
    (() => {
      const p = t.pic('outer').flipX();
      return p;
    })(),
  );
  // The doggy door in the back wall: a flap, and the way out.
  t.air(
    'doggyDoor',
    (() => {
      const p = copy(t.pic('outerR'));
      p.rect(3, 6, 14, 14, c('ink', 0)).rect(4, 7, 12, 13, c('wood', 1)).rect(4, 7, 12, 2, c('wood', 3));
      p.rect(9, 13, 2, 2, c('gold', 2));
      return p;
    })(),
  );
  t.wall('foundation', bricks(15, 'stone', 'ink'));

  // Ledge stairs (stand on the tread, hop up through from below).
  for (const room of ['hall', 'laundry', 'cinder']) {
    if (room !== 'hall') {
      t.ledge(
        `${room}Step`,
        (() => {
          const p = copy(t.pic(room));
          p.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('wood', 0));
          return p;
        })(),
      );
      continue;
    }
    t.ledge(
      `${room}Step`,
      (() => {
        const p = copy(t.pic(room));
        p.rect(0, 0, 20, 4, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('wood', 0));
        p.rect(0, 5, 20, 15, c('wood', 1));
        for (let y = 7; y < 20; y += 4) p.rect(0, y, 20, 1, c('wood', 0));
        return p;
      })(),
    );
    t.air(
      `${room}Rail`,
      (() => {
        const p = copy(t.pic(room));
        for (let x = 2; x < 20; x += 6) p.rect(x, 4, 2, 16, c('paint', 3));
        p.rect(0, 2, 20, 3, c('wood', 2)).rect(0, 2, 20, 1, c('wood', 4));
        return p;
      })(),
    );
  }

  // Living room: the couch, Gwinn's big bed (empty), Teddy's little one, the TV, a lamp, a rug.
  const L = () => t.pic('living');
  art(
    t,
    'couch',
    3,
    2,
    L,
    (p) => {
      blob(p, 30, 26, 28, 10, r('red'), 0, 3, 0.9);
      p.rect(4, 26, 52, 10, c('red', 1)).rect(4, 26, 52, 2, c('red', 3));
      blob(p, 6, 26, 6, 10, r('red'), 0, 3);
      blob(p, 54, 26, 6, 10, r('red'), 0, 3);
      for (const x of [12, 30, 48]) blob(p, x, 29, 8, 4, r('red'), 1, 3);
      p.rect(6, 36, 4, 4, c('wood', 0)).rect(50, 36, 4, 4, c('wood', 0));
    },
    (_bx, by) => (by === 1 ? 'ledge' : 'air'),
  );
  t.air(
    'gwinnBed',
    (() => {
      const p = copy(L());
      blob(p, 10, 15, 10, 5, r('purple'), 0, 3);
      blob(p, 10, 15, 6, 2, r('purple'), 0, 1);
      p.rect(7, 13, 1, 1, c('pink', 3)).rect(12, 14, 1, 1, c('yellow', 3)).rect(4, 12, 1, 1, c('blue', 3));
      micro(p, 1, 2, 'GWINN', c('purple', 1));
      return p;
    })(),
  );
  t.air(
    'teddyBed',
    (() => {
      const p = copy(L());
      blob(p, 10, 16, 8, 4, r('blue'), 0, 3);
      blob(p, 10, 16, 5, 2, r('blue'), 1, 2);
      micro(p, 1, 4, 'TEDDY', c('blue', 1));
      return p;
    })(),
  );
  art(t, 'tv', 1, 2, L, (p) => {
    p.rect(1, 14, 18, 16, c('wood', 1)).rect(1, 14, 18, 1, c('wood', 3));
    p.rect(3, 17, 14, 10, c('ink', 0)).rect(4, 18, 10, 8, c('teal', 1));
    p.set(15, 20, c('red', 3)).set(15, 23, c('metal', 3));
    p.line(8, 14, 4, 6, c('metal', 2)).line(11, 14, 16, 5, c('metal', 2));
    p.rect(2, 30, 16, 10, c('wood', 2)).rect(2, 30, 16, 1, c('wood', 4)).rect(3, 34, 14, 1, c('wood', 0));
  });
  t.air(
    'rug',
    (() => {
      const p = copy(L());
      p.rect(0, 17, 20, 3, c('purple', 1)).rect(0, 18, 20, 1, c('yellow', 2));
      return p;
    })(),
  );
  t.air(
    'confetti',
    (() => {
      const p = copy(L());
      const R = rng(41);
      for (let i = 0; i < 12; i++) p.set(Math.floor(R() * 20), 15 + Math.floor(R() * 5), c(['red', 'yellow', 'blue', 'green', 'pink'][i % 5], 3));
      return p;
    })(),
  );
  // A framed photo of the Klown Klub over the couch.
  t.air(
    'klubPhoto',
    (() => {
      const p = copy(L());
      p.rect(2, 3, 16, 13, c('gold', 1)).rect(4, 5, 12, 9, c('sky', 5));
      for (const [x, col] of [
        [6, 'red'],
        [9, 'purple'],
        [12, 'blue'],
      ] as [number, string][])
        p.rect(x, 9, 2, 5, c(col, 2)).rect(x, 7, 2, 2, c('skin', 3));
      return p;
    })(),
  );

  // The hall: coat hooks with Doc Leo's corduroy jacket, his big clown shoes by the door.
  t.air(
    'coat',
    (() => {
      const p = copy(t.pic('hall'));
      p.rect(2, 2, 16, 2, c('wood', 1));
      p.rect(5, 4, 10, 14, c('blue', 0)).rect(9, 4, 2, 14, c('purple', 2));
      for (let y = 6; y < 18; y += 2) p.rect(5, y, 4, 1, c('blue', 1)).rect(11, y, 4, 1, c('blue', 1));
      return p;
    })(),
  );

  // The kitchen: counters to hop on, the sink, the toaster, the fridge (two blocks wide, four
  // high: get on the counter first), the table.
  const K = () => t.pic('kitchen');
  const counter = (() => {
    const p = new Pixels(20, 20, c('wood', 2));
    p.rect(0, 0, 20, 3, c('stone', 4)).rect(0, 3, 20, 1, c('stone', 1));
    p.frame(2, 6, 16, 12, c('wood', 0)).rect(8, 10, 4, 1, c('metal', 3));
    return p;
  })();
  t.wall('counter', counter);
  t.air(
    'cabinet',
    (() => {
      const p = copy(K());
      p.rect(1, 2, 18, 14, c('wood', 2)).frame(1, 2, 18, 14, c('wood', 0)).rect(9, 2, 1, 14, c('wood', 0));
      p.rect(7, 12, 1, 2, c('metal', 3)).rect(11, 12, 1, 2, c('metal', 3));
      return p;
    })(),
  );
  t.air(
    'sink',
    (() => {
      const p = copy(K());
      p.rect(2, 16, 16, 4, c('metal', 3)).rect(3, 17, 14, 2, c('metal', 1));
      p.rect(9, 7, 2, 9, c('metal', 3)).rect(9, 7, 6, 2, c('metal', 3));
      return p;
    })(),
  );
  // The toaster: it pops toast every so often (the block gives birth to a toast monster).
  t.air(
    'toaster',
    (() => {
      const p = copy(K());
      p.rect(3, 9, 14, 11, c('metal', 3)).rect(3, 9, 14, 1, c('metal', 4)).frame(3, 9, 14, 11, c('metal', 0));
      p.rect(6, 8, 3, 2, c('ink', 0)).rect(11, 8, 3, 2, c('ink', 0));
      p.rect(16, 13, 3, 2, c('ink', 1));
      return p;
    })(),
  );
  art(
    t,
    'fridge',
    2,
    3,
    K,
    (p) => {
      p.rect(1, 2, 38, 58, c('paint', 3)).frame(1, 2, 38, 58, c('stone', 1));
      p.rect(2, 3, 2, 56, c('paint', 2));
      p.rect(1, 20, 38, 1, c('stone', 1));
      p.rect(32, 8, 2, 8, c('metal', 2)).rect(32, 26, 2, 16, c('metal', 2));
      // magnets and a drawing: Teddy and Gwinn, in crayon
      p.rect(8, 26, 14, 12, c('paint', 2)).frame(8, 26, 14, 12, c('stone', 2));
      blob(p, 13, 34, 3, 2, r('corgi'), 2, 3);
      blob(p, 18, 33, 3, 3, r('gwinn'), 2, 3);
      p.rect(12, 24, 2, 2, c('red', 2)).rect(24, 8, 3, 3, c('yellow', 3)).rect(10, 10, 3, 3, c('blue', 3));
    },
    () => 'wall',
  );
  art(
    t,
    'table',
    3,
    1,
    K,
    (p) => {
      p.rect(0, 0, 60, 4, c('wood', 3)).rect(0, 0, 60, 1, c('wood', 4)).rect(0, 4, 60, 1, c('wood', 0));
      p.rect(3, 5, 3, 15, c('wood', 1)).rect(54, 5, 3, 15, c('wood', 1));
    },
    () => 'ledge',
  );

  // The laundry room: the washer shakes (two pictures taking turns), the dryer, the chute.
  for (const ph of [0, 1]) {
    t.wall(
      `washer${ph}`,
      (() => {
        const p = copy(t.pic('laundry'));
        const dx = ph;
        p.rect(1 + dx, 1, 18, 19, c('paint', 3)).frame(1 + dx, 1, 18, 19, c('stone', 1));
        p.rect(2 + dx, 2, 16, 3, c('stone', 3))
          .set(4 + dx, 3, c('red', 3))
          .set(7 + dx, 3, c('green', 2));
        p.ring(10 + dx, 12, 5, c('stone', 1));
        p.disc(10 + dx, 12, 4, c('water', 2));
        p.set(8 + dx + ph, 10, c('fur', 2)).set(11 + dx, 13 - ph, c('pink', 3));
        return p;
      })(),
      { next: `washer${1 - ph}`, ntime: 2 },
    );
  }
  t.wall(
    'dryer',
    (() => {
      const p = copy(t.pic('laundry'));
      p.rect(1, 1, 18, 19, c('paint', 3)).frame(1, 1, 18, 19, c('stone', 1));
      p.rect(2, 2, 16, 3, c('stone', 3));
      p.ring(10, 12, 5, c('stone', 1));
      p.disc(10, 12, 4, c('ink', 1));
      return p;
    })(),
  );
  // The laundry chute: an open shaft through every floor (hop over its hole, or ride it down).
  for (const room of ['laundry', 'craft', 'cinder']) {
    t.air(
      `chute_${room}`,
      (() => {
        const p = copy(t.pic(room));
        p.rect(3, 0, 14, 20, c('metal', 1)).rect(3, 0, 1, 20, c('metal', 3)).rect(16, 0, 1, 20, c('metal', 0));
        return p;
      })(),
    );
  }
  t.air(
    'chuteHole',
    (() => {
      const p = new Pixels(20, 20, c('metal', 0));
      p.rect(0, 0, 3, 20, c('wood', 1)).rect(17, 0, 3, 20, c('wood', 1));
      p.rect(0, 0, 20, 2, c('wood', 3));
      return p;
    })(),
  );
  // The back of the laundry room: boots by the door, the stairs down.
  t.air(
    'boots',
    (() => {
      const p = copy(t.pic('laundry'));
      p.rect(3, 10, 5, 10, c('yellow', 2)).rect(3, 17, 8, 3, c('yellow', 2));
      p.rect(11, 12, 5, 8, c('red', 2)).rect(11, 17, 8, 3, c('red', 2));
      return p;
    })(),
  );

  // Upstairs: Doc Leo's bed bounces (gravity up, two pictures taking turns), straight up
  // through the hatch to the attic.
  const B = () => t.pic('bedroom');
  for (const ph of [0, 1])
    t.air(
      `bed${ph}`,
      (() => {
        const p = copy(B());
        p.rect(0, 10 - ph * 2, 20, 6, c('paint', 3)).rect(0, 10 - ph * 2, 20, 1, c('fur', 0));
        p.rect(0, 16 - ph * 2, 20, 4 + ph * 2, c('blue', 1));
        for (let x = 2; x < 20; x += 6) p.rect(x, 17 - ph * 2, 3, 2, c('yellow', 2));
        return p;
      })(),
      { grav: GRAV.up, next: `bed${1 - ph}`, ntime: 3 },
    );
  for (const ph of [0, 1])
    t.air(
      `boing${ph}`,
      (() => {
        const p = copy(B());
        for (let i = 0; i < 4; i++) p.set(3 + i * 4, (i * 7 + ph * 9) % 20, c('glow', 3));
        return p;
      })(),
      { grav: GRAV.up, next: `boing${1 - ph}`, ntime: 3 },
    );
  t.air(
    'headboard',
    (() => {
      const p = copy(B());
      p.rect(2, 4, 16, 16, c('wood', 2)).frame(2, 4, 16, 16, c('wood', 0));
      blob(p, 10, 15, 6, 4, r('paint'), 2, 3);
      return p;
    })(),
  );
  t.air(
    'hatch',
    (() => {
      const p = copy(t.pic('attic'));
      p.rect(0, 16, 20, 4, c('ink', 0));
      return p;
    })(),
  );
  // The closet of clown suits and a nightstand with Doc Leo's alarm clock.
  art(t, 'closet', 2, 2, B, (p) => {
    p.rect(1, 2, 38, 38, c('wood', 1)).rect(3, 4, 34, 34, c('ink', 1));
    p.rect(3, 6, 34, 1, c('metal', 3));
    const suits = ['purple', 'yellow', 'green', 'red', 'blue'];
    suits.forEach((col, i) => {
      p.rect(5 + i * 6, 7, 5, 20, c(col, 2));
      for (let y = 9; y < 27; y += 4) p.set(6 + i * 6 + (y % 3), y, c('paint', 3));
    });
    p.rect(6, 32, 8, 4, c('red', 2)).rect(20, 32, 10, 4, c('red', 2));
  });
  t.ledge(
    'nightstand',
    (() => {
      const p = copy(B());
      p.rect(2, 0, 16, 20, c('wood', 2)).rect(2, 0, 16, 2, c('wood', 4)).frame(2, 6, 16, 6, c('wood', 0));
      return p;
    })(),
  );
  // The bathroom: a tub of bubbles (gravity up: Teddy floats), the toilet, the sink.
  const H = () => t.pic('bath');
  for (const ph of [0, 1]) {
    t.air(
      `tub${ph}`,
      (() => {
        const p = copy(H());
        p.rect(0, 4, 20, 16, c('paint', 3)).rect(0, 4, 20, 2, c('fur', 0));
        p.rect(0, 6, 20, 6, c('water', 2));
        const R = rng(51 + ph);
        for (let i = 0; i < 6; i++) blob(p, R() * 20, 4 + R() * 4, 2 + R() * 2, 2, r('water'), 2, 3);
        return p;
      })(),
      { grav: GRAV.up, next: `tub${1 - ph}`, ntime: 6 },
    );
  }
  // The craft room: Doc Leo's balloon pump and felting table, and a breadboard computer.
  const C = () => t.pic('craft');
  art(
    t,
    'felting',
    3,
    1,
    C,
    (p) => {
      p.rect(0, 6, 60, 4, c('wood', 3)).rect(0, 6, 60, 1, c('wood', 4)).rect(4, 10, 3, 10, c('wood', 1)).rect(53, 10, 3, 10, c('wood', 1));
      blob(p, 10, 3, 6, 3, r('yellow'), 1, 3);
      blob(p, 24, 3, 5, 3, r('pink'), 1, 3);
      blob(p, 46, 3, 4, 3, r('blue'), 1, 3);
      p.line(36, 0, 38, 5, c('metal', 3)).line(40, 0, 38, 5, c('metal', 3));
    },
    () => 'ledge',
  );
  art(t, 'balloons', 1, 2, C, (p) => {
    blob(p, 6, 8, 5, 6, r('red'), 0, 3);
    blob(p, 14, 6, 5, 6, r('yellow'), 0, 3);
    blob(p, 10, 14, 5, 6, r('blue'), 0, 3);
    p.line(6, 14, 10, 34, c('ink', 1)).line(14, 12, 10, 34, c('ink', 1)).line(10, 20, 10, 34, c('ink', 1));
    p.rect(7, 34, 6, 6, c('metal', 2));
  });
  art(t, 'bread', 2, 1, C, (p) => {
    p.rect(2, 10, 36, 10, c('paint', 3)).frame(2, 10, 36, 10, c('stone', 2));
    for (let x = 4; x < 36; x += 2) p.set(x, 12, c('stone', 2)).set(x, 18, c('stone', 2));
    p.rect(8, 13, 10, 4, c('ink', 0)).rect(22, 13, 6, 4, c('ink', 0));
    micro(p, 9, 14, '6502', c('paint', 3));
    p.line(18, 15, 22, 15, c('red', 2)).line(28, 14, 34, 11, c('blue', 2)).line(6, 16, 9, 19, c('yellow', 2));
  });

  // The attic: boxes and a trunk to stand on.
  t.ledge(
    'box',
    (() => {
      const p = new Pixels(20, 20, c('wood', 3));
      p.frame(0, 0, 20, 20, c('wood', 1)).rect(0, 8, 20, 3, c('yellow', 1));
      micro(p, 3, 13, 'WIGS', c('wood', 0));
      return p;
    })(),
  );
  // the slope of the roof, from inside
  for (const side of ['L', 'R']) {
    t.wall(
      `rafter${side}`,
      (() => {
        const p = copy(t.pic('attic'));
        for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((side === 'L' ? x : 19 - x) < 19 - y) p.set(x, y, c('roof', 1));
        return p;
      })(),
    );
  }

  // The basement: the furnace, the workbench, crocks of root beer, the laundry basket.
  const Z = () => t.pic('cinder');
  art(t, 'furnace', 2, 2, Z, (p) => {
    p.rect(2, 6, 36, 34, c('metal', 1)).frame(2, 6, 36, 34, c('metal', 0));
    p.rect(14, 0, 8, 6, c('metal', 2));
    p.rect(10, 22, 20, 12, c('ink', 0)).rect(12, 26, 16, 6, c('glow', 2));
    for (let x = 13; x < 28; x += 3) p.set(x, 28, c('red', 3));
  });
  art(
    t,
    'bench',
    3,
    1,
    Z,
    (p) => {
      p.rect(0, 4, 60, 4, c('wood', 2)).rect(0, 4, 60, 1, c('wood', 4)).rect(3, 8, 3, 12, c('wood', 0)).rect(54, 8, 3, 12, c('wood', 0));
      // an old home computer and a soldering iron
      p.rect(8, 0, 18, 4, c('paint', 2)).rect(10, 1, 14, 2, c('wood', 1));
      p.rect(36, 2, 10, 2, c('metal', 2)).rect(46, 2, 3, 2, c('red', 2));
    },
    () => 'ledge',
  );
  art(t, 'crocks', 3, 1, Z, (p) => {
    for (const x of [10, 30, 50]) {
      blob(p, x, 12, 7, 8, r('wood'), 1, 4);
      p.rect(x - 5, 5, 10, 2, c('paint', 3));
      micro(p, x - 5, 10, 'RB', c('ink', 0));
    }
  });
  t.air(
    'shelfJars',
    (() => {
      const p = copy(Z());
      p.rect(0, 12, 20, 2, c('wood', 2));
      for (const [x, col] of [
        [2, 'red'],
        [8, 'yellow'],
        [14, 'green'],
      ] as [number, string][])
        p.rect(x, 5, 4, 7, c(col, 2)).rect(x, 4, 4, 1, c('gold', 2));
      return p;
    })(),
  );
  t.ledge(
    'basket',
    (() => {
      const p = copy(Z());
      p.rect(1, 6, 18, 14, c('hay', 2));
      for (let y = 6; y < 20; y += 3) p.rect(1, y, 18, 1, c('hay', 1));
      for (let x = 2; x < 19; x += 4) p.rect(x, 6, 1, 14, c('hay', 0));
      blob(p, 6, 5, 4, 3, r('blue'), 1, 3);
      blob(p, 13, 4, 5, 3, r('paint'), 2, 3);
      return p;
    })(),
  );

  // Outside the back: the step, the charger on its post, signs.
  t.ledge(
    'step',
    (() => {
      const p = sky(3);
      p.rect(0, 8, 20, 12, c('stone', 2)).rect(0, 8, 20, 2, c('stone', 4));
      return p;
    })(),
  );
  art(
    t,
    'charger',
    1,
    2,
    () => sky(3),
    (p) => {
      p.rect(8, 6, 4, 34, c('metal', 1));
      p.rect(4, 6, 12, 14, c('paint', 3)).frame(4, 6, 12, 14, c('ink', 0));
      p.rect(6, 9, 8, 3, c('green', 2)).set(7, 15, c('green', 3)).set(10, 15, c('green', 3));
      // the cable runs off to THE CHEZ's port, low on its back at the passenger side
      p.line(14, 20, 18, 26, c('ink', 0)).line(18, 26, 20, 28, c('ink', 0));
    },
  );
  // two blocks wide: 'SNIFF S' is too long for one
  const [sniffL, sniffR] = wideSign(L(), 'SNIFF S');
  t.air('signSniff', sniffL);
  t.air('signSniffR', sniffR);
  // and by the dog beds, the bark that clears the dust bunny just ahead (SPACE)
  const [woofL, woofR] = wideSign(L(), 'WOOF\nSPACE');
  t.air('signWoof', woofL);
  t.air('signWoofR', woofR);
  void gradient;
  return t;
}
