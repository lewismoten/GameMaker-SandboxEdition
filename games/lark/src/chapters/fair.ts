// Chapter 10, The Fair (levels/fair.ts): Doc Leo at the gate, up the carousel's horses to the
// canopy for Reggie, and Doc Leo's thank-you, straight on down the road.
import { SCENE } from '../ids';
import { fairMap, REGGIE_RUN } from '../levels/fair';
import { mark } from '../levels/stamp';
import type { Scenes } from '../scenes';
import { fairCritters } from '../sprites/critters';

export function fairChapter(s: Scenes, next: number): void {
  const mons = fairCritters(s.mb, REGGIE_RUN);
  const fair = fairMap(s.sets.fair, mons);
  s.passPlace(SCENE.card10, 'Chapter Ten', 'fair', 'card10.lst');
  s.passPlace(SCENE.talkFair, 'Doc Leo at the Fair', 'fair', 'talkfair.lst');
  s.add({ scene: SCENE.fair, desc: 'The Fair', file: 'fair', light: 'evening', set: 'fair', hero: 'side', song: 'fair', stamped: fair, mons });
  s.passPlace(SCENE.talkFair2, 'Reggie Is Safe', 'fair', 'talkfai2.lst');
  s.passOn(SCENE.card10, SCENE.talkFair, s.passCell());
  s.passOn(SCENE.talkFair, SCENE.fair, mark(fair, '@'));
  s.door(SCENE.fair, mark(fair, 'L'), SCENE.talkFair2, s.passCell('thanks'));
  s.door(SCENE.talkFair2, s.passCell('thanks'), next, next === SCENE.end ? { x: 0, y: 0 } : s.passCell());
}
