// Everything this site keeps in a browser, sorted into the sections a backup offers (and the
// few things it leaves out, with why). The sections' code (sections/) reads its keys and stores
// from here; inventory.test.ts fails when a new gm-* localStorage key or IndexedDB database
// appears in the code without being placed here. No DOM.

export type SectionId = 'projects' | 'saves' | 'trophies' | 'achievements' | 'eggs' | 'hearts' | 'desk' | 'notes' | 'prefs' | 'ai';

/** The IndexedDB stores a backup reads and writes, as their owners open them. */
export interface StoreSpec {
  db: string;
  version: number;
  store: string;
  keyPath?: string;
  index?: { name: string; keyPath: string };
  /** The module that owns it (inventory.test.ts checks its name and version there). */
  owner: string;
}

export const STORES = {
  projects: { db: 'gamemaker-web', version: 1, store: 'projects', keyPath: 'id', owner: 'project/storage.ts' },
  saves: { db: 'gamemaker-web', version: 1, store: 'saves', owner: 'project/storage.ts' },
  saveBackups: {
    db: 'gamemaker-save-backups',
    version: 1,
    store: 'saveBackups',
    keyPath: 'id',
    index: { name: 'game', keyPath: 'game' },
    owner: 'project/saveData/backups.ts',
  },
  desk: { db: 'gamemaker-desk', version: 1, store: 'cdrive', owner: 'retro/dos/cDriveStore.ts' },
} satisfies Record<string, StoreSpec>;

export type StoreId = keyof typeof STORES;

/** Databases left out, and why. */
export const DATABASES_NOT_BACKED_UP: Record<string, string> = {
  'gamemaker-web-player': 'the web player page’s own saves (hostedPlayer/), on whatever site hosts it; it exports them itself',
  'gamemaker-recently-deleted': 'games deleted in the last 7 days, kept so they can be brought back; a backup holds only the games that are listed',
};

/** Save ids (project/storage.ts saves store) that are a section of their own rather than a game's saves. */
export const SITE_SAVE_IDS = { achievements: 'site:achievements', scores: 'site:scores' } as const;
/** The tin heart find (tinHearts/tinHearts.ts FOUND_FILE): in a game's saves, but the hearts section's. */
export const HEART_FILE = 'tinheart.dat';

/** Per-project maps kept in localStorage, keyed by project id: they go with My games. */
export const PROJECT_MAPS = ['gm-project-origin', 'gm-project-used', 'gm-file-folds-by-game', 'gm-play-level-by-game'];
/** "Next steps" hidden on a game's page, one key per project id. */
export const PROJECT_HIDDEN_PREFIX = 'gm-next-hidden-';
/** A CD game's walkthrough and the plays of its scenes, made while it was look-only, one key per catalog id (editor/check/walk/keptWalk.ts). */
const WALK_KEPT_PREFIX = 'gm-walk-kept-';

