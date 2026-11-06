// Coming back into a level without its level card. PLAYGAME shows a scene's intro (file slot 9)
// every time the hero enters it (PLAYGAME.C play()), so a level the hero leaves for a talk, a
// picture or a little room and comes back to would show "Level 2 of 2" again on each return.
// addReturnScenes gives each listed level a second scene, appended after the others: the same
// files (map, blocks, monsters, sounds, song) and the same links, but no intro. Every link that
// is a return (from a scene the level itself links to) then leads to that copy, so the card shows
// only on the first arrival. Entering either one is an ordinary scene entry: the map and the
// monsters load fresh from their files, as they did on every return before, and what the hero
// carries, the score and the meters go with him (StartSceneInits keeps them).
import { NOSCENE, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';

/** The file slot of a scene's intro, shown before it plays (PREGRAPHICFILEIDX). */
const INTRO = 9;

/**
 * Appends a copy without the intro for each scene in `levels` and points every return into one at
 * its copy. A link from scene X into level L is a return when L (the original) links to X, or to
 * the scene X was copied from. Returns the copies' numbers, by level.
 */
export function addReturnScenes(game: Game, levels: readonly number[]): Map<number, number> {
  const targets = game.scenes.map((s) => new Set(s.links.map((k) => k.toScene)));
  const copyOf = new Map<number, number>();
  const original = new Map<number, number>();
  for (const l of levels) {
    const scene = structuredClone(game.scenes[l]);
    scene.files[INTRO] = '';
    scene.pos = { x: scene.pos.x, y: scene.pos.y + 30 };
    copyOf.set(l, game.scenes.length);
    original.set(game.scenes.length, l);
    game.scenes.push(scene);
  }
  game.scenes.forEach((scene, x) => {
    const home = original.get(x) ?? x;
    for (const link of scene.links) {
      const copy = link.toScene === NOSCENE ? undefined : copyOf.get(link.toScene);
      if (copy !== undefined && targets[link.toScene].has(home)) link.toScene = copy;
    }
  });
  return copyOf;
}
