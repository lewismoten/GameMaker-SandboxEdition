// How a hero moves in a side view, read from the character file (.chr) and the engine's own constants
// (nothing about a particular hero is written down here). A jump is the sequence whose frames push the
// hero up as momentum; gravity takes one pixel a tick back from that push (engine/character.ts
// moveCharGrav), a tick moves the hero at most MAXGRAV pixels, and walking moves him the sequence's
// pixels a frame. `arcOf` plays one jump or fall tick by tick; `platformReach.ts` plays them against a
// grid. No DOM.
import { MAXGRAV, GRAVSPEED } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { MAXSEQ, type Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { CHARBL } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';

export interface HeroPhysics {
  /** Pixels a tick when walking (and when steering in the air). */
  vx: number;
  /** The jump's pushes: the upward push (negative) added to his speed on each tick it lasts, from tick 0. */
  push: number[];
  /** Whether he can steer in the air (the jump is not a sequence the walk key cannot interrupt). */
  steer: boolean;
  /** A climbing sequence exists (up key moves him up while the block holds him). */
  climb: boolean;
  /** The highest a jump takes him, in pixels (straight up). */
  rise: number;
}

export type PhysicsOutcome = { ok: true; physics: HeroPhysics } | { ok: false; message: string };

const frameTicks = (pause: number) => Math.max(1, pause);

/** Reads the hero's walk, jump and climb from a character file; a plain message when a side view cannot be made for him. */
export function heroPhysics(chr: Character): PhysicsOutcome {
  let walk: { dx: number; ticks: number } | undefined;
  let jump: { push: number[]; ground: boolean } | undefined;
  let climb = false;
  for (let i = 5; i < MAXSEQ; i++) {
    const s = chr.sequences[i];
    if (!s.key && !s.jstkMov) continue;
    const end = s.frames.findIndex((f) => f.pic2 === CHARBL + 1);
    const frames = s.frames.slice(0, end < 0 ? s.frames.length : end);
    if (!frames.length) continue;
    const sx = frames.reduce((a, f) => a + f.x, 0);
    const sy = frames.reduce((a, f) => a + f.y, 0);
    const ticks = frames.reduce((a, f) => a + frameTicks(f.pause), 0);
    if (s.momentum && sy < 0 && !jump) {
      const push: number[] = [];
      let t = 0;
      for (const f of frames) {
        push[t] = (push[t] ?? 0) + f.y;
        t += frameTicks(f.pause);
      }
      jump = { push, ground: !!s.ground };
    } else if (!s.momentum && sx > 0 && sy === 0 && !walk) walk = { dx: sx, ticks };
    else if (!s.momentum && sy < 0 && sx === 0) climb = true;
  }
  if (!walk) return { ok: false, message: 'The hero has no walking sequence to the right, so there is nothing to measure a side view by.' };
  if (!jump) return { ok: false, message: 'The hero has no jump (a sequence that pushes him up as momentum), so a side view cannot be checked.' };
  const physics: HeroPhysics = { vx: walk.dx / walk.ticks, push: jump.push, steer: !jump.ground, climb, rise: 0 };
  // the height of a jump straight up
  const a = arcOf(physics, 'jump', 0, 0);
  let y = 0;
  for (const d of a.dy) physics.rise = Math.max(physics.rise, (y -= d));
  if (physics.rise < 10) return { ok: false, message: 'The hero’s jump is too small to cross anything.' };
  return { ok: true, physics };
}

/** A copy of the physics made weaker (0..1 of the walk speed and of the jump push), for checking with margin. */
export function weaker(p: HeroPhysics, speed: number, push: number): HeroPhysics {
  return { ...p, vx: p.vx * speed, push: p.push.map((v) => Math.round(v * push)), rise: p.rise * push * push };
}

/** Longest arc played (ticks). */
export const ARC_TICKS = 90;

/**
 * One jump (the push at once) or a fall (no push) played a tick at a time: `dir` is -1, 0 or 1, and he steers that
 * way for `steerTicks` ticks (then lets go). `step` gives the pixels moved on a tick (x to the right, y down), before
 * anything is in the way; `bump` is a ceiling stopping the rise.
 */
export class Flight {
  private vy = 0;
  private t = 0;
  constructor(
    private readonly p: HeroPhysics,
    private readonly kind: 'jump' | 'fall',
    private readonly dir: -1 | 0 | 1,
    private readonly steerTicks: number,
  ) {}
  step(): { dx: number; dy: number } {
    const { p, t } = this;
    if (this.kind === 'jump') this.vy += p.push[t] ?? 0;
    if (t % GRAVSPEED === 0) this.vy += 1;
    this.vy = Math.max(-MAXGRAV * 4, Math.min(MAXGRAV * 4, this.vy));
    this.t++;
    return {
      dy: Math.max(-MAXGRAV, Math.min(MAXGRAV, this.vy)),
      dx: this.dir && t >= 1 && t <= this.steerTicks && (p.steer || this.kind === 'fall') ? Math.round(this.dir * p.vx) : 0,
    };
  }
  bump(): void {
    if (this.vy < 0) this.vy = 0;
  }
}

/** The pixels moved on each tick of a jump or fall in the open. */
export function arcOf(p: HeroPhysics, kind: 'jump' | 'fall', dir: -1 | 0 | 1, steerTicks: number): { dx: number[]; dy: number[] } {
  const f = new Flight(p, kind, dir, steerTicks);
  const dx: number[] = [],
    dy: number[] = [];
  for (let t = 0; t < ARC_TICKS; t++) {
    const s = f.step();
    dx.push(s.dx);
    dy.push(s.dy);
  }
  return { dx, dy };
}

export interface ArcVariant {
  kind: 'jump' | 'fall';
  dir: -1 | 0 | 1;
  steerTicks: number;
}

/** The arcs the reach search tries: a jump or a fall, either way or straight up, steering for different lengths. */
export function arcVariants(): ArcVariant[] {
  const out: ArcVariant[] = [];
  const stops = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, ARC_TICKS];
  for (const kind of ['jump', 'fall'] as const)
    for (const dir of [-1, 0, 1] as const) for (const steerTicks of dir ? stops : [0]) out.push({ kind, dir, steerTicks });
  return out;
}
