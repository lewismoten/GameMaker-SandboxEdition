// The cartoons (FLIs) that tell the story as a slide show, before the title poster and the
// story pages: Doc Leo at home practicing his clown act (balloon animals, a magic trick, a
// parade strut), then off to the Clown Club in his red CitiCar; then intro.fli (Gwinn and
// the suitcase). And at the end, the Clown Club parade with Teddy riding on top.
import { encodeFli } from '../../../../web/src/formats/fli';
import { Pixels } from '../../../kit/pixels';
import { CLEAR, blob, centered, clubArt, outlined, scaleBlit } from '../art/draw';
import { FX } from '../sprites/fx';
import { GWINN } from '../sprites/gwinn';
import { citiCar } from '../sprites/klown';
import { dove, marcher } from '../sprites/magic';
import { docLeo, DRESSED } from '../sprites/people';
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

const caption = (p: Pixels, words: string, y = 10) => centered(p, y, clubArt(words), c('paint', 3), 1, c('ink', 0));

/** The balloon dog in the cartoon, green like the balloon it was twisted from. */
const greenPoodle = (() => {
  const swap = new Map([
    [SP.c('pink', 0), c('green', 0)],
    [SP.c('pink', 1), c('green', 0)],
    [SP.c('pink', 2), c('green', 1)],
    [SP.c('pink', 3), c('green', 2)],
  ]);
  const p = new Pixels(FX.poodle1.w, FX.poodle1.h, CLEAR);
  p.px.set(FX.poodle1.px.map((v) => swap.get(v) ?? v));
  return p;
})();

/**
 * A round green balloon on a string from Doc Leo's hand (x, y), blowing up in the sky
 * where it reads clearly against the tent and the town, then twisted into a dog: 0..1.
 */
function balloon(p: Pixels, x: number, y: number, t: number): void {
  if (t < 0.5) {
    const ry = 3 + t * 2 * 7;
    const rx = ry * 0.85;
    const kx = x + 14;
    const ky = y - 26;
    // the string, with a little curl, then the knot
    for (let i = 0; i <= 26; i++) p.set(x + Math.round((i * 14) / 26 + Math.sin(i / 3) * 1.5), y - i, c('ink', 1));
    p.rect(kx - 1, ky - 1, 3, 2, c('green', 0)).set(kx, ky - 2, c('green', 0));
    blob(p, kx, ky - 1 - ry, rx + 1, ry + 1, [c('ink', 0)], 0, 0);
    blob(p, kx, ky - 1 - ry, rx, ry, SP.r('green'), 0, 2);
    p.set(Math.round(kx - rx * 0.45), Math.round(ky - 1 - ry * 1.45), c('paint', 3));
  } else scaleBlit(p, greenPoodle, x - 5, y - 42, 2);
}

/** Clip 1: Doc Leo practices in the backyard: a balloon dog, a magic trick, a parade strut. */
export function leoFli(): Uint8Array {
  const r = new Reel(backyard());
  const leo = (p: Pixels, wave = false, x = 150, y = 92) => scaleBlit(p, docLeo(DRESSED, wave), x, y, 2);
  const teddy = (p: Pixels, pose: string) => scaleBlit(p, POSES[pose], 100, 134, 2);
  // the balloon dog
  for (let f = 0; f < 22; f++)
    r.frame((p) => {
      leo(p);
      teddy(p, f < 16 ? 'front' : 'frontBeg');
      balloon(p, 187, 140, f / 16);
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
    caption(p, "TONIGHT IS THE CLOWN CLUB'S");
    caption(p, 'BIG SHOW, AND HE IS THE STAR!', 22);
  }, 14);
  return r.fli(9);
}

/** Clip 2: Doc Leo goes ahead to the Club in his CitiCar; his costume suitcase waits on the step. */
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
        scaleBlit(p, head, x + 34, 112 - (f > 12 ? f % 2 : 0), 2);
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

/** The finale: the Clown Club parade down Main Street at night, Teddy riding on the CitiCar. */
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
  const head = docLeo(DRESSED).crop(0, 0, 20, 16);
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
      scaleBlit(p, head, x0 + 124, 104 - (f % 2), 2);
      scaleBlit(p, POSES[f % 6 < 3 ? 'frontBeg' : 'frontReach'], x0 + 100, 52 - (f % 2), 2);
      scaleBlit(p, GWINN[f % 2 ? 'gwinnRun1' : 'gwinnRun2'], x0 + 20, 150, 2);
      caption(p, f < 30 ? 'AND AFTER THE BIG SHOW...' : 'THE CLOWN CLUB PARADE!', 8);
      if (f >= 30) caption(p, 'TEDDY RIDES UP FRONT.', 20);
    });
  return r.fli(5);
}

export function buildCartoons(): Record<string, Uint8Array> {
  return { 'leo.fli': leoFli(), 'car.fli': carFli(), 'parade.fli': paradeFli(), 'cast.fli': castFli() };
}
