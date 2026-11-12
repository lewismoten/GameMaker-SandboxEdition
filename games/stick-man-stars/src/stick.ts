// STICK MAN's hero: a friendly stick figure drawn in simple lines (an ink ring for a head, a
// two-pixel line for the body, arms and legs) with a little red scarf. Two blocks tall, like every
// Game-Maker character: a head block over a body block, facing right (the character file mirrors
// the pictures for walking left). Every pose has the same names the kit's hero uses, so the kit's
// character file (kit/starter/heroChar.ts) works with it as it is.
// A pale halo goes round the lines so he reads on every level's sky, day or night.
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';

const T = 255;
type Pt = [number, number];

/** A line two pixels thick. */
function thick(p: Pixels, a: Pt, b: Pt, c: number): void {
  p.line(a[0], a[1], b[0], b[1], c)
    .line(a[0] + 1, a[1], b[0] + 1, b[1], c)
    .line(a[0], a[1] + 1, b[0], b[1] + 1, c);
}

export type Face = 'smile' | 'blink' | 'ouch' | 'cheer' | 'oh' | 'back';

/** The head block: a ring, two dot eyes looking right and a smile, over the neck and the scarf. */
function head(pal: Pal, face: Face, look = 0): Pixels {
  const ink = pal.c('ink', 0);
  const p = new Pixels(20, 20, T);
  p.ring(10, 10, 7, ink).ring(10, 10, 6, ink);
  const eyeY = 8;
  const ex = [11 + look, 15 + look];
  if (face === 'back') return thickNeck(p, ink, pal);
  if (face === 'blink') for (const x of ex) p.line(x - 1, eyeY, x + 1, eyeY, ink);
  else if (face === 'ouch') for (const x of ex) p.line(x - 1, eyeY - 1, x + 1, eyeY + 1, ink).line(x - 1, eyeY + 1, x + 1, eyeY - 1, ink);
  else for (const x of ex) p.rect(x - 1, eyeY - 1, 2, 3, ink);
  if (face === 'smile' || face === 'blink') p.line(11, 13, 12, 14, ink).line(12, 14, 15, 14, ink).line(15, 14, 16, 13, ink);
  else if (face === 'cheer') p.rect(11, 12, 6, 2, ink).rect(12, 14, 4, 1, ink);
  else p.rect(13, 12, 3, 3, ink); // oh and ouch: a round mouth
  return thickNeck(p, ink, pal);
}

/** The neck below the ring, and the scarf's knot (its tail is in the body block). */
function thickNeck(p: Pixels, ink: number, pal: Pal): Pixels {
  p.rect(9, 17, 2, 3, ink);
  p.rect(7, 17, 6, 2, pal.c('red', 2));
  return p;
}

interface Pose {
  /** Hand and elbow-free arm ends, from the shoulder at (10, 3). */
  back: Pt;
  front: Pt;
  /** Feet, from the hip at (10, 11). */
  legBack: Pt;
  legFront: Pt;
  /** The scarf tail streams behind (left); `lift` raises it in the air. */
  lift?: number;
}

/** The body block: a spine, two arms and two legs, and the scarf tail. */
function body(pal: Pal, o: Pose): Pixels {
  const ink = pal.c('ink', 0);
  const p = new Pixels(20, 20, T);
  thick(p, [10, 0], [10, 11], ink);
  thick(p, [10, 3], o.back, ink);
  thick(p, [10, 3], o.front, ink);
  thick(p, [10, 11], o.legBack, ink);
  thick(p, [10, 11], o.legFront, ink);
  const lift = o.lift ?? 0;
  const red = pal.c('red', 2);
  p.rect(5, 1 - lift, 6, 2, red)
    .rect(2, 2 - lift * 2, 4, 2, red)
    .set(1, 3 - lift * 2, red);
  return p;
}

const stand = (): Pose => ({ back: [4, 11], front: [16, 11], legBack: [6, 19], legFront: [14, 19] });

