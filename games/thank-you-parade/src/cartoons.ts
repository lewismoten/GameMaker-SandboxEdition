// The parade's two cartoons (FLIs drawn in code with the Reel, tools/kit/reel.ts), printed like the posters:
//   PARADE.FLI  the intro, after the Sandbox Software sting: 6:40 in the morning, Penny marches in, mace up, and checks
//               the time; then a goose in a purple neckerchief waddles across the other way, and across town Gigi's
//               band (in purple) is up early too.
//   ACT2.FLI    an intermission before The Float: Penny comes off Frost Lot's thawing ice and the goose in the purple neckerchief
//               comes across it on its belly, delighted, then round again.
//   ENDING.FLI  the ending: ten o'clock, Marge's crop duster passes low towing THANK YOU, comes round again towing a second
//               banner, NICE TRY, GIGI, and the Ridgemont band marches behind the llama rescue.
import { outlined, textWidth } from '@lewismoten/gamemaker-sandbox-tools/kit/pcText';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { Reel } from '@lewismoten/gamemaker-sandbox-tools/kit/reel';
import { figure } from './figure';
import { paperOf, type Pal } from './print';
import { backdrop, bunting, frame, lettering, standing, W } from './screens';
import { banner, plane } from './title';
import type { Book } from '../../kit/starter/book';

const SPEED = 5;

function caption(p: Pixels, pal: Pal, s: string, y = 182): void {
  p.rect(5, y - 4, W - 10, 16, pal.c('blue', 0));
  outlined(p, Math.round((W - textWidth(s, 1)) / 2), y, s, pal.c('paper', 3), pal.c('ink', 0), 1, pal.c('ink', 0));
}

/** A band member or a llama from a level's blocks, top over bottom, 20x40, with the paper around it made clear. */
function tall(pal: Pal, book: Book, top: string, bottom: string): Pixels {
  const p = new Pixels(20, 40, 255);
  p.px.set(book.pics.get(top)!.px, 0);
  p.px.set(book.pics.get(bottom)!.px, 400);
  return p.map((_x, _y, c) => (c === paperOf(pal) ? 255 : c));
}

/** The intro (frames at 14 a second, about 9 seconds). */
export function introFli(pal: Pal, goose: Pixels, rivals: Book): Uint8Array {
  const bg = backdrop(pal, 168, 3);
  bunting(bg, pal, 4);
  frame(bg, pal);
  const reel = new Reel(pal.pal);
  const walk = ['walk0', 'walk1', 'walk2', 'walk3'].map((n) => figure(pal, 'penny', n));
  const stand = figure(pal, 'penny', 'stand');
  const look = figure(pal, 'penny', 'look');
  const r0 = tall(pal, rivals, 'rival0Top', 'rival0');
  const r1 = tall(pal, rivals, 'rival1Top', 'rival1');
  const draw = (f: number) => (p: Pixels) => {
    if (f < 40) {
      const x = -40 + f * 4;
      standing(p, f < 34 ? walk[f % 4] : stand, Math.min(x, 100), 168, 2);
      lettering(p, pal, 30, '6:40 AM', 4);
      caption(p, pal, 'PARADE DAY. STEP OFF IS AT TEN.');
    } else if (f < 75) {
      standing(p, f % 20 < 10 ? stand : look, 100, 168, 2);
      // a goose in a purple neckerchief waddles past the other way
      standing(p, goose, 330 - (f - 40) * 7, 168, 2, true);
      caption(p, pal, f < 58 ? 'THE BAND IS NOT HERE. A GOOSE IS.' : 'PENNY DOES NOT TRUST THE GOOSE.');
    } else {
      // across town: the Ridgemont band in purple, up early
      p.rect(5, 5, W - 10, 168 - 5, pal.c('purple', 1));
      for (let k = 0; k < 6; k++) standing(p, k % 2 ? r1 : r0, 30 + k * 46, 168, 2);
      lettering(p, pal, 24, 'MEANWHILE', 3, 'paper', 'purple');
      caption(p, pal, f < 100 ? 'ACROSS TOWN, GIGI HAS A CLIPBOARD.' : 'AND A PLAN. PLACES, PEOPLE.');
    }
  };
  reel.fadeIn(bg, 4);
  for (let f = 0; f < 125; f++) reel.frame(bg, draw(f), 1);
  reel.fadeOut(5);
  return reel.fli(SPEED);
}

