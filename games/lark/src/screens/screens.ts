// The 320x200 pictures: the title (Joe on the Long Road at dusk, the town clock far off), the
// menu, the page backdrop every text screen sits on (a sheet of library paper, with whoever is
// speaking at its top: the talks, the chapter card, the bell, the ending), and the high score /
// load / save backdrops; then every slide list that strings them together with the words in text.ts
// and the story cartoons in reels/.
import { encodeGif } from '../../../../web/src/formats/gif';
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { dosText } from '../../../kit/disk';
import { Pixels, rng } from '../../../kit/pixels';
import { SANDLOGO, sandLogoFli } from '../../../kit/sandlogo';
import { saveSlots } from '../../../kit/saveSlots';
import { gradient, micro, outlined, scaleBlit, text, textWidth } from '../art/draw';
import { PAL, c, r } from '../art/pal';
import { bard, goat, gwinnSit, teddy } from '../sprites/friends';
import { carlPicture } from '../sprites/critters';
import { joe } from '../sprites/joe';
import { clown, leo, reggie } from '../sprites/people';
import { dancerPic, drumstickPic, fusePic, lensPic, balloonPic, shovelPic, stonePic, umbrellaPic, valentinePic, windKeyPic } from '../blocks/keepsakes';
import { lewieCameo, wattCameo, willCameo } from '../../../kit/cameos';
import { loaf, seed } from '../sprites/guests';
import { cartoons } from './reels/cartoons';
import {
  BELL,
  CARD1,
  CARD2,
  CARD3,
  CARD4,
  CARD5,
  CARD6,
  CARD7,
  CARD8,
  CARD9,
  CARD10,
  CARD11,
  CARD12,
  TALK_WATT,
  TALK_WATT2,
  EPILOGUE,
  TALK_SEED,
  TALK_SEED2,
  TALK_FAIR,
  TALK_FAIR2,
  TALK_LOAF,
  TALK_LOAF2,
  TALK_WILL,
  TALK_WILL2,
  OVER,
  TALK_LEWIE,
  TALK_LEWIE2,
  CREDITS,
  HELP,
  LOST,
  STORY,
  TALK_BARD,
  TALK_BENCH,
  TALK_BOOK,
  TALK_CARL,
  TALK_GOAT,
  TALK_GOAT2,
  TALK_LEO,
  TALK_LEO7,
  TALK_LOT,
  TALK_LOT2,
  TALK_TEDDY,
  TALK_TEDDY2,
  TITLE,
  WON,
} from './text';

export const W = 320;
export const H = 200;

const gif = (p: Pixels): Uint8Array => encodeGif({ width: p.w, height: p.h, pixels: Uint8Array.from(p.px), palette: PAL.pal });

// ------------------------------------------------------------------ pieces

function stars(p: Pixels, seed: number, h: number): void {
  const R = rng(seed);
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(R() * W);
    const y = Math.floor(R() * h);
    p.set(x, y, R() < 0.25 ? c('yellow', 3) : c('paper', R() < 0.5 ? 4 : 2));
  }
}

function dusk(p: Pixels, h = 140): void {
  gradient(p, 0, 0, W, h, r('dusk'), 0, 5);
  stars(p, 3, h * 0.45);
}

/** Rolling hills and the Long Road winding off toward the town clock on the horizon. */
function hills(p: Pixels, top: number): void {
  for (let x = 0; x < W; x++) {
    const y1 = Math.round(top + Math.sin(x / 37) * 6 + Math.sin(x / 13) * 2);
    const y2 = Math.round(top + 14 + Math.sin(x / 51 + 2) * 7);
    p.rect(x, y1, 1, H - y1, c('grass', 0));
    p.rect(x, y2, 1, H - y2, c('grass', 1));
  }
  // the road: from the bottom left up over the hill to the right
  for (let y = top + 10; y < H; y++) {
    const t = (y - top - 10) / (H - top - 10);
    const cx = 230 - t * 150;
    const half = 2 + t * 24;
    p.rect(Math.round(cx - half), y, Math.round(half * 2), 1, c('wood', 2 + (y % 3 === 0 ? 1 : 0)));
  }
  // the clock tower, far off, its face lit
  const tx = 238;
  const ty = top - 26;
  p.rect(tx, ty, 10, 30, c('ink', 1))
    .rect(tx + 2, ty - 6, 6, 6, c('ink', 1))
    .rect(tx + 4, ty - 10, 2, 4, c('ink', 1));
  p.disc(tx + 5, ty + 6, 3, c('window', 2));
  for (const [x, w] of [
    [210, 18],
    [252, 22],
  ])
    p.rect(x, top - 8, w, 12, c('ink', 1))
      .rect(x + 3, top - 5, 3, 3, c('window', 1))
      .rect(x + w - 6, top - 5, 3, 3, c('window', 1));
}

