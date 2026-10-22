// The cartoons (FLIs) that tell the story as a slide show, before the title poster and the
// story pages: Doc Leo at home practicing his clown act (balloon animals, a magic trick, a
// parade strut), then off to the Klown Klub in his red CitiCar; then intro.fli (Gwinn and
// the suitcase). And at the end, the Klown Klub parade with Teddy riding on top.
import { encodeFli } from '../../../../web/src/formats/fli';
import { Pixels } from '../../../kit/pixels';
import { CLEAR, blob, centered, klubArt, outlined, scaleBlit } from '../art/draw';
import { FX } from '../sprites/fx';
import { GWINN } from '../sprites/gwinn';
import { citiCar } from '../sprites/klown';
import { dove, marcher } from '../sprites/magic';
import { docLeo, FULL } from '../sprites/people';
import { SP, landscape } from './screens';
import { castFli } from './cast';
import { POSES } from '../sprites/teddy';

const c = (n: string, k: number) => SP.c(n, k);
const W = 320;
const H = 200;

/** The backyard at dawn with Teddy's doghouse, as in intro.fli. */
function backyard(): Pixels {
  const bg = landscape(2);
  for (let y = 0; y < 30; y++) bg.rect(54 - y, 110 + y, y * 2 + 8, 1, c('red', 1 + (y % 3 === 0 ? 0 : 1)));
  bg.rect(26, 140, 64, 34, c('wood', 2));
  blob(bg, 58, 160, 12, 14, [c('ink', 0)], 0, 0);
  bg.rect(46, 160, 24, 14, c('ink', 0));
  return bg;
}

class Reel {
  frames: Uint8Array[] = [];
  constructor(private bg: Pixels) {}
  /** A new frame over the background; `draw` adds the actors. */
  frame(draw: (p: Pixels) => void, hold = 1): void {
    const p = new Pixels(W, H);
    p.px.set(this.bg.px);
    draw(p);
    for (let i = 0; i < hold; i++) this.frames.push(Uint8Array.from(p.px));
  }
  fli(speed: number): Uint8Array {
    return encodeFli(this.frames, SP.pal, { speed });
  }
}

const caption = (p: Pixels, words: string, y = 10) => centered(p, y, klubArt(words), c('paint', 3), 1, c('ink', 0));

/** A long balloon being blown up and twisted into a dog: 0..1. */
function balloon(p: Pixels, x: number, y: number, t: number): void {
  if (t < 0.5) {
    const len = Math.round(4 + t * 2 * 40);
    for (let i = 0; i < len; i++) blob(p, x + i, y - i * 0.4, 3, 3, SP.r('pink'), 1, 3);
  } else scaleBlit(p, FX.poodle1, x - 4, y - 30, 2);
}

/** Clip 1: Doc Leo practices in the backyard: a balloon dog, a magic trick, a parade strut. */
export function leoFli(): Uint8Array {
  const r = new Reel(backyard());
  const leo = (p: Pixels, wave = false, x = 150, y = 92) => scaleBlit(p, docLeo(FULL, wave), x, y, 2);
  const teddy = (p: Pixels, pose: string) => scaleBlit(p, POSES[pose], 100, 134, 2);
  // the balloon dog
  for (let f = 0; f < 22; f++)
    r.frame((p) => {
      leo(p);
      teddy(p, f < 16 ? 'front' : 'frontBeg');
      balloon(p, 186, 128, f / 16);
      if (f >= 16) outlined(p, 222, 70, 'SQUEAK!', c('pink', 3), c('ink', 0), 1);
      caption(p, 'DOC LEO IS A HOBO CLOWN.');
      caption(p, 'HE TWISTS BALLOON ANIMALS...', 22);
    });
  // the magic trick: a tap of the wand on his hat, and doves fly out
  for (let f = 0; f < 22; f++)
    r.frame((p) => {
      leo(p, f > 4);
      teddy(p, f > 6 ? 'frontTilt' : 'front');
      if (f <= 6) p.line(186, 104, 172 + (f % 2) * 2, 92, c('ink', 0)).rect(171 + (f % 2) * 2, 90, 3, 3, c('paint', 3));
      if (f === 5 || f === 6) for (let k = 0; k < 8; k++) p.set(170 + Math.round(Math.cos(k) * 10), 90 + Math.round(Math.sin(k) * 8), c('yellow', 3));
      for (let d = 0; d < 3; d++) {
        const t = f - 6 - d * 4;
        if (t > 0) scaleBlit(p, dove(t % 2), 160 + t * 6 + d * 10, 86 - t * 6 + d * 4, 2);
      }
      caption(p, 'DOC LEO IS A HOBO CLOWN.');
      caption(p, '...DOES MAGIC TRICKS...', 22);
    });
  // the parade strut: marching on the spot, the rubber chicken squawking, Teddy marching along
  for (let f = 0; f < 18; f++)
    r.frame((p) => {
      leo(p, f % 4 < 2, 150, 92 - (f % 2) * 2);
      scaleBlit(p, POSES[f % 2 ? 'walk1' : 'walk2'], 100, 134 - (f % 2) * 2, 2);
      if (f % 4 < 2) outlined(p, 200, 76, 'BAWK!', c('yellow', 3), c('ink', 0), 1);
      caption(p, 'DOC LEO IS A HOBO CLOWN.');
      caption(p, '...AND MARCHES IN EVERY PARADE.', 22);
    });
  r.frame((p) => {
    leo(p, true);
    teddy(p, 'frontBeg');
    caption(p, "TONIGHT IS THE KLOWN KLUB'S");
    caption(p, 'BIG SHOW, AND HE IS THE STAR!', 22);
  }, 14);
  return r.fli(9);
}

