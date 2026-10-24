// A room of Ebenezer Baker's kitchen: an ASCII map stamped onto a 100x100 Game-Maker map (the
// rest is solid dark), drawn with its set's blocks, with its own monster list over the shared
// monster blocks. Walls grow a front face wherever there is floor below them, false walls too
// (that is the point of them).
//
// The legend every room shares:
//   # wall            % false wall (walk through it)     X a false wall with a crack in it
//   . floor (or space)  , glass (a wall you can't see)   @ where Doc Leo comes in
//   C B K H furniture (the set's four props)              Z the stairs he came down
//   > < ^ v swing doors (through one way only)            E W N S belts    e w n s greased boards
//   k a wooden spoon   L a spoon latch   $ a bottle cap   + a root beer float   p a slice of pie
//   m a hidden mousetrap   M one you can see   a b timed panels (in turn)   r riser   o opener
//   h a hot floor   ] [ _ ~ spouts firing east, west, south, north
//   I the room's ingredient (the way out)   J a second one (the secret way out)
//   D a hatch down to the room's egg cupboard   O the hatch back up (in a cupboard)
//   z the kazoo   t the tricorn   q the rotten egg   f the pastry egg   T Teddy   Y Teddy (facing left)   G Gwinn
// Digits and other letters are the room's own (monsters on patrol, signs).
import { MLEN, newMap, reindexMonsters, LASTMM, type GameMap } from '../../../../web/src/formats/map';
import type { ThemeName } from '../art/pal';
import type { Bestiary } from '../blocks/sets';
import type { Style, TileSet } from '../blocks/tiles';
import { KINDS, roomBestiary, type Dir, type Projectile } from '../sprites/monsters';
import type { BlockSet } from '../blocks/sets';

/** Where a room's top-left corner sits on the 100x100 map. */
export const ORIGIN = { x: 2, y: 2 };

export type Cell = string | { tile?: string; mon?: (b: Bestiary) => string };

export interface RoomSpec {
  /** File name (8.3 base): its .map, .mon and .pal. */
  file: string;
  /** Level number 1..13, or 0 for the secret room. Egg cupboards carry their parent's, interludes the one before. */
  level: number;
  /** An egg cupboard: the scene it is, and where in its parent room the way back lands. */
  cupboard?: { scene: number; back: [number, number] };
  name: string;
  style: Style;
  theme: ThemeName;
  /** The ingredient its I holds (and J, where there is one). */
  ingredient: number;
  /** A way out on I that is not the ingredient (the Bakehouse's: the gap under the stove). */
  exitTile?: string;
  /** An interlude: a scene of its own, played after its level's room and before the next. */
  interlude?: { scene: number };
  /** The character the room is played as (its .chr and .cbl); Doc Leo when not given. */
  hero?: string;
  rows: string[];
  legend?: Record<string, Cell>;
  /** Sign letters: a run of the letter is the sign's blocks, left to right. */
  signs?: Record<string, string>;
  /** What this room's spouts make. */
  born?: Partial<Record<Dir, { kind: Projectile; reach: number; speed?: number }>>;
  /** The level card's lines: what to watch for. */
  card: string[];
  song: string;
}

export interface Room {
  spec: RoomSpec;
  map: GameMap;
  mons: Bestiary;
  /** Map coordinates of the marks: start, ingredient, secret ingredient. */
  start: { x: number; y: number };
  exit: { x: number; y: number };
  secret?: { x: number; y: number };
  /** The hatch to the egg cupboard (D) or, in a cupboard, back (O). */
  hatch?: { x: number; y: number };
  /** Every cell's legend character, by map coordinates (for tools). */
  chars: Map<string, string>;
}

const BASE: Record<string, string> = {
  '.': 'floor',
  ' ': 'floor',
  ',': 'glass',
  C: 'prop0',
  B: 'prop1',
  K: 'prop2',
  H: 'prop3',
  Z: 'stairs',
  '>': 'door_e',
  '<': 'door_w',
  '^': 'door_n',
  v: 'door_s',
  E: 'belt_e',
  W: 'belt_w',
  N: 'belt_n',
  S: 'belt_s',
  e: 'grease_e',
  w: 'grease_w',
  n: 'grease_n',
  s: 'grease_s',
  k: 'spoon',
  L: 'latch',
  $: 'cap',
  '+': 'float',
  p: 'pie',
  m: 'trapHidden',
  M: 'trapArmed',
  a: 'panel_a0',
  b: 'panel_b2',
  r: 'riser0',
  o: 'opener0',
  h: 'hot0',
  ']': 'spout_e',
  '[': 'spout_w',
  _: 'spout_s',
  '~': 'spout_n',
  X: 'fwallCrack',
  z: 'kazoo',
  t: 'tricorn',
  q: 'eggRotten',
  f: 'eggJeweled',
};

