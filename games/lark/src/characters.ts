// HERO.CHR and SIDE.CHR: Mystery Robot Joe from above (the library, the road, the town) and from
// the side (inside the clock, where gravity pulls down).
//
// From above he walks exactly one block a step, as he does in KEEP IT BRIEF!: a 4 pixel step
// held for 5 ticks, then two 8 pixel strides, so a quick tap is one block and he always stands
// squarely on the grid. Space picks up what he stands on.
//
// From the side: arrows walk, Up hops (an upward push each tick it is held; gravity takes one
// more away every tick), Q and E (or 7 and 9) hop sideways. Carrying the winding key, Space is a
// SPRING HOP: one big push into his momentum, once per press.
//
// Wind (hit points) is how wound up he is, and lives are spare bulbs. Nothing in chapter one
// winds him down. Counters start as ids.ts says; the money counter is left unlimited, which keeps
// F2's status page from showing a Money line at all.
import { CHARBL, MONBL } from '../../../web/src/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../web/src/formats/character';
import { BlockSet } from './blocks/sets';
import { KEEPSAKE } from './blocks/keepsakes';
import { COUNTER_START, KEY, SND, TOOL_MON } from './ids';
import { joe, joeWith } from './sprites/joe';

const MIRROR = 0x40;
const JOY = { up: 1, upRight: 2, right: 3, down: 5, left: 7, upLeft: 8 };

/** Top-down: each walk frame's pixels and ticks; they add up to one block. */
const WALK = [
  [4, 5],
  [8, 1],
  [8, 1],
] as const;

/** Side view: pixels a tick walking, the hop's push a tick, and its sideways drift. */
export const STEP = 3;
export const HOP = 11;
export const HOP_STEP = 3;
/** The spring hop's one push (pixels a tick, into momentum). */
export const SPRING = 15;

export const SEQ = {
  idle: 0,
  die: 1,
  hurt: 2,
  pickup: 3,
  drop: 4,
  up: 5,
  down: 6,
  left: 7,
  right: 8,
  w: 9,
  s: 10,
  a: 11,
  d: 12,
} as const;

/** Side-view sequence numbers. */
export const SIDE = {
  right: 5,
  left: 6,
  d: 7,
  a: 8,
  hop: 9,
  w: 10,
  hopLeft: 11,
  hopRight: 12,
  hopLeft7: 13,
  hopRight9: 14,
  spring: 15,
  /** ENTER with the heart balloon: BALLOON, rising while held, on the balloon's air. */
  balloon: 16,
  /** ENTER with nothing to use (or the balloon out of air): "hm?". */
  nope: 17,
  /** X with the Bard's drumstick: HELLO, a drum-boom thrown the way Joe last moved. */
  hello: 18,
} as const;

/** The heart balloon's air is its sequence's counter (a dandelion puff's effect fills it). */
export const AIR_SEQ = 16;
/** The balloon's air (its sequence counter): what Joe starts with, and what each puff adds. */
export const AIR = 8;
export const PUFF = 8;
/** The balloon's lift: added to his upward momentum every other tick (gravity takes 1 a tick). */
export const LIFT = 3;

export function heroBlocks(): BlockSet {
  const cb = new BlockSet(50, true);
  cb.add('down0', joe('down', 0));
  cb.add('down1', joe('down', 1));
  cb.add('blink', joe('down', 0, 'blink'));
  cb.add('up0', joe('up', 0));
  cb.add('up1', joe('up', 1));
  cb.add('side0', joe('side', 0));
  cb.add('side1', joe('side', 1));
  cb.add('shh', joe('down', 0, 'shh'));
  cb.add('glad', joe('down', 0, 'glad'));
  cb.add('hop', joe('side', 0, 'hop'));
  cb.add('hopFront', joe('down', 0, 'hop'));
  cb.add('hm', joe('down', 0, 'blink'));
  cb.add('balloon', joeWith('balloon'));
  cb.add('hello', joeWith('drumstick'));
  return cb;
}

function seqs(cb: BlockSet) {
  const f = (pic: string, pause: number, o: { x?: number; y?: number; mirror?: boolean } = {}): Frame => ({
    ...emptyFrame(),
    x: o.x ?? 0,
    y: o.y ?? 0,
    pic1: CHARBL,
    pic2: cb.id(pic),
    pause,
    orient: o.mirror ? MIRROR : 0,
  });
  const set = (s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}) => {
    if (frames.length > 10) throw new Error('Too many frames');
    frames.forEach((fr, i) => (s.frames[i] = fr));
    for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
    Object.assign(s, { sound: SND.none, jstkBut: 4, jstkMov: 0, ...o });
  };
  /** A frame that fires monster `mon` (a shot) from Joe's own cell. */
  const shot = (mon: number): Frame => ({ ...emptyFrame(), y: 20, pic1: mon, pic2: MONBL, pause: 0 });
  return { f, set, shot };
}

function meters(ch: Character): Character {
  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 10; // wind
  ch.meter[1] = 3; // spare bulbs
  for (const [n, v] of Object.entries(COUNTER_START)) ch.meter[Number(n)] = v;
  ch.meter[SIDE.balloon] = AIR;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}