/** Clip 2: Doc Leo goes ahead to the Klub in his CitiCar; his costume suitcase waits on the step. */
export function carFli(): Uint8Array {
  const bg = backyard();
  // the drive along the bottom, and the suitcase by the back step
  bg.rect(0, 176, W, 24, c('asphalt', 1));
  bg.rect(110, 160, 26, 18, c('wood', 1)).rect(110, 160, 26, 3, c('wood', 3)).rect(110, 168, 26, 2, c('gold', 1)).rect(119, 156, 8, 4, c('wood', 0));
  const r = new Reel(bg);
  const car = new Pixels(40, 40, CLEAR);
  citiCar(car, 0, 0);
  const head = docLeo({ hat: true, tie: true }).crop(0, 0, 20, 16);
  for (let f = 0; f < 34; f++) {
    const x = f < 12 ? 176 : 176 + (f - 12) * (f - 12);
    r.frame(
      (p) => {
        scaleBlit(p, car, x, 80, 3);
        scaleBlit(p, head, x + 34, 100 - (f > 12 ? f % 2 : 0), 2);
        scaleBlit(p, POSES[f < 12 ? 'front' : f < 20 ? 'frontTilt' : 'frontBark'], 60, 140, 2);
        if (f >= 12) for (let k = 0; k < 3; k++) p.rect(x - 10 - k * 9 - (f % 2) * 3, 150 + k * 6, 7 - k * 2, 1, c('paint', 3));
        if (f < 12) {
          caption(p, 'HE DRIVES AHEAD IN HIS RED');
          caption(p, '1976 CITICAR. "SEE YOU AT THE', 22);
          caption(p, 'BIG SHOW, TEDDY!"', 34);
        } else {
          caption(p, 'HIS COSTUME SUITCASE WAITS ON');
          caption(p, 'THE BACK STEP FOR LATER...', 22);
        }
        if (f >= 20 && f % 4 < 2) outlined(p, 100, 120, 'BYE!', c('yellow', 3), c('ink', 0), 1);
      },
      f < 12 ? 2 : f === 33 ? 8 : 1,
    );
  }
  return r.fli(9);
}

/** The finale: the Klown Klub parade down Main Street at night, Teddy riding on the CitiCar. */
export function paradeFli(): Uint8Array {
  const bg = new Pixels(W, H, c('ink', 0));
  for (let y = 0; y < 120; y++) for (let x = 0; x < W; x++) if ((x * 13 + y * 7) % 97 === 0) bg.set(x, y, c('glow', 3));
  for (let x = 0; x < W; x += 34) bg.rect(x, 60 + ((x / 34) % 3) * 8, 30, 120, c('siding', (x / 34) % 2));
  for (let x = 0; x < W; x += 34) for (let y = 70; y < 160; y += 14) bg.rect(x + 6, y + ((x / 34) % 3) * 8, 6, 6, c('glow', 2));
  for (let x = 0; x < W; x += 16) for (let k = 0; k < 6; k++) bg.rect(x + k, 40 + k, 15 - k * 2, 1, c(['red', 'yellow', 'blue', 'green'][(x / 16) % 4], 2));
  bg.rect(0, 160, W, 40, c('asphalt', 1));
  const r = new Reel(bg);
  const car = new Pixels(40, 40, CLEAR);
  citiCar(car, 0, 0);
  const head = docLeo(FULL).crop(0, 0, 20, 16);
  const confetti = (p: Pixels, f: number) => {
    for (let i = 0; i < 30; i++) {
      const x = (i * 53 + f * (3 + (i % 4))) % W;
      const y = (i * 31 + f * (4 + (i % 3))) % 160;
      p.rect(x, y, 2, 2, c(['red', 'yellow', 'blue', 'green', 'pink'][i % 5], 3));
    }
  };
  for (let f = 0; f < 60; f++)
    r.frame((p) => {
      confetti(p, f);
      const x0 = -260 + f * 7;
      (['drum', 'banner', 'balloons'] as const).forEach((kind, i) => scaleBlit(p, marcher(kind, (f + i) % 2), x0 + 240 + i * 46, 82 - ((f + i) % 2), 2));
      scaleBlit(p, car, x0 + 90, 72, 3);
      scaleBlit(p, head, x0 + 124, 92 - (f % 2), 2);
      scaleBlit(p, POSES[f % 6 < 3 ? 'frontBeg' : 'frontReach'], x0 + 100, 52 - (f % 2), 2);
      scaleBlit(p, GWINN[f % 2 ? 'gwinnRun1' : 'gwinnRun2'], x0 + 20, 150, 2);
      caption(p, f < 30 ? 'AND AFTER THE BIG SHOW...' : 'THE KLOWN KLUB PARADE!', 8);
      if (f >= 30) caption(p, 'TEDDY RIDES UP FRONT.', 20);
    });
  return r.fli(5);
}

