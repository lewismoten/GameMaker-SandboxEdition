// The background blocks (sandcast.bbl): the sandbox, castles, moats, hose streams, tide,
// tunnels, Gwinn's patio and the BBS room, with every block's rules.
//
// Each area's blocks live in their own module and are added to one shared BlockSet. A block's
// number in the .BBL is the order it was added, so the calls below must stay in this order
// (the maps, monsters and character all refer to blocks by name, through B()).
import { PURPLE } from '../art/palette';
import { bg } from './common';
import { addSandbox } from './sandbox';
import { addPickups } from './pickups';
import { addCastles } from './castles';
import { addWater } from './water';
import { addToys } from './toys';
import { addBurrows } from './burrows';
import { addPatio } from './patio';
import { addBbs } from './bbs';
import { addDig } from './dig';

addSandbox();
const juiceArt = addPickups();
addCastles();
addWater();
addToys();
addBurrows();
addPatio();
addBbs(juiceArt);
addDig();

export const BG = bg;
export const B = (name: string) => bg.id(name);
export { PURPLE };
