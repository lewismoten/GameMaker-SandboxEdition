// Chapter 1, The Clock Tower (levels/clock.ts): the square at 6:59 and Doc Leo, the tower, the
// belfry, the bell, and the square at seven with his thank-you.
import { SCENE } from '../ids';
import { belfryMap, squareMap, towerMap } from '../levels/clock';
import { mark, type Stamped } from '../levels/stamp';
import { below, type Scenes } from '../scenes';
import { squareCritters, towerCritters } from '../sprites/critters';

export function clockChapter(s: Scenes, road: Stamped): void {
  const { town, tower } = s.sets;
  const squareMons = squareCritters(s.mb);
  const towerMons = towerCritters(s.mb);
  const square = squareMap(town, squareMons, false);
  const square7 = squareMap(town, squareMons, true);
  const inside = towerMap(tower, towerMons);
  const belfry = belfryMap(tower);
  s.passPlace(SCENE.card1, 'Chapter One', 'square', 'card1.lst');
  s.add({
    scene: SCENE.square,
    desc: 'The Square, 6:59',
    file: 'square',
    light: 'evening',
    set: 'town',
    hero: 'hero',
    song: 'square',
    stamped: square,
    mons: squareMons,
  });
  s.add({
    scene: SCENE.tower,
    desc: 'The Clock Tower',
    file: 'tower',
    light: 'clock',
    set: 'tower',
    hero: 'side',
    song: 'tower',
    stamped: inside,
    mons: towerMons,
  });
  s.add({ scene: SCENE.belfry, desc: 'The Belfry', file: 'belfry', light: 'clock', set: 'tower', hero: 'side', song: 'tower', stamped: belfry });
  s.add({
    scene: SCENE.square7,
    desc: 'The Square, Seven',
    file: 'square7',
    light: 'evening',
    set: 'town',
    hero: 'hero',
    song: 'parade',
    stamped: square7,
    mons: squareMons,
  });
  s.passPlace(SCENE.talkLeo, 'Doc Leo', 'square', 'talkleo.lst');
  s.passPlace(SCENE.talkLeo7, 'Doc Leo at Seven', 'parade', 'talkleo7.lst');
  s.passPlace(SCENE.bell, 'Seven Bells', 'parade', 'bell.lst');

  // up the lane (by the chapter's card) into the square
  s.door(SCENE.road1, mark(road, 'L'), SCENE.card1, s.passCell());
  s.passOn(SCENE.card1, SCENE.square, mark(square, '@'));
  // the square at 6:59: Doc Leo, the tower door, and back down the lane
  s.talk(SCENE.square, mark(square, 'L'), SCENE.talkLeo, 'none', below(mark(square, 'L')));
  s.door(SCENE.square, mark(square, 'd'), SCENE.tower, mark(inside, '@'));
  s.door(SCENE.square, mark(square, 'S'), SCENE.road1, mark(road, 'r'));
  // the tower: the door back out, the hatch up; the belfry's bell rope rings seven
  s.door(SCENE.tower, mark(inside, 'D'), SCENE.square, below(mark(square, 'd')));
  s.door(SCENE.tower, mark(inside, 'X'), SCENE.belfry, mark(belfry, '@'));
  s.door(SCENE.belfry, mark(belfry, 'R'), SCENE.bell, s.passCell());
  s.passOn(SCENE.bell, SCENE.square7, mark(square7, '@'));
  // the square at seven: Doc Leo's thank-you (back inside his corner, by the key), and home down the lane
  s.talk(SCENE.square7, mark(square7, 'L'), SCENE.talkLeo7, 'thanks', below(mark(square7, 'L')));
  s.door(SCENE.square7, mark(square7, 'S'), SCENE.road1, mark(road, 'r'));
}
