// Keyboard input for text-mode programs on the retro PC: a queue of key presses and
// a DOS style line editor (with DOSKEY-like history).
import type { TextScreen } from './textScreen';

export interface Key {
  key: string;
  code: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
}

/** Thrown into a program that is being stopped from outside (Computer.stopProgram). */
export class ProgramAborted extends Error {}

export class TextKeys {
  private queue: Key[] = [];
  private waiters: { resolve: (k: Key) => void; reject: (e: Error) => void }[] = [];
  /** Set while a program is being stopped: every wait for a key throws ProgramAborted. */
  private aborting = false;
  private target?: EventTarget;
  enabled = true;

  private onKey = (e: Event) => {
    const k = e as KeyboardEvent;
    if (!this.enabled || k.metaKey) return;
    if (k.key === 'Shift' || k.key === 'Control' || k.key === 'Alt' || k.key === 'CapsLock') return;
    k.preventDefault();
    this.push({ key: k.key, code: k.code, ctrl: k.ctrlKey, shift: k.shiftKey, alt: k.altKey });
  };

  attach(target: EventTarget): void {
    this.detach();
    this.target = target;
    target.addEventListener('keydown', this.onKey);
  }

  detach(): void {
    this.target?.removeEventListener('keydown', this.onKey);
    this.target = undefined;
  }

  /** Feeds a key as if typed (used by the desk to "type" commands). */
  push(k: Key): void {
    const w = this.waiters.shift();
    if (w) w.resolve(k);
    else this.queue.push(k);
  }

  type(text: string): void {
    for (const ch of text) this.push(ch === '\n' ? key('Enter') : key(ch));
  }

  next(): Promise<Key> {
    if (this.aborting) return Promise.reject(new ProgramAborted());
    const k = this.queue.shift();
    if (k) return Promise.resolve(k);
    return new Promise((resolve, reject) => this.waiters.push({ resolve, reject }));
  }

  /** Stops the program waiting for keys: its waits throw ProgramAborted until resume(). */
  abort(): void {
    this.aborting = true;
    this.queue.length = 0;
    const w = this.waiters;
    this.waiters = [];
    w.forEach((f) => f.reject(new ProgramAborted()));
  }

  resume(): void {
    this.aborting = false;
  }

  /** A key if one is waiting, else undefined. */
  poll(): Key | undefined {
    if (this.aborting) throw new ProgramAborted();
    return this.queue.shift();
  }

  clear(): void {
    this.queue.length = 0;
  }

  /** Rejects pending waits by handing them Escape (used when a program is cut short). */
  cancel(): void {
    const w = this.waiters;
    this.waiters = [];
    w.forEach((f) => f.resolve(key('Escape')));
  }
}

export function key(k: string): Key {
  return { key: k, code: '', ctrl: false, shift: false, alt: false };
}

/** Reads a line at the cursor, echoing to the screen. Returns null for Ctrl+C. */
export async function readLine(screen: TextScreen, keys: TextKeys, history: string[] = [], maxLen = 120, a = 7): Promise<string | null> {
  let line = '';
  let pos = 0;
  let h = history.length;
  const startX = screen.cursorX;
  const startY = screen.cursorY;
  const redraw = (prevLen: number) => {
    screen.cursorX = startX;
    screen.cursorY = startY;
    screen.print(line + ' '.repeat(Math.max(0, prevLen - line.length)), a);
    const end = startY * 80 + startX + pos;
    screen.cursorX = end % 80;
    screen.cursorY = Math.min(24, Math.floor(end / 80));
  };
  for (;;) {
    const k = await keys.next();
    const prev = line.length;
    if (k.ctrl && (k.key === 'c' || k.key === 'C')) {
      screen.print('^C', a);
      return null;
    }
    if (k.key === 'Enter') {
      pos = line.length;
      redraw(prev);
      if (line.trim()) {
        if (history[history.length - 1] !== line) history.push(line);
      }
      return line;
    }
    if (k.key === 'Escape') {
      line = '';
      pos = 0;
    } else if (k.key === 'Backspace') {
      if (pos > 0) {
        line = line.slice(0, pos - 1) + line.slice(pos);
        pos--;
      }
    } else if (k.key === 'Delete') line = line.slice(0, pos) + line.slice(pos + 1);
    else if (k.key === 'ArrowLeft') pos = Math.max(0, pos - 1);
    else if (k.key === 'ArrowRight') pos = Math.min(line.length, pos + 1);
    else if (k.key === 'Home') pos = 0;
    else if (k.key === 'End') pos = line.length;
    else if (k.key === 'ArrowUp' && h > 0) {
      line = history[--h];
      pos = line.length;
    } else if (k.key === 'ArrowDown') {
      h = Math.min(history.length, h + 1);
      line = history[h] ?? '';
      pos = line.length;
    } else if (k.key.length === 1 && line.length < maxLen) {
      line = line.slice(0, pos) + k.key + line.slice(pos);
      pos++;
    }
    redraw(prev);
  }
}
