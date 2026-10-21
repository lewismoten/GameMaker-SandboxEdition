// A curious player for any Game-Maker game: every few game ticks it tries each key the
// character answers to (from the game's own key map) on copies of the level, a few ticks
// ahead and with a few different monster dice, and presses the one that explores the
// most new ground, picks things up, scores, and does not get hurt. It plays the real
// engine through headless.ts, so the keys it presses become a real .REC recording.
import { characterActions, type ActionKind } from '../../../web/src/editor/keymap/keyMap';
import type { Machine } from '../../../web/src/engine/machine';
import type { Session } from '../../../web/src/engine/scene';
import { BACKBL, type World } from '../../../web/src/engine/world';
import { parseMap } from '../../../web/src/formats/map';
import { rng } from '../pixels';
import { Probe, cloneWorld } from './probe';

export interface BotOptions {
  /** Decide every this many game ticks. */
  every?: number;
  /** Ticks each try is played ahead. */
  horizon?: number;
  /** Monster dice per try (the worst one counts for getting hurt). */
  dice?: number;
  /** Scene links the bot may take: 'any', or by scene: link indices, or 'any'. Others are avoided. */
  links?: 'any' | Record<number, number[] | 'any'>;
  /** Keys never to press (scan codes), e.g. a drop key. */
  never?: number[];
  /** Action kinds to try (default move, jump, fire, pickup). */
  kinds?: ActionKind[];
  /** How much new ground counts against other rewards (default 1). */
  explore?: number;
  /** A place to head for in a scene, in blocks: rewards getting closer. */
  goals?: Record<number, { x: number; y: number }[]>;
  seed?: number;
}

interface Option {
  key: number;
  kind: ActionKind;
  /** A move key to switch to after this decision (only looked at, to find turns toward a goal). */
  then?: number;
}

const MAP_W = 100;

/** Where the character is, in pixels on the map. */
const pos = (w: World) => ({ x: w.chr.x[0] * 20 + w.chr.x[1], y: w.chr.y[0] * 20 + w.chr.y[1] });
const carried = (w: World) => w.ci.inv.filter((b) => b !== BACKBL + 1 && b < BACKBL).length;

export class Bot {
  private o: Required<Omit<BotOptions, 'links' | 'goals' | 'seed'>> & Pick<BotOptions, 'links' | 'goals'>;
  private visits = new Map<number, Uint16Array>();
  private held: number | undefined;
  private scene = -1;
  private world?: World;
  private rand: () => number;
  private trail: { x: number; y: number }[] = [];
  /** Decisions left to keep the current choice. */
  private locked = 0;
  /** Moments worth a look: deaths, links taken, pick ups. */
  readonly log: string[] = [];
  deaths = 0;

  constructor(o: BotOptions = {}) {
    this.o = {
      every: o.every ?? 4,
      horizon: o.horizon ?? 20,
      dice: o.dice ?? 3,
      never: o.never ?? [],
      kinds: o.kinds ?? ['move', 'jump', 'fire', 'pickup'],
      explore: o.explore ?? 1,
      links: o.links,
      goals: o.goals,
    };
    this.rand = rng(o.seed ?? 7);
  }

  /**
   * The scene a newly loaded world belongs to: the first level the start link leads to,
   * then the same scene again (after a death) or one its links lead to, whichever map
   * matches the new world best (several scenes may share a map file).
   */
  private sceneOf(w: World, s: Session): number {
    const scenes = s.game.scenes;
    const valid = (i: number | undefined): i is number => i !== undefined && i > 1 && i < scenes.length;
    const candidates =
      this.scene < 0
        ? [scenes[0]?.links[0]?.toScene].filter(valid)
        : [this.scene, ...(scenes[this.scene]?.links ?? []).map((l) => l.toScene).filter(valid)];
    let best = candidates[0] ?? -1;
    let bestDiff = Infinity;
    for (const i of new Set(candidates)) {
      const f = scenes[i].files[1];
      const bytes = f ? s.m.files.get(f) : undefined;
      if (!bytes) continue;
      const map = parseMap(bytes).blocks;
      let diff = 0;
      for (let k = 0; k < map.length; k += 7) if (map[k] !== w.map[k]) diff++;
      // a link that lands where the hero stands wins a tie
      const lands = (scenes[this.scene]?.links ?? []).some((l) => l.toScene === i && l.to.x === w.chr.x[0] && l.to.y === w.chr.y[0]);
      if (lands && i !== this.scene) diff -= 0.5;
      if (diff < bestDiff) [best, bestDiff] = [i, diff];
    }
    return best;
  }

  private visited(scene: number): Uint16Array {
    let v = this.visits.get(scene);
    if (!v) this.visits.set(scene, (v = new Uint16Array(MAP_W * MAP_W)));
    return v;
  }

