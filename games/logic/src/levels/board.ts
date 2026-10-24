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
import { E, EGG, N, S, W, STYLES, buildTiles, type Battery, type BatteryKind } from '../blocks/tiles';
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
const DECOR: Record<string, string> = { '%': 'cap', '=': 'res', '&': 'ic', '*': 'led', '~': 'xtal', '[': 'cpu0', '|': 'cpu1', ']': 'cpu2', b: 'bug' };
/** Parts sunk in the housing over a wire that current lights up: the two halves of a
 * character LCD, and the CitiCar (tail, middle, nose). */
const LCD: Record<string, string> = { '{': 'lcd0', '}': 'lcd1', K: 'car0', M: 'car1', N: 'car2' };
const isBattery = (ch: string) => /^[0-9A-F]$/.test(ch);
const isWall = (ch: string) => ch === '#' || ch === ' ' || ch === ':' || ch === '?' || ch === '!' || ch in DECOR || ch in LCD || isBattery(ch);
/** Which neighbors of a housing block are housing too (the autotile mask). */
function wallMask(at: (x: number, y: number) => string, x: number, y: number): number {
  let m = 0;
  if (isWall(at(x, y - 1))) m |= N;
  if (isWall(at(x + 1, y))) m |= E;
  if (isWall(at(x, y + 1))) m |= S;
  if (isWall(at(x - 1, y))) m |= W;
  return m;
}
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
  /** A '?' in the housing: a panel Watt can roll into (map block). */
  seam?: { x: number; y: number };
  /** A '!' in the housing: a hatch into the crawlspace behind the board (map block). */
  hatch?: { x: number; y: number };
}

/** Behind the seam: the house's main fuse box, in the room's last slot. Watt lands on its
 * pad; its socket leads out again. # housing, . board, @ pad, S socket, e the felt egg,
 * P tape on the wall, * % = & parts soldered to the board. */
export const FUSEBOX = [
  '                ',
  '   #####P####   ',
  '   #*......*#   ',
  '   #=...e..=#   ',
  '   #........#   ',
  '   #....@...#   ',
  '   #........#   ',
  '   #%...S..%#   ',
  '   ##########   ',
  '                ',
];

/**
 * Behind a hatch ('!') in a board's housing: the crawlspace, a scene of its own two boards
 * wide. It is the one place in the house that scrolls, so its far end (the tin heart and the
 * painted Easter egg) is off screen as Watt rolls in. # housing, . board, @ where Watt lands,
 * ! the hatch back out, % & parts, h the tin heart, y the Easter egg.
 */
export const CRAWL = [
  '################################',
  '################################',
  '##..........################..h#',
  '##.%........##########.........#',
  '##.............................#',
  '#!......@......................#',
  '##........................&....#',
  '##.........&......#####........#',
  '##..............#########y.....#',
  '################################',
];
/** The crawlspace's top-left on the room's map (clear of every slot a room uses). */
export const CRAWL_AT: [number, number] = [2, 42];

export interface Crawl {
  /** The board whose hatch leads in (and where the hatch out sends Watt back to). */
  from: Board;
  start: { x: number; y: number };
  exit: { x: number; y: number };
}

