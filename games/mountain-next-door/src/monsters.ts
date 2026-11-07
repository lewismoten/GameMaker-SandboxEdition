// THE MOUNTAIN MOVED NEXT DOOR's monsters: one picture set (mount.mbl) and four monster files, one for the
// levels you play and one for each scene you watch (a scene's monsters are its actors).
//   trail.mon    a rolling pebble (it bumps: a few hit points), Nutmeg the squirrel, three glow-worms that blink
//                at their own times, Wisp hiding in the tunnel, Wisp following Tess, the hens
//   next.mon     the prologue: fog that waits, then drifts off in four waves; Mr. Hale and Mrs. Okoro, each
//                walking out, stopping to look (a bubble) and walking back; nothing hurts
//   hollow.mon   sunset at the empty spot: the sun sinks in four steps and is gone; Nutmeg; Wisp's raindrops
//   picnic.mon   the next morning: the sun rises, the neighbors walk up to the picnic and stay; Wisp floats in
// An ACT is one monster; the next act is the monster it BECOMES when its path or lifetime runs out
// (code/GM/PLAYGAME.C: MonEndPath and KillMon; see games/scripted/src/monsters.ts).
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { SOLBOT, SOLLEF, SOLRIG } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { newMonsterSet, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { corner, mon, pace } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { HALE, OKORO, bigEye, bigMouth, bubble, fogPuff, mist, glowWorm, hen, neighborBottom, neighborTop, pebble, squirrel, sun, wisp } from './art/folk';

/** Hit points a rolling pebble's bump takes. */
export const BUMP = -5;
/** Powers of 100 or more cannot be popped by touching Tess (PLAYGAME.C DoCollision). */
const POWER = 150;
/** Ticks a block takes at speed 1 (20 pixels at a pixel a tick). */
export const BLOCK_TICKS = 20;

export function monsterPictures(pal: Pal): Book {
  const mb = new Book('mbl', 100);
  const bump = { solid: SOLBOT | SOLLEF | SOLRIG, hp: BUMP };
  mb.add('pebble0', pebble(pal, 0), bump);
  mb.add('pebble1', pebble(pal, 1), bump);
  mb.add('nut0', squirrel(pal, 0));
  mb.add('nut1', squirrel(pal, 1));
  mb.add('nutSit', squirrel(pal, 'sit'));
  for (const f of [0, 1, 2, 3] as const) mb.add(`glow${f}`, glowWorm(pal, f));
  mb.add('wisp0', wisp(pal, 0, 'sad'));
  mb.add('wisp1', wisp(pal, 1, 'sad'));
  mb.add('wispUp0', wisp(pal, 0, 'happy'));
  mb.add('wispUp1', wisp(pal, 1, 'happy'));
  mb.add('fog0', fogPuff(pal, 0));
  mb.add('fog1', fogPuff(pal, 1));
  mb.add('mist0', mist(pal, 0));
  mb.add('mist1', mist(pal, 1));
  mb.add('sun', sun(pal));
  mb.add('hen0', hen(pal, 0));
  mb.add('hen1', hen(pal, 1));
  for (const [name, n] of [
    ['okoro', OKORO],
    ['hale', HALE],
  ] as const) {
    mb.add(`${name}Top`, neighborTop(pal, n));
    mb.add(`${name}Bot0`, neighborBottom(pal, n, 0));
    mb.add(`${name}Bot1`, neighborBottom(pal, n, 1));
  }
  mb.add('bubWow', bubble(pal, '!'));
  mb.add('bubHuh', bubble(pal, '?'));
  mb.add('bubHeart', bubble(pal, 'heart'));
  mb.add(NOTHING, new Pixels(20, 20, 255));
  for (const how of ['open', 'blink', 'shut'] as const) bigEye(pal, how).forEach((pic, i) => mb.add(`eye.${how}${i}`, pic));
  bigMouth(pal, false).forEach((pic, i) => mb.add(`mouth.smile${i}`, pic));
  bigMouth(pal, true).forEach((pic, i) => mb.add(`mouth.yawn${i}`, pic));
  return mb;
}

export const finishMonsterPictures = (mb: Book): Block[] => mb.finish();

type Pics = [number, number][];
const still = (mb: Book, name: string): Pics => [[mb.n(name), 8]];
const anim = (mb: Book, a: string, b: string, t: number): Pics => [
  [mb.n(a), t],
  [mb.n(b), t],
];
const actor = { power: POWER, thru: 1 };

/** trail.mon's slots. */
export const TRAIL = { pebble: 0, nutmeg: 1, nutShort: 2, glowA: 3, glowB: 4, glowC: 5, wispHide: 6, wispFollow: 7, hens: 8, pebbleShort: 9, face: 10, mist: 16, nutBranch: 17 } as const;

/** A glow-worm's blink: [frame, ticks] (dark a while, then a slow swell and fade). */
function glowBlink(mb: Book, dark: number, bright: number): Pics {
  return [
    [mb.n('glow0'), dark],
    [mb.n('glow1'), 4],
    [mb.n('glow2'), 5],
    [mb.n('glow3'), bright],
    [mb.n('glow2'), 5],
    [mb.n('glow1'), 4],
  ];
}

export function trailSet(mb: Book, o: { pebbleRun?: number; nutRun?: number } = {}): Monster[] {
  const set = newMonsterSet();
  set[TRAIL.pebble] = mon(anim(mb, 'pebble0', 'pebble1', 3), { power: POWER, thru: 0 }, pace(o.pebbleRun ?? 4, 1));
  set[TRAIL.pebbleShort] = mon(anim(mb, 'pebble0', 'pebble1', 3), { power: POWER, thru: 0 }, pace(1, 1));
  set[TRAIL.nutmeg] = mon(anim(mb, 'nut0', 'nut1', 3), actor, pace(o.nutRun ?? 6, 2));
  set[TRAIL.nutShort] = mon(anim(mb, 'nut0', 'nut1', 4), actor, pace(2, 1));
  set[TRAIL.glowA] = mon(glowBlink(mb, 50, 14), { ...actor, end: -2 });
  set[TRAIL.glowB] = mon(glowBlink(mb, 73, 9), { ...actor, end: -2 });
  set[TRAIL.glowC] = mon(glowBlink(mb, 37, 20), { ...actor, end: -2 });
  set[TRAIL.wispHide] = mon(anim(mb, 'wisp0', 'wisp1', 9), { ...actor, end: -2 });
  set[TRAIL.wispFollow] = mon(anim(mb, 'wispUp0', 'wispUp1', 9), { ...actor, end: -2, towards: 1 });
  set[TRAIL.hens] = mon(anim(mb, 'hen0', 'hen1', 7), actor, pace(2, 1));
  set[TRAIL.mist] = mon(anim(mb, 'mist0', 'mist1', 14), { ...actor, end: -2 }, pace(5, 1));
  set[TRAIL.nutBranch] = mon(anim(mb, 'nut0', 'nut1', 3), actor, pace(4, 1));
  face(set, mb, TRAIL.face);
  return set;
}

/** How many monster slots the mountain's face takes (face()): four per eye part's act, two per mouth part's act. */
export const FACE_SLOTS = 14;

/**
 * The mountain's face as monsters from slot `at`: the eye's four parts at at..at+3 (both eyes use them) and the
 * mouth's two at at+4, at+5. Awake, the eyes blink now and then; with `wake` they sleep (shut) until then, and the
 * mouth yawns 40 ticks later.
 */
function face(set: Monster[], mb: Book, at: number, wake?: number): void {
  const blinking = (i: number): Pics => [
    [mb.n(`eye.open${i}`), 110],
    [mb.n(`eye.blink${i}`), 5],
    [mb.n(`eye.open${i}`), 60],
    [mb.n(`eye.blink${i}`), 4],
  ];
  for (let i = 0; i < 4; i++) {
    if (wake === undefined) set[at + i] = mon(blinking(i), { ...actor, end: -2 });
    else {
      set[at + i] = mon(still(mb, `eye.shut${i}`), { ...actor, end: wake, newmon: at + 6 + i });
      set[at + 6 + i] = mon(blinking(i), { ...actor, end: -2 });
    }
  }
  for (let i = 0; i < 2; i++) {
    if (wake === undefined) set[at + 4 + i] = mon(still(mb, `mouth.smile${i}`), { ...actor, end: -2 });
    else {
      set[at + 4 + i] = mon(still(mb, `mouth.smile${i}`), { ...actor, end: wake + 40, newmon: at + 10 + i });
      set[at + 10 + i] = mon(still(mb, `mouth.yawn${i}`), { ...actor, end: 60, newmon: at + 12 + i });
      set[at + 12 + i] = mon(still(mb, `mouth.smile${i}`), { ...actor, end: -2 });
    }
  }
}

/** A clear picture: an actor waiting offstage, or a cue that times a bubble. */
const NOTHING = 'nothing';

/** next.mon's slots. */
export const NEXT = { fogWait: [0, 1, 2, 3], fogDrift: 4, hale: 5, okoro: 15, face: 25 } as const;
/** Ticks each wave of fog waits before it drifts off; the drift (6 blocks over, 3 up) takes about 140 ticks more. */
export const FOG_WAVES = [100, 210, 320, 430] as const;
/** The prologue's clock (ticks): when Mr. Hale and Mrs. Okoro step out, how far they walk, how long they look, and when the mountain wakes. */
export const PROLOGUE = { hale: 60, haleWalk: 6, okoro: 760, okoroWalk: -3, look: 130, wake: 960 } as const;

/**
 * A neighbor's visit as ten monsters from slot `at`: the top and the bottom of each act (standing where they are, walking
 * `walk` blocks, stopping to look, walking back and gone), then a cue that waits and a bubble over their head.
 * Place the top at slot `at`, the bottom at `at + 1` (one row below) and the cue at `at + 8` above the spot where
 * they stop.
 */
function visit(set: Monster[], mb: Book, at: number, who: 'okoro' | 'hale', wait: number, walk: number, look: number, bub: string): void {
  const out = walk < 0 ? 4 : 0;
  const home = walk < 0 ? 0 : 4;
  const steps = Math.abs(walk) * BLOCK_TICKS;
  for (const [k, part] of [
    [0, 'Top'],
    [1, 'Bot'],
  ] as const) {
    const s = at + k;
    const walking: Pics = part === 'Top' ? [[mb.n(`${who}Top`), 6]] : anim(mb, `${who}Bot0`, `${who}Bot1`, 5);
    const standing: Pics = still(mb, part === 'Top' ? `${who}Top` : `${who}Bot0`);
    set[s] = mon(standing, { ...actor, end: wait, newmon: s + 2 });
    set[s + 2] = mon(walking, { ...actor, end: -1, newmon: s + 4 }, [corner(walk, 0, 1, out), corner(0, 0, 0)]);
    set[s + 4] = mon(standing, { ...actor, end: look, newmon: s + 6 });
    set[s + 6] = mon(walking, { ...actor, end: -1 }, [corner(-walk, 0, 1, home), corner(0, 0, 0)]);
  }
  set[at + 8] = mon(still(mb, NOTHING), { ...actor, end: wait + steps + 10, newmon: at + 9 });
  set[at + 9] = mon(still(mb, bub), { ...actor, end: look - 20 });
}

export function nextSet(mb: Book): Monster[] {
  const set = newMonsterSet();
  NEXT.fogWait.forEach((slot, i) => (set[slot] = mon(anim(mb, 'fog0', 'fog1', 12), { ...actor, end: FOG_WAVES[i], newmon: NEXT.fogDrift })));
  set[NEXT.fogDrift] = mon(anim(mb, 'fog0', 'fog1', 12), { ...actor, end: -1 }, [corner(6, -3, 1), corner(0, 0, 0)]);
  visit(set, mb, NEXT.hale, 'hale', PROLOGUE.hale, PROLOGUE.haleWalk, PROLOGUE.look, 'bubHuh');
  visit(set, mb, NEXT.okoro, 'okoro', PROLOGUE.okoro, PROLOGUE.okoroWalk, PROLOGUE.look, 'bubWow');
  face(set, mb, NEXT.face, PROLOGUE.wake);
  return set;
}

/** hollow.mon's slots and the sunset's clock: the sun holds still `hold` ticks, then sinks a block, four times, and is gone. */
export const HOLLOW = { sun: 0, nutSit: 8, nutmeg: 9 } as const;
export const SUNSET = { hold: 170, steps: 4 } as const;

export function hollowSet(mb: Book): Monster[] {
  const set = newMonsterSet();
  for (let k = 0; k < SUNSET.steps; k++) {
    const s = HOLLOW.sun + k * 2;
    set[s] = mon(still(mb, 'sun'), { ...actor, end: SUNSET.hold, newmon: s + 1 });
    set[s + 1] = mon(still(mb, 'sun'), { ...actor, end: -1, ...(k < SUNSET.steps - 1 ? { newmon: s + 2 } : {}) }, [corner(0, 1, 1), corner(0, 0, 0)]);
  }
  set[HOLLOW.nutSit] = mon(still(mb, 'nutSit'), { ...actor, end: -2 });
  set[HOLLOW.nutmeg] = mon(anim(mb, 'nut0', 'nut1', 3), actor, pace(3, 1));
  return set;
}

/** picnic.mon's slots and clock: the sun rises once; each neighbor waits, walks up and stays, then a heart; Wisp floats in last. */
export const PICNIC = { sunRise: 0, sunStay: 1, hale: 2, okoro: 10, wisp: 18, face: 21, walk: 6, hale0: 120, okoro0: 260, wisp0: 420 } as const;

function arrive(set: Monster[], mb: Book, at: number, who: 'okoro' | 'hale', wait: number, walk: number): void {
  for (const [k, part] of [
    [0, 'Top'],
    [1, 'Bot'],
  ] as const) {
    const s = at + k;
    const walking: Pics = part === 'Top' ? [[mb.n(`${who}Top`), 6]] : anim(mb, `${who}Bot0`, `${who}Bot1`, 5);
    set[s] = mon(still(mb, NOTHING), { ...actor, end: wait, newmon: s + 2 });
    set[s + 2] = mon(walking, { ...actor, end: -1, newmon: s + 4 }, [corner(walk, 0, 1, 0), corner(0, 0, 0)]);
    set[s + 4] = mon(still(mb, part === 'Top' ? `${who}Top` : `${who}Bot0`), { ...actor, end: -2 });
  }
  set[at + 6] = mon(still(mb, NOTHING), { ...actor, end: wait + walk * BLOCK_TICKS + 20, newmon: at + 7 });
  set[at + 7] = mon(still(mb, 'bubHeart'), { ...actor, end: 90 });
}

export function picnicSet(mb: Book): Monster[] {
  const set = newMonsterSet();
  set[PICNIC.sunRise] = mon(still(mb, 'sun'), { ...actor, end: -1, newmon: PICNIC.sunStay }, [corner(0, -3, 1), corner(0, 0, 0)]);
  set[PICNIC.sunStay] = mon(still(mb, 'sun'), { ...actor, end: -2 });
  arrive(set, mb, PICNIC.hale, 'hale', PICNIC.hale0, PICNIC.walk);
  arrive(set, mb, PICNIC.okoro, 'okoro', PICNIC.okoro0, PICNIC.walk);
  const w = PICNIC.wisp;
  set[w] = mon(still(mb, NOTHING), { ...actor, end: PICNIC.wisp0, newmon: w + 1 });
  set[w + 1] = mon(anim(mb, 'wispUp0', 'wispUp1', 9), { ...actor, end: -1, newmon: w + 2 }, [corner(5, -2, 1), corner(0, 0, 0)]);
  set[w + 2] = mon(anim(mb, 'wispUp0', 'wispUp1', 9), { ...actor, end: -2 });
  face(set, mb, PICNIC.face);
  return set;
}

/** Each monster file by name (a level's `mon`). */
export const MON_SETS: Record<'trail' | 'next' | 'hollow' | 'picnic', (mb: Book) => Monster[]> = {
  trail: (mb) => trailSet(mb),
  next: nextSet,
  hollow: hollowSet,
  picnic: picnicSet,
};
