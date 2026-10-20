// Port of the Recording class (code/GM/PLAYGAME.C): every game is recorded so a top
// ten score can be replayed (data<n>.rec), and demo .rec files are played back by
// feeding their key events into the pending key queue at the recorded tick.
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

  initPlayback(bytes: Uint8Array | undefined): boolean {
    if (!bytes) return false;
    this.keys = parseRecording(bytes);
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

  /** DoRecord */
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

  /** For save games. */
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
