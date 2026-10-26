// The prologue, Closing Time: the library, its storybook and the workbench. The workbench talk
// is where Joe writes his note and goes out of the little red door, so it leads straight to the
// road.
import { SCENE } from '../ids';
import { libraryMap } from '../levels/library';
import { mark, type Stamped } from '../levels/stamp';
import { below, type Scenes } from '../scenes';

export function prologue(s: Scenes, road: Stamped): Stamped {
  const library = libraryMap(s.sets.town);
  s.add({ scene: SCENE.library, desc: 'Closing Time', file: 'library', light: 'lamp', set: 'town', hero: 'hero', song: 'library', stamped: library });
  s.passPlace(SCENE.talkBook, 'The Storybook', 'library', 'talkbook.lst');
  s.passPlace(SCENE.talkBench, 'The Workbench', 'road', 'talkbnch.lst');
  s.talk(SCENE.library, mark(library, 'k'), SCENE.talkBook, 'none', below(mark(library, 'k')));
  s.door(SCENE.library, mark(library, 'b'), SCENE.talkBench, s.passCell());
  s.passOn(SCENE.talkBench, SCENE.road1, mark(road, '@'));
  return library;
}
