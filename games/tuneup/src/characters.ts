// Doc Leo's character files and the .MON file each level loads.
//
// LEO.CHR: gravity does the platforming. Air pulls down, so a hop is an upward push each tick
// Up is held; Q and E hop up and sideways (Game-Maker follows one key at a time, so nobody has to
// press two). Where nothing pulls (a plug wire), Up climbs and Down climbs back down. Space
// reaches up: his hands go up into the block over his hat for a tick and come back, again and
// again while it is held (a crank's handle). PIANO.CHR: the same, but one reach a press (a key).
// OIL.CHR: Doc Leo with the oil can. Z X C V B each squirt a drop into one line of the staff
// over his head (the frame that fires a monster picks its row, and doesn't move him).
import { MONBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { INF_REPEAT, emptyFrame, newCharacter, type Character, type Frame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon, pace, set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { CTR, KEY, MON, MONEY, OIL_KEYS, SEQ, SND } from './ids';
import type { LeoBlocks, MonsterBlocks } from './sprites/cast';

const JOY = { up: 1, upRight: 2, right: 3, downRight: 4, down: 5, downLeft: 6, left: 7, upLeft: 8, any: 9 };
/** Both blocks flipped left-right (low nibble the top, high nibble the bottom). */
const MIRROR = 0x44;

/** Pixels a tick walking. */
const STEP = 4;
/** Pixels a tick sideways in a hop. */
const HOP_STEP = 4;
/** Upward push a tick while Up is held (gravity takes one more away every tick). */
const HOP = 12;
/** Pixels a tick climbing down a wire. */
const CLIMB_DOWN = 6;
/** The reach: how far up, for one tick. */
export const REACH = 10;

type F = { pose: string; x?: number; y?: number; pause?: number; mirror?: boolean };

/** A frame that fires monster `n` into the row `rows` over Doc Leo's top block (0: just over his hat). */
const fire = (n: number, rows: number): Frame => ({ ...emptyFrame(), x: 0, y: -20 * (rows + 1), pic1: n, pic2: MONBL, pause: 1 });

function leo(cb: LeoBlocks, mode: 'leo' | 'piano' | 'oil'): Character {
  const ch = newCharacter();
  const S = ch.sequences;
  const f = (o: F): Frame => {
    const pose = cb.poses.get(o.pose);
    if (!pose) throw new Error(`No Doc Leo pose ${o.pose}`);
    return { ...emptyFrame(), x: o.x ?? 0, y: o.y ?? 0, pic1: cb.n(pose[0]), pic2: cb.n(pose[1]), pause: o.pause ?? 1, orient: o.mirror ? MIRROR : 0 };
  };

  // waiting: a blink, a grin
  set(S[SEQ.idle], [
    f({ pose: 'front', pause: 30 }),
    f({ pose: 'blink', pause: 3 }),
    f({ pose: 'front', pause: 24 }),
    f({ pose: 'grin', pause: 14 }),
    f({ pose: 'front', pause: 18 }),
    f({ pose: 'blink', pause: 3 }),
  ]);
  set(S[SEQ.die], [f({ pose: 'hurt', pause: 3 }), f({ pose: 'die0', pause: 8 }), f({ pose: 'die1', pause: 30 })], { sound: SND.faint, jstkBut: 0 });
  // a spark frizzes his hair: a jolt, no harm done but a little energy
  set(S[SEQ.hurt], [f({ pose: 'hurt', pause: 2 }), f({ pose: 'front', pause: 1 }), f({ pose: 'hurt', pause: 2 })], { sound: SND.hurt, jstkBut: 0 });
  set(S[3], [f({ pose: 'front' })], { key: 0 });
  set(S[4], [f({ pose: 'front' })], { key: 0 });

  const walk = (dx: number, mirror: boolean) => [0, 1, 2, 3].map((s) => f({ pose: `walk${s}`, x: dx, mirror }));
  set(S[SEQ.right], walk(STEP, false), { key: KEY.right, jstkMov: JOY.right });
  set(S[SEQ.left], walk(-STEP, true), { key: KEY.left, jstkMov: JOY.left });
  // (with the oil can he keeps his feet on his step: no hopping into the staff)
  if (mode !== 'oil') {
    set(S[SEQ.hop], [f({ pose: 'climb', y: -HOP })], { key: KEY.up, jstkMov: JOY.up, sound: SND.hop });
    const side = (dx: number, mirror: boolean) => [f({ pose: 'hopSide', x: dx, y: -HOP, mirror }), f({ pose: 'hopSide', x: dx, y: -HOP, mirror })];
    set(S[SEQ.hopLeft], side(-HOP_STEP, true), { key: KEY.q, jstkMov: JOY.upLeft, sound: SND.hop });
    set(S[SEQ.hopRight], side(HOP_STEP, false), { key: KEY.e, jstkMov: JOY.upRight, sound: SND.hop });
  }
  set(S[SEQ.down], [f({ pose: 'climb', y: CLIMB_DOWN })], { key: KEY.down, jstkMov: JOY.down });
  // Space: hands up into the block over his hat for one tick (so a key counts its touch once), and
  // back; again while held
  set(S[SEQ.boop], [f({ pose: 'hop', y: -REACH, pause: 1 }), f({ pose: 'front', y: REACH, pause: 3 })], {
    key: KEY.space,
    sound: SND.boop,
    ground: 1,
    // at the piano, one boop a press (a held key would play every key it passed)
    norepeat: mode === 'piano' ? 1 : 0,
    jstkMov: JOY.any,
    jstkBut: 1,
  });
  if (mode === 'oil') {
    // the oil can: each key squirts one drop into its own line, the bottom line just over his hat
    OIL_KEYS.forEach((k, i) => {
      set(S[SEQ.oil0 + i], [f({ pose: 'hop', pause: 1 }), fire(MON.drop0 + i, i), f({ pose: 'hop', pause: 2 }), f({ pose: 'front', pause: 1 })], {
        key: KEY[k],
        sound: SND.oil0 + i,
        norepeat: 1,
        ground: 1,
      });
    });
  }

  ch.meter.fill(INF_REPEAT);
  ch.meter[0] = 20; // energy (hit points)
  ch.meter[1] = 3; // lives
  // the counters start empty (each shows one less than it holds; INF_REPEAT would never change)
  for (const n of [MONEY, ...Object.values(CTR)]) ch.meter[n] = 1;
  ch.cseq = 0;
  ch.cframe = 0;
  return ch;
}

export const buildLeo = (cb: LeoBlocks) => leo(cb, 'leo');
export const buildPianoLeo = (cb: LeoBlocks) => leo(cb, 'piano');
export const buildOilLeo = (cb: LeoBlocks) => leo(cb, 'oil');

export interface MonsterOptions {
  /** Blocks a Squeak paces along its line before turning round. */
  squeak?: number;
  /** Blocks the oil can's drop flies before it dries up. */
  reach?: number;
}

/**
 * Powers: a stronger monster turns a weaker one it touches into its next. A drop oils a Squeak;
 * an oiled note is as strong as a drop (so a drop passes a note on its way home untouched), and
 * a note that floats through a Squeak on its way home oils it too.
 */
const POWER = { friend: 50, drop: 60, note: 60, bird: 200 } as const;

export function buildMonsters(mb: MonsterBlocks, o: MonsterOptions = {}): Monster[] {
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
  const still = [corner(0, 0, 1), corner(0, 0, 1)];
  // the chicken at work: bobbing, squawking now and then; nothing happens if you bump into him
  out[MON.reggie] = mon(
    [
      [n('reggie0'), 20],
      [n('reggiePeck'), 4],
      [n('reggie0'), 10],
      [n('reggie1'), 6],
    ],
    { power: POWER.bird, thru: 1 },
    still,
  );
  out[MON.regina] = mon(anim('regina0', 'regina1', 12), { power: POWER.bird, thru: 1 }, still);
  // a Squeak paces its line; oiled, it becomes a note that floats home to Doc Leo
  const run = o.squeak ?? 6;
  out[MON.squeak] = mon(anim('squeak0', 'squeak1', 4), { power: POWER.friend, thru: 0, newmon: MON.note }, pace(run, 1));
  out[MON.squeakFast] = mon(anim('squeak0', 'squeak1', 2), { power: POWER.friend, thru: 0, newmon: MON.note }, pace(run, 2));
  out[MON.note] = mon(anim('note0', 'note1', 4), { power: POWER.note, thru: 0, towards: 3 });
  // the oil can's drops: straight left along the line, then gone
  const reach = o.reach ?? 14;
  for (let i = 0; i < 5; i++)
    out[MON.drop0 + i] = mon(anim('drop0', 'drop1', 2), { power: POWER.drop, thru: 0, end: -1 }, [corner(0, 0, 8), corner(-reach, 0, 8, 4)]);
  return out;
}
