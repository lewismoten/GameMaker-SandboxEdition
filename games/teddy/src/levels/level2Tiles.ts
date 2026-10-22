// Level 2's background blocks, Maple Street: houses in three colors with porches (the porch
// roof is an awning to stand on), sprinklers whose lawn and hedge blocks spray for a while
// and rest (a next/ntime chain; the spray is a gravity block that blasts Teddy back), street
// furniture, a maple tree, the kids on the porches (their raised hands are monsters placed
// on the map beside them) and the mail carrier.
import { Pixels, rng } from '../../../kit/pixels';
import { blob, micro, speckle } from '../art/draw';
import { GRAV, Tiles } from './level';
import { kid, mailCarrier } from '../sprites/folks';
import { dogHouseLibrary } from '../sprites/library';
import { CTR } from '../ids';
import { sign } from './level1Tiles';
import { bricks, c, canvas, cloud, copy, cut, dirt, hedge, leaves, picket, r, siding, sky, trunk, tuft, windowOn } from '../blocks/tiles';

export const G = 40;

/** Concrete sidewalk slabs. */
function sidewalk(seed: number): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 20, r('stone'), 3, 1, seed, 0.2);
  p.rect(0, 0, 20, 2, c('stone', 4)).rect(0, 2, 20, 1, c('stone', 2));
  p.rect(seed % 2 ? 19 : 9, 0, 1, 20, c('stone', 1));
  p.rect(0, 16, 20, 4, c('stone', 2)).rect(0, 16, 20, 1, c('stone', 4));
  return p;
}

function road(dashes: boolean, seed: number): Pixels {
  const p = new Pixels(20, 20);
  speckle(p, 0, 0, 20, 20, r('asphalt'), 1, 1, seed, 0.3);
  if (dashes) p.rect(2, 9, 12, 2, c('yellow', 3));
  return p;
}

/** House walls in four colors; windows; a door; the roof; porch parts. */
function wallOf(color: string): Pixels {
  return color === 'brick' ? bricks(5) : siding(color);
}

