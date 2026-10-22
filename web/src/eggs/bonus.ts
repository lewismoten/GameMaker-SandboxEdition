// Two more eggs, kept apart from the dozen: they never count toward it (what the dozen
// unlocks still needs exactly the twelve in eggs.ts), and nothing loads this file until the
// dozen is complete (eggDisplay.ts and eggExe.ts import it only then).
//
// DETECTION works as in eggs.ts: an egg is found when any saved slot of its game holds it, as
// `detect` says ({ block: N } in the inventory, or { counter: N, atLeast: M }). Until `detect`
// is set, an egg can only be added with EGG.EXE. EGG.EXE's overrides for these two live in the
// same `gm-eggs` record as the dozen's, keyed `<game>/<id>` (bonusKey) so they never collide
// with a game's own key.
import type { EggDetect } from './eggs';
import { readOverrides, savesHold, statusOf, type EggStatus, type Override } from './eggState';
import { loadSaveData } from '../project/storage';

export interface BonusEgg {
  game: string;
  id: 'rotten' | 'faberge';
  gameTitle: string;
  name: string;
  description: string;
  credits: string[];
  lore: string;
  /** Set once the egg is in the game. */
  detect?: EggDetect;
}

export const BONUS_EGGS: readonly BonusEgg[] = [
  {
    game: 'bakers',
    id: 'rotten',
    gameTitle: "Baker's Dozen",
    name: 'The Rotten Egg',
    description: 'A real egg, or it was once: mottled grey-green, crazed with cracks, and giving off a smell you can see. Nobody in the family will say how long it sat in the root beer cellar, or why nobody ever threw it out. Tap it and find out.',
    credits: ['Aged to perfection by Claude Opus 5.5', 'Cracked by Lewis "Lewie" Moten III, who said "do not shake it" and then shook it', 'Sniffed, and firmly declined, by Teddy', 'Rolled under the stove by Gwinn (two n\'s), twice', 'Doc Leo held his nose and the flashlight'],
    lore: 'Family legend: in 1776 a Redcoat quartermaster hid the regiment\'s root beer recipe inside a hollow egg, reasoning that no patriot would ever steal a rotten one. He was wrong, and he was downwind. The recipe went west in a saddlebag, the Redcoats went home thirsty, and the family kept the egg "for the heart of the matter."',
  },
  {
    game: 'bakers',
    id: 'faberge',
    gameTitle: "Baker's Dozen",
    name: 'The True Easter Egg',
    description: 'A Fabergé egg you could eat, if you dared: a pastry shell glazed in rose icing with a mirror sheen, piped with royal-icing swags, pearls and a trellis, flecked with edible gold leaf, resting in a nest of spun sugar. On top a tiny clockwork baker turns and turns while a music box plays "Yankee Doodle".',
    credits: ['Baked by Lewis "Lewie" Moten III and Claude Opus 5.5 (one kept the oven, one kept count)', 'Clockwork baker modeled on Doc Leo, who insists the hat is regulation', 'Taste-tested by Teddy and Gwinn (two n\'s), against strict orders'],
    lore: 'The thirteenth egg of a baker\'s dozen, right where the recipe always said it would be. Ingredient 13 was never an ingredient: "Pour one for whoever is still waiting at the table." The Redcoats had the recipe; the patriots had the root beer, and refills. History calls it a revolution. The family calls it a second glass.',
  },
];

export const bonusKey = (egg: BonusEgg): string => `${egg.game}/${egg.id}`;

export interface BonusState {
  egg: BonusEgg;
  inSave: boolean;
  status: EggStatus;
  found: boolean;
}

/** Where a bonus egg stands, given its game's save files and EGG.EXE's overrides. */
export function bonusStatus(egg: BonusEgg, files: Record<string, Uint8Array>, overrides: Record<string, Override>): BonusState {
  const inSave = savesHold(files, egg.detect);
  return { egg, inSave, ...statusOf(inSave, overrides[bonusKey(egg)]) };
}

export async function bonusStates(): Promise<BonusState[]> {
  const overrides = readOverrides();
  const saves = new Map<string, Record<string, Uint8Array>>();
  const filesOf = async (game: string) => {
    if (!saves.has(game)) saves.set(game, await loadSaveData(`game:${game}`));
    return saves.get(game)!;
  };
  const out: BonusState[] = [];
  for (const egg of BONUS_EGGS) out.push(bonusStatus(egg, egg.detect ? await filesOf(egg.game) : {}, overrides));
  return out;
}

/** The rotten egg, once tapped open, stays open (this browser only). */
const HATCHED_KEY = 'gm-egg-hatched';

export function isHatched(): boolean {
  try {
    return localStorage.getItem(HATCHED_KEY) === '1';
  } catch {
    return false;
  }
}

export function setHatched(on: boolean): void {
  try {
    if (on) localStorage.setItem(HATCHED_KEY, '1');
    else localStorage.removeItem(HATCHED_KEY);
  } catch {
    /* private mode: it stays open until the page closes */
  }
}

/** How many taps open the rotten egg. */
export const TAPS = 13;
