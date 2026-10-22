// PEOPLE.MBL: the shared effects, every townsperson (two frames: standing and blinking), the
// royal hounds, Sir Reginald, and the overworld's foes.
import { SpriteSheet } from '../sprites/sheet';
import { addFx } from '../sprites/fx';
import { foePics } from '../sprites/foes';
import { PEOPLE, person, animalPics } from '../sprites/people';

export function peopleSheet(): SpriteSheet {
  const mb = new SpriteSheet('mbl');
  addFx(mb);
  for (const [key, spec] of Object.entries(PEOPLE)) {
    const [a, b] = person(spec);
    mb.add(`${key}0`, a);
    mb.add(`${key}1`, b);
  }
  for (const [name, pic] of animalPics()) mb.add(name, pic);
  const pics = foePics();
  for (const name of ['slime0', 'slime1', 'slimeHit']) mb.add(name, pics.get(name)!, { hp: -6 });
  for (const name of ['bat0', 'bat1', 'batHit']) mb.add(name, pics.get(name)!, { hp: -4 });
  return mb;
}
