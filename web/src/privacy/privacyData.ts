// What the Privacy page says this browser keeps, in plain words. The Record types make a new
// backup section (backup/inventory.ts SectionId) or database fail the typecheck or privacy.test.ts
// until it is described here. No DOM.
import { STORES, DATABASES_NOT_BACKED_UP, type SectionId } from '../backup/inventory';

/** Each kind of thing kept in localStorage or IndexedDB, in a sentence. */
export const KEPT: Record<SectionId, string> = {
  projects: 'Games you made or opened, and notes about them: where each came from, what you used last, which parts of the file list are folded.',
  saves: 'Saved games, scores and where you stopped playing.',
  trophies: 'Score trophies you earned.',
  achievements: 'Your achievements and when you earned them.',
  eggs: 'Eggs you found and the chicken you chose.',
  hearts: 'Tin hearts you found.',
  desk: 'The 1994 desk: the mug, the mail, the clock, the BBS sign-ups, the C: drive, your game pad and the sound card switch.',
  notes: 'Notes on imported games and games you removed from the list.',
  prefs:
    'Settings: light or dark, text size, Color help choices (color names, look-alike warnings, previews), which tab or sort you last used, sound and tour choices (and the day you last saw the tour’s What’s new), print options.',
  ai: 'Your AI setup if you made one: the address, the model and the key, exactly as you typed them.',
};

/** Each IndexedDB database, in a sentence (its name is what a developer tool shows). */
export const DATABASES: Record<string, string> = {
  'gamemaker-web': 'your games and saved games',
  'gamemaker-save-backups': 'copies of saved games taken before a change',
  'gamemaker-recently-deleted': 'games you deleted in the last 7 days, kept so they can be brought back',
  'gamemaker-desk': 'the desk PC’s C: drive',
  'gamemaker-web-player': 'saved games for the player page and games exported for the web',
};

/** The databases the inventory knows (the privacy test checks DATABASES names every one). */
export const KNOWN_DATABASES: string[] = [...new Set([...Object.values(STORES).map((s) => s.db), ...Object.keys(DATABASES_NOT_BACKED_UP)])];

/** Caches: the site's own files for playing offline. */
export const CACHE_NAMES = ['gm-site-v2', 'gm-offline-control:<site URL>', 'gm-offline-copy:<site URL>:<version>:<id>', 'gm-site (older offline copy)'];
