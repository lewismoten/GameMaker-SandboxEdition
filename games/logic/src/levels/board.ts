// Boards from ASCII: walls, floor, batteries, the parts on the wires and the outlet, plus
// each battery's wire as a list of moves. The wires are drawn as copper traces (or conduits
// where they run over the housing) and become the paths of the sparks.
//
// All the boards of a room share one 100x100 map (one Game-Maker scene): each sits in its
// own 16x10 window, far enough from the others that their batteries (which only give birth
// near the screen) stay quiet while Watt works on another board. Each board's outlet is a
// link back into the same scene, landing on the next board's pad.
import { newMap, reindexMonsters, LASTMM, MLEN, type GameMap } from '../../../../web/src/formats/map';
import { buildMonsters, type Wire } from '../characters/mons';
import { E, N, S, W, STYLES, buildTiles, type Battery, type BatteryKind } from '../blocks/tiles';
import type { Bestiary, BlockSet } from '../blocks/sets';

export const COLS = 16;
export const ROWS = 10;
/** Where the boards of a room sit on its map (top-left corners); Watt starts in the middle. */
export const SLOTS: [number, number][] = [2, 22, 42, 62, 82].flatMap((y) => [2, 36, 70].map((x) => [x, y] as [number, number]));

export type Room = 'kitchen' | 'living' | 'garage' | 'attic';

export interface WireSpec {
  /** Moves from the battery: "R3 D2 L1" (or "RRRDDL"). */
  path: string;
  kind?: BatteryKind;
  /** Pink control current (throws relays) instead of ordinary current. */
  ctrl?: boolean;
  /** An astable 555's ticks high (low is half that). */
  high?: number;
}

