// sandcast.chr: Teddy, a one-block corgi knight. He walks on the arrows and on W/A/S/D;
// the last four sequences are his tricks, on the number keys.
import { CHARBL, MONBL } from '../../../../web/src/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '../../../../web/src/formats/character';
import { BG } from '../blocks/bblocks';
import { CB } from '../sprites/sprites';
import { CTR, MON, SEQ, SND } from '../rules';

const c = (name: string) => CB.id(name);

/** A frame showing one block (the bottom one; there is no top block). */
function f(pic: string, pause: number, x = 0, y = 0, mirror = false): Frame {
  return { ...emptyFrame(), x, y, pic1: CHARBL, pic2: c(pic), pause, orient: mirror ? 0x40 : 0 };
}

/** A frame that throws a monster from Teddy's own square. */
function birth(mon: number): Frame {
  return { ...emptyFrame(), x: 0, y: 20, pic1: mon, pic2: MONBL, pause: 1 };
}

const KEY = {
  right: 0x4d00,
  left: 0x4b00,
  up: 0x4800,
  down: 0x5000,
  w: 0x1177,
  a: 0x1e61,
  s: 0x1f73,
  d: 0x2064,
  space: 0x3920,
  b: 0x3062,
  p: 0x1970,
  f: 0x2166,
  two: 0x0332,
  three: 0x0433,
  four: 0x0534,
  five: 0x0635,
};

function set(s: Sequence, frames: Frame[], o: Partial<Omit<Sequence, 'frames'>> = {}): void {
  frames.forEach((fr, i) => (s.frames[i] = fr));
  for (let i = frames.length; i < s.frames.length; i++) s.frames[i] = emptyFrame(true);
  Object.assign(s, o);
}

const STEP = 5;

function walk(prefix: string, dx: number, dy: number, mirror = false): Frame[] {
  const seq = ['a', 'stand', 'b', 'stand'];
  return seq.map((st) => f(`${prefix}_${st}`, 1, dx, dy, mirror));
}

export function buildCharacter(): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const bucket = BG.id('bucket');
  const shovel = BG.id('shovel');

  set(S[SEQ.idle], [
    f('down_stand', 40),
    f('idle_sway', 6),
    f('down_stand', 28),
    f('idle_sway', 5),
    f('down_stand', 3),
    f('idle_sway', 5),
    f('down_stand', 50),
    f('sit0', 30),
  ]);
  set(S[SEQ.die], [f('hurt_white', 2), f('die0', 3), f('die1', 4), f('die2', 4), f('die3', 24)], { sound: SND.die });
  set(S[SEQ.hurt], [f('hurt_white', 2), f('hurt_red', 2), f('hurt_white', 2), f('hurt_red', 1)], { sound: SND.hurt });
  set(S[SEQ.pickup], [f('idle_sway', 2), f('down_stand', 2)], { key: KEY.p, sound: SND.pickup, ground: 1, norepeat: 1, jstkMov: 0, jstkBut: 0 });
  set(S[SEQ.drop], [f('down_stand', 1)], { key: 0 });

  const moves: [number, number, string, number, number, boolean, number][] = [
    [SEQ.right, KEY.right, 'right', STEP, 0, false, 3],
    [SEQ.left, KEY.left, 'right', -STEP, 0, true, 7],
    [SEQ.up, KEY.up, 'up', 0, -STEP, false, 1],
    [SEQ.down, KEY.down, 'down', 0, STEP, false, 5],
    [SEQ.rightD, KEY.d, 'right', STEP, 0, false, 0],
    [SEQ.leftA, KEY.a, 'right', -STEP, 0, true, 0],
    [SEQ.upW, KEY.w, 'up', 0, -STEP, false, 0],
    [SEQ.downS, KEY.s, 'down', 0, STEP, false, 0],
  ];
  for (const [n, key, prefix, dx, dy, mirror, joy] of moves) set(S[n], walk(prefix, dx, dy, mirror), { key, jstkMov: joy, jstkBut: 4, sound: SND.none });

  set(S[SEQ.fling], [f('fling_back', 3), birth(MON.clod), f('fling_fwd', 3), f('down_stand', 1)], {
    key: KEY.space,
    bloc: shovel,
    sound: SND.fling,
    ground: 1,
    jstkMov: 9,
    jstkBut: 1,
  });
  set(S[SEQ.splash], [f('splash_up', 3), birth(MON.splash), f('splash_out', 4), f('down_stand', 1)], {
    key: KEY.b,
    bloc: bucket,
    sound: SND.splash,
    ground: 1,
    norepeat: 1,
    jstkMov: 9,
    jstkBut: 2,
  });

  set(S[SEQ.fetch], [f('toss0', 3), birth(MON.ball), f('toss1', 3), f('down_stand', 1)], {
    key: KEY.f,
    sound: SND.squeak,
    ground: 1,
    norepeat: 1,
    jstkMov: 0,
    jstkBut: 4,
  });

  // Tricks: Teddy knows lots of them.
  const trick = { ground: 1, norepeat: 1, jstkMov: 0, jstkBut: 4 };
  set(S[SEQ.sit], [f('sit0', 12), f('sit1', 14), f('sit0', 10), f('down_stand', 1)], { ...trick, key: KEY.two, sound: SND.trick });
  // Spinning round (down, left, up, right, twice) kicks up a whirl of sand.
  const L = (pic: string) => f(pic, 2, 0, 0, true);
  set(
    S[SEQ.spin],
    [
      birth(MON.whirl),
      f('down_stand', 2),
      L('right_stand'),
      f('up_stand', 2),
      f('right_stand', 2),
      f('down_stand', 2),
      L('right_stand'),
      f('up_stand', 2),
      f('right_stand', 2),
      f('down_stand', 2),
    ],
    { ...trick, key: KEY.three, sound: SND.whirl },
  );
  set(S[SEQ.roll], [f('right_stand', 2), f('roll1', 3), f('belly', 8), f('roll3', 3), f('right_stand', 2), f('down_stand', 1)], {
    ...trick,
    key: KEY.five,
    sound: SND.trick,
  });
  set(S[SEQ.playDead], [f('roll1', 3), f('dead', 30), f('dead', 12), f('roll3', 3), f('right_stand', 2), f('down_stand', 1)], {
    ...trick,
    key: KEY.four,
    sound: SND.die,
  });

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // hit points
  ch.meter[CTR.lives] = 3;
  ch.meter[CTR.sand] = 1; // counters read one more than they hold
  ch.meter[SEQ.splash] = 0; // no water until you find some
  ch.meter[SEQ.fetch] = 0; // no tennis balls until you find some
  for (let i = 20; i < 30; i++) ch.meter[i] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}
