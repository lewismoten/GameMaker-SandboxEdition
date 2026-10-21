// Keyboard state for the player: a raw scan code event queue (what playgame's
// keyboard interrupt handler collected into KeysPending) plus a BIOS style buffer of
// typed keys for menus and text entry.
import { SCAN, scanToAscii } from './scancodes';

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
    const scan = SCAN[e.code];
    if (scan === undefined) return;
    // Let browser shortcuts with Ctrl/Meta through (except plain Ctrl used as a game key).
    if (e.metaKey) return;
    e.preventDefault();
    if (pressed) {
      if (!e.repeat) {
        this.down.add(scan);
        this.events.push(scan);
      }
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
