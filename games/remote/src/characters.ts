// REMOTE.CHR (you: walk eight ways, shout "WHERE'S THE REMOTE?!", click an empty thumb at the
// TV, check your hand; your patience, lives, pennies and the counters) and the .MON file each
// level loads.
//
// Monster rules used here: when two monsters touch, the one with more power kills the other, so
// the shout (power 120) blows away a dust bunny, a cockroach or lint (110) but not the cat
// (150). A monster under power 100 dies when it touches you (after its block's effect lands: a
// penny's money, the mustard seed's points), so the raccoon says hi and scurries off; 100 and up
// stays and its block's effect lands every touch (the cat's swipe, a lost sock's bump).
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '../../../web/src/formats/character';
import { CHARBL } from '../../../web/src/formats/blocks';
import { emptyMonster, newMonsterSet, type March, type Monster } from '../../../web/src/formats/monster';
import { DIGITS, KEY, MON, MONEY, PLAY, SEQ, SND, SPOTS } from './ids';
import type { buildCharBlocks, buildMonsterBlocks } from './sprites/sprites';

const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8, any: 9 };
const MIRROR = 0x40; // the block flipped left-right
/** The frame picture that fires a monster (its number in pic1). */
const MONBL = 100;

/** Pixels a step. */
export const STEP = 4;
/** Pixels a step on a diagonal. */
export const DIAG = 3;

type F = Partial<Frame> & { pic: number };
function frames(list: F[]): Frame[] {
  const out = Array.from({ length: 10 }, () => emptyFrame(true));
  list.forEach(
    (f, i) =>
      (out[i] = { ...emptyFrame(), x: f.x ?? 0, y: f.y ?? 0, orient: f.orient ?? 0, pic1: f.pic1 ?? CHARBL, pic2: f.pic2 ?? f.pic, pause: f.pause ?? 1 }),
  );
  return out;
}

