// The Pi log made readable: noisy lines (BOOT and ASSET chatter, frame CRCs, and the SND lines
// while the sound switch plays them) are hidden unless "Show everything" is on, repeated lines
// collapse into one with a count, errors and warnings are marked, and the lines that say what
// the Pi is doing (program, game, screen mode) feed a small status line. Bounded to `limit`
// entries. No DOM: piRemotePage.ts draws it.
import type { Reply } from './protocol';

export type Level = 'error' | 'warn' | 'info';

export interface LogEntry {
  kind: Reply['kind'] | 'note';
  text: string;
  level: Level;
  /** Hidden by default (see `isNoisy`). */
  noisy: boolean;
  /** An SND line: hidden by default only while sound plays here. */
  snd: boolean;
  count: number;
  key: string;
}

/** What the Pi is doing, as far as its log has said. */
export interface PiState {
  program?: string;
  game?: string;
  mode?: string;
}

const BOOT_ASSET = /^(boot|asset)\b/i;
const CRC = /\bcrc\b/i;

/** Lines that bury the useful ones: boot and asset chatter and frame CRCs. */
export function isNoisy(text: string): boolean {
  return BOOT_ASSET.test(text) || CRC.test(text);
}

export function levelOf(kind: LogEntry['kind'], text: string): Level {
  if (kind === 'error' || /^err\b|\b(error|fail(ed|ure)?|fatal|panic|abort)\b/i.test(text)) return 'error';
  if (/\b(warn(ing)?|timeout|retry|missing|not found|no-device)\b/i.test(text)) return 'warn';
  return 'info';
}

const digits = (s: string) => s.replace(/\d+/g, '#');

export class LogModel {
  readonly entries: LogEntry[] = [];
  state: PiState = {};

  constructor(private readonly limit = 400) {}

  /** Adds a line (merging it into the last entry when they repeat); true when the state changed. */
  add(kind: LogEntry['kind'], text: string): boolean {
    const noisy = isNoisy(text);
    const snd = /^snd\b/i.test(text);
    // noisy lines repeat with changing numbers (offsets, sizes); the rest must match exactly
    const key = noisy ? digits(text) : text;
    const last = this.entries[this.entries.length - 1];
    if (last && last.key === key && last.kind === kind) {
      last.count++;
      last.text = text;
    } else {
      this.entries.push({ kind, text, level: levelOf(kind, text), noisy, snd, count: 1, key });
      while (this.entries.length > this.limit) this.entries.shift();
    }
    return this.learn(text);
  }

  clear(): void {
    this.entries.length = 0;
  }

  /** The entries to show; `all` is the raw log, `soundOn` hides the SND lines. */
  visible(all: boolean, soundOn: boolean): LogEntry[] {
    if (all) return this.entries;
    return this.entries.filter((e) => e.level !== 'info' || !(e.noisy || (e.snd && soundOn)));
  }

  /** The program started by RUN. */
  program(name: string | undefined): void {
    this.state = { program: name };
  }

  private learn(text: string): boolean {
    const before = JSON.stringify(this.state);
    const snd = /^SND game (\S+) (\S+)/i.exec(text);
    if (snd) this.state.game = `${snd[1]}/${snd[2]}`;
    else if (/^SND (end|stopall)\b/i.test(text)) this.state.game = undefined;
    const mode = /\b(?:screen|video|display)?\s*mode\b\s*[=: ]\s*([A-Za-z0-9x_.-]+)/i.exec(text);
    if (mode) this.state.mode = mode[1];
    return JSON.stringify(this.state) !== before;
  }
}

/** "Running GMOS.ELF · game DIR/NAME.GAM · mode 13h", or a plain "No program reported yet.". */
export function stateLine(s: PiState): string {
  const parts = [s.program && `Running ${s.program}`, s.game && `game ${s.game}`, s.mode && `screen mode ${s.mode}`].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Nothing reported by the Pi yet.';
}