/** A big headline with a drop shadow. */
function headline(p: Pixels, y: number, s: string, scale: number, fill: number, edge: number, cx = W / 2): void {
  const x = Math.round(cx - textWidth(s, scale) / 2);
  text(p, x + 3, y + 3, s, c('ink', 0), scale);
  outlined(p, x, y, s, fill, edge, scale);
}

/** A sheet of library paper with a faint ruled line and a card-catalog hole at the bottom. */
function paper(p: Pixels, x: number, y: number, w: number, h: number): void {
  p.rect(x + 3, y + 3, w, h, c('ink', 0));
  p.rect(x, y, w, h, c('paper', 4));
  p.frame(x, y, w, h, c('paper', 2));
  p.disc(x + w / 2, y + h - 5, 2, c('paper', 2));
}

/** The library wall behind every page: dark wood, shelves of books along the top. */
function libraryWall(p: Pixels): void {
  p.rect(0, 0, W, H, c('wood', 1));
  for (let x = 0; x < W; x += 40) p.rect(x, 0, 2, H, c('wood', 0));
  const R = rng(5);
  for (let x = 0; x < W;) {
    const w = 3 + Math.floor(R() * 4);
    const col = ['red', 'blue', 'green', 'brass', 'purple'][Math.floor(R() * 5)];
    const h = 18 + Math.floor(R() * 8);
    p.rect(x, 28 - h, w, h, c(col, 2)).rect(x, 28 - h, w, 1, c(col, 3));
    x += w + 1;
  }
  p.rect(0, 28, W, 3, c('wood', 3));
}

/** A see-through 20x20 ground, for a keepsake shown at a page's top. */
const clearPic = () => new Pixels(20, 20, 255);

// ------------------------------------------------------------------ screens

export function titleScreen(): Pixels {
  const p = new Pixels(W, H);
  dusk(p);
  hills(p, 132);
  headline(p, 16, 'HEART', 4, c('tin', 6), c('ink', 0));
  headline(p, 54, 'OF TIN', 4, c('tin', 5), c('ink', 0));
  // Joe on the road, a long way from home, his bulb lit
  scaleBlit(p, joe('side', 0), 104, 128, 3, true);
  p.disc(134, 128, 4, c('window', 1)).disc(134, 128, 2, c('yellow', 3));
  micro(p, 4, 4, 'SANDBOX SOFTWARE PRESENTS', c('paper', 3));
  micro(p, 196, 192, 'FOR WHOEVER FOUND THEM ALL', c('paper', 3));
  return p;
}

export function menuScreen(): Pixels {
  const p = new Pixels(W, H);
  dusk(p, 200);
  hills(p, 150);
  headline(p, 10, TITLE, 3, c('tin', 6), c('ink', 0));
  // PLAYGAME writes the game's name at (96,104) and the menu at (80,120..167) in blue
  paper(p, 62, 94, 196, 82);
  scaleBlit(p, joe('down', 0, 'glad'), 12, 120, 2);
  micro(p, 72, 190, 'ARROWS TO CHOOSE, ENTER TO GO', c('paper', 4));
  return p;
}

/** Backdrop for text pages: PLAYGAME writes 31 columns at x 40, y 40..167 in purple. */
export function pageScreen(heading: string, who: Pixels[] = [joe('down', 0)]): Pixels {
  const p = new Pixels(W, H);
  libraryWall(p);
  paper(p, 30, 32, 262, 150);
  who.forEach((pic, i) => scaleBlit(p, pic, 4 + i * 22, 4, 1));
  outlined(p, 8 + who.length * 22, 9, heading, c('paper', 4), c('ink', 0));
  micro(p, 4, 190, 'THE TINY POCKETS LIBRARY', c('wood', 4));
  return p;
}

