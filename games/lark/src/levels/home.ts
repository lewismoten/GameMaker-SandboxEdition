// The finale, the Bitmores' Smart Home after the storm, seen from the side. Three boards of it:
// a toaster gone haywire by the front, a tall chip to rise over on the heart balloon (the air
// vent at its foot fills it); a robot vacuum in a grump, a wall of chips to clear with the
// winding key's spring hop; and the house's Big Grumble, the thermostat, between Joe and Watt's
// workshop door. HELLO cheers the gadgets up from afar, and the Big Grumble a stage at a time.
// Then, in gold, the same house calm (its chips no longer in the way), every friend there, and
// the front door out.
import type { Bestiary, BlockSet } from '../blocks/sets';
import { stamp, type Stamped } from './stamp';

export const HOME_W = 36;
export const HOME_H = 14;
/** The gadgets' patrols (blocks along the floor from where each starts). */
export const RUNS = { toaster: 4, vacuum: 7 } as const;

export function homeRows(gold: boolean): string[] {
  const g: string[][] = Array.from({ length: HOME_H }, (_, y) =>
    Array.from({ length: HOME_W }, (_, x) => (y === HOME_H - 1 ? '_' : x === 0 || x === HOME_W - 1 ? 'C' : (x * 3 + y * 5) % 7 ? '.' : ',')),
  );
  const put = (x: number, y: number, ch: string) => (g[y][x] = ch);
  for (let x = 1; x < HOME_W - 1; x++) if (x % 5 !== 3) put(x, 6, x < 12 || x > 22 ? '~' : '.');
  for (const x of [5, 17, 28]) put(x, 3, 'L');
  if (!gold) {
    // the tall chip (over it on the heart balloon), its air vent, and the wall of chips (the spring hop)
    for (let y = 2; y < HOME_H - 1; y++) put(11, y, 'C');
    put(10, 12, 'v');
    for (let y = 8; y < HOME_H - 1; y++) put(22, y, 'C');
    // the gadgets, the Big Grumble
    put(5, 12, 't');
    put(13, 12, 'm');
    put(30, 12, 'G');
    put(1, 12, '@');
  } else {
    // everybody came: THE CHEZ (Doc Leo at the wheel, Teddy beside him), Gwinn running alongside,
    // Reggie, the Bard, the goat, Carl, Lewie, Will, Loaf #13 and the mustard seed
    for (const [x, ch] of [
      [14, 'a'],
      [16, 'b'],
      [18, 'c'],
      [20, 'd'],
      [24, 'e'],
      [25, 'h'],
      [26, 'i'],
      [27, 'f'],
      [28, 'g'],
      [31, 'j'],
    ] as const)
      put(x, 12, ch);
    put(17, 9, 'k');
    put(1, 12, 'F');
  }
  put(15, 9, 'p');
  put(16, 9, 'p');
  put(17, 9, gold ? 'k' : 'p');
  put(18, 9, 'p');
  put(32, 12, gold ? 'o' : 'D');
  put(34, 11, 's');
  put(34, 12, gold ? 'W' : 'w');
  return g.map((row) => row.join(''));
}

export function homeMap(set: BlockSet, mons: Bestiary | undefined, gold: boolean): Stamped {
  return stamp(
    homeRows(gold),
    {
      '.': 'board',
      ',': 'board3',
      '~': 'current',
      _: 'rail',
      C: 'chip',
      L: 'leds',
      p: 'capacitor',
      v: 'vent',
      t: { tile: 'board', mon: 'toaster' },
      m: { tile: 'board', mon: 'vacuum' },
      G: { tile: 'board', mon: 'grumble1' },
      D: 'door',
      o: 'doorOpen',
      s: 'socket',
      w: 'watt',
      W: 'wattGlad',
      F: 'frontDoor',
      a: 'fLewie',
      b: 'fWill',
      c: 'fLoaf',
      d: 'fSeed',
      e: 'fGwinn',
      h: 'chez0',
      i: 'chez1',
      f: 'fReggie',
      g: 'fBard',
      j: 'fGoat',
      k: 'fCarl',
      '@': 'board',
    },
    set,
    'chip',
    gold ? undefined : mons,
    gold ? 'oFW' : 'Dw@',
  );
}
