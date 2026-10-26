// lark.gam: the scene graph, and every map and monster list it loads, chapter by chapter
// (src/chapters). Scene numbers are in ids.ts SCENE.
//
// A talk, a chapter card and the bell are pass scenes (levels/pass.ts): their intro picture is the
// point, and they link straight on. PLAYGAME shows a scene's intro on every way in, so no place
// Joe comes back to (from a talk) has an intro of its own: each chapter's card is a pass scene on
// the way in from the road instead.
import type { Game } from '../../../web/src/formats/game';
import { boxSet } from './blocks/box';
import { nightSet } from './blocks/night';
import { parkSet } from './blocks/park';
import { townSet } from './blocks/town';
import { towerSet } from './blocks/tower';
import type { BlockSet } from './blocks/sets';
import { buildHero, buildSide, heroBlocks } from './characters';
import { clockChapter } from './chapters/clock';
import { lighthouseChapter } from './chapters/lighthouse';
import { lotChapter } from './chapters/lot';
import { musicBoxChapter } from './chapters/musicbox';
import { parkChapter } from './chapters/park';
import { prologue } from './chapters/prologue';
import { streetChapter } from './chapters/street';
import { SCENE } from './ids';
import { passMap } from './levels/pass';
import { roadMap, winterRoadMap } from './levels/road';
import { snowSet } from './blocks/snow';
import { snowChapter } from './chapters/snow';
import { hiveChapter } from './chapters/hive';
import { hiveSet } from './blocks/hive';
import { turretSet } from './blocks/turret';
import { gardenSet } from './blocks/garden';
import { gardenChapter } from './chapters/garden';
import { fairSet } from './blocks/fair';
import { fairChapter } from './chapters/fair';
import { plantSet } from './blocks/plant';
import { plantChapter } from './chapters/plant';
import { homeSet } from './blocks/home';
import { homeChapter } from './chapters/home';
import { mark, type Stamped } from './levels/stamp';
import { Scenes, type Place } from './scenes';
import { critterBlocks } from './sprites/critters';

export const GAM = 'lark.gam';

interface Compiled {
  game: Game;
  places: Place[];
  sets: Record<string, BlockSet>;
  mb: BlockSet;
  hero: ReturnType<typeof buildHero>;
  side: ReturnType<typeof buildSide>;
  cb: BlockSet;
  pass: Stamped;
}

export function compile(): Compiled {
  const sets = {
    town: townSet(),
    tower: towerSet(),
    park: parkSet(),
    night: nightSet(),
    box: boxSet(),
    snow: snowSet(),
    hive: hiveSet(),
    turret: turretSet(),
    garden: gardenSet(),
    fair: fairSet(),
    plant: plantSet(),
    home: homeSet(),
  };
  const mb = critterBlocks();
  const cb = heroBlocks();
  const pass = passMap(sets.town);
  const s = new Scenes(sets, mb, pass);

  const road = roadMap(sets.town);
  s.add({ scene: SCENE.road1, desc: 'The Long Road', file: 'road1', light: 'evening', set: 'town', hero: 'hero', song: 'road', stamped: road });
  const library = prologue(s, road);
  clockChapter(s, road);
  parkChapter(s, road);
  streetChapter(s, road);
  // east through the field gate to the road's second leg, along the shore at night
  const road2 = roadMap(sets.town, 2);
  s.add({ scene: SCENE.road2, desc: 'The Shore Road', file: 'road2', light: 'night', set: 'town', hero: 'hero', song: 'road', stamped: road2 });
  s.door(SCENE.road1, mark(road, 'E'), SCENE.road2, mark(road2, '@'));
  musicBoxChapter(s, road2);
  lotChapter(s);
  lighthouseChapter(s);
  // from the lit cove, on over the hill to the road's third leg, in the snow
  s.passPlace(SCENE.over, 'Over the Hill', 'snow', 'over.lst');
  const road3 = winterRoadMap(sets.snow);
  s.add({ scene: SCENE.road3, desc: 'The Winter Road', file: 'road3', light: 'snow', set: 'snow', hero: 'hero', song: 'road', stamped: road3 });
  s.passOn(SCENE.over, SCENE.road3, mark(road3, '@'));
  snowChapter(s, road3);
  hiveChapter(s);
  // out of the snow, and on along the last leg, one stop into the next
  gardenChapter(s, SCENE.card10);
  fairChapter(s, SCENE.card11);
  plantChapter(s, SCENE.card12);
  homeChapter(s);

  const game = s.game({ scene: SCENE.library, at: mark(library, '@') });
  return { game, places: s.places, sets, mb, hero: buildHero(cb), side: buildSide(cb), cb, pass };
}
