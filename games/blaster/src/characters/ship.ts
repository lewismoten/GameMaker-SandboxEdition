// The BLASTER nano-fighter: its pictures (ship.cbl) and its two flight programs.
//
// ship.chr flies the scrolling stages. Game-Maker only scrolls when the character nears
// the edge of the screen, so every frame of every sequence carries the ship DRIFT pixels
// forward: the ship is always flying up the map and the screen follows it, which is the
// whole auto-scroller. Down only brakes (the drift drops to 1 pixel a tick), so the screen
// never stops. Every move also fires: a twin shot leaves the guns every third tick.
//
// shipfree.chr is the same ship without the drift, for the boss arenas.
//
// shipdown.chr and shipleft.chr fly the turned legs (stages/turned.ts): nose down, the screen
// following it down, and nose left, the screen following it left.
//
// shipbus.chr rides the data bus between stages, seen from behind (src/bus).
import { CHARBL, MONBL } from '../../../../web/src/formats/blocks';
import { INF_REPEAT, MAXFRAME, newCharacter, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import { Pixels } from '../../../kit/pixels';
import { BlockSet, CLEAR, blob, flipX, outline, rotate, turn180, turn45, turn90 } from '../art/draw';
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
  if (k >= 3) blob(pic, 10, 10, k * 1.5, k * 1.5, p.r('gray'), 1, 3);
  return pic;
}

/**
 * The ship banked into a turn (dir -1: left, 1: right): the low wing foreshortened and in
 * shadow, the high wing catching the light, and the whole ship tilted a little into the turn.
 */
function banked(p: Pal, src: Pixels, dir: -1 | 1): Pixels {
  const steel = p.r('steel');
  const shade = (c: number, by: number) => {
    const k = steel.indexOf(c);
    return k < 0 ? c : steel[Math.max(0, Math.min(steel.length - 1, k + by))];
  };
  const squeezed = new Pixels(20, 20, CLEAR);
  const c = 9.5;
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const low = Math.sign(x - c) === dir;
      const sx = Math.round(c + (x - c) / (low ? 0.62 : 1));
      if (sx < 0 || sx > 19) continue;
      const v = src.get(sx, y);
      if (v !== CLEAR) squeezed.set(x, y, shade(v, low ? -1 : 1));
    }
  return rotate(squeezed, dir * 12);
}

/**
 * The BLASTER from behind, for the data bus rides: the canopy over the hull, the wings out to
 * their red-tipped fins, and the twin engines glowing at you (dimmer on the flicker frame).
 */
function rearPic(p: Pal, flame: 0 | 1, flash = false): Pixels {
  const pic = new Pixels(20, 20, CLEAR);
  const hull = flash ? p.r('cyan') : p.r('steel');
  // the wings, drooping a little toward the tips, and the fins standing at their ends
  for (let x = 1; x < 19; x++) {
    const droop = Math.abs(x - 9.5) > 6 ? 1 : 0;
    pic
      .set(x, 10 + droop, hull[6])
      .set(x, 11 + droop, hull[4])
      .set(x, 12 + droop, hull[1]);
  }
  for (const x of [1, 18]) {
    pic.rect(x, 6, 1, 7, hull[2]);
    pic.rect(x, 5, 1, 2, flash ? p.c('cyan', 5) : p.c('red', 2));
  }
  // the hull and the canopy over it
  blob(pic, 9.5, 10.5, 4.5, 5, hull, 1, 6);
  blob(pic, 9.5, 6.5, 3, 2.6, flash ? p.r('steel') : p.r('cyan'), 1, 5);
  // the engines, seen from behind: a dark ring round a hot core
  for (const cx of [7.5, 11.5]) {
    blob(pic, cx, 15, 2, 2, p.r('steel'), 0, 1);
    pic.rect(Math.floor(cx), 15, 1, 1, p.c('fire', flame ? 5 : 7)).rect(Math.floor(cx) - 1, 15, 1, 1, p.c('fire', flame ? 3 : 5));
    pic.set(Math.floor(cx), 14, p.c('fire', flame ? 3 : 6)).set(Math.floor(cx), 16, p.c('fire', flame ? 4 : 6));
    if (!flame) pic.set(Math.floor(cx), 17, p.c('fire', 4)).set(Math.floor(cx) - 1, 16, p.c('fire', 3));
  }
  return outline(pic, p.c('ink', 0));
}

