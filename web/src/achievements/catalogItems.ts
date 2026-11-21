// Item lists counted by achievement progress.

/** The Download chooser's platforms that count toward "every platform". */
export const EXPORT_PLATFORMS = ['web', 'dos', 'windows', 'mac', 'linux'] as const;
/** The help pages for downloaded games. */
export const HELP_PAGES = ['mac', 'windows', 'linux'] as const;
/** The modem speeds that count toward connecting and downloading at every speed (retro/bbs/lineSpeed.ts; Unlimited isn't one). */
export const MODEM_SPEEDS = ['300', '1200', '2400', '4800', '9600', '14400', '28800', '33600', '56000'] as const;
/** The Library's kinds of paper (library/shelf.ts SHELF_TYPES; a test keeps them in step). */
export const LIBRARY_KINDS = [
  'manual',
  'hintbook',
  'codewheel',
  'worldmap',
  'levelmap',
  'map',
  'poster',
  'newsletter',
  'stickers',
  'labels',
  'retailbox',
  'keys',
  'registration',
  'hintcard',
  'idcard',
  'license',
  'letter',
  'catalog',
  'insert',
  'magazine',
  'guide',
  'walkthrough',
  'video',
] as const;
/** The World Map's styles (manual/printables/worldMapThemes.ts ThemeId; a test keeps them in step). */
export const WORLD_MAP_STYLES = ['land', 'space', 'town', 'rooms', 'library', 'board', 'grid'] as const;
/** TURBO BUTTON's newer features (their section ids in manual/magazine/issue.ts). */
export const MAG_FEATURES = ['readers-picks', 'gripes', 'dos-bugs', 'shelf'] as const;
/** The desk props another part of the room reports with a gm-achievement event. */
export const DESK_PROPS = [
  'desk-clock',
  'desk-wastebasket',
  'desk-door',
  'desk-moon',
  'desk-window',
  'desk-curtains',
  'desk-speaker',
  'desk-degauss',
  'desk-chez',
  'desk-blacklight',
  'desk-uv',
  'desk-plow',
  'desk-sleds',
  'desk-dogs',
  'desk-goat',
  'desk-chicken',
  'desk-star',
  'desk-aurora',
  'desk-mailtruck',
  'desk-mailjeep',
  'desk-mail',
  'desk-zine',
  'desk-light',
  'desk-glance',
  'desk-lume',
  'desk-egg-uv',
] as const;
