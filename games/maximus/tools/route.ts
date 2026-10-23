// The winning route through Maximus, played by a bot on the real engine (tools/live.ts):
// across the training deck, out to the Cradle, down to each star-shard world in turn (and
// Little Hollow for the Plasma Lance the Guardian needs), up each sector's jump ring, through
// the Maelstrom and the Citadel to the Heart. It never goes near the knot of asteroids where
// the chart's corners meet (the felt egg is in there): every route is planned with that
// corner of the chart walled off.
import { buildGame, type Built, type SceneInfo } from '../src/game';
import { ITEM_BASE, MODULES, SCAN, SEQ, SHARD_BASE, SHARD_COUNTER, SHARDS } from '../src/ids';
import { SCENE } from '../src/universe';
import { field, idx, seek, wrap, type Grab, type P, type SeekOpts } from './drive';
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

  /** The link cells of `scene` but `keep` (touching one would take it; the look-ahead sees when it would). */
  avoidLinks(scene: number, keep: number): (x: number, y: number) => boolean {
    const bad = new Set<number>();
    this.links(scene).forEach((l, i) => {
      if (i === keep || l.toScene === 0xffff) return;
      bad.add(idx(l.from.x, l.from.y));
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
    this.log(
      `${(d.ticks / 18.2).toFixed(0).padStart(5)} s  ${what}: hp ${ci.hitpts} lives ${ci.lives} credits ${ci.meter[3] - 1} shards ${shards} deaths ${d.deaths}`,
    );
  }

  private opts(o: SeekOpts): SeekOpts {
    return this.trace ? { log: this.log, ...o } : o;
  }

  /** Off for runs that should play the plain route (GRAB=0). */
  grabbing = process.env.GRAB !== '0';
  private tried = { entries: -1, cells: new Set<number>() };
  /** Loot taken in passing: on view, a few steps off the way; never an egg, a shard or module, or anything in a secret pocket. */
  grab(scene: number): Grab | undefined {
    if (!this.grabbing) return undefined;
    const d = this.d;
    if (this.tried.entries !== d.entries) this.tried = { entries: d.entries, cells: new Set() };
    const s = this.b.sets[this.info(scene).bbl];
    const secret = new Set(['fake', 'glass', 'rock:fake', 'egg'].filter((n) => s.has(n)).map((n) => s.id(n)));
    const bg = d.w.bg;
    const loot = (n: number) => {
      if (n >= 129 && n < 150) return false; // the egg, the shards, the modules: not loot
      const b = bg[n];
      if (!b || b.touchBl === n || b.chHitPt < 0 || (b.solid & 14) !== 0 || (b.effect > 0 && b.eamt < 0)) return false;
      return b.scorePts > 0 || b.chHitPt > 0 || (b.effect > 0 && b.eamt > 0);
    };
    return { loot, secret: (n) => secret.has(n), tried: this.tried.cells };
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
      await seek(
        d,
        l.from,
        this.opts({ mode: 'fly', tall: 1, avoid: this.avoidLinks(scene, link), passable: this.shardGates(), maxTicks, grab: this.grab(scene) }),
      );
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
  /** `heal`: top up at the spring from below this, to this (the last world before the Core fills right up). */
  async world(sector: number, scene: number, heal?: { below: number; to: number }): Promise<void> {
    const d = this.d;
    const sc = SCENE.sector(sector);
    const link = this.links(sc).findIndex((l) => l.toScene === scene);
    await this.flyLink(sc, link);
    const info = this.info(scene);
    const prize = info.shard !== undefined ? `the ${SHARDS[info.shard]} shard` : 'a module';
    this.chapter(scene, `${info.name}: ${info.shard !== undefined ? `The ${SHARDS[info.shard]} Shard` : `The ${MODULES[info.module!].name}`}`);
    this.status(`landed on ${info.name} for ${prize}`);
    await this.inScene(scene, () => this.ground(info, heal));
    await d.enter(sc);
    this.status('back in orbit');
  }

  /** Whether a route leads from the courier to `goal`, through doors or not (force fields always). */
  reaches(info: SceneInfo, goal: P, doors: boolean): boolean {
    const d = this.d;
    const s = this.b.sets[info.bbl];
    const pass = ['field:on', 'field:on2', 'field:off', ...(doors ? ['door'] : [])].filter((n) => s.has(n)).map((n) => s.id(n));
    const tall = info.chr === 'courier' ? 2 : 1;
    const open = (x: number, y: number) => {
      for (let j = 0; j < tall; j++) {
        const n = d.w.map[idx(x, y - j)];
        const b = d.w.bg[n];
        if (pass.includes(n)) continue;
        if (!((b.solid & 14) === 0 || b.solid === 1) || b.chHitPt < 0) return false;
      }
      return true;
    };
    const c = d.w.chr;
    return field(goal, open)[idx(c.x[0], c.y[0])] >= 0;
  }

  /** Picks up credit crates near the way until the courier carries `need` (a vault door takes 20). */
  async credits(info: SceneInfo, need: number, within = 45): Promise<void> {
    const d = this.d;
    const s = this.b.sets[info.bbl];
    const ids = ['p:credit', 'pc:credit'].filter((n) => s.has(n)).map((n) => s.id(n));
    const tall = info.chr === 'courier' ? 2 : 1;
    const tried = new Set<number>();
    for (let k = 0; k < 6 && d.w.ci.meter[3] - 1 < need && !d.dead; k++) {
      const c = d.w.chr;
      const open = (x: number, y: number) => {
        for (let j = 0; j < tall; j++) {
          const b = d.w.bg[d.w.map[idx(x, y - j)]];
          if (!((b.solid & 14) === 0 || b.solid === 1) || b.chHitPt < 0) return false;
        }
        return true;
      };
      const dist = field({ x: c.x[0], y: c.y[0] }, open);
      let best = -1;
      for (let i = 0; i < 10000; i++)
        if (ids.includes(d.w.map[i]) && !tried.has(i) && dist[i] >= 0 && dist[i] <= within && (best < 0 || dist[i] < dist[best])) best = i;
      if (best < 0) return;
      const at = { x: best % 100, y: Math.floor(best / 100) };
      tried.add(best);
      const before = d.w.ci.meter[3];
      await seek(d, at, this.opts({ mode: info.chr === 'courier' ? 'walk' : 'fly', tall, avoid: this.avoidLinks(info.scene, -1), maxTicks: 400 }));
      // the crate is taken by touching it; a little more if it is not gone yet
      if (d.w.ci.meter[3] === before) for (let i = 0; i < 6 && !d.dead; i++) await d.tick();
      this.status(`credits ${before - 1} -> ${d.w.ci.meter[3] - 1}`);
    }
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
    const r = await seek(
      d,
      spring,
      this.opts({ mode: 'walk', tall: 2, passable: this.gates(info), avoid: this.avoidLinks(info.scene, -1), maxTicks: 1500, grab: this.grab(info.scene) }),
    );
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

  /** On a world: the prize from its vault (credits for the door first if need be), a stop at the spring if hurt, back to the uplink. */
  async ground(info: SceneInfo, heal?: { below: number; to: number }): Promise<void> {
    const d = this.d;
    const scene = info.scene;
    const prize = info.shard !== undefined ? `the ${SHARDS[info.shard]} shard` : 'a module';
    const tall = info.chr === 'courier' ? 2 : 1;
    const mode = info.chr === 'courier' ? 'walk' : 'fly';
    if (!this.has(info)) {
      // a vault door wants 20 credits; when the force field's side can't be reached, find them
      if (!this.reaches(info, info.vault!, false)) await this.credits(info, 20, 200);
      else await this.credits(info, 20, 30);
      if (d.dead) return;
      const r = await seek(
        d,
        info.vault!,
        this.opts({ mode, tall, passable: this.gates(info), avoid: this.avoidLinks(scene, -1), maxTicks: 8000, grab: this.grab(scene) }),
      );
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
    await this.heal(info, heal?.below, heal?.to);
    if (d.dead) return;
    await seek(d, this.links(scene)[0].from, this.opts({ mode, tall, passable: this.gates(info), maxTicks: 8000, grab: this.grab(scene) }));
  }

  /** Doors (two cells, 10 credits each: only with 20 to spend) and force fields (wait for them to blink off). */
  gates(info: SceneInfo): (b: number) => boolean {
    const s = this.b.sets[info.bbl];
    const ids = ['field:on', 'field:on2', 'field:off'].filter((n) => s.has(n)).map((n) => s.id(n));
    if (this.d.w.ci.meter[3] - 1 >= 20 && s.has('door')) ids.push(s.id('door'));
    return (b) => ids.includes(b);
  }

  /** The Maelstrom: through the storm to the Citadel's dock. */
  async maelstrom(): Promise<void> {
    this.chapter(SCENE.maelstrom, 'The Maelstrom');
    this.status('in the Maelstrom');
    await this.flyLink(SCENE.maelstrom, 1, 8000);
  }

  /** The Citadel: down to its vault, where the teleporter to the Heart waits. */
  async citadel(): Promise<void> {
    const d = this.d;
    const info = this.info(SCENE.citadel);
    this.chapter(SCENE.citadel, 'The Citadel');
    this.status('landed on the Citadel');
    await this.inScene(SCENE.citadel, async () => {
      await this.credits(info, 20);
      if (d.dead) return;
      await seek(
        d,
        this.links(SCENE.citadel)[1].from,
        this.opts({
          mode: 'walk',
          tall: 2,
          passable: this.gates(info),
          avoid: this.avoidLinks(SCENE.citadel, 1),
          maxTicks: 10000,
          grab: this.grab(SCENE.citadel),
        }),
      );
    });
    await d.enter(SCENE.heart);
  }

  /** The Guardian's plates still standing (live monsters in its three columns), as "x,y". */
  plates(): Set<string> {
    const w = this.d.w;
    const out = new Set<string>();
    w.mm.forEach((m, i) => {
      if (m.monnum >= 44) return;
      const x = w.mi[i].curx[0];
      if (x >= 76 && x <= 78) out.add(`${x},${w.mi[i].cury[0]}`);
    });
    return out;
  }

  /**
   * The Heart: across the hall to the Guardian, lance the plates in the row it fires along,
   * then through what is left at floor height (plates crack and fall as the courier shoulders
   * into them, a few hit points a touch, with a plasma bolt now and then), and on to the exit.
   */
  async heart(): Promise<void> {
    const d = this.d;
    this.chapter(SCENE.heart, 'Heart of Maximus');
    this.status('in the Heart');
    const wait = async (n: number) => {
      for (let i = 0; i < n && !d.dead && d.link < 0; i++) await d.tick();
    };
    const tap = async (k: number, hold = 1) => {
      d.press(k);
      await wait(hold);
      d.release(k);
    };
    await this.inScene(SCENE.heart, async () => {
      const wall = { x: 73, y: 55 };
      if (d.pos.bx < 79) {
        await seek(d, wall, this.opts({ mode: 'walk', tall: 2, avoid: this.avoidLinks(SCENE.heart, 0), maxTicks: 4000 }));
        if (d.dead) return;
        this.status(`at the Guardian (${this.plates().size} plates)`);
        // the Plasma Lance first: two bolts crack and break each plate in the row the
        // courier fires along (row 54); what is left at floor height it shoulders through
        await tap(SCAN.right);
        for (let shot = 0; shot < 12 && !d.dead && d.link < 0; shot++) {
          const row = [...this.plates()].filter((c) => c.endsWith(',54'));
          if (!row.length || d.w.ci.meter[SEQ.plasma] <= 0) break;
          await tap(SCAN.z);
          await wait(7);
        }
        this.status(`lanced the Guardian (${this.plates().size} plates left)`);
        for (let round = 0; round < 80 && d.pos.bx < 79 && !d.dead; round++) {
          const p = this.plates();
          // the plates at the courier's height (rows 54 and 55)
          const low = [...p].map((c) => c.split(',').map(Number)).filter(([, y]) => y >= 54);
          if (this.trace)
            this.log(
              `    guardian round ${round}: at ${d.pos.bx},${d.pos.by} plasma ${d.w.ci.meter[SEQ.plasma]} hp ${d.w.ci.hitpts} plates ${low.map((c) => c.join(',')).join(' ')}`,
            );
          if (!low.length) {
            // a way through at floor level: walk it
            d.press(SCAN.right);
            for (let t = 0; t < 30 && d.pos.bx < 79 && !d.dead; t++) await d.tick();
            d.release(SCAN.right);
            continue;
          }
          // the plates crack and fall as the courier shoulders into them (each touch costs
          // hit points), with a plasma bolt now and then
          d.press(SCAN.right);
          for (let t = 0; t < 20 && d.pos.bx < 79 && !d.dead; t++) {
            if (t === 10) await tap(SCAN.z);
            else await d.tick();
          }
          d.release(SCAN.right);
        }
        this.status(`past the Guardian at ${d.pos.bx},${d.pos.by}`);
      }
      if (d.dead) return;
      await seek(d, this.links(SCENE.heart)[0].from, this.opts({ mode: 'walk', tall: 2, avoid: this.avoidLinks(SCENE.heart, 0), maxTicks: 3000 }));
    });
  }

  async jump(sector: number): Promise<void> {
    await this.flyLink(SCENE.sector(sector), 19);
  }
}

export type { P };