export function buildHero(cb: ReturnType<typeof buildCharBlocks>): Character {
  const ch = newCharacter();
  const n = cb.n;
  const s = ch.sequences;
  const set = (i: number, list: F[], o: Partial<(typeof s)[0]> = {}) => {
    s[i].frames = frames(list);
    Object.assign(s[i], { sound: 255, jstkBut: 0, jstkMov: 0, ...o });
  };
  // Idle: standing, blinking, looking at the TV, looking at an empty hand.
  set(SEQ.idle, [
    { pic: n('down0'), pause: 40 },
    { pic: n('blink'), pause: 3 },
    { pic: n('down0'), pause: 30 },
    { pic: n('up0'), pause: 20 },
    { pic: n('down0'), pause: 24 },
    { pic: n('blink'), pause: 3 },
  ]);
  // Flopping back into nothing (a life lost).
  set(
    SEQ.die,
    [
      { pic: n('ouch'), pause: 4 },
      { pic: n('flop0'), pause: 6 },
      { pic: n('flop1'), pause: 6 },
      { pic: n('flop2'), pause: 6 },
      { pic: n('flop3'), pause: 30 },
    ],
    { sound: SND.die },
  );
  set(
    SEQ.hurt,
    [
      { pic: n('hurt'), pause: 1 },
      { pic: n('ouch'), pause: 2 },
      { pic: n('hurt'), pause: 1 },
      { pic: n('down0'), pause: 1 },
    ],
    { sound: SND.hurt },
  );
  set(3, [{ pic: n('down0') }], { key: 0 });
  set(4, [{ pic: n('down0') }], { key: 0 });
  const walk = (i: number, key: number, joy: number, dx: number, dy: number, view: 'up' | 'down' | 'side', mirror = false) =>
    set(
      i,
      [1, 0, 2, 0].map((k) => ({ pic: n(`${view}${k}`), x: dx, y: dy, orient: mirror ? MIRROR : 0 })),
      { key, jstkMov: joy },
    );
  walk(SEQ.up, KEY.up, JOY.up, 0, -STEP, 'up');
  walk(SEQ.down, KEY.down, JOY.down, 0, STEP, 'down');
  walk(SEQ.left, KEY.left, JOY.left, -STEP, 0, 'side', true);
  walk(SEQ.right, KEY.right, JOY.right, STEP, 0, 'side');
  walk(SEQ.w, KEY.w, 0, 0, -STEP, 'up');
  walk(SEQ.a, KEY.a, 0, -STEP, 0, 'side', true);
  walk(SEQ.s, KEY.s, 0, 0, STEP, 'down');
  walk(SEQ.d, KEY.d, 0, STEP, 0, 'side');
  walk(SEQ.upLeft, KEY.q, JOY.upLeft, -DIAG, -DIAG, 'side', true);
  walk(SEQ.upRight, KEY.e, JOY.upRight, DIAG, -DIAG, 'side');
  walk(SEQ.downLeft, KEY.pad1, JOY.downLeft, -DIAG, DIAG, 'side', true);
  walk(SEQ.downRight, KEY.pad3, JOY.downRight, DIAG, DIAG, 'side');
  // SPACE: "WHERE'S THE REMOTE?!" The shout flies off the way you last walked.
  set(
    SEQ.shout,
    [
      { pic: n('shout0'), pause: 2 },
      { pic: 0, pic1: MON.shout, pic2: MONBL, y: 20, pause: 0 },
      { pic: n('shout1'), pause: 5 },
      { pic: n('shout0'), pause: 4 },
    ],
    { key: KEY.space, sound: SND.shout, norepeat: 1, ground: 1, jstkMov: JOY.any, jstkBut: 1 },
  );
  // B: click an imaginary remote at the TV. Nothing happens. Of course.
  set(
    SEQ.click,
    [
      { pic: n('click'), pause: 4 },
      { pic: n('side0'), pause: 2 },
      { pic: n('click'), pause: 4 },
      { pic: n('side0'), pause: 2 },
    ],
    { key: KEY.b, sound: SND.click, norepeat: 1, jstkBut: 2 },
  );
  // C: check your hand. Nope.
  set(
    SEQ.hand,
    [
      { pic: n('palm'), pause: 12 },
      { pic: n('blink'), pause: 3 },
      { pic: n('palm'), pause: 10 },
      { pic: n('down0'), pause: 2 },
    ],
    { key: KEY.c, sound: SND.hand, norepeat: 1, jstkBut: 4 },
  );

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // patience (hit points)
  ch.meter[1] = 3; // lives
  // counters show meter - 1: none yet
  ch.meter[MONEY] = 1;
  ch.meter[SPOTS] = 1;
  ch.meter[DIGITS] = 1;
  ch.meter[PLAY] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}

const corner = (x: number, y: number, speed: number, orient = 0): March => ({ x, y, pic: speed, orient });

function mon(pics: [number, number][], o: Partial<Monster>, path: March[] = []): Monster {
  const m = emptyMonster();
  m.used = 1;
  pics.forEach((p, i) => (m.pic[i] = p));
  Object.assign(m, o);
  path.forEach((c, i) => (m.march[0][i] = c));
  return m;
}

/** Back and forth `run` blocks (to the right first) at `speed`, facing the way it goes. */
const pace = (run: number, speed: number): March[] => [corner(0, 0, speed), corner(run, 0, speed, 0), corner(0, 0, speed, 4)];
/** Round a box `w` x `h` blocks (clockwise from its top-left), facing the way it goes. */
const loop = (w: number, h: number, speed: number): March[] => [
  corner(0, 0, speed),
  corner(w, 0, speed, 0),
  corner(w, h, speed, 0),
  corner(0, h, speed, 4),
  corner(0, 0, speed, 4),
];

/** Wander at random, `speed` pixels a tick (towards >= 64). */
const wander = (speed: number) => speed << 6;

export interface MonsterOptions {
  /** Blocks the cat paces before turning round. */
  cat?: number;
  /** How far toast flies out of the toaster (blocks down). */
  toast?: number;
  /** The ride: the furniture's loop (blocks wide, high). */
  ride?: [number, number];
}

