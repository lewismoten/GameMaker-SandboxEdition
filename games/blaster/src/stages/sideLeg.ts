// A side-scrolling leg: a band one screen tall (rows TOP..TOP+9 of the map) that the BLASTER
// flies along from left to right with shipside.chr, the screen scrolling right only. The leg
// gives a ceiling and a floor height for every column (solid rows from the top and from the
// bottom); the builder lays the terrain with slopes where a height steps by one, the launch
// rail, the gate near the right end (the map wraps, so the view must never reach past column
// 99), and gives the leg a Side to put its turrets, hatches, firewalls, drafts, pickups,
// scenery and virus on, by column and band row.
import { MLEN, MWID } from '../../../../web/src/formats/map';
import { BlockSet } from '../art/draw';
import type { Pal } from '../art/pal';
import { EGG_BLOCK, eggPic } from '../blocks/egg';
import { addMeter, addSideTiles, type SideArt, type SideOpts } from '../blocks/sideTiles';
import { Bestiary } from '../characters/mons';
import { POWER } from '../ids';
import { addCommon } from '../characters/sharedMonsters';
import { Grid } from './mapkit';
import type { Leg } from './stage';

/** The band's top map row and its height (one screen: vertical scrolling is off). */
export const TOP = 45;
export const ROWS = 10;
/** The ship's start (the view's left column is 8 to its left: column 0). */
export const SIDE_START = { x: 8, y: TOP + 5 };
/** The gate's column: when the ship reaches it the view runs to about column 97. */
export const GATE = 86;

/** A leg's terrain blocks, by role (the leg draws them, solid but for the slopes). */
const TERRAIN = ['cIn', 'cBot', 'cUp', 'cDn', 'fIn', 'fTop', 'fUp', 'fDn'] as const;

/** Putting things on the band, by column (0..99) and band row (0 at the top). */
export class Side {
  constructor(
    readonly g: Grid,
    readonly ceil: number[],
    readonly floor: number[],
  ) {}

  at(c: number, r: number): string {
    return this.g.at(c, TOP + r);
  }

  put(c: number, r: number, name: string): this {
    if (r < 0 || r >= ROWS) throw new Error(`Off the band: ${c},${r}`);
    this.g.put(c, TOP + r, name);
    return this;
  }

  /** Is (c, r) open space between the ceiling and the floor? */
  open(c: number, r: number): boolean {
    return r >= this.ceil[c] && r < ROWS - this.floor[c];
  }

  /** The first open row under the ceiling, and the last one over the floor. */
  top(c: number): number {
    return this.ceil[c];
  }

  bottom(c: number): number {
    return ROWS - 1 - this.floor[c];
  }

  mon(c: number, r: number, name: string): this {
    if (!this.open(c, r)) throw new Error(`${name} in the terrain at ${c},${r}`);
    if (c < 20) throw new Error(`${name} too near the launch at ${c}`);
    this.g.monAt(c, TOP + r, name);
    return this;
  }

  /** A turret on the floor or the ceiling, with its armored collar. */
  turret(c: number, on: 'floor' | 'ceil', kind: 'sweep' | 'seeker' | 'flak' = 'sweep'): this {
    const r = on === 'floor' ? this.bottom(c) : this.top(c);
    const name = kind === 'seeker' ? (on === 'floor' ? 'tsF' : 'tsC') : kind === 'flak' ? 'tkF' : on === 'floor' ? 'tfU' : 'tcL';
    return this.put(c, r, name).mon(c, r, 'ring3');
  }

  /** A virus hatch in the floor's or the ceiling's face; with `lid` a collar to shoot off. */
  hatch(c: number, on: 'floor' | 'ceil', lid = true): this {
    const r = on === 'floor' ? this.bottom(c) + 1 : this.top(c) - 1;
    this.put(c, r, on === 'floor' ? 'hatchF' : 'hatchC');
    // the collar floats just off the face, where the ship can shoot it
    return lid ? this.mon(c, on === 'floor' ? r - 1 : r + 1, 'ring3') : this;
  }

  /** A firewall from the ceiling to the floor at column c; phase A or B. */
  fence(c: number, phase: 'A' | 'B' = 'A'): this {
    const t = this.top(c);
    const b = this.bottom(c);
    this.put(c, t, 'postT').put(c, b, 'postB');
    for (let r = t + 1; r < b; r++) this.put(c, r, `beam${phase}`);
    return this;
  }

