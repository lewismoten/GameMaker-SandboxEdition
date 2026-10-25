// The finale (levels/home.ts): the Smart Home, Watt, the gold, and opening time.
import { SCENE } from '../ids';
import { homeMap, RUNS } from '../levels/home';
import { mark } from '../levels/stamp';
import type { Scenes } from '../scenes';
import { homeCritters } from '../sprites/critters';

export function homeChapter(s: Scenes): void {
  const mons = homeCritters(s.mb, RUNS);
  const home = homeMap(s.sets.home, mons, false);
  const gold = homeMap(s.sets.home, undefined, true);
  s.passPlace(SCENE.card12, 'The Smart Home', 'home', 'card12.lst');
  s.add({ scene: SCENE.home, desc: 'The Smart Home', file: 'home', light: 'evening', set: 'home', hero: 'side', song: 'home', stamped: home, mons });
  s.passPlace(SCENE.talkWatt, 'Watt', 'gold', 'talkwatt.lst');
  s.add({ scene: SCENE.homeGold, desc: 'Gold', file: 'homegold', light: 'gold', set: 'home', hero: 'side', song: 'gold', stamped: gold });
  s.passPlace(SCENE.epilogue, 'Opening Time', 'library', 'epilogue.lst');
  s.passOn(SCENE.card12, SCENE.home, mark(home, '@'));
  s.door(SCENE.home, mark(home, 'w'), SCENE.talkWatt, s.passCell());
  s.passOn(SCENE.talkWatt, SCENE.homeGold, mark(gold, 'o'));
  s.door(SCENE.homeGold, mark(gold, 'F'), SCENE.epilogue, s.passCell());
  s.door(SCENE.epilogue, s.passCell(), SCENE.end, { x: 0, y: 0 });
}
