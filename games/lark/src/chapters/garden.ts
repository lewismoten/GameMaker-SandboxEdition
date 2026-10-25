// Chapter 9, The Painted Rocks (levels/garden.ts): Loaf #13 calls from the cubby, the rocks rolled
// home and patted, and his thank-you inside. The road's last leg runs one stop into the next.
import { SCENE } from '../ids';
import { gardenMap } from '../levels/garden';
import { mark } from '../levels/stamp';
import type { Scenes } from '../scenes';
import { gardenCritters } from '../sprites/critters';

export function gardenChapter(s: Scenes, next: number): void {
  const mons = gardenCritters(s.mb);
  const garden = gardenMap(s.sets.garden, mons);
  s.passPlace(SCENE.card9, 'Chapter Nine', 'rocks', 'card9.lst');
  s.passPlace(SCENE.talkLoaf, 'Loaf #13', 'rocks', 'talkloaf.lst');
  s.add({ scene: SCENE.garden, desc: 'The Rock Garden', file: 'garden', light: 'day', set: 'garden', hero: 'hero', song: 'rocks', stamped: garden, mons });
  s.passPlace(SCENE.talkLoaf2, 'Loaf #13, Free', 'rocks', 'talklof2.lst');
  s.passOn(SCENE.card9, SCENE.talkLoaf, s.passCell());
  s.passOn(SCENE.talkLoaf, SCENE.garden, mark(garden, '@'));
  // Loaf's thank-you, and straight on down the road with him waving (no coming back: the map
  // would reload with every rock rolled loose again)
  s.door(SCENE.garden, mark(garden, 'L'), SCENE.talkLoaf2, s.passCell('thanks'));
  s.door(SCENE.talkLoaf2, s.passCell('thanks'), next, next === SCENE.end ? { x: 0, y: 0 } : s.passCell());
}
