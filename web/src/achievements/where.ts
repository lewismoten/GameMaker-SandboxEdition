// Where an achievement is earned, for its details on #/achievements: a page or a game, only where
// the code that unlocks it says so (cast/castPage.ts, library/libraryPage.ts, the help pages,
// manual/magazine/viewer.ts, GAME_SPOTS in index.ts, the desk and its room, the DOS page). The rest happen in
// too many places to point at one. A hidden one that is not yet unlocked never says where.
import type { Achievement } from './catalog';

interface Place {
  label: string;
  href: string;
}

const DESK: Place = { label: 'The 1994 desk', href: '#/desk' };
const CAST: Place = { label: 'The cast', href: '#/cast' };
const LIBRARY: Place = { label: 'The Library', href: '#/library' };
const MAGAZINE: Place = { label: 'TURBO BUTTON magazine', href: '#/magazine' };
const DOS: Place = { label: 'DOS Game-Maker', href: './dos.html' };

const BY_ID: Record<string, Place[]> = {
  'cast-visit': [CAST],
  'cast-parade': [CAST],
  'library-visit': [LIBRARY],
  'library-kinds': [LIBRARY],
  'mag-back': [MAGAZINE],
  'mag-features': [MAGAZINE],
  'mag-disc': [MAGAZINE],
  'help-all': [
    { label: 'Playing the games on a Mac', href: '#/mac' },
    { label: 'Playing the games on Windows', href: '#/windows' },
    { label: 'Playing the games on Linux', href: '#/linux' },
  ],
  'blaster-big-name': [{ label: 'Virus Blaster', href: '#/game/cd:blaster' }],
  'brief-chapters': [{ label: 'KEEP IT BRIEF!', href: '#/game/cd:brief' }],
  'make-save': [DESK],
  'finish-desk': [DESK],
  'finish-dos': [DOS],
  'trophy-first': [DESK],
  'trophy-top': [DESK],
};

/** The pages or games where `a` is earned, or none when that is not one place (or still a secret). */
export function placesOf(a: Achievement, unlocked: boolean): Place[] {
  if (a.hidden && !unlocked) return [];
  const own = BY_ID[a.id];
  if (own) return own;
  // the desk's programs, and the room around it (gm-achievement events from the desk)
  if (a.category === 'desk' || (a.category === 'found' && a.id.startsWith('desk-'))) return [DESK];
  return [];
}
