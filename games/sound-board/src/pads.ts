// SOUND BOARD's own blocks, added to the Starter block set after the signs and the locks.
//
//   pad.<name>      a pad: touch it and it changes one counter, so Game-Maker plays that counter's
//                   sound (see sounds.ts). It turns into padOn.<name> (pressed, no effect), so a
//                   pad plays once per visit and a hero standing on it doesn't stutter.
//   wave.<slot>     a picture of a sound: its 36 steps drawn as a line, high notes high, a long
//                   sound long. It is drawn from the real notes in sounds.ts.
//   spike, spikeOn  a spike that hurts once (the hero's Hurt sequence plays sound 10)
//   wrong, wrongOn  a gate that never opens: touching it takes 10 points, which plays the score-down
//                   sound (6), once. You jump over it.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { PULL, SOLID, type Book } from '../../kit/starter/book';
import { gatePicture } from '../../kit/starter/locks';
import { skyOf, type Pal } from '../../kit/starter/palette';
import { SLOT, tuneOf } from './sounds';

/** The counter a blip pad adds to (counters 5 to 19 are the character's moves' repeat counters, so a spare one starts at 20: 20 is keys, 21 the silver keys). */
export const OTHER = 22;
/** Game-Maker's counter 3: money. */
export const MONEY = 3;

/** Hit points a spike takes, once. */
export const SPIKE_HURT = -10;
/** Points the wrong gate takes, once. */
export const WRONG_COST = 10;

export interface PadKind {
  /** The block's name suffix and the sign's word. */
  name: string;
  /** The sound slot the pad's counter plays. */
  slot: number;
  ramp: 'blue' | 'gold' | 'stone' | 'teal' | 'purple' | 'green';
  /** What the pad changes (a block's own rules). */
  rule: { hp?: number; effect?: number; eamt?: number; score?: number };
}

/** The six pads. Each changes a different counter, so each plays a different slot. */
export const PADS: Record<'chime' | 'coin' | 'quiet' | 'blip' | 'long' | 'short', PadKind> = {
  chime: { name: 'chime', slot: SLOT.chime, ramp: 'blue', rule: { hp: 10 } },
  coin: { name: 'coin', slot: SLOT.coin, ramp: 'gold', rule: { effect: MONEY, eamt: 1 } },
  quiet: { name: 'quiet', slot: SLOT.quiet, ramp: 'stone', rule: { effect: MONEY, eamt: -1 } },
  blip: { name: 'blip', slot: SLOT.blip, ramp: 'teal', rule: { effect: OTHER, eamt: 1 } },
  long: { name: 'long', slot: SLOT.fanfare, ramp: 'purple', rule: { effect: 1, eamt: 1 } },
  short: { name: 'short', slot: SLOT.ping, ramp: 'green', rule: { score: 10 } },
};

/** Each pad's face mark, 7 x 5 (`#` dark, `o` a shine): what its sound is like. */
const ICONS: Record<keyof typeof PADS, string[]> = {
  // a bell
  chime: ['..###..', '.#####.', '.#####.', '#######', '...#...'],
  // a coin with a shine
  coin: ['..###..', '.#oo.#.', '.#o..#.', '.#...#.', '..###..'],
  // a speaker with nothing coming out of it
  quiet: ['...#...', '.###...', '.###...', '.###...', '...#...'],
  // one note
  blip: ['....##.', '....#.#', '....#..', '..###..', '..##...'],
  // a long bar
  long: ['.......', '#######', '#######', '.......', '.......'],
  // a dot
  short: ['.......', '..###..', '..###..', '.......', '.......'],
};

/**
 * A pad, 20 x 20, standing on the floor: a dark rubber collar with a small light, and a square
 * colored cap standing up out of it with its mark on the front. Pressed, the cap sinks three pixels
 * into the collar and goes dim, and the light comes on.
 */
function padPicture(pal: Pal, kind: keyof typeof PADS, pressed: boolean): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.r('ink');
  const m = pal.r(PADS[kind].ramp);
  const hi = m[m.length - 1];
  const top = pressed ? 5 : 2;
  // the cap: a rounded square, lit from the top left
  p.rect(3, top, 14, 14 - top, ink[0]).rect(2, top + 1, 16, 13 - top, ink[0]);
  p.rect(3, top + 1, 14, 13 - top, pressed ? m[1] : m[3]);
  p.rect(4, top + 1, 12, 1, pressed ? m[2] : hi).rect(3, top + 2, 1, 11 - top, pressed ? m[2] : hi);
  p.rect(16, top + 2, 1, 11 - top, pressed ? m[0] : m[2]);
  const mark = pressed ? m[3] : ink[0];
  ICONS[kind].forEach((row, dy) => {
    for (let dx = 0; dx < row.length; dx++) {
      const y = (pressed ? 7 : 5) + dy;
      if (row[dx] === '#') p.set(7 + dx, y, mark);
      else if (row[dx] === 'o') p.set(7 + dx, y, pressed ? m[2] : hi);
    }
  });
  // the collar the cap stands in: its rim, its front and the light
  p.rect(1, 12, 18, 8, ink[0]).rect(2, 13, 16, 6, ink[1]).rect(2, 13, 16, 1, ink[2]);
  p.rect(2, 18, 16, 1, ink[0]);
  p.rect(8, 15, 4, 2, ink[0]).rect(9, 15, 2, 2, pressed ? hi : m[0]);
  if (pressed) p.set(9, 15, pal.c('white', 3));
  return p;
}