export function scoresScreen(): Pixels {
  const p = new Pixels(W, H);
  libraryWall(p);
  // PLAYGAME writes "Top Ten Scores" at the very top and "Hit any key" at the very bottom: plain paper to the edges
  p.rect(14, 0, 292, 200, c('paper', 4));
  p.rect(14, 0, 1, 200, c('paper', 2)).rect(305, 0, 1, 200, c('paper', 2));
  return p;
}

export function slotsScreen(): Pixels {
  const p = new Pixels(W, H);
  libraryWall(p);
  saveSlots(p, c('ink', 0), c('paper', 4), c('wood', 3));
  scaleBlit(p, joe('down', 0), 4, 170, 1);
  return p;
}

// ------------------------------------------------------------------ all files

export function buildScreens(): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  const add = (name: string, bytes: Uint8Array | string) => (out[name] = typeof bytes === 'string' ? dosText(bytes) : bytes);
  const slides = (name: string, list: { name: string; pause?: number }[]) => add(name, serializeSlideList(list));
  /** A page of words over its backdrop: a slide list of the two, with a cartoon before or after them. */
  const pages = (base: string, heading: string, words: string, who?: Pixels[], reel?: { before?: string; after?: string }) => {
    add(`${base}.gif`, gif(pageScreen(heading, who)));
    add(`${base}.txt`, words);
    slides(`${base}.lst`, [
      ...(reel?.before ? [{ name: reel.before, pause: 0 }] : []),
      { name: `${base}.gif`, pause: 0 },
      { name: `${base}.txt` },
      ...(reel?.after ? [{ name: reel.after, pause: 0 }] : []),
    ]);
  };
  // the story cartoons (reels/), at the story's turns
  for (const [name, bytes] of Object.entries(cartoons())) add(name, bytes);
  add(SANDLOGO, sandLogoFli());
  add('title.gif', gif(titleScreen()));
  slides('title.lst', [
    { name: SANDLOGO, pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]);
  add('menu.gif', gif(menuScreen()));
  pages('story', 'THE STORY', STORY);
  pages('help', 'HOW TO PLAY', HELP, [joe('down', 0), joe('side', 0, 'hop')]);
  pages('credits', 'CREDITS', CREDITS, [joe('down', 0, 'glad'), leo(true, true), reggie(0)]);
  add('scores.gif', gif(scoresScreen()));
  add('loadgame.gif', gif(slotsScreen()));
  add('savegame.gif', gif(slotsScreen()));
  pages('talkbook', 'THE STORYBOOK', TALK_BOOK, [joe('down', 0)]);
  pages('talkbnch', 'THE WORKBENCH', TALK_BENCH, [joe('down', 0, 'shh')], { after: 'door.fli' });
  pages('talkleo', 'DOC LEO', TALK_LEO, [leo(), reggie(0)]);
  pages('talkleo7', 'DOC LEO', TALK_LEO7, [leo(true, true), reggie(1), joe('down', 0, 'glad'), windKeyPic(clearPic())]);
  pages('card1', 'CHAPTER ONE', CARD1, [joe('down', 0), clown('blue', 'red', 1)]);
  pages('card2', 'CHAPTER TWO', CARD2, [joe('down', 0), teddy(), gwinnSit()]);
  pages('talkted', 'TEDDY', TALK_TEDDY, [teddy()]);
  pages('talkted2', "TEDDY'S PARTY", TALK_TEDDY2, [teddy(true), gwinnSit(), joe('down', 0, 'glad'), valentinePic(clearPic())]);
  pages('card3', 'CHAPTER THREE', CARD3, [joe('down', 0), bard(0), clown('green', 'yellow', 1)]);
  pages('talkbard', 'THE BARD OF BIZARRE', TALK_BARD, [bard(1), joe('down', 0, 'glad'), drumstickPic(clearPic())]);
  pages('card4', 'CHAPTER FOUR', CARD4, [joe('down', 0), goat(0)]);
  pages('talkgoat', 'THE THIRD GOAT', TALK_GOAT, [goat(1)]);
  pages('talkgot2', 'THE GOAT DANCES', TALK_GOAT2, [goat(1), joe('down', 0, 'glad'), dancerPic(clearPic())]);
  pages('card5', 'CHAPTER FIVE', CARD5, [joe('down', 0), leo(), reggie(0)]);
  pages('talklot', 'DOC LEO', TALK_LOT, [leo(), reggie(1)]);
  pages('talklot2', 'THE CHEZ, CHARGING', TALK_LOT2, [leo(true, true), joe('down', 0, 'glad'), fusePic(clearPic())]);
  pages('card6', 'CHAPTER SIX', CARD6, [joe('down', 0), carlPicture(0)]);
  pages('talkcarl', 'CARL', TALK_CARL, [carlPicture(1), joe('down', 0, 'glad'), lensPic(clearPic())], { before: 'beam.fli' });
  pages('over', 'OVER THE HILL', OVER, [joe('down', 0)]);
  const lewie = lewieCameo(PAL.pal, 'down0');
  pages('card7', 'CHAPTER SEVEN', CARD7, [joe('down', 0), lewie]);
  pages('talklew', 'TEENAGE LEWIE', TALK_LEWIE, [lewie, shovelPic(clearPic())]);
  pages('talklew2', 'THE HEARTH', TALK_LEWIE2, [lewie, joe('down', 0, 'glad')]);
  const will = (mood: 'worry' | 'swoon', arms: 'clutch' | 'heart') => willCameo(PAL.pal, { face: 'front', mood, arms });
  pages('card8', 'CHAPTER EIGHT', CARD8, [joe('down', 0), will('worry', 'clutch')]);
  pages('talkwill', 'WILL', TALK_WILL, [will('worry', 'clutch'), joe('side', 0, 'hop')]);
  pages('talkwil2', "WILL'S TURN", TALK_WILL2, [will('swoon', 'heart'), joe('down', 0, 'glad'), umbrellaPic(clearPic())]);
  pages('card9', 'CHAPTER NINE', CARD9, [joe('down', 0), loaf('sad')]);
  pages('talkloaf', 'LOAF #13', TALK_LOAF, [loaf('sad')]);
  pages('talklof2', 'LOAF #13, FREE', TALK_LOAF2, [loaf('joy'), joe('down', 0, 'glad'), stonePic(clearPic())]);
  pages('card10', 'CHAPTER TEN', CARD10, [joe('down', 0), leo(), clown('blue', 'red', 1)]);
  pages('talkfair', 'DOC LEO', TALK_FAIR, [leo(true, false)]);
  pages('talkfai2', 'REGGIE IS SAFE', TALK_FAIR2, [leo(true, true), reggie(1), joe('down', 0, 'glad'), balloonPic(clearPic())]);
  pages('card11', 'CHAPTER ELEVEN', CARD11, [joe('down', 0), seed('smile', 'sprout')]);
  pages('talkseed', 'THE MUSTARD SEED', TALK_SEED, [seed('smile', 'sprout')]);
  pages('talksed2', 'THE STAR', TALK_SEED2, [seed('joy', 'sprout'), joe('down', 0, 'glad')], { before: 'star.fli' });
  const watt = wattCameo(PAL.pal, 'down', 0);
  pages('card12', 'THE SMART HOME', CARD12, [joe('down', 0), watt]);
  // Watt's talk stops at the hatch for gold.fli, then goes on over the same page
  pages('talkwatt', 'WATT', TALK_WATT, [watt, joe('down', 0, 'glad'), leo(true, true), teddy(true), gwinnSit()]);
  add('talkwat2.txt', TALK_WATT2);
  slides('talkwatt.lst', [
    { name: 'talkwatt.gif', pause: 0 },
    { name: 'talkwatt.txt' },
    { name: 'gold.fli', pause: 0 },
    { name: 'talkwatt.gif', pause: 0 },
    { name: 'talkwat2.txt' },
  ]);
  pages('epilogue', 'OPENING TIME', EPILOGUE, [joe('down', 0, 'glad')], { before: 'home.fli' });
  pages('bell', "SEVEN O'CLOCK", BELL, [clown('blue', 'red', 1), clown('green', 'yellow', 1), leo(true, true)], { before: 'bell.fli' });
  pages('won', 'THE LONG ROAD', WON, [joe('down', 0, 'glad')]);
  pages('lost', 'A LITTLE REST', LOST, [joe('down', 0, 'blink')]);
  return out;
}
