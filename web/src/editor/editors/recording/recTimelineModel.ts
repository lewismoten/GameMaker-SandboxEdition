// The demo recording as a piano roll: key events at absolute game ticks, the presses
// they form (a key going down until it comes back up), lanes so keys held together
// stack, and the edits the timeline makes (retime a press, trim the end, shorten a
// long pause). Everything here is pure, so it is tested in web/test/recTimeline.test.ts.
import { RECLEN, type RecordedKey } from '../../../formats/recording';

/** The keyboard's 0xE0 "extended key" prefix: DOS recordings keep it before gray-key codes. */
export const EXT = 0xe0;
const MAXDELTA = 0xffff;

/** One recorded key event at an absolute tick (18.2 Hz game clock). */
export interface RecEvent {
  t: number;
  key: number;
}

/** A key held down: from its press to its release (null: still down when the recording ends). */
export interface Note {
  scan: number;
  start: number;
  end: number | null;
  /** Indexes into the events of the press and the release (-1 when there is none). */
  down: number;
  up: number;
  lane: number;
}

export function toEvents(keys: RecordedKey[]): RecEvent[] {
  let t = 0;
  return keys.map((k) => ({ t: (t += k.delta), key: k.key }));
}

export function toKeys(events: RecEvent[]): RecordedKey[] {
  let t = 0;
  return events.slice(0, RECLEN).map((e) => {
    const delta = Math.min(MAXDELTA, Math.max(0, e.t - t));
    t = e.t;
    return { delta, key: e.key };
  });
}

/** The tick of the last event. */
export function duration(events: RecEvent[]): number {
  return events.length ? events[events.length - 1].t : 0;
}

const isPrefix = (key: number) => key === EXT || key === 0xe1;

/**
 * Pairs presses with releases. A press of a key that is already down (typematic repeat)
 * and a release of a key that is not down change nothing in the game, so they make no
 * note. Lanes are handed out first-free, keeping minGap ticks between notes in a lane;
 * capTicks says how long a key's keycap is (in ticks), so a short tap still claims room.
 */