/** Which localStorage keys each section owns (exact names, and prefixes ending in "-"). */
export const LOCAL_KEYS: Record<SectionId, { keys: string[]; prefixes?: string[] }> = {
  projects: { keys: PROJECT_MAPS, prefixes: [PROJECT_HIDDEN_PREFIX, WALK_KEPT_PREFIX] },
  saves: { keys: [] },
  trophies: { keys: ['gm-score-trophies'] },
  achievements: { keys: ['gm-course-grades', 'gm-honors-dates', 'gm-certificate-name'] },
  eggs: { keys: ['gm-eggs', 'gm-egg-taps', 'gm-egg-hatched', 'gm-chicken'] },
  hearts: { keys: ['gm-tin-hearts', 'gm-clock-heart', 'gm-clock-pops', 'gm-hearts-before-clock', 'gm-heart-reveal'] },
  desk: {
    keys: [
      'gm-reg-mail',
      'gm-reg-reply',
      'gm-desk-clock',
      'gm-bbs-door-tictactoe',
      'gm-bbs-sandbox-user',
      'gm-bbs-signups',
      'gm-hint-phone-bill',
      'gm-line-speed',
      'gm-bbs-downloads',
      'gm-bbs-deleted',
      'gm-dos-dirs',
      'gm-mug',
      'gm-mug-page',
      'gm-shelf-front',
      'gm-pad-turbo',
      'gm-desk-pad',
      'gm-desk-mouse',
      'gm-sound-blaster',
      'gm-desk-machine',
      'gm-specials',
    ],
  },
  notes: { keys: ['gm-imported-notes', 'gm-removed-games'] },
  prefs: {
    keys: [
      'gm-theme',
      'gm-color-help',
      'gm-ui',
      'gm-read-view',
      'gm-read-size',
      'gm-library-by',
      'gm-library-game',
      'gm-library-series',
      'gm-home-sort',
      'gm-ach-dates',
      'gm-ach-progress',
      'gm-ach-hide-unearned',
      'gm-home-category',
      'gm-imported-rating-filter',
      'gm-starter-done-filter',
      'gm-starter-level',
      'gm-volume',
      'gm-screen-keys',
      'gm-touch-controls',
      'gm-hardware-setup',
      'gm-musicbox',
      'gm-sticker-guides',
      'gm-print-shop',
      'gm-hint-open',
      'gm-mus-tab',
      'gm-chr-tab',
      'gm-files-folded',
      'gm-grator-tab',
      'gm-grator-side-collapsed',
      'gm-grator-side-w',
      'gm-map-grid',
      'gm-map-wrap',
      'gm-map-links',
      'gm-map-gray',
      'gm-map-marks-open',
      'gm-map-mark-barriers',
      'gm-map-mark-push',
      'gm-map-mark-touch',
      'gm-map-mark-pickup',
      'gm-map-mark-timed',
      'gm-slides-zoom',
      'gm-demo-skip-intro',
      'gm-demo-audio',
      'gm-tour-on',
      'gm-tour-sound',
      'gm-tour-seen',
    ],
    prefixes: ['gm-library-only-'],
  },
  ai: { keys: ['gm-ai-settings', 'gm-assistant-mode', 'gm-assistant-read-only', 'gm-assistant-port'] },
};

/** Storage keys (localStorage and sessionStorage) left out, and why. */
export const KEYS_NOT_BACKED_UP: Record<string, string> = {
  'gm-project-source': 'marks imported games, whose files are never backed up',
  'gm-import-batch': 'groups imported games by the import that brought them',
  'gm-import-history': 'the last 20 imports and their failures, about files that are never backed up',
  'gm-received': 'games other sites sent, kept as imported games',
  'gm-offline': 'the offline copy, a cache that downloads again',
  'gm-library-context': 'the Library’s start, noted as pages are viewed',
  'gm-library-context-used': 'the Library’s start, noted as pages are viewed',
  'gm-mus-track-clip': 'the music editor’s clipboard',
  'gm-dev-log': 'the dev server’s interaction-log switch (localhost only)',
  'gm-last-place': 'where the editor was last open, to pick up there',
  'gm-file-clip': 'the asset browser’s copied native file and editor extras (this tab only)',
  'gm-map-views': 'the zoom and spot each map was last looked at, so a map opens as you left it (up to 200 maps)',
  'gm-map-clip': 'the map editor’s clipboard (this visit only)',
  'gm-mus-preset-tab': 'the music editor’s preset picker tab (this tab only)',
  'gm-ach-tab': 'the achievements page’s chosen tab (this tab only)',
  'gm-overhead': 'the desk’s room light (this visit only)',
  'gm-blacklight': 'the desk’s black light (this visit only)',
  'gm-not-dos-notice': 'a notice shown once a visit',
  'gm-demos-stopped': 'the home page’s demos, stopped this visit',
  'gm-turbo': 'an old setting the desk removes',
  'gm-assistant-archive': 'the Assistant chat’s archive (this tab only)',
  'gm-tour-demo': 'the guided tour’s signal to start or stop a game preview (an event, never stored)',
  'gm-specials-changed': 'the signal that a Special was kept, locked or reset (an event, never stored)',
  'gm-specials-today': 'the test date SPECIALS DATE sets, for testing only',
};

/** Which section owns a localStorage key, or undefined. */
export function sectionOfKey(key: string): SectionId | undefined {
  for (const [id, k] of Object.entries(LOCAL_KEYS) as [SectionId, (typeof LOCAL_KEYS)[SectionId]][])
    if (k.keys.includes(key) || k.prefixes?.some((p) => key.startsWith(p))) return id;
  return undefined;
}

/** The section's keys present in `local`. */
export function localOf(id: SectionId, local: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(local)) if (sectionOfKey(k) === id) out[k] = v;
  return out;
}