/** A sound drawn as a line: time goes right (two steps a pixel), pitch goes up. A silent sound is a dashed line. */
export function wavePicture(pal: Pal, slot: number, ramp: PadKind['ramp'] | 'red' | 'orange' | 'pink'): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const m = pal.r(ramp);
  p.rect(0, 0, 20, 20, ink).rect(1, 1, 18, 18, pal.c('ink', 1));
  p.rect(1, 9, 18, 1, pal.c('ink', 2));
  const tune = tuneOf(slot);
  let any = false;
  tune.forEach((hz, i) => {
    if (hz <= 0) return;
    any = true;
    const y = 16 - Math.round((Math.log(hz / 100) / Math.log(21)) * 13);
    const x = 1 + (i >> 1);
    p.set(x, y - 1, m[2])
      .set(x, y, m[m.length - 1])
      .set(x, y + 1, m[3]);
  });
  if (!any) for (let x = 3; x < 17; x += 4) p.rect(x, 9, 2, 2, m[2]);
  return p;
}

/** Spikes, 20 x 20 (the same three as the Sound Board spikes, drawn here so this game stands alone). */
function spikes(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const s = pal.r('stone');
  p.rect(0, 16, 20, 4, s[1]).rect(0, 16, 20, 1, s[3]);
  for (const x of [1, 7, 13]) {
    for (let y = 0; y < 16; y++) {
      const half = Math.ceil(((y + 1) / 16) * 3);
      p.rect(x + 3 - half, y, half * 2, 1, y < 4 ? s[4] : s[3]);
    }
    for (let y = 0; y < 16; y++) p.set(x + 3 + Math.ceil(((y + 1) / 16) * 3) - 1, y, s[2]);
  }
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** The same spikes, bent over flat. */
function flat(pal: Pal): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const s = pal.r('stone');
  p.rect(0, 16, 20, 4, s[1]).rect(0, 16, 20, 1, s[3]);
  for (const x of [1, 7, 13])
    p.rect(x, 13, 6, 3, s[3])
      .rect(x, 13, 6, 1, s[4])
      .rect(x + 4, 13, 2, 3, s[2]);
  return outline(p, pal.c('ink', 0), { transparent: skyOf(pal) });
}

/** The wrong gate: a blue gate with a big red X where the padlock would be. */
function wrongGate(pal: Pal): Pixels {
  const p = gatePicture(pal, 'blue', 'white');
  const red = pal.r('red');
  for (let i = 0; i < 9; i++) {
    for (const [x, y] of [
      [5 + i, 7 + i],
      [13 - i, 7 + i],
    ])
      p.set(x, y, red[3])
        .set(x + 1, y, red[3])
        .set(x, y - 1, red[4]);
  }
  return p;
}

/** The waves each level hangs above its signs (a ramp each). */
export const WAVES: [number, PadKind['ramp'] | 'red' | 'orange' | 'pink'][] = [
  [SLOT.chime, 'blue'],
  [SLOT.coin, 'gold'],
  [SLOT.quiet, 'stone'],
  [SLOT.blip, 'teal'],
  [SLOT.fanfare, 'purple'],
  [SLOT.ping, 'green'],
  [SLOT.creak, 'orange'],
  [SLOT.jump, 'blue'],
  [SLOT.hurt, 'red'],
  [SLOT.nope, 'pink'],
];

/** Adds the pads, waves, spikes and the wrong gate to `book` (call after the signs and locks). */
export function addBoardBlocks(book: Book, pal: Pal): void {
  const air = { grav: PULL.down };
  for (const kind of Object.keys(PADS) as (keyof typeof PADS)[]) {
    const k = PADS[kind];
    book.add(`padOn.${k.name}`, padPicture(pal, kind, true), air);
    book.add(`pad.${k.name}`, padPicture(pal, kind, false), { ...air, ...k.rule, touch: `padOn.${k.name}` });
  }
  for (const [slot, ramp] of WAVES) book.add(`wave.${slot}`, wavePicture(pal, slot, ramp), air);
  book.add('spikeOn', flat(pal), air);
  book.add('spike', spikes(pal), { ...air, hp: SPIKE_HURT, touch: 'spikeOn' });
  book.add('wrongOn', wrongGate(pal), { solid: SOLID });
  book.add('wrong', wrongGate(pal), { solid: SOLID, score: -WRONG_COST, touch: 'wrongOn' });
}
