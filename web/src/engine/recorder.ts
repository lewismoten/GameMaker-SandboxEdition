// Port of the Recording class (code/GM/PLAYGAME.C): every game is recorded so a top
// ten score can be replayed (data<n>.rec), and demo .rec files are played back by
// feeding their key events into the pending key queue at the recorded tick.
//
// Time is counted in processed game ticks, not wall time: playscene calls DoPlayBack
// once per game tick whether recording or playing back, and that call advances the
// timer. A demo therefore stays in step with the game even when ticks are skipped.
import { RECLEN, parseRecording, serializeRecording, type RecordedKey } from '../formats/recording';

export const RECORD = 1;
export const PLAYBACK = 2;

export class Recorder {
  mode = 0;
  private keys: RecordedKey[] = [];
  private index = 0;
  private timer = 0;
  private lastKeyPress = 0;
  private paused = false;

  initRecord(): void {
    this.mode = RECORD;
    this.keys = [];
    this.restart();
  }

  /**
   * Whether waits for a key count toward playback time. PLAYGAME's GetKey called
   * DoPlayBack on every poll, so while a "hit any key" screen waited the timer raced
   * ahead (thousands of polls a second), and a demo recorded in DOS stores those polls
   * as one huge DeltaTime before the key that dismissed the screen (Nebula's 26058).
   * Demos recorded here count game ticks only, so for them waits must not count.
   */
  countsWaits = false;

  initPlayback(bytes: Uint8Array | undefined): boolean {
    if (!bytes) return false;
    this.keys = parseRecording(bytes);
    // No tick-counted recording has a gap this long (4096 ticks = almost 4 minutes still).
    this.countsWaits = this.keys.some((k) => k.delta > 4096);
    this.mode = PLAYBACK;
    this.restart();
    return true;
  }

  stop(): void {
    this.mode = 0;
    this.restart();
  }

  restart(): void {
    this.lastKeyPress = 0;
    this.index = 0;
    this.timer = 0;
    this.paused = false;
  }

  pause(): void {
    this.paused = true;
  }

  unpause(): void {
    this.paused = false;
  }

  /** Game ticks counted since the recording or playback (re)started; the playback position. */
  get tick(): number {
    return this.timer;
  }

  get playing(): boolean {
    return this.mode === PLAYBACK;
  }

  /** DoPlayBack: advance one tick; returns the keys that become pending now. */
  doPlayback(): number[] {
    const out: number[] = [];
    if (this.paused) return out;
    this.timer++;
    if (this.mode !== PLAYBACK) return out;
    while (this.index < this.keys.length && this.lastKeyPress + this.keys[this.index].delta <= this.timer) {
      out.push(this.keys[this.index].key);
      this.lastKeyPress += this.keys[this.index].delta;
      this.index++;
    }
    return out;
  }

  /**
   * GetKey polls while a screen waits for a key: `polls` calls to DoPlayBack at once.
   * Returns the recorded keys that become pending (only for recordings made in DOS).
   */
  advanceWait(polls: number): number[] {
    const out: number[] = [];
    if (this.paused || this.mode !== PLAYBACK || !this.countsWaits) return out;
    this.timer += polls;
    while (this.index < this.keys.length && this.lastKeyPress + this.keys[this.index].delta <= this.timer) {
      out.push(this.keys[this.index].key);
      this.lastKeyPress += this.keys[this.index].delta;
      this.index++;
    }
    return out;
  }

  /**
   * A screen that read keys has finished. In DOS the next key may have come during it
   * (the recording shows a gap of many thousands of polls), however fast that PC polled;
   * catch up to it, and to keys a poll or two behind it (taken by the keyboard flush that
   * follows every screen), so gameplay resumes in step. Only for DOS recordings.
   */
  finishWait(): number[] {
    const out: number[] = [];
    if (this.paused || this.mode !== PLAYBACK || !this.countsWaits) return out;
    const next = this.keys[this.index];
    if (!next || next.delta <= 1000) return out;
    this.timer = Math.max(this.timer, this.lastKeyPress + next.delta);
    while (this.index < this.keys.length) {
      const k = this.keys[this.index];
      const due = this.lastKeyPress + k.delta <= this.timer;
      if (!due && k.delta > 2) break;
      if (!due) this.timer = this.lastKeyPress + k.delta;
      out.push(k.key);
      this.lastKeyPress += k.delta;
      this.index++;
    }
    return out;
  }

  /**
   * DoRecord: called when a key is actually applied to the character (keys held back
   * while a sequence can't be interrupted are recorded on the tick they take effect).
   * DeltaTime is a 16-bit uint in the C, and at most RECLEN keys are kept.
   */
  doRecord(key: number): void {
    if (this.paused || this.mode !== RECORD || this.index >= RECLEN) return;
    this.keys[this.index] = { key, delta: (this.timer - this.lastKeyPress) & 0xffff };
    this.lastKeyPress = this.timer;
    this.index++;
  }

  /** The recording so far, in .rec format. */
  save(): Uint8Array {
    return serializeRecording(this.keys.slice(0, this.index));
  }

  /** For save games (the C wrote the Recording object and its keys into the .sav). */
  snapshot(): unknown {
    return {
      mode: this.mode,
      keys: this.keys.slice(0, Math.max(this.index, this.keys.length)),
      index: this.index,
      timer: this.timer,
      lastKeyPress: this.lastKeyPress,
    };
  }

  restore(s: { mode: number; keys: RecordedKey[]; index: number; timer: number; lastKeyPress: number }): void {
    Object.assign(this, { mode: s.mode, keys: s.keys, index: s.index, timer: s.timer, lastKeyPress: s.lastKeyPress, paused: false });
  }
}
