// Which keys the touch d-pad sends for each of its eight directions, and which of a character's
// keys that makes needless on the touch strip.
//
// A sequence moves the character when its frames' offsets (up to the end marker) add up to a
// direction, no frame steps back against it (a jump that goes up and comes down doesn't count),
// and more of its frames move than fire (a frame that gives birth to a monster moves nothing: a
// ship's exhaust puff on the way still counts as moving, a shot doesn't). Its direction is one
// of the pad's eight: a diagonal when the smaller of its two offsets is at least a quarter of
// the larger, so a platformer's jump to the left (-8, -24) is up-left.
//
// The pad always sends the arrows (the keypad's 8, 4, 6 and 2 are the same scan codes), and also
// the character's own move key for a way whose arrow starts nothing (W, a top-row digit). A
// diagonal sends the keypad's 7, 9, 1 or 3 when that moves the character within 45° of it (a
// ship that always drifts up still has its keypad 1); else a key that moves exactly that way
// (Q, E…); else its two arrows.
//
// The strip leaves out every key the pad sends, and every move key that does just what one of
// those does (W beside the up arrow, Q beside the keypad's 7). A key that fires, jumps, moves
// differently or does anything else stays.
import { CHARBL, MONBL } from '../formats/blocks';
import type { Sequence } from '../formats/character';

/** The pad's eight directions as 45° sectors, clockwise from right (screen y grows down). */
export type Sector = 0 | 1 | 2 | 3 | 4 | -1 | -2 | -3;

const STRAIGHT: readonly Sector[] = [0, 2, 4, -2];
const DIAGONAL: readonly Sector[] = [1, 3, -1, -3];

/** The arrow (straight) or keypad diagonal scan code of each sector. */
const SECTOR_SCAN: Record<Sector, number> = { 0: 77, 1: 81, 2: 80, 3: 79, 4: 75, [-1]: 73, [-2]: 72, [-3]: 71 };

/** A diagonal's two straight halves. */
const HALVES: Record<number, [Sector, Sector]> = { 1: [2, 0], 3: [2, 4], [-1]: [-2, 0], [-3]: [-2, 4] };

/** The sector (dx, dy) points into, or undefined for no motion. */
export function sectorOf(dx: number, dy: number): Sector | undefined {
  if (!dx && !dy) return undefined;
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const sx = ax * 4 >= ay ? Math.sign(dx) : 0;
  const sy = ay * 4 >= ax ? Math.sign(dy) : 0;
  const BY_SIGNS: Record<string, Sector> = { '1,0': 0, '1,1': 1, '0,1': 2, '-1,1': 3, '-1,0': 4, '1,-1': -1, '0,-1': -2, '-1,-1': -3 };
  return BY_SIGNS[`${sx},${sy}`];
}

/** The frames that run, up to the end marker. */
const framesOf = (seq: Sequence) => {
  const end = seq.frames.findIndex((f) => f.pic2 === CHARBL + 1);
  return end < 0 ? seq.frames : seq.frames.slice(0, end);
};

/** The way a sequence moves the character, or undefined when it doesn't just move. */
export function sequenceSector(seq: Sequence): Sector | undefined {
  const frames = framesOf(seq);
  const steps = frames.filter((f) => f.pic2 !== MONBL);
  const dx = steps.reduce((n, f) => n + f.x, 0);
  const dy = steps.reduce((n, f) => n + f.y, 0);
  const sector = sectorOf(dx, dy);
  if (sector === undefined) return undefined;
  // every step goes the same way along each axis it moves on (a jump's up and down don't)
  if (steps.some((f) => f.x * dx < 0 || f.y * dy < 0)) return undefined;
  // mostly moving, not mostly firing
  const moving = steps.filter((f) => f.x || f.y).length;
  return moving > frames.length - steps.length ? sector : undefined;
}

/** What a sequence does to the character's place, and the monsters it fires: two the same are one move. */
const motion = (seq: Sequence) =>
  [seq.momentum ? 'm' : '', ...framesOf(seq).map((f) => (f.pic2 === MONBL ? `M${f.pic1}@${f.x},${f.y}` : `${f.x},${f.y}`))].join(' ');

export interface PadPlan {
  /** The scan codes the pad presses for each sector, in order (the last one's sequence runs). */
  press: Record<Sector, number[]>;
  /** The scan codes the touch strip leaves out: the pad's, and the move keys that do just what a pad key does. */
  covered: Set<number>;
}

/** What the pad presses for a character's sequences (the five built-in ones never count as moves). */
export function padPlan(sequences: readonly Sequence[]): PadPlan {
  /** scan -> its sequences (past the built-in five), or null when a built-in one uses it. */
  const byScan = new Map<number, Sequence[] | null>();
  sequences.forEach((seq, i) => {
    const scan = seq.key >> 8;
    if (!scan) return;
    const was = byScan.get(scan);
    byScan.set(scan, i < 5 || was === null ? null : [...(was ?? []), seq]);
  });
  /** The one way all of a key's sequences move the character, else undefined. */
  const wayOf = (scan: number): Sector | undefined => {
    const seqs = byScan.get(scan);
    const ways = seqs ? [...new Set(seqs.map(sequenceSector))] : [];
    return ways.length === 1 ? ways[0] : undefined;
  };
  /** The key that moves the character toward `s`: the sector's own pad key if it does, else the first. */
  const mover = (s: Sector) => (wayOf(SECTOR_SCAN[s]) === s ? SECTOR_SCAN[s] : [...byScan.keys()].find((k) => wayOf(k) === s));
  /** The keypad's diagonal key for `s` when it moves the character that way or one of its halves. */
  const keypad = (s: Sector) => {
    const way = wayOf(SECTOR_SCAN[s]);
    return way === s || (way !== undefined && HALVES[s].includes(way)) ? SECTOR_SCAN[s] : undefined;
  };

  const press = {} as Record<Sector, number[]>;
  for (const s of STRAIGHT) {
    const arrow = SECTOR_SCAN[s];
    const own = byScan.has(arrow) ? undefined : mover(s);
    // the arrow always (menus and games read it), and the character's own move key when the arrow starts nothing
    press[s] = own === undefined ? [arrow] : [arrow, own];
  }
  for (const s of DIAGONAL) {
    const own = keypad(s) ?? mover(s);
    press[s] = own === undefined ? HALVES[s].flatMap((h) => press[h]) : [own];
  }

  const covered = new Set(Object.values(press).flat());
  const padMoves = new Set([...covered].flatMap((k) => byScan.get(k) ?? []).map(motion));
  for (const [scan, seqs] of byScan) if (seqs?.length && wayOf(scan) !== undefined && seqs.every((q) => padMoves.has(motion(q)))) covered.add(scan);
  return { press, covered };
}