/** The intermission after Frost Lot (about 8 seconds): Penny walks off the ice and a goose slides past on its belly. */
export function actTwoFli(pal: Pal, goose: Pixels): Uint8Array {
  const bg = backdrop(pal, 168, 5);
  bunting(bg, pal, 4);
  bg.rect(5, 150, W - 10, 18, pal.c('teal', 4));
  for (let x = 14; x < W - 14; x += 38) bg.rect(x, 156, 14, 1, pal.c('white', 3));
  frame(bg, pal);
  const reel = new Reel(pal.pal);
  const walk = ['walk0', 'walk1', 'walk2', 'walk3'].map((n) => figure(pal, 'penny', n));
  const look = figure(pal, 'penny', 'look');
  const cheer = figure(pal, 'penny', 'cheer');
  const draw = (f: number) => (p: Pixels) => {
    lettering(p, pal, 30, 'ACT TWO', 4);
    if (f < 40) {
      standing(p, walk[f % 4], -30 + f * 4, 168, 2);
      caption(p, pal, 'THE ICE WAS A SUGGESTION. PENNY TOOK IT.');
    } else if (f < 80) {
      standing(p, look, 130, 168, 2);
      standing(p, goose, 340 - (f - 40) * 9, 168, 2, true);
      caption(p, pal, 'A GOOSE ARRIVES THE FAST WAY.');
    } else {
      standing(p, f % 12 < 6 ? cheer : look, 130, 168, 2);
      standing(p, goose, -60 + (f - 80) * 9, 168, 2);
      caption(p, pal, 'AND THEN, FOR FUN, BACK AGAIN.');
    }
  };
  reel.fadeIn(bg, 4);
  for (let f = 0; f < 110; f++) reel.frame(bg, draw(f), 1);
  reel.fadeOut(5);
  return reel.fli(SPEED);
}

/** The ending: two passes of the plane, then the llamas. */
export function endingFli(pal: Pal, rivals: Book): Uint8Array {
  const bg = backdrop(pal, 168, 9);
  frame(bg, pal);
  const reel = new Reel(pal.pal);
  const cheer = figure(pal, 'penny', 'cheer');
  const stand = figure(pal, 'penny', 'stand');
  const marchers = ['walk0', 'walk1', 'walk2', 'walk3'].map((n) => figure(pal, 'penny', n));
  const llama = tall(pal, rivals, 'llamaTop', 'llama');
  const r0 = tall(pal, rivals, 'rival0Top', 'rival0');
  const r1 = tall(pal, rivals, 'rival1Top', 'rival1');
  const pass = (f: number, words: string) => (p: Pixels) => {
    const x = -120 + f * 7;
    banner(p, pal, x + 4, 52 + Math.round(Math.sin(f / 6) * 2), words, f / 3);
    plane(p, pal, x, 26 + Math.round(Math.sin(f / 6) * 2));
    standing(p, f % 16 < 8 ? cheer : stand, 140, 168, 2);
  };
  reel.fadeIn(bg, 4);
  for (let f = 0; f < 70; f++)
    reel.frame(
      bg,
      (p) => {
        pass(f, 'THANK YOU')(p);
        caption(p, pal, f < 35 ? "TEN O'CLOCK. HORNETS STEP OFF FIRST." : 'MARGE BRINGS THE BANNER IN LOW.');
      },
      1,
    );
  for (let f = 0; f < 70; f++)
    reel.frame(
      bg,
      (p) => {
        pass(f, 'NICE TRY, GIGI')(p);
        caption(p, pal, f < 30 ? 'THEN SHE COMES ROUND AGAIN.' : 'WITH A SECOND BANNER.');
      },
      1,
    );
  for (let f = 0; f < 80; f++)
    reel.frame(
      bg,
      (p) => {
        // the Hornets march off to the right; the llamas lead the Ridgemont band in from the left, at llama speed
        for (let k = 0; k < 3; k++) standing(p, marchers[(f + k) % 4], 120 + k * 50 + f * 3, 168, 2);
        const lx = -60 + f;
        standing(p, llama, lx, 168, 2);
        standing(p, llama, lx - 44, 168, 2);
        standing(p, f % 10 < 5 ? r0 : r1, lx - 96, 168, 2);
        standing(p, f % 10 < 5 ? r1 : r0, lx - 140, 168, 2);
        caption(p, pal, f < 40 ? 'RIDGEMONT MARCHES BEHIND THE LLAMAS.' : 'THE LLAMAS ARE NOT PRECISE.');
      },
      1,
    );
  reel.fadeOut(6);
  return reel.fli(SPEED);
}
