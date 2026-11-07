// The parade's two cartoons (FLIs drawn in code with the Reel, tools/kit/reel.ts):
//   PARADE.FLI  the intro, played after the Sandbox Software sting: a calm street, then the wind comes along and blows
//               cards and sheet music down it, and Penny, plume fluttering, decides to do something about it.
//   ENDING.FLI  the ending: a crop duster flies over towing a THANK YOU banner while confetti falls, then the whole
//               town stands along the street and waves, and Penny tips her hat.
import { scaleBlit } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { outlined, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels, rng } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Reel } from '@lewismoten/gamemaker-sandbox-tools/kit/reel';
import type { Book } from '../../kit/starter/book';
import type { Pal } from '../../kit/starter/palette';
import { H, W, scene } from '../../kit/starter/screens';
import { baton, streetBackdrop } from './title';

const SPEED = 5;

function caption(p: Pixels, pal: Pal, s: string, y = 176): void {
  p.rect(0, y - 4, W, 20, pal.c('ink', 0));
  outlined(p, Math.round((W - textWidth(s, 1)) / 2), y + 1, s, pal.c('white', 3), pal.c('ink', 0), 1, pal.c('ink', 0));
}

/** A thank-you card or a sheet of music, tumbling: the sheet has lines of notes, the card a red ribbon. */
function paper(p: Pixels, pal: Pal, x: number, y: number, card: boolean, phase: number): void {
  const w = phase % 2 ? 9 : 7;
  const h = phase % 2 ? 6 : 8;
  p.rect(x, y, w, h, pal.c('ink', 0)).rect(x + 1, y + 1, w - 2, h - 2, pal.c('white', 3));
  if (card) p.rect(x, y + Math.floor(h / 2) - 1, w, 2, pal.c('red', 3));
  else for (let k = 2; k < h - 1; k += 2) p.rect(x + 2, y + k, w - 4, 1, pal.c('ink', 2));
}

/** A swoosh of wind: a long thin curl of white lines. */
function swoosh(p: Pixels, pal: Pal, x: number, y: number, len: number): void {
  for (let i = 0; i < len; i++) p.set(x + i, y + Math.round(Math.sin(i / 5) * 2), pal.c('white', 2 + (i % 3 === 0 ? 1 : 0)));
}

/** The intro (frames at 14 a second, about 8 seconds). */
export function introFli(pal: Pal, book: Book, penny: Pixels): Uint8Array {
  const bg = streetBackdrop(pal, book);
  const reel = new Reel(pal.pal);
  const rand = rng(12);
  const sheets = Array.from({ length: 14 }, (_, i) => ({ y: 30 + Math.floor(rand() * 110), v: 3 + Math.floor(rand() * 5), x0: -20 - i * 18, card: i % 2 === 0 }));
  const F = 110;
  const draw = (f: number) => (p: Pixels) => {
    // Penny stands at the left with her baton; her plume leans when the gust arrives
    scaleBlit(p, penny, 24, 98, 2, false, 255);
    baton(p, pal, 24 + 31, 98 + 50, 24 + 58, 98 + 8);
    if (f > 28) {
      for (let k = 0; k < 4; k++) swoosh(p, pal, ((f * 9 + k * 83) % 380) - 40, 40 + k * 28, 46 + (k % 2) * 20);
      sheets.forEach((s, i) => {
        const x = s.x0 + (f - 28) * s.v;
        if (x > -10 && x < W) paper(p, pal, x, s.y + Math.round(Math.sin((f + i * 3) / 4) * 9), s.card, Math.floor((f + i) / 2));
      });
    }
    if (f < 28) caption(p, pal, 'IT IS THE MORNING OF THE PARADE.');
    else if (f < 70) caption(p, pal, 'THEN THE WIND CAME ALONG.');
    else caption(p, pal, 'PENNY HAS A PLUME. SHE HAS A PLAN.');
  };
  reel.fadeIn(bg, 4);
  for (let f = 0; f < F; f++) reel.frame(bg, draw(f), 1);
  reel.fadeOut(5);
  return reel.fli(SPEED);
}