export function buildMonsters(mb: ReturnType<typeof buildMonsterBlocks>, o: MonsterOptions = {}): Monster[] {
  const set = newMonsterSet();
  const n = mb.n;
  const anim = (a: string, b: string, t = 3): [number, number][] => [
    [n(a), t],
    [n(b), t],
  ];
  /** The same, with its stinging tick first (sprites.ts sting()): it hurts once a round. */
  const stings = (a: string, b: string, t = 3): [number, number][] => [[n(`${a}!`), 1], ...anim(a, b, t)];
  set[MON.shout] = mon(anim('shout0', 'shout1', 2), { power: 120, thru: 1, towards: 7, end: 14, newmon: MON.echo });
  set[MON.echo] = mon([[n('echo'), 3]], { power: 100, thru: 0, end: 4 });
  set[MON.bunny] = mon(stings('bunny0', 'bunny1', 5), { power: 110, thru: 1, towards: wander(1), newmon: MON.poof, upscore: 25 });
  set[MON.poof] = mon(anim('poof0', 'poof1', 3), { power: 100, thru: 0, end: 6 });
  set[MON.cat] = mon(stings('cat0', 'cat1', 6), { power: 150, thru: 1 }, pace(o.cat ?? 6, 1));
  // Teddy follows you round the kitchen, slowly, in case anything falls
  set[MON.teddy] = mon(anim('teddy0', 'teddy1', 5), { power: 200, thru: 1, towards: 1 });
  set[MON.toast] = mon(stings('toast0', 'toast1', 2), { power: 150, thru: 0, end: -1, newmon: MON.crumbs }, [corner(0, 0, 3), corner(0, o.toast ?? 4, 3, 1)]);
  set[MON.crumbs] = mon([[n('crumbs'), 10]], { power: 100, thru: 0, end: 30 });
  set[MON.roach] = mon(stings('roach0', 'roach1', 2), { power: 110, thru: 1, towards: wander(2), newmon: MON.poof, upscore: 20 });
  set[MON.sock] = mon(stings('sock0', 'sock1', 8), { power: 150, thru: 0 }, loop(3, 2, 1));
  set[MON.penny] = mon(
    [
      [n('penny0'), 6],
      [n('penny1'), 4],
    ],
    { power: 50, thru: 0 },
    [corner(0, 0, 1), corner(1, 0, 1), corner(0, 0, 1)],
  );
  set[MON.raccoon] = mon(anim('raccoon0', 'raccoon1', 4), { power: 50, thru: 1, towards: wander(1), newmon: MON.raccoonBye });
  set[MON.raccoonBye] = mon([[n('raccoonBye'), 4]], { power: 100, thru: 0, end: 40 }, [corner(0, 0, 3), corner(4, -3, 3, 0)]);
  set[MON.seed] = mon(anim('seed0', 'seed1', 4), { power: 50, thru: 1, newmon: MON.seedBye }, [corner(0, 0, 1), corner(0, 0, 1)]);
  set[MON.seedBye] = mon(anim('seedBye1', 'seedBye0', 2), { power: 100, thru: 0, end: 40 }, [corner(0, 0, 3), corner(-3, 2, 3, 4)]);
  set[MON.lint] = mon(stings('lint0', 'lint1', 4), { power: 110, thru: 1, towards: wander(1), newmon: MON.poof, upscore: 15 });
  set[MON.goat] = mon(anim('goat0', 'goat1', 12), { power: 200, thru: 1 }, pace(2, 1));
  const [rw, rh] = o.ride ?? [8, 2];
  set[MON.recliner] = mon(stings('recliner0', 'recliner1', 8), { power: 200, thru: 0 }, loop(rw, rh, 2));
  set[MON.ottoman] = mon(stings('ottoman0', 'ottoman1', 4), { power: 200, thru: 0 }, [
    corner(0, 0, 2),
    corner(-rw, 0, 2, 4),
    corner(-rw, -rh, 2, 4),
    corner(0, -rh, 2, 0),
    corner(0, 0, 2, 0),
  ]);
  set[MON.lampshade] = mon(stings('lampshade0', 'lampshade1', 3), { power: 200, thru: 0 }, pace(4, 2));
  set[MON.popcorn] = mon(stings('popcorn0', 'popcorn1', 2), { power: 150, thru: 1, towards: wander(2) });
  set[MON.rider] = mon(anim('raccoon0', 'raccoon1', 3), { power: 50, thru: 1, newmon: MON.raccoonBye }, loop(3, 1, 2));
  return set;
}

export { MON };
