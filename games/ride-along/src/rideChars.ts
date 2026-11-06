// RIDE ALONG's two vehicle characters, each a character file of its own (SHIP.CHR + SHIP.CBL, BOAT.CHR +
// BOAT.CBL). A level's scene names one in its character slot, so the same helper is a rocket or a canoe.
//
// THE FORCED MOVE lives in the sequences, in the frames' y. Every frame of the IDLE sequence (sequence 0, the
// one that runs when no key is held) moves the vehicle up by a few pixels, and each frame lasts a single tick,
// so doing nothing still goes somewhere. Every key's sequence carries the same drift, so steering never
// stops it:
//
//   SHIP  idle: up 2 pixels a tick   Left/Right: steer 4 pixels a tick, still rising   Up: up 4   Down: up 1
//         (down never reverses it; Space does nothing, a rocket has no jump)
//   BOAT  idle: up 1 and 2 pixels a tick, in turn, Left/Right: 3 across   Up: 3   Down: 1
//         Space: a paddle stroke, up 4 for a few ticks
//
// The kit's helper leaves the same four sequences for these keys; only the frames are new.
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Book } from '../../kit/starter/book';
import { KEYS } from '../../kit/starter/blocks';
import { KEY, SEQ, SND } from '../../kit/starter/ids';
import type { Pal } from '../../kit/starter/palette';
import { canoe, halves, rocket } from './shipArt';

/** Pixels a tick the rocket rises with no key held. */
export const SHIP_DRIFT = 2;
export const SHIP_FAST = 4;
export const SHIP_SLOW = 1;
export const SHIP_STEER = 4;
/** The canoe's drift is 1 and 2 in turn (1.5 a tick on average). */
export const BOAT_DRIFT = [1, 2];
export const BOAT_STEER = 3;
export const BOAT_STROKE = 4;
export const HERO_HIT_POINTS = 50;

const addHalves = (b: Book, name: string, p: ReturnType<typeof rocket>): void => {
  const h = halves(p);
  b.add(`${name}.top`, h.top);
  b.add(`${name}.bottom`, h.bottom);
};

/** The rocket's character blocks: its two flames. */
export function buildShipBlocks(pal: Pal): Book {
  const b = new Book('cbl');
  addHalves(b, 'ship0', rocket(pal, true, 0));
  addHalves(b, 'ship1', rocket(pal, true, 1));
  return b;
}

/** The canoe's character blocks: the paddle at rest in two tilts, and in the water with splashes. */
export function buildBoatBlocks(pal: Pal): Book {
  const b = new Book('cbl');
  addHalves(b, 'boat0', canoe(pal, 0, false));
  addHalves(b, 'boat1', canoe(pal, 1, false));
  addHalves(b, 'boat2', canoe(pal, 0, true));
  addHalves(b, 'boat3', canoe(pal, 1, true));
  return b;
}

type Pic = (n: number) => string;

function base(cb: Book, still: Pic): { ch: Character; f: (n: number, o?: { x?: number; y?: number; pause?: number }) => Frame } {
  const ch = newCharacter();
  const S = ch.sequences;
  const f = (n: number, o: { x?: number; y?: number; pause?: number } = {}): Frame => ({
    ...emptyFrame(),
    x: o.x ?? 0,
    y: o.y ?? 0,
    pic1: cb.n(`${still(n)}.top`),
    pic2: cb.n(`${still(n)}.bottom`),
    pause: o.pause ?? 1,
  });
  set(S[SEQ.die], [f(0, { pause: 10 }), f(1, { pause: 24 })], { sound: SND.die, jstkBut: 0 });
  set(S[SEQ.hurt], [f(0, { pause: 2 }), f(1), f(0, { pause: 2 })], { sound: SND.hurt, jstkBut: 0 });
  set(S[3], [f(0)], { key: 0 });
  set(S[4], [f(0)], { key: 0 });
  set(S[SEQ.dig], [f(0)], { key: 0 });
  set(S[SEQ.throw], [f(0)], { key: 0 });
  set(S[SEQ.cheer], [f(0)], { key: 0 });
  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = HERO_HIT_POINTS;
  ch.meter[1] = 3;
  ch.meter[KEYS] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return { ch, f };
}

