// Starter level sequences: title entry, first-exit links and the final link to the ending.
import { MAXSCENELINKS, NOSCENE, type Game, type Scene } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import type { StarterMap } from './map';

interface SequenceLevel {
  map: Pick<StarterMap, 'start' | 'exits'>;
}

/** Append levels after the title and ending, keeping each caller's scene files and settings. */
export function addSceneSequence<L extends SequenceLevel>(game: Game, levels: L[], makeScene: (level: L, index: number) => Scene): void {
  levels.forEach((l, i) => {
    const scene = makeScene(l, i);
    scene.links = Array.from({ length: MAXSCENELINKS }, () => ({ toScene: NOSCENE, from: { x: 0, y: 0 }, to: { x: 0, y: 0 } }));
    const next = levels[i + 1];
    const [fx, fy] = l.map.exits[0].from;
    scene.links[0] = { toScene: next ? i + 3 : 1, from: { x: fx, y: fy }, to: next ? { x: next.map.start[0], y: next.map.start[1] } : { x: 0, y: 0 } };
    game.scenes.push(scene);
  });

  const first = levels[0].map.start;
  game.scenes[0].links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: first[0], y: first[1] } };
}
