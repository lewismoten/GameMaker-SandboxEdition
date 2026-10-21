// KID.CHR and SLED.CHR: the kid (a sequence per key: walk in eight directions, throw a
// snowball, the starting meters: health, lives, money and snowballs) and the sled, whose
// steering, braking and pushing all add momentum so it drifts and keeps its speed.
import { emptyFrame, newCharacter, type Character, type Frame } from '../../../../web/src/formats/character';
import { PAPERS, SND, THROWSEQ } from '../ids';
import { buildCharBlocks } from '../sprites/charBlocks';

// ---------------------------------------------------------------- characters
// Keys (scan code << 8 | ASCII). Every Sandbox game takes the arrows and W/A/S/D, with
// Q/E for up-left/up-right and the number pad's corners for all four diagonals (Game-Maker
// runs one sequence per key, so two arrows held together can't make a diagonal).
const KEY = {
  up: 0x4800,
  down: 0x5000,
  left: 0x4b00,
  right: 0x4d00,
  space: 0x3920,
  w: 0x1177,
  a: 0x1e61,
  s: 0x1f73,
  d: 0x2064,
  q: 0x1071,
  e: 0x1265,
  pad7: 0x4700,
  pad9: 0x4900,
  pad1: 0x4f00,
  pad3: 0x5100,
};
const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8, any: 9 };
const MIRROR = 0x40; // bottom block flipped left-right

type F = Partial<Frame> & { pic: number };
function frames(list: F[]): Frame[] {
  const out = Array.from({ length: 10 }, () => emptyFrame(true));
  list.forEach(
    (f, i) => (out[i] = { ...emptyFrame(), x: f.x ?? 0, y: f.y ?? 0, orient: f.orient ?? 0, pic1: f.pic1 ?? 50, pic2: f.pic2 ?? f.pic, pause: f.pause ?? 1 }),
  );
  return out;
}

export function buildKid(cb: ReturnType<typeof buildCharBlocks>, myBallMon: number): Character {
  const ch = newCharacter();
  const n = cb.n;
  const s = ch.sequences;
  const set = (i: number, list: F[], o: Partial<(typeof s)[0]> = {}) => {
    s[i].frames = frames(list);
    Object.assign(s[i], o);
  };
  set(0, [
    { pic: n('down0'), pause: 40 },
    { pic: n('blink'), pause: 2 },
    { pic: n('down0'), pause: 25 },
    { pic: n('blink'), pause: 2 },
  ]);
  set(
    1,
    [
      { pic: n('hurt'), pause: 2 },
      { pic: n('die0'), pause: 4 },
      { pic: n('die1'), pause: 6 },
      { pic: n('die1'), pause: 24 },
    ],
    { sound: SND.die },
  );
  set(
    2,
    [
      { pic: n('hurt'), pause: 1 },
      { pic: 50, pause: 1 },
      { pic: n('hurt'), pause: 1 },
      { pic: n('down0'), pause: 1 },
    ],
    { sound: SND.hurt },
  );
  const walk = (i: number, key: number, joy: number, dx: number, dy: number, pics: string[], orient = 0) =>
    set(
      i,
      pics.map((p) => ({ pic: n(p), x: dx, y: dy, orient })),
      { key, jstkMov: joy, jstkBut: 0 },
    );
  const UP = ['up1', 'up0', 'up2', 'up0'];
  const DOWN = ['down1', 'down0', 'down2', 'down0'];
  const SIDE = ['side1', 'side0', 'side1', 'side0'];
  walk(5, KEY.up, JOY.up, 0, -4, UP);
  walk(6, KEY.down, JOY.down, 0, 4, DOWN);
  walk(7, KEY.left, JOY.left, -4, 0, SIDE, MIRROR);
  walk(8, KEY.right, JOY.right, 4, 0, SIDE);
  // W/A/S/D, then the diagonals (Q/E and the number pad corners), in the free slots after the throw.
  walk(10, KEY.w, 0, 0, -4, UP);
  walk(11, KEY.a, 0, -4, 0, SIDE, MIRROR);
  walk(12, KEY.s, 0, 0, 4, DOWN);
  walk(13, KEY.d, 0, 4, 0, SIDE);
  walk(14, KEY.q, JOY.upLeft, -3, -3, SIDE, MIRROR);
  walk(15, KEY.e, JOY.upRight, 3, -3, SIDE);
  walk(16, KEY.pad7, 0, -3, -3, SIDE, MIRROR);
  walk(17, KEY.pad9, 0, 3, -3, SIDE);
  walk(18, KEY.pad1, JOY.downLeft, -3, 3, SIDE, MIRROR);
  walk(19, KEY.pad3, JOY.downRight, 3, 3, SIDE);
  set(
    THROWSEQ,
    [
      { pic: n('windup'), pause: 2 },
      { pic: 0, pic1: myBallMon, pic2: 100, y: 20, pause: 0 },
      { pic: n('throw'), pause: 3 },
    ],
    { key: KEY.space, sound: SND.throw, norepeat: 1, ground: 1, jstkMov: JOY.any, jstkBut: 1 },
  );
  ch.meter[0] = 100; // hit points
  ch.meter[1] = 3; // lives
  ch.meter[3] = 1; // money: shown as meter - 1, so $0
  ch.meter[THROWSEQ] = 6; // snowballs in your pockets
  ch.meter[PAPERS] = 1; // newspapers: shown as meter - 1, so none until the bundle
  return ch;
}

