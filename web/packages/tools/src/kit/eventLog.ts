// An EventLog over the headless GameSim (gameSim.ts): one entry per key edge, score change, scene
// change and death, in tick order, so a rule can ask what a bot did without changing the run.
// recordEvents() patches a sim class's press, release and tick for the length of one call and
// restores them after, so a game's own route code (tools/play.ts) runs unchanged and the engine
// is not touched. Game-agnostic: the rules that read the log live in games/kit/intentRules.ts.
import type { GameSim } from './gameSim';

/** What happened. `score` carries the change; `key` the scan code (without 0x80) and whether it went down. */
export type GameEvent =
  | { kind: 'key'; scan: number; down: boolean; tick: number; scene: number }
  | { kind: 'score'; delta: number; tick: number; scene: number }
  | { kind: 'scene'; to: number; from: number; tick: number; scene: number }
  | { kind: 'death'; tick: number; scene: number }
  | { kind: 'end'; tick: number; scene: number };

/** Scan codes people name: the arrows, Space, Enter, Esc, letters and digits. */
const KEYS: Record<string, number> = {
  Esc: 0x01,
  Enter: 0x1c,
  Space: 0x39,
  Up: 0x48,
  Down: 0x50,
  Left: 0x4b,
  Right: 0x4d,
  ...Object.fromEntries([...'QWERTYUIOP'].map((c, i) => [c, 0x10 + i])),
  ...Object.fromEntries([...'ASDFGHJKL'].map((c, i) => [c, 0x1e + i])),
  ...Object.fromEntries([...'ZXCVBNM'].map((c, i) => [c, 0x2c + i])),
  ...Object.fromEntries([...'1234567890'].map((c, i) => [c, 0x02 + i])),
};

/** The scan code for a key's name ("Enter", "Up", "Q"; any case), or undefined when it is not one we know. */
export function scanOf(name: string): number | undefined {
  const n = name.trim();
  const hit = Object.keys(KEYS).find((k) => k.toLowerCase() === n.toLowerCase());
  return hit === undefined ? undefined : KEYS[hit];
}

/** The name of a scan code, or its number in hex when it has none. */
export function nameOf(scan: number): string {
  return Object.keys(KEYS).find((k) => KEYS[k] === scan) ?? `0x${scan.toString(16)}`;
}

export class EventLog {
  readonly events: GameEvent[] = [];
  private tickNo = 0;
  constructor(private readonly sim: Pick<GameSim, 'scene' | 'ci'>) {}

  private add(e: Omit<GameEvent, 'tick' | 'scene'> & { kind: GameEvent['kind'] }, scene = this.sim.scene): void {
    this.events.push({ ...e, tick: this.tickNo, scene } as GameEvent);
  }
  key(scan: number, down: boolean): void {
    this.add({ kind: 'key', scan, down });
  }
  /** Call around one sim.tick(): the score and scene before it, and what it returned. */
  tick(scoreBefore: number, sceneBefore: number, result: 'link' | 'dead' | 'end' | undefined): void {
    this.tickNo++;
    const delta = this.sim.ci.score - scoreBefore;
    if (delta !== 0) this.add({ kind: 'score', delta }, sceneBefore);
    if (result === 'dead') this.add({ kind: 'death' }, sceneBefore);
    if (this.sim.scene !== sceneBefore) this.add({ kind: 'scene', from: sceneBefore, to: this.sim.scene }, sceneBefore);
    if (result === 'end') this.add({ kind: 'end' }, sceneBefore);
  }
  /** How many times `scan` went down in `scene` (any scene when undefined). */
  presses(scan: number, scene?: number): number {
    return this.events.filter((e) => e.kind === 'key' && e.down && e.scan === scan && (scene === undefined || e.scene === scene)).length;
  }
}

type SimClass = { prototype: Pick<GameSim, 'press' | 'release' | 'tick'> };

/**
 * Runs `run` with `Sim`'s press, release and tick recording into one EventLog per sim created or
 * used meanwhile; returns the run's result and the logs in the order their sims were first used.
 * The patch is undone afterwards, also when `run` throws. One call at a time.
 */
export async function recordEvents<T>(Sim: SimClass, run: () => Promise<T>): Promise<{ result: T; logs: EventLog[] }> {
  const proto = Sim.prototype;
  const { press, release, tick } = proto;
  const logs = new Map<object, EventLog>();
  const logOf = (sim: GameSim) => {
    let l = logs.get(sim);
    if (!l) logs.set(sim, (l = new EventLog(sim)));
    return l;
  };
  proto.press = function (this: GameSim, scan: number) {
    if (!this.isHeld(scan)) logOf(this).key(scan, true);
    press.call(this, scan);
  };
  proto.release = function (this: GameSim, scan: number) {
    if (this.isHeld(scan)) logOf(this).key(scan, false);
    release.call(this, scan);
  };
  proto.tick = async function (this: GameSim) {
    const s = this.ci.score;
    const scene = this.scene;
    const r = await tick.call(this);
    logOf(this).tick(s, scene, r);
    return r;
  };
  try {
    const result = await run();
    return { result, logs: [...logs.values()] };
  } finally {
    Object.assign(proto, { press, release, tick });
  }
}
