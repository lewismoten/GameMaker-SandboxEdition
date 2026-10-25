// The 320x200 screens: the title (an FLI cartoon, then the poster), the menu, the story,
// help and credits pages, a card before each level, and the endings. All share one
// palette (the game's ramps plus a few inks), so Game-Maker's text colors come out the same.
import { encodeGif } from '../../../../web/src/formats/gif';
import { encodeFli } from '../../../../web/src/formats/fli';
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, blob, centered, gradient, clubArt, micro, microWidth, outlined, scaleBlit, text, textWidth } from '../art/draw';
import { loadScan, pastePhoto, polaroid, resample, tone } from '../../../kit/photo';
import { saveSlots } from '../../../kit/saveSlots';
import { buildPalette, buildScreenPalette, type Pal } from '../art/pal';
import { POSES } from '../sprites/teddy';
import { GWINN } from '../sprites/gwinn';
import { GWINN_HERO } from '../sprites/gwinnHero';
import { docLeo, type Costume } from '../sprites/people';
import { CHEZ, citiCar } from '../sprites/klown';
import { chezRide } from '../../../teddy/src/screens/ride';
import { renderRegion } from '../art/render';
import type { Level } from '../levels/level';
import {
  farmSong,
  houseSong,
  lostSong,
  mainSong,
  mazeSong,
  menuSong,
  lotSong,
  midwaySong,
  nightSong,
  riverSong,
  showSong,
  storySong,
  titleSong,
  wonSong,
} from '../sound/music';
import { CREDITS, EGG, HELP, LOST, README, STORY, WON, CARDS } from './text';
import { drawEgg } from '../sprites/egg';
import { gwinnSits } from '../sprites/klubfolk';
import { dosText } from '../../../kit/disk';
import { SANDLOGO, sandLogoFli } from '../../../kit/sandlogo';

export const SP: Pal = buildScreenPalette();
const c = (n: string, k: number) => SP.c(n, k);
const W = 320;
const H = 200;

export function gif(p: Pixels, pal: Uint8Array = SP.pal): Uint8Array {
  return encodeGif({ width: p.w, height: p.h, pixels: Uint8Array.from(p.px), palette: pal });
}

/** A big puffy sky with the town far away and the Clown Club's big top on the horizon. */
export function landscape(seed = 1, bigTop = true): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, 130, SP.r('sky'), 0, 7);
  const R = rng(seed);
  for (let i = 0; i < 6; i++) {
    const x = R() * W;
    const y = 15 + R() * 60;
    for (let k = 0; k < 4; k++) blob(p, x + k * 9 - 14, y + (k % 2) * 3, 10 + R() * 4, 6 + R() * 2, SP.r('cloud'), 0, 2);
  }
  // the town: rooftops and a water tower
  for (let x = 0; x < W; x += 14 + Math.floor(R() * 10)) {
    const h = 14 + Math.floor(R() * 26);
    p.rect(x, 128 - h, 13 + Math.floor(R() * 8), h, c('siding', 1));
    for (let wy = 128 - h + 4; wy < 124; wy += 6) for (let wx = x + 2; wx < x + 12; wx += 4) if (R() < 0.4) p.rect(wx, wy, 2, 2, c('sky', 6));
  }
  if (bigTop) {
    // the Clown Club's big top: red and white stripes, a flag
    const cx = 236;
    for (let y = 0; y < 34; y++) {
      const half = 4 + y * 1.1;
      for (let x = Math.floor(cx - half); x <= cx + half; x++) p.set(x, 96 + y, Math.floor((x - cx + 60) / 6) % 2 ? c('red', 2) : c('paint', 3));
    }
    p.rect(cx - 1, 84, 2, 12, c('metal', 1));
    p.rect(cx + 1, 84, 8, 5, c('yellow', 3));
  }
  // rolling green hills
  for (let x = 0; x < W; x++) {
    const h1 = 128 + Math.sin(x / 37 + seed) * 6 + Math.sin(x / 13) * 2;
    for (let y = Math.floor(h1); y < H; y++) p.set(x, y, y - h1 < 2 ? c('grass', 4) : c('grass', 2 + ((x * 7 + y * 3) % 11 === 0 ? 1 : 0)));
    const h2 = 160 + Math.sin(x / 50 + 2) * 8;
    for (let y = Math.floor(h2); y < H; y++) p.set(x, y, y - h2 < 2 ? c('grass', 3) : c('grass', 1));
  }
  return p;
}