/** HERO.CHR: Joe from above. */
export function buildHero(cb: BlockSet): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const { f, set } = seqs(cb);
  // idle: blinks now and then, and every so often holds a finger to his grille: shhh
  set(S[SEQ.idle], [f('down0', 50), f('blink', 3), f('down0', 60), f('blink', 3), f('down0', 30), f('shh', 24), f('down0', 4), f('blink', 3)]);
  set(S[SEQ.die], [f('blink', 4), f('shh', 10), f('blink', 10)], { jstkBut: 0 });
  set(S[SEQ.hurt], [f('blink', 1)], { jstkBut: 0 });
  set(S[SEQ.pickup], [f('hopFront', 3), f('glad', 6), f('down0', 1)], { key: KEY.space, sound: SND.chirp, ground: 1, norepeat: 1 });
  set(S[SEQ.drop], [f('down0', 1)], { key: 0 });
  const walk = (dx: number, dy: number, a: string, b: string, mirror = false) =>
    WALK.map(([px, pause], i) => f(i % 2 ? b : a, pause, { x: dx * px, y: dy * px, mirror }));
  const move = { ground: 1 };
  set(S[SEQ.up], walk(0, -1, 'up0', 'up1'), { key: KEY.up, jstkMov: JOY.up, ...move });
  set(S[SEQ.down], walk(0, 1, 'down0', 'down1'), { key: KEY.down, jstkMov: JOY.down, ...move });
  set(S[SEQ.left], walk(-1, 0, 'side0', 'side1'), { key: KEY.left, jstkMov: JOY.left, ...move });
  set(S[SEQ.right], walk(1, 0, 'side0', 'side1', true), { key: KEY.right, jstkMov: JOY.right, ...move });
  set(S[SEQ.w], walk(0, -1, 'up0', 'up1'), { key: KEY.w, ...move });
  set(S[SEQ.s], walk(0, 1, 'down0', 'down1'), { key: KEY.s, ...move });
  set(S[SEQ.a], walk(-1, 0, 'side0', 'side1'), { key: KEY.a, ...move });
  set(S[SEQ.d], walk(1, 0, 'side0', 'side1', true), { key: KEY.d, ...move });
  return meters(ch);
}

/** SIDE.CHR: Joe from the side, where gravity pulls. */
export function buildSide(cb: BlockSet): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const { f, set, shot } = seqs(cb);
  set(S[SEQ.idle], [f('down0', 40), f('blink', 3), f('down0', 50), f('blink', 3), f('glad', 20)]);
  set(S[SEQ.die], [f('blink', 4), f('shh', 10), f('blink', 10)], { jstkBut: 0 });
  set(S[SEQ.hurt], [f('blink', 1)], { jstkBut: 0 });
  // DOWN picks up what Joe stands by (Space is for hopping, from the side)
  set(S[SEQ.pickup], [f('hopFront', 3), f('glad', 6), f('down0', 1)], { key: KEY.down, sound: SND.chirp, ground: 1, norepeat: 1 });
  set(S[SEQ.drop], [f('down0', 1)], { key: 0 });
  const walk = (dx: number, mirror: boolean) => ['side1', 'side0', 'side1', 'side0'].map((pic) => f(pic, 1, { x: dx, mirror }));
  set(S[SIDE.right], walk(STEP, true), { key: KEY.right, jstkMov: JOY.right });
  set(S[SIDE.left], walk(-STEP, false), { key: KEY.left, jstkMov: JOY.left });
  set(S[SIDE.d], walk(STEP, true), { key: KEY.d });
  set(S[SIDE.a], walk(-STEP, false), { key: KEY.a });
  const hop = [f('hopFront', 1, { y: -HOP })];
  set(S[SIDE.hop], hop, { key: KEY.up, jstkMov: JOY.up, sound: SND.hop });
  set(S[SIDE.w], hop, { key: KEY.w, sound: SND.hop });
  const side = (dx: number, mirror: boolean) => [f('hop', 1, { x: dx, y: -HOP, mirror }), f('hop', 1, { x: dx, y: -HOP, mirror })];
  set(S[SIDE.hopLeft], side(-HOP_STEP, false), { key: KEY.q, jstkMov: JOY.upLeft, sound: SND.hop });
  set(S[SIDE.hopRight], side(HOP_STEP, true), { key: KEY.e, jstkMov: JOY.upRight, sound: SND.hop });
  set(S[SIDE.hopLeft7], side(-HOP_STEP, false), { key: KEY.home, sound: SND.hop });
  set(S[SIDE.hopRight9], side(HOP_STEP, true), { key: KEY.pgup, sound: SND.hop });
  // the winding key's spring hop: one big push, once per press
  set(S[SIDE.spring], [f('hopFront', 2, { y: -SPRING }), f('glad', 6)], {
    key: KEY.space,
    sound: SND.hop,
    momentum: 1,
    norepeat: 1,
    bloc: KEEPSAKE.windKey,
  });
  // the heart balloon: each frame adds lift to his momentum, and uses a breath of its air
  set(S[SIDE.balloon], [f('balloon', 2, { y: -LIFT })], { key: KEY.enter, momentum: 1, bloc: KEEPSAKE.balloon });
  set(S[SIDE.nope], [f('hm', 6)], { key: KEY.enter, sound: SND.nope, ground: 1, norepeat: 1 });
  set(S[SIDE.hello], [shot(TOOL_MON.hello), f('hello', 6)], { key: KEY.x, sound: SND.boom, ground: 1, norepeat: 1, bloc: KEEPSAKE.drumstick });
  return meters(ch);
}
