// Chapter 4, The Music Box (levels/shop.ts, levels/inbox.ts): the toy shop and the goat, inside
// the box, and the shop with the box playing and her thank-you.
import { SCENE } from '../ids';
import { inboxMap } from '../levels/inbox';
import { shopMap } from '../levels/shop';
import { mark, type Stamped } from '../levels/stamp';
import { below, type Scenes } from '../scenes';
import { boxCritters } from '../sprites/critters';

export function musicBoxChapter(s: Scenes, road: Stamped): void {
  const shop = shopMap(s.sets.night, false);
  const shop7 = shopMap(s.sets.night, true);
  const mons = boxCritters(s.mb);
  const inbox = inboxMap(s.sets.box, mons);
  s.passPlace(SCENE.card4, 'Chapter Four', 'musicbox', 'card4.lst');
  s.add({ scene: SCENE.shop, desc: 'The Toy Shop', file: 'shop', light: 'night', set: 'night', hero: 'hero', song: 'musicbox', stamped: shop });
  s.passPlace(SCENE.talkGoat, 'The Third Goat', 'musicbox', 'talkgoat.lst');
  s.add({ scene: SCENE.inbox, desc: 'Inside the Music Box', file: 'inbox', light: 'lamp', set: 'box', hero: 'side', song: 'musicbox', stamped: inbox, mons });
  s.add({ scene: SCENE.shop7, desc: 'The Box Plays', file: 'shop7', light: 'night', set: 'night', hero: 'hero', song: 'dance', stamped: shop7 });
  s.passPlace(SCENE.talkGoat2, 'The Goat Dances', 'dance', 'talkgot2.lst');
  s.door(SCENE.road2, mark(road, 'L'), SCENE.card4, s.passCell());
  s.passOn(SCENE.card4, SCENE.shop, mark(shop, '@'));
  const g = mark(shop, 'G');
  s.talk(SCENE.shop, g, SCENE.talkGoat, 'none', { x: g.x + 1, y: g.y });
  s.door(SCENE.shop, mark(shop, 'K'), SCENE.inbox, mark(inbox, '@'));
  s.door(SCENE.inbox, mark(inbox, 'X'), SCENE.shop7, below(mark(shop, 'K')));
  s.talk(SCENE.shop7, mark(shop7, 'L'), SCENE.talkGoat2, 'thanks', below(mark(shop7, 'L')));
  // on along the shore to the car lot
  s.door(SCENE.shop7, mark(shop7, 'S'), SCENE.card5, s.passCell());
}
