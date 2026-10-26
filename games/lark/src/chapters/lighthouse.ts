// Chapter 6, The Lighthouse (levels/cove.ts, levels/lighthouse.ts): the dark cove and Carl, the
// climb to the lamp, and the cove lit, with his thank-you.
import { SCENE } from '../ids';
import { CARL_LOOP, coveMap } from '../levels/cove';
import { lighthouseMap } from '../levels/lighthouse';
import { mark } from '../levels/stamp';
import { below, type Scenes } from '../scenes';
import { coveCritters, lighthouseCritters } from '../sprites/critters';

export function lighthouseChapter(s: Scenes): void {
  const coveMons = coveCritters(s.mb, CARL_LOOP);
  const cove = coveMap(s.sets.night, coveMons, false);
  const coveLit = coveMap(s.sets.night, undefined, true);
  const liftMons = lighthouseCritters(s.mb);
  const inside = lighthouseMap(s.sets.tower, liftMons);
  s.passPlace(SCENE.card6, 'Chapter Six', 'sea', 'card6.lst');
  s.add({ scene: SCENE.cove, desc: 'The Dark Cove', file: 'cove', light: 'dark', set: 'night', hero: 'hero', song: 'sea', stamped: cove, mons: coveMons });
  s.add({
    scene: SCENE.lighthouse,
    desc: 'Up the Lighthouse',
    file: 'lthouse',
    light: 'lamp',
    set: 'tower',
    hero: 'side',
    song: 'sea',
    stamped: inside,
    mons: liftMons,
  });
  s.add({ scene: SCENE.coveLit, desc: 'The Lit Cove', file: 'covelit', light: 'evening', set: 'night', hero: 'hero', song: 'dance', stamped: coveLit });
  s.passPlace(SCENE.talkCarl, 'Carl', 'dance', 'talkcarl.lst');
  s.passOn(SCENE.card6, SCENE.cove, mark(cove, '@'));
  s.door(SCENE.cove, mark(cove, 'D'), SCENE.lighthouse, mark(inside, '@'));
  s.door(SCENE.lighthouse, mark(inside, 'D'), SCENE.cove, below(mark(cove, 'D')));
  s.door(SCENE.lighthouse, mark(inside, 'l'), SCENE.coveLit, below(mark(coveLit, 'D')));
  s.talk(SCENE.coveLit, mark(coveLit, 'L'), SCENE.talkCarl, 'thanks', below(mark(coveLit, 'L')));
  // on over the hill
  s.door(SCENE.coveLit, mark(coveLit, 'S'), SCENE.over, s.passCell());
}
