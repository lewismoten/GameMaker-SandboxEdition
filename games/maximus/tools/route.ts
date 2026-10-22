// The winning route through Maximus, played by a bot on the real engine (tools/live.ts):
// across the training deck, out to the Cradle, down to each star-shard world in turn (and
// Little Hollow for the Plasma Lance the Guardian needs), up each sector's jump ring, through
// the Maelstrom and the Citadel to the Heart. It never goes near the knot of asteroids where
// the chart's corners meet (the felt egg is in there): every route is planned with that
// corner of the chart walled off.
import { buildGame, type Built, type SceneInfo } from '../src/game';
import { ITEM_BASE, SCAN, SHARD_BASE, SHARD_COUNTER, SHARDS } from '../src/ids';
import { SCENE } from '../src/universe';
import { idx, seek, wrap, type P, type SeekOpts } from './drive';
import type { Live } from './live';

export interface Stop {
  scene: number;
  title: string;
}

/** The knot where the galaxy chart's corners meet (src/levels/spacemaps.ts): kept well clear of. */
const KNOT = { x: 0, y: 99, r: 9 };
/** Top up at a healing spring when below this many hit points, to this many. */
const HEAL_BELOW = 150;
const HEAL_TO = 300;

export class Route {
  readonly b: Built = buildGame();
  log: (msg: string) => void = (m) => console.log(m);
  /** Chapter marks, in the order play first enters their scenes. */
  readonly chapters: Stop[] = [];
  trace = false;

  constructor(readonly d: Live) {}

  info(scene: number): SceneInfo {
    return this.b.scenes.find((s) => s.scene === scene)!;
  }

  links(scene: number) {
    return this.d.s.game.scenes[scene].links;
  }

  chapter(scene: number, title: string): void {
    if (!this.chapters.some((c) => c.scene === scene)) this.chapters.push({ scene, title });
  }

