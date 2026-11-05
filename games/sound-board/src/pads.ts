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

/** A pad, 20 x 20: a stone base and a round button; pressed, the button sits low and flat. */
function padPicture(pal: Pal, ramp: PadKind['ramp'], pressed: boolean): Pixels {
  const p = new Pixels(20, 20, skyOf(pal));
  const ink = pal.c('ink', 0);
  const s = pal.r('stone');
  const m = pal.r(ramp);
  const hi = m[m.length - 1];
  p.rect(1, 14, 18, 6, ink).rect(2, 15, 16, 4, s[2]).rect(2, 15, 16, 1, s[4]).rect(2, 18, 16, 1, s[1]);
  if (pressed) {
    p.rect(4, 12, 12, 3, ink).rect(5, 13, 10, 2, m[1]);
  } else {
    p.rect(3, 6, 14, 9, ink).rect(4, 7, 12, 8, m[3]).rect(4, 7, 12, 2, hi).rect(4, 13, 12, 2, m[2]).rect(5, 6, 10, 1, hi);
    p.rect(5, 9, 2, 2, hi);
  }
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
  for (const k of Object.values(PADS)) {
    book.add(`padOn.${k.name}`, padPicture(pal, k.ramp, true), air);
    book.add(`pad.${k.name}`, padPicture(pal, k.ramp, false), { ...air, ...k.rule, touch: `padOn.${k.name}` });
  }
  for (const [slot, ramp] of WAVES) book.add(`wave.${slot}`, wavePicture(pal, slot, ramp), air);
  book.add('spikeOn', flat(pal), air);
  book.add('spike', spikes(pal), { ...air, hp: SPIKE_HURT, touch: 'spikeOn' });
  book.add('wrongOn', wrongGate(pal), { solid: SOLID });
  book.add('wrong', wrongGate(pal), { solid: SOLID, score: -WRONG_COST, touch: 'wrongOn' });
}
