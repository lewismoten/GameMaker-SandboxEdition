// Playing from a level instead of the title screen: a copy of the game whose start scene goes
// straight to that level. Only the play-test copy changes; the project's .gam stays as it is.
import { ADVTYPE, type Game } from '../../../formats/game';

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
