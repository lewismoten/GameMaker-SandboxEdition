// The guided tour's data: chapters of steps, each step one line said by one host while another
// (or the same one) walks to a real control on the page and points at it or presses it. Plain
// data, no DOM, so chapters are easy to add and tests can read them (tourData.test.ts). The
// hosts and props are the regulars' own sprites (public/cast/sprites.json, made from the games'
// files by scripts/castSprites.ts); the sounds and music are a Sandbox game's own files.

/** The page a chapter plays on (tourPages.ts pageOf works it out from the address). */
export type PageKey = 'home' | 'guide' | 'library' | 'achievements' | 'cast' | 'credits' | 'magazine' | 'editor' | 'mac' | 'windows' | 'linux' | 'desk' | 'dos';

/** Who can host or appear: sprites in public/cast/sprites.json from Sandbox games (never a secret game's). */
export const HOSTS = {
  // Teddy barks (his own woof sound), so his lines get no recorded voice
  teddy: { name: 'Teddy', game: 'teddy', scale: 3, voiced: false },
  gwinn: { name: 'Gwinn', game: 'teddy2', scale: 3, voiced: true },
  leo: { name: 'Doc Leo', game: 'teddy', scale: 2, voiced: true },
} as const;
export type HostId = keyof typeof HOSTS;

/** Things that can wander through a step (a game's monster or object). */
export const PROPS = {
  chicken: { game: 'teddy2', scale: 3 },
  doghouse: { game: 'teddy', scale: 2 },
  'prop:hat': { game: 'teddy', scale: 3 },
  'prop:nose': { game: 'teddy', scale: 3 },
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
} as const;
export type SoundId = keyof typeof SOUNDS;

/** Background music: a Sandbox game's .CMF song, played quietly on the site's OPL2 ('game/file.cmf'). */
export const MUSIC = {
  teddyTitle: 'teddy/title.cmf',
  teddyPark: 'teddy/park.cmf',
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
  /** A press really clicks the control: only where that is harmless (it opens a menu, picks another game). */
  click?: boolean;
  /** Left out, rather than said with nothing to point at, when its target isn't on the page. */
  optional?: boolean;
  /** Something from a game that wanders through: across the screen, or over to the target. */
  prop?: { id: PropId; run: 'across' | 'drop' };
}

export interface Chapter {
  /** Lowercase [a-z0-9-]: the folder of its voice clips. */
  id: string;
  /** The page in a word or two, for the voice clips' list ("Home"). */
  place: string;
  /** On its title card and in the tour's menus. */
  title: string;
  page: PageKey;
  /** The address that shows the page. */
  hash: string;
  /** Waited for before the first step (the page has drawn). */
  ready: string;
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
