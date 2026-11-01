// Teddy's character files and the .MON file each level loads.
//
// TEDDY.CHR, for the neighborhoods: gravity does the platforming. Air pulls down, so a hop is an
// upward push each tick Up is held; Q and E hop up and sideways (Game-Maker follows one key at a
// time, so nobody has to press two). Down sits, and Space boops (paws up, a nose to whatever is
// above him: Teddy's button-pressing trick).
// RINK.CHR, for the Roller Rink (seen from above): left alone he skates right on his own, a block
// a beat; a tap of Up or Down glides him one lane over (the whole glide, however short the tap),
// and Left holds him back or skates him back the way he came.
// RAIL.CHR, for the Player Piano: no hopping, only walking the rail under the keys and the boop,
// which lifts him half a block for exactly one tick so it touches the key above once.
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon, pace, set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { CTR, DOWN_START, KEY, MON, SEQ, SND } from './ids';
import type { buildCharBlocks, buildMonsterBlocks } from './sprites/sprites';

const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8, any: 9 };
/** The bottom block mirrored left-right (Teddy is one block, so he has no top). */
const MIRROR = 0x40;

/** Pixels a tick walking: walking stays fast. */
const STEP = 5;
/** Pixels a tick sideways in a hop. */
const HOP_STEP = 4;
/** Upward push a tick while Up is held (gravity takes one more away every tick). */
const HOP = 12;
/** The boop: how far up, for one tick. */
export const BOOP = 10;

type F = { pic: string; x?: number; y?: number; pause?: number; mirror?: boolean };

/** The rink: pixels a frame skating, ticks a frame (a block every 8 ticks), and a lane glide's frames. */
const SKATE = 5;
const SKATE_PAUSE = 2;
const GLIDE = 4;

function teddy(cb: ReturnType<typeof buildCharBlocks>, rail: boolean, rink = false): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const f = (o: F): Frame => {
    const i = cb.index.get(o.pic);
    if (i === undefined) throw new Error(`No Teddy picture ${o.pic}`);
    return { ...emptyFrame(), x: o.x ?? 0, y: o.y ?? 0, pic1: CHARBL, pic2: i, pause: o.pause ?? 1, orient: o.mirror ? MIRROR : 0 };
  };

  // waiting: standing, a sit, a look round
  set(S[SEQ.idle], [f({ pic: 'stand', pause: 30 }), f({ pic: 'sit', pause: 12 }), f({ pic: 'stand', pause: 20 }), f({ pic: 'bark', pause: 3 })]);
  set(S[SEQ.die], [f({ pic: 'hurt', pause: 4 }), f({ pic: 'dead', pause: 30 })], { sound: SND.faint, jstkBut: 0 });
  set(S[SEQ.hurt], [f({ pic: 'hurt', pause: 2 }), f({ pic: 'stand', pause: 1 }), f({ pic: 'hurt', pause: 2 })], { sound: SND.hurt, jstkBut: 0 });
  set(S[3], [f({ pic: 'stand' })], { key: 0 });
  set(S[4], [f({ pic: 'stand' })], { key: 0 });

  const walk = (dx: number, mirror: boolean) => ['walk1', 'walk2'].map((pic) => f({ pic, x: dx, mirror }));
  set(S[SEQ.right], walk(STEP, false), { key: KEY.right, jstkMov: JOY.right });
  set(S[SEQ.left], walk(-STEP, true), { key: KEY.left, jstkMov: JOY.left });
  // Space: the boop, up and back down, one tick each, run once a press
  set(S[SEQ.boop], [f({ pic: 'frontBeg', y: -BOOP }), f({ pic: 'stand', y: BOOP })], {
    key: KEY.space,
    sound: SND.boop,
    norepeat: 1,
    ground: 1,
    jstkMov: JOY.any,
    jstkBut: 1,
  });
  if (rink) {
    // skating on his own: the idle sequence moves him
    set(S[SEQ.idle], [f({ pic: 'walk1', x: SKATE, pause: SKATE_PAUSE }), f({ pic: 'walk2', x: SKATE, pause: SKATE_PAUSE })]);
    glides(S, f({ pic: 'hop' }), f({ pic: 'hop' }));
  } else if (!rail) {
    set(S[SEQ.hop], [f({ pic: 'hop', y: -HOP })], { key: KEY.up, jstkMov: JOY.up, sound: SND.hop });
    const side = (dx: number, mirror: boolean) => [f({ pic: 'hop', x: dx, y: -HOP, mirror }), f({ pic: 'hop', x: dx, y: -HOP, mirror })];
    set(S[SEQ.hopLeft], side(-HOP_STEP, true), { key: KEY.q, jstkMov: JOY.upLeft, sound: SND.hop });
    set(S[SEQ.hopRight], side(HOP_STEP, false), { key: KEY.e, jstkMov: JOY.upRight, sound: SND.hop });
    // Down: sit (and let himself down a harp string, where nothing pulls him)
    set(S[SEQ.sit], [f({ pic: 'sit', y: 3, pause: 1 })], { key: KEY.down, jstkMov: JOY.down });
  }

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 100; // health
  ch.meter[1] = 3; // lives
  ch.meter[3] = 1; // money (the stairs' D rings it up)
  for (const n of [CTR.hits, CTR.found, CTR.stairs, CTR.band, CTR.beats, CTR.staff]) ch.meter[n] = 1;
  ch.meter[CTR.down] = DOWN_START;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}

