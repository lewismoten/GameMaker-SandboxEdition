// Plays a walkthrough (format.ts) on the real engine, deterministically: the Machine runs on
// a clock of its own that moves 1/60 s a frame, nobody's keys or mouse reach the game, and
// the monsters' random numbers are seeded as the bot's simulator seeded them. The same run
// is watched in the browser, rendered into an MP4 faster than real time, and checked in Node
// (games/kit/walkthrough.ts), and comes out the same each time.
//
// The front end follows PLAYGAME's runGame (engine/game.ts): the title and its song, the
// menu, where the walkthrough reads the storyline and then picks Play, every level through
// play() as a demo plays them, the ending and score table, and back on the menu the credits.
import { Machine } from '../engine/machine';
import { Recorder } from '../engine/recorder';
import { gameNameOf, loadGameFile, play } from '../engine/game';
import { sceneFile, type Session } from '../engine/scene';
import { drawDefaultScreen, gVertMenu } from '../engine/menus';
import { match, RGB_BLUE, showGraphic } from '../engine/showGraphic';
import { newCharInfo } from '../engine/world';
import { AudioEngine } from '../audio/engine';
import { PALETTE_SIZE } from '../formats/palette';
import type { RecordedKey } from '../formats/recording';
import type { GameFiles } from '../project/files';
import { DEFAULT_HOLD, decodeKeys, WALKTHROUGH_FPS, type Walkthrough } from './format';

/** Mulberry32, the generator games/kit/pixels.ts seeds the simulators with. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type AudioEvent =
  | { t: number; kind: 'song'; bytes?: Uint8Array }
  | { t: number; kind: 'stopSong' }
  | { t: number; kind: 'pause'; paused: boolean }
  | { t: number; kind: 'speaker'; freqs: ArrayLike<number> }
  | { t: number; kind: 'stopSpeaker' }
  | { t: number; kind: 'voc'; bytes?: Uint8Array }
  | { t: number; kind: 'stopVoc' };

/**
 * The game's sound, also written down with the walkthrough clock's time (for the video's
 * soundtrack, audioRender.ts). It plays out loud only once resume() has been called.
 */
export class WalkAudio extends AudioEngine {
  readonly events: AudioEvent[] = [];
  /** Keep the events (a video being made); a player that only listens leaves this off. */
  logging = false;
  now: () => number = () => 0;
  private song?: Uint8Array;
  private muted = false;

  private log(e: AudioEvent): void {
    if (this.logging) this.events.push(e);
  }

  override async playSong(bytes: Uint8Array | undefined): Promise<boolean> {
    this.log({ t: this.now(), kind: 'song', bytes });
    this.song = bytes;
    return super.playSong(bytes);
  }

  override stopSong(): void {
    this.log({ t: this.now(), kind: 'stopSong' });
    this.song = undefined;
    super.stopSong();
  }

  override pauseMusic(paused: boolean): void {
    this.log({ t: this.now(), kind: 'pause', paused });
    super.pauseMusic(paused || this.muted);
  }

  override playSpeaker(freqs: ArrayLike<number>): void {
    if (!this.soundEnabled) return;
    this.log({ t: this.now(), kind: 'speaker', freqs });
    if (!this.muted) super.playSpeaker(freqs);
  }

  override stopSpeaker(): void {
    this.log({ t: this.now(), kind: 'stopSpeaker' });
    super.stopSpeaker();
  }

  override playVoc(bytes: Uint8Array | undefined): boolean {
    if (!this.soundEnabled) return false;
    this.log({ t: this.now(), kind: 'voc', bytes });
    return this.muted ? false : super.playVoc(bytes);
  }

  override stopVoc(): void {
    this.log({ t: this.now(), kind: 'stopVoc' });
    super.stopVoc();
  }

  /** Starts the sound (from a click): the song playing now starts over, as it can't be joined midway. */
  async start(): Promise<void> {
    const fresh = !this.context;
    await this.resume();
    if (fresh && this.song && !this.muted) await super.playSong(this.song);
  }

  /** Silences the music and effects (the music waits where it is). */
  setMuted(muted: boolean): void {
    this.muted = muted;
    super.pauseMusic(muted);
    if (muted) {
      super.stopSpeaker();
      super.stopVoc();
    }
  }
}

/** The PC the walkthrough plays on: its own clock, no live input, "hit any key" screens held `hold` seconds. */
export class WalkMachine extends Machine {
  time = 0;
  /** Called when the game asks for the next frame (it is idle until then). */
  asked?: () => void;
  private keys: { at: number; scan: number }[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    files: GameFiles,
    audio: AudioEngine,
    readonly hold: number,
  ) {
    super(canvas, files, audio, { frames: 'manual', input: false });
  }

  override now(): number {
    return this.time;
  }

  override frame(): Promise<void> {
    const p = super.frame();
    this.asked?.();
    return p;
  }

  override pauseTimeKey(seconds = Infinity) {
    return super.pauseTimeKey(Math.min(seconds, this.hold));
  }

