// Chapter 5, The Charging Run (levels/lot.ts): Doc Leo at the entrance, the lot's breakers and
// gates, the charger, and the lot with THE CHEZ charging and his thank-you.
import { SCENE } from '../ids';
import { lotMap } from '../levels/lot';
import { mark, type Stamped } from '../levels/stamp';
import { below, type Scenes } from '../scenes';

export function lotChapter(s: Scenes, road: Stamped): void {
  const lot = lotMap(s.sets.night, false);
  const lot7 = lotMap(s.sets.night, true);
  s.passPlace(SCENE.card5, 'Chapter Five', 'lot', 'card5.lst');
  s.add({ scene: SCENE.lot, desc: 'The Car Lot', file: 'lot', light: 'night', set: 'night', hero: 'hero', song: 'lot', stamped: lot });
  s.passPlace(SCENE.talkLot, 'Doc Leo', 'lot', 'talklot.lst');
  s.add({ scene: SCENE.lot7, desc: 'Charging', file: 'lot7', light: 'night', set: 'night', hero: 'hero', song: 'lot', stamped: lot7 });
  s.passPlace(SCENE.talkLot2, 'THE CHEZ Charging', 'lot', 'talklot2.lst');
  s.door(SCENE.road2, mark(road, 'M'), SCENE.card5, s.passCell());
  s.passOn(SCENE.card5, SCENE.lot, mark(lot, '@'));
  const d = mark(lot, 'D');
  s.talk(SCENE.lot, d, SCENE.talkLot, 'none', { x: d.x + 1, y: d.y });
  s.door(SCENE.lot, mark(lot, 'C'), SCENE.lot7, below(mark(lot, 'C')));
  s.door(SCENE.lot, mark(lot, 'S'), SCENE.road2, mark(road, 's'));
  s.talk(SCENE.lot7, mark(lot7, 'L'), SCENE.talkLot2, 'thanks', below(mark(lot7, 'L')));
  s.door(SCENE.lot7, mark(lot7, 'S'), SCENE.road2, mark(road, 's'));
}
