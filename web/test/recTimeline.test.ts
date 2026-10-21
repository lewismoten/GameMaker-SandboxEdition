// Tests: The demo recording timeline model (editors/recording/recTimelineModel.ts).
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseRecording, serializeRecording } from '../src/formats/recording';
import {
  toEvents,
  toKeys,
  toNotes,
  trimAt,
  moveNote,
  idleGaps,
  shortenGap,
  TimeMap,
  isDown,
  capLabel,
  clock,
  EXT,
} from '../src/editor/editors/recording/recTimelineModel';

const ev = (...pairs: [number, number][]) => pairs.map(([t, key]) => ({ t, key }));

describe('demo recording timeline', () => {
  it('turns deltas into absolute ticks and back', () => {
    const keys = [
      { delta: 5, key: 72 },
      { delta: 0, key: 57 },
      { delta: 10, key: 72 | 0x80 },
    ];
    const events = toEvents(keys);
    expect(events.map((e) => e.t)).toEqual([5, 5, 15]);
    expect(toKeys(events)).toEqual(keys);
  });

  it('pairs presses and releases, ignoring repeats, and stacks overlapping keys', () => {
    const events = ev([0, 72], [2, 57], [3, 72], [4, 57 | 0x80], [6, 72 | 0x80], [7, 0x80 | 30], [8, 30]);
    const { notes, lanes } = toNotes(events);
    expect(notes.map((n) => [n.scan, n.start, n.end, n.lane])).toEqual([
      [72, 0, 6, 0],
      [57, 2, 4, 1],
      [30, 8, null, 0],
    ]);
    expect(lanes).toBe(2);
    expect(isDown(notes[2], 1000)).toBe(true);
    expect(isDown(notes[0], 6)).toBe(false);
  });

  it('keeps a gap between notes sharing a lane', () => {
    const events = ev([0, 30], [2, 30 | 0x80], [3, 31], [5, 31 | 0x80]);
    expect(toNotes(events, 0).lanes).toBe(1);
    expect(toNotes(events, 2).lanes).toBe(2);
    // A tap shorter than its keycap still claims the keycap's room.
    expect(toNotes(events, 0, () => 4).lanes).toBe(2);
  });

  it('trims the end, releasing keys held across the cut', () => {
    const events = ev([0, 72], [2, 57], [5, 57 | 0x80], [9, 72 | 0x80], [12, 30]);
    expect(trimAt(events, 3)).toEqual(ev([0, 72], [2, 57], [3, 72 | 0x80], [3, 57 | 0x80]));
    expect(trimAt(events, 12)).toEqual(events);
  });

  it('retimes a press without crossing the same key’s other presses', () => {
    const events = ev([0, 30], [4, 30 | 0x80], [10, 30], [12, 30 | 0x80]);
    const { notes } = toNotes(events);
    expect(moveNote(events, notes, 1, 'start', -100)).toEqual(ev([0, 30], [4, 30 | 0x80], [4, 30], [12, 30 | 0x80]));
    expect(moveNote(events, notes, 0, 'end', 3)).toEqual(ev([0, 30], [7, 30 | 0x80], [10, 30], [12, 30 | 0x80]));
    expect(moveNote(events, notes, 0, 'both', 20)).toEqual(ev([6, 30], [10, 30 | 0x80], [10, 30], [12, 30 | 0x80]));
  });

  it('moves an extended-key prefix with its code and drops repeats', () => {
    const events = ev([1, EXT], [1, 75], [3, EXT], [3, 75], [6, EXT], [6, 75 | 0x80]);
    const { notes } = toNotes(events);
    expect(notes).toHaveLength(1);
    expect(moveNote(events, notes, 0, 'both', 2)).toEqual(ev([3, EXT], [3, 75], [3, EXT], [8, EXT], [8, 75 | 0x80]));
  });

  it('refuses a move that needs a gap longer than 16 bits', () => {
    const events = ev([0, 30], [1, 30 | 0x80], [60000, 31], [60001, 31 | 0x80], [120000, 32]);
    const { notes } = toNotes(events);
    expect(moveNote(events, notes, 1, 'both', -59990)).toBeUndefined();
  });

  it('finds and shortens long pauses', () => {
    const events = ev([300, 30], [310, 30 | 0x80], [5000, 31], [5002, 31 | 0x80]);
    const gaps = idleGaps(events, 100);
    expect(gaps).toEqual([
      { from: 0, to: 300 },
      { from: 310, to: 5000 },
    ]);
    expect(shortenGap(events, gaps[1], 18)).toEqual(ev([300, 30], [310, 30 | 0x80], [328, 31], [330, 31 | 0x80]));
  });

  it('maps ticks to pixels through folded gaps and back', () => {
    const map = new TimeMap(2, [{ from: 100, to: 1100 }], 50);
    expect(map.x(50)).toBe(100);
    expect(map.x(100)).toBe(200);
    expect(map.x(600)).toBe(225);
    expect(map.x(1100)).toBe(250);
    expect(map.x(1110)).toBe(270);
    for (const t of [0, 42, 100, 600, 1100, 1234]) expect(map.t(map.x(t))).toBeCloseTo(t);
    expect(map.x(-5)).toBe(-10);
  });

  it('labels keycaps and clocks', () => {
    expect(capLabel(72, () => '?')).toBe('↑');
    expect(capLabel(30, () => 'A')).toBe('A');
    expect(clock(182)).toBe('0:10.0');
    expect(clock(18.2 * 75, false)).toBe('1:15');
  });

  const nebula = resolve(__dirname, '../../cd/gameware/nebula/demo.rec');
  it.skipIf(!existsSync(nebula))('round-trips a real demo byte for byte', () => {
    const bytes = new Uint8Array(readFileSync(nebula));
    expect(serializeRecording(toKeys(toEvents(parseRecording(bytes))))).toEqual(bytes);
  });
});
