// The guided tour's data: chapters of steps, each step one line said by one host while another
// (or the same one) walks to a real control on the page and points at it or presses it. Plain
// data, no DOM, so chapters are easy to add and tests can read them (tourData.test.ts). The
// hosts and props are the regulars' own sprites (public/cast/sprites.json, made from the games'
// files by scripts/castSprites.ts); the sounds and music are a Sandbox game's own files.

/** The page a chapter plays on (tourPages.ts pageOf works it out from the address). */
export type PageKey = 'home' | 'guide' | 'library' | 'achievements' | 'cast' | 'credits' | 'magazine' | 'editor' | 'mac' | 'windows' | 'linux' | 'desk' | 'dos';

/** Who can host or appear: sprites in public/cast/sprites.json from Sandbox games (never a secret game's). */
/**
 * The voice a host's lines are recorded in (scripts/narrate.ts): one of Lewis's voice samples
 * by name (kept outside the repo; cloned with Pocket TTS), or one of Kokoro's stock voices
 * ('kokoro:<voice>'), shifted `semitones` in pitch and played `tempo` times as fast. Only Doc Leo
 * sounds like Lewis himself.
 */
export interface HostVoice {
  sample: 'lewis' | 'scroobie' | 'olden-mon' | 'snooty-wiz' | 'kokoro:af_sky' | 'kokoro:af_heart' | 'kokoro:am_puck' | 'kokoro:bf_emma';
  semitones: number;
  tempo: number;
}

export const HOSTS = {
  // Teddy barks (his own woof sound), so his lines get no recorded voice; the voice is ready for when he talks
  teddy: { name: 'Teddy', game: 'teddy', scale: 3, voiced: false, voice: { sample: 'scroobie', semitones: 5, tempo: 1.12 } },
  gwinn: { name: 'Gwinn', game: 'teddy2', scale: 3, voiced: true, voice: { sample: 'kokoro:af_sky', semitones: 4, tempo: 1 } },
  leo: { name: 'Doc Leo', game: 'teddy', scale: 2, voiced: true, voice: { sample: 'lewis', semitones: 0, tempo: 1 } },
  // the Library: KEEP IT BRIEF!'s night librarian, and Snowbound's teenage Lewie
  joe: { name: 'Joe', game: 'brief', scale: 3, voiced: true, voice: { sample: 'olden-mon', semitones: 0, tempo: 1 } },
  lewie: { name: 'Lewie', game: 'snowbound', scale: 3, voiced: true, voice: { sample: 'lewis', semitones: 5, tempo: 1 } },
  // Achievements: In The Year 2000!'s Dex Dynamo
  dex: { name: 'Dex', game: 'year2000', scale: 3, voiced: true, voice: { sample: 'kokoro:am_puck', semitones: 3, tempo: 1 } },
  // the Guide: Final Curtain's Inspector Ada Penn
  ada: { name: 'Inspector Penn', game: 'sleuth', scale: 3, voiced: true, voice: { sample: 'kokoro:bf_emma', semitones: 0, tempo: 1 } },
  // Settings: Maximus's Courier Max
  max: { name: 'Max', game: 'maximus', scale: 2, voiced: true, voice: { sample: 'scroobie', semitones: 0, tempo: 1 } },
  // the editor: Ohm Sweet Ohm's repair robot
  watt: { name: 'Watt', game: 'logic', scale: 3, voiced: true, voice: { sample: 'lewis', semitones: 7, tempo: 1.05 } },
  // DOS: Quest for the Round Tuit's Professor Fiddlesticks, the inventor in Someday Harbor's garage
  fiddle: { name: 'Professor Fiddlesticks', game: 'realm', scale: 3, voiced: true, voice: { sample: 'snooty-wiz', semitones: 0, tempo: 1 } },
} satisfies Record<string, { name: string; game: string; scale: number; voiced: boolean; voice: HostVoice }>;
export type HostId = keyof typeof HOSTS;

