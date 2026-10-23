// The achievements: what each one is called, the line that says what earned it, its icon, the
// part of the site it belongs to, and whether it is hidden ("???" with a vague hint until it
// is unlocked). `of` fixes a total in advance ("3 of 8 editors"); `from` says the total is
// counted from the games catalog instead (achievements/goals.ts), so a game added later raises
// it and a game no list shows yet never counts.
//
// No text here names a game that the catalog keeps out of sight, or says how many there are.

import type { AchievementRecord } from './store';

export type Category = 'making' | 'playing' | 'watching' | 'desk' | 'fun' | 'found';

export const CATEGORIES: { id: Category; title: string; blurb: string }[] = [
  { id: 'making', title: 'Making games', blurb: 'Drawing, building and sharing games of your own.' },
  { id: 'playing', title: 'Playing', blurb: 'The games on the shelf and the BBS.' },
  { id: 'watching', title: 'Watching', blurb: 'Walkthroughs and recordings.' },
  { id: 'desk', title: 'The 1994 desk', blurb: 'The PC, DOS and the programs on it.' },
  { id: 'fun', title: 'Around the site', blurb: 'The cast and the help pages.' },
  { id: 'found', title: 'Found it', blurb: 'Little things to find. Look around.' },
];

/** What a derived total counts (goals.ts). */
export type Goal = 'sandbox' | 'bizarre' | 'walkthroughs' | 'hearts' | 'eggs';

export interface Achievement {
  id: string;
  title: string;
  /** One line: what earned it. */
  desc: string;
  icon: string;
  category: Category;
  /** Shown as "???" with `hint` until unlocked. */
  hidden?: boolean;
  /** Said in place of `desc` once it is unlocked (a little more than it gives away before). */
  doneDesc?: string;
  /** For a hidden one: a vague nudge. */
  hint?: string;
  /** A fixed total (progress "n of `of`"). */
  of?: number;
  /** For a fixed total: the items that count (anything else kept is ignored). */
  items?: readonly string[];
  /** A total counted from the catalog. */
  from?: Goal;
  /** The noun after the count: "3 of 8 editors". */
  unit?: string;
}

/** The editors whose files count toward "every kind of file" (all block sets count as blocks). */
export const EDIT_KINDS = ['gam', 'pal', 'bbl', 'mon', 'chr', 'map', 'snd', 'txt'] as const;
/** The Download chooser's platforms that count toward "every platform". */
export const EXPORT_PLATFORMS = ['web', 'dos', 'windows', 'mac', 'linux'] as const;
/** The help pages for downloaded games. */
export const HELP_PAGES = ['mac', 'windows', 'linux'] as const;
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
  'desk-zine',
] as const;