export interface Fusebox {
  /** The board whose seam leads in (and where the socket sends Watt back to). */
  from: Board;
  start: { x: number; y: number };
  exit: { x: number; y: number };
  egg: { x: number; y: number };
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
  fusebox?: Fusebox;
  crawl?: Crawl;
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
  const seams = new Set<number>();
  for (const { spec } of parsed)
    spec.rows.forEach((row, y) => [...row].forEach((ch, x) => ch === '?' && seams.add(wallMask((x2, y2) => spec.rows[y2]?.[x2] ?? ' ', x, y))));
  const fusebox = seams.size > 0;
  if (fusebox && specs.length >= SLOTS.length) throw new Error(`${room}: no slot left for the fuse box`);
  const hatches = new Set<number>();
  for (const rows of [...specs.map((s) => s.rows), CRAWL])
    rows.forEach((row, y) => [...row].forEach((ch, x) => ch === '!' && hatches.add(wallMask((x2, y2) => rows[y2]?.[x2] ?? ' ', x, y))));
  const crawling = specs.some((s) => s.rows.some((r) => r.includes('!')));
  if (crawling && SLOTS.slice(0, specs.length).some(([, y]) => y === CRAWL_AT[1])) throw new Error(`${room}: the crawlspace is in the way of a board`);
  const easterEgg = specs.some((s) => s.rows.some((r) => r.includes('y'))) || crawling;
  const tiles = buildTiles(STYLES[room], batteries, {
    breadboard: specs.some((s) => s.look === 'breadboard'),
    seams: [...seams],
    fusebox,
    easterEgg,
    hatches: crawling ? [...hatches] : [],
  });
  const map = newMap();
  map.blocks.fill(tiles.id('void'));
  let placed = 0;
  const boards = parsed.map((p) => {
    const { spec, ox, oy, traceBits, sideGates, ctrlCells } = p;
    const at = (x: number, y: number) => spec.rows[y]?.[x] ?? ' ';
    let seam: Board['seam'];
    let hatch: Board['hatch'];
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
          else put(x, y, `wall${wallMask(at, x, y)}`);
        } else if (ch === '?') {
          if (tb || seam) throw new Error(`${spec.file}: one seam, off the wires`);
          put(x, y, `seam${wallMask(at, x, y)}`);
          seam = { x: ox + x, y: oy + y };
        } else if (ch === '!') {
          if (tb || hatch) throw new Error(`${spec.file}: one hatch, off the wires`);
          put(x, y, `hatch${wallMask(at, x, y)}`);
          hatch = { x: ox + x, y: oy + y };
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
        else if (ch === 'h') put(x, y, 'tinHeart');
        else if (ch === 'y') put(x, y, 'easterEgg');
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
    return { spec, map, mons, ox, oy, start: { x: ox + 8, y: oy + 5 }, exit, wireCells: p.wireCells, seam, hatch };
  });
  reindexMonsters(map);
  let box: Fusebox | undefined;
  const from = boards.find((b) => b.seam);
  if (from) {
    const [ox, oy] = SLOTS[SLOTS.length - 1];
    const at = (x: number, y: number) => FUSEBOX[y]?.[x] ?? ' ';
    // the tape is stuck on the housing
    const housing = (x: number, y: number) => (at(x, y) === 'P' ? '#' : at(x, y));
    const names: Record<string, string> = { ' ': 'void', '@': 'pad', S: 'socket', e: 'egg', P: 'tape', ...DECOR };
    const cell = { start: { x: 0, y: 0 }, exit: { x: 0, y: 0 }, egg: { x: 0, y: 0 } };
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++) {
        const ch = at(x, y);
        const name = ch === '#' ? `wall${wallMask(housing, x, y)}` : ch === '.' ? `floor${(x * 7 + y * 3 + ((x * y) % 5)) % 3}` : names[ch];
        if (!name) throw new Error(`fuse box: what is '${ch}'?`);
        map.blocks[(oy + y) * MLEN + ox + x] = tiles.id(name);
        if (ch === '@') cell.start = { x: ox + x, y: oy + y };
        if (ch === 'S') cell.exit = { x: ox + x, y: oy + y };
        if (ch === 'e') cell.egg = { x: ox + x, y: oy + y };
      }
    if (tiles.id('egg') !== EGG) throw new Error('The egg moved');
    box = { from, ...cell };
  }
  let crawl: Crawl | undefined;
  const into = boards.find((b) => b.hatch);
  if (into) {
    const [ox, oy] = CRAWL_AT;
    const at = (x: number, y: number) => CRAWL[y]?.[x] ?? '#';
    // housing all round, so the view never scrolls past it onto the void (it can run on about
    // half a screen past either end)
    for (let y = oy - 2; y < oy + ROWS + 2; y++)
      for (let x = ox - 16; x < ox + CRAWL[0].length + 16; x++) map.blocks[y * MLEN + ((x + MLEN) % MLEN)] = tiles.id('wall15');
    const names: Record<string, string> = { '@': 'pad', h: 'tinHeart', y: 'easterEgg', ...DECOR };
    const cell = { start: { x: 0, y: 0 }, exit: { x: 0, y: 0 } };
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < CRAWL[0].length; x++) {
        const ch = at(x, y);
        const name =
          ch === '#'
            ? `wall${wallMask(at, x, y)}`
            : ch === '!'
              ? `hatch${wallMask(at, x, y)}`
              : ch === '.'
                ? `floor${(x * 7 + y * 3 + ((x * y) % 5)) % 3}`
                : names[ch];
        if (!name) throw new Error(`crawlspace: what is '${ch}'?`);
        map.blocks[(oy + y) * MLEN + ox + x] = tiles.id(name);
        if (ch === '@') cell.start = { x: ox + x, y: oy + y };
        if (ch === '!') cell.exit = { x: ox + x, y: oy + y };
      }
    crawl = { from: into, ...cell };
  }
  return { room, tiles, map, mons, boards, fusebox: box, crawl };
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
