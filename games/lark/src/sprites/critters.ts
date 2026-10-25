// lark.mbl and each scene's .MON: the little lives about the place, all harmless (power 100, no
// effect when touched): pigeons pecking round the square, and the clock's pendulum swinging in
// the tower. Nothing on the Long Road fights; nothing needs to.
import { Pixels } from '../../../kit/pixels';
import { CLEAR } from '../art/draw';
import { c } from '../art/pal';
import { BlockSet, Bestiary } from '../blocks/sets';

function pigeon(frame: number): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  const O = c('ink', 0);
  const peck = frame === 1;
  p.disc(9, 13, 4, c('stone', 3)).disc(9, 12, 3, c('stone', 4));
  p.rect(6, 12, 4, 2, c('stone', 2));
  const hx = peck ? 13 : 12;
  const hy = peck ? 13 : 9;
  p.disc(hx, hy, 2, c('stone', 3)).set(hx + 1, hy - 1, O);
  p.set(hx + 2, hy, c('brass', 3));
  p.set(hx - 1, hy + 2, c('green', 3)).set(hx, hy + 2, c('purple', 3));
  p.rect(8, 17, 1, 2, c('red', 3)).rect(11, 17, 1, 2, c('red', 3));
  void O;
  return p;
}

function bob(): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  p.rect(9, 0, 2, 10, c('brass', 1));
  p.disc(10, 13, 6, c('brass', 2)).disc(10, 13, 4.5, c('brass', 3)).disc(8, 11, 1.5, c('brass', 4));
  return p;
}

function rod(): Pixels {
  const p = new Pixels(20, 20, CLEAR);
  p.rect(9, 0, 2, 20, c('brass', 1)).rect(9, 0, 1, 20, c('brass', 2));
  return p;
}

export function critterBlocks(): BlockSet {
  const s = new BlockSet(100, true);
  s.add('pigeon0', pigeon(0));
  s.add('pigeon1', pigeon(1));
  s.add('bob', bob());
  s.add('rod', rod());
  return s;
}

/** The square's pigeons: they wander, peck, and pay Joe no mind. */
export function squareCritters(mb: BlockSet): Bestiary {
  const b = new Bestiary(mb);
  b.add('pigeon', {
    pics: [
      ['pigeon0', 14],
      ['pigeon1', 4],
      ['pigeon0', 9],
      ['pigeon1', 3],
    ],
    power: 100,
    towards: 64,
    end: -2,
    thru: true,
  });
  return b;
}

/** The tower's pendulum: rod and bob, swinging slow across the middle of the shaft. */
export function towerCritters(mb: BlockSet): Bestiary {
  const b = new Bestiary(mb);
  const swing: [number, number, number, number?][] = [
    [0, 0, 1],
    [3, 0, 1],
    [0, 0, 1],
    [-3, 0, 1],
    [0, 0, 1],
  ];
  b.add('bob', { pics: [['bob', 50]], power: 100, end: -2, path: swing });
  b.add('rod', { pics: [['rod', 50]], power: 100, end: -2, path: swing });
  return b;
}
