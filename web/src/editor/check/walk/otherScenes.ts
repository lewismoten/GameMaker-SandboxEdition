// Which other scenes add to a counter the bot found short. Counters carry from scene to scene
// (engine/scene.ts fills them from the character only at the first scene), so a door's key can be
// in another scene; the bot plays one scene at a time, and lockedWhy (gates.ts) names these
// scenes instead of saying nothing adds to the counter.
import { loadScene } from '@lewismoten/gamemaker-sandbox-engine/engine/scene';
import { LASTMON } from '@lewismoten/gamemaker-sandbox-engine/engine/world';
import { sceneKind, type Game } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { FileSource } from '../sim';
import { monsterAdds, sourcesOf } from './gates';

/** Per counter, the names (with numbers) of the game's other play scenes whose map, blocks or monsters add to it (as they start). */
export function otherScenesAdding(game: Game, files: FileSource, scene: number, counters: Iterable<number>): Map<number, string[]> {
  const want = new Set(counters);
  const out = new Map<number, string[]>();
  if (!want.size) return out;
  game.scenes.forEach((s, i) => {
    if (i === scene || sceneKind(s) !== 'adventure') return;
    const loaded = loadScene({ game, m: { files } }, i);
    if (Array.isArray(loaded)) return;
    const w = loaded.world;
    const found = new Set(sourcesOf(w.map, w.bg, want, [], undefined, w).map((x) => x.counter));
    for (const mm of w.mm) if (mm.monnum < LASTMON) for (const c of monsterAdds(w, mm.monnum)) if (want.has(c)) found.add(c);
    // with its number: many games leave every scene "UnTitled"
    const name = s.desc.trim() ? `${s.desc.trim()} (scene ${i})` : `Scene ${i}`;
    for (const c of found) out.set(c, [...(out.get(c) ?? []), name]);
  });
  return out;
}