export const buildTeddy = (cb: ReturnType<typeof buildCharBlocks>) => teddy(cb, false);
export const buildRailTeddy = (cb: ReturnType<typeof buildCharBlocks>) => teddy(cb, true);
export const buildRinkTeddy = (cb: ReturnType<typeof buildCharBlocks>) => teddy(cb, false, true);

/** A tap of Up or Down: one lane (or line) over, the whole glide however short the tap. */
function glides(S: Character['sequences'], up: Frame, down: Frame): void {
  const glide = (f: Frame, dy: number) => Array.from({ length: GLIDE }, () => ({ ...f, y: dy / GLIDE }));
  const once = { norepeat: 1, ground: 1 };
  set(S[SEQ.hop], glide(up, -20), { key: KEY.up, jstkMov: JOY.up, sound: SND.hop, ...once });
  set(S[SEQ.sit], glide(down, 20), { key: KEY.down, jstkMov: JOY.down, sound: SND.hop, ...once });
}

/** Space: a poke half a block to the right for one tick and back (PLAYGAME moves a hero at most 11 px a tick). */
function poke(S: Character['sequences'], out: Frame, back: Frame, sound: number): void {
  set(
    S[SEQ.boop],
    [
      { ...out, x: POKE },
      { ...back, x: -POKE },
    ],
    { key: KEY.space, sound, norepeat: 1, ground: 1, jstkMov: JOY.any, jstkBut: 1 },
  );
}
/** How far a poke reaches (px). */
export const POKE = 10;

/**
 * BATON.CHR, for the marching field: Doc Leo's baton. Up and Down glide it a line of the staff
 * at a time, Space flicks it at the line's key, and on the touchline it walks.
 */
export function buildBaton(cb: ReturnType<typeof buildCharBlocks>): Character {
  const ch = teddy(cb, true);
  const S = ch.sequences;
  const pic = (name: string, x = 0, pause = 1): Frame => ({ ...emptyFrame(), x, pic1: CHARBL, pic2: cb.index.get(name)!, pause });
  set(S[SEQ.idle], [pic('baton', 0, 30)]);
  set(S[SEQ.right], [pic('baton', STEP), pic('baton', STEP)], { key: KEY.right, jstkMov: JOY.right });
  set(S[SEQ.left], [pic('baton', -STEP), pic('baton', -STEP)], { key: KEY.left, jstkMov: JOY.left });
  set(S[SEQ.hurt], [pic('baton')], { sound: SND.hurt, jstkBut: 0 });
  set(S[SEQ.die], [pic('baton', 0, 30)], { sound: SND.faint, jstkBut: 0 });
  glides(S, pic('baton'), pic('baton'));
  // a swish (the hop's pop) for each flick
  poke(S, pic('batonFlick'), pic('baton'), SND.hop);
  return ch;
}

/** STAFF.CHR, for the woods: Teddy as everywhere, but Space pokes a paw to the right (at a note on a staff door). */
export function buildStaffTeddy(cb: ReturnType<typeof buildCharBlocks>): Character {
  const ch = teddy(cb, false);
  const pic = (name: string): Frame => ({ ...emptyFrame(), pic1: CHARBL, pic2: cb.index.get(name)!, pause: 1 });
  poke(ch.sequences, pic('reach'), pic('stand'), SND.boop);
  return ch;
}

export interface MonsterOptions {
  /** Blocks the toy drummer marches before turning round. */
  march?: number;
  /** Blocks Gwinn paces. */
  gwinn?: number;
}

export function buildMonsters(mb: ReturnType<typeof buildMonsterBlocks>, o: MonsterOptions = {}): Monster[] {
  const out = newMonsterSet();
  const n = (name: string) => {
    const i = mb.index.get(name);
    if (i === undefined) throw new Error(`No monster picture ${name}`);
    return i;
  };
  const anim = (a: string, b: string, t = 3): [number, number][] => [
    [n(a), t],
    [n(b), t],
  ];
  out[MON.drummer] = mon(anim('drummer0', 'drummer1', 4), { power: 150, thru: 1 }, pace(o.march ?? 4, 1));
  out[MON.sparkle] = mon(anim('sparkle0', 'sparkle1', 3), { power: 255, thru: 1 }, [corner(0, 0, 1), corner(0, -1, 1), corner(0, 0, 1)]);
  // Gwinn, pleased with herself, trotting up and down a shelf. She is no trouble to bump into.
  out[MON.gwinn] = mon(anim('gwinn1', 'gwinn2', 3), { power: 200, thru: 1 }, pace(o.gwinn ?? 3, 2));
  return out;
}
