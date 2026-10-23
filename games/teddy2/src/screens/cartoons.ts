// The cartoons (FLIs): the morning after the Big Show (before the title poster and the story
// pages), Gwinn's rides between her MEANWHILE... levels (the hay wagon, the Fair's ride truck),
// and at the end, fireworks and the Fair parade with THE CHEZ in front.
import { encodeFli } from '../../../../web/src/formats/fli';
import { Pixels } from '../../../kit/pixels';
import { CLEAR, blob, centered, klubArt, micro, outlined, scaleBlit } from '../art/draw';
import { GWINN } from '../sprites/gwinn';
import { citiCar } from '../sprites/klown';
import { docLeo, FULL } from '../sprites/people';
import { SP, landscape, logo, titleScreen } from './screens';
import { castFli } from './cast';
import { POSES } from '../sprites/teddy';

const c = (n: string, k: number) => SP.c(n, k);
const W = 320;
const H = 200;

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

/** Doc Leo's living room at dawn: wallpaper, the window, Teddy's bed and Gwinn's (empty). */
function livingRoom(): Pixels {
  const p = new Pixels(W, H);
  for (let y = 0; y < 150; y++) for (let x = 0; x < W; x++) p.set(x, y, Math.floor(x / 10) % 2 ? c('peach', 2) : c('peach', 3));
  // the window: a pink dawn outside
  p.rect(206, 30, 80, 64, c('paint', 3));
  for (let y = 34; y < 90; y++) p.rect(210, y, 72, 1, c('dusk', 4 + Math.floor((y - 34) / 8)));
  p.rect(244, 34, 4, 56, c('paint', 3)).rect(210, 60, 72, 4, c('paint', 3));
  p.rect(0, 150, W, 50, c('wood', 2));
  for (let x = 0; x < W; x += 32) p.rect(x, 150, 1, 50, c('wood', 0));
  p.rect(0, 150, W, 3, c('wood', 4));
  // the beds: Teddy's little blue one, Gwinn's big purple one (empty but for a dent)
  blob(p, 70, 166, 34, 12, SP.r('blue'), 0, 3);
  blob(p, 70, 164, 22, 6, SP.r('blue'), 1, 2);
  blob(p, 190, 168, 48, 16, SP.r('purple'), 0, 3);
  blob(p, 190, 166, 34, 8, SP.r('purple'), 0, 1);
  micro(p, 172, 184, 'GWINN', c('paint', 3));
  // confetti on the floor, in a trail toward the doggy door at the right
  for (let i = 0; i < 40; i++) p.rect(150 + i * 4 + (i % 3) * 2, 176 + ((i * 7) % 18), 2, 2, c(['red', 'yellow', 'blue', 'green', 'pink'][i % 5], 3));
  p.rect(292, 140, 26, 34, c('ink', 0)).rect(294, 142, 22, 30, c('wood', 1)).rect(294, 142, 22, 4, c('wood', 3));
  return p;
}

/**
 * The opening cartoon: the morning after the Big Show. Teddy wakes; Gwinn's bed is empty;
 * a trail of confetti leads out the doggy door; Teddy sniffs it. Doc Leo comes in with a
 * letter: the Klown Klub is booked at the Fair tonight. Then the logo drops in.
 */
