// The nods: small, friendly moments in a graduation's outside arrival, each a gentle echo of one Starter's lesson
// (a ladder to climb, a key before a gate, wind that lifts). Nothing hurts, kills or traps: every nod is on the path,
// or a pickup beside it, and every climb has a way back. A nod has its own blocks (added to the arrival's book the
// first time it is placed), a place() that stamps it on the map, and a sign that names its course.
// graduationArrive.ts lays them out; graduationNodRoutes.ts is how the bot plays each one.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { SOLID, PULL, type Book, type Rules } from './book';
import { archPicture, gatePicture, SILVER_KEYS } from './locks';
import { KEYS } from './blocks';
import type { StarterMap } from './map';
import { skyOf, type Pal } from './palette';
import { skyBlock, smallText, bigDigit } from './graduationArriveArt';
import type { Timed } from './graduationHall';
import { addSign } from './sign';

/** The counter the lever adds to (a free one; the hero's counter starts at 1). */
export const POWER = KEYS + 2;
const LIVES = 1;
const air = { grav: PULL.down };
/** One countdown digit lasts this many ticks (the engine's clock runs about 18 a second). */
export const COUNT_TICKS = 36;
/** The number it starts at: 9 digits of 2 s is about 18 s, longer than the walk from the plaza's start to the door. */
export const COUNT_FROM = 9;

export interface NodCtx {
  book: Book;
  pal: Pal;
  timed: Timed[];
  /** The block names (top first) of the stage's first guest from the Cast. */
  guest: string[];
}

export interface Nod {
  id: string;
  /** The Starter (games/<id>) whose lesson it echoes. */
  course: string;
  /** Words under COURSE nnn on its sign, and the line the manual uses. */
  say: string;
  note: string;
  /** The "How do I...?" question the nod answers, and the manual's account of how it is made (HTML). */
  how: string;
  made: string;
  /** Columns it takes, its sign included. */
  width: number;
  blocks(c: NodCtx): void;
  /** Stamps it with its sign's left edge at column x (the feature starts at x + 5); ground is row 10, things stand on row 9. */
  place(m: StarterMap, x: number, c: NodCtx): void;
}

/** Adds block `name` unless a nod before this one did. */
function add(c: NodCtx, name: string, pic: Pixels, rules: Rules = air): void {
  if (!c.book.has(name)) c.book.add(name, pic, rules);
}
const ink = (c: NodCtx) => c.pal.c('ink', 0);
const sky = (c: NodCtx) => skyBlock(c.pal);
/** A picture with a dark outline on the sky. */
const lined = (c: NodCtx, p: Pixels): Pixels => outline(p, ink(c), { transparent: skyOf(c.pal) });
/** Timed blocks in a ring: each turns into the next after `ticks`. */
const ring = (c: NodCtx, names: string[], ticks: number): void =>
  names.forEach((n, i) => c.timed.push({ name: n, next: names[(i + 1) % names.length], ticks }));
const locks = (c: NodCtx): void => {
  if (c.book.has('gate')) return;
  add(c, 'gateTop', archPicture(c.pal, 'gold'), air);
  add(c, 'gate', gatePicture(c.pal, 'wood', 'gold'), { solid: SOLID, effect: KEYS, eamt: -1, touch: 'sky' });
};
/** A brick wall one block wide down from the sky to a gate's arch, with the gate in the row above the path. */
const gateWall = (m: StarterMap, x: number, gate: string): void => {
  for (let y = 0; y < 8; y++) m.set(x, y, 'brick');
  m.set(x, 8, 'gateTop').set(x, 9, gate);
};

