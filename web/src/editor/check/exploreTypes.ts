// Types for scene exploration, its search states and its findings.
import type { CharInfo, World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import type { Link } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Move } from './inputs';
import type { Snap } from './sim';

export interface ExploreOptions {
  /** Stop after this long (ms of work); the result says it was cut short. */
  budgetMs?: number;
  maxNodes?: number;
  /** Keep active-key and flight checkpoints for continuous walkthrough steering. */
  steerAirborne?: boolean;
  /** Preserve corridor alignment and mid-animation turns, including in scenes that mix gravity modes. */
  alignTurns?: boolean;
  /** Key search: preserve combat/momentum transitions and favor less explored cells. */
  resourceSearch?: boolean;
  /** Told now and then how far it has got, with the heat and deaths so far (live, not copies); return true to stop. */
  progress?: (nodes: number, queued: number, live: ExploreLive) => boolean | void;
  now?: () => number;
  /** Move every monster every tick, however far away (slower). */
  exact?: boolean;
  /** Only these of the character's moves (a bot's style: walk and hop, walk only…). */
  moveFilter?: (m: Move) => boolean;
  /** Play with steady hands: one key at a time, at least this many ticks between key changes (inputs.ts steadyMoves). */
  steadyTicks?: number;
  /** Permit ordinary steering chords and direct key changes while keeping minimum holds. */
  steadySteering?: boolean;
  /** Wait at every place, not only near lifts and timed blocks. */
  waitEverywhere?: boolean;
  /** Cells to head for: places nearer them are tried first. */
  goal?: number[];
  /**
   * With `goal`: walking paths and roads (background block numbers, walk/walkPaths.ts) to keep
   * to. The search then weighs the way so far as well as the distance left (A*, not greedy): a
   * move costs 1, and `offCost` more (1 by default) when it ends off the paths, so a way along
   * a road up to that much longer is found before one cutting across. Unset (or empty), the
   * search is exactly as without it.
   */
  paths?: { blocks: ReadonlySet<number>; offCost?: number };
  /** Stop as soon as a link this accepts is taken (a bot after the next scene). */
  stopAt?: (link: number, toScene: number) => boolean;
  /** Stop at the first place where this holds (a bot after a key: a counter has gone up); `reached` says which. */
  stopWhen?: (w: World) => boolean;
  /** Start partway through the scene: a snapshot of this scene from the same entry. */
  start?: Snap;
  /** Told the world as the hero enters and after every tick played (what the screen shows: w.mx, w.my, w.scroll). */
  onTick?: (w: World) => void;
}

/** What an exploration has found so far: its own arrays, read while it runs (the level check's live heat map). */
export interface ExploreLive {
  heat: Uint32Array;
  first: Int32Array;
  /** Deaths by cell: how many tries ended there. */
  deaths: Map<number, number>;
  /** Work done so far (ms). */
  ms: number;
}

/** Where the hero comes into the scene, and with what. */
export interface Entry {
  start: { x: number; y: number };
  ci: CharInfo;
  clock: number;
  prev?: World;
}

/** How a place was first reached: from `parent`, by move `move`, `ticks` ticks into it. */
export interface Via {
  parent: number;
  move: number;
  ticks: number;
}

/** A searchable state: settled, or moving in a walkthrough search. */
export interface Place {
  cell: number;
  /** Undefined for the place the hero enters at. */
  via?: Via;
  /** Lifts or timed blocks are near: the explorer also waits here. */
  waits: boolean;
  /** Every move was tried from here (false where the budget ran out first). */
  done: boolean;
  /** Ticks since the hero entered the scene. */
  tick: number;
  hp: number;
  snap?: Snap;
  out: number[];
  /** Links it leads to directly. */
  exits: number[];
  /** The move that brought the hero here fell more than two blocks. */
  dropIn?: number;
  /** What the hero has gathered by here: things carried, counters and score (a bot that collects). */
  worth: number;
  /** Every move tried from here ended in a death: the hero is doomed here, not stuck. */
  doomed?: boolean;
  /** In what looked like a stuck area, but a key or two held a while gets the hero out (frees()). */
  freed?: boolean;
  /** With `paths`: what the way here cost (a move 1, and more off the paths). */
  cost?: number;
}

export interface ExitReach {
  link: number;
  toScene: number;
  tick: number;
  hp: number;
  ci: CharInfo;
  clock: number;
  to: { x: number; y: number };
  world: World;
  /** The place and move that first took the hero there. */
  via: Via;
}

/** Something that went wrong in play, where it happened. */
export interface Incident {
  kind: 'death' | 'blind-drop' | 'hazard-landing' | 'hurt-lock' | 'every-tick-score' | 'every-tick-heal';
  cell: number;
  /** Where it started (a drop's edge). */
  from?: number;
  detail: string;
  /** What did it: 'block <n>' or 'monster <n>'. */
  source?: string;
}

export interface Exploration {
  scene: number;
  places: Place[];
  /** Ticks of play spent on each cell (the heat map) and the first tick it was reached (-1 never). */
  heat: Uint32Array;
  first: Int32Array;
  /** Placed monster slots the hero came within reach of. */
  monsters: Set<number>;
  exits: ExitReach[];
  /** Each link reached carrying the least (worthOf), for a run that leaves behind all it can. */
  poorExits: ExitReach[];
  incidents: Incident[];
  /** How many tries ended in a death, by cell. */
  deaths: Map<number, number>;
  /** True when every place was tried before the budget ran out. */
  complete: boolean;
  ticks: number;
  ms: number;
  /** The scene's gravity pulls somewhere (a platform game, not a top-down one). */
  gravity: boolean;
  /** The moves tried (Via.move indexes them). */
  moves: Move[];
  /** The scene's links, from the .gam file. */
  links: Link[];
  /** With `stopWhen`: the place where it first held. */
  reached?: number;
}