export function buildSledder(cb: ReturnType<typeof buildCharBlocks>): Character {
  const ch = newCharacter();
  const n = cb.n;
  const s = ch.sequences;
  const set = (i: number, list: F[], o: Partial<(typeof s)[0]> = {}) => {
    s[i].frames = frames(list);
    Object.assign(s[i], o);
  };
  set(0, [{ pic: n('sled'), pause: 30 }]);
  set(
    1,
    [
      { pic: n('sledCrash'), pause: 6 },
      { pic: n('sledCrash'), pause: 30 },
    ],
    { sound: SND.die },
  );
  set(
    2,
    [
      { pic: n('sledCrash'), pause: 3 },
      { pic: n('sledHurt'), pause: 1 },
      { pic: n('sled'), pause: 1 },
      { pic: n('sledHurt'), pause: 1 },
    ],
    { sound: SND.hurt },
  );
  // Steering, braking and pushing all add momentum: the sled drifts and keeps its speed.
  const mo = { momentum: 1, jstkBut: 0 };
  set(5, [{ pic: n('sledBrake'), y: -1, pause: 2 }], { key: KEY.up, jstkMov: JOY.up, sound: SND.brake, ...mo });
  set(6, [{ pic: n('sled'), y: 1, pause: 2 }], { key: KEY.down, jstkMov: JOY.down, sound: SND.push, ...mo });
  set(
    7,
    [
      { pic: n('sledL'), x: -1, pause: 1 },
      { pic: n('sledL'), x: 0, pause: 1 },
    ],
    { key: KEY.left, jstkMov: JOY.left, ...mo },
  );
  set(
    8,
    [
      { pic: n('sledR'), x: 1, pause: 1 },
      { pic: n('sledR'), x: 0, pause: 1 },
    ],
    { key: KEY.right, jstkMov: JOY.right, ...mo },
  );
  // The same moves on W/A/S/D, and Q/E (number pad 7/9) to steer while braking.
  for (const [from, to, key] of [
    [5, 9, KEY.w],
    [6, 10, KEY.s],
    [7, 11, KEY.a],
    [8, 12, KEY.d],
  ])
    s[to] = { ...s[from], key, jstkMov: 0 };
  const brakeSteer = (i: number, key: number, joy: number, pic: string, dx: number) =>
    set(
      i,
      [
        { pic: n(pic), x: dx, y: -1, pause: 1 },
        { pic: n(pic), x: 0, pause: 1 },
      ],
      { key, jstkMov: joy, sound: SND.brake, ...mo },
    );
  brakeSteer(13, KEY.q, JOY.upLeft, 'sledL', -1);
  brakeSteer(14, KEY.e, JOY.upRight, 'sledR', 1);
  brakeSteer(15, KEY.pad7, 0, 'sledL', -1);
  brakeSteer(16, KEY.pad9, 0, 'sledR', 1);
  ch.meter[0] = 100;
  ch.meter[1] = 3;
  ch.meter[3] = 1;
  return ch;
}
