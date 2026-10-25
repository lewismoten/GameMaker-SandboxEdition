// Animations as the game plays them, for the editors' live previews: a clip is a cols x rows
// picture whose cells each run a track of blocks (each shown for its ticks, 1/18.2 s), all on
// one clock. Background blocks follow their "changes into" chains (blockAnim.ts); a monster
// steps through its pic list and starts over (engine/monsters.ts); a character sequence shows
// its frames' top and bottom blocks, turned as each frame says. Pure: nothing here draws.
import { CHARBL, MONBL, type Block } from '../../../formats/blocks';
import { frameCount, type Character } from '../../../formats/character';
import { LASTSL, type Monster } from '../../../formats/monster';
import { blockAnim } from './blockAnim';
import type { BlockGroup } from './blockGroups';

interface ClipStep {
  /** -1 shows nothing. */
  block: number;
  /** Ticks shown; Infinity when the track stops here. */
  ticks: number;
  orient?: number;
}

export interface Track {
  col: number;
  row: number;
  steps: ClipStep[];
  /** The step the track goes back to after its last one, or -1 when it stops. */
  loopTo: number;
}

export interface Clip {
  label: string;
  cols: number;
  rows: number;
  tracks: Track[];
}

/** Which step of the track shows at `tick` (0 = when the clip starts). */
export function stepAt(t: Track, tick: number): number {
  let at = 0;
  for (let k = 0; k < t.steps.length; k++) {
    const d = t.steps[k].ticks;
    if (!Number.isFinite(d) || tick < at + d) return k;
    at += d;
  }
  if (t.loopTo < 0) return t.steps.length - 1;
  const loop = t.steps.slice(t.loopTo).reduce((n, s) => n + s.ticks, 0);
  if (!(loop > 0)) return t.loopTo;
  let rest = (tick - at) % loop;
  for (let k = t.loopTo; k < t.steps.length; k++) {
    if (rest < t.steps[k].ticks) return k;
    rest -= t.steps[k].ticks;
  }
  return t.steps.length - 1;
}

/** The first tick at which the track starts showing step k (the first time round). */
export function tickOf(t: Track, k: number): number {
  return t.steps.slice(0, k).reduce((n, s) => n + (Number.isFinite(s.ticks) ? s.ticks : 0), 0);
}

/** The next tick after `tick` when any track changes picture, or Infinity when none ever does. */
export function nextChange(c: Clip, tick: number): number {
  let best = Infinity;
  for (const t of c.tracks) {
    const k = stepAt(t, tick);
    if (!Number.isFinite(t.steps[k].ticks)) continue;
    // walk forward to where this step ends
    let end = tick + 1;
    while (end - tick < 100000 && stepAt(t, end) === k) end++;
    best = Math.min(best, end);
  }
  return best;
}

/** True when nothing in the clip ever changes. */
export const isStill = (c: Clip): boolean => c.tracks.every((t) => t.steps.length === 1);

/** Ticks once round the clip's longest loop (or until its last change, for chains that stop). */
export function clipTicks(c: Clip): number {
  return Math.max(
    0,
    ...c.tracks.map((t) => (t.loopTo < 0 ? tickOf(t, t.steps.length - 1) : t.steps.slice(t.loopTo).reduce((n, s) => n + s.ticks, 0) + tickOf(t, t.loopTo))),
  );
}

function bblTrack(blocks: Pick<Block, 'nextBl' | 'ntime'>[], start: number, col = 0, row = 0): Track {
  const a = blockAnim(blocks, start);
  return { col, row, steps: a.steps.map((s) => ({ block: s.block, ticks: s.ticks })), loopTo: a.loopTo };
}

/** A background block's own animation. */
export function bblClip(blocks: Pick<Block, 'nextBl' | 'ntime'>[], start: number): Clip {
  return { label: `Block ${start}`, cols: 1, rows: 1, tracks: [bblTrack(blocks, start)] };
}

