// Chapter 8, Open Mic at the Hive (levels/hive.ts, levels/loft.ts): Will's pages round the
// floor, up the turret on the warm air and the fan's draft, and back down to the lit stage for
// his thank-you.
import { SCENE } from '../ids';
import { hiveMap, PAGE_LOOPS } from '../levels/hive';
import { loftMap } from '../levels/loft';
import { mark } from '../levels/stamp';
import { below, type Scenes } from '../scenes';
import { hiveCritters } from '../sprites/critters';

export function hiveChapter(s: Scenes): void {
  const mons = hiveCritters(s.mb, PAGE_LOOPS);
  const hive = hiveMap(s.sets.hive, mons, false);
  const hive7 = hiveMap(s.sets.hive, undefined, true);
  const loft = loftMap(s.sets.turret);
  s.passPlace(SCENE.card8, 'Chapter Eight', 'hive', 'card8.lst');
  s.add({ scene: SCENE.hive, desc: 'The Hive', file: 'hive', light: 'lamp', set: 'hive', hero: 'hero', song: 'hive', stamped: hive, mons });
  s.passPlace(SCENE.talkWill, 'Will', 'hive', 'talkwill.lst');
  s.add({ scene: SCENE.loft, desc: 'Up the Turret', file: 'loft', light: 'lamp', set: 'turret', hero: 'side', song: 'loft', stamped: loft });
  s.add({ scene: SCENE.hive7, desc: 'Open Mic', file: 'hive7', light: 'lamp', set: 'hive', hero: 'hero', song: 'hive', stamped: hive7 });
  s.passPlace(SCENE.talkWill2, "Will's Turn", 'hive', 'talkwil2.lst');
  s.passOn(SCENE.card8, SCENE.hive, mark(hive, '@'));
  const w = mark(hive, 'w');
  s.talk(SCENE.hive, w, SCENE.talkWill, 'none', below(w));
  s.door(SCENE.hive, mark(hive, 'U'), SCENE.loft, mark(loft, '@'));
  s.door(SCENE.loft, mark(loft, 'D'), SCENE.hive, { x: mark(hive, 'U').x - 1, y: mark(hive, 'U').y });
  // the back stair comes down by the stage
  s.door(SCENE.loft, mark(loft, 'X'), SCENE.hive7, { x: mark(hive7, 'A').x - 2, y: mark(hive7, 'A').y });
  s.talk(SCENE.hive7, mark(hive7, 'L'), SCENE.talkWill2, 'thanks', below(mark(hive7, 'L')));
  // on, out of the winter, to the painted rocks
  s.door(SCENE.hive7, mark(hive7, 'S'), SCENE.card9, s.passCell());
}
