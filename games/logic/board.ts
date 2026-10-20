// A board from ASCII: walls, floor, batteries, the parts on the wires and the outlet,
// plus each battery's wire as a list of moves. The wires are drawn as copper traces (or
// conduits where they run over the housing) and become the paths of the board's sparks.
import { newMap, reindexMonsters, MLEN, type GameMap } from '../../web/src/formats/map';
import { buildMonsters, type Wire } from './mons';
import { E, N, S, W, type BatteryKind } from './tiles';
import type { Bestiary, BlockSet } from './sets';

export const COLS = 16;
export const ROWS = 10;
/** Where every board sits on the 100x100 map; Watt always starts in its middle. */
export const OX = 10;
export const OY = 10;
export const START = { x: OX + 8, y: OY + 5 };

export type Room = 'kitchen' | 'living' | 'garage' | 'attic';

export interface WireSpec {
  /** Moves from the battery: "R3 D2 L1" (or "RRRDDL"). */
  path: string;
  kind?: BatteryKind;
  /** Pink control current (throws relays) instead of ordinary current. */
  ctrl?: boolean;
}

export interface BoardSpec {
  file: string;
  title: string;
  room: Room;
  /** Lines for the title card (a quip about the appliance). */
  card: string[];
  rows: string[];
  wires: Record<string, WireSpec>;
  /** Watt's key presses that solve it: U D L R moves, "." waits a beat, "w" a long wait. */
  solution: string;
  /** Hint book: a nudge and the answer. */
  hint: string;
  answer: string;
}

const PARTS: Record<string, string> = {
  o: 'switchOff',
  i: 'switchOn',
  t: 'timerOff',
  g: 'gate',
  f: 'fuse',
  n: 'relayNO',
  c: 'relayNC',
};
const DIODES: Record<string, string> = { '>': 'diodeE', '<': 'diodeW', '^': 'diodeN', v: 'diodeS' };
const DECOR: Record<string, string> = { '%': 'cap', '=': 'res', '&': 'ic', '*': 'led', '~': 'xtal' };
const DIRS: Record<string, [number, number, number, number]> = { U: [0, -1, N, S], D: [0, 1, S, N], L: [-1, 0, W, E], R: [1, 0, E, W] };

export interface Board {
  spec: BoardSpec;
  map: GameMap;
  mons: Bestiary;
  exit: { x: number; y: number };
  /** Cells each wire runs through, in board coordinates. */
  wireCells: Map<string, [number, number][]>;
}

function parseMoves(path: string): string[] {
  const out: string[] = [];
  for (const m of path
    .replace(/\s+/g, ' ')
    .trim()
    .matchAll(/([UDLR])(\d*)/g))
    for (let i = 0; i < (m[2] ? Number(m[2]) : 1); i++) out.push(m[1]);
  return out;
}