export const NODS: Record<string, Nod> = {
  ladder: {
    id: 'ladder',
    course: 'first-steps',
    say: 'CLIMB THE LADDER',
    note: 'A tower with a ladder up one side and down the other, and coins on top.',
    how: 'How do I make a ladder to climb?',
    made: '<b>ladder</b> blocks stacked in a column. The ladder has no gravity, so the hero holds on and climbs with Up and Down. Here a ladder stands on each side of a brick tower, so what you climb you can climb back down.',
    width: 11,
    blocks: () => undefined,
    place(m, x) {
      const f = x + 5;
      for (let y = 5; y < 10; y++) m.set(f, y, 'ladder').set(f + 4, y, 'ladder');
      for (let y = 6; y < 10; y++) for (let k = 1; k < 4; k++) m.set(f + k, y, 'brick');
      for (let k = 1; k < 4; k++) m.set(f + k, 4, 'coin');
    },
  },
  keyGate: {
    id: 'keyGate',
    course: 'keys-and-doors',
    say: 'KEY, THEN DOOR',
    note: 'A key lies on the path just before a gate in a wall; the gate takes the key.',
    how: 'How do I make a gate that needs the key lying just before it?',
    made: 'The <b>key</b> block adds one to counter 20 when you touch it. The <b>gate</b> is solid, but its rule takes one from that counter when touched, so with a key it becomes sky. The brick wall above it goes up out of reach, and the arch is plain scenery.',
    width: 11,
    blocks: locks,
    place(m, x) {
      const f = x + 5;
      m.set(f, 9, 'key').set(f + 2, 9, 'flower');
      gateWall(m, f + 4, 'gate');
    },
  },
  coins: {
    id: 'coins',
    course: 'coins-and-score',
    say: 'COINS ADD UP',
    note: 'A little arc of coins to walk and hop through; each is worth ten points.',
    how: 'How do I make coins that add to the score?',
    made: 'Each <b>coin</b> has Score points 10 and becomes <b>sky</b> when touched, so it is gone after you take it. The high one needs a hop.',
    width: 11,
    blocks: () => undefined,
    place(m, x) {
      const f = x + 5;
      [
        [0, 9],
        [1, 8],
        [2, 7],
        [3, 8],
        [4, 9],
      ].forEach(([dx, y]) => m.set(f + dx, y, 'coin'));
    },
  },
  crates: {
    id: 'crates',
    course: 'breakable-walls',
    say: 'CRATES BREAK',
    note: 'A stack of crates in the way: bump one and it turns to rubble.',
    how: 'How do I make a wall that breaks?',
    made: 'A <b>crate</b> is solid, and its Becomes block is <b>rubble</b>, which is not solid. Bumping a crate breaks only that crate.',
    width: 11,
    blocks(c) {
      const w = c.pal.r('wood');
      const crate = new Pixels(20, 20, w[2]);
      crate.frame(0, 0, 20, 20, w[0]).frame(1, 1, 18, 18, w[4]).line(2, 2, 17, 17, w[1]).line(17, 2, 2, 17, w[1]).rect(8, 8, 4, 4, w[3]);
      add(c, 'crate', crate, { solid: SOLID, touch: 'rubble' });
      const rub = sky(c);
      for (const [x, y, k] of [
        [2, 16, 2],
        [7, 17, 1],
        [11, 15, 3],
        [15, 17, 2],
        [5, 18, 3],
        [13, 18, 1],
      ] as const)
        rub.rect(x, y, 3, 2, w[k]).set(x, y, w[4]);
      add(c, 'rubble', rub);
    },
    place(m, x) {
      const f = x + 5;
      for (let k = 1; k < 3; k++) for (let y = 7; y < 10; y++) m.set(f + k, y, 'crate');
      m.set(f + 4, 9, 'coin');
    },
  },
  heart: {
    id: 'heart',
    course: 'health-and-hearts',
    say: 'A HEART FOR YOU',
    note: 'A heart floats just over the path; hop up and it adds a life.',
    how: 'How do I give the hero an extra life?',
    made: 'The <b>heart</b> block adds one to the Lives counter (counter 1) and becomes sky when touched.',
    width: 11,
    blocks(c) {
      const h = sky(c);
      const r = c.pal.r('red');
      h.disc(6.5, 7, 4.6, r[3]).disc(13.5, 7, 4.6, r[3]).rect(2, 8, 16, 2, r[3]);
      for (let y = 10; y < 18; y++) h.rect(2 + (y - 10), y, 16 - (y - 10) * 2, 1, r[3]);
      h.rect(4, 4, 3, 2, c.pal.c('white', 3)).set(4, 6, c.pal.c('white', 3));
      add(c, 'heart', lined(c, h), { ...air, effect: LIVES, eamt: 1, touch: 'sky' });
    },
    place(m, x) {
      const f = x + 5;
      m.set(f + 1, 7, 'heart').set(f + 3, 9, 'flower');
    },
  },
  ice: {
    id: 'ice',
    course: 'slippery-and-bouncy',
    say: 'ICE IS SLIPPERY',
    note: 'A patch of ice: step on and you slide a little further than you meant.',
    how: 'How do I make ice that slides?',
    made: 'The <b>ice</b> is a solid floor. The air above it, <b>slickAir</b>, pulls down and to the right, so anyone standing in it is carried along and slides on after letting go. It is only three blocks wide, so a jump takes you back across.',
    width: 11,
    blocks(c) {
      const w = c.pal.r('white');
      const b = c.pal.r('blue');
      const i = new Pixels(20, 20, b[4]);
      i.rect(0, 0, 20, 5, w[3]).rect(0, 4, 20, 1, w[1]).line(3, 8, 9, 14, w[3]).line(13, 9, 17, 16, w[3]).rect(0, 19, 20, 1, b[2]);
      add(c, 'ice', i, { solid: SOLID });
      const s = sky(c);
      for (const [x, y] of [
        [2, 15],
        [10, 17],
        [15, 12],
      ] as const)
        s.rect(x, y, 4, 1, w[2]);
      add(c, 'slickAir', s, { grav: PULL.down | PULL.right });
    },
    place(m, x) {
      const f = x + 5;
      for (let k = 1; k < 4; k++) {
        m.set(f + k, 10, 'ice')
          .set(f + k, 9, 'slickAir')
          .set(f + k, 8, 'slickAir');
      }
    },
  },
  wind: {
    id: 'wind',
    course: 'gusts',
    say: 'WIND LIFTS YOU',
    note: 'A fan on the path blows a shaft of air up to a shelf with coins on it.',
    how: 'How do I make wind that lifts the hero?',
    made: '<b>windAir</b> blocks pull up. Stack them in a column over the <b>fan</b> and under a <b>plank</b> shelf (solid from the top only) and the hero rises through the shelf and stands on it.',
    width: 11,
    blocks(c) {
      const s = c.pal.r('stone');
      const fan = new Pixels(20, 20, s[2]);
      fan.rect(0, 0, 20, 3, s[4]).frame(0, 0, 20, 20, s[0]).rect(3, 7, 14, 3, s[1]).rect(2, 5, 4, 7, s[3]).rect(14, 5, 4, 7, s[3]);
      add(c, 'fan', fan, { solid: SOLID });
      const w = sky(c);
      const col = c.pal.c('white', 2);
      for (const [x, y] of [
        [5, 2],
        [13, 9],
        [7, 14],
      ] as const)
        w.rect(x, y, 1, 5, col)
          .set(x - 1, y + 1, col)
          .set(x + 1, y + 1, col);
      add(c, 'windAir', w, { grav: PULL.up });
    },
    place(m, x) {
      const f = x + 5;
      m.set(f + 1, 10, 'fan');
      for (let y = 5; y < 10; y++) m.set(f + 1, y, 'windAir');
      for (let k = 1; k < 5; k++) m.set(f + k, 4, 'plank');
      for (let k = 2; k < 5; k++) m.set(f + k, 3, 'coin');
    },
  },
  hop: {
    id: 'hop',
    course: 'home-keys',
    say: 'SPACE HOPS',
    note: 'Two low brick walls across the path: a tap of Space hops each.',
    how: 'How do I make a low wall to hop over?',
    made: 'Two single <b>brick</b> blocks on the path. A tap of Space lifts the hero over a block one high.',
    width: 10,
    blocks: () => undefined,
    place(m, x) {
      const f = x + 5;
      m.set(f + 1, 9, 'brick').set(f + 4, 9, 'brick');
      m.set(f + 2, 9, 'flower');
    },
  },
  bug: {
    id: 'bug',
    course: 'boss-hits',
    say: 'BIG BUG NAPS',
    note: 'A big friendly bug asleep by the path (it takes five hits to wake a boss; this one is just napping).',
    how: 'How do I draw something bigger than one block?',
    made: 'The bug is four blocks (<b>bugTL</b>, <b>bugTR</b>, <b>bugBL</b>, <b>bugBR</b>), each a quarter of one 40 by 40 drawing, laid side by side. None of them is solid, so you walk in front of it.',
    width: 10,
    blocks(c) {
      const g = c.pal.r('green');
      const big = new Pixels(40, 40, skyOf(c.pal));
      big.disc(20, 26, 15, g[3]).disc(17, 21, 8, g[4]).rect(5, 36, 30, 3, g[1]);
      big
        .disc(12, 14, 5, g[2])
        .disc(28, 14, 5, g[2])
        .line(12, 10, 8, 3, ink(c))
        .line(28, 10, 32, 3, ink(c))
        .disc(8, 3, 1.5, c.pal.c('gold', 4))
        .disc(32, 3, 1.5, c.pal.c('gold', 4));
      for (const x of [14, 26]) big.rect(x - 3, 26, 7, 2, ink(c)).rect(x - 2, 28, 5, 1, ink(c));
      big.disc(10, 31, 3, c.pal.c('pink', 2)).disc(30, 31, 3, c.pal.c('pink', 2));
      big.rect(16, 33, 8, 1, ink(c));
      const body = lined(c, big);
      add(c, 'bugTL', body.crop(0, 0, 20, 20));
      add(c, 'bugTR', body.crop(20, 0, 20, 20));
      add(c, 'bugBL', body.crop(0, 20, 20, 20));
      add(c, 'bugBR', body.crop(20, 20, 20, 20));
      add(c, 'zzz', smallText(20, 'Z', skyOf(c.pal), ink(c)));
    },
    place(m, x) {
      const f = x + 5;
      m.set(f + 1, 8, 'bugTL')
        .set(f + 2, 8, 'bugTR')
        .set(f + 1, 9, 'bugBL')
        .set(f + 2, 9, 'bugBR')
        .set(f + 3, 7, 'zzz');
    },
  },
  flock: {
    id: 'flock',
    course: 'flock',
    say: 'FLOCK IN A V',
    note: 'Three birds high overhead flap in a V; they are blocks that turn into each other.',
    how: 'How do I make birds that flap?',
    made: '<b>birdA0</b> turns into <b>birdA1</b> after 6 ticks and back again; <b>birdB0</b> and <b>birdB1</b> do the same every 8, so the birds do not flap in step.',
    width: 11,
    blocks(c) {
      for (const [n, up] of [
        ['birdA0', true],
        ['birdA1', false],
        ['birdB0', false],
        ['birdB1', true],
      ] as const) {
        const p = sky(c);
        const wing = up
          ? [
              [3, 4, 9, 9],
              [17, 4, 11, 9],
            ]
          : [
              [3, 11, 9, 9],
              [17, 11, 11, 9],
            ];
        for (const [x0, y0, x1, y1] of wing) p.line(x0, y0, x1, y1, ink(c)).line(x0, y0 + 1, x1, y1 + 1, ink(c));
        p.rect(9, 9, 3, 2, ink(c));
        add(c, n, p);
      }
      ring(c, ['birdA0', 'birdA1'], 6);
      ring(c, ['birdB0', 'birdB1'], 8);
    },
    place(m, x) {
      m.set(x + 7, 1, 'birdA0')
        .set(x + 5, 2, 'birdB0')
        .set(x + 9, 2, 'birdB1');
    },
  },
  say: {
    id: 'say',
    course: 'say-something',
    say: 'A FRIEND SAYS HI',
    note: 'A guest from the Cast stands by the path with a speech bubble.',
    how: 'How do I put a speech bubble over a friend?',
    made: "The guest is the Cast's own picture cut into blocks standing on the path. The bubble is a 3-block <b>sign</b> hung over the friend's head, with no posts.",
    width: 10,
    blocks(c) {
      if (!c.book.has('sign.bubble.00')) addSign(c.book, c.pal, 'bubble', 'HELLO!', 3, 1);
    },
    place(m, x, c) {
      const f = x + 5;
      const top = 10 - c.guest.length;
      c.guest.forEach((n, k) => m.set(f + 2, top + k, n));
      for (let k = 0; k < 3; k++) m.set(f + 1 + k, top - 1, `sign.bubble.${k}0`);
    },
  },
  pads: {
    id: 'pads',
    course: 'sound-board',
    say: 'STEP ON THE PADS',
    note: 'Three pads on the path light up and chime when you step on them.',
    how: 'How do I make a pad that lights up when stepped on?',
    made: 'Each <b>pad</b> has Score points 5 and Becomes block <b>pad0On</b> (and so on), the same pad lit. The score makes the chime.',
    width: 11,
    blocks(c) {
      ['red', 'gold', 'blue'].forEach((hue, i) => {
        const r = c.pal.r(hue);
        for (const lit of [false, true]) {
          const p = sky(c);
          p.rect(2, 14, 16, 6, r[lit ? 4 : 2])
            .rect(2, 14, 16, 1, r[lit ? 5 - (hue === 'blue' ? 1 : 0) : 3])
            .rect(2, 19, 16, 1, r[1]);
          if (lit)
            for (const [x, y] of [
              [4, 11],
              [10, 9],
              [15, 12],
            ] as const)
              p.rect(x, y, 2, 2, c.pal.c('white', 3));
          add(c, `pad${i}${lit ? 'On' : ''}`, lit ? lined(c, p) : p, lit ? air : { ...air, score: 5, touch: `pad${i}On` });
        }
      });
    },
    place(m, x) {
      const f = x + 5;
      [0, 2, 4].forEach((dx, i) => m.set(f + dx, 9, `pad${i}`));
    },
  },
  countdown: {
    id: 'countdown',
    course: 'countdown',
    say: 'WAIT FOR ZERO',
    note: 'A big number counts down from 9 on a wall; the door under it opens at 0.',
    how: 'How do I make a number that counts down and opens a gate?',
    made: '<b>cd9</b> turns into <b>cd8</b> after 36 ticks, and so on down to <b>cd0</b>. The <b>timedGate</b> turns into sky after 324 ticks, the same nine two-second counts, so the gate opens as the number reaches 0.',
    width: 10,
    blocks(c) {
      locks(c);
      const bg = c.pal.c('stone', 1);
      for (let n = COUNT_FROM; n >= 0; n--) add(c, `cd${n}`, bigDigit(String(n), bg, c.pal.c('gold', 5)), air);
      for (let n = COUNT_FROM; n > 0; n--) c.timed.push({ name: `cd${n}`, next: `cd${n - 1}`, ticks: COUNT_TICKS });
      const g = gatePicture(c.pal, 'blue', 'white', true);
      add(c, 'timedGate', g, { solid: SOLID });
      c.timed.push({ name: 'timedGate', next: 'sky', ticks: COUNT_TICKS * COUNT_FROM });
    },
    place(m, x) {
      const f = x + 5;
      gateWall(m, f + 4, 'timedGate');
      m.set(f + 4, 6, `cd${COUNT_FROM}`);
    },
  },
  lever: {
    id: 'lever',
    course: 'switches',
    say: 'FLIP THE LEVER',
    note: 'A lever on the path opens the gate in the wall beyond it.',
    how: 'How do I make a lever that opens a gate?',
    made: 'The <b>lever</b> adds one to counter 22 and becomes <b>leverOn</b> (its handle flipped over). The <b>powerGate</b> takes one from counter 22 when touched, so after the lever it becomes sky.',
    width: 10,
    blocks(c) {
      locks(c);
      const w = c.pal.r('wood');
      const s = c.pal.r('stone');
      for (const on of [false, true]) {
        const p = sky(c);
        p.rect(3, 15, 14, 5, s[3]).rect(3, 15, 14, 1, s[4]).rect(8, 12, 4, 4, s[1]);
        p.line(10, 13, on ? 16 : 4, 4, w[1])
          .line(11, 13, on ? 17 : 5, 4, w[3])
          .disc(on ? 17 : 4, 4, 2.2, c.pal.c('red', 3));
        add(c, on ? 'leverOn' : 'lever', lined(c, p), on ? air : { ...air, effect: POWER, eamt: 1, touch: 'leverOn' });
      }
      const g = gatePicture(c.pal, 'blue', 'gold', true);
      add(c, 'powerGate', g, { solid: SOLID, effect: POWER, eamt: -1, touch: 'sky' });
    },
    place(m, x) {
      const f = x + 5;
      m.set(f, 9, 'lever');
      gateWall(m, f + 4, 'powerGate');
    },
  },
  tokens: {
    id: 'tokens',
    course: 'three-tokens',
    say: 'THREE TOKENS',
    note: 'Three tokens lie on the path; the gate beyond wants all three.',
    how: 'How do I make a gate that wants three tokens?',
    made: 'Each <b>token</b> adds one to counter 21. The <b>tokenGate</b> takes three from it, so it opens only once all three are in your pocket.',
    width: 11,
    blocks(c) {
      locks(c);
      const b = c.pal.r('blue');
      const t = sky(c);
      t.disc(9.5, 9.5, 7, b[1])
        .disc(9.5, 9.5, 5.8, b[3])
        .disc(9.5, 9.5, 4.2, b[2])
        .ring(9.5, 9.5, 4, c.pal.c('white', 3))
        .disc(9.5, 9.5, 1.6, c.pal.c('white', 3));
      add(c, 'token', lined(c, t), { ...air, score: 10, effect: SILVER_KEYS, eamt: 1, touch: 'sky' });
      add(c, 'tokenGate', gatePicture(c.pal, 'blue', 'white', true), { solid: SOLID, effect: SILVER_KEYS, eamt: -3, touch: 'sky' });
    },
    place(m, x) {
      const f = x + 5;
      [0, 1, 2].forEach((dx) => m.set(f + dx, 9, 'token'));
      gateWall(m, f + 4, 'tokenGate');
    },
  },
  fakeWall: {
    id: 'fakeWall',
    course: 'secret-doors',
    say: 'A SECRET WALL',
    note: 'A wall drawn like brick that you can simply walk through.',
    how: 'How do I make a wall you can walk through?',
    made: "<b>fakeBrick</b> is a copy of the <b>brick</b> picture with nothing solid about it. Only the Blocks tab's rules tell the two apart.",
    width: 10,
    blocks(c) {
      add(c, 'fakeBrick', c.book.pics.get('brick')!.crop(0, 0, 20, 20), air);
    },
    place(m, x) {
      const f = x + 5;
      for (let k = 1; k < 3; k++) for (let y = 5; y < 10; y++) m.set(f + k, y, 'fakeBrick');
    },
  },
  shore: {
    id: 'shore',
    course: 'shore',
    say: 'WATER THAT MOVES',
    note: 'A footbridge over water whose waves are blocks that turn into each other.',
    how: 'How do I make water that moves?',
    made: '<b>water0</b>, <b>water1</b> and <b>water2</b> turn into each other every 6 ticks, and the map starts neighbors on different ones so the waves ripple. The footbridge is a <b>plank</b> row over them.',
    width: 11,
    blocks(c) {
      const b = c.pal.r('blue');
      const names = [0, 1, 2].map((f) => {
        const p = new Pixels(20, 20, b[2]);
        for (let y = 0; y < 20; y += 5)
          for (let x = 0; x < 20; x++) if (Math.sin(((x + f * 7) / 20) * Math.PI * 2) > 0.2) p.set(x, y + 1, b[4]).set(x, y + 2, b[3]);
        add(c, `water${f}`, p, air);
        return `water${f}`;
      });
      ring(c, names, 6);
    },
    place(m, x) {
      for (let k = 4; k < 11; k++) {
        m.set(x + k, 10, 'plank');
        for (let y = 11; y < 13; y++) m.set(x + k, y, `water${(k + y) % 3}`);
      }
    },
  },
  stars: {
    id: 'stars',
    course: 'twinkle',
    say: 'STARS TWINKLE',
    note: 'Sparkles in the sky that blink, each on its own time.',
    how: 'How do I make stars that twinkle?',
    made: '<b>spark0</b>, <b>spark1</b> and <b>spark2</b> are a small, a big and a medium sparkle that turn into each other every 7 ticks, started on different ones.',
    width: 11,
    blocks(c) {
      const names = [0, 1, 2].map((f) => {
        const p = sky(c);
        const g = c.pal.c('gold', 5);
        const r = [1, 5, 3][f];
        p.rect(10 - r, 10, r * 2 + 1, 1, g)
          .rect(10, 10 - r, 1, r * 2 + 1, g)
          .set(10, 10, c.pal.c('white', 3));
        for (const [dx, dy] of [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ] as const)
          p.set(10 + dx * 2, 10 + dy * 2, g).set(10 + dx, 10 + dy, c.pal.c('white', 3));
        add(c, `spark${f}`, p, air);
        return `spark${f}`;
      });
      ring(c, names, 7);
    },
    place(m, x) {
      [
        [4, 1],
        [6, 3],
        [8, 1],
        [10, 3],
        [5, 4],
        [9, 4],
      ].forEach(([dx, y], i) => m.set(x + dx, y, `spark${i % 3}`));
    },
  },
  popups: {
    id: 'popups',
    course: 'popups',
    say: 'POINTS POP UP',
    note: 'Big coins pay a hundred and a floating 100 rises where they were.',
    how: 'How do I make a score that pops up?',
    made: 'A <b>bigCoin</b> has Score points 100 and becomes <b>pop0</b>, a picture of 100; that turns into <b>pop1</b>, then <b>pop2</b> a few ticks apart, each drawn a little higher, and then into sky.',
    width: 10,
    blocks(c) {
      const coin = sky(c);
      coin
        .disc(9.5, 9.5, 8, c.pal.c('gold', 0))
        .disc(9.5, 9.5, 7, c.pal.c('gold', 3))
        .disc(9.5, 9.5, 5, c.pal.c('gold', 4))
        .rect(8, 6, 3, 8, c.pal.c('gold', 2))
        .rect(7, 7, 2, 1, c.pal.c('gold', 2));
      coin.rect(5, 5, 2, 3, c.pal.c('gold', 5));
      add(c, 'bigCoin', coin, { ...air, score: 100, touch: 'pop0' });
      for (let k = 0; k < 3; k++) {
        const p = sky(c);
        const t = smallText(20, '100', skyOf(c.pal), c.pal.c('gold', 5), ink(c));
        add(c, `pop${k}`, p.blit(t, 0, 3 - k * 3, skyOf(c.pal)), air);
      }
      c.timed.push({ name: 'pop0', next: 'pop1', ticks: 3 }, { name: 'pop1', next: 'pop2', ticks: 3 }, { name: 'pop2', next: 'sky', ticks: 5 });
    },
    place(m, x) {
      const f = x + 5;
      [0, 2, 4].forEach((dx) => m.set(f + dx, 8, 'bigCoin'));
    },
  },
};
