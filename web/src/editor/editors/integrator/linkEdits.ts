// Changing the integrator's links from a map: moving a link's From or To block, pointing it
// somewhere else, adding an exit and deleting a link. Pure, on a Game, with GRATOR.C's rules:
// createlink takes a scene's first free link, never from an end scene and never to a start
// scene; deletelink clears the link (Link.Clear()). The caller saves with project.saveGame.
import { ADVTYPE, ENDTYPE, MAXSCENELINKS, NOSCENE, STARTTYPE, emptyLink, type Game, type Point } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { entranceConflict, exitConflict } from './linkConflicts';
import { MLEN, MWID } from '@lewismoten/gamemaker-sandbox-engine/formats/map';

/** A block kept on the map (0..99 each way). */
export function clampCell(p: Point): Point {
  const c = (v: number, n: number) => Math.max(0, Math.min(n - 1, Math.round(v)));
  return { x: c(p.x, MLEN), y: c(p.y, MWID) };
}

/** Sets link `link` of scene `scene`'s From block (where the hero leaves). */
export function setFrom(game: Game, scene: number, link: number, at: Point): boolean {
  const point = clampCell(at);
  if (exitConflict(game, scene, point, link)) return false;
  game.scenes[scene].links[link].from = point;
  return true;
}

/** Sets link `link` of scene `scene`'s To block (where the hero arrives). */
export function setTo(game: Game, scene: number, link: number, at: Point): boolean {
  const target = game.scenes[scene].links[link].toScene;
  const point = clampCell(at);
  if (game.scenes[target]?.gametype !== ADVTYPE || entranceConflict(game, target, point)) return false;
  game.scenes[scene].links[link].to = point;
  return true;
}

/** Whether createlink allows a link from scene `from` to scene `to`. */
export function canLink(game: Game, from: number, to: number): boolean {
  const a = game.scenes[from];
  const b = game.scenes[to];
  return (
    !!a &&
    !!b &&
    !(a.gametype === STARTTYPE && b.gametype === ENDTYPE) &&
    a.gametype !== ENDTYPE &&
    a.gametype !== NOSCENE &&
    b.gametype !== STARTTYPE &&
    b.gametype !== NOSCENE
  );
}

/** Points a link at another scene (its blocks stay); false when GRATOR would refuse. */
export function retarget(game: Game, scene: number, link: number, to: number): boolean {
  if (!canLink(game, scene, to)) return false;
  const entry = game.scenes[scene].links[link];
  const previous = entry.toScene;
  entry.toScene = to;
  if (!positionsAllowed(game, scene, link)) {
    entry.toScene = previous;
    return false;
  }
  return true;
}

/**
 * Adds a link from `scene` to `to` in the scene's first free slot (a start scene has only its
 * link 0), leaving at `from` and arriving at `at`; its index, or -1 when there is no room or it
 * isn't allowed.
 */
export function addLink(game: Game, scene: number, to: number, from: Point, at: Point): number {
  if (!canLink(game, scene, to)) return -1;
  const s = game.scenes[scene];
  const room = s.gametype === STARTTYPE ? 1 : MAXSCENELINKS;
  const slot = s.links.slice(0, room).findIndex((l) => l.toScene === NOSCENE);
  if (slot < 0) return -1;
  const previous = s.links[slot];
  s.links[slot] = { toScene: to, from: clampCell(from), to: clampCell(at) };
  if (!positionsAllowed(game, scene, slot)) {
    s.links[slot] = previous;
    return -1;
  }
  return slot;
}

/** Checks a candidate after its synchronous in-memory placement, before the caller saves. */
function positionsAllowed(game: Game, scene: number, link: number): boolean {
  const entry = game.scenes[scene].links[link];
  return !exitConflict(game, scene, entry.from, link) && !entranceConflict(game, entry.toScene, entry.to);
}

/** Deletes a link (deletelink). */
export function removeLink(game: Game, scene: number, link: number): void {
  game.scenes[scene].links[link] = emptyLink();
}

/**
 * Moves a link to another source scene (its target and To block kept, its From block kept for a
 * level): the new scene's link index, or -1 (no free link there, or not allowed).
 */
export function moveSource(game: Game, scene: number, link: number, toSource: number): number {
  if (toSource === scene) return link;
  const old = game.scenes[scene].links[link];
  removeLink(game, scene, link);
  const at = addLink(game, toSource, old.toScene, old.from, old.to);
  if (at < 0) game.scenes[scene].links[link] = old;
  return at;
}

/** Where a new exit leads: the next level after this one, else Game won. */
export function nextScene(game: Game, scene: number): number {
  for (let i = scene + 1; i < game.scenes.length; i++) if (game.scenes[i].gametype === ADVTYPE && canLink(game, scene, i)) return i;
  return 1;
}
