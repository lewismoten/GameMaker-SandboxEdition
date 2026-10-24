// Level 16's background blocks, The Teddy Course, inside the Big Top at night: the tent's
// canvas, the sawdust ring floor, crate walls and stacks, the little dirt mound and fence
// to dig under, the see-saw's step and fulcrum, the fast belt, the ball pit and its blinking
// boards (two beats), the station signs the Klown Klub painted, the flap into the dark ring,
// and the ring itself, dark, with the party waiting (and nobody making a sound).
import { Pixels } from '../../../kit/pixels';
import { speckle } from '../art/draw';
import { GRAV, Tiles } from './level';
import { boxFace, c, copy, r } from '../blocks/tiles';
import { wideSign } from './common';
import { tent } from './stageTiles';
import { art } from './parts';
import { leoOn } from '../sprites/leo';
import { KLUB } from '../sprites/klubfolk';

export const G = 40;
/** Ticks a blinking board stays, warns, and is gone (the same for both colors). */
export const BOARD = { on: 26, warn: 8, gone: 20 };

export function courseTiles(): Tiles {
  const t = new Tiles();
  const bg = tent();
  t.air('tent', bg);
  const dark = new Pixels(20, 20, c('ink', 0));
  for (let k = 0; k < 3; k++) dark.set((k * 7 + 3) % 20, (k * 11 + 5) % 20, c('purple', 0));
  t.air('dark', dark);
  // the sawdust ring floor, a crate (walls and stacks), the canvas wall at the ends
  t.wall(
    'floor',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('hay'), 1, 2, 5, 0.3);
      p.rect(0, 0, 20, 2, c('hay', 3)).rect(0, 2, 20, 1, c('hay', 0));
      return p;
    })(),
  );
  t.wall('crate', boxFace('wood', 3, 7));
  t.wall('crateRed', boxFace('red', 2, 9));
  t.wall(
    'canvas',
    (() => {
      const p = copy(bg);
      p.rect(0, 0, 20, 20, c('red', 1));
      for (let x = 0; x < 20; x += 10) p.rect(x, 0, 5, 20, c('paint', 2));
      return p;
    })(),
  );
  t.wall(
    'rail',
    (() => {
      const p = copy(bg);
      p.rect(0, 0, 20, 4, c('red', 2)).rect(0, 0, 20, 1, c('red', 3)).rect(2, 4, 3, 16, c('gold', 1)).rect(15, 4, 3, 16, c('gold', 1));
      return p;
    })(),
  );

  // Station 1: the door in a crate wall (its button is a monster), the doorway behind it.
  const frame = copy(bg);
  frame.rect(0, 14, 20, 6, c('wood', 2)).rect(0, 14, 20, 1, c('wood', 4));
  t.wall('doorTop', frame);
  const doorway = new Pixels(20, 20, c('ink', 1));
  doorway.rect(0, 0, 2, 20, c('wood', 2)).rect(18, 0, 2, 20, c('wood', 2));
  t.air('doorway', doorway);

  // Station 2: the fence (dig under it) and the tunnel under the floor.
  t.wall(
    'fence',
    (() => {
      const p = copy(bg);
      for (const x of [2, 12]) p.rect(x, 0, 6, 20, c('paint', 3)).rect(x + 5, 0, 1, 20, c('paint', 1));
      p.rect(0, 6, 20, 2, c('paint', 2)).rect(0, 14, 20, 2, c('paint', 2));
      return p;
    })(),
  );
  t.air(
    'tunnel',
    (() => {
      const p = new Pixels(20, 20);
      speckle(p, 0, 0, 20, 20, r('dirt'), 0, 1, 13, 0.2);
      return p;
    })(),
  );

  // Station 3: the see-saw's step (wait on it) and its fulcrum.
  t.ledge(
    'step',
    (() => {
      const p = copy(bg);
      p.rect(1, 0, 18, 4, c('red', 2)).rect(1, 0, 18, 1, c('red', 3)).rect(3, 4, 2, 16, c('red', 1)).rect(15, 4, 2, 16, c('red', 1));
      return p;
    })(),
  );
  t.air(
    'fulcrum',
    (() => {
      const p = copy(bg);
      for (let y = 6; y < 20; y++) p.rect(10 - Math.floor((y - 6) / 2), y, 1 + Math.floor((y - 6) / 2) * 2, 1, c('metal', y < 8 ? 3 : 1));
      return p;
    })(),
  );

  // Station 4: the fast belt (full sideways gravity) on top of the crates.
  for (const ph of [0, 1]) {
    const p = copy(bg);
    p.rect(0, 15, 20, 5, c('ink', 1)).rect(0, 15, 20, 1, c('metal', 3));
    for (let x = ph * 3; x < 20; x += 6) p.rect(x, 17, 2, 2, c('yellow', 3));
    t.air(`belt${ph}`, p, { grav: GRAV.right, next: `belt${1 - ph}`, ntime: 2 });
  }

  // Station 5: the ball pit and its boards, red and blue, half a beat apart. A board flickers
  // (the warning) before it goes, and shows a faint outline while it is gone.
  const pit = new Pixels(20, 20, c('lilac', 0));
  const cols = ['red', 'yellow', 'blue', 'green', 'pink'];
  t.air('pit', pit);
  const balls = copy(pit);
  for (let i = 0; i < 7; i++) balls.disc(2 + ((i * 7) % 18), 15 - (i % 2) * 4, 3, c(cols[i % 5], 2));
  t.air('balls', balls);
  t.wall(
    'pitFloor',
    (() => {
      const p = new Pixels(20, 20, c('lilac', 0));
      for (let i = 0; i < 10; i++) p.disc(1 + ((i * 9) % 19), 3 + (i % 3) * 5, 3, c(cols[i % 5], 1));
      return p;
    })(),
  );
  t.ledge(
    'pad',
    (() => {
      const p = copy(pit);
      p.rect(1, 0, 18, 8, c('green', 2)).rect(1, 0, 18, 2, c('green', 3));
      return p;
    })(),
  );
  for (const [k, col] of [
    ['A', 'red'],
    ['B', 'blue'],
  ] as const) {
    const board = (lit: boolean) => {
      const p = copy(pit);
      p.rect(0, 0, 20, 6, c(col, lit ? 3 : 2))
        .rect(0, 0, 20, 1, c('paint', 3))
        .rect(0, 6, 20, 1, c('ink', 0));
      return p;
    };
    const ghost = copy(pit);
    ghost.frame(0, 0, 20, 6, c(col, 1));
    t.wall(`board${k}`, board(false), { next: `board${k}Warn`, ntime: BOARD.on });
    t.wall(`board${k}Warn`, board(true), { next: `board${k}Gone`, ntime: BOARD.warn });
    t.air(`board${k}Gone`, ghost, { next: `board${k}`, ntime: BOARD.gone });
  }

  // Station 6: Professor Pratfall, practicing pies (his hand gives birth to them).
  const [prof0, prof1] = leoOn(KLUB.pratfall.flipX(), bg, bg);
  t.air('profTop', prof0);
  t.air('profBot', prof1);
  // Station 7 and 8 are the Klub's own asks (monsters): SIT?, and the turnstile.
  // Station 9: the tent flap into the dark ring, and the ring's edge.
  art(
    t,
    'flap',
    1,
    3,
    () => bg,
    (p) => {
      p.rect(0, 0, 20, 60, c('red', 1));
      for (let y = 5; y < 60; y += 10) p.rect(0, y, 20, 2, c('gold', 1));
      p.rect(0, 0, 2, 60, c('ink', 0));
    },
  );
  // Signs.
  const signs: [string, string][] = [
    ['Title', 'THE TEDDY\nCOURSE!'],
    ['Five', 'HIGH FIVE\nTHE BUTTON'],
    ['Dig', 'DIG UNDER\n(DOWN)'],
    ['Saw', 'STEP ON\nWHEN LEVEL'],
    ['Belt', 'FAST BELT\nE AT END'],
    ['Boards', 'RED, THEN\nBLUE'],
    ['Pies', 'PIES!\n4: DUCK'],
    ['Sniff', 'LAST ONE:\nSNIFF (S)'],
  ];
  for (const [name, words] of signs) {
    const [a, b] = wideSign(bg, words);
    t.air(`sign${name}L`, a);
    t.air(`sign${name}R`, b);
  }
  return t;
}