/** SHIP.CHR, using the pictures in `cb` (buildShipBlocks). */
export function buildShip(cb: Book): Character {
  const { ch, f } = base(cb, (n) => `ship${n % 2}`);
  const S = ch.sequences;
  // four frames, one tick each, the flame flickering; `dx` across and `dy` (negative is up) in every one
  const run = (dx: number, dy: number) => [0, 1, 0, 1].map((n) => f(n, { x: dx, y: dy }));
  set(S[SEQ.idle], run(0, -SHIP_DRIFT));
  set(S[SEQ.right], run(SHIP_STEER, -SHIP_DRIFT), { key: KEY.right, jstkMov: 3 });
  set(S[SEQ.left], run(-SHIP_STEER, -SHIP_DRIFT), { key: KEY.left, jstkMov: 7 });
  set(S[SEQ.up], run(0, -SHIP_FAST), { key: KEY.up, jstkMov: 1 });
  set(S[SEQ.down], run(0, -SHIP_SLOW), { key: KEY.down, jstkMov: 5 });
  set(S[SEQ.rightD], run(SHIP_STEER, -SHIP_DRIFT), { key: KEY.d });
  set(S[SEQ.leftA], run(-SHIP_STEER, -SHIP_DRIFT), { key: KEY.a });
  set(S[SEQ.upW], run(0, -SHIP_FAST), { key: KEY.w });
  set(S[SEQ.downS], run(0, -SHIP_SLOW), { key: KEY.s });
  // Space: a rocket has no jump. The sequence is there so the key is claimed, and it carries the drift too.
  set(S[SEQ.jump], run(0, -SHIP_DRIFT), { key: KEY.space, norepeat: 1, jstkMov: 9, jstkBut: 1 });
  return ch;
}

/** BOAT.CHR, using the pictures in `cb` (buildBoatBlocks). */
export function buildBoat(cb: Book): Character {
  const { ch, f } = base(cb, (n) => `boat${n}`);
  const S = ch.sequences;
  const [a, b] = BOAT_DRIFT;
  // the idle sequence: the paddle rocks between two tilts while the river carries the canoe 1, 2, 1, 2 pixels a tick
  const idle = [0, 0, 1, 1, 0, 0, 1, 1].map((n, i) => f(n, { y: -(i % 2 ? b : a) }));
  set(S[SEQ.idle], idle);
  const steer = (dx: number) => [0, 1, 0, 1].map((n, i) => f(n, { x: dx, y: -(i % 2 ? b : a) }));
  const lift = (dy: number) => [0, 1, 0, 1].map((n) => f(n, { y: -dy }));
  set(S[SEQ.right], steer(BOAT_STEER), { key: KEY.right, jstkMov: 3 });
  set(S[SEQ.left], steer(-BOAT_STEER), { key: KEY.left, jstkMov: 7 });
  set(S[SEQ.up], lift(3), { key: KEY.up, jstkMov: 1 });
  set(S[SEQ.down], lift(1), { key: KEY.down, jstkMov: 5 });
  set(S[SEQ.rightD], steer(BOAT_STEER), { key: KEY.d });
  set(S[SEQ.leftA], steer(-BOAT_STEER), { key: KEY.a });
  set(S[SEQ.upW], lift(3), { key: KEY.w });
  set(S[SEQ.downS], lift(1), { key: KEY.s });
  // Space: one paddle stroke, splashing at each blade and pushing up 4 pixels a tick for 6 ticks
  const stroke = [2, 2, 3, 3, 2, 3].map((n) => f(n, { y: -BOAT_STROKE }));
  set(S[SEQ.jump], stroke, { key: KEY.space, sound: SND.jump, norepeat: 1, jstkMov: 9, jstkBut: 1 });
  return ch;
}