/** The logo: TEDDY'S / LITTLE BIGGER / ADVENTURE in chunky outlined letters. */
export function logo(p: Pixels, y: number, cx = W / 2): void {
  const line = (s: string, yy: number, scale: number, fill: number, edge: number) => {
    const x = Math.round(cx - textWidth(s, scale) / 2);
    for (const [dx, dy] of [
      [2, 3],
      [3, 3],
    ])
      text(p, x + dx, yy + dy, s, c('ink', 0), scale);
    outlined(p, x, yy, s, fill, edge, scale);
  };
  line("TEDDY'S", y, 2, c('corgi', 3), c('ink', 0));
  line('LITTLE BIGGER', y + 20, 3, c('yellow', 3), c('red', 1));
  line('ADVENTURE', y + 46, 3, c('red', 3), c('ink', 0));
}

/** Scaled pictures of the cast. */
function teddyBig(p: Pixels, pose: string, x: number, y: number, s: number, flip = false): void {
  scaleBlit(p, POSES[pose], x, y, s, flip);
}
function gwinnBig(p: Pixels, pose: string, x: number, y: number, s: number, flip = false): void {
  scaleBlit(p, GWINN[pose], x, y, s, flip);
}
function leoBig(p: Pixels, x: number, y: number, s: number, wearing?: Costume, wave = false): void {
  scaleBlit(p, docLeo(wearing, wave), x, y, s);
}

/** The text panel Game-Maker writes into (x 40..288, y 40..167), with a heading above. */
export function page(heading: string, seed = 3): Pixels {
  const p = landscape(seed, false);
  // polka-dot border
  const R = rng(seed);
  for (let i = 0; i < 40; i++) blob(p, R() * W, R() * H, 3, 3, SP.r(['red', 'yellow', 'blue', 'green', 'purple'][i % 5]), 1, 3);
  // the panel reaches below Game-Maker's MORE... (written at y 168-175) so the red dashes
  // along its bottom stay clear of it
  p.rect(28, 30, 264, 158, c('ink', 0));
  p.rect(30, 32, 260, 154, c('cream', 3));
  p.rect(30, 32, 260, 2, c('paint', 3));
  for (let x = 30; x < 290; x += 8) p.rect(x, 182, 4, 2, c('red', 2));
  // bunting
  for (let x = 0; x < W; x += 16) {
    for (let k = 0; k < 7; k++) p.rect(x + k, 2 + k, 15 - k * 2, 1, c(['red', 'yellow', 'blue', 'green'][(x / 16) % 4], 2));
  }
  p.rect(0, 1, W, 1, c('ink', 1));
  centered(p, 14, heading, c('yellow', 3), 2, c('ink', 0));
  return p;
}

/**
 * The load and save pages: Game-Maker writes the names in yellow, so each sits on a dark
 * strip, and its blue message at y 185 on the panel, which reaches down past it.
 */
export function slotsPage(heading: string, seed: number): Pixels {
  const p = page(heading, seed);
  p.rect(28, 186, 264, 12, c('ink', 0));
  p.rect(30, 180, 260, 16, c('cream', 3));
  return saveSlots(p, c('ink', 0), c('cream', 3), c('blue', 1));
}

/**
 * The high scores: Game-Maker writes "Top Ten Scores" in red at the top, the scores in
 * blue from x 20, and "Hit any key" in red at the bottom (x 116..203, y 192..199), so
 * each sits on a cream plate rather than the bunting or the grass.
 */
export function scoresScreen(): Pixels {
  const p = landscape(11, false);
  const R = rng(11);
  for (let i = 0; i < 40; i++) blob(p, R() * W, R() * H, 3, 3, SP.r(['red', 'yellow', 'blue', 'green', 'purple'][i % 5]), 1, 3);
  const plate = (x: number, y: number, w: number, h: number) => {
    p.rect(x - 2, y - 2, w + 4, h + 4, c('ink', 0));
    p.rect(x, y, w, h, c('cream', 3));
  };
  plate(96, 0, 128, 10);
  // down past the latest score's row (y 177..184)
  plate(12, 22, 296, 165);
  plate(108, 190, 104, 10);
  p.rect(12, 22, 296, 2, c('paint', 3));
  return p;
}

