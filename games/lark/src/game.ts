// lark.gam: the scene graph, and every map and monster list it loads, chapter by chapter
// (src/chapters). Scene numbers are in ids.ts SCENE.
//
// A talk, a chapter card and the bell are pass scenes (levels/pass.ts): their intro picture is the
// point, and they link straight on. PLAYGAME shows a scene's intro on every way in, so no place
// Joe comes back to (from a talk) has an intro of its own: each chapter's card is a pass scene on
// the way in from the road instead.
import type { Game } from '../../../web/src/formats/game';
import { parkSet } from './blocks/park';
import { townSet } from './blocks/town';
import { towerSet } from './blocks/tower';
import type { BlockSet } from './blocks/sets';
import { buildHero, buildSide, heroBlocks } from './characters';
import { clockChapter } from './chapters/clock';
import { parkChapter } from './chapters/park';
import { prologue } from './chapters/prologue';
import { streetChapter } from './chapters/street';
import { SCENE } from './ids';
import { passMap } from './levels/pass';
import { roadMap } from './levels/road';
import { mark, type Stamped } from './levels/stamp';
import { Scenes, type Place } from './scenes';
import { critterBlocks } from './sprites/critters';

export const GAM = 'lark.gam';

export interface Compiled {
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
  const sets = { town: townSet(), tower: towerSet(), park: parkSet() };
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
  // east through the field gate: over the hill (for now, the end)
  s.passPlace(SCENE.over, 'Over the Hill', 'road', '');
  s.door(SCENE.road1, mark(road, 'E'), SCENE.over, s.passCell());
  s.door(SCENE.over, s.passCell(), SCENE.end, { x: 0, y: 0 });

  const game = s.game({ scene: SCENE.library, at: mark(library, '@') });
  return { game, places: s.places, sets, mb, hero: buildHero(cb), side: buildSide(cb), cb, pass };
}