  /** Map cells near any link of `scene` but `keep` (touching one would take it). */
  avoidLinks(scene: number, keep: number): (x: number, y: number) => boolean {
    const bad = new Set<number>();
    this.links(scene).forEach((l, i) => {
      if (i === keep || l.toScene === 0xffff) return;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) bad.add(idx(l.from.x + dx, l.from.y + dy));
    });
    const galaxy = scene === SCENE.galaxy;
    return (x, y) => bad.has(idx(x, y)) || (galaxy && Math.abs(wrap(x - KNOT.x)) <= KNOT.r && Math.abs(wrap(y - KNOT.y)) <= KNOT.r);
  }

  /** Shard gates the pod may pass: the ones it carries the shard for. */
  shardGates(): (b: number) => boolean {
    const ci = this.d.w.ci;
    return (n) => n >= SHARD_BASE && n < SHARD_BASE + 10 && ci.meter[SHARD_COUNTER + n - SHARD_BASE] > 0;
  }

  status(what: string): void {
    const d = this.d;
    const ci = d.w.ci;
    const shards = ci.meter.slice(SHARD_COUNTER, SHARD_COUNTER + 10).join('');
    this.log(`${(d.ticks / 18.2).toFixed(0).padStart(5)} s  ${what}: hp ${ci.hitpts} lives ${ci.lives} credits ${ci.meter[3] - 1} shards ${shards} deaths ${d.deaths}`);
  }

  private opts(o: SeekOpts): SeekOpts {
    return this.trace ? { log: this.log, ...o } : o;
  }

  /**
   * Plays `scene` until `leave` takes a link out of it, starting over (as the engine does)
   * after a death. `leave` is run again each time the scene starts.
   */
  async inScene(scene: number, leave: () => Promise<void>, tries = 4): Promise<number> {
    const d = this.d;
    for (let attempt = 0; attempt < tries; attempt++) {
      await leave();
      if (d.dead) {
        this.status(`lost a life in ${this.d.s.game.scenes[scene].desc}`);
        await d.enter(scene);
        continue;
      }
      if (d.link >= 0) return d.sceneNow;
      throw new Error(`scene ${scene}: the bot stopped at ${d.pos.bx},${d.pos.by} without leaving`);
    }
    throw new Error(`scene ${scene}: too many lives lost`);
  }

  /** Flies the pod in `scene` to its link `link` and waits for the scene it leads to. */
  async flyLink(scene: number, link: number, maxTicks = 5000): Promise<number> {
    const d = this.d;
    const l = this.links(scene)[link];
    await this.inScene(scene, async () => {
      await seek(d, l.from, this.opts({ mode: 'fly', tall: 1, avoid: this.avoidLinks(scene, link), passable: this.shardGates(), maxTicks }));
    });
    await d.enter(l.toScene);
    return l.toScene;
  }

  async home(): Promise<void> {
    const d = this.d;
    await d.enter(SCENE.home);
    this.chapter(SCENE.home, 'Maxima Station');
    // the training deck: hold right, hop when stuck
    d.press(SCAN.right);
    let last = d.pos.x;
    let stuck = 0;
    for (let t = 0; t < 1500 && d.link < 0; t++) {
      await d.tick();
      if (d.link >= 0) break;
      stuck = d.pos.x === last ? stuck + 1 : 0;
      last = d.pos.x;
      if (stuck > 2) {
        d.press(SCAN.up);
        await d.tick();
        d.release(SCAN.up);
        stuck = 0;
      }
    }
    await d.enter(SCENE.galaxy);
    this.chapter(SCENE.galaxy, 'The Galaxy');
    this.status('the galaxy');
  }

  has(info: SceneInfo): boolean {
    const ci = this.d.w.ci;
    return info.shard !== undefined ? ci.meter[SHARD_COUNTER + info.shard] > 0 : ci.inv.includes(ITEM_BASE + info.module!);
  }

  /** Lands on world `scene` from its sector chart, takes its prize, and goes back up. */
  async world(sector: number, scene: number): Promise<void> {
    const d = this.d;
    const sc = SCENE.sector(sector);
    const link = this.links(sc).findIndex((l) => l.toScene === scene);
    await this.flyLink(sc, link);
    const info = this.info(scene);
    const prize = info.shard !== undefined ? `the ${SHARDS[info.shard]} shard` : 'a module';
    this.chapter(scene, info.name);
    this.status(`landed on ${info.name} for ${prize}`);
    const tall = info.chr === 'courier' ? 2 : 1;
    const mode = info.chr === 'courier' ? 'walk' : 'fly';
    await this.inScene(scene, async () => {
      if (!this.has(info)) {
        const r = await seek(d, info.vault!, this.opts({ mode, tall, passable: this.gates(info), avoid: this.avoidLinks(scene, -1), maxTicks: 8000 }));
        if (d.dead) return;
        if (!r.arrived) throw new Error(`${info.name}: the bot did not reach the vault (best ${r.best}, at ${d.pos.bx},${d.pos.by})`);
        if (info.module !== undefined) {
          d.press(SCAN.p);
          for (let i = 0; i < 8; i++) await d.tick();
          d.release(SCAN.p);
          for (let i = 0; i < 4; i++) await d.tick();
        }
        if (!this.has(info)) throw new Error(`${info.name}: the prize was not taken`);
        this.status(`took ${prize}`);
      }
      await this.heal(info);
      if (d.dead) return;
      await seek(d, this.links(scene)[0].from, this.opts({ mode, tall, passable: this.gates(info), maxTicks: 8000 }));
    });
    await d.enter(sc);
    this.status('back in orbit');
  }

  /**
   * A healing spring (one on every surface world) mends a hit point a tick for as long as the
   * courier stands in it: on the way out, a courier that has been knocked about tops up there.
   */
  async heal(info: SceneInfo, below = HEAL_BELOW, upTo = HEAL_TO): Promise<void> {
    const d = this.d;
    const s = this.b.sets[info.bbl];
    if (!s.has('heal') || d.w.ci.hitpts >= below) return;
    const id = s.id('heal');
    const i = d.w.map.findIndex((n) => n === id);
    if (i < 0) return;
    const spring = { x: i % 100, y: Math.floor(i / 100) };
    const r = await seek(d, spring, this.opts({ mode: 'walk', tall: 2, passable: this.gates(info), avoid: this.avoidLinks(info.scene, -1), maxTicks: 1500 }));
    if (!r.arrived || d.dead) return;
    const hp0 = d.w.ci.hitpts;
    let last = hp0;
    let flat = 0;
    for (let t = 0; t < 600 && d.w.ci.hitpts < upTo && !d.dead && d.link < 0; t++) {
      await d.tick();
      flat = d.w.ci.hitpts > last ? 0 : flat + 1;
      last = d.w.ci.hitpts;
      if (flat > 20) break;
    }
    this.status(`healed ${hp0} -> ${d.w.ci.hitpts} at the spring`);
  }

  /** Doors (two cells, 10 credits each: only with 20 to spend) and force fields (wait for them to blink off). */
  gates(info: SceneInfo): (b: number) => boolean {
    const s = this.b.sets[info.bbl];
    const ids = ['field:on', 'field:on2', 'field:off'].filter((n) => s.has(n)).map((n) => s.id(n));
    if (this.d.w.ci.meter[3] - 1 >= 20 && s.has('door')) ids.push(s.id('door'));
    return (b) => ids.includes(b);
  }

  async jump(sector: number): Promise<void> {
    await this.flyLink(SCENE.sector(sector), 19);
  }
}

export type { P };