/** A group of background blocks, each cell running its own chain, all from the level's start. */
export function bblGroupClip(blocks: Pick<Block, 'nextBl' | 'ntime'>[], g: BlockGroup): Clip {
  return {
    label: g.name,
    cols: g.cols,
    rows: g.rows,
    tracks: g.cells.flatMap((b, i) => (b < 0 ? [] : [bblTrack(blocks, b, i % g.cols, Math.floor(i / g.cols))])),
  };
}

/** A monster's pictures up to its end marker, each for its ticks (at least one), then round again. */
function monsterTrack(m: Monster, col = 0, row = 0): Track | undefined {
  const steps: ClipStep[] = [];
  for (let i = 0; i < LASTSL && m.pic[i][0] < MONBL; i++) steps.push({ block: m.pic[i][0], ticks: Math.max(1, m.pic[i][1]) });
  if (!steps.length) return undefined;
  if (steps.length === 1) steps[0].ticks = Infinity;
  return { col, row, steps, loopTo: steps.length > 1 ? 0 : -1 };
}

/** Every used monster whose pictures include `block`. */
export function monsterClips(mons: Monster[], block: number): Clip[] {
  return mons.flatMap((m, i) => {
    if (!m.used) return [];
    const t = monsterTrack(m);
    return t && t.steps.some((s) => s.block === block) ? [{ label: `Monster ${i}`, cols: 1, rows: 1, tracks: [t] }] : [];
  });
}

/**
 * A monster group's animation: each cell runs the monster that shows the cell's block at the
 * same point of its list as `block` is in its own monster's list (the monsters that move as one),
 * or stays still when there is none.
 */
export function monsterGroupClip(mons: Monster[], g: BlockGroup, block: number): Clip {
  const tracks: Track[] = [];
  const own = mons.map((m) => (m.used ? monsterTrack(m) : undefined));
  const home = own.find((t) => t?.steps.some((s) => s.block === block));
  const at = home?.steps.findIndex((s) => s.block === block) ?? -1;
  g.cells.forEach((b, i) => {
    if (b < 0) return;
    const col = i % g.cols;
    const row = Math.floor(i / g.cols);
    const t =
      (b === block && home) ||
      own.find((o) => o && home && at >= 0 && o.steps.length === home.steps.length && o.steps[at]?.block === b) ||
      own.find((o) => o?.steps[0].block === b);
    tracks.push(t ? { ...t, col, row } : { col, row, steps: [{ block: b, ticks: Infinity }], loopTo: -1 });
  });
  return { label: g.name, cols: g.cols, rows: g.rows, tracks };
}

/** The character's sequences that show `block` (top or bottom), each as a 1 x 2 clip, looping. */
export function characterClips(chr: Character, block: number, names: (i: number) => string = (i) => `Sequence ${i}`): Clip[] {
  return chr.sequences.flatMap((s, i) => {
    const frames = s.frames.slice(0, frameCount(s)).filter((f) => f.pic2 !== MONBL);
    if (!frames.some((f) => f.pic1 === block || f.pic2 === block)) return [];
    const part = (pic: (f: (typeof frames)[0]) => number, orient: (o: number) => number): ClipStep[] =>
      frames.map((f) => ({ block: pic(f) < CHARBL ? pic(f) : -1, ticks: Math.max(1, f.pause), orient: orient(f.orient) }));
    const loop = frames.length > 1 ? 0 : -1;
    const top = part(
      (f) => f.pic1,
      (o) => o & 15,
    );
    const bottom = part(
      (f) => f.pic2,
      (o) => (o >> 4) & 15,
    );
    if (loop < 0) top[0].ticks = bottom[0].ticks = Infinity;
    return [
      {
        label: names(i),
        cols: 1,
        rows: 2,
        tracks: [
          { col: 0, row: 0, steps: top, loopTo: loop },
          { col: 0, row: 1, steps: bottom, loopTo: loop },
        ],
      },
    ];
  });
}