/** Things that can wander through a step (a game's monster or object). */
export const PROPS = {
  chicken: { game: 'teddy2', scale: 3 },
  doghouse: { game: 'teddy', scale: 2 },
  'prop:hat': { game: 'teddy', scale: 3 },
  'prop:nose': { game: 'teddy', scale: 3 },
  'prop:chicken': { game: 'teddy', scale: 3 },
  rootbeer: { game: 'teddy', scale: 2 },
  easterEgg: { game: 'teddy', scale: 3 },
  tinHeart: { game: 'teddy', scale: 3 },
  // Virus Blaster's BLASTER nano-fighter, from the side
  ship: { game: 'blaster', scale: 3 },
  // THE CHEZ, driving by as it does in Quest for the Round Tuit
  chez: { game: 'realm', scale: 2 },
} as const;
export type PropId = keyof typeof PROPS;

/** Short sound effects: a Sandbox game's own digitized .VOC files ('game/file', no extension). */
export const SOUNDS = {
  woof: 'teddy/woof',
  yip: 'teddy/yip',
  boing: 'teddy/boing',
  pop: 'teddy/pop',
  blip: 'teddy/blip',
  sniff: 'teddy/sniff',
  squeak: 'teddy/squeak',
  whoosh: 'teddy/whoosh',
  sparkle: 'teddy/sparkle',
  tada: 'teddy/tada',
  giggle: 'teddy/giggle',
  honk: 'teddy/honk',
  shhh: 'brief/shhh',
  flutter: 'brief/flutter',
  ding: 'brief/ding',
  kaching: 'year2000/kaching',
  oneup: 'year2000/oneup',
  aha: 'sleuth/aha',
  hmm: 'sleuth/hmm',
  chime: 'sleuth/chime',
  creak: 'sleuth/creak',
  jet: 'maximus/jet',
  coin: 'maximus/coin',
  warp: 'maximus/warp',
  clack: 'logic/clack',
  fizzle: 'logic/fizzle',
  zap: 'blaster/zap',
  scoop: 'snowbound/scoop',
  crunch: 'snowbound/crunch',
  cocoa: 'snowbound/cocoa',
  ahooga: 'realm/ahooga',
  kazoo: 'realm/kazoo',
  fanfare: 'realm/fanfare',
  pickup: 'realm/pickup',
} as const;

/**
 * The real dogs: Lewis's recordings of Teddy and Gwinn, cut into short clips in
 * public/tour/sfx/<name>.ogg. A bark plays one of its clips at random, so it never repeats the same way.
 */
export const BARKS = {
  teddyBark: ['teddy-bark-1', 'teddy-bark-2', 'teddy-bark-3', 'teddy-bark-4', 'teddy-bark-5', 'teddy-bark-6'],
  gwinnBark: ['gwinn-bark-1', 'gwinn-bark-2'],
  teddyYawn: ['teddy-yawn'],
} as const;

export type SoundId = keyof typeof SOUNDS | keyof typeof BARKS;

/** Where a bark's clip is. */
export const barkUrl = (name: string): string => `./tour/sfx/${name}.ogg`;

/** Background music: a Sandbox game's .CMF song, played quietly on the site's OPL2 ('game/file.cmf'). */
export const MUSIC = {
  teddyTitle: 'teddy/title.cmf',
  teddyPark: 'teddy/park.cmf',
  clownClub: 'teddy/klub.cmf',
  briefLibrary: 'brief/library.cmf',
  y2kTitle: 'year2000/title.cmf',
  sleuthParlor: 'sleuth/parlor.cmf',
  maxStation: 'maximus/station.cmf',
  ohmGarage: 'logic/garage.cmf',
  snowTitle: 'snowbound/title.cmf',
  tuitMenu: 'realm/menu.cmf',
} as const;
export type MusicId = keyof typeof MUSIC;

/**
 * Where a step points: the first visible element matching `css` (tried in order, so a narrow
 * window's ⋯ menu can stand in for a header link), whose text starts with `text` if given.
 * `reveal` is clicked first when the element is hidden in a closed menu (the ⚙ button or the
 * ⋯ menu), and the tour closes it again when it moves on.
 */
export interface Target {
  /** What it is, in plain words ("the New game button"): for the voice clips' list (lines.ts). */
  label: string;
  css: string | string[];
  text?: string;
  reveal?: string | string[];
}

