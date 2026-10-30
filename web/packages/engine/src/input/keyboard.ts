// Keyboard state for the player: a raw scan code event queue (what playgame's
// keyboard interrupt handler collected into KeysPending) plus a BIOS style buffer of
// typed keys for menus and text entry.
import { ARROW_CODES, ArrowChords } from './chords';
import { SCAN, scanToAscii } from './scancodes';

// Navigation keys by DOM key: a Mac laptop has none, and makes them with fn+arrows (fn ⌫ = Del).
const BY_KEY: Record<string, number> = { Home: 71, PageUp: 73, End: 79, PageDown: 81, Insert: 82, Delete: 83 };

export interface TypedKey {
  scan: number;
  /** ASCII code (0 for extended keys such as arrows). */
  ascii: number;
  /** The DOM key, for text entry. */
  key: string;
}

export class Keyboard {
  /** Scan code events; bit 7 set = released. */
  readonly events: number[] = [];
  readonly typed: TypedKey[] = [];
  readonly down = new Set<number>();
  private target?: EventTarget;
  private waiters: (() => void)[] = [];
  /** Two arrows held together stand for the keypad key between them when the game binds it. */
  readonly chords = new ArrowChords();

  /** Which keys the game binds, for arrow chords (none: arrows stay arrows). */
  set chordable(bound: ((scan: number) => boolean) | undefined) {
    this.chords.bound = bound ?? (() => false);
  }

  private onDown = (e: Event) => this.handle(e as KeyboardEvent, true);
  private onUp = (e: Event) => this.handle(e as KeyboardEvent, false);
  private onBlur = () => this.releaseAll();

  attach(target: EventTarget = window): void {
    this.detach();
    this.target = target;
    target.addEventListener('keydown', this.onDown);
    target.addEventListener('keyup', this.onUp);
    window.addEventListener('blur', this.onBlur);
  }

  detach(): void {
    this.target?.removeEventListener('keydown', this.onDown);
    this.target?.removeEventListener('keyup', this.onUp);
    window.removeEventListener('blur', this.onBlur);
    this.target = undefined;
  }

  private handle(e: KeyboardEvent, pressed: boolean): void {
    // The key wins for Home/End/PgUp/PgDn/Ins/Del: whatever code a Mac's fn+arrow reports.
    const scan = BY_KEY[e.key] ?? SCAN[e.code];
    if (scan === undefined) return;
    // Let browser shortcuts with Ctrl/Meta through (except plain Ctrl used as a game key).
    if (e.metaKey) return;
    e.preventDefault();
    if (ARROW_CODES[e.code] === scan) {
      if (!pressed || !e.repeat) for (const k of this.chords.arrow(scan, pressed)) this.apply(k);
      if (!pressed) return;
    } else if (pressed && !e.repeat) {
      this.down.add(scan);
      this.events.push(scan);
    }
    if (pressed) {
      const ascii = e.key.length === 1 ? e.key.charCodeAt(0) & 0xff : scan === 28 ? 13 : scan === 1 ? 27 : scan === 14 ? 8 : 0;
      this.typed.push({ scan, ascii, key: e.key });
      const w = this.waiters;
      this.waiters = [];
      w.forEach((f) => f());
    } else if (this.down.has(scan)) {
      this.down.delete(scan);
      this.events.push(scan | 0x80);
    }
  }

  /** One scan code event for the game (an arrow chord's press or release). */
  private apply(k: number): void {
    const scan = k & 0x7f;
    if (k < 0x80) {
      this.down.add(scan);
      this.events.push(scan);
    } else if (this.down.has(scan)) {
      this.down.delete(scan);
      this.events.push(k);
    }
  }

  /** Simulates a key event (touch controls, gamepad, demo playback). */
  inject(scan: number, pressed: boolean): void {
    if (pressed) {
      if (this.down.has(scan)) return;
      this.down.add(scan);
      this.events.push(scan);
      this.typed.push({ scan, ascii: scanToAscii(scan), key: '' });
      const w = this.waiters;
      this.waiters = [];
      w.forEach((f) => f());
    } else if (this.down.has(scan)) {
      this.down.delete(scan);
      this.events.push(scan | 0x80);
    }
  }

  /** Queues a recorded scan code as-is (demo playback while a screen waits for a key). */
  feed(scan: number): void {
    this.events.push(scan);
    if (scan < 0x80) this.typed.push({ scan, ascii: scanToAscii(scan), key: '' });
    const w = this.waiters;
    this.waiters = [];
    w.forEach((f) => f());
  }

  releaseAll(): void {
    for (const s of this.down) this.events.push(s | 0x80);
    this.down.clear();
    this.chords.reset();
  }

  /** bioskey(1)/bioskey(0): peek or take the next typed key. */
  peekKey(): TypedKey | undefined {
    return this.typed[0];
  }

  readKey(): TypedKey | undefined {
    return this.typed.shift();
  }

  clear(): void {
    this.typed.length = 0;
    this.events.length = 0;
  }

  /** Resolves on the next key press. */
  nextPress(): Promise<void> {
    return new Promise((resolve) => this.waiters.push(resolve));
  }
}
