// The achievements: what each one is called, the line that says what earned it, its icon, the
// part of the site it belongs to, and whether it is hidden ("???" with a vague hint until it
// is unlocked). `of` fixes a total in advance ("3 of 8 editors"); `from` says the total is
// counted from the games catalog instead (achievements/goals.ts), so a game added later raises
// it and a game no list shows yet never counts.
//
// No text here names a game that the catalog keeps out of sight, or says how many there are.

import type { AchievementRecord } from './store';
import { EDIT_KINDS } from './editKinds';

export type Category = 'making' | 'playing' | 'watching' | 'desk' | 'fun' | 'found';

export const CATEGORIES: { id: Category; title: string; blurb: string }[] = [
  { id: 'making', title: 'Making games', blurb: 'Drawing, building and sharing games of your own.' },
  { id: 'playing', title: 'Playing', blurb: 'The games on the shelf and the BBS.' },
  { id: 'watching', title: 'Watching', blurb: 'Walkthroughs and recordings.' },
  { id: 'desk', title: 'The 1994 desk', blurb: 'The PC, DOS and the programs on it.' },
  { id: 'fun', title: 'Around the site', blurb: 'The cast, the help pages and what comes in the boxes.' },
  { id: 'found', title: 'Found it', blurb: 'Little things to find. Look around.' },
];