/**
 * - enter: the host comes on from the side of the screen;
 * - walk: walks over to the target and stands by it;
 * - point: walks over, and the target is ringed with an arrow at it;
 * - press: hops onto it (it looks pressed; it is really clicked only with `click`);
 * - say: stays put and talks;
 * - exit: walks off.
 */
export type Action = 'enter' | 'walk' | 'point' | 'press' | 'say' | 'exit';

export interface TourStep {
  /**
   * Stable and unique in the tour, lowercase [a-z0-9-] ('home-search'). A recorded voice line
   * for it, if there is one, is public/tour/voice/<chapter>/<id>.ogg (Opus): played with the
   * bubble, and the step lasts at least as long as the clip.
   */
  id: string;
  action: Action;
  /** Who moves (the chapter's `actor` if not given). */
  actor?: HostId;
  /** Who talks (the chapter's `speaker` if not given). */
  speaker?: HostId;
  target?: Target;
  /** The speech bubble: short and plain. */
  say: string;
  /** The caption line under the page (for video); "<speaker>: <say>" if not given. */
  caption?: string;
  /** A sound as the action lands. */
  sound?: SoundId;
  /** How long the step stays, in ms (worked out from the words if not given). */
  ms?: number;
  /**
   * A press really clicks the control: only where that is harmless (it opens a menu, picks
   * another game). A selector clicks it only while it matches (the desk's Power button only
   * while the PC is off, so the tour never switches it off).
   */
  click?: boolean | string;
  /** Said only in its page's own tour: the whole tour says it on another page (Settings has the theme). */
  pageOnly?: boolean;
  /** Left out, rather than said with nothing to point at, when its target isn't on the page. */
  optional?: boolean;
  /** Starts or stops the page's game preview as the action lands (previews are held still during a tour otherwise). */
  demo?: 'play' | 'stop';
  /** Something from a game that wanders through: across the screen, or over to the target. */
  prop?: { id: PropId; run: 'across' | 'drop' };
  /**
   * Another address on the chapter's page to show from this step on (the editor's palette after
   * its map): the tour goes there, waits for `ready`, and Back returns to the step's own address.
   */
  go?: { hash: string; ready: string };
}

export interface Chapter {
  /** Lowercase [a-z0-9-]: the folder of its voice clips. */
  id: string;
  /** The page in a word or two, for the voice clips' list ("Home"). */
  place: string;
  /** On its title card and in the tour's menus. */
  title: string;
  page: PageKey;
  /** The address that shows the page (on index.html; the DOS page's chapter has `file`). */
  hash: string;
  /** A page of its own, not index.html (the DOS page): the tour goes on there with a full page load. */
  file?: 'dos.html';
  /** Waited for before the first step (the page has drawn). */
  ready: string;
  /**
   * Plays at its own address even when the visitor is on another view of the same page (the
   * editor chapter shows a game as released, never the visitor's own); a tour of just this
   * page takes them back where they were when it ends.
   */
  always?: boolean;
  actor: HostId;
  speaker: HostId;
  music?: MusicId;
  steps: TourStep[];
}

/** Bubble and caption limits: a bubble must fit a phone's screen without scrolling. */
export const MAX_SAY = 150;
export const MAX_CAPTION = 170;

/** The caption for a step: its own, or the speaker's name and the line. */
export const captionOf = (chapter: Chapter, step: TourStep): string => step.caption ?? `${HOSTS[step.speaker ?? chapter.speaker].name}: ${step.say}`;

/** Where a step's recorded voice line would be (it may not exist: the bubble's timing is used then). */
export const voiceUrl = (chapter: Chapter, step: TourStep): string => `./tour/voice/${chapter.id}/${step.id}.ogg`;

/** How long a step stays when it doesn't say: time to read it, never rushed. */
export const stepMs = (step: TourStep): number => step.ms ?? Math.max(3200, 1400 + step.say.split(/\s+/).length * 330);

/** The selectors a target may match, as a list. */
export const cssList = (css: string | string[] | undefined): string[] => (css === undefined ? [] : Array.isArray(css) ? css : [css]);
