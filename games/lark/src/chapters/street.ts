// Chapter 3, The Parade (levels/street.ts): across the parade's lanes for the Bard's drumsticks,
// and his thank-you at the bandstand.
import { SCENE } from '../ids';
import { mark, type Stamped } from '../levels/stamp';
import { streetMap } from '../levels/street';
import { below, type Scenes } from '../scenes';
import { streetCritters } from '../sprites/critters';

export function streetChapter(s: Scenes, road: Stamped): void {
  const mons = streetCritters(s.mb);
  const street = streetMap(s.sets.park, mons);
  s.passPlace(SCENE.card3, 'Chapter Three', 'parade', 'card3.lst');
  s.add({
    scene: SCENE.street,
    desc: 'Main Street Parade',
    file: 'street',
    light: 'evening',
    set: 'park',
    hero: 'hero',
    song: 'parade',
    stamped: street,
    mons,
  });
  s.passPlace(SCENE.talkBard, 'The Bard of Bizarre', 'parade', 'talkbard.lst');
  s.door(SCENE.road1, mark(road, 'N'), SCENE.card3, s.passCell());
  s.passOn(SCENE.card3, SCENE.street, mark(street, '@'));
  s.talk(SCENE.street, mark(street, 'L'), SCENE.talkBard, 'thanks', below(mark(street, 'L')));
  s.door(SCENE.street, mark(street, 'N'), SCENE.road1, mark(road, 'u'));
}
