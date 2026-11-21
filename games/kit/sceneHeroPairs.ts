// PLAYGAME retains the character and character blocks independently across scene links.
import { ADVTYPE, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';

export function sceneHeroPairs(game: Game): Map<string, Set<string>> {
  const pairs = new Map<string, Set<string>>();
  const seen = new Set<string>();
  const pending: [number, string, string][] = game.scenes[0].links.slice(0, game.scenes[0].numLinks).map((link) => [link.toScene, '', '']);
  while (pending.length) {
    const [index, inheritedHero, inheritedBlocks] = pending.pop()!;
    const scene = game.scenes[index];
    if (scene?.gametype !== ADVTYPE) continue;
    const hero = scene.files[5]?.toLowerCase() || inheritedHero;
    const blocks = scene.files[6]?.toLowerCase() || inheritedBlocks;
    const key = JSON.stringify([index, hero, blocks]);
    if (seen.has(key)) continue;
    seen.add(key);
    if (hero && blocks) {
      const sets = pairs.get(hero) ?? new Set<string>();
      sets.add(blocks);
      pairs.set(hero, sets);
    }
    for (const link of scene.links.slice(0, scene.numLinks)) pending.push([link.toScene, hero, blocks]);
  }
  return pairs;
}
