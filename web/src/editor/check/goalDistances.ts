// Static distances around permanent walls guide exploration; engine simulation decides reachability.
import type { World } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { terrainStates } from './terrainStates';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';

/** Wrapped cell distances through terrain that is open or can become open; 0xffff is disconnected. */
export function goalDistances(w: World, goals: readonly number[]): Uint16Array {
  const CELLS = MLEN * MWID;
  const bg = w.bg;
  const routeDistance = new Uint16Array(CELLS).fill(0xffff);
  const { passable: canOpen } = terrainStates(bg);
  const blocked = Uint8Array.from(w.map, (n) => (canOpen[w.blkmap[n]] ? 0 : 1));
  const flood: number[] = [];
  for (const cell of goals) {
    if (cell < 0 || cell >= CELLS || routeDistance[cell] === 0) continue;
    routeDistance[cell] = 0;
    flood.push(cell);
  }
  for (let head = 0; head < flood.length; head++) {
    const cell = flood[head];
    const x = cell % MLEN;
    const y = Math.floor(cell / MLEN);
    for (const next of [y * MLEN + ((x + MLEN - 1) % MLEN), y * MLEN + ((x + 1) % MLEN), ((y + MWID - 1) % MWID) * MLEN + x, ((y + 1) % MWID) * MLEN + x]) {
      if (blocked[next] || routeDistance[next] !== 0xffff) continue;
      routeDistance[next] = routeDistance[cell] + 1;
      flood.push(next);
    }
  }
  return routeDistance;
}