/** The ending: the flyover, then the whole town waving. */
export function endingFli(pal: Pal, book: Book, penny: Pixels): Uint8Array {
  const sky = scene(pal, book, 164, 41);
  const street = streetBackdrop(pal, book);
  const reel = new Reel(pal.pal);
  const rand = rng(77);
  const bits = Array.from({ length: 60 }, () => ({ x: Math.floor(rand() * W), y: Math.floor(rand() * H), v: 1 + Math.floor(rand() * 3), c: Math.floor(rand() * 5) }));
  const cols = [pal.c('red', 3), pal.c('gold', 4), pal.c('blue', 3), pal.c('pink', 2), pal.c('green', 3)];
  const confetti = (p: Pixels, f: number) => bits.forEach((b) => p.rect((b.x + f * (b.c - 2)) % W < 0 ? 0 : (b.x + f * (b.c - 2)) % W, (b.y + f * b.v) % 170, 3, 2, cols[b.c]));
  // the plane and its banner, flying to the right: the banner trails behind it, left to right
  const plane = (p: Pixels, x: number, y: number) => {
    const ink = pal.c('ink', 0);
    const y1 = pal.r('gold');
    p.rect(x, y + 6, 30, 8, ink).rect(x + 1, y + 7, 28, 6, y1[4]).rect(x + 1, y + 7, 28, 1, y1[5]);
    p.rect(x + 6, y + 2, 14, 4, ink).rect(x + 7, y + 3, 12, 2, pal.c('red', 3)); // wing
    p.rect(x - 4, y + 3, 6, 6, ink).rect(x - 3, y + 4, 4, 4, pal.c('red', 3)); // tail fin
    p.rect(x + 30, y + 8, 3, 4, ink).rect(x + 22, y + 4, 6, 3, ink).rect(x + 23, y + 5, 4, 1, pal.c('sky', 5)); // nose, cockpit
    p.rect(x + 33, y + 2 + ((x >> 1) % 2) * 6, 2, 6, pal.c('stone', 4)); // a whirring propeller
  };
  const banner = (p: Pixels, x: number, y: number) => {
    const w = 190;
    p.line(x - 4, y + 8, x - 40, y + 10, pal.c('ink', 0));
    p.rect(x - 40 - w, y, w, 24, pal.c('ink', 0)).rect(x - 39 - w, y + 1, w - 2, 22, pal.c('white', 3)).rect(x - 39 - w, y + 1, w - 2, 2, pal.c('red', 3)).rect(x - 39 - w, y + 21, w - 2, 2, pal.c('red', 3));
    outlined(p, x - 40 - w + 10, y + 5, 'THANK YOU', pal.c('blue', 2), pal.c('white', 3), 2, pal.c('white', 3));
  };
  const flyover = (f: number) => (p: Pixels) => {
    const x = -40 + f * 6;
    banner(p, x, 40);
    plane(p, x, 38);
    confetti(p, f);
  };
  reel.fadeIn(sky, 4);
  for (let f = 0; f < 70; f++) reel.frame(sky, flyover(f), 1);
  // the town waves: neighbors along the street, the band, Penny in the middle
  const folks: [string, number, number][] = [['vet0', 14, 100], ['vet1', 52, 100], ['vet2', 90, 100], ['kid.flute.happy', 128, 100], ['kid.drum.happy', 190, 100], ['vet3', 232, 100], ['vet0', 268, 100]];
  const crowd = (f: number) => (p: Pixels) => {
    const wave = Math.floor(f / 5) % 2;
    folks.forEach(([n, x, y], i) => {
      const name = n.startsWith('vet') ? (wave === (i % 2) ? n : `${n}Tip`) : n;
      scaleBlit(p, book.pics.get(name)!, x, y + 22, 2, false, pal.c('sky', 3));
    });
    scaleBlit(p, penny, 140, 98, 2, false, 255);
    if (wave) baton(p, pal, 140 + 31, 98 + 50, 140 + 58, 98 + 8);
    else baton(p, pal, 140 + 31, 98 + 50, 140 + 62, 98 + 30);
    confetti(p, f);
    caption(p, pal, f < 60 ? 'THE WHOLE TOWN WAVES.' : 'THANK YOU, EVERYONE.');
  };
  for (let f = 0; f < 90; f++) reel.frame(street, crowd(f), 1);
  reel.fadeOut(6);
  return reel.fli(SPEED);
}
