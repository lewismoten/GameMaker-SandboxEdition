// Art above the view (the logic; run it with aboveView.ts): per scene of a built game, the map cells
// above the highest screen top a player can reach, so never on screen, sorted into what matters for
// play (platforms, items, monsters, doors, ladders) and what is only scenery (clouds, stars, a wall
// carried up past the top). The screen top comes from one place, screenTopFor(), so a better camera
// model (vertical scroll) can replace it without touching the rest.
//
// What it cannot see: it guesses reach (walking, falling, ladders, jumps up to 3 blocks, keys never
// used, every lock shut), so a high spot that needs a trick, a key, a lift or a monster to ride may
// be reachable after all; and blocks that change in play (touch, animation) are judged as the map
// stores them. Findings are suggestions an author can dismiss.
import { cameraTop } from '@lewismoten/gamemaker-sandbox-tools/kit/levelPicture';
import { GameSim, readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { BACKBL, type Block } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { MLEN, parseMap } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { reachable } from './leapCheck';

/** What a cell above the view is, gameplay kinds first. */
export type AboveKind = 'monster' | 'door' | 'item' | 'spawner' | 'platform' | 'climb' | 'wall-up' | 'decoration';
export const GAMEPLAY: readonly AboveKind[] = ['monster', 'door', 'item', 'spawner', 'platform', 'climb'];

type Attrs = Pick<Block, 'solid' | 'scorePts' | 'chHitPt' | 'obj' | 'effect' | 'birthTime' | 'grav' | 'touchBl'>;

/**
 * The kind of a background block above the view, from its flags. `self` is the block's own number (a
 * touchBl other than itself changes on touch); `sky` is the region's commonest block; `wallUp` says
 * the same block runs straight down from here into the shown rows (a side wall carried up).
 */
export function classifyBlock(b: Attrs, self: number, sky: Attrs, wallUp: boolean): AboveKind {
  if (b.effect || b.scorePts || b.chHitPt || b.obj || (b.touchBl !== self && b.touchBl < BACKBL)) return 'item';
  if (b.birthTime) return 'spawner';
  if (b.solid) return wallUp ? 'wall-up' : 'platform';
  if (b.grav !== sky.grav) return 'climb';
  return 'decoration';
}

/**
 * The top map row of the screen while the hero stands with his feet (his block) in `row`. The one
 * place the screen-top rule lives: today kit cameraTop (standing still), so it can switch.
 */
export function screenTopFor(row: number): number {
  return Math.max(0, cameraTop([{ x: 0, y: row }]));
}

export interface AboveCell {
  x: number;
  y: number;
  kind: AboveKind;
  block: number;
}
export interface AboveScene {
  scene: number;
  map: string;
  /** The highest screen top found, and whether the camera can scroll up at all. */
  top: number;
  scrollsUp: boolean;
  cells: AboveCell[];
}

type Enterable = { enter(s: number, p: number, l: number): void };

/** Every scene of a built game's disk (a folder) with art above the view. */
export function aboveViewOfDisk(dir: string): AboveScene[] {
  const files = readDisk(dir);
  const { scenes } = new GameSim(files).game;
  const out: AboveScene[] = [];
  for (let scene = 1; scene < scenes.length; scene++) {
    const mapName = scenes[scene].files[1];
    if (!mapName || !files.has(mapName)) continue;
    const entries: [number, number][] = [];
    scenes.forEach((s, from) => s.links.forEach((l, i) => l && l.toScene === scene && entries.push([from, i])));
    let top = MLEN;
    let scrollsUp = false;
    let left = MLEN;
    let right = 0;
    let sim: GameSim | undefined;
    for (const [from, link] of entries) {
      const s = new GameSim(files);
      try {
        (s as unknown as Enterable).enter(scene, from, link);
      } catch {
        continue;
      }
      sim = s;
      // the opening screen; then, when the camera follows up (ChangeScroll's down flag), every standing spot
      top = Math.min(top, s.w.my);
      const up = s.w.scroll.down === 0xff;
      scrollsUp ||= up;
      const free = !(s.shown(s.pos.x, s.pos.y).grav & 4);
      for (const k of free ? openCells(s) : reachable(s)) {
        const x = k % MLEN;
        left = Math.min(left, x);
        right = Math.max(right, x);
        if (up) top = Math.min(top, screenTopFor(Math.floor(k / MLEN)));
      }
    }
    if (!sim || top <= 0) continue;
    // columns the screen can show: 16 across, the hero kept near the middle
    const x0 = Math.max(0, left - 8);
    const x1 = Math.min(MLEN - 1, right + 8);
    const count = new Map<number, number>();
    for (let y = 0; y < top; y++) for (let x = x0; x <= x1; x++) count.set(sim.blockAt(x, y), (count.get(sim.blockAt(x, y)) ?? 0) + 1);
    const skyBlock = [...count].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
    const rowBelow = new Map<number, number>();
    for (let x = x0; x <= x1; x++) rowBelow.set(sim.blockAt(x, top), (rowBelow.get(sim.blockAt(x, top)) ?? 0) + 1);
    const skyBelow = [...rowBelow].sort((a, b) => b[1] - a[1])[0]?.[0];
    const sky = attrsOf(sim, skyBlock);
    const cells: AboveCell[] = [];
    for (const m of parseMap(files.get(mapName)!).monsters)
      if (m.monnum < 64 && m.cury >= 0 && m.cury < top && m.curx >= x0 && m.curx <= x1) cells.push({ x: m.curx, y: m.cury, kind: 'monster', block: m.monnum });
    for (const l of scenes[scene].links)
      if (l && l.toScene !== 0xffff && l.from.y < top && l.from.x >= x0 && l.from.x <= x1) cells.push({ x: l.from.x, y: l.from.y, kind: 'door', block: -1 });
    for (let y = 0; y < top; y++)
      for (let x = x0; x <= x1; x++) {
        const b = sim.blockAt(x, y);
        if (b === skyBlock || b === skyBelow) continue;
        let wallUp = true;
        for (let r = y + 1; r <= top && wallUp; r++) wallUp = sim.blockAt(x, r) === b;
        cells.push({ x, y, kind: classifyBlock(attrsOf(sim, b), b, sky, wallUp), block: b });
      }
    if (cells.length) out.push({ scene, map: mapName, top, scrollsUp, cells });
  }
  return out;
}

function attrsOf(sim: GameSim, b: number): Attrs {
  return { ...(sim.w.bg[sim.w.blkmap[b] ?? b] ?? sim.w.bg[0]), touchBl: sim.w.bg[b]?.touchBl ?? b };
}

/** A view from above (no pull down at the start): every open cell joined to the hero's. */
function openCells(sim: GameSim): Set<number> {
  const seen = new Set<number>();
  const todo = [sim.pos.y * MLEN + sim.pos.x];
  while (todo.length) {
    const k = todo.pop()!;
    if (seen.has(k)) continue;
    seen.add(k);
    const x = k % MLEN;
    const y = Math.floor(k / MLEN);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx > 0 && ny > 0 && nx < MLEN - 1 && ny < MLEN - 1 && !sim.solidAt(nx, ny)) todo.push(ny * MLEN + nx);
    }
  }
  return seen;
}
