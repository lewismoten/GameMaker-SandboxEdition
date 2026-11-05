// The Starters' hero: a small, cheerful kid in a teal knit beanie with a pom-pom, an orange hoodie, gray pants and white sneakers, two blocks
// tall (a head block over a body block, as Game-Maker characters are). Drawn facing right;
// the character file mirrors the pictures for walking left. The pictures are the .CBL
// (character blocks): in the editor's Character tab each frame of a sequence picks two.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Book } from './book';
import { kitRamp } from './heroLook';
import type { Pal } from './palette';

const T = 255;

type Face = 'smile' | 'blink' | 'ouch' | 'cheer' | 'oh' | 'back';

/** One row of a shape, from x0 to x1. */
const span = (p: Pixels, y: number, x0: number, x1: number, c: number) => p.rect(x0, y, x1 - x0 + 1, 1, c);

/** The hero's head and beanie, 20x20, in side-on three-quarter view (`front` looks at you, or away from you). */
function head(pal: Pal, face: Face, front = false, look = 0, raised: 'left' | 'right' | 'both' | '' = ''): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const skin = kitRamp(pal, 'skin');
  const hat = kitRamp(pal, 'hat');
  const white = r('white');
  const hair = kitRamp(pal, 'hair');
  const hood = kitRamp(pal, 'hood');
  // the hood hangs behind the neck, so the head sits in front of it
  if (front) p.rect(3, 16, 14, 4, hood[2]).rect(3, 16, 14, 1, hood[4]);
  else p.rect(3, 18, 11, 2, hood[1]).rect(4, 18, 9, 1, hood[2]);
  // hair behind and at the sides, then the round face a little forward of it
  blob(p, front ? 10 : 6, 12, front ? 8.2 : 5, 6, hair, 0, 2);
  blob(p, front ? 10 : 11, 12, front ? 8.2 : 7.4, 7.6, skin, 0, 3);
  // seen from behind (climbing): hair all down the back of the head, and no face
  if (face === 'back') blob(p, 10, 13, 8.2, 7.2, hair, 0, 2);
  // the beanie: a knit cap that tapers to a slouchy top, a ribbed cuff folded up around it, and a fuzzy pom-pom on top
  const lean = front ? 0 : 2;
  const rows: [number, number, number][] = [
    [8, 2, 18],
    [7, 2, 17],
    [6, 3, 17],
    [5, 4 - lean / 2, 15],
    [4, 5 - lean, 13],
  ];
  for (const [y, x0, x1] of rows) {
    span(p, y, x0, x1, hat[3]);
    span(p, y, x0, x0 + 1, hat[4]);
    span(p, y, x1 - 1, x1, hat[2]);
  }
  // knit: slanted stitches down the cap
  for (let y = 3; y <= 7; y++) for (let x = 5 + (y % 3); x < 16; x += 3) if (p.get(x, y) === hat[3]) p.set(x, y, hat[2]);
  // the cuff: a thick fold with vertical ribs, flush with the head (no brim)
  p.rect(2, 8, 17, 3, hat[3]).rect(2, 8, 17, 1, hat[4]).rect(2, 10, 17, 1, hat[1]);
  for (let x = 3; x < 19; x += 2) p.rect(x, 9, 1, 2, hat[2]);
  // a little fringe of hair under the cuff, and hair at the back
  if (face !== 'back') {
    for (const x of front ? [5, 7, 9, 11, 13] : [10, 12, 14]) p.rect(x, 11, 2, 1, hair[2]).set(x, 12, hair[1]);
    p.rect(2, 11, 3, 4, hair[2]).rect(2, 11, 1, 4, hair[1]);
  }
  // the pom-pom: a fuzzy ball of yarn sitting on the very top, not a badge
  const px = front ? 10 : 8 - lean;
  p.disc(px, 3, 2.7, white[3])
    .set(px - 3, 3, white[3])
    .set(px + 3, 3, white[3])
    .set(px, 0, white[3])
    .set(px - 2, 1, white[3])
    .set(px + 2, 1, white[3]);
  for (const [dx, dy] of [
    [-1, 2],
    [1, 1],
    [0, 4],
    [2, 3],
  ] as [number, number][])
    p.set(px + dx, dy, white[2]);
  p.rect(px - 2, 5, 5, 1, white[1]).set(px + 2, 4, white[1]);
  if (face === 'back') {
    p.set(2, 13, skin[2]).set(17, 13, skin[2]);
    return p;
  }
  // arms raised beside the head (body() carries them up from the shoulders): sleeve and fist at the block's edge
  const orange = hood;
  const skinHand = (x: number) => p.disc(x, 13, 1.9, skin[2]).set(x - 1, 12, skin[3]);
  if (raised === 'left' || raised === 'both') {
    p.rect(0, 15, 3, 5, orange[2]).rect(0, 15, 1, 5, orange[4]);
    skinHand(1);
  }
  if (raised === 'right' || raised === 'both') {
    p.rect(17, 15, 3, 5, orange[2]).rect(19, 15, 1, 5, orange[1]);
    skinHand(18);
  }
  // eyes
  const ink = c('ink', 0);
  const eyes: [number, number][] = front
    ? [
        [7, 12 + look],
        [13, 12 + look],
      ]
    : [
        [9, 12 + look],
        [15, 12 + look],
      ];
  for (const [x, y] of eyes) {
    if (face === 'oh') p.rect(x, y - 2, 2, 4, ink).set(x + 1, y - 2, c('white', 3));
    else if (face === 'blink') p.rect(x - 1, y + 1, 3, 1, ink);
    else if (face === 'ouch') p.line(x - 1, y, x + 1, y + 2, ink).line(x - 1, y + 2, x + 1, y, ink);
    else {
      p.rect(x, y - 1, 2, 3, ink);
      p.set(x + 1, y - 1, c('white', 3));
    }
  }
  // cheeks and mouth
  const mx = front ? 10 : 12;
  p.set(mx - 4, 15, c('pink', 2)).set(mx + 4, 15, c('pink', 2));
  if (face === 'oh') {
    p.rect(mx, 16, 3, 3, ink).rect(mx + 1, 17, 1, 1, c('red', 2));
  } else if (face === 'cheer' || face === 'ouch') {
    p.rect(mx - 1, 16, 4, 2, ink).rect(mx, 17, 2, 1, c('red', 2));
  } else {
    p.set(mx - 1, 16, ink)
      .set(mx, 17, ink)
      .set(mx + 1, 17, ink)
      .set(mx + 2, 16, ink);
  }
  return p;
}

