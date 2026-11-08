// Rascal the raccoon, cut in the game's woodcut (print.ts): smoke-gray fur, the ink mask, a paper muzzle, a ringed
// tail and a coil of gold rope over one shoulder. He is the hero of the morning level (his own character blocks,
// rascal.cbl, under the Starters' pose names so kit/starter/heroChar.ts moves him) and stands on his roof at the end.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Book } from '../../kit/starter/book';
import { oval, pair, type Arms, type Legs } from './cat';
import { T, type Pal } from './print';

type Face = 'grin' | 'blink' | 'ouch' | 'cheer' | 'oh' | 'back' | 'shifty';

/** Rascal's head: round ears, the mask, a paper muzzle and a grin. */
export function rascalHead(pal: Pal, face: Face): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const fur = c('smoke', 1);
  const ink = c('ink', 0);
  const back = face === 'back';
  // three-quarter view facing right (the far ear smaller, the snout forward), except from behind
  oval(p, back ? 4.5 : 5.5, back ? 6 : 7, back ? 2.8 : 2.2, back ? 3 : 2.4, fur);
  oval(p, 15.5, 6, 2.8, 3, fur);
  p.set(back ? 4 : 5, back ? 6 : 7, ink).set(15, 6, ink);
  oval(p, 10, 12, 7.6, 6, fur);
  if (back) {
    p.rect(6, 9, 8, 1, c('smoke', 2)).rect(7, 13, 6, 1, c('smoke', 0));
    return p;
  }
  // the mask: an ink band across the eyes, paper brows over it
  p.rect(5, 9, 5, 1, c('paper', 4)).rect(12, 9, 6, 1, c('paper', 4));
  oval(p, 7.5, 12, 3, 2.2, ink);
  oval(p, 15, 12, 3.6, 2.2, ink);
  p.rect(9, 11, 4, 2, ink);
  const eye = (x: number) => {
    if (face === 'blink' || face === 'cheer') p.rect(x, 12, 2, 1, c('paper', 4));
    else if (face === 'shifty') p.rect(x, 12, 2, 1, c('gold', 3)).set(x, 12, c('paper', 4));
    else p.rect(x, 11, 2, 2, c('paper', 4)).set(x + 1, 12, c('gold', 3));
  };
  eye(7);
  eye(14);
  // muzzle and nose, pushed forward
  oval(p, 13.5, 16, 4.6, 2.8, c('paper', 4));
  p.rect(16, 14, 3, 2, ink);
  if (face === 'oh' || face === 'ouch') p.rect(14, 17, 3, 2, ink);
  else p.line(11, 16, 13, 18, ink).line(13, 18, 17, 17, ink);
  return p;
}

/** Rascal's body: smoke fur, a paper belly, the rope coil, a ringed tail, small dark paws. */
export function rascalBody(pal: Pal, o: { arms: Arms; legs: Legs | 'tuck' | 'dangle' | 'climbA' | 'climbB'; climbing?: boolean }): Pixels {
  const { c } = pal;
  const p = new Pixels(20, 20, T);
  const fur = c('smoke', 1);
  const ink = c('ink', 0);
  const climbing = !!o.climbing;
  // the ringed tail, thick and low behind him
  const lift = o.legs === 'tuck' || o.legs === 'dangle' ? 2 : 0;
  for (let i = 0; i < 9; i++) {
    const x = climbing ? 13 + Math.round(i * 0.3) : Math.max(0, 3 - Math.round(i * 0.4));
    p.rect(x, 15 - i + lift, 4, 2, i % 3 === 2 ? ink : fur);
  }
  oval(p, 10, 8.5, 5.4, 7, fur);
  if (!climbing) {
    oval(p, 11, 9, 2.8, 5, c('paper', 3));
    // the coil of rope over his shoulder
    p.line(6, 0, 13, 9, c('gold', 3)).line(7, 0, 14, 9, c('gold', 1));
    p.ring(13, 10, 2, c('gold', 3));
  } else {
    p.rect(7, 2, 6, 1, c('smoke', 0));
  }
  const arm = (x: number, y: number, dx: number, dy: number) => {
    p.line(x, y, x + dx, y + dy, fur).line(x + 1, y, x + 1 + dx, y + dy, fur);
    p.rect(x + dx, y + dy, 2, 2, ink);
  };
  switch (o.arms) {
    case 'down':
      arm(6, 5, -1, 5);
      arm(13, 5, 1, 5);
      break;
    case 'out':
      arm(5, 4, -4, 2);
      arm(14, 4, 4, 2);
      break;
    case 'high':
      arm(6, 5, -3, -5);
      arm(13, 5, 2, -5);
      break;
    case 'swingA':
      arm(6, 5, -3, 4);
      arm(13, 5, 3, 4);
      break;
    case 'swingB':
      arm(6, 5, 2, 4);
      arm(13, 5, -2, 4);
      break;
    case 'flail':
      arm(5, 3, -4, -3);
      arm(14, 3, 3, -4);
      break;
    case 'upA':
      arm(6, 4, 0, -5);
      arm(12, 5, 2, -3);
      break;
    case 'upB':
      arm(6, 5, -1, -3);
      arm(12, 4, 1, -5);
      break;
  }
  const foot = (x: number, up: number) => {
    p.rect(x, 13, 4, 7 - up, fur);
    p.rect(x, 18 - up, 4, 2, ink);
  };
  const legs = o.legs;
  if (legs === 'tuck') {
    foot(5, 4);
    foot(11, 4);
  } else if (legs === 'dangle') {
    foot(4, 2);
    foot(12, 1);
  } else if (legs === 'climbA') {
    foot(5, 0);
    foot(11, 4);
  } else if (legs === 'climbB') {
    foot(5, 4);
    foot(11, 0);
  } else {
    foot(legs.back[0], legs.back[1]);
    foot(legs.front[0], legs.front[1]);
  }
  return p;
}