export function shipBlocks(p: Pal): BlockSet {
  const cb = new BlockSet(CHARBL, 'cbl');
  cb.add('ship0', shipPic(p, 0));
  cb.add('ship1', shipPic(p, 1));
  cb.add('flash', shipPic(p, 0, true));
  for (let k = 0; k < 5; k++) cb.add(`die${k}`, deathPic(p, k));
  // nose up and to the right, for the ribbon cable's slanted course (shipdiag.chr)
  cb.add('shipD0', turn45(shipPic(p, 0), 0.97));
  cb.add('shipD1', turn45(shipPic(p, 1), 0.97));
  cb.add('flashD', turn45(shipPic(p, 0, true), 0.97));
  // nose to the right, for the side-scrolling legs (shipside.chr)
  cb.add('shipS0', turn90(shipPic(p, 0)));
  cb.add('shipS1', turn90(shipPic(p, 1)));
  cb.add('flashS', turn90(shipPic(p, 0, true)));
  // banked into a turn: straight up (and the arenas), on the slant, and side-on (pitched up
  // to climb, down to dive), and side-on braking: the engine cut, retro jets at the nose
  for (const [d, n] of [
    [-1, 'L'],
    [1, 'R'],
  ] as [-1 | 1, string][])
    for (const f of [0, 1] as const) {
      cb.add(`bank${n}${f}`, banked(p, shipPic(p, f), d));
      cb.add(`bankD${n}${f}`, turn45(banked(p, shipPic(p, f), d), 0.97));
      cb.add(`pitch${n}${f}`, rotate(turn90(shipPic(p, f)), d * 20));
    }
  for (const f of [0, 1]) {
    const t = turn90(shipPic(p, 0));
    for (let x = 0; x < 6; x++) for (let y = 0; y < 20; y++) if (t.get(x, y) !== CLEAR && x < 2) t.set(x, y, CLEAR);
    for (const y of [6, 13]) t.set(18, y, p.c('cyan', 4 + f)).set(19, y, p.c('cyan', 3));
    cb.add(`brakeS${f}`, t);
  }
  // from behind, on the data bus: steady, banked into a lane change, and flashing when hit
  cb.add('rear0', rearPic(p, 0));
  cb.add('rear1', rearPic(p, 1));
  cb.add('rearL', rotate(rearPic(p, 0), -14));
  cb.add('rearR', rotate(rearPic(p, 1), 14));
  cb.add('rearHit', rearPic(p, 0, true));
  // nose down, for the strips flown downward (shipdown.chr): banked to the screen's left is
  // the ship's own right turn, half a turn round
  cb.add('shipV0', turn180(shipPic(p, 0)));
  cb.add('shipV1', turn180(shipPic(p, 1)));
  cb.add('flashV', turn180(shipPic(p, 0, true)));
  for (const f of [0, 1] as const) {
    cb.add(`bankVL${f}`, turn180(banked(p, shipPic(p, f), 1)));
    cb.add(`bankVR${f}`, turn180(banked(p, shipPic(p, f), -1)));
  }
  // nose left, for the bands flown leftward (shipleft.chr): the side-on ship in a mirror
  cb.add('shipW0', flipX(cb.pic('shipS0')));
  cb.add('shipW1', flipX(cb.pic('shipS1')));
  cb.add('flashW', flipX(cb.pic('flashS')));
  for (const f of [0, 1] as const) {
    cb.add(`pitchWL${f}`, flipX(cb.pic(`pitchL${f}`)));
    cb.add(`pitchWR${f}`, flipX(cb.pic(`pitchR${f}`)));
    cb.add(`brakeW${f}`, flipX(cb.pic(`brakeS${f}`)));
  }
  return cb;
}

const NONE = CHARBL;

function frame(pic: number, x: number, y: number, pause = 1): Frame {
  return { x, y, orient: 0, pic1: NONE, pic2: pic, pause, extra: new Uint8Array(5) };
}

