// The achievements: what each one is called, the line that says what earned it, its icon, the
// part of the site it belongs to, and whether it is hidden ("???" with a vague hint until it
// is unlocked). `of` fixes a total in advance ("3 of 8 editors"); `from` says the total is
// counted from the games catalog instead (achievements/goals.ts), so a game added later raises
// it and a game no list shows yet never counts.
//
// No text here names a game that the catalog keeps out of sight, or says how many there are.

import type { AchievementRecord } from './store';
import type { Achievement, Category } from './catalogTypes';
import { MAKING_ACHIEVEMENTS } from './catalogMaking';
import { PLAYING_ACHIEVEMENTS } from './catalogPlaying';
import { WATCHING_ACHIEVEMENTS } from './catalogWatching';
import { DESK_ACHIEVEMENTS } from './catalogDesk';
import { FUN_ACHIEVEMENTS } from './catalogFun';
import { FOUND_ACHIEVEMENTS } from './catalogFound';
import { HONORS } from './catalogHonors';

export type { Achievement, Category, Goal } from './catalogTypes';
export { EDIT_KINDS } from './editKinds';
export { LIBRARY_KINDS, WORLD_MAP_STYLES, MAG_FEATURES, DESK_PROPS } from './catalogItems';

export const CATEGORIES: { id: Category; title: string; blurb: string }[] = [
  { id: 'making', title: 'Making games', blurb: 'Drawing, building and sharing games of your own.' },
  { id: 'playing', title: 'Playing', blurb: 'The games on the shelf and the BBS.' },
  { id: 'watching', title: 'Watching', blurb: 'Walkthroughs and recordings.' },
  { id: 'desk', title: 'The 1994 desk', blurb: 'The PC, DOS and the programs on it.' },
  { id: 'fun', title: 'Around the site', blurb: 'The cast, the help pages and what comes in the boxes.' },
  { id: 'found', title: 'Found it', blurb: 'Little things to find. Look around.' },
];

export const ACHIEVEMENTS: readonly Achievement[] = [
  ...MAKING_ACHIEVEMENTS,
  ...PLAYING_ACHIEVEMENTS,
  ...WATCHING_ACHIEVEMENTS,
  ...DESK_ACHIEVEMENTS,
  ...FUN_ACHIEVEMENTS,
  ...FOUND_ACHIEVEMENTS,
  ...HONORS,
];

const BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export const achievementById = (id: string): Achievement | undefined => BY_ID.get(id);

/** What a list shows for an achievement: its own text once unlocked; "???" and the hint while a hidden one is not. */
export function shownText(a: Achievement, unlocked: boolean): { title: string; desc: string; icon: string } {
  if (unlocked || !a.hidden) return { title: a.title, desc: (unlocked && a.doneDesc) || a.desc, icon: a.icon };
  return { title: '???', desc: a.hint ?? 'Keep looking.', icon: '❔' };
}

/** What a card says about how far along it is, or undefined when it shows no count. */
export function progressOf(a: Achievement, r: AchievementRecord): { n: number; of: number } | undefined {
  if (a.hidden && !r.unlocked[a.id]) return undefined;
  if (!a.of && !a.from) return undefined;
  const p = r.progress[a.id];
  if (r.unlocked[a.id]) return p ? { n: Math.max(p.n, p.of), of: p.of } : undefined;
  return p ?? (a.of ? { n: 0, of: a.of } : undefined);
}
