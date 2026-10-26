// The 320x200 screens: the title (an FLI cartoon, then the poster), the menu, the story,
// help and credits pages, a card before each level, and the endings. All share one
// palette (the game's ramps plus a few inks), so Game-Maker's text colors come out the same.
import { encodeGif } from '../../../../web/src/formats/gif';
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, blob, centered, gradient, clubArt, micro, outlined, scaleBlit, text, textWidth } from '../art/draw';
import { saveSlots } from '../../../kit/saveSlots';
import { buildPalette, buildScreenPalette, type Pal } from '../art/pal';
import { POSES } from '../sprites/teddy';
import { GWINN } from '../sprites/gwinn';
import { GWINN_HERO } from '../sprites/gwinnHero';
import { LEO, docLeo } from '../sprites/leo';
import { CHEZ_HERO, CHEZ_INK } from '../sprites/chezHero';
import { chezSide } from '../../../kit/chez';
import { renderRegion } from '../art/render';
import type { Level } from '../levels/level';
import { LEVEL_SONGS, lostSong, menuSong, storySong, titleSong, wonSong } from '../sound/music';
import { CREDITS, EGG, HELP, LOST, README, STORY, WON, CARDS } from './text';
import { drawEgg } from '../sprites/egg';
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

/** The logo: TEDDY'S / LITTLE BIGGEST / ADVENTURE in chunky outlined letters. */
function logo(p: Pixels, y: number, cx = W / 2): void {
  // each line drawn on its own, then squeezed from side to side if it is wider than the screen
  const line = (s: string, yy: number, scale: number, fill: number, edge: number) => {
    const w = textWidth(s, scale) + 5;
    const art = new Pixels(w, 8 * scale + 5, CLEAR);
    for (const [dx, dy] of [
      [3, 4],
      [4, 4],
    ])
      text(art, dx, dy, s, c('ink', 0), scale);
    outlined(art, 1, 1, s, fill, edge, scale);
    const fit = Math.min(w, W - 6);
    const out = new Pixels(fit, art.h, CLEAR);
    for (let x = 0; x < fit; x++) for (let k = 0; k < art.h; k++) out.set(x, k, art.get(Math.floor((x * w) / fit), k));
    p.blit(out, Math.round(cx - fit / 2), yy - 1, CLEAR);
  };
  line("TEDDY'S", y, 2, c('corgi', 3), c('ink', 0));
  line('LITTLE BIGGEST', y + 20, 3, c('yellow', 3), c('red', 1));
  line('ADVENTURE', y + 46, 3, c('red', 3), c('ink', 0));
}

/** THE CHEZ parked (the shared side view, `s` pixels a unit), its box's top left at (x, y). */
function chezBig(p: Pixels, x: number, y: number, s: number, facing: 'left' | 'right' = 'left'): void {
  chezSide(p, x, y, CHEZ_INK, facing, s);
}

/** Scaled pictures of the cast. */
function teddyBig(p: Pixels, pose: string, x: number, y: number, s: number, flip = false): void {
  scaleBlit(p, POSES[pose], x, y, s, flip);
}
function gwinnBig(p: Pixels, pose: string, x: number, y: number, s: number, flip = false): void {
  scaleBlit(p, GWINN[pose], x, y, s, flip);
}
function leoBig(p: Pixels, x: number, y: number, s: number, wave = false): void {
  scaleBlit(p, docLeo(wave), x, y, s);
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
  // Doc Leo and Teddy on the left; THE CHEZ and Gwinn on the right
  leoBig(p, 6, 100, 2, true);
  teddyBig(p, 'frontBeg', 16, 140, 2);
  chezBig(p, 262, 112, 1.4);
  gwinnBig(p, 'gwinn1', 272, 142, 2, true);
  micro(p, 66, 189, 'SANDBOX SOFTWARE  SHAREWARE  1997', c('paint', 3));
  return p;
}

/** The title poster. */
export function titleScreen(): Pixels {
  const p = landscape(7);
  logo(p, 6);
  // all four heroes: Teddy, Doc Leo, Gwinn, and THE CHEZ waiting
  teddyBig(p, 'frontBeg', 2, 100, 4);
  leoBig(p, 88, 96, 2, true);
  gwinnBig(p, 'gwinnRun1', 132, 120, 3);
  chezBig(p, 196, 120, 3);
  // a trail of confetti across the grass
  for (let i = 0; i < 30; i++) p.rect(60 + i * 8, 180 + ((i * 5) % 9), 2, 2, c(['red', 'yellow', 'blue', 'green', 'pink'][i % 5], 3));
  centered(p, 190, '(C) 1997 SANDBOX SOFTWARE', c('paint', 3), 1, c('ink', 0));
  return p;
}

/**
 * A card's big title: double size, or, when that would run off the card, condensed (double
 * height, single width) so a long one like Level 15's still fits on one line.
 */
