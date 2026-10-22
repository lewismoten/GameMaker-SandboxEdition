// The BLASTER nano-fighter: its pictures (ship.cbl) and its two flight programs.
//
// ship.chr flies the scrolling stages. Game-Maker only scrolls when the character nears
// the edge of the screen, so every frame of every sequence carries the ship DRIFT pixels
// forward: the ship is always flying up the map and the screen follows it, which is the
// whole auto-scroller. Down only brakes (the drift drops to 1 pixel a tick), so the screen
// never stops. Every move also fires: a twin shot leaves the guns every third tick.
//
// shipfree.chr is the same ship without the drift, for the boss arenas.
import { CHARBL, MONBL } from '../../../../web/src/formats/blocks';
import { INF_REPEAT, MAXFRAME, newCharacter, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import { Pixels } from '../../../kit/pixels';
import { BlockSet, CLEAR, blob } from '../art/draw';
import { DRIFT, KEY, SEQ, SND, START } from '../ids';
import type { Pal } from '../art/pal';

/** Monster numbers the ship fires (the same in every stage's .mon: see common.ts). */
export const SHOT_MON = { shot: 0, novaL2: 1, novaL1: 2, novaC: 3, novaR1: 4, novaR2: 5 } as const;

const HALF = [
  '.........o',
  '........oC',
  '........oc',
  '.......osc',
  '.......osc',
  '.......osh',
  '......osSh',
  '......osSS',
  '.o....osSd',
  'oro..osSdc',
  'oSo..osSdc',
  'oSo.osSSSd',
  'oSoosSSSSS',
  'oSssSSSSSS',
  'oSSSSSSSSS',
  'odSSddSSSS',
  '.oddoodSSd',
  '..oo..odfF',
  '.......ofF',
  '.........f',
];

function shipPic(p: Pal, flame: 0 | 1, flash = false): Pixels {
  const key: Record<string, number> = flash
    ? {
        o: p.c('cyan', 3),
        s: p.c('steel', 6),
        S: p.c('steel', 6),
        d: p.c('cyan', 5),
        h: p.c('cyan', 5),
        c: p.c('steel', 6),
        C: p.c('steel', 6),
        r: p.c('cyan', 5),
      }
    : {
        o: p.c('ink', 0),
        s: p.c('steel', 2),
        S: p.c('steel', 4),
        d: p.c('steel', 1),
        h: p.c('steel', 6),
        c: p.c('cyan', 2),
        C: p.c('cyan', 4),
        r: p.c('red', 2),
      };
  key.f = flame ? p.c('fire', 4) : p.c('fire', 6);
  key.F = flame ? p.c('fire', 6) : p.c('fire', 7);
  const rows = HALF.map((h) => h + [...h].reverse().join(''));
  const pic = new Pixels(20, 20, CLEAR).draw(0, 0, rows, key);
  if (flame) {
    // the short flame: trim the last row and dim the one above
    for (let x = 0; x < 20; x++) if (pic.get(x, 19) !== CLEAR) pic.set(x, 19, CLEAR);
    for (let x = 0; x < 20; x++) if (pic.get(x, 18) === key.F) pic.set(x, 18, p.c('fire', 3));
  }
  return pic;
}

/** The big blast when the ship is lost. */
function deathPic(p: Pal, k: number): Pixels {
  const pic = new Pixels(20, 20, CLEAR);
  const r = 4 + k * 2;
  blob(pic, 10, 10, r, r, p.r('fire'), Math.max(0, 3 - k), 7 - Math.max(0, k - 2));
  if (k >= 2) for (let i = 0; i < 12; i++) pic.set(10 + Math.cos(i) * (r + 1), 10 + Math.sin(i * 1.7) * (r + 1), p.c('fire', 5));
  if (k >= 3) blob(pic, 10, 10, k * 1.5, k * 1.5, p.r('grey'), 1, 3);
  return pic;
}

export function shipBlocks(p: Pal): BlockSet {
  const cb = new BlockSet(CHARBL, 'cbl');
  cb.add('ship0', shipPic(p, 0));
  cb.add('ship1', shipPic(p, 1));
  cb.add('flash', shipPic(p, 0, true));
  for (let k = 0; k < 5; k++) cb.add(`die${k}`, deathPic(p, k));
  return cb;
}

const NONE = CHARBL;

function frame(pic: number, x: number, y: number, pause = 1): Frame {
  return { x, y, orient: 0, pic1: NONE, pic2: pic, pause, extra: new Uint8Array(5) };
}

/** A frame that gives birth to monster `mon` one row above the ship. */
function birth(mon: number): Frame {
  return { x: 0, y: 0, orient: 0, pic1: mon, pic2: MONBL, pause: 0, extra: new Uint8Array(5) };
}

function setSeq(s: Sequence, frames: Frame[], opts: Partial<Sequence> = {}): void {
  if (frames.length > MAXFRAME) throw new Error('Too many frames');
  for (let i = 0; i < MAXFRAME; i++) s.frames[i] = frames[i] ?? { ...frame(NONE, 0, 0), pic2: CHARBL + 1 };
  Object.assign(s, { sound: SND.none, bloc: 150, ground: 0, norepeat: 0, momentum: 0, jstkBut: 0, jstkMov: 0 }, opts);
}

/**
 * The flight program. `drift` pixels forward on every frame (0 in the arenas).
 * Moves: [dx, dy] per tick on top of the drift.
 */
export function buildShip(cb: BlockSet, drift: number): Character {
  const c = newCharacter();
  const S = c.sequences;
  const s0 = cb.id('ship0');
  const s1 = cb.id('ship1');
  const fl = cb.id('flash');
  const dy = -drift;
  /** Three ticks of flight with a twin shot: the guns fire every third tick. */
  const fly = (x: number, y: number) => [frame(s0, x, y + dy), frame(s1, x, y + dy), birth(SHOT_MON.shot), frame(s0, x, y + dy)];

  setSeq(S[SEQ.idle], fly(0, 0));
  setSeq(S[SEQ.die], [0, 1, 2, 3, 4].map((k) => frame(cb.id(`die${k}`), 0, dy, 2)).concat([frame(cb.id('die4'), 0, dy, 6)]), { sound: SND.die });
  setSeq(S[SEQ.hurt], [frame(fl, 0, dy), frame(s0, 0, dy), frame(fl, 0, dy), birth(SHOT_MON.shot), frame(s1, 0, dy), frame(fl, 0, dy), frame(s0, 0, dy)], {
    sound: SND.hurt,
  });
  // Enter picks up what the ship is over (the stages have nothing to pick up); drop has no key
  setSeq(S[SEQ.pickup], [frame(s0, 0, dy)], { key: KEY.enter });
  setSeq(S[SEQ.drop], [frame(s0, 0, dy)]);

  const H = 6; // sideways speed
  const D = 5; // diagonal speed
  const UP = 6; // extra forward speed
  // braking: never slower than 1 pixel a tick forward while scrolling (the screen would stop)
  const BRAKE = drift ? drift - 1 : 6;
  const moves: [number, number, number, number, number][] = [
    // seq, key, joystick direction, dx, dy
    [SEQ.up, KEY.up, 1, 0, -UP],
    [SEQ.down, KEY.down, 5, 0, BRAKE],
    [SEQ.left, KEY.left, 7, -H, 0],
    [SEQ.right, KEY.right, 3, H, 0],
    [SEQ.upLeft, KEY.kp7, 8, -D, -D],
    [SEQ.upRight, KEY.kp9, 2, D, -D],
    [SEQ.downLeft, KEY.kp1, 6, -D, drift ? BRAKE : D],
    [SEQ.downRight, KEY.kp3, 4, D, drift ? BRAKE : D],
    [SEQ.w, KEY.w, 0, 0, -UP],
    [SEQ.s, KEY.s, 0, 0, BRAKE],
    [SEQ.a, KEY.a, 0, -H, 0],
    [SEQ.d, KEY.d, 0, H, 0],
    [SEQ.q, KEY.q, 0, -D, -D],
    [SEQ.e, KEY.e, 0, D, -D],
  ];
  for (const [seq, key, joy, x, y] of moves) setSeq(S[seq], fly(x, y), { key, jstkMov: joy });

  // Space: the Nova Bomb, five plasma bolts in a fan, one charge each
  setSeq(
    S[SEQ.nova],
    [
      frame(fl, 0, dy),
      birth(SHOT_MON.novaL2),
      birth(SHOT_MON.novaL1),
      birth(SHOT_MON.novaC),
      birth(SHOT_MON.novaR1),
      birth(SHOT_MON.novaR2),
      frame(s1, 0, dy),
      frame(fl, 0, dy),
      frame(s0, 0, dy),
    ],
    { key: KEY.space, sound: SND.nova, norepeat: 1, jstkMov: 9, jstkBut: 1 },
  );

  c.meter[0] = START.hp;
  c.meter[1] = START.lives;
  for (let i = 5; i < 20; i++) c.meter[i] = INF_REPEAT;
  c.meter[SEQ.nova] = START.novas;
  c.x = [0, 0, 0];
  c.y = [0, 0, 0];
  return c;
}

export { DRIFT };
