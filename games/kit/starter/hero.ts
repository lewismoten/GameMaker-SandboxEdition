// The Starters' hero: a small, cheerful explorer in a red cap and blue overalls, two blocks
// tall (a head block over a body block, as Game-Maker characters are). Drawn facing right;
// the character file mirrors the pictures for walking left. The pictures are the .CBL
// (character blocks): in the editor's Character tab each frame of a sequence picks two.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { blob } from '@lewismoten/gamemaker-sandbox-tools/kit/shading';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { Book } from './book';
import type { Pal } from './palette';

const T = 255;

type Face = 'smile' | 'blink' | 'ouch' | 'cheer';

/** The hero's head and cap, 20x20, in side-on three-quarter view (`front` looks at you). */
function head(pal: Pal, face: Face, front = false, look = 0): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const skin = r('skin');
  const red = r('red');
  const hair = r('hair');
  // hair behind, then the round face
  blob(p, front ? 10 : 7, 11, 4, 4, hair, 0, 2);
  blob(p, 10, 12, 8.6, 8, skin, 0, 3);
  // the cap: a dome over the top of the head, and its brim
  const dome = new Pixels(20, 20, T);
  blob(dome, 10, 8, 9.4, 6.4, red, 0, 4);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 20; x++) if (dome.get(x, y) !== T) p.set(x, y, dome.get(x, y));
  if (front) p.rect(3, 9, 14, 2, red[1]).rect(3, 9, 14, 1, red[3]);
  else p.rect(8, 9, 11, 2, red[1]).rect(9, 9, 10, 1, red[3]).set(19, 9, red[1]);
  p.disc(10, 4.5, 1.5, c('gold', 4)).set(9, 4, c('gold', 5));
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
    if (face === 'blink') p.rect(x - 1, y + 1, 3, 1, ink);
    else if (face === 'ouch') p.line(x - 1, y, x + 1, y + 2, ink).line(x - 1, y + 2, x + 1, y, ink);
    else {
      p.rect(x, y - 1, 2, 3, ink);
      p.set(x + 1, y - 1, c('white', 3));
    }
  }
  // cheeks and mouth
  const mx = front ? 10 : 12;
  p.set(mx - 4, 15, c('pink', 2)).set(mx + 4, 15, c('pink', 2));
  if (face === 'cheer' || face === 'ouch') {
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
  o: { arms: 'down' | 'swingA' | 'swingB' | 'out' | 'upA' | 'upB' | 'rest'; legs: Legs | 'tuck' | 'climbA' | 'climbB'; front?: boolean },
): Pixels {
  const { c, r } = pal;
  const p = new Pixels(20, 20, T);
  const shirt = r('orange');
  const blue = r('blue');
  const skin = r('skin');
  const front = !!o.front;
  const x0 = front ? 4 : 5;
  const w = front ? 12 : 10;
  const leg = (x: number, lift: number, color: number[]) => {
    p.rect(x, 12 - 0, 4, 4 - lift, color[2]).rect(x, 12, 1, 4 - lift, color[3]);
    const by = 16 - lift;
    p.rect(x - 1, by, 6, 3, c('red', 1))
      .rect(x - 1, by, 6, 1, c('red', 3))
      .rect(x + 4, by + 1, 1, 2, c('red', 2));
  };
  // legs first, behind the body
  if (o.legs === 'tuck') {
    p.rect(5, 12, 4, 3, blue[2]).rect(5, 14, 5, 3, c('red', 1)).rect(5, 14, 5, 1, c('red', 3));
    p.rect(11, 12, 4, 3, blue[3]).rect(11, 14, 6, 3, c('red', 1)).rect(11, 14, 6, 1, c('red', 3));
  } else if (o.legs === 'climbA' || o.legs === 'climbB') {
    const up = o.legs === 'climbA';
    p.rect(5, up ? 11 : 12, 4, up ? 3 : 4, blue[2])
      .rect(4, up ? 13 : 16, 6, 3, c('red', 1))
      .rect(4, up ? 13 : 16, 6, 1, c('red', 3));
    p.rect(11, up ? 12 : 11, 4, up ? 4 : 3, blue[3])
      .rect(10, up ? 16 : 13, 6, 3, c('red', 1))
      .rect(10, up ? 16 : 13, 6, 1, c('red', 3));
  } else {
    leg(o.legs.back[0], o.legs.back[1], blue);
    leg(o.legs.front[0], o.legs.front[1], blue);
  }
  // the body: yellow-orange shirt, blue overalls with a bib and two gold buttons
  p.rect(x0, 0, w, 14, blue[2]);
  p.rect(x0, 0, w, 5, shirt[3]).rect(x0, 0, w, 1, shirt[4]);
  p.rect(x0 + 1, 3, w - 2, 11, blue[2]).rect(x0 + 1, 3, 1, 11, blue[3]);
  p.rect(x0 + 2, 3, w - 4, 3, blue[3]);
  p.rect(x0 + w - 1, 3, 1, 11, blue[1]).rect(x0, 13, w, 1, blue[1]);
  p.rect(x0 + 2, 0, 2, 4, blue[3]).rect(x0 + w - 4, 0, 2, 4, blue[3]);
  p.set(x0 + 2, 4, c('gold', 4)).set(x0 + w - 3, 4, c('gold', 4));
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
  add('front.top', 'climb0', head(pal, 'smile', true, 0), body(pal, { arms: 'upA', legs: 'climbA', front: true }));
  add('look.top', 'climb1', head(pal, 'smile', true, -1), body(pal, { arms: 'upB', legs: 'climbB', front: true }));
  return book;
}

/** A pose as one 20x40 picture, for screens and previews. */
export function heroPicture(book: Book, top: string, bottom: string): Pixels {
  const p = new Pixels(20, 40, T);
  p.px.set(book.pics.get(top)!.px, 0);
  p.px.set(book.pics.get(bottom)!.px, 400);
  return p;
}
