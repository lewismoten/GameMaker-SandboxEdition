// Chapter 11, The Tall Plant (levels/plant.ts): the mustard seed at the foot of the plant he
// grew, up its leaves and on the heart balloon to the star, and his thank-you at the top,
// straight on down the road.
import { SCENE } from '../ids';
import { plantMap } from '../levels/plant';
import { mark } from '../levels/stamp';
import type { Scenes } from '../scenes';

export function plantChapter(s: Scenes, next: number): void {
  const plant = plantMap(s.sets.plant);
  s.passPlace(SCENE.card11, 'Chapter Eleven', 'plant', 'card11.lst');
  s.passPlace(SCENE.talkSeed, 'The Mustard Seed', 'plant', 'talkseed.lst');
  s.add({ scene: SCENE.plant, desc: 'The Tall Plant', file: 'plant', light: 'night', set: 'plant', hero: 'side', song: 'plant', stamped: plant });
  s.passPlace(SCENE.talkSeed2, 'The Star', 'plant', 'talksed2.lst');
  s.passOn(SCENE.card11, SCENE.talkSeed, s.passCell());
  s.passOn(SCENE.talkSeed, SCENE.plant, mark(plant, '@'));
  s.door(SCENE.plant, mark(plant, 'L'), SCENE.talkSeed2, s.passCell('thanks'));
  s.door(SCENE.talkSeed2, s.passCell('thanks'), next, next === SCENE.end ? { x: 0, y: 0 } : s.passCell());
}