export function compileBoard(spec: BoardSpec, tiles: BlockSet, mb: BlockSet): Board {
  const { rows } = spec;
  if (rows.length !== ROWS || rows.some((r) => r.length !== COLS)) throw new Error(`${spec.file}: board must be ${COLS}x${ROWS}`);
  if (rows[5][8] !== '@') throw new Error(`${spec.file}: Watt starts at column 8, row 5`);
  const at = (x: number, y: number) => rows[y]?.[x] ?? ' ';
  const isBattery = (ch: string) => /^[0-9A-F]$/.test(ch);
  const isWall = (ch: string) => ch === '#' || ch === ' ' || ch in DECOR || isBattery(ch);
  const traceBits = new Map<string, number>();
  const bit = (x: number, y: number, b: number) => traceBits.set(`${x},${y}`, (traceBits.get(`${x},${y}`) ?? 0) | b);

  const wires: (Wire | undefined)[] = [];
  const wireCells = new Map<string, [number, number][]>();
  const sideGates = new Set<string>();
  for (const [letter, w] of Object.entries(spec.wires)) {
    const k = parseInt(letter, 16);
    let bx = -1;
    let by = -1;
    rows.forEach((row, y) => [...row].forEach((ch, x) => ch === letter && ((bx = x), (by = y))));
    if (bx < 0) throw new Error(`${spec.file}: no battery ${letter}`);
    let x = bx;
    let y = by;
    const cells: [number, number][] = [[x, y]];
    const corners: [number, number][] = [];
    let last = '';
    for (const mv of parseMoves(w.path)) {
      const [dx, dy, out, into] = DIRS[mv];
      if (last && mv !== last) corners.push([x - bx, y - by]);
      bit(x, y, out);
      x += dx;
      y += dy;
      bit(x, y, into);
      cells.push([x, y]);
      last = mv;
    }
    for (const [cx, cy] of cells.slice(1, -1)) if (at(cx, cy) === 'g') throw new Error(`${spec.file}: wire ${letter} runs through a gate at ${cx},${cy}`);
    corners.push([x - bx, y - by]);
    // Current runs four pixels into an open gate's doorway before the posts swallow it; Watt
    // keeps clear of the top rows and middle sides of his block, but not the bottom (treads).
    if (at(x, y) === 'g' && last === 'U') throw new Error(`${spec.file}: wire ${letter} can't reach its gate from below`);
    if (at(x, y) === 'g' && last !== 'D') sideGates.add(`${x},${y}`);
    wires[k] = { corners, ctrl: w.ctrl };
    wireCells.set(letter, cells);
  }

  const mons = buildMonsters(mb, wires);
  /** Gates wired from the side, and switches and fuses on up-and-down wires, are turned. */
  const partName = (ch: string, x: number, y: number) => {
    const tb = traceBits.get(`${x},${y}`) ?? 0;
    if (ch === 'g') return sideGates.has(`${x},${y}`) ? 'gateV' : 'gate';
    const vertical = tb & (N | S) && !(tb & (E | W));
    return 'oif'.includes(ch) && vertical ? `${PARTS[ch]}V` : PARTS[ch];
  };
  const map = newMap();
  map.blocks.fill(tiles.id('void'));
  let placed = 0;
  let exit = { x: 0, y: 0 };
  const put = (x: number, y: number, name: string) => (map.blocks[(OY + y) * MLEN + OX + x] = tiles.id(name));
  const floor = (x: number, y: number) => `floor${(x * 7 + y * 3 + ((x * y) % 5)) % 3}`;
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++) {
      const ch = at(x, y);
      const tb = traceBits.get(`${x},${y}`) ?? 0;
      if (ch === ' ') put(x, y, 'void');
      else if (ch === '#') {
        if (tb) put(x, y, `conduit${tb}`);
        else {
          let m = 0;
          if (isWall(at(x, y - 1))) m |= N;
          if (isWall(at(x + 1, y))) m |= E;
          if (isWall(at(x, y + 1))) m |= S;
          if (isWall(at(x - 1, y))) m |= W;
          put(x, y, `wall${m}`);
        }
      } else if (ch in DECOR) put(x, y, DECOR[ch]);
      else if (isBattery(ch)) {
        const k = parseInt(ch, 16);
        const kind = spec.wires[ch]?.kind ?? 'steady';
        put(x, y, kind === 'steady' ? `bat${k}` : kind === 'dead' ? `dead${k}` : `pulse${k}`);
      } else if (ch === 'X') {
        put(x, y, 'outlet');
        exit = { x: OX + x, y: OY + y };
      } else if (ch === '$') put(x, y, 'screw');
      else if (ch in DIODES) put(x, y, DIODES[ch]);
      else if (ch === '@') put(x, y, tb ? `trace${tb}` : 'pad');
      else if (ch === '.' || ch in PARTS) put(x, y, tb ? `trace${tb}` : floor(x, y));
      else throw new Error(`${spec.file}: what is '${ch}' at ${x},${y}?`);
      if (ch in PARTS)
        map.monsters[placed++] = {
          monnum: mons.id(partName(ch, x, y)),
          status: 0,
          xtra: 0,
          curx: OX + x,
          cury: OY + y,
          extra: 0,
        };
    }
  reindexMonsters(map);
  if (!exit.x) throw new Error(`${spec.file}: no outlet`);
  return { spec, map, mons, exit, wireCells };
}