  /** Presses (and lets go of) a key `ms` from now, as someone at the menu would. */
  pressIn(ms: number, scan: number): void {
    this.keys.push({ at: this.time + ms, scan });
  }

  /** Sends the keys whose time has come. */
  typeDue(): void {
    while (this.keys.length && this.keys[0].at <= this.time) {
      const { scan } = this.keys.shift()!;
      this.keyboard.inject(scan, true);
      this.keyboard.inject(scan, false);
    }
  }
}

/** Plays each segment's keys from the tick its scene is entered (format.ts). */
export class SegmentRecorder extends Recorder {
  private segments: { scene: number; keys: RecordedKey[] }[];
  private nextSegment = 0;
  private segKeys: RecordedKey[] = [];
  private segIndex = 0;
  private segTicks = 0;
  private segLast = 0;

  constructor(walk: Walkthrough) {
    super();
    this.segments = walk.segments.map((s) => ({ scene: s.scene, keys: decodeKeys(s.keys) }));
  }

  /** Play starts: a demo playing (no high score is asked for). */
  begin(): void {
    this.initPlayback(new Uint8Array(0));
  }

  enterScene(scene: number): void {
    const seg = this.segments[this.nextSegment];
    if (!seg || seg.scene !== scene) return;
    this.nextSegment++;
    this.segKeys = seg.keys;
    this.segIndex = 0;
    this.segTicks = 0;
    this.segLast = 0;
  }

  /** Keys still to come in all (0 once the walkthrough has played every key). */
  get keysLeft(): number {
    return this.segKeys.length - this.segIndex + this.segments.slice(this.nextSegment).reduce((n, s) => n + s.keys.length, 0);
  }

  override doPlayback(): number[] {
    const out = super.doPlayback();
    if (this.halted || !this.playing) return out;
    this.segTicks++;
    while (this.segIndex < this.segKeys.length && this.segLast + this.segKeys[this.segIndex].delta <= this.segTicks) {
      out.push(this.segKeys[this.segIndex].key);
      this.segLast += this.segKeys[this.segIndex].delta;
      this.segIndex++;
    }
    return out;
  }
}

export interface WalkHooks {
  /** A chapter starts (index into the chapters as they come: the opening, the story, the game's, the ending, the credits). */
  onChapter?: (title: string) => void;
  onSession?: (s: Session) => void;
}

const SCAN_UP = 72;
const SCAN_DOWN = 80;
const SCAN_ENTER = 28;

/** The chapters the front end adds around the game's own. */
export const FRONT_CHAPTERS = { opening: 'Opening', story: 'Story', ending: 'Ending', credits: 'Credits' };

/** The walkthrough itself: PLAYGAME's front end (runGame) with a viewer who knows what to pick. */
export async function runWalkthrough(m: WalkMachine, gamFile: string, walk: Walkthrough, hooks: WalkHooks = {}): Promise<void> {
  const game = loadGameFile(m, gamFile);
  const rec = new SegmentRecorder(walk);
  const shared = seeded(walk.rand.seed);
  const marks = new Map(walk.chapters.map((c) => [c.scene, c.title]));
  const chapter = (title: string) => hooks.onChapter?.(title);
  const s: Session = {
    m,
    game,
    gameName: gameNameOf(gamFile),
    ci: newCharInfo(),
    colors: new Uint8Array(PALETTE_SIZE),
    rec,
    sndClock: 1,
    timerCounter: 1,
    soundOn: true,
    musicOn: m.audio.musicEnabled,
    speakerOnly: false,
    speed: {},
    rand: () => (walk.rand.per === 'scene' ? seeded(walk.rand.seed) : shared),
    onScene: (scene) => {
      rec.enterScene(scene);
      if (scene === 1) return chapter(FRONT_CHAPTERS.ending);
      const title = marks.get(scene);
      if (title !== undefined) {
        marks.delete(scene);
        chapter(title || game.scenes[scene]?.desc || `Scene ${scene}`);
      }
    },
  };
  hooks.onSession?.(s);
  const file = (scene: number, slot: number) => sceneFile(game, scene, slot);
  const show = (f: string, cols?: Uint8Array, pause?: number) => showGraphic(m, f, { cols, pause, gamePalette: s.colors });
  const song = async (slot: number) => {
    await m.need(file(0, slot));
    await m.audio.playSong(m.files.get(file(0, slot) ?? ''));
  };

  // The title (with the Sandbox logo and the opening cartoons)
  chapter(FRONT_CHAPTERS.opening);
  m.want(file(0, 0), file(0, 2), file(0, 3));
  await song(1);
  if (file(0, 0)) await show(file(0, 0)!);

  // The menu, as runGame draws it
  let choice = 1;
  const menu = async () => {
    if (file(0, 2)) await show(file(0, 2)!, s.colors, 0);
    else drawDefaultScreen(m, s.colors);
    const blue = match(s.colors, RGB_BLUE);
    m.screen.write(12 * 8, 13 * 8, blue, game.scenes[0].desc);
    ['Play', 'Read Instructions', 'Read Storyline', 'See Credits', 'See Highest Scores', 'Quit'].forEach((t, i) => m.screen.write(80, (15 + i) * 8, blue, t));
    return m.screen.snapshot();
  };
  /** Moves the menu's marker to `to` a key at a time and picks it. */
  const pick = async (to: number) => {
    let at = 1200;
    for (let c = choice; c !== to; c += to > choice ? 1 : -1, at += 450) m.pressIn(at, to > choice ? SCAN_DOWN : SCAN_UP);
    m.pressIn(at + 500, SCAN_ENTER);
    const blue = match(s.colors, RGB_BLUE);
    choice = await gVertMenu(m, 70, 15 * 8 + 1, 8, 6, blue, Infinity, choice);
  };

  await song(3);
  let screen = await menu();
  if (walk.story !== false && file(0, 4)) {
    await pick(3);
    chapter(FRONT_CHAPTERS.story);
    m.screen.restore(screen);
    await song(5);
    await show(file(0, 4)!);
    await song(3);
    screen = await menu();
  }
  await pick(1);
  m.audio.stopSong();
  rec.begin();
  await play(s, 0);

  // Back on the menu: the credits
  if (file(0, 7)) {
    await song(3);
    choice = 1;
    screen = await menu();
    await pick(4);
    chapter(FRONT_CHAPTERS.credits);
    m.screen.restore(screen);
    await show(file(0, 7)!);
  }
  m.audio.stopSong();
  await m.fadeAllTo(0, 0, 0);
}

