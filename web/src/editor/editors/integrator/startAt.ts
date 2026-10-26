// Playing from a level instead of the title screen: a copy of the game whose start scene goes
// straight to that level. Only the play-test copy changes; the project's .gam stays as it is.
import { ADVTYPE, type Game, type Point } from '../../../formats/game';

/** The map slot of a level scene (ADV_FILES[1]). */
const MAP_SLOT = 1;

/** The first level scene that plays this map, or -1. */
export function levelForMap(game: Game, file: string): number {
  const name = file.toLowerCase();
  return game.scenes.findIndex((s) => s.gametype === ADVTYPE && s.files[MAP_SLOT]?.toLowerCase() === name);
}

/** A copy of the game that starts at this level: the hero arrives where a link into it lands, else where the game starts, else the middle. */
export function startingAt(game: Game, scene: number): Game {
  const copy = structuredClone(game);
  const into = game.scenes.flatMap((x) => x.links).find((l) => l.toScene === scene);
  const start = copy.scenes[0].links[0];
  copy.scenes[0].links[0] = {
    toScene: scene,
    from: start?.from ?? { x: 0, y: 0 },
    to: into?.to ?? (start?.toScene === scene ? start.to : { x: 50, y: 50 }),
  };
  return copy;
}

/**
 * A copy of the game whose start link lands the hero at `at` in `scene` (the Play Level menu's
 * pick). Its From block (which play() only compares with the level's links to Game won, to warn
 * of a game won before it starts) is moved off any such link, so the copy never shows that warning
 * when the real game wouldn't.
 */
export function startingAtSpot(game: Game, scene: number, at: Point): Game {
  const copy = structuredClone(game);
  const won = new Set((game.scenes[scene]?.links ?? []).filter((l) => l.toScene === 1).map((l) => `${l.from.x},${l.from.y}`));
  const from = { ...(copy.scenes[0].links[0]?.from ?? { x: 0, y: 0 }) };
  while (won.has(`${from.x},${from.y}`)) from.x = (from.x + 1) % 100;
  copy.scenes[0].links[0] = { toScene: scene, from, to: { x: at.x, y: at.y } };
  return copy;
}
