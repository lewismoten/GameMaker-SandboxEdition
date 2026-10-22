// Plays Maximus on the REAL engine (web/src/walkthrough/runtime.ts, the walkthrough's own
// front end and virtual clock) with a bot at the keys: the bot looks at the live world after
// every game tick and decides what to press, and every key it presses is written down at the
// tick it reached the game, one segment each time play enters a scene. Played back from
// those segments, the run comes out the same, since nothing else differs.
import { encodeKeys, keysAt, WALKTHROUGH_FPS, type Walkthrough, type WalkSegment } from '../../../web/src/walkthrough/format';
import { headlessCanvas, WalkRun } from '../../../web/src/walkthrough/runtime';
import type { World } from '../../../web/src/engine/world';
import type { Block } from '../../../web/src/formats/blocks';
import type { Session } from '../../../web/src/engine/scene';
import { diskFiles } from '../../kit/walkthrough';

/** What a bot sees and does (the shape of tools/sim.ts's Sim that the drivers use). */
export interface Driver {
  readonly w: World;
  readonly scene: { bbl: Block[] };
  /** Set once the scene has been left by a link (or the courier died): the drivers stop. */
  link: number;
  dead: boolean;
  ticks: number;
  press(scan: number): void;
  release(scan: number): void;
  tick(): Promise<void>;
  readonly pos: { x: number; y: number; bx: number; by: number };
}

export class Live implements Driver {
  readonly run: WalkRun;
  s!: Session;
  /** The scene playing now and how many times play entered a scene. */
  scene_ = -1;
  entries = 0;
  deaths = 0;
  ticks = 0;
  link = -1;
  dead = false;
  segments: { scene: number; events: { tick: number; key: number }[] }[] = [];
  private segTicks = 0;
  private queue: number[] = [];
  private held = new Set<number>();
  private ticked = false;
  private waiter?: () => void;
  log: (msg: string) => void = (m) => console.log(m);
  /** Called after every game tick, before the bot sees it (for tracing). */
  onTick?: () => void;

  /** `patch` may change the disk's files first (for trying one level on its own while working on the bot). */
  constructor(
    readonly walk: Walkthrough,
    patch?: (files: ReturnType<typeof diskFiles>) => void,
  ) {
    const files = diskFiles(walk.game);
    patch?.(files);
    const gam = [...files.names()].find((n) => n.endsWith('.gam'))!;
    this.run = new WalkRun(headlessCanvas(), files, gam, walk);
  }

  get w(): World {
    return this.s.lastWorld!;
  }

  get scene(): { bbl: Block[] } {
    return { bbl: this.w.bg };
  }

  get pos(): { x: number; y: number; bx: number; by: number } {
    const c = this.w.chr;
    return { x: c.x[0] * 20 + c.x[1], y: c.y[0] * 20 + c.y[1], bx: c.x[0], by: c.y[0] };
  }

  press(scan: number): void {
    if (this.held.has(scan)) return;
    this.held.add(scan);
    this.queue.push(scan);
  }

  release(scan: number): void {
    if (!this.held.has(scan)) return;
    this.held.delete(scan);
    this.queue.push(scan | 0x80);
  }

  releaseAll(): void {
    for (const k of [...this.held]) this.release(k);
  }

  /** Resolves after the engine has played the next game tick (or left the scene). */
  tick(): Promise<void> {
    return new Promise((r) => (this.waiter = r));
  }

  /** Waits until play is in `scene` and has played its first tick there. */
  async enter(scene: number, maxTicks = 2000): Promise<void> {
    for (let t = 0; t < maxTicks; t++) {
      if (this.scene_ === scene && this.segTicks >= 1) {
        this.link = -1;
        this.dead = false;
        return;
      }
      await this.tick();
    }
    throw new Error(`never reached scene ${scene} (in ${this.scene_})`);
  }

  get sceneNow(): number {
    return this.scene_;
  }

  /** Starts the game and plays `bot` to the end; returns the segments and whether play won. */
  async play(bot: (d: Live) => Promise<void>, maxMinutes = 120): Promise<{ won: boolean; frames: number; chapters: { title: string; frame: number }[] }> {
    const run = this.run;
    run.onChapter = (title) => this.log(`  ${(run.frame / WALKTHROUGH_FPS).toFixed(1).padStart(7)} s  ${title}`);
    await run.start();
    const s = run.session!;
    this.s = s;
    let won = false;
    const onScene = s.onScene!;
    s.onScene = (n) => {
      onScene(n);
      if (n === 1) won = true;
      if (n === this.scene_) {
        this.dead = true;
        this.deaths++;
      } else this.link = 0;
      this.scene_ = n;
      this.entries++;
      this.segments.push({ scene: n, events: [] });
      this.segTicks = 0;
      this.held.clear();
      this.queue = [];
      this.ticked = true;
    };
    const rec = s.rec;
    const orig = rec.doPlayback.bind(rec);
    rec.doPlayback = () => {
      const out = orig();
      if (rec.halted || !rec.playing) return out;
      this.segTicks++;
      this.ticks++;
      const seg = this.segments[this.segments.length - 1];
      for (const k of this.queue.splice(0)) {
        seg?.events.push({ tick: this.segTicks, key: k });
        out.push(k);
      }
      this.ticked = true;
      return out;
    };
    let botDone = false;
    let botError: unknown;
    void bot(this).then(
      () => (botDone = true),
      (e) => ((botError = e), (botDone = true)),
    );
    const limit = maxMinutes * 60 * WALKTHROUGH_FPS;
    const settle = async () => {
      // the bot thinks between ticks: the engine waits until it asks for the next one
      while (!this.waiter && !botDone) await new Promise((r) => setImmediate(r));
    };
    await settle();
    while (run.frame < limit && (await run.step(false))) {
      if (botError) break;
      if (this.ticked && this.waiter) {
        this.ticked = false;
        const w = this.waiter;
        this.waiter = undefined;
        this.onTick?.();
        w();
        await settle();
      }
      // the bot is done: play runs on (the ending, the credits) with no more keys
      void botDone;
    }
    run.stop();
    if (botError) throw botError;
    if (run.error) throw run.error;
    return { won, frames: run.frame, chapters: run.chapters };
  }

  /** The key segments, ready for the walkthrough file (an empty one too: entering its scene starts the count over). */
  walkSegments(): WalkSegment[] {
    return this.segments.map((s) => ({ scene: s.scene, keys: encodeKeys(keysAt(s.events)) }));
  }
}