export interface BoardSpec {
  file: string;
  title: string;
  room: Room;
  /** Lines for the title card (a quip about the appliance). */
  card: string[];
  rows: string[];
  /** 'breadboard': a solderless breadboard and jumper wires instead of a circuit board. */
  look?: 'breadboard';
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
const DECOR: Record<string, string> = { '%': 'cap', '=': 'res', '&': 'ic', '*': 'led', '~': 'xtal', '[': 'cpu0', '|': 'cpu1', ']': 'cpu2' };
/** Parts sunk in the housing over a wire that current lights up: the two halves of a
 * character LCD, and the CitiCar (tail, middle, nose). */
const LCD: Record<string, string> = { '{': 'lcd0', '}': 'lcd1', K: 'car0', M: 'car1', N: 'car2' };
const DIRS: Record<string, [number, number, number, number]> = { U: [0, -1, N, S], D: [0, 1, S, N], L: [-1, 0, W, E], R: [1, 0, E, W] };

export interface Board {
  spec: BoardSpec;
  /** The room's shared map and monsters. */
  map: GameMap;
  mons: Bestiary;
  /** Top-left corner of the board on the map, Watt's pad and the outlet (map blocks). */
  ox: number;
  oy: number;
  start: { x: number; y: number };
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

export interface CompiledRoom {
  room: Room;
  tiles: BlockSet;
  map: GameMap;
  mons: Bestiary;
  boards: Board[];
}

interface Parsed {
  spec: BoardSpec;
  ox: number;
  oy: number;
  traceBits: Map<string, number>;
  sideGates: Set<string>;
  ctrlCells: Set<string>;
  wireCells: Map<string, [number, number][]>;
  /** Room wire number of each battery character. */
  wireOf: Map<string, number>;
}

/** Compiles the boards of one room onto one map, with one monster list and block set. */
export function compileRoom(room: Room, specs: BoardSpec[], mb: BlockSet): CompiledRoom {
  if (specs.length > SLOTS.length) throw new Error(`${room}: ${specs.length} boards, room for ${SLOTS.length}`);
  const wires: Wire[] = [];
  const kinds: BatteryKind[] = [];
  const highs: (number | undefined)[] = [];
  const parsed: Parsed[] = specs.map((spec, n) => {
    const [ox, oy] = SLOTS[n];
    const { rows } = spec;
    if (rows.length !== ROWS || rows.some((r) => r.length !== COLS)) throw new Error(`${spec.file}: board must be ${COLS}x${ROWS}`);
    if (rows[5][8] !== '@') throw new Error(`${spec.file}: Watt starts at column 8, row 5`);
    const at = (x: number, y: number) => rows[y]?.[x] ?? ' ';
    const traceBits = new Map<string, number>();
    const bit = (x: number, y: number, b: number) => traceBits.set(`${x},${y}`, (traceBits.get(`${x},${y}`) ?? 0) | b);
    const wireCells = new Map<string, [number, number][]>();
    const sideGates = new Set<string>();
    const ctrlCells = new Set<string>();
    const wireOf = new Map<string, number>();
    for (const [letter, w] of Object.entries(spec.wires)) {
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
      wireOf.set(letter, wires.length);
      wires.push({ corners, ctrl: w.ctrl });
      kinds.push(w.kind ?? 'steady');
      highs.push(w.high);
      wireCells.set(letter, cells);
      if (w.ctrl) for (const [cx, cy] of cells) ctrlCells.add(`${cx},${cy}`);
    }
    // Red current dies where it crosses live control current: don't let them cross.
    for (const [a, ca] of wireCells)
      for (const [b2, cb] of wireCells)
        if (spec.wires[a].ctrl && !spec.wires[b2].ctrl)
          for (const [x1, y1] of ca)
            if (cb.some(([x2, y2]) => x1 === x2 && y1 === y2) && !'nc'.includes(at(x1, y1)))
              throw new Error(`${spec.file}: control wire ${a} crosses wire ${b2} at ${x1},${y1}`);
    return { spec, ox, oy, traceBits, sideGates, ctrlCells, wireCells, wireOf };
  });

  const mons = buildMonsters(mb, wires);
  const batteries: Battery[] = kinds.map((kind, k) => ({ k, kind, mon: mons.id(`wire${k}`), high: highs[k] }));
  const tiles = buildTiles(STYLES[room], batteries, { breadboard: specs.some((s) => s.look === 'breadboard') });
  const map = newMap();
  map.blocks.fill(tiles.id('void'));
  let placed = 0;
  const boards = parsed.map((p) => {
    const { spec, ox, oy, traceBits, sideGates, ctrlCells } = p;
    const at = (x: number, y: number) => spec.rows[y]?.[x] ?? ' ';
    const isBattery = (ch: string) => /^[0-9A-F]$/.test(ch);
    const isWall = (ch: string) => ch === '#' || ch === ' ' || ch === ':' || ch in DECOR || ch in LCD || isBattery(ch);
    /** Gates wired from the side, and switches and fuses on up-and-down wires, are turned. */
    const partName = (ch: string, x: number, y: number) => {
      const tb = traceBits.get(`${x},${y}`) ?? 0;
      if (ch === 'g') return sideGates.has(`${x},${y}`) ? 'gateV' : 'gate';
      const vertical = tb & (N | S) && !(tb & (E | W));
      const name = 'oif'.includes(ch) && vertical ? `${PARTS[ch]}V` : PARTS[ch];
      if ('oi'.includes(ch) && ctrlCells.has(`${x},${y}`)) return `${name}C`;
      if (ctrlCells.has(`${x},${y}`) && 'tf'.includes(ch)) throw new Error(`${spec.file}: no ${name} on a control wire at ${x},${y}`);
      return name;
    };
    let exit = { x: 0, y: 0 };
    const put = (x: number, y: number, name: string) => (map.blocks[(oy + y) * MLEN + ox + x] = tiles.id(name));
    const bb = spec.look === 'breadboard';
    const floor = (x: number, y: number) => `${bb ? 'bb' : 'floor'}${(x * 7 + y * 3 + ((x * y) % 5)) % 3}`;
    const traceName = (tb: number) => `${bb ? 'jumper' : 'trace'}${tb}`;
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const ch = at(x, y);
        const tb = traceBits.get(`${x},${y}`) ?? 0;
        if (ch === ' ') put(x, y, 'void');
        else if (ch in LCD) {
          if (!tb) throw new Error(`${spec.file}: the LCD at ${x},${y} is on no wire`);
          put(x, y, `conduit${tb}`);
        } else if (ch === '#') {
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
        else if (ch === ':') put(x, y, 'out555');
        else if (isBattery(ch)) {
          const k = p.wireOf.get(ch);
          if (k === undefined) throw new Error(`${spec.file}: battery ${ch} has no wire`);
          const kind = kinds[k];
          const names = { steady: 'bat', dead: 'dead', antipulse: 'pulseOff', pulse: 'pulse', astable: 'chip' };
          put(x, y, `${names[kind]}${k}`);
        } else if (ch === 'X') {
          put(x, y, bb ? 'bbOutlet' : 'outlet');
          exit = { x: ox + x, y: oy + y };
        } else if (ch === '$') put(x, y, bb ? 'bbScrew' : 'screw');
        else if (ch in DIODES) put(x, y, DIODES[ch]);
        else if (ch === '@') put(x, y, tb ? traceName(tb) : bb ? 'bbPad' : 'pad');
        else if (ch === '.' || ch in PARTS) put(x, y, tb ? traceName(tb) : floor(x, y));
        else throw new Error(`${spec.file}: what is '${ch}' at ${x},${y}?`);
        if (ch in PARTS || ch in LCD) {
          if (placed >= LASTMM) throw new Error(`${room}: too many parts`);
          map.monsters[placed++] = { monnum: mons.id(ch in LCD ? LCD[ch] : partName(ch, x, y)), status: 0, xtra: 0, curx: ox + x, cury: oy + y, extra: 0 };
        }
      }
    if (!exit.x) throw new Error(`${spec.file}: no outlet`);
    return { spec, map, mons, ox, oy, start: { x: ox + 8, y: oy + 5 }, exit, wireCells: p.wireCells };
  });
  reindexMonsters(map);
  return { room, tiles, map, mons, boards };
}

export const ROOMS: Room[] = ['kitchen', 'living', 'garage', 'attic'];

/** Every room, its boards in order. */
export function compileHouse(specs: BoardSpec[], mb: BlockSet): CompiledRoom[] {
  return ROOMS.map((room) =>
    compileRoom(
      room,
      specs.filter((s) => s.room === room),
      mb,
    ),
  ).filter((r) => r.boards.length);
}
