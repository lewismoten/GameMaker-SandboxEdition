// "Make these scenes" for a generated town, overworld, home, shop or castle (no DOM): each proposed door or site gets a
// new scene of its own, with a map drawn by the matching kind in the same block set and the same files as the scene it
// leaves, and a link each way (the door leads in; the new scene's door leads back to a spot beside the door).
// Everything made is ordinary: scenes, links and .map files, nothing the DOS game does not know. Only what fits is made
// (a scene holds MAXSCENELINKS links, scene descriptions are SCENEDESCLEN - 1 characters), and the rest is listed.
import { ADVTYPE, MAXSCENELINKS, NOSCENE, SCENEDESCLEN, emptyScene, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, MWID, newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { blocksWithRole, type RoleMap } from '@lewismoten/gamemaker-sandbox-tools/kit/blockRoles';
import {
  DOOR_CELL,
  FLOOR_CELL,
  LOCK_CELL,
  PATH_CELL,
  checkNeeds,
  closedCell,
  generate,
  kindInfo,
  offerSeed,
  type GenKind,
  type GenResult,
  type Rect,
  type SceneLink,
} from '@lewismoten/gamemaker-sandbox-tools/kit/levelGen';
import type { Terrain } from '../tools/autotile';
import { place } from './place';
import { checkLayout } from './verifyOffer';

/** The file slots of a scene that follow its map (block set, monsters, their blocks, character, its blocks, sounds, music) are kept; the level intro and exit pictures are not. */
const MAP_SLOT = 1;
const KEEP_SLOTS = 9;

/** The area each kind is drawn in: a building in the middle of a modest area, the rest the whole map. */
const AREA: Partial<Record<GenKind, Rect>> = {
  home: { x: 30, y: 35, w: 40, h: 30 },
  shop: { x: 30, y: 35, w: 40, h: 30 },
};
const WHOLE: Rect = { x: 0, y: 0, w: MLEN, h: MWID };

/** How many seeds are tried for each new scene before it is given up as Not proven. */
const TRIES = 8;

interface PlannedScene {
  link: SceneLink;
  /** Where the door or site is, in the map, and the open cell beside it that the way back arrives at. */
  door: { x: number; y: number };
  beside: { x: number; y: number };
  /** The host's link slot it will use. */
  slot: number;
}

interface Skipped {
  label: string;
  why: string;
}

interface Plan {
  make: PlannedScene[];
  skipped: Skipped[];
}

const cellAt = (r: GenResult, i: number) => ({ x: r.rect.x + (i % r.rect.w), y: r.rect.y + Math.floor(i / r.rect.w) });

/** An open cell next to `cell` that is not itself a door or site (a path first), or undefined. */
function openBeside(r: GenResult, cell: number, avoid: Set<number>): number | undefined {
  const { w, h } = r.rect;
  const x = cell % w,
    y = Math.floor(cell / w);
  const near = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ]
    .map(([dx, dy]) => [x + dx, y + dy])
    .filter(([cx, cy]) => cx >= 0 && cx < w && cy >= 0 && cy < h)
    .map(([cx, cy]) => cy * w + cx)
    .filter((c) => !closedCell(r.kinds[c]) && r.kinds[c] !== LOCK_CELL && r.kinds[c] !== DOOR_CELL && !avoid.has(c));
  return near.find((c) => r.kinds[c] === PATH_CELL) ?? near.find((c) => r.kinds[c] === FLOOR_CELL) ?? near[0];
}

/** Which of a layout's doors and sites can get a scene of their own in `hostScene`, and why the others cannot. Nothing changes. */
export function planScenes(game: Game, hostScene: number, result: GenResult, roles: RoleMap): Plan {
  const host = game.scenes[hostScene];
  const make: PlannedScene[] = [];
  const skipped: Skipped[] = [];
  if (!host) return { make, skipped: result.links.map((l) => ({ label: l.label, why: 'no scene plays this map yet' })) };
  const taken = new Set(host.links.filter((l) => l.toScene !== NOSCENE).map((l) => `${l.from.x},${l.from.y}`));
  const free = host.links.map((l, i) => (l.toScene === NOSCENE ? i : -1)).filter((i) => i >= 0);
  const doors = new Set(result.links.map((l) => l.cell));
  for (const link of result.links) {
    const door = cellAt(result, link.cell);
    const label = `${link.label} at (${door.x}, ${door.y})`;
    const needs = checkNeeds(link.kind, roles);
    const beside = openBeside(result, link.cell, doors);
    const slot = free[make.length];
    if (!needs.ok) skipped.push({ label, why: `${kindInfo(link.kind).label} layouts need blocks you have not marked in the Uses tab` });
    else if (beside === undefined) skipped.push({ label, why: 'no open cell beside it to arrive at' });
    else if (taken.has(`${door.x},${door.y}`)) skipped.push({ label, why: 'the scene already has a link on that block' });
    else if (slot === undefined) skipped.push({ label, why: `the scene already has all ${MAXSCENELINKS} links a scene can hold` });
    else make.push({ link, door, beside: cellAt(result, beside), slot });
  }
  return { make, skipped };
}

