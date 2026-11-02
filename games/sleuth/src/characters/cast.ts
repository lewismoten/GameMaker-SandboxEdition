// PEOPLE.MBL and PEOPLE.MON: every monster of the game in one pair of files. Final Curtain used to
// ship two of each (the parlor's suspects, and the Paragon's critters); the shapes fit together in
// one block set and one monster file, which saves 61,200 bytes on the disk and a floppy's worth of
// download. The suspects keep monsters 0-5 (so GREEN.MAP is unchanged); the critters follow.
import { emptyMonster, type Monster } from '@lewismoten/gamemaker-sandbox-engine/formats/monster';
import { BlockSet } from '../blocks/blockset';
import { SUSPECT_MONSTERS, addParlorMonsters } from '../levels/parlor';
import { FIRST_CRITTER, addCritters } from './critters';

export function buildCast(): { mb: BlockSet; mon: Monster[] } {
  const mb = new BlockSet(100, true);
  const mon: Monster[] = [];
  addParlorMonsters(mb, mon);
  if (mon.length !== SUSPECT_MONSTERS || mon.length !== FIRST_CRITTER) throw new Error('the critters must start right after the suspects');
  addCritters(mb, mon);
  while (mon.length < 64) mon.push(emptyMonster());
  return { mb, mon };
}
