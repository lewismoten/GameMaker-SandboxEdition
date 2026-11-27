// Coming back into a level without its level card. PLAYGAME shows a scene's intro (file slot 9)
// every time the hero enters it (PLAYGAME.C play()), so a level the hero leaves for a talk, a
// picture or a little room and comes back to would show "Level 2 of 2" again on each return.
// addReturnScenes gives each listed level a second scene, appended after the others: the same
// files (map, blocks, monsters, sounds, song) and the same links, but no intro. Each designated
// room or talk exit then leads to that copy, so the card shows
// only on the first arrival. Entering either one is an ordinary scene entry: the map and the
// monsters load fresh from their files, as they did on every return before, and what the hero
// carries, the score and the meters go with him (StartSceneInits keeps them).
import { type Game, type Link } from '@lewismoten/gamemaker-sandbox-engine/formats/game';

/** The file slot of a scene's intro, shown before it plays (PREGRAPHICFILEIDX). */
const INTRO = 9;

/** Appends cardless level copies and redirects the specified room or talk exit links to them. */
export function addReturnScenes(game: Game, levels: readonly number[], returns: readonly Link[]): Map<number, number> {
  const copyOf = new Map(levels.map((level, i) => [level, game.scenes.length + i]));
  // Redirect before cloning so the copies inherit the same exits as their originals.
  for (const link of returns) {
    const copy = copyOf.get(link.toScene);
    if (copy === undefined) throw new Error(`Return link targets unlisted level ${link.toScene}`);
    link.toScene = copy;
  }
  for (const level of levels) {
    const scene = structuredClone(game.scenes[level]);
    scene.files[INTRO] = '';
    scene.pos.y += 30;
    game.scenes.push(scene);
  }
  return copyOf;
}
