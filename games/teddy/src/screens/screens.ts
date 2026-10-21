// The 320x200 screens: the title (an FLI cartoon, then the poster), the menu, the story,
// help and credits pages, a card before each level, and the endings. All share one
// palette (the game's ramps plus a few inks), so Game-Maker's text colors come out the same.
import { encodeGif } from '../../../../web/src/formats/gif';
import { encodeFli } from '../../../../web/src/formats/fli';
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { Pixels, rng } from '../../../kit/pixels';
import { CLEAR, blob, centered, gradient, klubArt, micro, outlined, scaleBlit, text, textWidth } from '../art/draw';
import { buildPalette, buildScreenPalette, type Pal } from '../art/pal';
import { POSES } from '../sprites/teddy';
import { GWINN } from '../sprites/gwinn';
import { docLeo, type Costume } from '../sprites/people';
import { citiCar, propSprite } from '../sprites/klown';
import { renderRegion } from '../art/render';
import type { Level } from '../levels/level';
import { backyardSong, citySong, klubSong, lostSong, menuSong, parkSong, storySong, streetSong, titleSong, wonSong } from '../sound/music';
import { CREDITS, HELP, LOST, README, STORY, WON, CARDS } from './text';
import { dosText } from '../../../kit/disk';
import { SANDLOGO, sandLogoFli } from '../../../kit/sandlogo';

export const SP: Pal = buildScreenPalette();
const c = (n: string, k: number) => SP.c(n, k);
const W = 320;
const H = 200;

export function gif(p: Pixels, pal: Uint8Array = SP.pal): Uint8Array {
  return encodeGif({ width: p.w, height: p.h, pixels: Uint8Array.from(p.px), palette: pal });
}

/** A big puffy sky with the town far away and the Klown Klub's big top on the horizon. */
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
    // the Klown Klub's big top: red and white stripes, a flag
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

/** The logo: TEDDY'S / LITTLE BIG / ADVENTURE in chunky outlined letters. */
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
  line('LITTLE BIG', y + 20, 3, c('yellow', 3), c('red', 1));
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
  plate(12, 22, 296, 160);
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
  micro(p, 66, 189, 'SANDBOX SOFTWARE  SHAREWARE  1995', c('paint', 3));
  return p;
}

/** The title poster. */
export function titleScreen(): Pixels {
  const p = landscape(7);
  logo(p, 6);
  leoBig(p, 136, 92, 2, undefined, true);
  teddyBig(p, 'frontBeg', 40, 108, 4);
  gwinnBig(p, 'gwinn1', 200, 112, 4);
  // Doc Leo's suitcase in Gwinn's mouth, a costume piece popping out
  p.rect(272, 140, 34, 24, c('wood', 1)).rect(272, 140, 34, 3, c('wood', 3)).rect(272, 151, 34, 2, c('gold', 1)).rect(283, 135, 12, 5, c('wood', 0));
  scaleBlit(p, propSprite('nose'), 276, 100, 2);
  scaleBlit(p, propSprite('tie'), 290, 112, 2);
  centered(p, 186, '(C) 1995 SANDBOX SOFTWARE', c('paint', 3), 1, c('ink', 0));
  return p;
}

/** A level card: a framed view of the level and what is new there. */
export function card(l: Level, n: number, lines: string[]): Pixels {
  const pal = buildPalette(l.time);
  const cc = (name: string, k: number) => pal.c(name, k);
  const p = new Pixels(W, H, cc('ink', 0));
  const map = l.map.done();
  const extra = l.pose ? [{ pixels: POSES[l.pose[2]].px, x: l.pose[0], y: l.pose[1] }] : [];
  const view = renderRegion(map, l.bs.build(), l.beasts.mb.build(), l.beasts.build(), l.view[0], l.view[1], 15, 5, extra);
  p.rect(8, 8, 304, 104, cc('paint', 3));
  p.blit(view, 10, 10);
  outlined(p, 16, 120, `LEVEL ${n}`, cc('yellow', 3), cc('red', 1), 1);
  outlined(p, 16, 132, klubArt(l.title.toUpperCase()), cc('paint', 3), cc('ink', 1), 2);
  lines.forEach((s, i) => text(p, 16, 154 + i * 10, s, cc(s.startsWith('NEW') ? 'yellow' : 'paint', 3)));
  return p;
}

/** The cartoons that tell the story before the story pages (built in cartoons.ts). */
const STORY_REEL: [string, number][] = [
  ['leo.fli', 0],
  ['car.fli', 0],
  ['intro.fli', 0],
];

/** "Starring...": the cast in close-up before the credits (built in cast.ts). */
const CAST_REEL: [string, number][] = [['cast.fli', 0]];

