// View check (advisory): replays a game's walkthrough on the engine and lists monsters that
// PLAYGAME does not draw, and so cannot hurt, because their MAP CELL is in the screen's left
// column or top row, or past the right or bottom bound (ScrnLowBnd/ScrnUpBnd and onscrn,
// PLAYGAME.C:294; Programmer's Guide ch3), while most of their pixels (the cell plus the
// monster's pixel offset inside it) would be on screen. A car that slides in from the left
// and pops into view a block late is the usual case. A suggestion an author can dismiss: it
// can't tell a monster meant to stay out of sight, and it sees only the walkthrough's route,
// not every way a player could scroll. Run it with viewCheckCli.ts.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WALKTHROUGH_FPS, type Walkthrough } from '../../web/src/walkthrough/format';
import { BLEN, LASTMM, LASTMON, MONBL } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { monPicNum } from '@lewismoten/gamemaker-sandbox-engine/engine/monsters';
import { inScreenBounds } from '@lewismoten/gamemaker-sandbox-engine/engine/touch';
import { replay } from './walkthrough';

const games = join(dirname(fileURLToPath(import.meta.url)), '..');
/** Share of the 20x20 sprite (in pixels) that must be on screen to call it visible. */
const VISIBLE = 0.5;
/** A hidden stretch shorter than this many frames (half a second) is a monster passing the edge, not one that went missing. */
const MIN_RUN = WALKTHROUGH_FPS / 2;

export interface HiddenMonster {
  scene: number;
  /** Monster type number in the game. */
  monster: number;
  /** Frames (walkthrough video frames) it was hidden while mostly in view, in all. */
  frames: number;
  /** The longest unbroken stretch of those frames (one monster slot). */
  longest: number;
  /** First frame of that stretch, and the monster's map cell and screen pixel position then. */
  first: { frame: number; cell: [number, number]; at: [number, number] };
  /** Which edge's rule hid it: left, top, right or bottom (any that applied). */
  edges: string[];
}

/**
 * The edges whose rule hides a monster: its cell at screen pixel (cellX, cellY) fails the
 * draw bounds while the sprite at (x, y) is mostly on screen. Null when drawn or not in view.
 */
export function edgesHiding(cellX: number, cellY: number, x: number, y: number): string[] | null {
  if (inScreenBounds({ x: cellX, y: cellY })) return null;
  const vx = Math.min(x + BLEN, 320) - Math.max(x, 0);
  const vy = Math.min(y + BLEN, 200) - Math.max(y, 0);
  if (vx <= 0 || vy <= 0 || vx * vy < BLEN * BLEN * VISIBLE) return null;
  const edges: string[] = [];
  if (cellX < 1) edges.push('left');
  if (cellY < 1) edges.push('top');
  if (cellX > 320 - BLEN) edges.push('right');
  if (cellY > 200 - BLEN) edges.push('bottom');
  return edges;
}

/** Monsters hidden by the edge rule in a game's walkthrough, one entry per scene and monster. */
export async function hiddenMonstersOfGame(id: string): Promise<HiddenMonster[]> {
  const path = join(games, id, 'walkthrough.json');
  if (!existsSync(path) || !existsSync(join(games, id, 'disk'))) return [];
  const walk = JSON.parse(readFileSync(path, 'utf8')) as Walkthrough;
  const found = new Map<string, HiddenMonster>();
  const runs = new Map<number, { key: string; last: number; start: number; len: number }>(); // per monster slot
  await replay(id, walk, {
    onWorld(w, scene, frame) {
      for (let i = 0; i < LASTMM; i++) {
        const type = w.mm[i].monnum;
        if (type >= LASTMON) continue;
        const mi = w.mi[i];
        if (monPicNum(w, i) >= MONBL) continue; // nothing to draw
        // onscrn's position of the cell, then the pixel offset inside it
        let cx = mi.curx[0] - w.mx;
        if (w.mx > mi.curx[0]) cx += 1000;
        let cy = mi.cury[0] - w.my;
        if (w.my > mi.cury[0]) cy += 1000;
        if (cx > 40 || cy > 40) continue; // wrapped round the map: far away
        const cellX = cx * BLEN - w.scroll.nx;
        const cellY = cy * BLEN - w.scroll.ny;
        const edges = edgesHiding(cellX, cellY, cellX + mi.curx[1], cellY + mi.cury[1]);
        if (!edges) continue;
        const key = `${scene}/${type}`;
        const run = runs.get(i);
        if (run && run.key === key && frame - run.last <= 2) {
          run.last = frame;
          run.len++;
        } else runs.set(i, { key, last: frame, start: frame, len: 1 });
        const cur = runs.get(i)!;
        const x = cellX + mi.curx[1];
        const y = cellY + mi.cury[1];
        const e = found.get(key) ?? {
          scene,
          monster: type,
          frames: 0,
          longest: 0,
          first: { frame, cell: [mi.curx[0], mi.cury[0]] as [number, number], at: [x, y] as [number, number] },
          edges: [],
        };
        e.frames++;
        if (cur.len > e.longest) {
          e.longest = cur.len;
          e.first = { frame: cur.start, cell: [mi.curx[0], mi.cury[0]], at: [x, y] };
        }
        for (const edge of edges) if (!e.edges.includes(edge)) e.edges.push(edge);
        found.set(key, e);
      }
    },
  });
  return [...found.values()].filter((h) => h.longest >= MIN_RUN);
}