/** The menu: logo, the cast, and the panel Game-Maker writes the choices on. */
export function menuScreen(): Pixels {
  const p = landscape(5);
  logo(p, 4);
  p.rect(58, 96, 204, 78, c('ink', 0));
  p.rect(60, 98, 200, 74, c('cream', 3));
  p.rect(60, 98, 200, 2, c('paint', 3));
  teddyBig(p, 'frontBeg', 0, 112, 4);
  gwinnBig(p, 'gwinn1', 252, 108, 3, true);
  micro(p, 66, 189, 'SANDBOX SOFTWARE  SHAREWARE  1996', c('paint', 3));
  return p;
}

/** The title poster. */
export function titleScreen(): Pixels {
  const p = landscape(7);
  logo(p, 6);
  leoBig(p, 132, 92, 2, undefined, true);
  teddyBig(p, 'frontSniff', 30, 98, 4);
  gwinnBig(p, 'gwinnRun1', 196, 100, 4);
  // a trail of confetti across the grass, and THE CHEZ waiting
  for (let i = 0; i < 30; i++) p.rect(100 + i * 7, 180 + ((i * 5) % 9), 2, 2, c(['red', 'yellow', 'blue', 'green', 'pink'][i % 5], 3));
  const car = new Pixels(40, 40, CLEAR);
  citiCar(car, 0, 0);
  scaleBlit(p, car, 262, 128, 1);
  centered(p, 190, '(C) 1996 SANDBOX SOFTWARE', c('paint', 3), 1, c('ink', 0));
  return p;
}

/** A level card: a framed view of the level and what is new there. */
export function card(l: Level, n: number, lines: string[]): Pixels {
  const pal = buildPalette(l.time);
  const cc = (name: string, k: number) => pal.c(name, k);
  const p = new Pixels(W, H, cc('ink', 0));
  const map = l.map.done();
  const poses = l.hero === 'gwinn' ? GWINN_HERO : POSES;
  const extra = l.pose ? [{ pixels: poses[l.pose[2]].px, x: l.pose[0], y: l.pose[1] }] : [];
  const view = renderRegion(map, l.bs.build(), l.beasts.mb.build(), l.beasts.build(), l.view[0], l.view[1], 15, 5, extra);
  p.rect(8, 8, 304, 104, cc('paint', 3));
  p.blit(view, 10, 10);
  outlined(p, 16, 120, `LEVEL ${n}`, cc('yellow', 3), cc('red', 1), 1);
  outlined(p, 16, 132, clubArt(l.title.toUpperCase()), cc('paint', 3), cc('ink', 1), 2);
  lines.forEach((s, i) => text(p, 16, 154 + i * 10, clubArt(s), cc(s.startsWith('NEW') ? 'yellow' : 'paint', 3)));
  return p;
}

/** The cartoons that tell the story before the story pages (built in cartoons.ts). */
const STORY_REEL: [string, number][] = [['morning.fli', 0]];

/** "Starring...": the cast in close-up before the credits (built in cast.ts). */
const CAST_REEL: [string, number][] = [['cast.fli', 0]];