export function toNotes(events: RecEvent[], minGap = 0, capTicks: (scan: number) => number = () => 0): { notes: Note[]; lanes: number } {
  const notes: Note[] = [];
  const open = new Map<number, Note>();
  // Keys a between-scene screen read (screenKeys) never reached the game: no note.
  const screen = new Set(screenKeys(events).flatMap((k) => k.events));
  events.forEach((e, i) => {
    if (isPrefix(e.key) || screen.has(i)) return;
    const scan = e.key & 0x7f;
    const held = open.get(scan);
    if (e.key < 0x80) {
      if (held) return;
      const n: Note = { scan, start: e.t, end: null, down: i, up: -1, lane: 0 };
      notes.push(n);
      open.set(scan, n);
    } else if (held) {
      held.end = e.t;
      held.up = i;
      open.delete(scan);
    }
  });
  const laneEnds: number[] = [];
  for (const n of notes) {
    let lane = laneEnds.findIndex((end) => end + minGap <= n.start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = Math.max(n.end ?? Infinity, n.start + capTicks(n.scan));
    n.lane = lane;
  }
  return { notes, lanes: Math.max(1, laneEnds.length) };
}

/** Is the note's key down at tick t? */
export function isDown(n: Note, t: number): boolean {
  return n.start <= t && (n.end === null || t < n.end);
}

/** Keeps the events up to tick t; keys still held there (but released later) are released at t. */
export function trimAt(events: RecEvent[], t: number): RecEvent[] {
  const kept = events.filter((e) => e.t <= t);
  const { notes } = toNotes(events);
  const ups = notes.filter((n) => n.start <= t && n.end !== null && n.end > t).map((n) => ({ t, key: n.scan | 0x80 }));
  // A prefix byte left dangling at the very end would prefix nothing.
  while (kept.length && isPrefix(kept[kept.length - 1].key)) kept.pop();
  return [...kept, ...ups];
}

export type Grip = 'start' | 'end' | 'both';

/** How far (in ticks) a note may move: [min, max] of dt. */
export function moveRange(events: RecEvent[], notes: Note[], index: number, grip: Grip): [number, number] {
  const n = notes[index];
  const same = notes.filter((m) => m.scan === n.scan);
  const k = same.indexOf(n);
  const lo = k > 0 ? (same[k - 1].end ?? same[k - 1].start) : 0;
  const hi = k < same.length - 1 ? same[k + 1].start : Infinity;
  const end = n.end ?? duration(events);
  if (grip === 'start') return [lo - n.start, end - n.start];
  if (grip === 'end') return n.end === null ? [0, 0] : [n.start - n.end, hi - n.end];
  return [lo - n.start, n.end === null ? Infinity : hi - n.end];
}

/**
 * Moves a note's press, release or both by dt ticks (clamped so it never overlaps the
 * same key's other presses). Its repeat presses go; an 0xE0 prefix moves with its code.
 * Returns undefined if the result would need a gap longer than a .REC delta can hold.
 */
export function moveNote(events: RecEvent[], notes: Note[], index: number, grip: Grip, dt: number): RecEvent[] | undefined {
  const n = notes[index];
  const [min, max] = moveRange(events, notes, index, grip);
  dt = Math.round(Math.min(max, Math.max(min, dt)));
  const moved = new Map<number, number>();
  const shift = (i: number) => {
    if (i < 0) return;
    moved.set(i, events[i].t + dt);
    if (i > 0 && isPrefix(events[i - 1].key) && events[i - 1].t === events[i].t) moved.set(i - 1, events[i].t + dt);
  };
  if (grip !== 'end') shift(n.down);
  if (grip !== 'start') shift(n.up);
  const repeatEnd = n.up < 0 ? events.length : n.up;
  const out = events
    .map((e, i) => ({ t: moved.get(i) ?? e.t, key: e.key, i }))
    .filter((e) => !(e.i > n.down && e.i < repeatEnd && e.key === n.scan))
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .map(({ t, key }) => ({ t, key }));
  for (let i = 0, t = 0; i < out.length; t = out[i].t, i++) if (out[i].t - t > MAXDELTA || out[i].t < 0) return undefined;
  return out;
}

/** A stretch of time in which no key goes down or up. */
export interface Gap {
  from: number;
  to: number;
}

/** The stretches of at least minLen ticks in which no key goes down or up (including the one before the first key). */
export function idleGaps(events: RecEvent[], minLen: number): Gap[] {
  const gaps: Gap[] = [];
  let last = 0;
  for (const e of events) {
    if (e.t - last >= minLen) gaps.push({ from: last, to: e.t });
    last = e.t;
  }
  return gaps;
}

/** Shortens the stretch [from, to] to len ticks by moving every later event earlier. */
export function shortenGap(events: RecEvent[], gap: Gap, len: number): RecEvent[] {
  const cut = Math.max(0, gap.to - gap.from - len);
  return events.map((e) => (e.t >= gap.to ? { t: e.t - cut, key: e.key } : e));
}

/**
 * PLAYGAME's recorder counted a tick per game tick while playing, but one per GetKey
 * poll while a between-scene screen (an animation, picture or text page) waited for a
 * key — thousands a second. A recording made in DOS therefore stores a key pressed
 * during such a screen after a gap of many thousands; no game-tick gap is this long.
 */
const SCREEN_POLLS = 4096;

/** The gaps that are a screen's GetKey polls rather than time in play (DOS recordings). */
export function screenGaps(events: RecEvent[]): Gap[] {
  return idleGaps(events, SCREEN_POLLS + 1);
}

/** A key pressed while a between-scene screen waited for one (DOS recordings). */
export interface ScreenKey {
  /** When the screen read it: the end of the screen's gap. */
  t: number;
  scan: number;
  /** The indexes of the events it was recorded as (one press, recorded at each poll that saw it). */
  events: number[];
}

/**
 * The keys between-scene screens read. During a screen the recorder saw the key through
 * GetKey, which recorded the BIOS key (a scan code, never a release) every time it was
 * polled and found one: PauseTimeKey (GENC.C) polls GetKey(1) until a key comes, then
 * calls GetKey(1) and GetKey(0) to return it, so one press is recorded three times, one
 * poll apart (Nebula's three Enter presses are 3 + 3 + 3 events), and a keyboard flush
 * (while (GetKey(1)) GetKey(0), PLAYGAME.C) records any repeats the same way. The screen
 * used the key up and the game's keyboard handler never saw it go down or up, so it is a
 * mark on the screen band, not a key held to the end of the demo. The run is the event
 * after a screen gap and the same key at each following poll (delta of 1). Every waiting
 * loop peeks before it reads (GetKey(1) then GetKey(0)), so a screen's key is always
 * recorded at least twice; a lone event after a long gap is a key pressed in play (a
 * recording made in the browser can idle that long), and stays a note.
 */
export function screenKeys(events: RecEvent[]): ScreenKey[] {
  const out: ScreenKey[] = [];
  let last = 0;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const gap = e.t - last;
    last = e.t;
    if (gap <= SCREEN_POLLS || e.key >= 0x80 || isPrefix(e.key)) continue;
    const k: ScreenKey = { t: e.t, scan: e.key, events: [i] };
    while (i + 1 < events.length && events[i + 1].key === e.key && events[i + 1].t - events[i].t <= 1) k.events.push(++i);
    last = events[i].t;
    if (k.events.length > 1) out.push(k);
  }
  return out;
}

