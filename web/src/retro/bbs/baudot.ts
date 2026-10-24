// A TTY's (TDD's) line code: 5-bit Baudot at 45.45 baud, frequency shift keyed between
// 1400 Hz (mark, a 1) and 1800 Hz (space, a 0), with no carrier between characters. Each
// character is a start bit, five data bits (low bit first) and one and a half stop bits:
// 165 ms, about 6 characters a second. Two shift codes, LTRS and FIGS, pick letters or
// figures; the sender starts with LTRS and repeats the shift every 72 characters (ITU-T
// V.18, 1994, Annex A and section 5.3). The US TTY figures table follows TIA-825; it was
// cross-checked against Asterisk's tdd.c (GPL, nothing copied). See NOTICE.md.
import type { Line } from './modem';

export const BAUD = 45.45;
export const BIT = 0.022; // seconds: 1 / 45.45
export const MARK = 1400;
export const SPACE = 1800;
/** Start bit, five data bits, 1.5 stop bits. */
export const CHAR_SECONDS = BIT * 7.5;
/** The mark tone a TTY sends before its first character (V.18 Annex A). */
export const LEAD_SECONDS = 0.15;

export const LTRS = 31;
export const FIGS = 27;
const CR = 8;
const LF = 2;
const SP = 4;

/** Letters by code (blank: no letter there). */
const LETTERS = '\0E\nA SIU\rDRJNFCKTZLWHYPQOBG\0MXV\0';
/** Figures by code, US TTY (\x07: the bell; blank: unused here). */
const FIGURES = '\x003\n- \x0787\r$4\',!:(5")2\x006019?\x00\x00./;\x00';

const letterCode = new Map<string, number>();
const figureCode = new Map<string, number>();
for (let i = 0; i < 32; i++) {
  if (i === CR || i === LF || i === SP || i === LTRS || i === FIGS) continue;
  if (LETTERS[i] !== '\0') letterCode.set(LETTERS[i], i);
  if (FIGURES[i] !== '\0') figureCode.set(FIGURES[i], i);
}

/** What a TTY can show of `text`: capitals, digits and its few marks (the rest dropped). */
export function ttyText(text: string): string {
  return [...text.toUpperCase().replace(/\r\n?/g, '\n')].filter((c) => c === '\n' || c === ' ' || letterCode.has(c) || figureCode.has(c)).join('');
}

/**
 * The 5-bit codes for `text`, shifts included. A space can unshift a receiving TTY back to
 * letters ("unshift on space"), so after one the next figure gets its FIGS again.
 */
export function encodeBaudot(text: string): number[] {
  const out: number[] = [LTRS];
  let shift: 'ltrs' | 'figs' | undefined = 'ltrs';
  let sent = 0;
  const put = (code: number) => {
    out.push(code);
    if (++sent % 72 === 0 && shift) out.push(shift === 'ltrs' ? LTRS : FIGS);
  };
  for (const c of ttyText(text)) {
    if (c === '\n') {
      put(CR);
      put(LF);
    } else if (c === ' ') {
      put(SP);
      if (shift === 'figs') shift = undefined;
    } else if (letterCode.has(c)) {
      if (shift !== 'ltrs') out.push(LTRS);
      shift = 'ltrs';
      put(letterCode.get(c)!);
    } else {
      if (shift !== 'figs') out.push(FIGS);
      shift = 'figs';
      put(figureCode.get(c)!);
    }
  }
  return out;
}

/** Reads codes back as text (as the far TTY prints them), starting in letters. */
export function decodeBaudot(codes: number[]): string {
  let figs = false;
  let text = '';
  for (const c of codes) {
    if (c === LTRS) figs = false;
    else if (c === FIGS) figs = true;
    else if (c === LF) text += '\n';
    else if (c === SP) text += ' ';
    else if (c !== CR) text += (figs ? FIGURES : LETTERS)[c].replace('\0', '');
  }
  return text;
}

/** One tone on the line: `freq` from `at` (seconds from the start) for `dur`. */
export interface Tone {
  freq: number;
  at: number;
  dur: number;
}

/** The tones for `codes`: the lead-in mark, then each character's bits (runs of a tone merged). */
export function baudotTones(codes: number[]): Tone[] {
  const tones: Tone[] = [];
  let t = 0;
  const bit = (one: boolean, len = BIT) => {
    const freq = one ? MARK : SPACE;
    const last = tones[tones.length - 1];
    if (last && last.freq === freq && Math.abs(last.at + last.dur - t) < 1e-9) last.dur += len;
    else tones.push({ freq, at: t, dur: len });
    t += len;
  };
  bit(true, LEAD_SECONDS);
  for (const code of codes) {
    bit(false); // start
    for (let i = 0; i < 5; i++) bit(((code >> i) & 1) === 1);
    bit(true, BIT * 1.5); // stop
  }
  return tones;
}

/** Seconds `codes` take on the line, lead-in included. */
export const baudotSeconds = (codes: number[]) => LEAD_SECONDS + codes.length * CHAR_SECONDS;

/**
 * Plays `codes` on a phone line from `start` (the context's time), one oscillator shifting
 * between the two tones with no break in its phase, as a TTY's does. Returns a stop function.
 */
export function playBaudot(line: Line, codes: number[], start: number, level = 0.1): () => void {
  const ctx = line.ctx;
  const tones = baudotTones(codes);
  const end = start + baudotSeconds(codes);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(level, start + 0.005);
  g.gain.setValueAtTime(level, end - 0.005);
  g.gain.linearRampToValueAtTime(0, end);
  g.connect(line.out);
  const o = ctx.createOscillator();
  for (const tone of tones) o.frequency.setValueAtTime(tone.freq, start + tone.at);
  o.connect(g);
  o.start(start);
  o.stop(end);
  return () => {
    try {
      o.stop();
    } catch {
      // already stopped
    }
    g.disconnect();
  };
}
