// NEAR.CHR and FAR.CHR: Ray rolling (a sequence per key, the frames turning his bands the way he
// rolls), firing a ray of light, hurt, and de-rendering when he falls or runs out of light.
// The two files are the same Ray; only his bands' color says which plane is in focus.
import { emptyFrame, newCharacter, type Character, type Frame } from '../../../../web/src/formats/character';
import { MON, SEQ, SND } from '../ids';
import type { SpriteSet } from '../sprites/sprites';

// Keys (scan code << 8 | ASCII), as every Sandbox game: arrows and W/A/S/D, Q/E and the
// number pad corners for diagonals.
const KEY = {
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
  q: 0x1071,
  e: 0x1265,
  pad7: 0x4700,
  pad9: 0x4900,
  pad1: 0x4f00,
  pad3: 0x5100,
};
const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8, any: 9 };

/** Pixels Ray rolls a tick. */
const SPEED = 4;
const DIAG = 3;

type F = Partial<Frame> & { pic: number };
function frames(list: F[]): Frame[] {
  const out = Array.from({ length: 10 }, () => emptyFrame(true));
  list.forEach(
    (f, i) => (out[i] = { ...emptyFrame(), x: f.x ?? 0, y: f.y ?? 0, orient: f.orient ?? 0, pic1: f.pic1 ?? 50, pic2: f.pic2 ?? f.pic, pause: f.pause ?? 1 }),
  );
  return out;
}

export function buildRay(sp: SpriteSet, plane: 'n' | 'f'): Character {
  const ch = newCharacter();
  const s = ch.sequences;
  const c = (n: string) => sp.c(`${plane}${n}`);
  const set = (i: number, list: F[], o: Partial<(typeof s)[0]> = {}) => {
    s[i].frames = frames(list);
    Object.assign(s[i], o);
  };
  set(SEQ.idle, [{ pic: c('h0'), pause: 60 }]);
  set(
    SEQ.die,
    [0, 1, 2, 3, 4, 5].map((k) => ({ pic: sp.c(`die${k}`), pause: k === 5 ? 20 : 4 })),
    { sound: SND.die },
  );
  set(
    SEQ.hurt,
    [
      { pic: c('hurt'), pause: 2 },
      { pic: c('h0'), pause: 1 },
      { pic: c('hurt'), pause: 2 },
      { pic: c('h0'), pause: 1 },
    ],
    { sound: SND.hurt },
  );
  const H = ['h0', 'h1', 'h2', 'h3'];
  const V = ['v0', 'v1', 'v2', 'v3'];
  const roll = (i: number, key: number, joy: number, dx: number, dy: number, pics: string[]) =>
    set(
      i,
      pics.map((p) => ({ pic: c(p), x: dx, y: dy })),
      { key, jstkMov: joy, jstkBut: 0 },
    );
  const rev = (a: string[]) => [...a].reverse();
  roll(SEQ.up, KEY.up, JOY.up, 0, -SPEED, rev(V));
  roll(SEQ.down, KEY.down, JOY.down, 0, SPEED, V);
  roll(SEQ.left, KEY.left, JOY.left, -SPEED, 0, rev(H));
  roll(SEQ.right, KEY.right, JOY.right, SPEED, 0, H);
  roll(SEQ.w, KEY.w, 0, 0, -SPEED, rev(V));
  roll(SEQ.a, KEY.a, 0, -SPEED, 0, rev(H));
  roll(SEQ.s, KEY.s, 0, 0, SPEED, V);
  roll(SEQ.d, KEY.d, 0, SPEED, 0, H);
  roll(SEQ.q, KEY.q, JOY.upLeft, -DIAG, -DIAG, rev(H));
  roll(SEQ.e, KEY.e, JOY.upRight, DIAG, -DIAG, H);
  roll(SEQ.pad7, KEY.pad7, 0, -DIAG, -DIAG, rev(H));
  roll(SEQ.pad9, KEY.pad9, 0, DIAG, -DIAG, H);
  roll(SEQ.pad1, KEY.pad1, JOY.downLeft, -DIAG, DIAG, rev(H));
  roll(SEQ.pad3, KEY.pad3, JOY.downRight, DIAG, DIAG, H);
  // Pick up: the only thing in the game you can is never mentioned on screen.
  set(
    SEQ.pickup,
    [
      { pic: c('v1'), pause: 2 },
      { pic: c('h0'), pause: 2 },
    ],
    { key: KEY.enter, sound: SND.egg, jstkMov: 0, jstkBut: 0 },
  );
  // Fire: a ray of light the way he last rolled.
  set(
    SEQ.fire,
    [
      { pic: c('fire'), pause: 1 },
      { pic: 0, pic1: MON.shot, pic2: 100, y: 20, pause: 0 },
      { pic: c('fire'), pause: 2 },
      { pic: c('h0'), pause: 2 },
    ],
    { key: KEY.space, sound: SND.fire, norepeat: 1, ground: 1, jstkMov: JOY.any, jstkBut: 1 },
  );
  ch.meter[0] = 100; // light (hit points)
  ch.meter[1] = 3; // lives
  ch.meter[3] = 1; // money: none in this game
  return ch;
}
