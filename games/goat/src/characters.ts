// GOAT.CHR (the goat: walk in eight directions, SCREAM, bleat, chew; her breath, wool,
// health and lives) and the .MON file each level loads.
//
// Monster rules used here: when two monsters touch, the one with more power kills the other,
// so the scream (power 120) knocks over a fainting cousin (110) and a pigeon (40) but not a
// camel (200) or the donkey. A monster under power 100 dies when it touches the goat (after
// its block's effect lands: a lamb's wool, a pigeon's peck); 100 and up stays, and a solid
// block keeps you out. A monster that dies is reborn as its newmon, so a cousin keels over
// stiff, lies there a few seconds (end: a lifetime in ticks) and gets back up.
import { emptyFrame, newCharacter, type Character, type Frame } from '../../../web/src/formats/character';
import { emptyMonster, newMonsterSet, type March, type Monster } from '../../../web/src/formats/monster';
import { BLEATSEQ, CHEWSEQ, MON, SCREAMSEQ, SND, WOOL } from './ids';
import type { buildCharBlocks, buildMonsterBlocks } from './sprites/sprites';

// Keys (scan code << 8 | ASCII): the arrows and W/A/S/D, Q/E and the number pad's lower
// corners for the diagonals, SPACE to scream, B to bleat and C to chew.
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
  b: 0x3062,
  c: 0x2e63,
  pad1: 0x4f00,
  pad3: 0x5100,
};
const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8, any: 9 };
const MIRROR = 0x40; // bottom block flipped left-right

/** Pixels a step. */
export const STEP = 4;
/** Breath to start with: one scream each. */
export const BREATH = 4;

type F = Partial<Frame> & { pic: number };
function frames(list: F[]): Frame[] {
  const out = Array.from({ length: 10 }, () => emptyFrame(true));
  list.forEach((f, i) => (out[i] = { ...emptyFrame(), x: f.x ?? 0, y: f.y ?? 0, orient: f.orient ?? 0, pic1: f.pic1 ?? 50, pic2: f.pic2 ?? f.pic, pause: f.pause ?? 1 }));
  return out;
}