export function buildScreens(levels: Level[]): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  const put = (name: string, bytes: Uint8Array | string) => (out[name] = typeof bytes === 'string' ? dosText(bytes) : bytes);
  const lst = (name: string, entries: [string, number?][]) => put(name, serializeSlideList(entries.map(([n, pause]) => ({ name: n, pause }))));

  put('title.gif', gif(titleScreen()));
  put(SANDLOGO, sandLogoFli());
  put('intro.fli', introFli());
  // The story told as a slide show of cartoons: Doc Leo's clown act, his CitiCar, then Gwinn.
  // (after the Sandbox Software logo)
  lst('title.lst', [
    [SANDLOGO, 0],
    ['leo.fli', 0],
    ['car.fli', 0],
    ['intro.fli', 0],
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
  put('loadgame.gif', gif(page('LOAD A GAME', 13)));
  put('savegame.gif', gif(page('SAVE THIS GAME', 17)));
  put('won.gif', gif(wonScreen()));
  put('wontxt.gif', gif(page('THE BIG SHOW', 19)));
  put('won.txt', WON);
  lst('won.lst', [['won.gif', 8], ['parade.fli', 0], ['wontxt.gif', 0], ['won.txt']]);
  put('lost.gif', gif(lostScreen()));
  put('losttxt.gif', gif(page('TUCKERED OUT', 23)));
  put('lost.txt', LOST);
  lst('lost.lst', [['lost.gif', 6], ['losttxt.gif', 0], ['lost.txt']]);
  levels.forEach((l, i) => {
    put(`${l.file}.gif`, gif(card(l, i + 1, CARDS[l.file] ?? []), buildPalette(l.time).pal));
    lst(`${l.file}.lst`, [[`${l.file}.gif`, 30]]);
  });
  put('drive.fli', driveFli());
  put('title.cmf', titleSong());
  put('menu.cmf', menuSong());
  put('story.cmf', storySong());
  put('backyard.cmf', backyardSong());
  put('street.cmf', streetSong());
  put('park.cmf', parkSong());
  put('city.cmf', citySong());
  put('klub.cmf', klubSong());
  put('won.cmf', wonSong());
  put('lost.cmf', lostSong());
  put('readme.txt', README);
  return out;
}

/** The ending: Teddy takes a bow at the Big Show. */
export function wonScreen(): Pixels {
  const p = new Pixels(W, H, c('ink', 0));
  // the big top inside: stripes and a spotlight
  for (let x = 0; x < W; x++) for (let y = 0; y < 150; y++) p.set(x, y, Math.floor((x + (150 - y) * 0.4) / 20) % 2 ? c('tent', 1) : c('tent', 0));
  for (let y = 0; y < 150; y++) {
    const half = 20 + y * 0.6;
    for (let x = Math.floor(160 - half); x < 160 + half; x++) if ((x + y) % 2 === 0) p.set(x, y, c('glow', 3));
  }
  p.rect(0, 150, W, 50, c('wood', 2));
  for (let x = 0; x < W; x += 24) p.rect(x, 150, 1, 50, c('wood', 0));
  blob(p, 160, 152, 60, 8, SP.r('glow'), 1, 3);
  leoBig(p, 176, 70, 2, undefined, true);
  teddyBig(p, 'frontReach', 104, 92, 3);
  gwinnBig(p, 'gwinnRoll', 220, 126, 2);
  const R = rng(4);
  for (let i = 0; i < 90; i++) p.rect(Math.floor(R() * W), Math.floor(R() * 150), 2, 2, c(['red', 'yellow', 'blue', 'green', 'pink'][i % 5], 3));
  outlined(p, 64, 166, 'TA-DAAA!', c('yellow', 3), c('ink', 0), 3);
  return p;
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
 * The intro cartoon (FLI): the backyard at dawn; Gwinn bounds across with Doc Leo's
 * suitcase, costume pieces flying out; Teddy pops out of his doghouse and gives chase;
 * then the logo drops in.
 */
export function introFli(): Uint8Array {
  const frames: Uint8Array[] = [];
  const bg = landscape(2);
  // the doghouse at left
  for (let y = 0; y < 30; y++) bg.rect(54 - y, 110 + y, y * 2 + 8, 1, c('red', 1 + (y % 3 === 0 ? 0 : 1)));
  bg.rect(26, 140, 64, 34, c('wood', 2));
  blob(bg, 58, 160, 12, 14, [c('ink', 0)], 0, 0);
  bg.rect(46, 160, 24, 14, c('ink', 0));
  const add = (p: Pixels, n = 1) => {
    for (let i = 0; i < n; i++) frames.push(Uint8Array.from(p.px));
  };
  const props = ['hat', 'tie', 'shoes', 'chicken', 'nose'];
  const caption = (p: Pixels, words: string) => centered(p, 10, words, c('paint', 3), 1, c('ink', 0));
  // 1. Gwinn runs across, props flying
  for (let f = 0; f < 26; f++) {
    const p = new Pixels(W, H);
    p.px.set(bg.px);
    const gx = -60 + f * 16;
    gwinnBig(p, f % 2 ? 'gwinnRun1' : 'gwinnRun2', gx, 128, 3);
    // the suitcase in her mouth
    p.rect(gx + 50, 150, 16, 12, c('wood', 1)).rect(gx + 54, 147, 8, 3, c('wood', 0));
    props.forEach((name, i) => {
      const t = f - 4 - i * 4;
      if (t < 0) return;
      const px = gx + 40 - t * 9;
      const py = 150 - t * 14 + t * t * 1.4;
      if (py < H) scaleBlit(p, propSprite(name), px, py, 2);
    });
    if (f > 14) teddyBig(p, 'frontTilt', 28, 128, 3);
    caption(p, f < 13 ? 'THE MORNING OF THE BIG SHOW...' : "GWINN! DOC LEO'S COSTUME!");
    add(p);
  }
  // 2. Teddy barks after her
  for (let f = 0; f < 10; f++) {
    const p = new Pixels(W, H);
    p.px.set(bg.px);
    teddyBig(p, f % 4 < 2 ? 'frontBark' : 'front', 28, 128, 3);
    if (f % 4 < 2) outlined(p, 92, 120, 'WOOF!', c('yellow', 3), c('ink', 0), 2);
    caption(p, 'NO NOSE, NO SHOW!');
    add(p);
  }
  // 3. ...and runs after her
  for (let f = 0; f < 18; f++) {
    const p = new Pixels(W, H);
    p.px.set(bg.px);
    teddyBig(p, f % 2 ? 'walk1' : 'walk2', 28 + f * 18, 140, 3);
    caption(p, 'TEDDY TO THE RESCUE!');
    add(p);
  }
  // 4. The logo drops in, bouncing
  const title = titleScreen();
  for (let f = 0; f < 14; f++) {
    const p = landscape(7);
    const drop = Math.round(-90 * Math.cos((f / 13) * Math.PI * 2.5) * (1 - f / 13));
    logo(p, 6 + Math.min(0, drop) + (drop > 0 ? Math.round(drop / 6) : 0));
    add(p);
  }
  add(title, 3);
  return encodeFli(frames, SP.pal, { speed: 6 });
}

/**
 * Between stops (an FLI): Doc Leo's little red CitiCar hums across town (it is electric:
 * no exhaust, just a whirr), Pockets at the wheel and Teddy's head out of the back window.
 */
export function driveFli(): Uint8Array {
  const frames: Uint8Array[] = [];
  const bg = landscape(11);
  bg.rect(0, 168, W, 32, c('asphalt', 1));
  for (let x = 0; x < W; x += 40) bg.rect(x + 8, 182, 20, 3, c('yellow', 3));
  const carPic = new Pixels(40, 40, CLEAR);
  citiCar(carPic, 0, 0);
  for (let f = 0; f < 44; f++) {
    const p = new Pixels(W, H);
    p.px.set(bg.px);
    const x = -130 + f * 11;
    const bob = f % 2;
    scaleBlit(p, carPic, x, 66 + bob, 3);
    // Pockets' bowler behind the door window; Teddy's head out of the back window, ears flapping
    p.rect(x + 40, 104 + bob, 16, 3, c('ink', 0)).rect(x + 43, 97 + bob, 10, 7, c('ink', 0));
    scaleBlit(p, POSES[f % 4 < 2 ? 'front' : 'frontTilt'].crop(0, 4, 20, 10), x - 4, 92 + bob, 2);
    // the electric whirr
    for (let k = 0; k < 3; k++) p.rect(x - 14 - k * 10 - (f % 2) * 3, 150 + k * 7, 8 - k * 2, 1, c('paint', 3));
    if (f > 16 && f < 30) outlined(p, x + 124, 84, 'HONK!', c('yellow', 3), c('ink', 0), 2);
    centered(p, 12, f < 22 ? 'OFF TO THE NEXT STOP!' : "DOC LEO'S CITICAR: 100% ELECTRIC", c('paint', 3), 1, c('ink', 0));
    frames.push(Uint8Array.from(p.px));
  }
  return encodeFli(frames, SP.pal, { speed: 4 });
}

export { CLEAR, rng };
