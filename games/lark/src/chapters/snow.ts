// Chapter 7, Snow Day (levels/snow.ts): Lewie asks for a hand, his street's drifts and doormats,
// and his thank-you on the porch.
import { SCENE } from '../ids';
import { mark, type Stamped } from '../levels/stamp';
import { snowMap } from '../levels/snow';
import { below, type Scenes } from '../scenes';
import { snowCritters } from '../sprites/critters';

export function snowChapter(s: Scenes, road: Stamped): void {
  const mons = snowCritters(s.mb);
  const street = snowMap(s.sets.snow, mons);
  s.passPlace(SCENE.card7, 'Chapter Seven', 'snow', 'card7.lst');
  s.passPlace(SCENE.talkLewie, 'Teenage Lewie', 'snow', 'talklew.lst');
  s.add({ scene: SCENE.snow, desc: "Lewie's Street", file: 'snow', light: 'snow', set: 'snow', hero: 'hero', song: 'snow', stamped: street, mons });
  s.passPlace(SCENE.talkLewie2, 'The Hearth', 'snow', 'talklew2.lst');
  s.door(SCENE.road3, mark(road, 'L'), SCENE.card7, s.passCell());
  s.passOn(SCENE.card7, SCENE.talkLewie, s.passCell());
  s.passOn(SCENE.talkLewie, SCENE.snow, mark(street, '@'));
  s.talk(SCENE.snow, mark(street, 'L'), SCENE.talkLewie2, 'thanks', below(mark(street, 'L')));
  // on along the winter road to the Hive, by Lewie's back garden (the third leg's stops run one into the next)
  s.door(SCENE.snow, mark(street, 'B'), SCENE.card8, s.passCell());
}