interface MadeScene {
  scene: number;
  label: string;
  map: string;
}

interface MakeInput {
  game: Game;
  hostScene: number;
  result: GenResult;
  roles: RoleMap;
  terrains: Terrain[];
  bg: Block[] | undefined;
  /** The dialog's seed: each scene's own seeds follow from it. */
  seed: number;
  /** Whether a file name is taken, and to put a new file in the project. */
  has: (name: string) => boolean;
  put: (name: string, bytes: Uint8Array) => void;
}

interface MakeOutcome {
  made: MadeScene[];
  skipped: Skipped[];
}

const FILE_STEM: Record<string, string> = { home: 'home', shop: 'shop', town: 'town', dungeon: 'dungeon', castle: 'castle', overworld: 'world' };

/** A free 8.3 name for a new map: home1.map, home2.map, … */
function mapName(kind: string, has: (n: string) => boolean, used: Set<string>): string {
  const stem = FILE_STEM[kind] ?? 'scene';
  for (let n = 1; ; n++) {
    const name = `${stem}${n}.map`;
    if (!has(name) && !used.has(name)) return name;
  }
}

/**
 * Makes the planned scenes in `game` (changing it) and puts their maps in with `put`. The caller saves the game afterwards.
 * A scene is made only when its layout is Verified within a few seeds; a kind that never proved is listed as skipped.
 */
export function makeScenes(inp: MakeInput): MakeOutcome {
  const { game, hostScene, result, roles } = inp;
  const plan = planScenes(game, hostScene, result, roles);
  const host = game.scenes[hostScene];
  const made: MadeScene[] = [];
  const skipped = [...plan.skipped];
  const names = new Set<string>();
  const wall = blocksWithRole(roles, 'wall')[0];
  const ground = blocksWithRole(roles, 'floor')[0];
  plan.make.forEach((p, k) => {
    const kind = p.link.kind as GenKind;
    const rect = AREA[kind] ?? WHOLE;
    const base = newMap();
    const fill = kind === 'home' || kind === 'shop' ? (wall ?? ground) : ground;
    if (fill !== undefined) base.blocks.fill(fill);
    let found: { result: GenResult; blocks: Uint8Array } | undefined;
    for (let t = 0; t < TRIES && !found; t++) {
      const out = generate(roles, { kind, seed: offerSeed(inp.seed + 101 * (k + 1), t), rect });
      if (!out.ok) continue;
      const placed = place(base.blocks, out.result, roles, inp.terrains).blocks;
      if (checkLayout(out.result, placed, inp.bg).verified) found = { result: out.result, blocks: placed };
    }
    const label = `${p.link.label} at (${p.door.x}, ${p.door.y})`;
    if (!found) return void skipped.push({ label, why: `no ${p.link.kind} layout proved itself in ${TRIES} tries` });
    const r = found.result;
    // the way in: the new layout's entry, unless that is the cell the way back leaves from
    const exit = r.exit;
    const inCell = r.entry !== exit ? r.entry : openBeside(r, r.entry, new Set([exit]));
    if (inCell === undefined) return void skipped.push({ label, why: `the new ${p.link.kind} has no spot to arrive at` });
    base.blocks.set(found.blocks);
    const name = mapName(p.link.kind, inp.has, names);
    names.add(name);
    // an unused scene's place is taken first, as the Integrator does
    const freeAt = game.scenes.findIndex((s, i) => i > 1 && s.gametype === NOSCENE);
    const scene = emptyScene(host.gametype === NOSCENE ? ADVTYPE : host.gametype);
    scene.desc = `${p.link.label}`.slice(0, SCENEDESCLEN - 1);
    scene.scroll = { ...host.scroll, xtra: host.scroll.xtra.slice() };
    scene.files = host.files.map((f, i) => (i === MAP_SLOT ? name : i < KEEP_SLOTS ? f : ''));
    scene.pos = { x: Math.max(0, Math.min(310, host.pos.x + 24 + 30 * made.length)), y: Math.max(0, Math.min(190, host.pos.y + 36)) };
    if (freeAt >= 0) game.scenes[freeAt] = scene;
    else game.scenes.push(scene);
    const n = freeAt >= 0 ? freeAt : game.scenes.length - 1;
    const back = cellAt(r, exit);
    scene.links[0] = { toScene: hostScene, from: back, to: p.beside };
    host.links[p.slot] = { toScene: n, from: p.door, to: cellAt(r, inCell) };
    inp.put(name, serializeMap(base));
    made.push({ scene: n, label: scene.desc, map: name });
  });
  return { made, skipped };
}