  /** Drafts over columns c0..c1 (every open row), shoving up or down. */
  draft(c0: number, c1: number, dir: 'U' | 'D', r0 = 0, r1 = ROWS - 1): this {
    for (let c = c0; c <= c1; c++) for (let r = Math.max(r0, this.top(c)); r <= Math.min(r1, this.bottom(c)); r++) this.put(c, r, `cur${dir}`);
    return this;
  }

  pickup(c: number, r: number, kind: 'nova' | 'repair' | 'life' | 'bit'): this {
    if (!this.open(c, r)) throw new Error(`${kind} in the terrain at ${c},${r}`);
    return this.put(c, r, kind);
  }

  /** A picture of blocks `${prefix}${row}${col}`, its top-left at (c, r). */
  stamp(c: number, r: number, prefix: string, w: number, h: number): this {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) this.put(c + x, r + y, `${prefix}${y}${x}`);
    return this;
  }

  /**
   * Scenery over bare backdrop: each item [block or stamp prefix, w, h, where] sits on the
   * floor, hangs from the ceiling, or floats ('any'). Leaves room around monsters and
   * everything already built.
   */
  scatter(items: [string, number, number, 'floor' | 'ceil' | 'any'][], count: number, c0 = 12, c1 = GATE - 4): this {
    const busy = new Set<string>();
    for (const m of this.g.map.monsters) if (m.monnum < 64) for (let d = -1; d <= 1; d++) busy.add(`${m.curx + d},${m.cury}`);
    const rnd = this.g.rnd;
    const bare = (c: number, r: number) => this.open(c, r) && this.at(c, r).startsWith('floor') && !busy.has(`${c},${TOP + r}`);
    for (let placed = 0, tries = 0; placed < count && tries < count * 80; tries++) {
      const [name, w, h, where] = items[Math.floor(rnd() * items.length)];
      const c = c0 + Math.floor(rnd() * (c1 - c0 - w));
      let r: number;
      if (where === 'floor') r = this.bottom(c) - h + 1;
      else if (where === 'ceil') r = this.top(c);
      else r = this.top(c) + Math.floor(rnd() * Math.max(1, this.bottom(c) - this.top(c) - h + 2));
      let ok = r >= 0 && r + h <= ROWS;
      for (let y = 0; y < h && ok; y++) for (let x = -1; x <= w && ok; x++) if (!bare(c + x, r + y)) ok = false;
      if (!ok) continue;
      if (w === 1 && h === 1) this.put(c, r, name);
      else this.stamp(c, r, name, w, h);
      placed++;
    }
    return this;
  }
}

export interface SideSpec {
  file: string;
  title: string;
  card: string[];
  seed: number;
  pal: Pal;
  art: SideArt;
  /** The leg's own blocks: its terrain (TERRAIN, by those names) and its scenery. */
  own: (bs: BlockSet) => void;
  virus: (b: Bestiary) => void;
  opts: SideOpts;
  /** Solid rows from the top and from the bottom, per column (0..99). */
  ceil: number[];
  floor: number[];
  /** Everything else: turrets, hazards, pickups, scenery, virus. */
  build: (s: Side) => void;
  /** The column the card's 16x5 look starts at, and its top band row. */
  cardView: { c: number; r: number };
}