export const ACHIEVEMENTS: readonly Achievement[] = [
  // making
  { id: 'make-new', title: 'Blank slate', desc: 'Started a new game of your own.', icon: '🆕', category: 'making' },
  { id: 'make-edit', title: 'First stroke', desc: 'Changed a file in one of your games.', icon: '✏️', category: 'making' },
  {
    id: 'make-every-kind',
    title: 'Jack of all tools',
    desc: 'Changed a game, palette, blocks, monsters, characters, a map, sounds and a text screen.',
    icon: '🧰',
    category: 'making',
    of: EDIT_KINDS.length,
    items: EDIT_KINDS,
    unit: 'kinds of file',
  },
  { id: 'make-save', title: 'Saved to disk', desc: 'Saved a game in Game-Maker on the 1994 PC.', icon: '💾', category: 'making' },
  { id: 'export-web', title: 'On the web', desc: 'Downloaded a game as a web page or web app.', icon: '🌐', category: 'making' },
  { id: 'export-dos', title: 'Back to DOS', desc: 'Downloaded a game for DOS, with its own PLAYGAME.', icon: '🖥️', category: 'making' },
  { id: 'export-windows', title: 'Window shopping', desc: 'Downloaded a game as a Windows program.', icon: '🪟', category: 'making' },
  { id: 'export-mac', title: 'Mac and cheese', desc: 'Downloaded a game as a Mac app.', icon: '🍎', category: 'making' },
  { id: 'export-linux', title: 'Penguin power', desc: 'Downloaded a game for Linux.', icon: '🐧', category: 'making' },
  { id: 'export-files', title: 'Keep a copy', desc: 'Downloaded the files of a game you made.', icon: '🗂️', category: 'making' },
  {
    id: 'export-all',
    title: 'Ships everywhere',
    desc: 'Downloaded games for the web, DOS, Windows, Mac and Linux.',
    icon: '📦',
    category: 'making',
    of: EXPORT_PLATFORMS.length,
    items: EXPORT_PLATFORMS,
    unit: 'platforms',
  },

  // playing
  { id: 'play-first', title: 'Player one', desc: 'Played a game.', icon: '🎮', category: 'playing' },
  { id: 'play-finish', title: 'The end', desc: 'Played a game all the way to its ending.', icon: '🏁', category: 'playing' },
  { id: 'play-save', title: 'Save point', desc: 'Saved a game while playing it.', icon: '📼', category: 'playing' },
  {
    id: 'play-sandbox',
    title: 'Sandbox regular',
    desc: 'Played every Sandbox Software game.',
    icon: '🏖️',
    category: 'playing',
    from: 'sandbox',
    unit: 'games',
  },
  {
    id: 'play-bizarre',
    title: 'Bizarre fan',
    desc: 'Played every game by The Bard of Bizarre.',
    icon: '🎻',
    category: 'playing',
    from: 'bizarre',
    unit: 'games',
  },
  { id: 'saves-panel', title: 'Keeping score', desc: 'Looked through a game’s saves and high scores.', icon: '🏆', category: 'playing' },
  { id: 'heart-first', title: 'Tin heart', desc: 'Found a tin heart hidden in a game.', icon: '🩶', category: 'playing' },
  {
    id: 'heart-all',
    title: 'Heart collector',
    desc: 'Found every tin heart.',
    doneDesc: 'Found every tin heart, and Joe found something too.',
    icon: '💖',
    category: 'playing',
    from: 'hearts',
    unit: 'hearts',
  },
  {
    id: 'egg-first',
    title: 'Soft and fuzzy',
    desc: 'Found a felt egg and saved the game with it.',
    icon: '🥚',
    category: 'playing',
    hidden: true,
    hint: 'Something soft is tucked away in a game.',
  },
  { id: 'egg-all', title: 'A full basket', desc: 'Found every felt egg.', icon: '🧺', category: 'playing', hidden: true, hint: 'There is more than one.' },

  // watching
  { id: 'watch-one', title: 'Sit back', desc: 'Watched a walkthrough to the end.', icon: '🍿', category: 'watching' },
  {
    id: 'watch-all',
    title: 'Binge watcher',
    desc: 'Watched every walkthrough to the end.',
    icon: '📺',
    category: 'watching',
    from: 'walkthroughs',
    unit: 'walkthroughs',
  },
  { id: 'record-video', title: 'Rolling', desc: 'Recorded a video of the screen.', icon: '🎥', category: 'watching' },
  { id: 'download-mp4', title: 'Director’s cut', desc: 'Downloaded a walkthrough as an MP4 video.', icon: '🎞️', category: 'watching' },

  // the desk
  { id: 'desk-power', title: 'Power on', desc: 'Switched on the 1994 PC.', icon: '🔌', category: 'desk' },
  { id: 'desk-gm', title: 'C:\\GM>', desc: 'Ran Game-Maker from DOS.', icon: '⌨️', category: 'desk' },
  { id: 'desk-bbs', title: 'Handshake', desc: 'Dialed The Sofa BBS on the modem.', icon: '📞', category: 'desk' },
  { id: 'desk-bbs-file', title: 'Downloading…', desc: 'Downloaded a file from the BBS.', icon: '📥', category: 'desk' },
  { id: 'desk-hexedit', title: 'Byte by byte', desc: 'Looked inside a file with HEXEDIT.', icon: '🔢', category: 'desk' },
  { id: 'desk-savehack', title: 'Save scummer', desc: 'Ran SAVEHACK, the saved game editor.', icon: '🛠️', category: 'desk' },
  { id: 'desk-backup', title: 'Safe and sound', desc: 'Ran BACKUP.', icon: '🗄️', category: 'desk' },
  { id: 'desk-gmcrack', title: 'Party like it’s 1994', desc: 'Ran GMCRACK.', icon: '🏴‍☠️', category: 'desk' },
  { id: 'desk-register', title: 'Registered user', desc: 'Registered Game-Maker.', icon: '📝', category: 'desk' },
  { id: 'desk-copycheck', title: 'Read the manual', desc: 'Passed Game-Maker’s copy check.', icon: '📖', category: 'desk' },
  {
    id: 'desk-egg',
    title: 'Not in any folder',
    desc: 'Ran EGG.EXE.',
    icon: '🐣',
    category: 'desk',
    hidden: true,
    hint: 'DOS answers to more than HELP lists.',
  },
  { id: 'desk-achieve', title: 'Taking stock', desc: 'Looked over what you’ve done with ACHIEVE.', icon: '📋', category: 'desk' },

  // around the site
  { id: 'cast-visit', title: 'Meet the cast', desc: 'Visited the cast page.', icon: '🎭', category: 'fun' },
  { id: 'cast-parade', title: 'Curtain call', desc: 'Watched the whole stage parade on the cast page.', icon: '👏', category: 'fun' },
  {
    id: 'help-all',
    title: 'Read the fine print',
    desc: 'Read the Mac, Windows and Linux help pages.',
    icon: '🧾',
    category: 'fun',
    of: HELP_PAGES.length,
    items: HELP_PAGES,
    unit: 'pages',
  },

  // found it (the desk's room; reported by gm-achievement events)
  {
    id: 'desk-clock',
    title: 'Time flies',
    desc: 'Pressed the giant wristwatch on the wall and heard it beep the hour (or met the rubber chicken living in it).',
    icon: '🕰️',
    category: 'found',
    hidden: true,
    hint: 'Keep an eye on the time.',
  },
  {
    id: 'desk-wastebasket',
    title: 'One man’s trash',
    desc: 'Rummaged in the waste basket and pulled out a crumpled first try.',
    icon: '🗑️',
    category: 'found',
    hidden: true,
    hint: 'Not everything thrown away is junk.',
  },
  {
    id: 'desk-door',
    title: 'Who’s there?',
    desc: 'Tried the bedroom doorknob: locked, a knock, a honk, or a dog looking in.',
    icon: '🚪',
    category: 'found',
    hidden: true,
    hint: 'The room has a way out.',
  },
  {
    id: 'desk-moon',
    title: 'Moonstruck',
    desc: 'Pressed tonight’s real moon in the window: a shooting star, a fly or a wink.',
    icon: '🌙',
    category: 'found',
    hidden: true,
    hint: 'Look outside after dark.',
  },
  {
    id: 'desk-window',
    title: 'Fogged up',
    desc: 'Breathed on the cold window glass and drew in the fog.',
    icon: '❄️',
    category: 'found',
    hidden: true,
    hint: 'It’s cold out there. Get close to the glass.',
  },
  {
    id: 'desk-curtains',
    title: 'Behind the curtain',
    desc: 'Swished the curtains beside the window.',
    icon: '🪟',
    category: 'found',
    hidden: true,
    hint: 'Somebody might be hiding.',
  },
  {
    id: 'desk-speaker',
    title: 'Bass boost',
    desc: 'Tapped the speaker without the knob.',
    icon: '🔈',
    category: 'found',
    hidden: true,
    hint: 'One speaker gets all the attention.',
  },
  {
    id: 'desk-degauss',
    title: 'Degaussed',
    desc: 'Pressed the monitor’s DEGAUSS button by its name plate.',
    icon: '🌈',
    category: 'found',
    hidden: true,
    hint: 'Every 1994 monitor had a button just for fun.',
  },
  {
    id: 'desk-chez',
    title: 'Honk honk',
    desc: 'Caught THE CHEZ driving past the window and got a honk from Doc Leo.',
    icon: '🚗',
    category: 'found',
    hidden: true,
    hint: 'Watch the street by day. Someone drives by now and then.',
  },
  {
    id: 'desk-blacklight',
    title: 'Glow up',
    desc: 'Flickered the black light over Doc Leo’s velvet poster.',
    icon: '🟣',
    category: 'found',
    hidden: true,
    hint: 'One poster looks better after dark.',
  },
  {
    id: 'desk-uv',
    title: 'Lights out, lights on',
    desc: 'Switched the black-light tube yourself.',
    icon: '💡',
    category: 'found',
    hidden: true,
    hint: 'The tube over the poster has a switch.',
  },
  {
    id: 'desk-plow',
    title: 'Plowed in',
    desc: 'Watched the snow plow bury the driveway again.',
    icon: '🚜',
    category: 'found',
    hidden: true,
    hint: 'Keep an eye on the street on a snowy day.',
  },
  {
    id: 'desk-sleds',
    title: 'Snow day',
    desc: 'Waved at the kids heading for the sledding hill.',
    icon: '🛷',
    category: 'found',
    hidden: true,
    hint: 'Somebody’s going sledding.',
  },
  {
    id: 'desk-dogs',
    title: 'Loose again',
    desc: 'Saw Gwinn run off with a mitten, Teddy right behind.',
    icon: '🐕',
    category: 'found',
    hidden: true,
    hint: 'Who left the gate open?',
  },
  {
    id: 'desk-goat',
    title: 'Third goat from the left',
    desc: 'Watched a goat scream, faint and get back up.',
    icon: '🐐',
    category: 'found',
    hidden: true,
    hint: 'Something in the street is easily startled.',
  },
  {
    id: 'desk-chicken',
    title: 'Fowl flight',
    desc: 'Caught Sir Reginald Cluckington III flying past the window.',
    icon: '🐔',
    category: 'found',
    hidden: true,
    hint: 'Rubber chickens can’t fly. Or can they?',
  },
  {
    id: 'desk-star',
    title: 'Make a wish',
    desc: 'Caught a shooting star from the window.',
    icon: '🌠',
    category: 'found',
    hidden: true,
    hint: 'Watch the night sky.',
  },
  {
    id: 'desk-aurora',
    title: 'Northern lights',
    desc: 'Saw the aurora ripple over the hills.',
    icon: '🌌',
    category: 'found',
    hidden: true,
    hint: 'Some nights the sky puts on a show.',
  },
  {
    id: 'desk-mailtruck',
    title: 'In the mail',
    desc: 'Saw the mail truck pull away with your registration card.',
    icon: '📮',
    category: 'found',
    hidden: true,
    hint: 'Some things go out with the mail.',
  },
  {
    id: 'desk-zine',
    title: 'Underground press',
    desc: 'Found the toy whistle and the hacker zine under it.',
    icon: '📰',
    category: 'found',
    hidden: true,
    hint: 'A cereal-box prize is hiding on the desk.',
  },
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