type Legs = { back: [number, number]; front: [number, number] };

/** The hero's body, 20x20, in the pose given; hands in `arms`, legs in `legs`. */
function body(
  pal: Pal,
  o: {
    arms: 'down' | 'swingA' | 'swingB' | 'out' | 'upA' | 'upB' | 'rest' | 'high' | 'flail' | 'dig0' | 'dig1' | 'windup' | 'release' | 'follow';
    legs: Legs | 'tuck' | 'dangle' | 'climbA' | 'climbB';
    front?: boolean;
    back?: boolean;
  },
): Pixels {
  const { r } = pal;
  const p = new Pixels(20, 20, T);
  const shirt = kitRamp(pal, 'hood');
  const gray = kitRamp(pal, 'pants');
  const white = r('white');
  const skin = kitRamp(pal, 'skin');
  const front = !!o.front;
  const x0 = front ? 4 : 5;
  const w = front ? 12 : 10;
  const sneaker = (x: number, y: number, w2: number) => {
    p.rect(x, y, w2, 3, white[3])
      .rect(x, y, w2, 1, white[3])
      .rect(x, y + 2, w2, 1, white[1]);
    p.set(x + w2 - 2, y + 1, kitRamp(pal, 'hat')[3]).set(x + 1, y, white[2]);
  };
  const leg = (x: number, lift: number, color: number[]) => {
    p.rect(x, 12 - 0, 4, 4 - lift, color[2]).rect(x, 12, 1, 4 - lift, color[3]);
    const by = 16 - lift;
    sneaker(x - 1, by, 6);
  };
  // legs first, behind the body
  if (o.legs === 'tuck') {
    p.rect(5, 12, 4, 3, gray[2]);
    sneaker(5, 14, 5);
    p.rect(11, 12, 4, 3, gray[3]);
    sneaker(11, 14, 6);
  } else if (o.legs === 'dangle') {
    // falling: legs hang straight down, a little apart, feet pointing down
    p.rect(6, 12, 4, 4, gray[2]).rect(11, 12, 4, 4, gray[3]);
    sneaker(5, 16, 6);
    sneaker(11, 16, 6);
  } else if (o.legs === 'climbA' || o.legs === 'climbB') {
    const up = o.legs === 'climbA';
    p.rect(5, up ? 11 : 12, 4, up ? 3 : 4, gray[2]);
    sneaker(4, up ? 13 : 16, 6);
    p.rect(11, up ? 12 : 11, 4, up ? 4 : 3, gray[3]);
    sneaker(10, up ? 16 : 13, 6);
  } else {
    leg(o.legs.back[0], o.legs.back[1], gray);
    leg(o.legs.front[0], o.legs.front[1], gray);
  }
  // the body: an orange hoodie with a ribbed hem; the front shows a kangaroo pocket and two
  // drawstrings, the back shows the hood
  p.rect(x0, 0, w, 14, shirt[3])
    .rect(x0, 0, 1, 14, shirt[4])
    .rect(x0 + w - 1, 0, 1, 14, shirt[2]);
  p.rect(x0, 12, w, 2, shirt[2]).rect(x0, 12, w, 1, shirt[1]);
  if (o.back) {
    p.rect(x0 + 1, 0, w - 2, 3, shirt[4]).rect(x0 + 2, 3, w - 4, 1, shirt[2]);
    p.rect(x0 + 3, 5, w - 6, 1, shirt[2]);
  } else {
    // the hood as a darker collar band hugging the neck and shoulders, and two thin drawstrings with small tips
    p.rect(x0, 0, w, 3, shirt[1])
      .rect(x0 + 1, 0, w - 2, 1, shirt[2])
      .rect(x0 + 1, 2, w - 2, 1, shirt[0]);
    p.rect(x0 + 2, 6, w - 3, 5, shirt[2]).rect(x0 + 2, 6, w - 3, 1, shirt[1]);
    p.rect(x0 + 2, 6, 1, 5, shirt[1]);
    for (const sx of [x0 + 4, x0 + 6]) p.rect(sx, 3, 1, 3, white[3]).set(sx, 6, white[1]);
  }
  // arms
  const sleeve = (x: number, y: number, w2: number, h: number) => p.rect(x, y, w2, h, shirt[2]).rect(x, y, 1, h, shirt[4]);
  const hand = (x: number, y: number) => p.disc(x, y, 1.9, skin[2]).set(x - 1, y - 1, skin[3]);
  switch (o.arms) {
    case 'down':
      sleeve(x0 + w - 3, 1, 3, 5);
      hand(x0 + w - 1.5, 8);
      break;
    case 'swingA':
      sleeve(x0 + w - 3, 1, 3, 5);
      hand(x0 + w, 8);
      sleeve(x0 - 1, 1, 3, 4);
      hand(x0 - 2, 6);
      break;
    case 'swingB':
      sleeve(x0 + w - 4, 1, 3, 4);
      hand(x0 + w - 2, 7);
      sleeve(x0, 1, 3, 5);
      hand(x0 + 1, 8);
      break;
    case 'out':
      p.line(x0, 2, x0 - 3, 6, shirt[2])
        .line(x0, 3, x0 - 3, 7, shirt[2])
        .line(x0 + w - 1, 2, x0 + w + 2, 6, shirt[2])
        .line(x0 + w - 1, 3, x0 + w + 2, 7, shirt[2]);
      hand(x0 - 3, 7);
      hand(x0 + w + 2, 7);
      break;
    case 'upA':
    case 'upB': {
      // hands up the ladder: one high, one lower
      const hi = o.arms === 'upA' ? [x0 - 2, x0 + w + 1] : [x0 + w + 1, x0 - 2];
      p.line(x0, 2, hi[0], -2, shirt[2]).line(x0 + 1, 2, hi[0] + 1, -2, shirt[2]);
      hand(hi[0], -1);
      p.line(x0 + w - 1, 3, hi[1], 7, shirt[2]).line(x0 + w - 2, 3, hi[1] - 1, 7, shirt[2]);
      hand(hi[1], 8);
      break;
    }
    case 'high':
      // both arms up in a V: hands at the top corners of the block
      p.line(x0, 2, x0 - 3, 0, shirt[2])
        .line(x0, 3, x0 - 3, 1, shirt[2])
        .line(x0 + w - 1, 2, x0 + w + 2, 0, shirt[2])
        .line(x0 + w - 1, 3, x0 + w + 2, 1, shirt[2]);
      hand(x0 - 3, 1);
      hand(x0 + w + 2, 1);
      break;
    case 'flail':
      // one arm up and out, one out and down
      p.line(x0, 2, 1, 0, shirt[2]).line(x0, 3, 2, 0, shirt[2]);
      p.line(x0 + w - 1, 3, x0 + w + 2, 7, shirt[2]).line(x0 + w - 1, 4, x0 + w + 2, 8, shirt[2]);
      hand(x0 + w + 2, 8);
      break;
    case 'dig0':
    case 'dig1': {
      // a small garden shovel held in both hands out in front and angled down to the ground:
      // lifted (dig0), then the blade in the dirt with clods flying (dig1)
      const down = o.arms === 'dig1';
      const wood = r('wood');
      const steel = r('stone');
      const dirt = r('dirt');
      const topX = 14;
      const topY = 6;
      const tipX = down ? 18 : 17;
      const tipY = down ? 15 : 13;
      sleeve(x0 + w - 3, 1, 3, 4);
      p.line(topX, topY, tipX, tipY, wood[2]).line(topX + 1, topY, tipX + 1, tipY, wood[3]);
      p.rect(tipX - 1, tipY + 1, 4, 3, steel[3])
        .rect(tipX - 1, tipY + 1, 4, 1, steel[4])
        .rect(tipX + 2, tipY + 1, 1, 3, steel[1]);
      hand(topX, topY);
      hand(topX - 2, topY - 1);
      if (down) {
        p.rect(13, 18, 7, 2, dirt[2]).rect(14, 17, 4, 1, dirt[3]);
        p.set(19, 12, dirt[3]).set(18, 10, dirt[2]).set(17, 11, dirt[1]);
      }
      break;
    }
    case 'windup':
    case 'release':
    case 'follow': {
      // an overhand toss of a small star: arm back with the star, arm forward just as it leaves,
      // then the arm swinging down
      const gold = r('gold');
      const starAt = (x: number, y: number) => {
        p.set(x, y - 1, gold[4])
          .set(x - 1, y, gold[4])
          .set(x + 1, y, gold[4])
          .set(x, y + 1, gold[4])
          .set(x, y, white[3]);
      };
      sleeve(x0 + w - 3, 1, 3, 4);
      hand(x0 + w - 1.5, 7);
      if (o.arms === 'windup') {
        p.line(x0, 2, x0 - 3, 1, shirt[2]).line(x0, 3, x0 - 3, 2, shirt[2]);
        hand(x0 - 3, 2);
        starAt(x0 - 4, 1);
      } else if (o.arms === 'release') {
        p.line(x0 + w - 1, 2, x0 + w + 2, 3, shirt[2]).line(x0 + w - 1, 3, x0 + w + 2, 4, shirt[2]);
        hand(x0 + w + 2, 4);
        starAt(x0 + w + 4, 2);
      } else {
        p.line(x0 + w - 1, 3, x0 + w + 1, 8, shirt[2]).line(x0 + w - 1, 4, x0 + w + 1, 9, shirt[2]);
        hand(x0 + w + 1, 9);
      }
      break;
    }
    case 'rest':
      sleeve(x0 + w - 3, 1, 3, 5);
      hand(x0 + w - 1.5, 8);
      break;
  }
  return p;
}

/** The hero's character blocks (.CBL), by name, with the outlines drawn on. */
export function buildHeroBlocks(pal: Pal): Book {
  const ink = pal.c('ink', 0);
  const book = new Book('cbl');
  // (head, body) pairs are outlined together, so the outline passes across the neck
  const pair = (top: Pixels, bottom: Pixels) => {
    const whole = new Pixels(20, 40, T);
    whole.blit(top, 0, 0, T).blit(bottom, 0, 20, T);
    const out = outline(whole, ink, { transparent: T });
    return [out.crop(0, 0, 20, 20), out.crop(0, 20, 20, 20)] as const;
  };
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

/** A pose as one 20x40 picture, for screens and previews. */
export function heroPicture(book: Book, top: string, bottom: string): Pixels {
  const p = new Pixels(20, 40, T);
  p.px.set(book.pics.get(top)!.px, 0);
  p.px.set(book.pics.get(bottom)!.px, 400);
  return p;
}
