// In-view check: replays a game's walkthrough on the engine and checks that something the player
// must watch (a timer bar, a meter, a sign) is on screen while they play. Each rule names a scene
// and one or more rectangles of map cells (world blocks, the map editor's numbers); every frame of
// that scene, at least one of the rectangles must be wholly inside the 312x196 picture PLAYGAME
// shows (CropScreen, engine/render.ts VISIBLE_W/H). It sees only the walkthrough's route, not every
// way a player could scroll, so a pass is a good sign, not a proof.
//
// Run it with inViewCheck.ts.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Walkthrough } from '../../web/src/walkthrough/format';
import { BLEN, type World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { VISIBLE_H, VISIBLE_W } from '@lewismoten/gamemaker-sandbox-engine/engine/render';
import { replay } from './walkthrough';

/** A rectangle of map cells: x, y of its top-left cell, its width and height in cells. */
export type CellRect = [number, number, number, number];
export interface InViewRule {
  scene: number;
  rects: CellRect[];
}
export interface InViewResult {
  scene: number;
  /** Frames of the scene played, and the frames none of the rule's rectangles was wholly in view. */
  frames: number;
  missed: number[];
}

/** The top-left pixel of map cell (x, y) on the screen, from the view's block and scroll. */
function cellPixel(w: World, x: number, y: number): [number, number] {
  return [(x - w.mx) * BLEN - w.scroll.nx - w.scroll.littleShiftx, (y - w.my) * BLEN - w.scroll.ny - w.scroll.littleShifty];
}

/** Whether the whole rectangle is inside the shown picture. */
export function rectInView(w: World, [x, y, wd, ht]: CellRect): boolean {
  const [px, py] = cellPixel(w, x, y);
  return px >= 0 && py >= 0 && px + wd * BLEN <= VISIBLE_W && py + ht * BLEN <= VISIBLE_H;
}

function readWalk(id: string): Walkthrough {
  const games = join(dirname(fileURLToPath(import.meta.url)), '..');
  const path = join(games, id, 'walkthrough.json');
  if (!existsSync(path)) throw new Error(`${id} has no walkthrough.json`);
  return JSON.parse(readFileSync(path, 'utf8')) as Walkthrough;
}

/** Plays the walkthrough and checks each rule, every frame of its scene. */
export async function inViewOfGame(id: string, rules: InViewRule[]): Promise<InViewResult[]> {
  const results = rules.map((r) => ({ scene: r.scene, frames: 0, missed: [] as number[] }));
  await replay(id, readWalk(id), {
    onWorld(w, scene, frame) {
      rules.forEach((r, i) => {
        if (r.scene !== scene) return;
        results[i].frames++;
        if (!r.rects.some((rect) => rectInView(w, rect))) results[i].missed.push(frame);
      });
    },
  });
  return results;
}

/** The map cells each scene ever shows (any part of the cell), as row and column ranges. */
export async function rowsOfGame(id: string): Promise<Map<number, { rows: [number, number]; cols: [number, number] }>> {
  const seen = new Map<number, { rows: [number, number]; cols: [number, number] }>();
  await replay(id, readWalk(id), {
    onWorld(w, scene) {
      const [px, py] = cellPixel(w, w.mx, w.my);
      const top = w.my + Math.floor(-py / BLEN);
      const bottom = w.my + Math.ceil((VISIBLE_H - py) / BLEN) - 1;
      const left = w.mx + Math.floor(-px / BLEN);
      const right = w.mx + Math.ceil((VISIBLE_W - px) / BLEN) - 1;
      const s = seen.get(scene) ?? { rows: [top, bottom], cols: [left, right] };
      s.rows = [Math.min(s.rows[0], top), Math.max(s.rows[1], bottom)];
      s.cols = [Math.min(s.cols[0], left), Math.max(s.cols[1], right)];
      seen.set(scene, s);
    },
  });
  return seen;
}