/** A pair outlined together with a pale halo, so the halo passes across the neck: [top block, bottom block]. */
function halo(pal: Pal, top: Pixels, bottom: Pixels): readonly [Pixels, Pixels] {
  const whole = new Pixels(20, 40, T);
  whole.blit(top, 0, 0, T).blit(bottom, 0, 20, T);
  const out = outline(whole, pal.c('white', 3), { transparent: T });
  return [out.crop(0, 0, 20, 20), out.crop(0, 20, 20, 20)] as const;
}

/** The hero's character blocks (.CBL), under the same names as the kit's hero. */
export function buildStickBlocks(pal: Pal): Book {
  const book = new Book('cbl');
  const add = (topName: string, bottomName: string, top: Pixels, bottom: Pixels) => {
    const [t, b] = halo(pal, top, bottom);
    if (!book.has(topName)) book.add(topName, t);
    if (!book.has(bottomName)) book.add(bottomName, b);
  };
  const walk: Pose[] = [
    { ...stand(), back: [5, 10], front: [15, 12], legBack: [3, 19], legFront: [16, 19] },
    { ...stand(), back: [7, 12], front: [13, 11], legBack: [7, 19], legFront: [12, 19] },
    { ...stand(), back: [15, 12], front: [5, 10], legBack: [16, 19], legFront: [3, 19] },
    { ...stand(), back: [13, 11], front: [7, 12], legBack: [12, 19], legFront: [7, 19] },
  ];
  add('stand.top', 'stand', head(pal, 'smile'), body(pal, stand()));
  add('blink.top', 'stand', head(pal, 'blink'), body(pal, stand()));
  add('hurt.top', 'hurt', head(pal, 'ouch'), body(pal, { back: [3, 0], front: [17, 0], legBack: [4, 19], legFront: [16, 19], lift: 1 }));
  add('cheer.top', 'jump', head(pal, 'cheer'), body(pal, { back: [3, 1], front: [17, 1], legBack: [6, 15], legFront: [14, 15], lift: 1 }));
  walk.forEach((w, i) => add('stand.top', `walk${i}`, head(pal, 'smile'), body(pal, w)));
  add('up.top', 'jumpup', head(pal, 'smile'), body(pal, { back: [5, 0], front: [15, 0], legBack: [7, 16], legFront: [13, 16], lift: 1 }));
  add('oh.top', 'fall', head(pal, 'oh'), body(pal, { back: [2, 5], front: [18, 5], legBack: [5, 19], legFront: [15, 19], lift: 2 }));
  add('cheer2.top', 'cheer', head(pal, 'cheer'), body(pal, { back: [4, 0], front: [16, 0], legBack: [6, 19], legFront: [14, 19], lift: 1 }));
  add('look.top', 'stand', head(pal, 'smile', -1), body(pal, stand()));
  // digging (unused here, kept so the file keeps every sequence the kit's does)
  add('stand.top', 'dig0', head(pal, 'smile'), body(pal, { back: [6, 12], front: [14, 14], legBack: [6, 19], legFront: [14, 19] }));
  add('stand.top', 'dig1', head(pal, 'smile'), body(pal, { back: [6, 14], front: [14, 12], legBack: [6, 19], legFront: [14, 19] }));
  // the throw: arm back over the shoulder, arm flung out, arm following through
  add('stand.top', 'throw0', head(pal, 'smile'), body(pal, { back: [3, 11], front: [14, 0], legBack: [5, 19], legFront: [13, 19] }));
  add('cheer.top', 'throw1', head(pal, 'cheer'), body(pal, { back: [3, 11], front: [19, 4], legBack: [4, 19], legFront: [14, 19], lift: 1 }));
  add('stand.top', 'throw2', head(pal, 'smile'), body(pal, { back: [4, 12], front: [18, 10], legBack: [5, 19], legFront: [13, 19] }));
  // ladders are not in this game; the poses stay so the kit's character file is whole
  add('back.top', 'climb0', head(pal, 'back'), body(pal, { back: [5, 0], front: [15, 4], legBack: [6, 17], legFront: [14, 19] }));
  add('back.top', 'climb1', head(pal, 'back'), body(pal, { back: [5, 4], front: [15, 0], legBack: [6, 19], legFront: [14, 17] }));
  return book;
}