/**
 * Maps ticks to pixels at pxPerTick, squeezing each folded gap into foldPx pixels so a
 * long wait does not push the rest of the demo off into the distance. Screen gaps
 * (screenGaps) are always folded and marked, and play() leaves them out of times.
 */
export class TimeMap {
  readonly segs: { t0: number; t1: number; x0: number; x1: number; fold: boolean; screen: boolean }[] = [];
  constructor(
    readonly pxPerTick: number,
    folds: Gap[] = [],
    readonly screens: Gap[] = [],
    readonly foldPx = 56,
  ) {
    let t = 0;
    let x = 0;
    const all = [...folds.filter((g) => !screens.some((c) => c.from === g.from && c.to === g.to)), ...screens].sort((a, b) => a.from - b.from);
    for (const g of all) {
      const screen = screens.includes(g);
      if (!screen && (g.to - g.from) * pxPerTick <= foldPx) continue;
      if (g.from < t) continue;
      if (g.from > t) this.segs.push({ t0: t, t1: g.from, x0: x, x1: (x += (g.from - t) * pxPerTick), fold: false, screen: false });
      this.segs.push({ t0: g.from, t1: g.to, x0: x, x1: (x += foldPx), fold: true, screen });
      t = g.to;
    }
    this.segs.push({ t0: t, t1: Infinity, x0: x, x1: Infinity, fold: false, screen: false });
  }

  /** Game ticks of play up to t: a screen's GetKey polls count as no time. */
  play(t: number): number {
    let p = t;
    for (const g of this.screens) if (t > g.from) p -= Math.min(t, g.to) - g.from;
    return p;
  }

  x(t: number): number {
    const s = this.segs.find((s) => t < s.t1) ?? this.segs[this.segs.length - 1];
    if (t < s.t0) return s.x0 - (s.t0 - t) * this.pxPerTick;
    return s.fold ? s.x0 + ((t - s.t0) / (s.t1 - s.t0)) * (s.x1 - s.x0) : s.x0 + (t - s.t0) * this.pxPerTick;
  }

  t(x: number): number {
    const s = this.segs.find((s) => x < s.x1) ?? this.segs[this.segs.length - 1];
    if (x < s.x0) return s.t0 - (s.x0 - x) / this.pxPerTick;
    return s.fold ? s.t0 + ((x - s.x0) / (s.x1 - s.x0)) * (s.t1 - s.t0) : s.t0 + (x - s.x0) / this.pxPerTick;
  }
}

const CAPS: Record<number, string> = {
  1: 'Esc',
  14: 'Bksp',
  15: 'Tab',
  28: 'Enter',
  29: 'Ctrl',
  42: 'Shift',
  54: 'Shift',
  56: 'Alt',
  57: 'Space',
  58: 'Caps',
  55: '*',
  69: 'Num',
  70: 'Scrl',
  71: 'Home',
  72: '↑',
  73: 'PgUp',
  74: '-',
  75: '←',
  76: '5',
  77: '→',
  78: '+',
  79: 'End',
  80: '↓',
  81: 'PgDn',
  82: 'Ins',
  83: 'Del',
  87: 'F11',
  88: 'F12',
};

/** The legend printed on a key's keycap. */
export function capLabel(scan: number, name: (scan: number) => string): string {
  return CAPS[scan] ?? name(scan);
}

/** m:ss.s for a tick count. */
export function clock(ticks: number, tenths = true): string {
  const s = Math.max(0, ticks) / 18.2;
  if (!tenths) {
    const r = Math.round(s);
    return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;
  }
  const d = Math.round(s * 10);
  return `${Math.floor(d / 600)}:${((d % 600) / 10).toFixed(1).padStart(4, '0')}`;
}