/** What a derived total counts (goals.ts). */
export type Goal = 'sandbox' | 'bizarre' | 'sandboxDone' | 'bizarreDone' | 'teddy' | 'walkthroughs' | 'hearts' | 'eggs';

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
export { EDIT_KINDS };
/** The Download chooser's platforms that count toward "every platform". */
const EXPORT_PLATFORMS = ['web', 'dos', 'windows', 'mac', 'linux'] as const;
/** The help pages for downloaded games. */
const HELP_PAGES = ['mac', 'windows', 'linux'] as const;
/** The modem speeds that count toward connecting and downloading at every speed (retro/bbs/lineSpeed.ts; Unlimited isn't one). */
const MODEM_SPEEDS = ['300', '1200', '2400', '4800', '9600', '14400', '28800', '33600', '56000'] as const;
/** The Library's kinds of paper (library/shelf.ts SHELF_TYPES; a test keeps them in step). */
export const LIBRARY_KINDS = [
  'manual',
  'hintbook',
  'worldmap',
  'levelmap',
  'map',
  'poster',
  'newsletter',
  'stickers',
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
  { id: 'check-run', title: 'Check-up', desc: 'Ran the Level check on a map.', icon: '🩺', category: 'making' },
  { id: 'check-fix', title: 'Quick fix', desc: 'Applied a ✨ fix from the Level check.', icon: '✨', category: 'making' },
  { id: 'check-upload', title: 'Ready to upload', desc: 'Ticked every box on the Before You Upload checklist.', icon: '✅', category: 'making' },
  { id: 'make-walk', title: 'Let the bot play', desc: 'Made a walkthrough of your game with the 🤖 walkthrough bot.', icon: '🤖', category: 'making' },
  { id: 'sfx-maker', title: 'Bleeps and bloops', desc: 'Saved a sound with the 🎛 sound effect maker.', icon: '🎛️', category: 'making' },
  { id: 'first-steps', title: 'First steps', desc: 'Ticked every step of the 🎓 First steps list in a new game.', icon: '🎓', category: 'making' },
  {
    id: 'make-cards',
    title: 'In the cards',
    desc: 'Made an Instruction card and a Level card in the Game Integrator.',
    icon: '🪧',
    category: 'making',
    of: 2,
    items: ['howto', 'level'],
    unit: 'cards',
  },
  { id: 'make-opening', title: 'Presenting…', desc: 'Gave a game an Opening sting on its start scene.', icon: '🎬', category: 'making' },
  { id: 'make-heat', title: 'Feeling the heat', desc: 'Played your own map with Play and record, and grew your heat map.', icon: '🔥', category: 'making' },
  { id: 'make-take', title: 'Take one', desc: 'Kept your own play of a scene for its walkthrough.', icon: '⏺️', category: 'making' },
  { id: 'palette-vision', title: 'Seen by everyone', desc: 'Applied a ✨ fix from the palette’s Color vision check.', icon: '👓', category: 'making' },

  // playing
  { id: 'play-first', title: 'Player one', desc: 'Played a game.', icon: '🎮', category: 'playing' },
  { id: 'play-finish', title: 'The end', desc: 'Played a game all the way to its ending.', icon: '🏁', category: 'playing' },
  {
    id: 'finish-desk',
    title: 'After school special',
    desc: 'Played a game start to finish on the 1994 desk’s PC.',
    icon: '🎒',
    category: 'playing',
  },
  { id: 'finish-dos', title: 'Real mode', desc: 'Played a game start to finish on DOS Game-Maker’s own page.', icon: '💽', category: 'playing' },
  { id: 'finish-web', title: 'Surfin’ the Web', desc: 'Played a game start to finish in today’s web player.', icon: '🏄', category: 'playing' },
  {
    id: 'finish-phone-wide',
    title: 'Sideways scroller',
    desc: 'Played a game start to finish on a phone, held sideways most of the way.',
    icon: '↔️',
    category: 'playing',
  },
  {
    id: 'finish-phone-tall',
    title: 'Tall order',
    desc: 'Played a game start to finish on a phone, held upright most of the way.',
    icon: '↕️',
    category: 'playing',
  },
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
  {
    id: 'finish-sandbox',
    title: 'Sandbox champion',
    desc: 'Played every Sandbox Software game all the way to its ending.',
    icon: '🥇',
    category: 'playing',
    from: 'sandboxDone',
    unit: 'games',
  },
  {
    id: 'finish-bizarre',
    title: 'Encore!',
    desc: 'Played every game by The Bard of Bizarre all the way to its ending.',
    icon: '🎤',
    category: 'playing',
    from: 'bizarreDone',
    unit: 'games',
  },
  {
    id: 'play-teddy',
    title: 'Good dog!',
    desc: 'Played every Teddy game all the way to its ending.',
    icon: '🐶',
    category: 'playing',
    from: 'teddy',
    unit: 'games',
  },
  {
    id: 'blaster-big-name',
    title: 'Name in lights',
    desc: 'Reached 3-A, The Big Name, on the face of the Sound Boaster in Virus Blaster.',
    icon: '🔊',
    category: 'playing',
  },
  {
    id: 'brief-chapters',
    title: 'Chapter and verse',
    desc: 'Finished all four chapters of the night in KEEP IT BRIEF!',
    icon: '🔖',
    category: 'playing',
    of: 4,
    items: ['1', '2', '3', '4'],
    unit: 'chapters',
  },
  {
    id: 'trophy-first',
    title: 'Participation trophy',
    desc: 'Finished a game with points, and a little trophy turned up on the 1994 desk.',
    icon: '🎖️',
    category: 'playing',
  },
  {
    id: 'trophy-top',
    title: 'Over the top',
    desc: 'Grew a score trophy on the 1994 desk into the gaudy tower at the top.',
    icon: '👑',
    category: 'playing',
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
  {
    id: 'egg-teddy',
    title: 'Lay an egg!',
    desc: 'Found the felt eggs in all three Teddy adventures, so Teddy laid a special one of his own for the shadow box.',
    icon: '💩',
    category: 'playing',
    hidden: true,
    hint: 'A corgi with three adventures, and something soft in each.',
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
  { id: 'watch-seek', title: 'Skip ahead', desc: 'Jumped around a walkthrough with its seek bar.', icon: '⏭️', category: 'watching' },
  { id: 'watch-bot', title: 'Robot rerun', desc: 'Watched a walkthrough the 🤖 walkthrough bot made, as far as it got.', icon: '📽️', category: 'watching' },
  { id: 'record-video', title: 'Rolling', desc: 'Recorded a video of the screen.', icon: '🎥', category: 'watching' },
  { id: 'download-mp4', title: 'Director’s cut', desc: 'Downloaded a walkthrough as an MP4 video.', icon: '🎞️', category: 'watching' },

  // the desk
  { id: 'desk-power', title: 'Power on', desc: 'Switched on the 1994 PC.', icon: '🔌', category: 'desk' },
  { id: 'desk-gm', title: 'C:\\GM>', desc: 'Ran Game-Maker from DOS.', icon: '⌨️', category: 'desk' },
  { id: 'desk-bbs', title: 'Handshake', desc: 'Dialed The Sofa BBS on the modem.', icon: '📞', category: 'desk' },
  { id: 'desk-bbs-file', title: 'Downloading…', desc: 'Downloaded a file from the BBS.', icon: '📥', category: 'desk' },
  {
    id: 'bbs-every-speed',
    title: 'Every speed on the dial',
    desc: 'Connected to a BBS at every modem speed, from 300 baud to 56 kbps.',
    icon: '📶',
    category: 'desk',
    of: MODEM_SPEEDS.length,
    items: MODEM_SPEEDS,
    unit: 'speeds',
  },
  {
    id: 'bbs-download-every-speed',
    title: 'The long way round',
    desc: 'Downloaded a whole file from a BBS at every modem speed, start to finish, without skipping.',
    icon: '🐢',
    category: 'desk',
    of: MODEM_SPEEDS.length,
    items: MODEM_SPEEDS,
    unit: 'speeds',
  },
  { id: 'bbs-time-travel', title: 'Time traveler', desc: 'Traveled through time to finish a slow download.', icon: '⏩', category: 'desk' },
  { id: 'bbs-cant-wait', title: 'I can’t wait', desc: 'Switched to a faster modem in the middle of a call.', icon: '🚀', category: 'desk' },
  { id: 'bbs-got-time', title: 'I’ve got time', desc: 'Switched to a slower modem in the middle of a call.', icon: '🐌', category: 'desk' },
  { id: 'bbs-door', title: 'Play by modem', desc: 'Finished a game of tic-tac-toe in a BBS door, one move a call.', icon: '⭕', category: 'desk' },
  {
    id: 'bbs-door-win',
    title: 'Three in a row',
    desc: 'Beat SCROLLMASTER at tic-tac-toe by modem.',
    icon: '❌',
    category: 'desk',
    hidden: true,
    hint: 'Somebody on the Sandbox is waiting for your move.',
  },
  {
    id: 'bbs-door-three',
    title: 'Best of three',
    desc: 'Played three games of tic-tac-toe by modem, rematches and all.',
    icon: '🔁',
    category: 'desk',
    of: 3,
    unit: 'games',
  },
  { id: 'sofa-busy', title: 'All lines are busy', desc: 'Got a busy signal calling The Sofa BBS. Keep trying!', icon: '📵', category: 'desk' },
  { id: 'sofa-chat', title: 'Couch talk', desc: 'Said something in The Sofa’s teleconference, flood and all.', icon: '🛋️', category: 'desk' },
  { id: 'tty-call', title: 'Typed hello', desc: 'Called Mrs. Novak’s TTY from TERMINAL in TDD mode.', icon: '📠', category: 'desk' },
  { id: 'tty-sk', title: 'SK SK', desc: 'Talked with Mrs. Novak on her TTY until you both signed off with SK.', icon: '👋', category: 'desk' },
  { id: 'tty-wallphone', title: 'Wrong kind of phone', desc: 'Dialed Mrs. Novak from the wall phone and heard her TTY warble.', icon: '☎️', category: 'desk' },
  { id: 'desk-time-reset', title: 'Back to now', desc: 'Set the PC’s clock back to the real time with TIME RESET.', icon: '⏰', category: 'desk' },
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
  {
    id: 'desk-egg-pages',
    title: 'Turn the page',
    desc: 'Opened the tin heart ledger and the score trophies’ page in EGG.EXE.',
    icon: '🗃️',
    category: 'desk',
    hidden: true,
    hint: 'An unlisted program has more than one page.',
    of: 2,
    items: ['hearts', 'trophies'],
    unit: 'pages',
  },
  { id: 'desk-gamepad', title: 'Press start', desc: 'Pushed the d-pad or a button on the GRAVITAS GamePad.', icon: '🕹️', category: 'desk' },
  { id: 'desk-mousepad', title: 'Square deal', desc: 'Put a new print on the desk’s mouse pad from the Square Deal Pad Co. ad.', icon: '🖱️', category: 'desk' },
  { id: 'desk-soundcard', title: 'Beep mode', desc: 'Switched the Sound Boaster off, for PC speaker beeps.', icon: '🔇', category: 'desk' },
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
  { id: 'print-level-maps', title: 'Map reader', desc: 'Opened a game’s Level Maps.', icon: '🧭', category: 'fun' },
  { id: 'print-world-map', title: 'Fold-out', desc: 'Unfolded a game’s World Map.', icon: '🗺️', category: 'fun' },
  {
    id: 'print-world-styles',
    title: 'Cartographer',
    desc: 'Unfolded a World Map in each of its seven styles, from star chart to floor plan.',
    icon: '📐',
    category: 'fun',
    of: WORLD_MAP_STYLES.length,
    items: WORLD_MAP_STYLES,
    unit: 'styles',
  },
  { id: 'library-visit', title: 'Quiet, please', desc: 'Visited the Library.', icon: '🏛️', category: 'fun' },
  {
    id: 'library-kinds',
    title: 'Well read',
    desc: 'Opened something of every kind on the Library’s shelves.',
    icon: '📚',
    category: 'fun',
    of: LIBRARY_KINDS.length,
    items: LIBRARY_KINDS,
    unit: 'kinds',
  },
  { id: 'mag-back', title: 'Cover to cover', desc: 'Turned TURBO BUTTON all the way to its back cover.', icon: '🗞️', category: 'fun' },
  {
    id: 'mag-features',
    title: 'Dog-eared',
    desc: 'Read Readers’ Picks, What Players Hate, Bugs Only DOS Could Find and the Shareware Shelf in TURBO BUTTON.',
    icon: '📑',
    category: 'fun',
    of: MAG_FEATURES.length,
    items: MAG_FEATURES,
    unit: 'features',
  },
  {
    id: 'mag-disc',
    title: 'Free CD-ROM inside!',
    desc: 'Opened the CD-ROM on TURBO BUTTON’s cover and found the original Game-Maker source.',
    icon: '💿',
    category: 'fun',
  },
  { id: 'offline-copy', title: 'Off the grid', desc: 'Kept a copy of the whole site for playing offline.', icon: '📴', category: 'fun' },
  { id: 'link-in', title: 'Special delivery', desc: 'Opened a game sent from another site.', icon: '📬', category: 'fun' },

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
    desc: 'Caught THE\u00a0CHEZ driving past the window and got a honk from Doc Leo.',
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
    id: 'desk-mailjeep',
    title: 'Mail call',
    desc: 'Caught the mail jeep driving off after bringing your registration reply.',
    icon: '🚙',
    category: 'found',
    hidden: true,
    hint: 'What goes out in the mail comes back the same way.',
  },
  {
    id: 'desk-mail',
    title: 'You’ve got mail… the paper kind',
    desc: 'Opened the envelope a dog pushed under the bedroom door.',
    icon: '✉️',
    category: 'found',
    hidden: true,
    hint: 'Register by mail, then keep an eye on the door.',
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
  {
    id: 'desk-light',
    title: 'Who turned on the lights?',
    desc: 'Flipped the overhead light switch on the wall.',
    icon: '🔆',
    category: 'found',
    hidden: true,
    hint: 'Somewhere on the wall, a switch is waiting.',
  },
  {
    id: 'desk-glance',
    title: 'Caught looking',
    desc: 'Caught Doc Leo glancing aside and smiling on his velvet poster.',
    icon: '😉',
    category: 'found',
    hidden: true,
    hint: 'Keep an eye on the velvet poster. Now and then it looks back.',
  },
  {
    id: 'desk-lume',
    title: 'Glow in the dark',
    desc: 'Saw the wall clock’s lume paint glowing in the dark room.',
    icon: '🟢',
    category: 'found',
    hidden: true,
    hint: 'Some paint keeps shining after the lights go out.',
  },
  {
    id: 'desk-egg-uv',
    title: 'Secret ink',
    desc: 'Saw hidden ink glow on the felt eggs under the black light.',
    icon: '🔦',
    category: 'found',
    hidden: true,
    hint: 'Some things only show under the right light.',
  },
  {
    id: 'zine-read',
    title: 'Read all about it',
    desc: 'Read NO CARRIER #3 to its last page.',
    icon: '📓',
    category: 'found',
    hidden: true,
    hint: 'The underground press runs more than one page.',
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