/**
 * Steps a walkthrough frame by frame. Each step moves the clock one frame (1/60 s, or more
 * for a fast skip ahead) and lets the game run until it waits for the next frame.
 */
export class WalkRun {
  readonly m: WalkMachine;
  readonly audio: WalkAudio;
  frame = 0;
  done = false;
  error?: unknown;
  session?: Session;
  /** Chapters reached so far, with the frame each began on. */
  readonly chapters: { title: string; frame: number }[] = [];
  onChapter?: (title: string, index: number) => void;
  private ended: Promise<void>;
  private started?: Promise<void>;

  constructor(
    canvas: HTMLCanvasElement,
    files: GameFiles,
    readonly gam: string,
    readonly walk: Walkthrough,
    audio = new WalkAudio(),
  ) {
    this.audio = audio;
    this.m = new WalkMachine(canvas, files, audio, walk.hold ?? DEFAULT_HOLD);
    audio.now = () => this.m.time;
    let resolve!: () => void;
    this.ended = new Promise((r) => (resolve = r));
    this.ended.then(() => (this.done = true));
    this.run = () =>
      runWalkthrough(this.m, gam, walk, {
        onSession: (s) => (this.session = s),
        onChapter: (title) => {
          this.chapters.push({ title, frame: this.frame });
          this.onChapter?.(title, this.chapters.length - 1);
        },
      })
        .catch((e) => {
          if (!this.m.aborted) this.error = e;
        })
        .finally(resolve);
  }

  private run: () => Promise<void>;

  /** Waits until the game asks for a frame (or ends). */
  private idle(start: () => void): Promise<void> {
    const asked = new Promise<void>((r) => (this.m.asked = r));
    start();
    return Promise.race([asked, this.ended]);
  }

  /** Starts the game; resolves once it waits for its first frame. */
  start(): Promise<void> {
    this.started ??= this.idle(() => void this.run());
    return this.started;
  }

  /** One frame: `ms` of game time (1000/60 by default); `show` paints the screen's canvas. */
  async step(show = true, ms = 1000 / WALKTHROUGH_FPS): Promise<boolean> {
    await this.start();
    if (this.done) return false;
    this.frame++;
    this.m.time += ms;
    this.m.typeDue();
    await this.idle(() => this.m.presentFrame(show));
    return !this.done;
  }

  /** The time the game has played, in ms. */
  get time(): number {
    return this.m.time;
  }

  stop(): void {
    this.m.destroy();
  }
}

/** One frame of the screen as RGBA (for the video). */
export function screenRgba(m: Machine, out = new Uint8ClampedArray(320 * 200 * 4)): Uint8ClampedArray {
  const px = m.screen.pixels;
  const pal = m.screen.palette;
  const lut = new Uint8Array(768);
  // the VGA's 6-bit levels to 8 bits, as the screen shows them
  for (let i = 0; i < 768; i++) lut[i] = (pal[i] << 2) | (pal[i] >> 4);
  for (let i = 0, o = 0; i < px.length; i++, o += 4) {
    const c = px[i] * 3;
    out[o] = lut[c];
    out[o + 1] = lut[c + 1];
    out[o + 2] = lut[c + 2];
    out[o + 3] = 255;
  }
  return out;
}

/** A stand-in canvas for running without a page (Node checks): the screen only needs a 2D context to put pixels in. */
export function headlessCanvas(): HTMLCanvasElement {
  const ctx = {
    createImageData: (w: number, h: number) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: () => undefined,
  };
  return {
    width: 320,
    height: 200,
    getContext: () => ctx,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 320, height: 200 }),
  } as unknown as HTMLCanvasElement;
}