/**
 * After Gwinn's night out: the Klown Klub's hay wagon rolls off into the night behind its
 * pickup, a brown head and a pink tongue poking up out of the hay.
 */
export function wagonFli(): Uint8Array {
  const bg = new Pixels(W, H, c('ink', 0));
  for (let y = 0; y < 150; y++) for (let x = 0; x < W; x++) if ((x * 17 + y * 11) % 89 === 0) bg.set(x, y, c('glow', 3));
  blob(bg, 260, 40, 18, 18, SP.r('glow'), 2, 3);
  for (let x = 0; x < W; x++) {
    const h = 130 + Math.sin(x / 40) * 6;
    for (let y = Math.floor(h); y < 160; y++) bg.set(x, y, c('grass', 0));
  }
  bg.rect(0, 160, W, 40, c('asphalt', 0));
  const r = new Reel(bg);
  for (let f = 0; f < 46; f++)
    r.frame((p) => {
      const x = 330 - f * 9;
      const bob = f % 2;
      // the pickup in front, the wagon behind it
      p.rect(x, 128 + bob, 70, 26, c('blue', 1)).rect(x + 6, 108 + bob, 34, 22, c('blue', 1)).rect(x + 10, 112 + bob, 22, 12, c('sky', 1));
      p.rect(x, 140, 4, 4, c('glow', 3));
      for (const wx of [x + 14, x + 56]) p.disc(wx, 158, 9, c('ink', 1)).ring(wx, 158, 4, c('metal', 2));
      const wx = x + 80;
      p.rect(wx, 136 + bob, 120, 16, c('wood', 2)).rect(wx, 136 + bob, 120, 2, c('wood', 3));
      for (let k = 0; k < 6; k++) blob(p, wx + 12 + k * 19, 130 + bob, 13, 9, SP.r('hay'), 1, 3);
      for (const ww of [wx + 20, wx + 100]) p.disc(ww, 158, 9, c('ink', 1)).ring(ww, 158, 4, c('wood', 2));
      // Gwinn in the hay, ears flapping
      if (f > 8) scaleBlit(p, GWINN[f % 4 < 2 ? 'gwinn1' : 'gwinn3'].crop(0, 0, 20, 11), wx + 60, 112 + bob - (f % 6 === 0 ? 2 : 0), 2);
      caption(p, f < 24 ? 'MEANWHILE, THE KLOWN KLUB' : 'GWINN RIDES IN THE HAY.', 10);
      caption(p, f < 24 ? 'WAGON HEADS FOR THE FAIR...' : 'ALL NIGHT. DOWN BACK ROADS.', 22);
    });
  return r.fli(6);
}

/** After the farm: the Fair's ride truck rumbles off, a brown head in the Ferris wheel car. */
export function truckFli(): Uint8Array {
  const bg = landscape(13, false);
  bg.rect(0, 160, W, 40, c('asphalt', 1));
  for (let x = 0; x < W; x += 40) bg.rect(x + 8, 176, 20, 3, c('yellow', 3));
  const r = new Reel(bg);
  for (let f = 0; f < 44; f++)
    r.frame((p) => {
      const x = -180 + f * 11;
      const bob = f % 2;
      p.rect(x, 140 + bob, 120, 10, c('metal', 1));
      for (const wx of [x + 14, x + 100, x + 150]) p.disc(wx, 156, 9, c('ink', 1)).ring(wx, 156, 4, c('metal', 2));
      p.rect(x + 120, 110 + bob, 46, 40, c('blue', 2)).rect(x + 140, 114 + bob, 22, 14, c('sky', 6));
      // the Ferris wheel car, and Gwinn in it, ears up
      p.rect(x + 30, 100 + bob, 60, 6, c('red', 2)).rect(x + 34, 106 + bob, 52, 34, c('yellow', 2)).rect(x + 34, 106 + bob, 52, 12, c('sky', 5));
      scaleBlit(p, GWINN[f % 4 < 2 ? 'gwinn1' : 'gwinn2'].crop(0, 0, 20, 12), x + 40, 92 + bob, 2);
      caption(p, f < 22 ? 'THE RIDES ARE GOING TO THE FAIR,' : 'AND SO IS GWINN.', 10);
      if (f >= 22) caption(p, 'SHE CAN SMELL THE CORN DOGS.', 22);
    });
  return r.fli(5);
}

export function buildCartoons(): Record<string, Uint8Array> {
  return { 'leo.fli': leoFli(), 'car.fli': carFli(), 'parade.fli': paradeFli(), 'cast.fli': castFli(), 'wagon.fli': wagonFli(), 'truck.fli': truckFli() };
}