export function buildScreens(levels: Level[]): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  const put = (name: string, bytes: Uint8Array | string) => (out[name] = typeof bytes === 'string' ? dosText(bytes) : bytes);
  const lst = (name: string, entries: [string, number?][]) => put(name, serializeSlideList(entries.map(([n, pause]) => ({ name: n, pause }))));

  put('title.gif', gif(titleScreen()));
  put(SANDLOGO, sandLogoFli());
  // The story told as a slide show of cartoons: Doc Leo's clown act, his CitiCar, then Gwinn.
  // (after the Sandbox Software logo)
  lst('title.lst', [
    [SANDLOGO, 0],
    ['morning.fli', 0],
    ['title.gif', 10],
  ]);
  put('menu.gif', gif(menuScreen()));
  const textPage = (base: string, heading: string, body: string) => {
    put(`${base}.gif`, gif(page(heading, base.length * 7)));
    put(`${base}.txt`, body);
    lst(`${base}.lst`, [...(base === 'story' ? STORY_REEL : base === 'credits' ? CAST_REEL : []), [`${base}.gif`, 0], [`${base}.txt`]]);
  };
  textPage('story', 'THE STORY', STORY);
  textPage('help', 'HOW TO PLAY', HELP);
  textPage('credits', 'CREDITS', CREDITS);
  put('scores.gif', gif(scoresScreen()));
  put('loadgame.gif', gif(slotsPage('LOAD A GAME', 13)));
  put('savegame.gif', gif(slotsPage('SAVE THIS GAME', 17)));
  put('won.gif', gif(...wonScreen()));
  put('wontxt.gif', gif(page('BEST IN SHOW', 19)));
  put('won.txt', WON);
  lst('won.lst', [['won.gif', 8], ['finale.fli', 0], ['wontxt.gif', 0], ['won.txt']]);
  put('lost.gif', gif(lostScreen()));
  put('losttxt.gif', gif(page('TUCKERED OUT', 23)));
  put('lost.txt', LOST);
  lst('lost.lst', [['lost.gif', 6], ['losttxt.gif', 0], ['lost.txt']]);
  levels.forEach((l, i) => {
    put(`${l.file}.gif`, gif(card(l, i + 1, CARDS[l.file] ?? []), buildPalette(l.time).pal));
    lst(`${l.file}.lst`, [[`${l.file}.gif`, 30]]);
  });
  if (levels.some((l) => l.egg)) {
    const egg = page('THE SECOND PAW EGG', 29);
    drawEgg(egg, 4, 150, 18, 23);
    drawEgg(egg, 298, 150, 18, 23);
    put('egg.gif', gif(egg));
    put('egg.txt', EGG);
    lst('egg.lst', [['egg.gif', 0], ['egg.txt']]);
  }
  put('drive.fli', driveFli());
  put('title.cmf', titleSong());
  put('menu.cmf', menuSong());
  put('story.cmf', storySong());
  put('house.cmf', houseSong());
  put('main.cmf', mainSong());
  put('night.cmf', nightSong());
  put('river.cmf', riverSong());
  put('farm.cmf', farmSong());
  put('maze.cmf', mazeSong());
  put('lot.cmf', lotSong());
  put('midway.cmf', midwaySong());
  put('show.cmf', showSong());
  put('won.cmf', wonSong());
  put('lost.cmf', lostSong());
  put('readme.txt', README);
  return out;
}

/**
 * The ending: the dog show ring under the spotlight, Gwinn sitting (!) with her blue ribbon,
 * Teddy beside her, Doc Leo applauding; a real snapshot of the two of them taped up beside
 * the ribbon board. Returns the picture and its palette.
 */
export function wonScreen(): [Pixels, Uint8Array] {
  const p = new Pixels(W, H, c('ink', 0));
  // the barn's red boards, a spotlight, the ring
  for (let x = 0; x < W; x++) for (let y = 0; y < 150; y++) p.set(x, y, Math.floor(x / 16) % 2 ? c('red', 0) : c('tent', 0));
  for (let y = 0; y < 150; y++) {
    const half = 30 + y * 0.6;
    for (let x = Math.floor(190 - half); x < 190 + half; x++) if ((x + y) % 2 === 0) p.set(x, y, c('glow', 3));
  }
  p.rect(0, 150, W, 50, c('dirt', 2));
  blob(p, 190, 152, 70, 8, SP.r('glow'), 1, 3);
  leoBig(p, 236, 70, 2, undefined, true);
  teddyBig(p, 'frontBeg', 128, 92, 3);
  scaleBlit(p, gwinnSits(false, 1), 176, 72, 4);
  // the blue ribbon on her collar
  p.disc(206, 118, 6, c('blue', 2)).disc(206, 118, 3, c('gold', 2)).rect(202, 124, 3, 10, c('blue', 2)).rect(208, 124, 3, 10, c('blue', 2));
  const R = rng(4);
  for (let i = 0; i < 90; i++) p.rect(Math.floor(R() * W), Math.floor(R() * 150), 2, 2, c(['red', 'yellow', 'blue', 'green', 'pink'][i % 5], 3));
  outlined(p, 110, 166, 'GWINN SAT!', c('yellow', 3), c('ink', 0), 2);
  // taped up beside the ribbon board: a real snapshot of Teddy and Gwinn
  const shot = tone(resample(loadScan('gwinn'), 92, 0, [0.0, 0.02, 1, 0.8]), (v) => v.map((x) => (x - 128) * 1.15 + 124) as [number, number, number]);
  const at = polaroid(p, 12, 22, shot.w, shot.h, { paper: c('cream', 3), edge: c('ink', 0), shadow: c('ink', 0), tape: c('yellow', 3) });
  micro(p, Math.round(at.cx - microWidth('TEDDY & GWINN') / 2), Math.round(at.cy - 2), 'TEDDY & GWINN', c('ink', 0));
  return [p, pastePhoto(p, SP.pal, shot, 12, 22).pal];
}

