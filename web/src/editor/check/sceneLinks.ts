// Which scenes are levels and which links lead into a scene: plain lookups on the parsed game,
// apart from the playtest (playtest.ts) so the editors' check badges can use them without
// bringing in the explorer, the simulator and the engine.
import { ADVTYPE, type Game } from '../../formats/game';

/** Level scenes: the ones with a map that play can enter. */
export function levelScenes(game: Game): number[] {
  return game.scenes.flatMap((s, i) => (i > 1 && s.gametype === ADVTYPE && s.files[1] ? [i] : []));
}

/** Every link into `scene`: from which scene, which link, and where the hero starts. */
export function linksInto(game: Game, scene: number): { scene: number; link: number; to: { x: number; y: number } }[] {
  return game.scenes.flatMap((s, i) => s.links.flatMap((l, k) => (l.toScene === scene ? [{ scene: i, link: k, to: l.to }] : [])));
}
