// Who is in the hall: the helpers who led The Basics Starters (project/starterHeroes.ts), each a palette
// change of the hero's own head. The hero's drawing uses Kit's five ramps; here every helper gets her
// or his skin and hair as ramps of their own (the beanie and hoodie colors are ramps the palette
// already has), and the hero's head block is repainted into them, so eight different people share the
// one drawing. Doc Leo comes from the tune-up game's drawing (tuneup/src/sprites/leo.ts) with its
// colors pointed at the Starter palette's ramps.
import type { PaletteBuilder } from '@lewismoten/gamemaker-sandbox-tools/kit/palette';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { STARTER_GROUPS } from '../../../web/src/project/starter';
import { STARTER_HEROES } from '../../../web/src/project/starterHeroes';
import { helperPalettes, KIT_LOOK, kitRamp, type Look, type Role } from './heroLook';
import type { Pal } from './palette';
import { buildLeoBlocks } from '../../tuneup/src/sprites/leo';

const key = (def: readonly [number, readonly number[], readonly number[], ...unknown[]]): string => `${def[1]}|${def[2]}`;

/** The helpers of the stage's Starters (one or more groups), in the order they lead them (Kit, who is the player here, left out). */
export function audienceOf(...groups: string[]): string[] {
  const games = groups.flatMap((name) => STARTER_GROUPS.find((g) => g.name === name)?.games ?? []);
  return [...new Set(games.map((id) => STARTER_HEROES[id]).filter((n) => n && n !== 'KIT'))];
}

const lookOf = (name: string): Look => helperPalettes.find((h) => h.name === name)!.look;

/** A beanie or hoodie ramp the palette already has, found by its darkest color. */
const SHARED: Record<string, string> = {
  '120,18,36': 'red',
  '70,30,120': 'purple',
  '24,50,140': 'blue',
  '190,70,120': 'pink',
  '150,86,8': 'gold',
  '20,100,74': 'green',
};
const sharedName = (def: Look[Role]): string | undefined => SHARED[String(def[1])];

/** The ramps Doc Leo and the audience need beyond the shared palette: the skins and hair of the helpers, a navy jacket and a drab hat. */
export function addHallRamps(names: string[]) {
  return (b: PaletteBuilder): void => {
    const seen = new Set<string>();
    for (const n of names)
      for (const role of ['skin', 'hair'] as const) {
        const def = lookOf(n)[role];
        const k = `${role}|${key(def)}`;
        if (seen.has(k) || key(def) === key(KIT_LOOK[role])) continue;
        seen.add(k);
        b.ramp(`aud.${k}`, def[0], def[1] as [number, number, number], def[2] as [number, number, number], def[3] as [number, number, number] | undefined);
      }
    b.ramp('navy', 5, [20, 26, 62], [118, 134, 196], [46, 60, 118]);
    b.ramp('drab', 4, [40, 38, 42], [150, 144, 136]);
  };
}

/** Where each of Kit's ramp indices goes for a helper: [from, to] pairs. */
function remap(pal: Pal, name: string): Map<number, number> {
  const look = lookOf(name);
  const out = new Map<number, number>();
  const to = (role: Role): number[] => {
    const def = look[role];
    if (key(def) === key(KIT_LOOK[role])) return kitRamp(pal, role);
    if (role === 'skin' || role === 'hair') return pal.r(`aud.${role}|${key(def)}`);
    if (key(def) === key(KIT_LOOK.hat)) return kitRamp(pal, 'hat');
    const shared = sharedName(def);
    if (!shared) throw new Error(`No ramp for ${name}'s ${role}`);
    return pal.r(shared);
  };
  for (const role of ['skin', 'hair', 'hat', 'hood'] as const) {
    const from = kitRamp(pal, role);
    const dest = to(role);
    from.forEach((f, i) => out.set(f, dest[Math.min(i, dest.length - 1)]));
  }
  return out;
}

/** The hero's head block (`top`, 20x20, 255 clear) as helper `name`, on a backdrop of color `back`. */
export function helperHead(pal: Pal, top: Pixels, name: string, back: number): Pixels {
  const m = remap(pal, name);
  return top.crop(0, 0, 20, 20).map((_x, _y, c) => (c === 255 ? back : (m.get(c) ?? c)));
}

/** Doc Leo's colors, pointed at the Starter palette. */
export function leoPal(pal: Pal): Pal {
  const ramp: Record<string, string> = {
    coat: 'navy',
    navy: 'navy',
    gray: 'stone',
    hat: 'drab',
    nose: 'red',
    paint: 'white',
    steel: 'stone',
    tie: 'green',
    sneaker: 'red',
    cheese: 'gold',
    spark: 'white',
  };
  const name = (n: string) => ramp[n] ?? n;
  return { pal: pal.pal, r: (n) => pal.r(name(n)), c: (n, k) => pal.c(name(n), k) };
}

/** Doc Leo's poses (20x40 each, 255 clear), drawn with the Starter palette. */
export const leoPoses = (pal: Pal): Map<string, Pixels> => buildLeoBlocks(leoPal(pal) as never).pics;