/** Game over: Teddy asleep in his doghouse under the stars. */
export function lostScreen(): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, 140, [c('ink', 0), c('blue', 0), c('blue', 1)], 0, 2);
  const R = rng(9);
  for (let i = 0; i < 70; i++) p.set(Math.floor(R() * W), Math.floor(R() * 120), c('glow', 3));
  blob(p, 260, 34, 16, 16, SP.r('glow'), 2, 3);
  blob(p, 268, 30, 14, 14, [c('blue', 0)], 0, 0);
  p.rect(0, 140, W, 60, c('grass', 0));
  // the doghouse
  for (let y = 0; y < 40; y++) p.rect(160 - y - 6, 70 + y, y * 2 + 12, 1, c('red', 1));
  p.rect(116, 110, 88, 50, c('wood', 1));
  blob(p, 160, 140, 22, 26, [c('ink', 0)], 0, 0);
  p.rect(138, 140, 44, 20, c('ink', 0));
  teddyBig(p, 'sleep', 130, 104, 3);
  outlined(p, 182, 92, 'Z', c('paint', 3), c('ink', 0), 2);
  outlined(p, 200, 76, 'Z', c('paint', 3), c('ink', 0), 3);
  centered(p, 176, 'TEDDY IS ALL TUCKERED OUT', c('paint', 3), 1, c('ink', 0));
  return p;
}

/**
 * Between stops (an FLI): THE CHEZ, Doc Leo's little red CitiCar, hums on along Gwinn's
 * trail (it is electric: no exhaust, just a whirr), Doc Leo at the wheel behind the door window
 * and Teddy beside him in the front passenger seat, his head out of the window, ears flapping.
 */
export function driveFli(): Uint8Array {
  const frames: Uint8Array[] = [];
  const bg = landscape(11);
  bg.rect(0, 168, W, 32, c('asphalt', 1));
  for (let x = 0; x < W; x += 40) bg.rect(x + 8, 182, 20, 3, c('yellow', 3));
  const leoHead = docLeo(undefined).crop(0, 0, 20, 16);
  for (let f = 0; f < 44; f++) {
    const p = new Pixels(W, H);
    p.px.set(bg.px);
    const x = -200 + f * 12;
    const y = 72 + (f % 2);
    chezRide(
      p,
      x,
      y,
      5,
      CHEZ,
      (q) => scaleBlit(q, leoHead, x + 60, y + 12, 2),
      (q) => scaleBlit(q, POSES[f % 4 < 2 ? 'front' : 'frontTilt'].crop(0, 2, 20, 12), x + 94, y + 18, 2),
    );
    // the electric whirr
    for (let k = 0; k < 3; k++) p.rect(x - 8 - k * 10 - (f % 2) * 3, 150 + k * 7, 8 - k * 2, 1, c('paint', 3));
    if (f > 16 && f < 30) outlined(p, x + 206, 84, 'HONK!', c('yellow', 3), c('ink', 0), 2);
    centered(p, 12, f < 22 ? "ON GWINN'S TRAIL!" : 'THE CHEZ: 100% ELECTRIC', c('paint', 3), 1, c('ink', 0));
    if (f >= 22) centered(p, 24, '(ABOUT A MILE AN HOUR OF CHARGE)', c('paint', 3), 1, c('ink', 0));
    frames.push(Uint8Array.from(p.px));
  }
  return encodeFli(frames, SP.pal, { speed: 4 });
}

export { CLEAR, rng };
