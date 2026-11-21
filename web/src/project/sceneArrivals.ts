// Scene arrivals shared by the editor and printable Level Maps.
import { NOSCENE, sceneKind, type Game, type Point } from '@lewismoten/gamemaker-sandbox-engine/formats/game';

/** The links that bring the hero into `scenes` (from any scene), with the scene each arrives in. */
export function sceneArrivals(game: Game, scenes: ReadonlySet<number>): { scene: number; at: Point }[] {
  const out: { scene: number; at: Point }[] = [];
  for (const s of game.scenes.filter((s) => s.gametype !== NOSCENE))
    for (const l of s.links) if (l.toScene !== NOSCENE && scenes.has(l.toScene)) out.push({ scene: l.toScene, at: l.to });
  return out;
}

/**
 * Does the hero never walk around in these scenes: each one starts him right on a way out of
 * it (a talk's page, a verdict, a card before a board), so the map flashes past unseen?
 * Only the arrival cell is certain from the scene data. Other touch cells depend on the hero’s pose and pixel offsets.
 * Only arrivals accepted by `here` count (all of them when it is left out).
 */
export function passesThrough(game: Game, scenes: number[], here: (at: Point) => boolean = () => true): boolean {
  const ins = sceneArrivals(game, new Set(scenes)).filter((a) => here(a.at));
  return (
    ins.length > 0 &&
    ins.every(
      ({ scene, at }) =>
        sceneKind(game.scenes[scene]) === 'adventure' &&
        game.scenes[scene].links.some((l) => l.toScene !== scene && l.toScene !== NOSCENE && l.from.x === at.x && l.from.y === at.y),
    )
  );
}
