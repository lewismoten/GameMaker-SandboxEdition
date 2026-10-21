// SNOW.BBL: every background block of Fort Ashby and LaVale Mall, drawn in code. Index assignments are
// by name; attributes (solid sides, money, gravity, what a block turns into when touched
// or after time) are what make the game: deep snow is solid and pays $1 when you push
// into it, parking-lot asphalt quietly snows back over, ice slides you, forts throw.
//
// Each area draws its own blocks (ground.ts, things.ts, houses.ts, mall.ts, sled.ts, route.ts, fair.ts) into one
// BlockBook. A block's number is the order it was added, so the areas are called in this order.
import type { Pal } from '../art/pal';
import { blockContext, type BlockBook } from './book';
import { addGround } from './ground';
import { addThings } from './things';
import { addHouses } from './houses';
import { addMall, addSnack } from './mall';
import { addSled } from './sled';
import { addRoute } from './route';
import { addFair } from './fair';

export { BlockBook, SOLID } from './book';

export function buildBlocks(pal: Pal): BlockBook {
  const k = blockContext(pal);
  const painters = addGround(k);
  const treats = addThings(k, painters);
  addHouses(k);
  const mall = addMall(k);
  addSled(k, treats);
  addRoute(k, painters);
  addFair(k, painters, mall);
  addSnack(k, painters);
  return k.book;
}