export function morningFli(): Uint8Array {
  const r = new Reel(livingRoom());
  const teddy = (p: Pixels, pose: string, x = 46, flip = false) => scaleBlit(p, POSES[pose], x, 118, 3, flip);
  for (let f = 0; f < 16; f++)
    r.frame((p) => {
      teddy(p, 'sleep');
      if (f % 4 < 2) outlined(p, 110, 104 - (f % 8), 'Z', c('paint', 3), c('ink', 0), 2);
      caption(p, 'THE MORNING AFTER');
      caption(p, 'THE BIG SHOW...', 22);
    });
  for (let f = 0; f < 18; f++)
    r.frame((p) => {
      teddy(p, f < 4 ? 'front' : f < 10 ? 'frontTilt' : 'front');
      if (f >= 10) outlined(p, 168, 110, '?', c('yellow', 3), c('ink', 0), 3);
      caption(p, "GWINN'S BED IS EMPTY.");
      if (f >= 6) caption(p, 'HER PINK COLLAR IS GONE.', 22);
    });
  for (let f = 0; f < 24; f++)
    r.frame((p) => {
      const x = 46 + Math.min(f, 14) * 12;
      teddy(p, f < 14 ? (f % 2 ? 'walk1' : 'walk2') : f % 4 < 2 ? 'frontSniff' : 'frontSniff2', x);
      if (f >= 14) outlined(p, x + 64, 120, 'SNIFF', c('green', 2), c('ink', 0), 1);
      caption(p, 'A TRAIL OF CONFETTI LEADS');
      caption(p, 'OUT THE DOGGY DOOR.', 22);
    });
  for (let f = 0; f < 24; f++)
    r.frame((p) => {
      scaleBlit(p, docLeo(FULL, f % 8 < 4), 120, 78, 2);
      teddy(p, f < 12 ? 'frontTilt' : 'frontBeg', 214);
      // the letter in his hand
      p.rect(156, 104, 18, 13, c('paint', 3)).frame(156, 104, 18, 13, c('ink', 0)).rect(159, 108, 12, 1, c('ink', 1)).rect(159, 111, 9, 1, c('ink', 1));
      caption(p, f < 12 ? 'DOC LEO HAS NEWS: THE KLOWN' : "BUT TEDDY WON'T GO WITHOUT", f < 12 ? 10 : 10);
      caption(p, f < 12 ? 'KLUB PLAYS THE FAIR TONIGHT!' : 'HIS BIG SISTER.', 22);
    });
  // the logo drops in, bouncing, over the dawn
  for (let f = 0; f < 14; f++) {
    const drop = Math.round(-90 * Math.cos((f / 13) * Math.PI * 2.5) * (1 - f / 13));
    r.frame((p) => {
      p.px.set(landscape(7).px);
      logo(p, 6 + Math.min(0, drop) + (drop > 0 ? Math.round(drop / 6) : 0));
    });
  }
  r.frame((p) => p.px.set(titleScreen().px), 4);
  return r.fli(8);
}

/** The finale: fireworks over the Fair, THE CHEZ leading the parade, Teddy on the roof, Gwinn and her ribbon. */
export function finaleFli(): Uint8Array {
  const bg = new Pixels(W, H, c('ink', 0));
  for (let y = 0; y < 130; y++) for (let x = 0; x < W; x++) if ((x * 13 + y * 7) % 97 === 0) bg.set(x, y, c('glow', 3));
  // the Ferris wheel against the night
  bg.ring(250, 80, 50, c('red', 1));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    bg.line(250, 80, 250 + Math.round(Math.cos(a) * 50), 80 + Math.round(Math.sin(a) * 50), c('paint', 1));
    bg.rect(247 + Math.round(Math.cos(a) * 50), 80 + Math.round(Math.sin(a) * 50), 6, 5, c(['yellow', 'blue', 'green'][k % 3], 2));
  }
  bg.rect(0, 160, W, 40, c('asphalt', 1));
  for (let x = 0; x < W; x += 16) for (let k = 0; k < 6; k++) bg.rect(x + k, 40 + k, 15 - k * 2, 1, c(['red', 'yellow', 'blue', 'green'][(x / 16) % 4], 2));
  const r = new Reel(bg);
  const car = new Pixels(40, 40, CLEAR);
  citiCar(car, 0, 0);
  const head = docLeo(FULL).crop(0, 0, 20, 16);
  const burst = (p: Pixels, cx: number, cy: number, t: number, col: string) => {
    if (t < 0 || t > 10) return;
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      p.rect(cx + Math.round(Math.cos(a) * t * 4), cy + Math.round(Math.sin(a) * t * 4) + Math.floor(t * t * 0.1), 2, 2, c(col, t < 7 ? 3 : 1));
    }
  };
  for (let f = 0; f < 64; f++)
    r.frame((p) => {
      burst(p, 70, 50, f % 22, 'red');
      burst(p, 160, 34, (f + 8) % 22, 'yellow');
      burst(p, 110, 70, (f + 15) % 22, 'blue');
      const x0 = -150 + f * 6;
      scaleBlit(p, car, x0 + 90, 72, 3);
      scaleBlit(p, head, x0 + 124, 104 - (f % 2), 2);
      scaleBlit(p, POSES[f % 6 < 3 ? 'frontBeg' : 'frontReach'], x0 + 100, 52 - (f % 2), 2);
      scaleBlit(p, GWINN[f % 2 ? 'gwinnRun1' : 'gwinnRun2'], x0 + 20, 150, 2);
      // her blue ribbon
      p.disc(x0 + 46, 166, 4, c('blue', 2)).disc(x0 + 46, 166, 2, c('gold', 2));
      caption(p, f < 32 ? 'AND THE FAIR PARADE...' : 'THE CHEZ LEADS THE WAY!', 8);
      if (f >= 32) caption(p, 'TEDDY RIDES UP FRONT. GWINN RUNS.', 20);
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
  return { 'morning.fli': morningFli(), 'finale.fli': finaleFli(), 'cast.fli': castFli(), 'wagon.fli': wagonFli(), 'truck.fli': truckFli() };
}
