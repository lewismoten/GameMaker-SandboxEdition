// Rory: the Starters' kid drawn by the kit, dressed for Thanksgiving errands. Rory's cap is mustard-yellow with
// ear flaps (and its pom-pom), and a red and cream striped scarf wraps the neck with a tail down the back. The
// poses are the kit's own, so Rory moves exactly as every hero does.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import { body, head, outlinedPair, type Legs } from '../../kit/starter/hero';
import { kitRamp } from '../../kit/starter/heroLook';
import type { Pal } from '../../kit/starter/palette';

const T = 255;

/** Ear flaps: a flap of the cap hangs down over the ear, with a tie, on the near side. */
function dressHead(pal: Pal, p: Pixels): Pixels {
  const hat = kitRamp(pal, 'hat');
  const out = new Pixels(20, 20, T);
  out.px.set(p.px);
  // the flap, behind and beside the cheek
  out.rect(2, 10, 3, 6, hat[3]).rect(2, 10, 1, 6, hat[4]).rect(4, 11, 1, 5, hat[1]).rect(3, 16, 1, 2, hat[1]).set(3, 18, hat[4]);
  return out;
}

/** The scarf: red and cream stripes round the neck (the top rows of the body block). */
function dressBody(pal: Pal, p: Pixels): Pixels {
  const red = pal.r('red');
  const cream = pal.r('white');
  const out = new Pixels(20, 20, T);
  out.px.set(p.px);
  for (let y = 0; y < 4; y++) for (let x = 3; x < 16; x++) if (p.get(x, y) !== T) out.set(x, y, (x + y) % 6 < 3 ? red[3] : cream[3]);
  return out;
}

/** The hero's character blocks (.CBL), by name, with the outlines drawn on. */
export function buildRoryBlocks(pal: Pal): Book {
  const book = new Book('cbl');
  // (head, body) pairs are outlined together, so the outline passes across the neck
  const pair = (top: Pixels, bottom: Pixels) => outlinedPair(pal, dressHead(pal, top), dressBody(pal, bottom));
  const stand = body(pal, { arms: 'down', legs: { back: [5, 0], front: [11, 0] } });
  const walk: Legs[] = [
    { back: [3, 0], front: [12, 0] },
    { back: [7, 2], front: [9, 0] },
    { back: [12, 0], front: [3, 0] },
    { back: [9, 0], front: [7, 2] },
  ];
  const add = (topName: string, bottomName: string, top: Pixels, bottom: Pixels) => {
    const [t, b] = pair(top, bottom);
    if (!book.has(topName)) book.add(topName, t);
    if (!book.has(bottomName)) book.add(bottomName, b);
  };
  add('stand.top', 'stand', head(pal, 'smile'), stand);
  add('blink.top', 'stand', head(pal, 'blink'), stand);
  add('hurt.top', 'hurt', head(pal, 'ouch'), body(pal, { arms: 'out', legs: { back: [4, 0], front: [12, 0] } }));
  add('cheer.top', 'jump', head(pal, 'cheer'), body(pal, { arms: 'out', legs: 'tuck' }));
  walk.forEach((legs, i) => add('stand.top', `walk${i}`, head(pal, 'smile'), body(pal, { arms: i % 2 ? 'swingB' : 'swingA', legs })));
  // jumping up, falling, cheering, digging and throwing (appended after the first blocks, so earlier numbers stay)
  add('up.top', 'jumpup', head(pal, 'smile', false, 0, 'both'), body(pal, { arms: 'high', legs: 'tuck' }));
  add('oh.top', 'fall', head(pal, 'oh', false, 0, 'left'), body(pal, { arms: 'flail', legs: 'dangle' }));
  add('cheer2.top', 'cheer', head(pal, 'cheer', false, 0, 'both'), body(pal, { arms: 'high', legs: { back: [5, 0], front: [11, 0] } }));
  add('look.top', 'stand', head(pal, 'smile', false, -1), stand);
  const dig = { back: [3, 0], front: [10, 0] } as Legs;
  add('stand.top', 'dig0', head(pal, 'smile'), body(pal, { arms: 'dig0', legs: dig }));
  add('stand.top', 'dig1', head(pal, 'smile'), body(pal, { arms: 'dig1', legs: dig }));
  add('stand.top', 'throw0', head(pal, 'smile'), body(pal, { arms: 'windup', legs: { back: [5, 0], front: [11, 0] } }));
  add('cheer.top', 'throw1', head(pal, 'cheer'), body(pal, { arms: 'release', legs: { back: [4, 0], front: [11, 0] } }));
  add('stand.top', 'throw2', head(pal, 'smile'), body(pal, { arms: 'follow', legs: { back: [5, 0], front: [11, 0] } }));
  // climbing shows his back, hands up the ladder
  add('back.top', 'climb0', head(pal, 'back', true), body(pal, { arms: 'upA', legs: 'climbA', front: true, back: true }));
  add('back.top', 'climb1', head(pal, 'back', true), body(pal, { arms: 'upB', legs: 'climbB', front: true, back: true }));
  return book;
}

