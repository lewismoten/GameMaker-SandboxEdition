// Register Lucky Cat's woodcut prop families under the block names each level uses.
//   stepladder   stepTopL, stepTop, stepTopR (the beam, a paint can on it), stepL, stepR (the legs); a drop of
//                white paint hangs under it (bad luck, once)
//   crack        a heaved paving slab with a crack across it (bad luck, once)
//   crate        a shipping crate stenciled 13
//   mirror       a mirror wall in two cuts, a hand mirror (the key) and the gate it opens (no broken glass anywhere)
//   brolly       an open umbrella that floats up (an updraft: PULL.up), in three inks
//   salt         a salt shaker (the key) and a heap of spilled salt (the gate), with its arch
//   woodBox      a knock-on-wood box with a gold knocker, gone when touched
//   town         a lit window with its blind half down, awnings, a gas lamp, a fence, the fair's tent and bunting
//   clock        the tower's face, whose top number is 13
//   rascal       Rascal on his roof, and his pulley
//   chores       Rascal's morning: rope cleats he ties off, empty steps he leaves a saucer of cream on, the bins'
//                padlock (the Committee locks them for luck) and its key
import { PULL, SOLID, LEDGE, type Book } from '../../kit/starter/book';
import { KEYS } from '../../kit/starter/blocks';
import { SILVER_KEYS } from '../../kit/starter/locks';
import { CHARMS, charmPicture } from './charms';
import { T, cut, skyTile, type Pal } from './print';
import { rascalStanding } from './rascal';
import { stepLeg, stepTop, drip, crack, crate, brolly, woodBox } from './propsHazards';
import { mirrorWall, mirrorKey, mirrorGate, archOf, shaker, saltPile } from './propsGates';
import { windowBlock, awning, lamp, fence, tent, bunting, clockFace } from './propsTown';
import { pulley, cleat, step, padlock, binKey, bin } from './propsChores';

/** Hit points a bad-luck hazard takes, once: a fifth of the cat's 50, which do not come back between levels. */
export const BAD_LUCK = -10;
/** Hit points a crow takes for every tick it touches the cat. */
export const PECK = -3;
/** Points a charm is worth: lucky 13. */
export const CHARM_POINTS = 13;
/** The counter the charms add to (counters 20 to 29 are free; 20 is the salt shaker's and the bin key's, 21 the mirror key's). */
export const CHARM_COUNTER = 22;
/** Points for each of Rascal's chores (a rope tied off, a saucer set out). */
export const CHORE_POINTS = 7;

const air = { grav: PULL.down };

export interface PropOptions {
  charms?: readonly (typeof CHARMS)[number][];
}

/** Adds the props a level asks for by group (blocks are precious), then its charms. */
export function addProps(book: Book, pal: Pal, groups: readonly string[], o: PropOptions = {}): void {
  const has = (g: string) => groups.includes(g);
  if (has('stepladder')) {
    book.add('stepTopL', stepTop(pal, 'L'), { solid: SOLID });
    book.add('stepTop', stepTop(pal, 'M'), { solid: SOLID });
    book.add('stepTopR', stepTop(pal, 'R'), { solid: SOLID });
    book.add('stepL', stepLeg(pal, true), air);
    book.add('stepR', stepLeg(pal, false), air);
    book.add('drip', drip(pal, false), { ...air, hp: BAD_LUCK, touch: 'dripGone' });
    book.add('dripGone', drip(pal, true), air);
  }
  if (has('crack')) {
    book.add('crack', crack(pal, false), { ...air, hp: BAD_LUCK, touch: 'crackDust' });
    book.add('crackDust', crack(pal, true), air);
  }
  if (has('crate')) book.add('crate', crate(pal), { solid: SOLID });
  if (has('mirror')) {
    book.add('mirrorWall', mirrorWall(pal, 0), { solid: SOLID });
    book.add('mirrorWall2', mirrorWall(pal, 1), { solid: SOLID });
    book.add('mirrorKey', mirrorKey(pal), { ...air, score: 25, effect: SILVER_KEYS, eamt: 1, touch: 'sky' });
    book.add('mirrorGate', mirrorGate(pal), { solid: SOLID, effect: SILVER_KEYS, eamt: -1, touch: 'sky' });
    book.add('mirrorArch', archOf(pal), air);
  }
  if (has('brolly')) {
    const { c } = pal;
    for (const [n, canopy] of [
      ['brollyRed', [c('red', 2), c('red', 1)]],
      ['brollyGold', [c('gold', 3), c('gold', 1)]],
      ['brollyTeal', [c('paper', 4), c('paper', 1)]],
    ] as const)
      book.add(n, brolly(pal, canopy as unknown as [number, number]), { grav: PULL.up });
  }
  if (has('salt')) {
    book.add('shaker', shaker(pal), { ...air, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
    book.add('saltPile', saltPile(pal), { solid: SOLID, effect: KEYS, eamt: -1, touch: 'sky' });
    book.add('saltArch', archOf(pal), air);
  }
  if (has('wood')) {
    book.add('woodBox', woodBox(pal), { solid: SOLID, score: 5, touch: 'sky' });
  }
  if (has('town')) {
    book.add('window', windowBlock(pal), { solid: SOLID });
    book.add('awning', awning(pal, false), { solid: LEDGE, grav: PULL.down });
    book.add('awning2', awning(pal, true), { solid: LEDGE, grav: PULL.down });
    book.add('lampHead', lamp(pal, true), air);
    book.add('lampPost', lamp(pal, false), air);
    book.add('fence', fence(pal), air);
    book.add('tentL', tent(pal, 0), air);
    book.add('tentR', tent(pal, 1), air);
    book.add('bunting', bunting(pal), air);
  }
  if (has('clock')) {
    const face = clockFace(pal);
    book.add('clockTL', face.crop(0, 0, 20, 20), { solid: SOLID });
    book.add('clockTR', face.crop(20, 0, 20, 20), { solid: SOLID });
    book.add('clockBL', face.crop(0, 20, 20, 20), { solid: SOLID });
    book.add('clockBR', face.crop(20, 20, 20, 20), { solid: SOLID });
  }
  if (has('rascal')) {
    const r = rascalStanding(pal);
    book.add('rascalTop', skyTile(pal).blit(cut(pal, r.top), 0, 0, T), air);
    book.add('rascalBottom', skyTile(pal).blit(cut(pal, r.bottom), 0, 0, T), air);
    book.add('pulley', pulley(pal), air);
  }
  if (has('chores')) {
    book.add('cleat', cleat(pal, false), { ...air, score: CHORE_POINTS, touch: 'cleatTied' });
    book.add('cleatTied', cleat(pal, true), air);
    book.add('step', step(pal, false), { ...air, score: CHORE_POINTS, touch: 'saucer' });
    book.add('saucer', step(pal, true), air);
    book.add('binKey', binKey(pal), { ...air, score: 25, effect: KEYS, eamt: 1, touch: 'sky' });
    book.add('padlock', padlock(pal), { solid: SOLID, effect: KEYS, eamt: -1, touch: 'sky' });
    book.add('binTop', bin(pal, true), air);
    book.add('bin', bin(pal, false), air);
  }
  for (const name of o.charms ?? []) {
    book.add(`charm.${name}`, charmPicture(pal, name), { ...air, score: CHARM_POINTS, effect: CHARM_COUNTER, eamt: 1, touch: 'sky' });
  }
}

export { pip, fairGate } from './propsTown';