export function streetTiles(): Tiles {
  const t = new Tiles();
  for (let k = 0; k < 4; k++) t.air(`sky${k}`, sky(k));
  for (let k = 0; k < 2; k++) for (let part = 0; part < 3; part++) t.air(`cloud${k}${part}`, cloud(k, part, k * 5 + 2));
  t.wall('walk', sidewalk(1));
  t.wall('walk2', sidewalk(2));
  t.wall('road', road(false, 3));
  t.wall('roadLine', road(true, 4));
  t.wall('deep', dirt(5, true));
  t.wall(
    'bed',
    (() => {
      const p = dirt(6);
      p.rect(0, 0, 20, 3, c('dirt', 4));
      return p;
    })(),
  );
  t.air('hedgeTop', hedge(true, 21));
  t.air('hedge', hedge(false, 23));
  t.wall('hedgeWall', hedge(false, 25));
  t.air('lawn', tuft(new Pixels(20, 20, c('grass', 2)), 31));
  t.air(
    'arch',
    (() => {
      const p = hedge(false, 26);
      p.rect(2, 4, 16, 16, c('leaf', 0));
      blob(p, 10, 6, 8, 5, [c('leaf', 0)], 0, 0);
      return tuft(p, 34);
    })(),
  );
  t.air('lawnFence', picket(tuft(new Pixels(20, 20, c('grass', 2)), 32), true));
  t.air('lawnFlower', tuft(new Pixels(20, 20, c('grass', 2)), 33, 'pink'));

  // Houses: walls and windows per color; shared roof, door and porch pieces.
  const colors = ['siding', 'paint', 'brick', 'yellow'];
  for (const col of colors) {
    t.air(`wall_${col}`, wallOf(col));
    t.air(`win_${col}`, windowOn(wallOf(col), false, col === 'yellow' ? 'blue' : 'red'));
    const post = copy(wallOf(col));
    post.rect(8, 0, 4, 20, c('paint', 3)).rect(8, 0, 1, 20, c('paint', 1));
    t.air(`post_${col}`, post);
    const door = canvas(1, 2, () => wallOf(col));
    door.rect(3, 4, 14, 36, c('red', 1)).frame(3, 4, 14, 36, c('ink', 0));
    door.rect(6, 8, 8, 8, c('sky', 6)).rect(13, 24, 2, 2, c('gold', 2));
    t.air(`doorTop_${col}`, door.crop(0, 0, 20, 20));
    t.air(`doorBot_${col}`, door.crop(0, 20, 20, 20));
  }
  const roofRow = (left: boolean, right: boolean, eave: boolean) => {
    const p = sky(1);
    for (let y = 0; y < 20; y++) {
      const inset = eave ? 0 : Math.max(0, 19 - y);
      const x0 = left ? inset : 0;
      const x1 = right ? 20 - inset : 20;
      for (let x = x0; x < x1; x++) p.set(x, y, (y + (x >> 2)) % 5 === 4 ? c('roof', 0) : c('roof', y < 2 ? 3 : 2));
    }
    if (eave) p.rect(0, 16, 20, 4, c('paint', 2)).rect(0, 16, 20, 1, c('paint', 3));
    return p;
  };
  t.air('roofL', roofRow(true, false, false));
  t.air('roof', roofRow(false, false, false));
  t.air('roofR', roofRow(false, true, false));
  t.air('eave', roofRow(false, false, true));
  // the porch roof is an awning you can stand on; the porch floor is a step
  t.ledge(
    'awning',
    (() => {
      const p = sky(2);
      for (let x = 0; x < 20; x++) p.rect(x, 0, 1, 10, (x >> 2) % 2 ? c('paint', 3) : c('green', 1));
      p.rect(0, 10, 20, 2, c('green', 0));
      for (let x = 0; x < 20; x += 4) blob(p, x + 2, 11, 2, 2, (x >> 2) % 2 ? [c('paint', 2), c('paint', 3)] : [c('green', 0), c('green', 1)], 0, 1);
      return p;
    })(),
  );
  t.wall(
    'porch',
    (() => {
      const p = new Pixels(20, 20, c('wood', 2));
      for (let y = 0; y < 20; y += 5) p.rect(0, y, 20, 1, c('wood', 0));
      p.rect(0, 0, 20, 3, c('wood', 4));
      return p;
    })(),
  );

  // Sprinklers: the lawn and hedge blocks over them spray for a while, then rest. The
  // spray doesn't hurt; it blasts Teddy back the way he came (gravity to the left).
  const spray = (base: Pixels, on: boolean, seed: number, head: boolean) => {
    const p = copy(base);
    if (head) p.rect(8, 16, 4, 4, c('metal', 2)).rect(9, 14, 2, 2, c('metal', 4));
    if (on) {
      const R = rng(seed);
      for (let i = 0; i < 40; i++) {
        const x = Math.floor(R() * 20);
        const y = Math.floor(R() * 20);
        p.set(x, y, c('water', 3)).set(x, y + 1, c('water', 2));
      }
    }
    return p;
  };
  const lawn = t.pic('lawn');
  const hedgeP = t.pic('hedge');
  for (const ph of ['A', 'B']) {
    const offFor = ph === 'A' ? 40 : 30;
    const onFor = ph === 'A' ? 26 : 30;
    t.air(`spray${ph}hOff`, spray(hedgeP, false, 1, false), { next: `spray${ph}hOn`, ntime: offFor });
    t.air(`spray${ph}hOn`, spray(hedgeP, true, 2, false), { next: `spray${ph}hOff`, ntime: onFor, grav: GRAV.down | GRAV.left });
    t.air(`spray${ph}lOff`, spray(lawn, false, 3, false), { next: `spray${ph}lOn`, ntime: offFor });
    t.air(`spray${ph}lOn`, spray(lawn, true, 4, false), { next: `spray${ph}lOff`, ntime: onFor, grav: GRAV.down | GRAV.left });
    t.air(`spray${ph}headOff`, spray(lawn, false, 5, true), { next: `spray${ph}headOn`, ntime: offFor });
    t.air(`spray${ph}headOn`, spray(lawn, true, 6, true), { next: `spray${ph}headOff`, ntime: onFor, grav: GRAV.down | GRAV.left });
  }

  // Street furniture.
  t.wall(
    'hydrant',
    (() => {
      const p = copy(lawn);
      p.rect(6, 6, 8, 14, c('red', 2)).rect(5, 4, 10, 3, c('red', 3)).rect(8, 2, 4, 2, c('red', 3)).rect(3, 10, 14, 3, c('red', 1));
      p.rect(7, 7, 2, 12, c('red', 3));
      return p;
    })(),
  );
  t.wall(
    'table',
    (() => {
      const p = copy(lawn);
      p.rect(0, 3, 20, 3, c('wood', 4)).rect(0, 6, 20, 1, c('wood', 1));
      p.rect(2, 7, 2, 13, c('wood', 1)).rect(16, 7, 2, 13, c('wood', 1));
      p.rect(3, 0, 5, 3, c('blue', 2)).rect(11, 1, 6, 2, c('yellow', 2)).rect(13, 0, 2, 1, c('red', 2));
      return p;
    })(),
  );
  t.air('saleSign', sign(lawn, 'SALE'));
  t.air(
    'busSign',
    (() => {
      const p = copy(lawn);
      p.rect(9, 4, 2, 16, c('metal', 2));
      p.rect(3, 0, 14, 8, c('blue', 2)).frame(3, 0, 14, 8, c('paint', 3));
      micro(p, 5, 2, 'BUS', c('paint', 3));
      return p;
    })(),
  );
  t.wall(
    'bench',
    (() => {
      const p = copy(lawn);
      p.rect(0, 2, 20, 3, c('green', 1)).rect(0, 7, 20, 3, c('green', 1)).rect(0, 2, 20, 1, c('green', 2));
      p.rect(2, 10, 2, 10, c('metal', 1)).rect(16, 10, 2, 10, c('metal', 1));
      return p;
    })(),
  );
  t.air(
    'mailbox',
    (() => {
      const p = copy(lawn);
      p.rect(9, 9, 2, 11, c('wood', 1));
      blob(p, 10, 6, 6, 4, r('blue'), 0, 3);
      p.rect(4, 6, 12, 4, c('blue', 2));
      p.rect(15, 2, 1, 5, c('red', 2)).rect(15, 2, 3, 2, c('red', 2));
      return p;
    })(),
  );
  const bin = (tipped: boolean) => {
    const p = copy(lawn);
    if (tipped) {
      p.rect(0, 9, 17, 11, c('blue', 2)).rect(17, 8, 3, 12, c('blue', 1));
      for (let x = 2; x < 17; x += 4) p.rect(x, 9, 1, 11, c('blue', 1));
      p.rect(13, 16, 7, 4, c('paint', 3)).rect(16, 14, 3, 2, c('green', 2));
    } else {
      p.rect(3, 4, 14, 16, c('blue', 2)).rect(2, 2, 16, 3, c('blue', 3));
      for (let x = 5; x < 17; x += 4) p.rect(x, 5, 1, 15, c('blue', 1));
    }
    return p;
  };
  t.wall('bin', bin(false));
  t.wall('binTipped', bin(true));
  t.air(
    'litter',
    (() => {
      const p = copy(lawn);
      p.rect(2, 16, 5, 4, c('paint', 3)).rect(10, 17, 4, 3, c('green', 2)).rect(15, 15, 3, 5, c('paint', 2));
      micro(p, 3, 16, 'N', c('ink', 1));
      return p;
    })(),
  );

  // A maple tree (Maple Street, after all).
  for (let k = 0; k < 4; k++) t.air(`leaf${k}`, leaves(80 + k, sky(k)));
  t.air('trunk', trunk(t.pic('hedge')));
  t.air('trunkLawn', trunk(lawn));
  t.air('trunkTop', trunk(leaves(85, sky(2))));

  // Kids on the porches (their hands are monsters), the mail carrier.
  t.on('kidBoy', kid('boy'), 'wall_brick');
  t.on('kidGirl', kid('girl'), 'wall_siding');
  t.on('kidGirl2', kid('girl'), 'wall_yellow');
  const mc = mailCarrier();
  t.on('mailTop', mc.crop(0, 0, 20, 20), 'hedge');
  t.on('mailBot', mc.crop(0, 20, 20, 20), 'lawn');

  // The Dog House, the tiny little library in front of the blue house: take a book (fetch
  // it off the shelf), and the paw-knob drawer has snacks. The rock cubby's red roof is a
  // ledge, so Teddy can hop up and browse.
  const lib = (st: { gap?: boolean; open?: boolean; glimpse?: boolean }) => {
    const p = canvas(2, 3, (_bx, by) => (by < 2 ? t.pic('wall_siding') : lawn));
    return cut(dogHouseLibrary(p, st));
  };
  const shut = lib({});
  t.air('libRoofL', shut[0][0]);
  // the right half of the roof, over the top of the red door, is solid (stand on it, bonk
  // on it), but a paw raised from the rock cubby reaches it: the scene's link into the Dog House
  t.wall('libRoofR', lib({ glimpse: true })[0][1]);
  t.air('libGap', lib({ gap: true })[1][0]);
  t.add('libBooks', shut[1][0], { obj: true, score: 250, touch: 'libGap', grav: GRAV.down });
  t.air('libDrawerOpen', lib({ open: true })[1][1]);
  t.air('libDrawer', shut[1][1], { effect: CTR.treats, eamt: 3, score: 30, touch: 'libDrawerOpen' });
  t.ledge('libRocksL', shut[2][0]);
  t.ledge('libRocksR', shut[2][1]);

  nook(t);

  t.klownCar(
    (_bx, by) => (by === 0 ? t.pic('hedge') : t.pic('lawn')),
    'tie',
    t.pic('hedgeTop'),
    (by) => (by === 0 ? t.pic('hedge') : t.pic('lawn')),
  );
  return t;
}

