// Chapter 2, Valentines in the Park (levels/park.ts): Teddy at the gate, the lawn, Gwinn's yard,
// and the party with Teddy's thank-you.
import { SCENE } from '../ids';
import { parkMap } from '../levels/park';
import { mark, type Stamped } from '../levels/stamp';
import { below, type Scenes } from '../scenes';
import { parkCritters } from '../sprites/critters';

export function parkChapter(s: Scenes, road: Stamped): void {
  const mons = parkCritters(s.mb);
  const park = parkMap(s.sets.park, mons);
  s.passPlace(SCENE.card2, 'Chapter Two', 'park', 'card2.lst');
  s.add({ scene: SCENE.park, desc: 'Valentines Park', file: 'park', light: 'day', set: 'park', hero: 'hero', song: 'park', stamped: park, mons });
  s.passPlace(SCENE.talkTeddy, 'Teddy', 'park', 'talkted.lst');
  s.passPlace(SCENE.talkTeddy2, "Teddy's Party", 'park', 'talkted2.lst');
  s.door(SCENE.road1, mark(road, 'M'), SCENE.card2, s.passCell());
  s.passOn(SCENE.card2, SCENE.park, mark(park, '@'));
  // Teddy at the gate: what happened (he comes back beside him)
  const k = mark(park, 'K');
  s.talk(SCENE.park, k, SCENE.talkTeddy, 'none', { x: k.x + 1, y: k.y });
  // the party: Teddy's thank-you, back inside his corner by his valentine
  s.talk(SCENE.park, mark(park, 'L'), SCENE.talkTeddy2, 'thanks', below(mark(park, 'L')));
  s.door(SCENE.park, mark(park, 'S'), SCENE.road1, mark(road, 's'));
}