/** Rascal standing, as a top and bottom sprite (no cut line), for his roof and the pictures. */
export function rascalStanding(pal: Pal, face: Face = 'shifty'): { top: Pixels; bottom: Pixels } {
  return { top: rascalHead(pal, face), bottom: rascalBody(pal, { arms: 'down', legs: { back: [5, 0], front: [11, 0] } }) };
}

/** Rascal standing as one cut 20x40 sprite (facing right). */
export function rascalSprite(pal: Pal, face: Face = 'shifty'): Pixels {
  const r = rascalStanding(pal, face);
  const [t, b] = pair(pal, r.top, r.bottom);
  return new Pixels(20, 40, T).blit(t, 0, 0, T).blit(b, 0, 20, T);
}

/** Rascal's character blocks (.CBL) by the Starters' pose names. */
export function buildRascalBlocks(pal: Pal): Book {
  const book = new Book('cbl');
  const add = (topName: string, bottomName: string, top: Pixels, bottom: Pixels) => {
    const [t, b] = pair(pal, top, bottom);
    if (!book.has(topName)) book.add(topName, t);
    if (!book.has(bottomName)) book.add(bottomName, b);
  };
  const stand = rascalBody(pal, { arms: 'down', legs: { back: [5, 0], front: [11, 0] } });
  add('stand.top', 'stand', rascalHead(pal, 'grin'), stand);
  add('blink.top', 'stand', rascalHead(pal, 'blink'), stand);
  add('hurt.top', 'hurt', rascalHead(pal, 'ouch'), rascalBody(pal, { arms: 'out', legs: { back: [4, 0], front: [12, 0] } }));
  add('cheer.top', 'jump', rascalHead(pal, 'cheer'), rascalBody(pal, { arms: 'out', legs: 'tuck' }));
  const walk: Legs[] = [
    { back: [3, 0], front: [12, 0] },
    { back: [7, 2], front: [9, 0] },
    { back: [12, 0], front: [3, 0] },
    { back: [9, 0], front: [7, 2] },
  ];
  walk.forEach((legs, i) => add('stand.top', `walk${i}`, rascalHead(pal, 'grin'), rascalBody(pal, { arms: i % 2 ? 'swingB' : 'swingA', legs })));
  add('up.top', 'jumpup', rascalHead(pal, 'grin'), rascalBody(pal, { arms: 'high', legs: 'tuck' }));
  add('oh.top', 'fall', rascalHead(pal, 'oh'), rascalBody(pal, { arms: 'flail', legs: 'dangle' }));
  add('cheer2.top', 'cheer', rascalHead(pal, 'cheer'), rascalBody(pal, { arms: 'high', legs: { back: [5, 0], front: [11, 0] } }));
  add('look.top', 'stand', rascalHead(pal, 'shifty'), stand);
  const dig = { back: [3, 0], front: [10, 0] } as Legs;
  add('stand.top', 'dig0', rascalHead(pal, 'grin'), rascalBody(pal, { arms: 'swingA', legs: dig }));
  add('stand.top', 'dig1', rascalHead(pal, 'grin'), rascalBody(pal, { arms: 'swingB', legs: dig }));
  add('stand.top', 'throw0', rascalHead(pal, 'grin'), rascalBody(pal, { arms: 'out', legs: { back: [5, 0], front: [11, 0] } }));
  add('cheer.top', 'throw1', rascalHead(pal, 'cheer'), rascalBody(pal, { arms: 'high', legs: { back: [4, 0], front: [11, 0] } }));
  add('stand.top', 'throw2', rascalHead(pal, 'grin'), rascalBody(pal, { arms: 'swingA', legs: { back: [5, 0], front: [11, 0] } }));
  add('back.top', 'climb0', rascalHead(pal, 'back'), rascalBody(pal, { arms: 'upA', legs: 'climbA', climbing: true }));
  add('back.top', 'climb1', rascalHead(pal, 'back'), rascalBody(pal, { arms: 'upB', legs: 'climbB', climbing: true }));
  return book;
}