function cardTitle(p: Pixels, x: number, y: number, s: string, col: number, edge: number): void {
  if (x + textWidth(s, 2) <= W - 8) return outlined(p, x, y, s, col, edge, 2);
  const t = new Pixels(textWidth(s) + 2, 10, CLEAR);
  outlined(t, 1, 1, s, col, edge, 1);
  for (let ty = 0; ty < t.h; ty++)
    for (let tx = 0; tx < t.w; tx++) {
      const v = t.px[ty * t.w + tx];
      if (v !== CLEAR) p.rect(x - 1 + tx, y - 2 + ty * 2, 1, 2, v);
    }
}

/** A level card: a framed view of the level, where it falls (LEVEL 2 OF n), and what is new there. */
export function card(l: Level, n: number, of: number, lines: string[]): Pixels {
  const pal = buildPalette(l.time);
  const cc = (name: string, k: number) => pal.c(name, k);
  const p = new Pixels(W, H, cc('ink', 0));
  const map = l.map.done();
  const extra: { pixels: Uint8Array; x: number; y: number }[] = [];
  if (l.pose) {
    const [x, y, name] = l.pose;
    if (l.hero === 'leo') {
      const fig = LEO[name];
      extra.push({ pixels: fig.crop(0, 0, 20, 20).px, x, y: y - 1 }, { pixels: fig.crop(0, 20, 20, 20).px, x, y });
    } else extra.push({ pixels: (l.hero === 'gwinn' ? GWINN_HERO : l.hero === 'chez' ? CHEZ_HERO : POSES)[name].px, x, y });
  }
  const view = renderRegion(map, l.bs.build(), l.beasts.mb.build(), l.beasts.build(), l.view[0], l.view[1], 15, 5, extra);
  p.rect(8, 8, 304, 104, cc('paint', 3));
  p.blit(view, 10, 10);
  outlined(p, 16, 120, n === of ? `FINAL LEVEL: ${n} OF ${of}` : `LEVEL ${n} OF ${of}`, cc('yellow', 3), cc('red', 1), 1);
  cardTitle(p, 16, 132, clubArt(l.title.toUpperCase()), cc('paint', 3), cc('ink', 1));
  lines.forEach((s, i) => text(p, 16, 154 + i * 10, clubArt(s), cc(s.startsWith('NEW') ? 'yellow' : 'paint', 3)));
  return p;
}

/** The cartoon that tells the story before the story pages (built in birthday.ts). */
const STORY_REEL: [string, number][] = [['birthday.fli', 0]];

/** "Starring...": the cast in close-up before the credits (built in cast.ts). */
const CAST_REEL: [string, number][] = [['cast.fli', 0]];

export function buildScreens(levels: Level[]): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  const put = (name: string, bytes: Uint8Array | string) => (out[name] = typeof bytes === 'string' ? dosText(bytes) : bytes);
  const lst = (name: string, entries: [string, number?][]) => put(name, serializeSlideList(entries.map(([n, pause]) => ({ name: n, pause }))));

  put('title.gif', gif(titleScreen()));
  put(SANDLOGO, sandLogoFli());
  // After the Sandbox Software logo, the birthday morning (it ends on the poster), then the poster.
  lst('title.lst', [
    [SANDLOGO, 0],
    ['birthday.fli', 0],
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
  // won.gif, lost.gif and the cartoons are built in cartoons.ts
  put('wontxt.gif', gif(page('SURPRISE!', 19)));
  put('won.txt', WON);
  lst('won.lst', [['surprise.fli', 0], ['won.gif', 10], ['wontxt.gif', 0], ['won.txt']]);
  put('losttxt.gif', gif(page('TUCKERED OUT', 23)));
  put('lost.txt', LOST);
  lst('lost.lst', [['lost.gif', 6], ['losttxt.gif', 0], ['lost.txt']]);
  levels.forEach((l, i) => {
    put(`${l.file}.gif`, gif(card(l, i + 1, levels.length, l.card ?? CARDS[l.file] ?? []), buildPalette(l.time).pal));
    lst(`${l.file}.lst`, [[`${l.file}.gif`, 30]]);
  });
  if (levels.some((l) => l.egg)) {
    const egg = page('THE BIRTHDAY EGG', 29);
    drawEgg(egg, 4, 150, 18, 23);
    drawEgg(egg, 298, 150, 18, 23);
    put('egg.gif', gif(egg));
    put('egg.txt', EGG);
    lst('egg.lst', [['egg.gif', 0], ['egg.txt']]);
  }
  put('title.cmf', titleSong());
  put('menu.cmf', menuSong());
  put('story.cmf', storySong());
  for (const l of levels) put(`${l.file}.cmf`, (l.song ?? LEVEL_SONGS[l.file])());
  put('won.cmf', wonSong());
  put('lost.cmf', lostSong());
  put('readme.txt', README);
  return out;
}

export { CLEAR, rng };
