// What each generator kind needs from a block set's roles (kit/blockRoles): the roles it must have
// and the ones it uses when present. No DOM. The map editor's "Missing roles" panel and the
// Generate dialog read this, so what is asked for and what is used never drift apart.
import { ROLES, blocksWithRole, type Role, type RoleMap } from '../blockRoles';

export type GenKind = 'dungeon' | 'forest' | 'home' | 'shop' | 'castle';

export interface KindInfo {
  id: GenKind;
  label: string;
  blurb: string;
  /** The smallest area it can draw in (blocks). */
  min: { w: number; h: number };
  /** Roles the generator cannot run without. */
  must: Role[];
  /** Roles used when set; without them that part is skipped. */
  want: { role: Role; use: string; without: string }[];
}

export const KINDS: readonly KindInfo[] = [
  {
    id: 'dungeon',
    min: { w: 12, h: 12 },
    label: 'Dungeon',
    blurb: 'Rooms joined by corridors, with the walls drawn round them.',
    must: ['wall', 'floor'],
    want: [
      { role: 'decoration', use: 'Scattered inside the bigger rooms.', without: 'the rooms are left bare' },
      {
        role: 'locked-door',
        use: 'Shut in a narrow passage on the way to the exit (needs a key block with the same lock number).',
        without: 'no locked doors',
      },
      { role: 'key', use: 'Placed where it can be reached before its locked door.', without: 'no locked doors' },
      { role: 'treasure', use: 'In corners and dead ends, more of it far from the entry.', without: 'no treasure' },
      { role: 'life', use: 'One heart in a far corner.', without: 'no heart' },
    ],
  },
  {
    id: 'forest',
    min: { w: 12, h: 12 },
    label: 'Forest',
    blurb: 'Trees with clearings and a winding path through them.',
    must: ['floor', 'tree'],
    want: [
      { role: 'path', use: 'A winding trail from one side to the other.', without: 'no trail' },
      { role: 'rock', use: 'A few rocks in the open.', without: 'no rocks' },
      { role: 'decoration', use: 'Flowers and bushes in the open.', without: 'no flowers' },
      { role: 'treasure', use: 'In dead ends and nooks among the trees.', without: 'no treasure' },
      { role: 'life', use: 'One heart in a far nook.', without: 'no heart' },
    ],
  },
  {
    id: 'home',
    label: 'Home',
    blurb: 'One to three rooms with a front door; furniture against the walls and chairs facing the table.',
    min: { w: 12, h: 10 },
    must: ['wall', 'floor'],
    want: [
      { role: 'door', use: 'The front door in the south wall (the entry and exit).', without: 'the front door is plain floor' },
      { role: 'table', use: 'A table in the living room.', without: 'no table' },
      { role: 'chair', use: 'Next to the table, facing it (a chair block must say which way it faces).', without: 'no chairs' },
      { role: 'bed', use: 'Against a wall, front to the room.', without: 'no beds' },
      { role: 'shelf', use: 'Against walls.', without: 'no shelves' },
      { role: 'stove', use: 'Against a wall of the living room.', without: 'no stove' },
      { role: 'rug', use: 'Under and around the table.', without: 'no rugs' },
      { role: 'lamp', use: 'Against walls.', without: 'no lamps' },
      { role: 'plant', use: 'In a corner.', without: 'no plants' },
    ],
  },
  {
    id: 'shop',
    label: 'Shop',
    blurb: 'One room: shelves on the back wall, a counter across it, and room for customers by the door.',
    min: { w: 12, h: 10 },
    must: ['wall', 'floor'],
    want: [
      { role: 'door', use: 'The front door in the south wall (the entry and exit).', without: 'the front door is plain floor' },
      { role: 'counter', use: 'Across the room, facing the door (the block must face south), with an open end to the shopkeeper.', without: 'no counter' },
      { role: 'shelf', use: 'Along the back wall and the side walls.', without: 'no shelves' },
      { role: 'table', use: 'A display table for customers.', without: 'no display table' },
      { role: 'rug', use: 'Inside the door.', without: 'no rug' },
      { role: 'lamp', use: 'Against the side walls.', without: 'no lamps' },
      { role: 'plant', use: 'In a corner.', without: 'no plants' },
    ],
  },
  {
    id: 'castle',
    label: 'Castle',
    blurb: 'An outer wall with corner towers and a gate, a courtyard, and a keep of rooms.',
    min: { w: 30, h: 24 },
    must: ['wall', 'floor'],
    want: [
      { role: 'door', use: 'In the gate and the keep door.', without: 'the gate and keep door are plain floor' },
      { role: 'path', use: 'A road from the gate to the keep door.', without: 'no road' },
      { role: 'decoration', use: 'Scattered in the courtyard and the keep rooms.', without: 'the courtyard is bare' },
      { role: 'locked-door', use: 'Shut in a narrow passage of the keep (needs a key block with the same lock number).', without: 'no locked doors' },
      { role: 'key', use: 'Placed where it can be reached before its locked door.', without: 'no locked doors' },
      { role: 'treasure', use: 'In tower rooms, corners and dead ends of the keep.', without: 'no treasure' },
      { role: 'life', use: 'One heart in a far corner.', without: 'no heart' },
    ],
  },
];

export const kindInfo = (kind: GenKind): KindInfo => KINDS.find((k) => k.id === kind)!;

const roleLabel = (r: Role) => ROLES.find((x) => x.id === r)!.label;

export interface NeedItem {
  role: Role;
  label: string;
  must: boolean;
  /** How many blocks hold the role. */
  count: number;
  /** For a "want": what it adds, and what happens without it. */
  use?: string;
  without?: string;
}

export interface NeedsReport {
  kind: GenKind;
  items: NeedItem[];
  /** Every "must" is set. */
  ok: boolean;
  /** Plain words for a person when it is not ok (what to mark in the block editor). */
  message: string;
  /** Lines for the "wants" that are missing (skipped parts). */
  skipped: string[];
}

/** Which of a kind's roles are set in `roles`, and whether it can run. */
export function checkNeeds(kind: GenKind, roles: RoleMap): NeedsReport {
  const info = kindInfo(kind);
  const count = (r: Role) => blocksWithRole(roles, r).length;
  const items: NeedItem[] = [
    ...info.must.map((role) => ({ role, label: roleLabel(role), must: true, count: count(role) })),
    ...info.want.map((w) => ({ role: w.role, label: roleLabel(w.role), must: false, count: count(w.role), use: w.use, without: w.without })),
  ];
  const lacking = items.filter((i) => i.must && !i.count).map((i) => i.label.toLowerCase());
  const message = lacking.length
    ? `Needs ${lacking.map((l) => `a ${l} block`).join(' and ')}. Mark ${lacking.length > 1 ? 'them' : 'one'} in the block editor's Uses tab.`
    : '';
  // wants that share an outcome (a lock and its key) are one line
  const lacking2 = items.filter((i) => !i.must && !i.count);
  const skipped = [...new Set(lacking2.map((i) => i.without!))].map(
    (w) =>
      `No ${lacking2
        .filter((i) => i.without === w)
        .map((i) => i.label.toLowerCase())
        .join(' or ')} block: ${w}.`,
  );
  return { kind, items, ok: !lacking.length, message, skipped };
}