/**
 * Inside the Dog House, Teddy-sized: white painted walls, a shelf of giant books, an open
 * book with blank pages, the red door seen from inside, and the felt egg on the shelf.
 */
function nook(t: Tiles): void {
  const back = (() => {
    const p = new Pixels(20, 20);
    speckle(p, 0, 0, 20, 20, r('paint'), 3, 1, 61, 0.12);
    p.rect(9, 0, 1, 20, c('paint', 2));
    return p;
  })();
  t.air('dhBack', back);
  t.wall(
    'dhWall',
    (() => {
      const p = new Pixels(20, 20, c('ink', 1));
      speckle(p, 0, 0, 20, 20, r('wood'), 0, 1, 62, 0.2);
      return p;
    })(),
  );
  t.wall(
    'dhFloor',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('wood'), 2, 1, 63, 0.15);
      p.rect(0, 0, 20, 2, c('wood', 4)).rect(0, 2, 20, 1, c('wood', 1)).rect(0, 12, 20, 1, c('wood', 1));
      return p;
    })(),
  );
  t.ledge(
    'dhShelf',
    (() => {
      const p = copy(back);
      p.rect(0, 0, 20, 5, c('wood', 3)).rect(0, 0, 20, 1, c('wood', 4)).rect(0, 4, 20, 1, c('wood', 1));
      p.rect(0, 5, 20, 2, c('paint', 1));
      return p;
    })(),
  );
  // giant books standing up, two blocks tall: spines with a gold band, no titles
  const book = (ramp: string, seed: number) => {
    const p = canvas(1, 2, back);
    const R = rng(seed);
    const w = 14 + Math.floor(R() * 4);
    const x0 = Math.floor((20 - w) / 2);
    const top = 4 + Math.floor(R() * 6);
    p.rect(x0, top, w, 40 - top, c(ramp, 2)).rect(x0, top, 2, 40 - top, c(ramp, 3)).rect(x0 + w - 2, top, 2, 40 - top, c(ramp, 1));
    p.frame(x0, top, w, 40 - top, c('ink', 0));
    p.rect(x0 + 1, top + 5, w - 2, 2, c('gold', 2)).rect(x0 + 1, 33, w - 2, 2, c('gold', 2));
    return cut(p);
  };
  for (const [k, ramp] of ['blue', 'red', 'green', 'purple'].entries()) {
    const [[top], [bot]] = book(ramp, 64 + k);
    t.air(`dhBook${k}T`, top);
    t.air(`dhBook${k}B`, bot);
  }
  // an open book lying flat, every page blank
  const open = canvas(2, 1, back);
  open.rect(1, 12, 38, 8, c('red', 1)).rect(1, 19, 38, 1, c('ink', 0));
  for (let x = 2; x < 38; x++) {
    const sag = Math.round(2 * Math.sin(((x - 2) / 36) * Math.PI));
    open.rect(x, 8 + sag, 1, 11 - sag, c('paint', 3));
    open.set(x, 8 + sag, c('paint', 2));
  }
  open.rect(19, 9, 2, 10, c('paint', 1));
  const [[pageL, pageR]] = cut(open);
  t.air('dhPageL', pageL);
  t.air('dhPageR', pageR);
  // the red door from inside: the frame, and Maple Street through the plexi
  const door = canvas(1, 2, back);
  door.rect(1, 2, 18, 38, c('red', 2)).frame(1, 2, 18, 38, c('ink', 0));
  door.rect(4, 5, 12, 26, c('sky', 6)).rect(4, 22, 12, 9, c('grass', 3)).rect(4, 20, 12, 2, c('leaf', 2));
  for (let k = 0; k < 6; k++) door.set(6 + k, 6 + k, c('paint', 3));
  door.rect(13, 32, 3, 3, c('paint', 3));
  const [[doorT], [doorB]] = cut(door);
  t.air('dhDoorT', doorT);
  t.air('dhDoorB', doorB);
  t.keepsake(back, 'dhBack');
}
