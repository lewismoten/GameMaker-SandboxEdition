// Neka with a small shovel: DIG IT's own copy of the hero's character blocks and sequences. She carries the shovel out in
// front of her when she stands, walks and jumps (blade angled to the ground), so walking into soil is plainly a dig; the
// Down arrow scoops (blade into the dirt, then lifted with a clump flying) while she pushes down into the soil under her.
// The kit's heroes (games/kit/starter/hero.ts) are not touched: this reuses their head, body and outline drawing.
import type { Character } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { emptyFrame } from '@lewismoten/gamemaker-sandbox-engine/formats/character';
import { set } from '@lewismoten/gamemaker-sandbox-tools/kit/actors';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import { buildHero, CLIMB_STEP } from '../../kit/starter/heroChar';
import { body, head, outlinedPair, type Legs } from '../../kit/starter/hero';
import { KEY, SEQ } from '../../kit/starter/ids';
import type { Pal } from '../../kit/starter/palette';

/** Pixels a scoop frame pushes down: the same as a climb step, so a dug hole is walked down at the same pace. */
const SCOOP_STEP = CLIMB_STEP;

/** A clump of dirt in the air at (x, y): three crumbs, so it reads as thrown soil. */
function clump(pal: Pal, p: Pixels, x: number, y: number, size: 'big' | 'small'): void {
  const d = pal.r('dirt');
  const t = pal.r('parch');
  const w = size === 'big' ? 4 : 2;
  p.rect(x, y, w, w - 1, t[3])
    .rect(x, y, w, 1, t[4])
    .rect(x, y + w - 2, w, 1, d[3]);
  p.rect(x + 5, y - 3, 3, 3, t[3])
    .rect(x + 5, y - 3, 3, 1, t[4])
    .rect(x + 3, y - 7, 2, 2, t[4])
    .set(x - 1, y - 3, t[3]);
}

/** The hero's character blocks (.CBL) with the shovel, by the kit's names so the kit's character file finds them. */
export function buildDigHeroBlocks(pal: Pal): Book {
  const book = new Book('cbl');
  const add = (topName: string, bottomName: string, top: Pixels, bottom: Pixels) => {
    const [t, b] = outlinedPair(pal, top, bottom);
    if (!book.has(topName)) book.add(topName, t);
    if (!book.has(bottomName)) book.add(bottomName, b);
  };
  const stand: Legs = { back: [5, 0], front: [11, 0] };
  const walk: Legs[] = [
    { back: [3, 0], front: [12, 0] },
    { back: [7, 2], front: [9, 0] },
    { back: [12, 0], front: [3, 0] },
    { back: [9, 0], front: [7, 2] },
  ];
  const carry = (legs: Legs | 'tuck') => body(pal, { arms: 'dig0', legs });
  add('stand.top', 'stand', head(pal, 'smile'), carry(stand));
  add('blink.top', 'stand', head(pal, 'blink'), carry(stand));
  add('hurt.top', 'hurt', head(pal, 'ouch'), body(pal, { arms: 'out', legs: { back: [4, 0], front: [12, 0] } }));
  add('cheer.top', 'jump', head(pal, 'cheer'), carry('tuck'));
  walk.forEach((legs, i) => add('stand.top', `walk${i}`, head(pal, 'smile'), carry(legs)));
  add('up.top', 'jumpup', head(pal, 'smile'), carry('tuck'));
  add('oh.top', 'fall', head(pal, 'oh', false, 0, 'left'), carry({ back: [6, 0], front: [11, 0] }));
  add('cheer2.top', 'cheer', head(pal, 'cheer', false, 0, 'both'), body(pal, { arms: 'high', legs: stand }));
  add('look.top', 'stand', head(pal, 'smile', false, -1), carry(stand));
  // the scoop: shovel lifted, blade in the dirt with clods flying, then lifted with a clump in the air
  const dig = { back: [3, 0], front: [10, 0] } as Legs;
  add('stand.top', 'dig0', head(pal, 'smile'), body(pal, { arms: 'dig0', legs: dig }));
  add('stand.top', 'dig1', head(pal, 'smile'), body(pal, { arms: 'dig1', legs: dig }));
  const up = body(pal, { arms: 'dig0', legs: dig });
  clump(pal, up, 12, 11, 'big');
  add('stand.top', 'dig2', head(pal, 'smile'), up);
  add('stand.top', 'throw0', head(pal, 'smile'), carry(stand));
  add('cheer.top', 'throw1', head(pal, 'cheer'), body(pal, { arms: 'release', legs: { back: [4, 0], front: [11, 0] } }));
  add('stand.top', 'throw2', head(pal, 'smile'), carry(stand));
  add('back.top', 'climb0', head(pal, 'back', true), body(pal, { arms: 'upA', legs: 'climbA', front: true, back: true }));
  add('back.top', 'climb1', head(pal, 'back', true), body(pal, { arms: 'upB', legs: 'climbB', front: true, back: true }));
  return book;
}

/** The hero's character file: the kit's, with the Down arrow (and the joystick's down) digging instead of climbing. S still climbs down. */
export function buildDigHero(cb: Book): Character {
  const ch = buildHero(cb);
  const f = (bottom: string, y: number, pause: number) => ({ ...emptyFrame(), pic1: cb.n('stand.top'), pic2: cb.n(bottom), y, pause });
  set(ch.sequences[SEQ.down], [f('dig0', 0, 2), f('dig1', SCOOP_STEP, 2), f('dig1', 0, 2), f('dig2', 0, 3)], { key: KEY.down, jstkMov: 5 });
  return ch;
}
