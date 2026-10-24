// The keys of an author's own play of one scene, as the walkthrough keeps a scene's keys
// (walkthrough/format.ts): every key the game applied, by the game tick since the scene was
// entered. The player's recorder (engine/recorder.ts) already counts game ticks and records a
// key on the tick it takes effect, as PLAYGAME's demos do; this one also keeps every key (a
// demo stops at 1000) and where each entry into a scene began. A death plays the scene again
// from its start, so a take is the last try, from its entry to the link it left by.
import { RECORD, Recorder } from '../../../engine/recorder';
import { encodeKeys, keysAt } from '../../../walkthrough/format';

export interface Take {
  scene: number;
  /** The scene the hero went on to (1: the game was won). */
  next: number;
  /** Key events (encodeKeys), from the scene's entry. */
  keys: string;
  /** Game ticks from the entry to the last key. */
  ticks: number;
}

export class TakeRecorder extends Recorder {
  /** Every key applied while recording, by its tick. */
  readonly taken: { tick: number; key: number }[] = [];

  override doRecord(key: number): void {
    super.doRecord(key);
    if (this.mode === RECORD && !this.halted) this.taken.push({ tick: this.tick, key });
  }
}

/**
 * Follows the scenes play enters, and cuts out a take of `scene`: told each entry (with the
 * recorder's tick then), it gives the take once play goes on from `scene` to another scene.
 */
export class SceneTakes {
  private entered = -1;
  private at = 0;
  private from = 0;

  constructor(
    readonly scene: number,
    private readonly rec: TakeRecorder,
  ) {}

  /** Play entered `n`; returns the take of the scene when this ends one. */
  enter(n: number): Take | undefined {
    const was = this.entered;
    this.entered = n;
    if (n === this.scene) {
      // a fresh try (the first, or after a death)
      this.at = this.rec.tick;
      this.from = this.rec.taken.length;
      return undefined;
    }
    if (was !== this.scene) return undefined;
    return takeOf(this.scene, n, this.rec.taken.slice(this.from), this.at);
  }
}

/** A take from the keys applied after the entry at tick `at`: a key held and pressed again (none should be) is left out, as is a release of a key not held. */
export function takeOf(scene: number, next: number, keys: { tick: number; key: number }[], at: number): Take {
  const held = new Set<number>();
  const events: { tick: number; key: number }[] = [];
  for (const k of keys) {
    const scan = k.key & 0x7f;
    const down = k.key < 0x80;
    if (down === held.has(scan)) continue;
    if (down) held.add(scan);
    else held.delete(scan);
    events.push({ tick: k.tick - at, key: k.key });
  }
  return { scene, next, keys: encodeKeys(keysAt(events)), ticks: events.length ? events[events.length - 1].tick : 0 };
}