/** A frame that gives birth to monster `mon` one row above the ship. */
function birth(mon: number, y = 0): Frame {
  return { x: 0, y, orient: 0, pic1: mon, pic2: MONBL, pause: 0, extra: new Uint8Array(5) };
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
  /** Three ticks of flight with a twin shot: the guns fire every third tick; banked into a turn. */
  const fly = (x: number, y: number) => {
    const [a, b] = x < 0 ? [cb.id('bankL0'), cb.id('bankL1')] : x > 0 ? [cb.id('bankR0'), cb.id('bankR1')] : [s0, s1];
    return [frame(a, x, y + dy), frame(b, x, y + dy), birth(SHOT_MON.shot), frame(a, x, y + dy)];
  };

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

/**
 * shipdiag.chr, for the ribbon cable: the course runs corner to corner, so the drift is
 * `drift` right and `drift` up every frame, and the keys turn with the view. Up speeds
 * ahead along the track, Down nearly stops, Left climbs toward the wire above (mostly up)
 * and Right toward the wire below (mostly right). Every move still fires, now up and to
 * the right. Nothing ever moves left or down, so the screen only scrolls up and right.
 */
export function buildDiagShip(cb: BlockSet, drift: number): Character {
  const c = buildShip(cb, drift);
  const S = c.sequences;
  const s0 = cb.id('shipD0');
  const s1 = cb.id('shipD1');
  const fl = cb.id('flashD');
  const d = drift;
  // banked toward the lane's top edge (Left) or its bottom edge (Right)
  const fly = (x: number, y: number) => {
    const [a, b] = x - -y < -2 ? [cb.id('bankDL0'), cb.id('bankDL1')] : x + y > 2 ? [cb.id('bankDR0'), cb.id('bankDR1')] : [s0, s1];
    return [frame(a, x, y), frame(b, x, y), birth(SHOT_MON.shot), frame(a, x, y)];
  };
  const keep = (seq: number, frames: Frame[]) =>
    setSeq(S[seq], frames, { key: S[seq].key, jstkMov: S[seq].jstkMov, jstkBut: S[seq].jstkBut, sound: S[seq].sound, norepeat: S[seq].norepeat });
  const BOOST = 4;
  // Left and Right step across the wires: 7 of their 9 pixels go sideways
  const ahead: [number, number] = [d, -d];
  const boost: [number, number] = [d + BOOST, -d - BOOST];
  const brake: [number, number] = [1, -1];
  const left: [number, number] = [2, -9];
  const right: [number, number] = [9, -2];
  keep(SEQ.idle, fly(...ahead));
  keep(SEQ.die, [0, 1, 2, 3, 4].map((k) => frame(cb.id(`die${k}`), 1, -1, 2)).concat([frame(cb.id('die4'), 1, -1, 6)]));
  keep(SEQ.hurt, [
    frame(fl, ...ahead),
    frame(s0, ...ahead),
    frame(fl, ...ahead),
    birth(SHOT_MON.shot),
    frame(s1, ...ahead),
    frame(fl, ...ahead),
    frame(s0, ...ahead),
  ]);
  keep(SEQ.pickup, [frame(s0, ...ahead)]);
  keep(SEQ.drop, [frame(s0, ...ahead)]);
  const moves: [number, [number, number]][] = [
    [SEQ.up, boost],
    [SEQ.down, brake],
    [SEQ.left, left],
    [SEQ.right, right],
    [SEQ.upLeft, left],
    [SEQ.upRight, boost],
    [SEQ.downLeft, brake],
    [SEQ.downRight, brake],
    [SEQ.w, boost],
    [SEQ.s, brake],
    [SEQ.a, left],
    [SEQ.d, right],
    [SEQ.q, left],
    [SEQ.e, boost],
  ];
  for (const [seq, [x, y]] of moves) keep(seq, fly(x, y));
  keep(SEQ.nova, [
    frame(fl, ...ahead),
    birth(SHOT_MON.novaL2),
    birth(SHOT_MON.novaL1),
    birth(SHOT_MON.novaC),
    birth(SHOT_MON.novaR1),
    birth(SHOT_MON.novaR2),
    frame(s1, ...ahead),
    frame(fl, ...ahead),
    frame(s0, ...ahead),
  ]);
  return c;
}

/**
 * shipside.chr, for the side-scrolling legs: the course runs left to right, so the drift is
 * `drift` right every frame and the keys steer as they look. Right speeds ahead, Left brakes
 * (never to a stop: the screen would stop with it), Up and Down climb and dive. The guns fire
 * to the right, from the ship's own row (a birth frame 20 pixels down is born in the ship's
 * row, not the one above). Nothing moves left, so the screen only scrolls right.
 */
export function buildSideShip(cb: BlockSet, drift: number): Character {
  const c = buildShip(cb, drift);
  const S = c.sequences;
  const s0 = cb.id('shipS0');
  const s1 = cb.id('shipS1');
  const fl = cb.id('flashS');
  const d = drift;
  const shot = (mon: number) => birth(mon, 20);
  // pitched up to climb, down to dive; braking, the engine cut and the retro jets lit
  const fly = (x: number, y: number) => {
    const [a, b] =
      y < 0 ? [cb.id('pitchL0'), cb.id('pitchL1')] : y > 0 ? [cb.id('pitchR0'), cb.id('pitchR1')] : x < d ? [cb.id('brakeS0'), cb.id('brakeS1')] : [s0, s1];
    return [frame(a, x, y), frame(b, x, y), shot(SHOT_MON.shot), frame(a, x, y)];
  };
  const keep = (seq: number, frames: Frame[]) =>
    setSeq(S[seq], frames, { key: S[seq].key, jstkMov: S[seq].jstkMov, jstkBut: S[seq].jstkBut, sound: S[seq].sound, norepeat: S[seq].norepeat });
  const V = 6; // up and down
  const D = 5; // diagonals
  const BOOST = 6;
  const ahead: [number, number] = [d, 0];
  const brake = d - 1;
  keep(SEQ.idle, fly(...ahead));
  keep(SEQ.die, [0, 1, 2, 3, 4].map((k) => frame(cb.id(`die${k}`), brake, 0, 2)).concat([frame(cb.id('die4'), brake, 0, 6)]));
  keep(SEQ.hurt, [
    frame(fl, ...ahead),
    frame(s0, ...ahead),
    frame(fl, ...ahead),
    shot(SHOT_MON.shot),
    frame(s1, ...ahead),
    frame(fl, ...ahead),
    frame(s0, ...ahead),
  ]);
  keep(SEQ.pickup, [frame(s0, ...ahead)]);
  keep(SEQ.drop, [frame(s0, ...ahead)]);
  const moves: [number, [number, number]][] = [
    [SEQ.up, [d, -V]],
    [SEQ.down, [d, V]],
    [SEQ.left, [brake, 0]],
    [SEQ.right, [d + BOOST, 0]],
    [SEQ.upLeft, [brake, -D]],
    [SEQ.upRight, [d + D, -D]],
    [SEQ.downLeft, [brake, D]],
    [SEQ.downRight, [d + D, D]],
    [SEQ.w, [d, -V]],
    [SEQ.s, [d, V]],
    [SEQ.a, [brake, 0]],
    [SEQ.d, [d + BOOST, 0]],
    [SEQ.q, [brake, -D]],
    [SEQ.e, [d + D, -D]],
  ];
  for (const [seq, [x, y]] of moves) keep(seq, fly(x, y));
  keep(SEQ.nova, [
    frame(fl, ...ahead),
    shot(SHOT_MON.novaL2),
    shot(SHOT_MON.novaL1),
    shot(SHOT_MON.novaC),
    shot(SHOT_MON.novaR1),
    shot(SHOT_MON.novaR2),
    frame(s1, ...ahead),
    frame(fl, ...ahead),
    frame(s0, ...ahead),
  ]);
  return c;
}

/** Keeps a sequence's key, stick, sound and repeat while giving it new frames. */
function keeper(S: Sequence[]) {
  return (seq: number, frames: Frame[]) =>
    setSeq(S[seq], frames, { key: S[seq].key, jstkMov: S[seq].jstkMov, jstkBut: S[seq].jstkBut, sound: S[seq].sound, norepeat: S[seq].norepeat });
}

/**
 * shipdown.chr, for the strips flown downward: the course runs top to bottom, so the drift is
 * `drift` down every frame and the keys steer as they look. Down speeds ahead, Up brakes (never
 * to a stop: the screen would stop with it), Left and Right steer, and Q and E (like 7 and 9)
 * brake to the left and right. The guns fire down, from the row under the ship (a birth frame
 * 40 pixels down). Nothing moves up, so the screen only scrolls down.
 */
export function buildDownShip(cb: BlockSet, drift: number): Character {
  const c = buildShip(cb, drift);
  const S = c.sequences;
  const s0 = cb.id('shipV0');
  const s1 = cb.id('shipV1');
  const fl = cb.id('flashV');
  const d = drift;
  const shot = (mon: number) => birth(mon, 40);
  const fly = (x: number, y: number) => {
    const [a, b] = x < 0 ? [cb.id('bankVL0'), cb.id('bankVL1')] : x > 0 ? [cb.id('bankVR0'), cb.id('bankVR1')] : [s0, s1];
    return [frame(a, x, y), frame(b, x, y), shot(SHOT_MON.shot), frame(a, x, y)];
  };
  const keep = keeper(S);
  const H = 6; // sideways
  const D = 5; // diagonals
  const FAST = 6;
  const ahead: [number, number] = [0, d];
  const brake = d - 1;
  keep(SEQ.idle, fly(...ahead));
  keep(SEQ.die, [0, 1, 2, 3, 4].map((k) => frame(cb.id(`die${k}`), 0, d, 2)).concat([frame(cb.id('die4'), 0, d, 6)]));
  keep(SEQ.hurt, [
    frame(fl, ...ahead),
    frame(s0, ...ahead),
    frame(fl, ...ahead),
    shot(SHOT_MON.shot),
    frame(s1, ...ahead),
    frame(fl, ...ahead),
    frame(s0, ...ahead),
  ]);
  keep(SEQ.pickup, [frame(s0, ...ahead)]);
  keep(SEQ.drop, [frame(s0, ...ahead)]);
  const moves: [number, [number, number]][] = [
    [SEQ.up, [0, brake]],
    [SEQ.down, [0, d + FAST]],
    [SEQ.left, [-H, d]],
    [SEQ.right, [H, d]],
    [SEQ.upLeft, [-D, brake]],
    [SEQ.upRight, [D, brake]],
    [SEQ.downLeft, [-D, d + D]],
    [SEQ.downRight, [D, d + D]],
    [SEQ.w, [0, brake]],
    [SEQ.s, [0, d + FAST]],
    [SEQ.a, [-H, d]],
    [SEQ.d, [H, d]],
    [SEQ.q, [-D, brake]],
    [SEQ.e, [D, brake]],
  ];
  for (const [seq, [x, y]] of moves) keep(seq, fly(x, y));
  keep(SEQ.nova, [
    frame(fl, ...ahead),
    shot(SHOT_MON.novaL2),
    shot(SHOT_MON.novaL1),
    shot(SHOT_MON.novaC),
    shot(SHOT_MON.novaR1),
    shot(SHOT_MON.novaR2),
    frame(s1, ...ahead),
    frame(fl, ...ahead),
    frame(s0, ...ahead),
  ]);
  return c;
}

/**
 * shipleft.chr, for the bands flown leftward: shipside.chr in a mirror. The drift is `drift`
 * left every frame; Left speeds ahead, Right brakes (never to a stop), Up and Down climb and
 * dive. The guns fire to the left, from the ship's own row. Nothing moves right, so the
 * screen only scrolls left.
 */
export function buildLeftShip(cb: BlockSet, drift: number): Character {
  const c = buildShip(cb, drift);
  const S = c.sequences;
  const s0 = cb.id('shipW0');
  const s1 = cb.id('shipW1');
  const fl = cb.id('flashW');
  const d = drift;
  const shot = (mon: number) => birth(mon, 20);
  const fly = (x: number, y: number) => {
    const [a, b] =
      y < 0
        ? [cb.id('pitchWL0'), cb.id('pitchWL1')]
        : y > 0
          ? [cb.id('pitchWR0'), cb.id('pitchWR1')]
          : x > -d
            ? [cb.id('brakeW0'), cb.id('brakeW1')]
            : [s0, s1];
    return [frame(a, x, y), frame(b, x, y), shot(SHOT_MON.shot), frame(a, x, y)];
  };
  const keep = keeper(S);
  const V = 6; // up and down
  const D = 5; // diagonals
  const BOOST = 6;
  const ahead: [number, number] = [-d, 0];
  const brake = -(d - 1);
  keep(SEQ.idle, fly(...ahead));
  keep(SEQ.die, [0, 1, 2, 3, 4].map((k) => frame(cb.id(`die${k}`), brake, 0, 2)).concat([frame(cb.id('die4'), brake, 0, 6)]));
  keep(SEQ.hurt, [
    frame(fl, ...ahead),
    frame(s0, ...ahead),
    frame(fl, ...ahead),
    shot(SHOT_MON.shot),
    frame(s1, ...ahead),
    frame(fl, ...ahead),
    frame(s0, ...ahead),
  ]);
  keep(SEQ.pickup, [frame(s0, ...ahead)]);
  keep(SEQ.drop, [frame(s0, ...ahead)]);
  const moves: [number, [number, number]][] = [
    [SEQ.up, [-d, -V]],
    [SEQ.down, [-d, V]],
    [SEQ.left, [-d - BOOST, 0]],
    [SEQ.right, [brake, 0]],
    [SEQ.upLeft, [-d - D, -D]],
    [SEQ.upRight, [brake, -D]],
    [SEQ.downLeft, [-d - D, D]],
    [SEQ.downRight, [brake, D]],
    [SEQ.w, [-d, -V]],
    [SEQ.s, [-d, V]],
    [SEQ.a, [-d - BOOST, 0]],
    [SEQ.d, [brake, 0]],
    [SEQ.q, [-d - D, -D]],
    [SEQ.e, [brake, -D]],
  ];
  for (const [seq, [x, y]] of moves) keep(seq, fly(x, y));
  keep(SEQ.nova, [
    frame(fl, ...ahead),
    shot(SHOT_MON.novaL2),
    shot(SHOT_MON.novaL1),
    shot(SHOT_MON.novaC),
    shot(SHOT_MON.novaR1),
    shot(SHOT_MON.novaR2),
    frame(s1, ...ahead),
    frame(fl, ...ahead),
    frame(s0, ...ahead),
  ]);
  return c;
}

/**
 * shipbus.chr, for the data bus rides, seen from behind. It only steers: Left and Right (or A
 * and D, or the stick) move it a whole lane, 40 pixels in four frames of 10 (under PLAYGAME's
 * 11-pixel cap). Every frame, steering or not, also pushes it 5 pixels up the screen: forward.
 * The row above it is a wall of look-alikes, so the push holds it on its row until the way into
 * the chip opens over the middle lane. No guns on the bus, and no Nova Bombs.
 */
export function buildBusShip(cb: BlockSet): Character {
  const c = buildShip(cb, 0);
  const S = c.sequences;
  const PUSH = -5;
  for (const s of S) setSeq(s, [], { key: 0 });
  setSeq(S[SEQ.idle], [frame(cb.id('rear0'), 0, PUSH), frame(cb.id('rear1'), 0, PUSH)]);
  setSeq(S[SEQ.die], [0, 1, 2, 3, 4].map((k) => frame(cb.id(`die${k}`), 0, 0, 3)).concat([frame(cb.id('die4'), 0, 0, 12)]), { sound: SND.die });
  const hit = cb.id('rearHit');
  setSeq(S[SEQ.hurt], [frame(hit, 0, PUSH), frame(cb.id('rear0'), 0, PUSH), frame(hit, 0, PUSH)], { sound: SND.hurt });
  const steer: [number, number, number, number][] = [
    [SEQ.left, KEY.left, 7, -1],
    [SEQ.right, KEY.right, 3, 1],
    [SEQ.a, KEY.a, 0, -1],
    [SEQ.d, KEY.d, 0, 1],
  ];
  for (const [seq, key, joy, dx] of steer)
    setSeq(
      S[seq],
      [0, 1, 2, 3].map(() => frame(cb.id(dx < 0 ? 'rearL' : 'rearR'), dx * 10, PUSH)),
      // a key waits for the lane change to finish, so the ship always ends up in a lane
      { key, jstkMov: joy, ground: 1 },
    );
  return c;
}