export function sideLeg(s: SideSpec): Leg {
  const { art, pal } = s;
  const bs = new BlockSet(150, 'bbl');
  for (let v = 0; v < art.floors; v++) bs.add(`floor${v}`, art.floor(v));
  s.own(bs);
  for (const t of TERRAIN) if (!bs.has(t)) throw new Error(`${s.file}: no terrain block ${t}`);
  addSideTiles(bs, art, s.opts);
  addMeter(bs, art);
  const beasts = new Bestiary(true);
  addCommon(beasts, pal);
  s.virus(beasts);

  // the near end and the far end are flat and open
  const ceil = s.ceil.slice();
  const floor = s.floor.slice();
  if (ceil.length !== MLEN || floor.length !== MLEN) throw new Error(`${s.file}: a height for every column`);
  for (let c = 0; c < MLEN; c++) if (ceil[c] < 1 || floor[c] < 1 || ceil[c] + floor[c] > ROWS - 3) throw new Error(`${s.file}: column ${c} too tight`);

  const g = new Grid(bs, beasts, art, 0, 1, s.seed, () => 'cIn');
  const side = new Side(g, ceil, floor);
  for (let c = 0; c < MLEN; c++)
    for (let r = 0; r < ROWS; r++) {
      const lastCeil = ceil[c] - 1;
      const firstFloor = ROWS - floor[c];
      let name: string;
      if (r < lastCeil) name = 'cIn';
      else if (r === lastCeil) name = 'cBot';
      else if (r > firstFloor) name = 'fIn';
      else if (r === firstFloor) name = 'fTop';
      // slopes: where the next column's floor is one higher, or the last one's was
      else if (r === firstFloor - 1 && floor[(c + 1) % MLEN] === floor[c] + 1) name = 'fUp';
      else if (r === firstFloor - 1 && floor[(c + MLEN - 1) % MLEN] === floor[c] + 1) name = 'fDn';
      else if (r === lastCeil + 1 && ceil[(c + 1) % MLEN] === ceil[c] + 1) name = 'cDn';
      else if (r === lastCeil + 1 && ceil[(c + MLEN - 1) % MLEN] === ceil[c] + 1) name = 'cUp';
      else name = g.floorName();
      side.put(c, r, name);
    }
  // (a slope is scenery: only the terrain under it is solid)
  for (let y = 0; y < MWID; y++) if (y < TOP || y >= TOP + ROWS) for (let x = 0; x < MLEN; x++) g.put(x, y, 'cIn');

  // the launch rail under the ship, and the gate: a glowing wall across the band
  const sr = SIDE_START.y - TOP;
  if (!side.open(SIDE_START.x, sr)) throw new Error(`${s.file}: the start is in the terrain`);
  for (const c of [SIDE_START.x - 2, SIDE_START.x - 1]) side.put(c, sr, 'launch');
  for (let r = side.top(GATE); r <= side.bottom(GATE); r++) {
    side.put(GATE, r, `gate${r % 4}`).put(GATE + 1, r, `gate${(r + 2) % 4}`);
    g.linkAt(GATE, TOP + r);
  }

  s.build(side);
  // the distance meter: a sign a screen, counting the screens left to the gate
  for (let n = 1; n <= 4; n++) {
    let placed = false;
    for (const d of [0, 1, -1, 2, -2, 3, -3])
      for (let r = side.top(GATE - n * 16 + d); !placed && r <= side.top(GATE - n * 16 + d) + 1; r++) {
        const c = GATE - n * 16 + d;
        if (
          ![c, c + 1].every(
            (x) => side.open(x, r) && side.at(x, r).startsWith('floor') && !g.map.monsters.some((m) => m.monnum < 64 && m.curx === x && m.cury === TOP + r),
          )
        )
          continue;
        side.put(c, r, 'mtr0').put(c + 1, r, `mtrN${n}`);
        placed = true;
      }
    if (!placed) throw new Error(`${s.file}: no room for the meter's ${n}`);
  }
  // last, at the number it has in every set (the inventory keeps only block numbers)
  bs.addAt(EGG_BLOCK, 'egg', eggPic(pal, art.floor(0)), { obj: 1, touch: 'floor0' });
  return {
    file: s.file,
    kitFile: s.file,
    title: s.title,
    kind: 'side',
    grid: g,
    kit: { bs, beasts },
    pal,
    start: SIDE_START,
    cardView: { x: s.cardView.c, y: TOP + s.cardView.r },
    card: s.card,
  };
}

/** Heights that wander between lo and hi a step at a time (seeded), flat for `flat` columns at each end. */
export function wander(rnd: () => number, lo: number, hi: number, flat = 14, every = 3): number[] {
  const out: number[] = [];
  let h = lo;
  for (let c = 0; c < MLEN; c++) {
    if (c >= flat && c < GATE - 6 && c % every === 0) {
      const r = rnd();
      if (r < 0.35 && h < hi) h++;
      else if (r > 0.65 && h > lo) h--;
    }
    if (c >= GATE - 6) h = lo;
    out.push(h);
  }
  return out;
}

/** The mites a side leg's hatches spit: out of the face, then off to the left with a wiggle. */
export function sideMites(b: Bestiary, pic: string, speed = 3, score = 50): void {
  for (const [name, up] of [
    ['miteF', -1],
    ['miteC', 1],
  ] as [string, number][])
    b.add(name, {
      power: POWER.enemy,
      pics: [
        [`${pic}0`, 3],
        [`${pic}1`, 3],
      ],
      becomes: 'boom',
      score,
      end: -1,
      asIs: true,
      path: [
        [0, up * 2, speed],
        [-3, -up, speed],
        [-3, up, speed],
        [-14, 0, speed + 1],
      ],
    });
}
