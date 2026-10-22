// PIP.CHR: Pip walks on the arrows or W/A/S/D, swings on Space, toots the kazoo on K and
// drinks a tonic on T. Game-Maker runs the first sequence bound to a key that is turned on and
// has uses left, so the steel sword's swing (sequence 13, no swings until it's bought) comes
// before the wooden one's (14, unlimited): buying the sword fills its counter with 30,000
// swings and Space swings steel from then on. The kazoo and the tonic are counters too, filled
// by shops and by Doc Leo, and empty means the key does nothing.
import { PICKUPSEQ, DIESEQ, HURTSEQ, emptyFrame, newCharacter, type Character, type Frame } from '../../../../web/src/formats/character';
import { MON, SEQ, SND } from '../ids';
import type { SpriteSheet } from '../sprites/sheet';

export const KEY = {
  up: 0x4800,
  down: 0x5000,
  left: 0x4b00,
  right: 0x4d00,
  space: 0x3920,
  enter: 0x1c0d,
  w: 0x1177,
  a: 0x1e61,
  s: 0x1f73,
  d: 0x2064,
  k: 0x256b,
  t: 0x1474,
};
const JOY = { up: 1, right: 3, down: 5, left: 7, any: 9 };
const MIRROR = 0x40;
const TURN = 0x10;
const CHARBL = 50;
const MONBL = 100;

type F = Partial<Frame> & { pic: number };
export function frames(list: F[]): Frame[] {
  const out = Array.from({ length: 10 }, () => emptyFrame(true));
  list.forEach((f, i) => (out[i] = { ...emptyFrame(), x: f.x ?? 0, y: f.y ?? 0, orient: f.orient ?? 0, pic1: f.pic1 ?? CHARBL, pic2: f.pic2 ?? f.pic, pause: f.pause ?? 1 }));
  return out;
}

/** Pixels a walking step moves, and the step count per walk cycle. */
export const STEP = 4;

export function buildPip(cb: SpriteSheet): Character {
  const ch = newCharacter();
  const n = (s: string) => cb.n(s);
  const s = ch.sequences;
  const set = (i: number, list: F[], o: Partial<(typeof s)[0]> = {}) => {
    s[i].frames = frames(list);
    Object.assign(s[i], o);
  };
  set(0, [
    { pic: n('down0'), pause: 50 },
    { pic: n('blink'), pause: 2 },
    { pic: n('down0'), pause: 30 },
    { pic: n('blink'), pause: 2 },
  ]);
  set(
    DIESEQ,
    [
      { pic: n('hurt'), pause: 3 },
      { pic: n('down'), orient: TURN, pause: 8 },
      { pic: n('down'), orient: TURN, pause: 30 },
    ],
    { sound: SND.die },
  );
  set(
    HURTSEQ,
    [
      { pic: n('hurt'), pause: 1 },
      { pic: CHARBL, pause: 1 },
      { pic: n('hurt'), pause: 1 },
      { pic: n('down0'), pause: 1 },
    ],
    { sound: SND.hurt },
  );
  set(
    PICKUPSEQ,
    [
      { pic: n('stoop'), pause: 3 },
      { pic: n('down0'), pause: 2 },
    ],
    { key: KEY.enter, sound: SND.pickup },
  );
  const walk = (i: number, key: number, joy: number, dx: number, dy: number, pics: string[], orient = 0) =>
    set(
      i,
      pics.map((p) => ({ pic: n(p), x: dx, y: dy, orient })),
      { key, jstkMov: joy, jstkBut: 0 },
    );
  const UP = ['up1', 'up0', 'up2', 'up0'];
  const DOWN = ['down1', 'down0', 'down2', 'down0'];
  const SIDE = ['side1', 'side0', 'side2', 'side0'];
  walk(SEQ.up, KEY.up, JOY.up, 0, -STEP, UP);
  walk(SEQ.down, KEY.down, JOY.down, 0, STEP, DOWN);
  walk(SEQ.left, KEY.left, JOY.left, -STEP, 0, SIDE, MIRROR);
  walk(SEQ.right, KEY.right, JOY.right, STEP, 0, SIDE);
  walk(SEQ.w, KEY.w, 0, 0, -STEP, UP);
  walk(SEQ.a, KEY.a, 0, -STEP, 0, SIDE, MIRROR);
  walk(SEQ.s, KEY.s, 0, 0, STEP, DOWN);
  walk(SEQ.d, KEY.d, 0, STEP, 0, SIDE);
  // A swing fires a slash the way Pip last walked (Game-Maker aims a fired monster along the
  // last step); y 20 puts it on his own row, a one-block character's only row. The slash comes
  // first, on the very tick the key is pressed: a foe's bite starts the hurt sequence, which
  // would cut a wind-up short before the blow ever landed.
  const swing = (i: number, mon: number) =>
    set(
      i,
      [
        { pic: 0, pic1: mon, pic2: MONBL, y: 20, pause: 0 },
        { pic: n('strike'), pause: 3 },
        { pic: n('windup'), pause: 1 },
      ],
      { key: KEY.space, sound: SND.slash, norepeat: 1, ground: 1, jstkMov: JOY.any, jstkBut: 1 },
    );
  swing(SEQ.steel, MON.slashSteel);
  swing(SEQ.wood, MON.slashWood);
  set(
    SEQ.kazoo,
    [
      { pic: 0, pic1: MON.note, pic2: MONBL, y: 20, pause: 0 },
      { pic: n('toot'), pause: 5 },
    ],
    { key: KEY.k, sound: SND.kazoo, norepeat: 1, ground: 1, jstkMov: 0, jstkBut: 0 },
  );
  set(
    SEQ.tonic,
    [
      { pic: 0, pic1: MON.tonicA, pic2: MONBL, y: 20, pause: 0 },
      { pic: n('swig'), pause: 10 },
    ],
    { key: KEY.t, sound: SND.tonic, norepeat: 1, ground: 1, jstkMov: 0, jstkBut: 0 },
  );
  ch.meter[0] = 100; // hit points
  ch.meter[1] = 3; // lives
  ch.meter[3] = 1 + 10; // money: shown as meter - 1, so 10 gold
  ch.meter[SEQ.steel] = 0; // no steel sword yet
  ch.meter[SEQ.kazoo] = 0; // no kazoo yet
  ch.meter[SEQ.tonic] = 1; // one tonic in the satchel
  return ch;
}