export function buildGoat(cb: ReturnType<typeof buildCharBlocks>): Character {
  const ch = newCharacter();
  const n = cb.n;
  const s = ch.sequences;
  const set = (i: number, list: F[], o: Partial<(typeof s)[0]> = {}) => {
    s[i].frames = frames(list);
    Object.assign(s[i], o);
  };
  // Idle: chewing her cud, with a blink.
  set(0, [
    { pic: n('down0'), pause: 30 },
    { pic: n('blink'), pause: 2 },
    { pic: n('down0'), pause: 20 },
    { pic: n('chew0'), pause: 6 },
    { pic: n('chew1'), pause: 6 },
    { pic: n('chew0'), pause: 6 },
    { pic: n('chew1'), pause: 6 },
  ]);
  // Fainting: she keels over stiff, legs straight up.
  set(
    1,
    [
      { pic: n('scream0'), pause: 3 },
      { pic: n('faint0'), pause: 3 },
      { pic: n('faint1'), pause: 30 },
    ],
    { sound: SND.faint },
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
  const SIDE = ['side1', 'side0', 'side2', 'side0'];
  walk(5, KEY.up, JOY.up, 0, -STEP, UP);
  walk(6, KEY.down, JOY.down, 0, STEP, DOWN);
  walk(7, KEY.left, JOY.left, -STEP, 0, SIDE, MIRROR);
  walk(8, KEY.right, JOY.right, STEP, 0, SIDE);
  walk(10, KEY.w, 0, 0, -STEP, UP);
  walk(11, KEY.a, 0, -STEP, 0, SIDE, MIRROR);
  walk(12, KEY.s, 0, 0, STEP, DOWN);
  walk(13, KEY.d, 0, STEP, 0, SIDE);
  walk(14, KEY.q, JOY.upLeft, -3, -3, SIDE, MIRROR);
  walk(15, KEY.e, JOY.upRight, 3, -3, SIDE);
  walk(16, KEY.pad1, JOY.downLeft, -3, 3, SIDE, MIRROR);
  walk(17, KEY.pad3, JOY.downRight, 3, 3, SIDE);
  // SCREAM: the scream flies off the way she last walked. Each one takes a breath.
  set(
    SCREAMSEQ,
    [
      { pic: n('scream0'), pause: 2 },
      { pic: 0, pic1: MON.scream, pic2: 100, y: 20, pause: 0 },
      { pic: n('scream1'), pause: 4 },
      { pic: n('scream0'), pause: 2 },
    ],
    { key: KEY.space, sound: SND.scream, norepeat: 1, ground: 1, jstkMov: JOY.any, jstkBut: 1 },
  );
  set(
    BLEATSEQ,
    [
      { pic: n('bleat'), pause: 6 },
      { pic: n('side0'), pause: 2 },
      { pic: n('bleat'), pause: 6 },
    ],
    { key: KEY.b, sound: SND.bleat, norepeat: 1, jstkMov: 0, jstkBut: 2 },
  );
  set(
    CHEWSEQ,
    [
      { pic: n('chew0'), pause: 5 },
      { pic: n('chew1'), pause: 5 },
      { pic: n('chew0'), pause: 5 },
      { pic: n('chew1'), pause: 5 },
    ],
    { key: KEY.c, sound: SND.chew, norepeat: 1, jstkMov: 0, jstkBut: 4 },
  );
  ch.meter[0] = 100; // hit points
  ch.meter[1] = 3; // lives
  ch.meter[SCREAMSEQ] = BREATH;
  ch.meter[WOOL] = 1; // shown as meter - 1: no wool yet
  return ch;
}

const corner = (x: number, y: number, speed: number, orient = 0): March => ({ x, y, pic: speed, orient });

function mon(pics: [number, number][], o: Partial<Monster>, path: March[] = [], attack: March[] = []): Monster {
  const m = emptyMonster();
  m.used = 1;
  pics.forEach((p, i) => (m.pic[i] = p));
  Object.assign(m, o);
  path.forEach((c, i) => (m.march[0][i] = c));
  attack.forEach((c, i) => (m.march[1][i] = c));
  return m;
}

export interface MonsterOptions {
  /** Blocks a camel walks before turning round. */
  camelRun?: number;
  camelSpeed?: number;
  /** How long a fainted cousin lies stiff, in ticks. */
  faint?: number;
}

/** Ticks a cousin lies stiff after a scream. */
export const FAINT_TICKS = 90;

export function buildMonsters(mb: ReturnType<typeof buildMonsterBlocks>, o: MonsterOptions = {}): Monster[] {
  const set = newMonsterSet();
  const n = mb.n;
  const anim = (a: string, b: string, t = 3): [number, number][] => [
    [n(a), t],
    [n(b), t],
  ];
  set[MON.scream] = mon(anim('wave0', 'wave1', 2), { power: 120, thru: 1, towards: 7, end: 14, newmon: MON.echo });
  set[MON.echo] = mon([[n('echo'), 3]], { power: 100, thru: 0, end: 4 });
  // Lambs mill about; bump one for a tuft of wool and it bounds off shorn, to grow it back.
  set[MON.lamb] = mon(anim('lamb0', 'lamb1', 5), { power: 60, thru: 1, towards: 64, newmon: MON.lambShorn, upscore: 0 });
  set[MON.lambShorn] = mon(anim('shorn0', 'shorn1', 2), { power: 100, thru: 1, towards: -4, end: 240, newmon: MON.lamb });
  // The fainting cousins stand in the way, solid, until a scream knocks them over.
  const faint = o.faint ?? FAINT_TICKS;
  set[MON.goat] = mon(
    [
      [n('goat0'), 30],
      [n('goat1'), 2],
      [n('goat0'), 12],
      [n('goat1'), 2],
    ],
    { power: 110, thru: 1, newmon: MON.goatFaint, upscore: 100 },
  );
  set[MON.goatFaint] = mon(anim('goatFaint0', 'goatFaint1', 8), { power: 100, thru: 1, end: faint, newmon: MON.goat });
  set[MON.cousin] = mon(anim('brown0', 'brown1', 4), { power: 110, thru: 1, towards: 64, newmon: MON.cousinFaint, upscore: 50 });
  set[MON.cousinFaint] = mon([[n('brownFaint'), 10]], { power: 100, thru: 1, end: faint, newmon: MON.cousin });
  // Pigeons come for you when you're close, and peck; a scream sends them off in feathers.
  set[MON.pigeon] = mon(anim('pigeon0', 'pigeon1', 3), { power: 40, thru: 1, towards: 64, activate: 2, newmon: MON.feathers, upscore: 25 }, [], [corner(0, 0, 1), corner(0, 0, 2)]);
  set[MON.feathers] = mon(anim('feathers0', 'feathers1', 2), { power: 100, thru: 0, end: 6 });
  // Camels: two monsters side by side; at the end of each leg each "dies" into its mirror twin.
  const run = o.camelRun ?? 8;
  const sp = o.camelSpeed ?? 2;
  set[MON.camelAR] = mon(anim('rear0', 'rear1'), { power: 200, thru: 0, end: -1, newmon: MON.camelAL }, [corner(0, 0, sp), corner(run, 0, sp, 0)]);
  set[MON.camelAL] = mon(anim('front0', 'front1'), { power: 200, thru: 0, end: -1, newmon: MON.camelAR }, [corner(0, 0, sp), corner(-run, 0, sp, 4)]);
  set[MON.camelBR] = mon(anim('front0', 'front1'), { power: 200, thru: 0, end: -1, newmon: MON.camelBL }, [corner(0, 0, sp), corner(run, 0, sp, 0)]);
  set[MON.camelBL] = mon(anim('rear0', 'rear1'), { power: 200, thru: 0, end: -1, newmon: MON.camelBR }, [corner(0, 0, sp), corner(-run, 0, sp, 4)]);
  set[MON.spitL] = mon(anim('spit0', 'spit1', 2), { power: 50, thru: 0, end: -1, newmon: MON.splat }, [corner(0, 0, 5, 4), corner(-6, 0, 5, 4)]);
  set[MON.spitR] = mon(anim('spit0', 'spit1', 2), { power: 50, thru: 0, end: -1, newmon: MON.splat }, [corner(0, 0, 5), corner(6, 0, 5)]);
  set[MON.splat] = mon([[n('splat'), 4]], { power: 100, thru: 0, end: 5 });
  set[MON.walker] = mon(anim('walkA0', 'walkA1', 4), { power: 150, thru: 1, towards: 64 });
  set[MON.walker2] = mon(anim('walkB0', 'walkB1', 4), { power: 150, thru: 1, towards: 64 });
  set[MON.wiseman] = mon(anim('wise0', 'wise1', 4), { power: 150, thru: 1 }, [corner(0, 0, 1), corner(5, 0, 1, 0), corner(0, 0, 1, 4)]);
  set[MON.donkey] = mon(anim('donkey0', 'donkey1', 12), { power: 200, thru: 1 });
  set[MON.ox] = mon(anim('ox0', 'ox1', 16), { power: 200, thru: 1 });
  set[MON.rooster] = mon(anim('rooster0', 'rooster1', 3), { power: 100, thru: 1, towards: 64 });
  set[MON.lineGoat] = mon([[n('lineGoat'), 20]], { power: 200, thru: 1 });
  set[MON.lineLamb] = mon([[n('lineLamb'), 20]], { power: 200, thru: 1 });
  return set;
}

export { MON, WOOL };