  private options(w: World): Option[] {
    const seen = new Set<number>();
    const out: Option[] = [];
    for (const { scan, action } of characterActions(w.chr)) {
      if (!scan || seen.has(scan) || this.o.never.includes(scan) || !this.o.kinds.includes(action.kind)) continue;
      if (!w.ci.seqon[action.seq] || w.ci.meter[action.seq] <= 0) continue;
      seen.add(scan);
      out.push({ key: scan, kind: action.kind });
    }
    return out;
  }

  private allowed(link: number): boolean {
    if (this.o.links === 'any') return true;
    const l = this.o.links?.[this.scene];
    return l === 'any' || (!!l && l.includes(link));
  }

  /** Where to head in this scene: its own goals, else the links it may take. */
  private goals(s: Session): { x: number; y: number }[] {
    return this.o.goals?.[this.scene] ?? (s.game.scenes[this.scene]?.links ?? []).filter((l, i) => l.toScene < s.game.scenes.length && this.allowed(i)).map((l) => l.from);
  }

  private fields = new Map<string, Int32Array>();

  /** Steps from every map cell to the nearest goal through blocks with no solid side (-1: no path). */
  private goalField(w: World, goals: { x: number; y: number }[]): Int32Array {
    const key = `${this.scene}:${goals.map((g) => `${g.x},${g.y}`).join(' ')}`;
    let f = this.fields.get(key);
    if (f) return f;
    f = new Int32Array(MAP_W * MAP_W).fill(-1);
    const open = (x: number, y: number) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_W && !w.bg[w.map[y * MAP_W + x]]?.solid;
    const queue: number[] = [];
    for (const g of goals) {
      f[g.y * MAP_W + g.x] = 0;
      queue.push(g.y * MAP_W + g.x);
    }
    for (let i = 0; i < queue.length; i++) {
      const c = queue[i];
      const x = c % MAP_W;
      const y = (c - x) / MAP_W;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        const n = ny * MAP_W + nx;
        if (open(nx, ny) && f[n] < 0) {
          f[n] = f[c] + 1;
          queue.push(n);
        }
      }
    }
    this.fields.set(key, f);
    return f;
  }

  private hasGoals(s: Session): boolean {
    return this.goals(s).length > 0;
  }

  /** Plays one option ahead on a copy; higher is better. */
  private async tryOption(w: World, s: Session, opt: Option | undefined, dice: number): Promise<number> {
    const copy = cloneWorld(w, rng(dice * 7919 + w.clock));
    const p = new Probe(copy, s.game.scenes[this.scene]?.links ?? []);
    const before = { hp: w.ci.hitpts, lives: w.ci.lives, score: w.ci.score, inv: carried(w), money: w.ci.meter[3] };
    // the key held now is let go first unless it is the one tried
    if (this.held !== undefined && this.held !== opt?.key) p.key(this.held | 0x80);
    if (opt && this.held !== opt.key) p.key(opt.key);
    const v = this.visited(this.scene);
    const seenHere = new Set<number>();
    let value = 0;
    const tapped = opt && opt.kind !== 'move';
    for (let t = 0; t < this.o.horizon; t++) {
      // jumps, shots and pick ups are taps: let go after a decision's worth of ticks
      if (tapped && t === this.o.every) p.key(opt.key | 0x80);
      if (opt?.then !== undefined && t === this.o.every) {
        p.key(opt.key | 0x80);
        p.key(opt.then);
      }
      await p.tick();
      if (p.dead) return -2000 + t * 20;
      if (p.link >= 0) return this.allowed(p.link) ? 3000 - t : -3000;
      const at = pos(copy);
      const cell = Math.floor(at.y / 20) * MAP_W + Math.floor(at.x / 20);
      if (!seenHere.has(cell)) {
        seenHere.add(cell);
        value += (this.o.explore * 12) / (1 + v[cell]);
      }
    }
    const end = pos(copy);
    const ci = copy.ci;
    value -= (Math.max(0, before.hp - ci.hitpts) / Math.max(1, w.ci.meter[0] || before.hp || 1)) * 400;
    if (ci.lives < before.lives) value -= 1500;
    value += Math.min(300, Math.max(0, ci.score - before.score) * 2);
    value += (carried(copy) - before.inv) * 250;
    value += Math.max(0, ci.meter[3] - before.money) * 20;
    // keep going somewhere rather than pacing on the spot
    const back = this.trail[Math.max(0, this.trail.length - 12)];
    if (back) value += Math.min(60, Math.hypot(end.x - back.x, end.y - back.y) / 4) * this.o.explore;
    if (process.env.BOT_DEBUG === '2' && dice === 0)
      this.log.push(`    key ${opt?.key} from ${pos(w).x},${pos(w).y} to ${end.x},${end.y} back ${back?.x},${back?.y} hp ${before.hp}->${ci.hitpts} score +${ci.score - before.score} cells ${seenHere.size}`);
    const goals = this.goals(s);
    if (goals.length) {
      // steps along open blocks to the nearest goal, or as the crow flies where no path is known
      const field = this.goalField(w, goals);
      const d = (q: { x: number; y: number }) => {
        const steps = field[Math.floor(q.y / 20) * MAP_W + Math.floor(q.x / 20)];
        return steps >= 0 ? steps + (Math.abs((q.x % 20) - 10) + Math.abs((q.y % 20) - 10)) / 20 : 2 * Math.min(...goals.map((g) => Math.hypot(q.x / 20 - g.x, q.y / 20 - g.y)));
      };
      value += (d(pos(w)) - d(end)) * 15;
    }
    return value;
  }

  /** Thinks about the next keys and presses them on the real keyboard. */
  async decide(w: World, s: Session, m: Machine): Promise<void> {
    if (w !== this.world) {
      this.world = w;
      const scene = this.sceneOf(w, s);
      if (scene !== this.scene) this.log.push(`tick ${s.rec.tick}: scene ${scene} ${s.game.scenes[scene]?.desc ?? ''}`);
      else this.log.push(`tick ${s.rec.tick}: scene ${scene} again (died?)`);
      this.scene = scene;
      this.held = undefined;
    }
    const at = pos(w);
    this.trail.push(at);
    const v = this.visited(this.scene);
    const cell = Math.floor(at.y / 20) * MAP_W + Math.floor(at.x / 20);
    if (v[cell] < 60000) v[cell]++;
    const single = this.options(w);
    const options: (Option | undefined)[] = [undefined, ...single];
    // with somewhere to go, also look at turning: one move now, another after it
    if (this.hasGoals(s)) {
      const moves = single.filter((o) => o.kind === 'move');
      for (const a of moves) for (const b of moves) if (a !== b) options.push({ ...a, then: b.key });
    }
    const values = new Map<Option | undefined, number>();
    let best: Option | undefined;
    let bestValue = -Infinity;
    for (const opt of options) {
      let worst = Infinity;
      let sum = 0;
      for (let d = 0; d < this.o.dice; d++) {
        const value = await this.tryOption(w, s, opt, d);
        worst = Math.min(worst, value);
        sum += value;
      }
      // being hurt with any dice counts in full; otherwise the average, plus a little noise
      const value = (worst < -100 ? worst : sum / this.o.dice) + this.rand() * 8 + (opt?.key === this.held ? 6 : 0);
      values.set(opt, value);
      if (process.env.BOT_DEBUG) this.log.push(`  t${s.rec.tick} key ${opt?.key ?? '-'} worst ${worst.toFixed(0)} avg ${(sum / this.o.dice).toFixed(0)}`);
      if (value > bestValue) [best, bestValue] = [opt, value];
    }
    const current = options.find((x) => x?.key === this.held && x?.then === undefined);
    // Hold on to a choice for a few decisions (unless it hurts), so the hero does not dither
    // at the edge of danger; and when the hero has hardly moved for a while, set off
    // somewhere at random that does not hurt.
    const recent = this.trail.slice(-16);
    const moved = recent.length < 16 ? Infinity : Math.max(...recent.map((p) => Math.hypot(p.x - at.x, p.y - at.y)));
    if (this.locked > 0 && (values.get(current) ?? -Infinity) > -100) {
      best = current;
      this.locked--;
    } else if (moved < 30) {
      const safe = options.filter((x) => x?.kind === 'move' && (values.get(x) ?? -Infinity) > -100);
      if (safe.length) best = safe[Math.floor(this.rand() * safe.length)];
      this.locked = 5;
      this.trail.length = 0;
    } else if (best?.key !== this.held) this.locked = 2;
    if (process.env.BOT_DEBUG) this.log.push(`  t${s.rec.tick} chose ${best?.key} held ${this.held}`);
    if (best?.key !== this.held) {
      if (this.held !== undefined) m.keyboard.feed(this.held | 0x80);
      if (best) m.keyboard.feed(best.key);
      this.held = best?.key;
    } else if (best && best.kind !== 'move') {
      // a tap again: let go and press once more next time
      m.keyboard.feed(best.key | 0x80);
      this.held = undefined;
    }
  }

  /** Lets go of every key (at the end of the demo). */
  release(m: Machine): void {
    if (this.held !== undefined) m.keyboard.feed(this.held | 0x80);
    this.held = undefined;
  }
}
