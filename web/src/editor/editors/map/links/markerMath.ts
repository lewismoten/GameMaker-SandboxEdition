// The map editor's link markers in numbers, with no DOM: which ways in and exits of the
// integrator's links (integrator/linkSpots.ts) are on this map, where a marker sits at a zoom,
// which block a pointer is over while one is dragged, and where an arrow key nudges it.
import type { Game, Point } from '../../../../formats/game';
import { MLEN, MWID } from '../../../../formats/map';
import { exitsOf, sceneName, sourceName, waysInto, type Exit, type WayIn } from '../../integrator/linkSpots';

/** A marker on the map: a way in (where a link lands the hero) or an exit (where one leaves). */
export type Marker =
  { kind: 'in'; key: string; at: Point; label: string; start: boolean; way: WayIn } | { kind: 'out'; key: string; at: Point; label: string; exit: Exit };

/** The smallest a marker gets on screen (a 24-pixel target), whatever the zoom. */
export const MIN_MARK = 24;

/** The markers for the scenes that play this map: ways in first, then exits, in link order. */
export function mapMarkers(game: Game, scenes: readonly number[]): Marker[] {
  const several = scenes.length > 1;
  const ins: Marker[] = waysInto(game, scenes).map((w) => ({
    kind: 'in',
    key: `in:${w.from}:${w.link}`,
    at: w.at,
    start: w.from === 0 && w.link === 0,
    label: `Way in from ${sourceName(game, w)}${several ? ` to ${sceneName(game, w.to)}` : ''}, at ${w.at.x},${w.at.y}`,
    way: w,
  }));
  const outs: Marker[] = exitsOf(game, scenes).map((e) => ({
    kind: 'out',
    key: `out:${e.scene}:${e.link}`,
    at: e.at,
    label: `${several ? `${sceneName(game, e.scene)} ` : ''}Exit ${e.link + 1} to ${sceneName(game, e.to)}, at ${e.at.x},${e.at.y}${
      e.shadowedBy !== undefined ? ` (never taken: exit ${e.shadowedBy + 1} is on the same block)` : ''
    }`,
    exit: e,
  }));
  return [...ins, ...outs];
}

/** A marker's box in map pixels: the block, grown round its middle to at least MIN_MARK; `stack` shifts markers on one block apart. */
export function markerBox(at: Point, block: number, stack = 0): { left: number; top: number; size: number } {
  const size = Math.max(MIN_MARK, block);
  const shift = stack * 6;
  return { left: at.x * block + block / 2 - size / 2 + shift, top: at.y * block + block / 2 - size / 2 + shift, size };
}

/** The block under a point of the window, for a map drawn in `rect` (kept on the map). */
export function cellAtPoint(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): Point {
  const clamp = (v: number, n: number) => Math.max(0, Math.min(n - 1, v));
  return {
    x: clamp(Math.floor(((clientX - rect.left) / rect.width) * MLEN), MLEN),
    y: clamp(Math.floor(((clientY - rect.top) / rect.height) * MWID), MWID),
  };
}

/** Where an arrow key moves a marker (Shift: 10 blocks), or undefined for any other key or at the edge. */
export function nudge(at: Point, key: string, shift = false): Point | undefined {
  const d = shift ? 10 : 1;
  const step: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
  const s = step[key];
  if (!s) return undefined;
  const next = { x: Math.max(0, Math.min(MLEN - 1, at.x + s[0])), y: Math.max(0, Math.min(MWID - 1, at.y + s[1])) };
  return next.x === at.x && next.y === at.y ? undefined : next;
}

/** How many markers before this one sit on the same block (to fan them out). */
export function stackIndex(markers: readonly Marker[], i: number): number {
  const { x, y } = markers[i].at;
  return markers.slice(0, i).filter((m) => m.at.x === x && m.at.y === y).length;
}
