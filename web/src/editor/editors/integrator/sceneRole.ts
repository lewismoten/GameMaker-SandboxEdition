// What a scene is, read from its data: a title or menu, an ending, a talk page or fade the hero leaves
// at once, a room with several ways out (a menu room, a choice of doors, a hub), or an ordinary level.
// Only facts in the .gam are used (the kind, the arrival cell, the links), so a label never guesses.
import { NOSCENE, sceneKind, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { arrival } from './layoutCells';

export type SceneRole = 'title' | 'ending' | 'pass' | 'branch' | 'level' | 'unused';

/** Where the scene's links lead: the distinct scenes that exist. */
function exits(game: Game, i: number): number[] {
  const out = new Set<number>();
  for (const l of game.scenes[i].links) if (l.toScene !== NOSCENE && game.scenes[l.toScene]) out.add(l.toScene);
  return [...out];
}

/** True when the hero arrives standing on one of the scene's own links out, so it ends at once. */
export function passesThrough(game: Game, i: number): boolean {
  if (sceneKind(game.scenes[i]) !== 'adventure') return false;
  const at = arrival(game, i);
  return game.scenes[i].links.some((l) => l.toScene !== NOSCENE && !!game.scenes[l.toScene] && l.from.x === at.x && l.from.y === at.y);
}

export function sceneRole(game: Game, i: number): SceneRole {
  const kind = sceneKind(game.scenes[i]);
  if (kind === 'start') return 'title';
  if (kind === 'end') return 'ending';
  if (kind === 'unused') return 'unused';
  if (passesThrough(game, i)) return 'pass';
  return exits(game, i).length >= 2 ? 'branch' : 'level';
}

/** A level-only finding ("no way through", "nothing to collect") means nothing on these. */
export const playedAsLevel = (role: SceneRole): boolean => role === 'level' || role === 'branch';

/** Words for a scene's footer or note; undefined for an ordinary level, which needs no label. */
export function roleNote(game: Game, i: number): string | undefined {
  switch (sceneRole(game, i)) {
    case 'pass':
      return 'passes through';
    case 'branch':
      return `${exits(game, i).length} ways out`;
    default:
      return undefined;
  }
}