const WALLISH = new Set(['#', '%']);

export function buildRoom(spec: RoomSpec, set: TileSet, mb: BlockSet): Room {
  const map = newMap();
  const mons = roomBestiary(mb, spec.born ?? {});
  const tiles = set.tiles;
  map.blocks.fill(tiles.id('void'));
  const legend: Record<string, Cell> = {
    T: { mon: (b) => KINDS.teddy(b) },
    Y: { mon: (b) => KINDS.teddy(b, true) },
    G: { mon: (b) => KINDS.gwinn(b) },
    ...spec.legend,
  };
  const w = Math.max(...spec.rows.map((r) => r.length));
  spec.rows.forEach((r, y) => {
    if (r.length !== w) throw new Error(`${spec.file}: row ${y} is ${r.length} wide, not ${w}`);
  });
  if (spec.rows.length + ORIGIN.y > 98 || w + ORIGIN.x > 98) throw new Error(`${spec.file}: too big`);
  let placed = 0;
  let start: Room['start'] | undefined;
  let exit: Room['exit'] | undefined;
  let secret: Room['secret'] | undefined;
  let hatch: Room['hatch'] | undefined;
  const chars = new Map<string, string>();
  const at = (x: number, y: number) => spec.rows[y]?.[x] ?? '#';
  const signRun = new Map<string, number>();
  spec.rows.forEach((row, y) =>
    [...row.padEnd(w, '#')].forEach((ch, x) => {
      const mx = ORIGIN.x + x;
      const my = ORIGIN.y + y;
      chars.set(`${mx},${my}`, ch);
      const set1 = (name: string) => (map.blocks[my * MLEN + mx] = tiles.id(name));
      const floorName = () => {
        if (set.style === 'kitchen') return (x + y) % 2 ? 'floor2' : 'floor';
        return (x * 7 + y * 13) % 11 === 0 ? 'floor2' : 'floor';
      };
      if (WALLISH.has(ch)) {
        const face = !WALLISH.has(at(x, y + 1)) && y + 1 < spec.rows.length;
        set1(ch === '#' ? (face ? 'wallFace' : 'wall') : face ? 'fwallFace' : 'fwall');
        return;
      }
      if (ch === '@') {
        set1(floorName());
        start = { x: mx, y: my };
        return;
      }
      if (ch === 'D' || ch === 'O') {
        set1('stairs');
        hatch = { x: mx, y: my };
        return;
      }
      if (ch === 'I' || ch === 'J') {
        set1(ch === 'I' && spec.exitTile ? spec.exitTile : `ing${spec.ingredient}`);
        if (ch === 'I') exit = { x: mx, y: my };
        else secret = { x: mx, y: my };
        return;
      }
      if (spec.signs?.[ch]) {
        const name = spec.signs[ch];
        const n = set.signs.get(name);
        if (n === undefined) throw new Error(`${spec.file}: no sign ${name} in the ${set.style} set`);
        const i = at(x - 1, y) === ch ? (signRun.get(ch) ?? 0) + 1 : 0;
        if (i >= n) throw new Error(`${spec.file}: sign ${name} at ${x},${y} is wider than ${n}`);
        signRun.set(ch, i);
        set1(`${name}${i}`);
        return;
      }
      const cell = legend[ch];
      if (cell !== undefined) {
        const cc = typeof cell === 'string' ? { tile: cell } : cell;
        set1(cc.tile ?? floorName());
        if (cc.mon) {
          if (placed >= LASTMM) throw new Error(`${spec.file}: too many monsters`);
          map.monsters[placed++] = { monnum: mons.id(cc.mon(mons)), status: 0, xtra: 0, curx: mx, cury: my, extra: 0 };
        }
        return;
      }
      const t = BASE[ch];
      if (t === undefined) throw new Error(`${spec.file}: unknown map character "${ch}" at ${x},${y}`);
      set1(t === 'floor' ? floorName() : t);
    }),
  );
  if (!start || !(exit || (spec.cupboard && hatch))) throw new Error(`${spec.file}: needs an @ and an I (or an O)`);
  reindexMonsters(map);
  return { spec, map, mons, start, exit: exit ?? hatch!, secret, hatch, chars };
}
