// Platform (side view): ground running left to right with pits no wider than the hero clears, steps no
// higher than he jumps, towers with a ladder where he climbs, spikes he jumps over, stepping stones across
// wide pits and ledges to jump up to (solid on top only, when the block set has them). Every size comes from
// what the hero can really do (jumpModel.ts, measured by platformCap.ts) times the difficulty, and the
// finished layout is played through by the reach model (platformReach.ts): the exit must be reachable, every
// coin, key and heart touched on some move, and a locked door must really hold until its key is picked up.
// A layout that fails is drawn again, easier. No DOM.
import { DECOR, HAZARD, KEY, LADDER, LIFE, LOCK, PLAT, ROOF, SKY, TREASURE, WALL, newArea, type Area, type Stream } from './grid';
import { BLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import type { HeroPhysics } from './jumpModel';
import { capability } from './platformCap';
import { reachFrom } from './platformReach';
import type { LockInfo } from './props';

export interface PlatformOptions {
  physics: HeroPhysics;
  /** 0.1 to 1: the share of the hero's most (gap width and step height) the layout asks of him. */
  difficulty: number;
  /** Which blocks the set has. */
  ladder: boolean;
  hazard: boolean;
  /** A solid-on-top-only ledge block. */
  ledge: boolean;
  /** The top of the ground is a different block (wall-top). */
  cap: boolean;
  /** Lock numbers that have both a locked-door block and a key block (the first is used). */
  pairs: number[];
  treasure: boolean;
  life: boolean;
  monsters: number[];
  decorate: boolean;
}

export interface PlatformProof {
  /** The exit can be reached by jump math (with the key picked up first when there is a lock). */
  exit: boolean;
  /** Every coin, the key and the heart were touched on some move. */
  collectable: boolean;
  /** With the lock shut he cannot reach the exit, and he can reach the key. True with no lock. */
  lockHolds: boolean;
}

export interface PlatformLayout {
  area: Area;
  entry: number;
  exit: number;
  locks: LockInfo[];
  /** Every cell of each locked door (a tall one), as area indexes. */
  doorCells: number[];
  treasure: number[];
  life?: number;
  monsters: { cell: number; monnum: number }[];
  notes: string[];
  proof: PlatformProof;
  /** The difficulty the layout was finally drawn with (lower than asked when a harder one could not be proven). */
  difficulty: number;
  /** What the hero can do, in cells: the highest step and the widest gap on level ground. */
  can: { rise: number; gap: number };
  /** The tallest step and widest pit (cells) the layout actually asks him to jump (ladders and spikes not counted). */
  asked: { rise: number; gap: number };
}

interface Flat {
  x0: number;
  len: number;
  s: number;
}

const SIDE_ROOM = 2;

/** One try at a layout; `proof.exit` says whether it works. */
function attempt(w: number, h: number, r: Stream, o: PlatformOptions, d: number): PlatformLayout {
  const area = newArea(w, h, SKY);
  const cap = capability(o.physics);
  const notes: string[] = [];
  const R = Math.max(1, Math.floor(cap.maxRise * d));
  const gapFor = (rise: number) => Math.max(1, Math.floor((cap.gapAt[Math.max(0, Math.min(rise, cap.gapAt.length - 1))] ?? cap.maxGap) * d));
  const rowMin = Math.ceil(o.physics.rise / BLEN) + 3;
  const rowMax = h - 4;
  const set = (x: number, y: number, c: number) => (area.cells[y * w + x] = c);
  const solidCol = (x: number, top: number) => {
    for (let y = top; y < h; y++) set(x, y, y === top && o.cap ? ROOF : WALL);
  };
  for (let y = 0; y < h; y++) (set(0, y, WALL), set(w - 1, y, WALL));
  let x = 1;
  let s = Math.max(rowMin, Math.min(rowMax, h - 6));
  const flats: Flat[] = [];
  const gaps: { x: number; g: number; s: number }[] = [];
  const stones: { x: number; len: number; t: number }[] = [];
  const spikes: number[] = [];
  const ledges: { x: number; len: number; t: number }[] = [];
  const flat = (n: number) => {
    const x0 = x;
    for (let i = 0; i < n && x < w - 1; i++) solidCol(x++, s);
    flats.push({ x0, len: x - x0, s });
  };
  const asked = { rise: 0, gap: 0 };
  flat(6);
  const entry = (s - 1) * w + 3;
  const depth = Math.min(2, R);
  while (x < w - 12) {
    const kinds: string[] = ['flat', 'flat', 'gap', 'gap', 'gap', 'step', 'step', 'step'];
    if (o.hazard) kinds.push('spikes', 'spikes');
    const high = (rowMax - s) / Math.max(1, rowMax - rowMin);
    if (o.ladder && o.physics.climb && s - (R + 1) >= rowMin && high < 0.6) kinds.push('tower');
    if (o.ledge && R >= 2) kinds.push('ledge', 'ledge');
    if (w - 1 - x > 24) kinds.push('stones', 'stones');
    const kind = r.pick(kinds);
    if (kind === 'flat') flat(r.int(3, 8));
    else if (kind === 'gap') {
      const g = r.int(1, gapFor(0));
      const bottom = Math.min(h - 2, s + depth);
      for (let i = 0; i < g; i++) {
        if (o.hazard) set(x + i, bottom, HAZARD);
        for (let y = bottom + (o.hazard ? 1 : 0); y < h; y++) set(x + i, y, WALL);
      }
      asked.gap = Math.max(asked.gap, g);
      gaps.push({ x, g, s });
      x += g;
      flat(r.int(2, 4));
    } else if (kind === 'step') {
      const up = r.chance(0.7 - 0.6 * high);
      const dr = r.int(1, R);
      const s2 = up ? s - dr : s + dr;
      if (s2 >= rowMin && s2 <= rowMax) {
        asked.rise = Math.max(asked.rise, dr);
        s = s2;
      }
      flat(r.int(2, 5));
    } else if (kind === 'spikes') {
      const wd = r.int(1, Math.max(1, Math.min(2, Math.floor(cap.maxSpikes * d * 0.5))));
      const n = 8 + wd;
      const x0 = x;
      flat(n);
      const sx = x0 + 3 + r.int(0, 1);
      for (let i = 0; i < wd; i++) set(sx + i, s - 1, HAZARD);
      spikes.push(sx);
    } else if (kind === 'tower') {
      const H = r.int(R + 1, R + 4);
      const s2 = s - H;
      if (s2 < rowMin) continue;
      solidCol(x, s);
      for (let y = s2 - 1; y <= s - 1; y++) set(x, y, LADDER);
      x++;
      s = s2;
      flat(r.int(3, 5));
    } else if (kind === 'ledge') {
      const rise = r.int(2, R);
      const n = 9;
      const x0 = x;
      flat(n);
      const len = r.int(3, 4);
      const lx = x0 + 3;
      for (let i = 0; i < len; i++) set(lx + i, s - rise, PLAT);
      ledges.push({ x: lx, len, t: s - rise });
    } else {
      // stones across a wide pit, ending on ground no higher than the last stone
      const k = r.int(2, 4);
      const list: { x: number; len: number; t: number }[] = [];
      let px = x,
        pt = s;
      for (let i = 0; i < k; i++) {
        const dt = r.int(-R, R);
        let t = Math.max(rowMin, Math.min(rowMax - 1, pt - dt));
        if (i === 0) t = Math.min(t, s);
        const g = r.int(1, gapFor(Math.max(0, pt - t)));
        asked.gap = Math.max(asked.gap, g);
        asked.rise = Math.max(asked.rise, Math.abs(pt - t));
        const len = r.int(2, 3);
        list.push({ x: px + g, len, t });
        px += g + len;
        pt = t;
      }
      const maxT = Math.max(...list.map((q) => q.t));
      const last = list[list.length - 1];
      const endG = r.int(1, gapFor(0));
      asked.gap = Math.max(asked.gap, endG);
      const endX = px + endG;
      if (endX + 8 >= w - 1) continue;
      const floor = Math.min(h - 2, maxT + 1);
      const sEnd = Math.max(last.t, floor - R);
      if (sEnd > rowMax) continue;
      for (let cx = x; cx < endX; cx++) {
        if (o.hazard) set(cx, floor, HAZARD);
        for (let y = floor + (o.hazard ? 1 : 0); y < h; y++) set(cx, y, WALL);
      }
      for (const q of list) {
        for (let cx = q.x; cx < q.x + q.len; cx++) set(cx, q.t, o.ledge ? PLAT : WALL);
        stones.push(q);
      }
      x = endX;
      s = sEnd;
      flat(r.int(3, 5));
    }
  }
  flat(w - 1 - x);
  const exitX = w - 4;
  const exit = (s - 1) * w + exitX;

  // props: coins where the hero walks and jumps, a heart high up, a locked door with its key, monsters
  const proof: PlatformProof = { exit: false, collectable: true, lockHolds: true };
  const open = reachFrom(area, o.physics, entry, true);
  proof.exit = open.stood[exit] === 1;
  const taken = new Set<number>([entry, exit]);
  const treasure: number[] = [];
  let life: number | undefined;
  const locks: LockInfo[] = [];
  const doorCells: number[] = [];
  const emptyCell = (c: number) => area.cells[c] === SKY && !taken.has(c);
  const near = (c: number, list: number[], gap: number) =>
    list.some((o2) => Math.abs((o2 % w) - (c % w)) < gap && Math.abs(((o2 / w) | 0) - ((c / w) | 0)) < 3);

  // a locked door in the middle of a long run late in the level, its key on an earlier run
  const pair = o.pairs[0];
  if (pair !== undefined && proof.exit) {
    const longRuns = flats.filter((f) => f.len >= 7 && f.x0 > w * 0.4 && f.x0 + f.len < w - 10);
    const before = (f: Flat) => flats.filter((q) => q.len >= 4 && q.x0 + q.len < f.x0 - 4 && q.x0 > 6);
    const door = longRuns.find((f) => before(f).length > 0);
    if (door) {
      const dx = door.x0 + (door.len >> 1);
      const rows = Math.min(door.s, Math.ceil(o.physics.rise / BLEN) + 3);
      const cells: number[] = [];
      for (let y = door.s - rows; y < door.s; y++) cells.push(y * w + dx);
      const keyRun = r.pick(before(door));
      const keyCell = (keyRun.s - 1) * w + keyRun.x0 + (keyRun.len >> 1);
      if (cells.every((c) => area.cells[c] === SKY) && area.cells[keyCell] === SKY) {
        for (const c of cells) area.cells[c] = LOCK;
        const shut = reachFrom(area, o.physics, entry, false);
        if (shut.stood[exit] === 0 && shut.touched[keyCell] === 1) {
          area.cells[keyCell] = KEY;
          taken.add(keyCell);
          for (const c of cells) taken.add(c);
          doorCells.push(...cells);
          locks.push({ cell: cells[cells.length - 1], key: keyCell, pair, order: 0 });
        } else {
          for (const c of cells) area.cells[c] = SKY;
          notes.push(
            shut.stood[exit] ? 'A locked door could be jumped over, so none was drawn.' : 'The key could not be reached before its door, so no door was drawn.',
          );
        }
      }
    }
  }
  // opening the door changes nothing the first pass found: the lock cells were open then
  const reach = open;

  if (o.treasure && proof.exit) {
    const cand: number[] = [];
    const add = (cx: number, cy: number) => {
      if (cx < 1 || cx >= w - 1 || cy < 1 || cy >= h) return;
      const c = cy * w + cx;
      if (emptyCell(c) && reach.touched[c]) cand.push(c);
    };
    for (const f of flats) for (let cx = f.x0 + 1; cx < f.x0 + f.len - 1; cx += 3) if (Math.abs(cx - 3) > 3 && Math.abs(cx - exitX) > 3) add(cx, f.s - 1);
    for (const g of gaps) {
      const cx = g.x + (g.g >> 1);
      for (const dy of [3, 2]) {
        const c = (g.s - dy) * w + cx;
        if (emptyCell(c) && reach.touched[c]) {
          cand.push(c);
          break;
        }
      }
    }
    for (const q of stones) add(q.x + (q.len >> 1), q.t - 1);
    for (const l of ledges) add(l.x + 1, l.t - 1);
    const budget = Math.max(4, Math.min(30, Math.floor(w / 5)));
    const uniq = [...new Set(cand)].sort((p, q) => (p % w) - (q % w));
    const step = Math.max(1, uniq.length / budget);
    for (let i = 0; i < uniq.length && treasure.length < budget; i += step) {
      const c = uniq[Math.floor(i)];
      if (!near(c, treasure, 2)) treasure.push(c);
    }
    if (o.life && treasure.length > 2) {
      // the heart goes on the highest place he can stand, away from the ends
      let best = -1;
      for (let c = 0; c < w * h; c++) {
        if (!reach.stood[c] || c % w < 8 || c % w > w - 9 || taken.has(c)) continue;
        const y = (c / w) | 0;
        if (best < 0 || y < ((best / w) | 0) || (y === ((best / w) | 0) && r.chance(0.3))) best = c;
      }
      if (best >= 0) {
        life = best;
        const i = treasure.findIndex((c) => Math.abs((c % w) - (best % w)) < 3);
        if (i >= 0) treasure.splice(i, 1);
      }
    }
    for (const c of treasure) ((area.cells[c] = TREASURE), taken.add(c));
    if (life !== undefined) ((area.cells[life] = LIFE), taken.add(life));
  }
  proof.collectable = [...treasure, ...(life === undefined ? [] : [life]), ...locks.map((l) => l.key)].every((c) => reach.touched[c] === 1);

  // monsters stand on long runs, well away from the start and the spikes
  const monsters: { cell: number; monnum: number }[] = [];
  if (o.monsters.length && proof.exit) {
    const doorX = doorCells.length ? doorCells[0] % w : -99;
    const spots: number[] = [];
    for (const f of flats)
      if (f.len >= 6)
        for (let cx = f.x0 + SIDE_ROOM + 1; cx < f.x0 + f.len - SIDE_ROOM - 1; cx++)
          if (cx > 12 && cx < w - 8 && Math.abs(cx - doorX) > 2) {
            const c = (f.s - 1) * w + cx;
            if (emptyCell(c) && reach.stood[c]) spots.push(c);
          }
    const budget = Math.max(1, Math.min(6, Math.floor(w / 18)));
    const placed: number[] = [];
    for (let tries = 0; tries < spots.length * 2 && monsters.length < budget && spots.length; tries++) {
      const c = spots[Math.floor(r.next() * spots.length)];
      if (placed.some((p2) => Math.abs((p2 % w) - (c % w)) < 8)) continue;
      placed.push(c);
      taken.add(c);
      monsters.push({ cell: c, monnum: r.pick(o.monsters) });
    }
    monsters.sort((p, q) => p.cell - q.cell);
  }
  if (o.decorate)
    for (const f of flats)
      if (f.len >= 5 && r.chance(0.6)) {
        const c = (f.s - 1) * w + f.x0 + f.len - 2;
        if (emptyCell(c) && c % w < w - 6 && !spikes.includes(c % w)) area.cells[c] = DECOR;
      }
  if (!spikes.length && o.hazard) notes.push('No spikes fit this layout.');
  return { area, entry, exit, locks, doorCells, treasure, life, monsters, notes, proof, difficulty: d, can: { rise: cap.maxRise, gap: cap.maxGap }, asked };
}

/** A side view filling a w by h area (at least 40 by 20). Draws again, easier, when a layout cannot be proven. */
export function platform(w: number, h: number, r: Stream, o: PlatformOptions): PlatformLayout {
  let best: PlatformLayout | undefined;
  for (let i = 0; i < 8; i++) {
    const d = Math.max(0.2, o.difficulty - (i >= 3 ? 0.1 * (i - 2) : 0));
    const l = attempt(w, h, r, o, d);
    if (l.proof.exit && l.proof.collectable && l.proof.lockHolds) {
      if (d < o.difficulty) l.notes.push(`Drawn a little easier than asked (${Math.round(d * 100)}%): the first layouts could not be proven.`);
      return l;
    }
    best ??= l;
  }
  best!.notes.push('No layout could be proven reachable by jump math.');
  return best!;
}
