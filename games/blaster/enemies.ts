// The virus's ways of attacking, as monster recipes. Every stage dresses them in its own
// pictures. Game-Maker has no "enemy fires a bullet", so the recipes lean on what it does
// have: monsters that wait until the ship comes near and then run an attack path (relative
// to themselves, or to the ship), monsters that turn into other monsters when they die or
// when their time runs out, and blocks that give birth to monsters.
import { Pixels } from '../kit/pixels';
import { CLEAR } from './art';
import { HURT } from './common';
import { POWER } from './ids';
import type { Bestiary, Leg } from './mons';

/** Symmetric ASCII sprite from left halves (each 10 characters). */
export function sym(half: string[], key: Record<string, number>): Pixels {
  const rows = half.map((h) => {
    if (h.length !== 10) throw new Error(`Half row "${h}" is ${h.length} wide`);
    return h + [...h].reverse().join('');
  });
  const p = new Pixels(20, 20, CLEAR);
  return p.draw(0, Math.floor((20 - rows.length) / 2), rows, key);
}

/** Two-frame animation names. */
const anim = (name: string, t = 4): [string, number][] => [
  [`${name}0`, t],
  [`${name}1`, t],
];

/** Adds a monster's two pictures (name0, name1) to the stage's monster blocks. */
export function pics(b: Bestiary, name: string, a: Pixels, c: Pixels, hurt: number = HURT.enemy): void {
  b.mb.add(`${name}0`, a, { chHitPt: hurt });
  b.mb.add(`${name}1`, c, { chHitPt: hurt });
}

/**
 * Hit points as a chain of monsters: name (full) -> name_2 -> ... -> name_1 -> boom.
 * Only for monsters that don't follow a path (a hit restarts the path from where it is).
 */
function chain(b: Bestiary, name: string, hp: number, def: Parameters<Bestiary['add']>[1], killScore: number, boom = 'boom'): void {
  for (let h = hp; h >= 1; h--) {
    const n = h === hp ? name : `${name}_${h}`;
    b.add(n, { ...def, becomes: h === 1 ? boom : `${name}_${h - 1}`, score: h === 1 ? killScore : 10 });
  }
}

/** Waits; when the ship comes near, swoops at a spot just above it, then dives past it. */
export function diver(b: Bestiary, name: string, o: { score?: number; speed?: number; dive?: number } = {}): void {
  const s = o.speed ?? 3;
  b.add(name, {
    power: POWER.enemy,
    pics: anim(name),
    becomes: 'boom',
    score: o.score ?? 100,
    attack: {
      mode: 'player',
      legs: [
        [0, -3, s],
        [0, 14, o.dive ?? s + 2],
      ],
    },
  });
}

/** Waits; when the ship comes near, flies a path (relative to where it waited). */
export function swooper(b: Bestiary, name: string, legs: Leg[], o: { score?: number; pic?: string } = {}): void {
  b.add(name, { power: POWER.enemy, pics: anim(o.pic ?? name), becomes: 'boom', score: o.score ?? 100, attack: { mode: 'own', legs } });
}

/** Born from a hatch: flies its path and is gone. */
export function mite(b: Bestiary, name: string, legs: Leg[], o: { score?: number; pic?: string } = {}): void {
  b.add(name, { power: POWER.enemy, pics: anim(o.pic ?? name, 3), becomes: 'boom', score: o.score ?? 50, end: -1, path: legs });
}

/** A slow, armored crawler that sets off down the screen when the ship comes near. */
export function heavy(b: Bestiary, name: string, o: { pic?: string; score?: number; hp?: number; speed?: number; dx?: number } = {}): void {
  const legs: Leg[] = [[o.dx ?? 0, 30, o.speed ?? 1]];
  const def = { power: POWER.enemy, pics: anim(o.pic ?? name, 6), attack: { mode: 'own' as const, legs } };
  if ((o.hp ?? 1) > 1) chain(b, name, o.hp!, def, o.score ?? 300);
  else b.add(name, { ...def, becomes: 'boom', score: o.score ?? 100 });
}

/** Floats where it was put. Shoot it and it bursts into shrapnel: better from a distance. */
export function mine(b: Bestiary, name: string, o: { score?: number; hp?: number } = {}): void {
  chain(b, name, o.hp ?? 2, { power: POWER.enemy, pics: anim(name, 8) }, o.score ?? 75, 'burst');
}

/** Homes in on the ship for a while (born from a block); takes a few hits. */
export function homer(b: Bestiary, name: string, o: { score?: number; hp?: number; speed?: number; life?: number } = {}): void {
  chain(b, name, o.hp ?? 2, { power: POWER.enemy, pics: anim(name, 3), towards: o.speed ?? 2, end: o.life ?? 140 }, o.score ?? 150);
}

/** Drifts toward the ship slowly, forever, until it is shot. */
export function stalker(b: Bestiary, name: string, o: { score?: number; hp?: number; speed?: number } = {}): void {
  chain(b, name, o.hp ?? 3, { power: POWER.enemy, pics: anim(name, 5), towards: o.speed ?? 1 }, o.score ?? 250);
}

// ------------------------------------------------------------------ paths for swoopers and mites

/** An S-curve entering from the middle: out to one side, back across, and down off the screen. */
export const S_CURVE = (side: 1 | -1, speed = 4): Leg[] => [
  [side * 5, 1, speed],
  [side * 2, 3, speed],
  [-side * 6, 3, speed],
  [-side * 3, 2, speed],
  [side * 2, 12, speed + 1],
];

/** Sweeps across the screen and away. */
export const SWEEP = (side: 1 | -1, speed = 5): Leg[] => [
  [side * 7, 2, speed],
  [side * 2, 4, speed],
  [-side * 4, 14, speed],
];

/** Zigzags down the screen. */
export const ZIGZAG = (side: 1 | -1, speed = 3): Leg[] => [
  [side * 3, 2, speed],
  [-side * 6, 3, speed],
  [side * 6, 3, speed],
  [-side * 6, 3, speed],
  [side * 3, 12, speed],
];

/** Hangs in place a moment (flying up with the screen), then rushes down. */
export const HOVER_DROP = (speed = 6): Leg[] => [
  [0, -3, 2],
  [0, 16, speed],
];

/** A hatch mite: scuttles out to one side and down. */
export const SCUTTLE = (side: 1 | -1, speed = 3): Leg[] => [
  [side * 2, 1, speed],
  [side * 2, 3, speed],
  [-side * 1, 3, speed],
  [side * 1, 12, speed + 1],
];
