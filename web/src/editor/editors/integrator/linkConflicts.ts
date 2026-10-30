// New link positions must not put an entrance on an exit, or give two exits the same block.
import { ADVTYPE, type Game, type Point } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { exitsOf, waysInto } from './linkSpots';

const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

export function exitConflict(game: Game, scene: number, at: Point, exceptLink = -1): boolean {
  if (game.scenes[scene]?.gametype !== ADVTYPE) return false;
  return exitsOf(game, [scene]).some((e) => e.link !== exceptLink && same(e.at, at)) || waysInto(game, [scene]).some((w) => same(w.at, at));
}

export function entranceConflict(game: Game, scene: number, at: Point): boolean {
  return exitsOf(game, [scene]).some((e) => same(e.at, at));
}
