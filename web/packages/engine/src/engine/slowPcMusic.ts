/**
 * What a song costs a slow PC's timer interrupt (engine/slowPc.ts). PLAYGAME's NewTimer runs
 * PlayIt (code/GM/SBMUSIC.C) on every interrupt, 145.6 a second, and PlayIt hands each CMF event
 * due that interrupt to Creative's FM driver (sbfd_note_on, sbfd_note_off, sbfd_program_change).
 * The driver is not in the source, so the register writes per event are ESTIMATES of what such a
 * driver does: a note on keys the voice off, sets its level and frequency and keys it on (4
 * writes), a note off clears the key bit (1), a program change loads both operators' five
 * registers and the feedback register (11).
 *
 * The cost is the song's average over one pass, charged on every interrupt: the same every time
 * the song plays, whatever the game does. Even the busiest interrupt of a busy song (up to about
 * 24 events, under 4 ms on a 10 MHz 286) stays inside the 6.9 ms between interrupts, so the music itself
 * never makes the timer lose one; it only takes its share of the CPU from the game.
 */
import { loadSong } from '../audio/cmfLoad';
import { TICK_RATE } from '../audio/cmfPlayer';
import type { PcCosts } from './slowPc';

const WRITES = { on: 4, off: 1, program: 11 };

export interface SongLoad {
  /** Interrupts in one pass of the song. */
  interrupts: number;
  events: number;
  writes: number;
  /** The most events and register writes due on one interrupt. */
  peakEvents: number;
  peakWrites: number;
}

/** One pass through a CMF's music, walked as PlayIt walks it; undefined for a song PLAYGAME refuses. */
export function songLoad(cmf: Uint8Array | undefined): SongLoad | undefined {
  const music = loadSong(cmf)?.music;
  if (!music) return undefined;
  let o = 0;
  const delta = () => {
    let v = 0;
    let c: number;
    do {
      c = music[o++] ?? 0;
      v = v * 128 + (c & 0x7f);
    } while (c & 0x80 && o < music.length);
    return v;
  };
  delta(); // PlayIt skips the song's opening silence
  const load: SongLoad = { interrupts: 0, events: 0, writes: 0, peakEvents: 0, peakWrites: 0 };
  let status = 0x80;
  let events = 0;
  let writes = 0;
  const close = () => {
    load.peakEvents = Math.max(load.peakEvents, events);
    load.peakWrites = Math.max(load.peakWrites, writes);
    events = writes = 0;
  };
  while (o < music.length) {
    if (music[o] & 0x80) status = music[o++];
    const hi = status & 0xf0;
    let w = 0;
    if (hi === 0x90) w = music[o + 1] ? WRITES.on : WRITES.off;
    else if (hi === 0x80) w = WRITES.off;
    else if (hi === 0xc0) w = WRITES.program;
    if (hi === 0x80 || hi === 0x90 || hi === 0xa0 || hi === 0xb0 || hi === 0xe0) o += 2;
    else if (hi === 0xc0 || hi === 0xd0) o += 1;
    else break; // FF 2F (or anything else): PlayIt starts the song over
    if (w) {
      events++;
      writes += w;
      load.events++;
      load.writes += w;
    }
    const d = delta();
    if (d) close();
    load.interrupts += d;
  }
  close();
  return load;
}

/** The song's average cost per timer interrupt on `pc`, in ms (0 without music figures or a song). */
export function songIsrMs(pc: PcCosts | undefined, load: SongLoad | undefined): number {
  if (!pc?.isrMs) return 0;
  if (!load || !load.interrupts) return pc.isrMs;
  return pc.isrMs + (load.events * (pc.fmEventMs ?? 0) + load.writes * (pc.fmWriteMs ?? 0)) / load.interrupts;
}

/** The busiest interrupt of the song on `pc`, in ms: what it would take to make the timer lose a beat. */
export function songPeakIsrMs(pc: PcCosts, load: SongLoad): number {
  return (pc.isrMs ?? 0) + load.peakEvents * (pc.fmEventMs ?? 0) + load.peakWrites * (pc.fmWriteMs ?? 0);
}

/** Milliseconds between two timer interrupts (6.87). */
export const INTERRUPT_MS = 1000 / TICK_RATE;
