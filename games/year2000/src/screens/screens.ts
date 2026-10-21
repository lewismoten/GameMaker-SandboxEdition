// The 320x200 pictures: the title, the menu (on a TV, of course), the illustrated
// storyline, notebook-paper text pages, level cards, the endings, and the FLI
// animations: the intro counting from 1992 up to 2000, the teleporter, and the rocket.
// The painting helpers are in paint.ts, the animations in animations.ts.
import { Pixels, dither, rng } from '../../../kit/pixels';
import { blob, gradient, oval, shadeAt } from '../art/draw';
import { micro, microWidth, outlined, text, textWidth } from '../art/font';
import { C } from '../art/pal';
import { H, R, W, centeredText, chrome, chromeCentered, consoleTv, grid, scaleBlit, skyline, speedLines, stripedSun, sunsetSky, type Art } from './paint';

// ------------------------------------------------------------------ title
export function titleScreen(a: Art): Pixels {
  const p = new Pixels(W, H);
  sunsetSky(p, 140);
  stripedSun(p, 160, 140, 46);
  skyline(p, 140);
  grid(p, 140);
  // Flying cars streak across.
  scaleBlit(p, a.car, 18, 92, 2);
  speedLines(p, 18, 92, 30, C('pink', 5));
  scaleBlit(p, a.carT, 236, 100, 2, true);
  scaleBlit(p, a.truck, 196, 122, 1, true);
  chromeCentered(p, 8, 'IN THE YEAR', 3);
  chromeCentered(p, 40, '2000!', 7, true);
  // Dex and Sparky on the grid.
  scaleBlit(p, a.dex, 30, 138, 3);
  scaleBlit(p, a.sparky, 238, 152, 2, true);
  p.rect(0, 186, W, 14, C('night', 0));
  centeredText(p, 189, 'SANDBOX SOFTWARE  (C) 1992', C('teal', 5));
  return p;
}

// ------------------------------------------------------------------ menu
export function menuScreen(a: Art): Pixels {
  const p = new Pixels(W, H);
  sunsetSky(p, 120, 9);
  grid(p, 120);
  consoleTv(p, 66, 96, 190, 84, C('paper', 2));
  // A faint scanline texture on the screen, light enough for the menu text.
  for (let y = 96; y < 180; y += 2) for (let x = 66; x < 256; x++) if (dither(x, y, 0.15)) p.set(x, y, C('paper', 1));
  chromeCentered(p, 6, 'IN THE YEAR 2000!', 2);
  micro(p, 70, 172, 'CHANNEL 2000', C('grey', 4));
  scaleBlit(p, a.dex, 6, 132, 3);
  scaleBlit(p, a.alien, 268, 140, 2, true);
  return p;
}

// ------------------------------------------------------------------ text pages
/** A sheet of Dex's notebook paper under a chrome heading: Display_File writes on the lines. */
export function paperScreen(heading: string, a: Art, deco: 'pages' | 'stars' | 'credits'): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, H, R('purple'), 0, 2);
  const r = rng(heading.length);
  for (let i = 0; i < 60; i++) p.set(Math.floor(r() * W), Math.floor(r() * H), C('purple', 3));
  // The paper.
  p.rect(30, 32, 266, 156, C('grey', 1));
  p.rect(28, 30, 266, 156, C('paper', 2));
  for (let y = 46; y < 184; y += 8) p.rect(28, y, 266, 1, C('sky', 6));
  p.rect(36, 30, 1, 156, C('red', 4));
  for (const y of [52, 108, 164]) oval(p, 32, y, 2.5, 2.5, C('purple', 1));
  chromeCentered(p, 6, heading, 2);
  if (deco === 'pages') {
    scaleBlit(p, a.page, 290, 150, 1);
    scaleBlit(p, a.sparky, 288, 168, 1, true);
  } else if (deco === 'credits') {
    scaleBlit(p, a.alien, 296, 160, 1, true);
  } else scaleBlit(p, a.zapper, 294, 162, 1);
  return p;
}

// ------------------------------------------------------------------ the story
function caption(p: Pixels, lines: string[], ink = C('grey', 7), bg = C('night', 0)): void {
  const h = lines.length * 10 + 8;
  p.rect(0, H - h, W, h, bg);
  p.rect(0, H - h, W, 1, C('pink', 4));
  lines.forEach((s, i) => centeredText(p, H - h + 5 + i * 10, s, ink));
}

export function storyScreens(a: Art): Pixels[] {
  const out: Pixels[] = [];
  // 1. The neighborhood.
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, 100, R('sky'), 2, 6);
    for (let y = 100; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, Math.floor(x / 20) % 2 ? C('green', 2) : C('green', 3));
    skyline(p, 100, 5, 'sky');
    oval(p, 90, 120, 60, 40, C('chrome', 6));
    for (let y = 80; y < 121; y++)
      for (let x = 30; x < 151; x++) if ((x - 90) ** 2 / 3600 + (y - 120) ** 2 / 1600 <= 1) p.set(x, y, shadeAt(R('chrome'), 3, 7, 1 - (x - 30) / 140, x, y));
    p.rect(30, 121, 121, 30, C('green', 2));
    for (let x = 36; x < 146; x += 12) p.rect(x, 96, 8, 8, C('glass', 2));
    scaleBlit(p, a.mower, 180, 112, 2);
    scaleBlit(p, a.car, 210, 30, 2);
    speedLines(p, 210, 30, 24, C('grey', 7));
    scaleBlit(p, a.boothTop, 280, 96, 2);
    scaleBlit(p, a.booth, 280, 136, 2);
    scaleBlit(p, a.alien, 150, 120, 2);
    chromeCentered(p, 4, 'HOVER HEIGHTS', 2);
    caption(p, ['THE YEAR 2000. CARS FLY. ROBOTS MOW.', 'ALIENS LIVE NEXT DOOR. AND THERE IS A', 'PHONE BOOTH ON EVERY SINGLE CORNER.']);
    out.push(p);
  }
  // 2. Dex and his report.
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, R('teal'), 1, 3);
    p.rect(40, 20, 120, 130, C('paper', 2));
    for (let y = 34; y < 150; y += 7) p.rect(40, y, 120, 1, C('sky', 5));
    p.rect(52, 20, 1, 130, C('red', 4));
    text(p, 58, 26, 'THE POCKET', C('denim', 1));
    text(p, 58, 36, 'TELEPHONE', C('denim', 1));
    text(p, 58, 50, 'BY DEX', C('denim', 2));
    micro(p, 58, 70, 'A PHONE YOU CARRY', C('denim', 2));
    micro(p, 58, 78, 'IN YOUR POCKET!!', C('denim', 2));
    micro(p, 58, 90, '20 PAGES. NO', C('denim', 2));
    micro(p, 58, 98, 'WIRES. NO BOOTH.', C('denim', 2));
    p.rect(126, 116, 14, 26, C('grey', 1)).rect(128, 118, 10, 8, C('neon', 2)).line(138, 116, 142, 104, C('grey', 2));
    scaleBlit(p, a.dex, 190, 40, 5);
    chromeCentered(p, 160 - 10, '', 2);
    caption(p, ['DEX DYNAMO, AGE 11, WROTE THE BEST', 'SCIENCE FAIR REPORT IN THE SOLAR SYSTEM:', '"THE POCKET TELEPHONE." 20 WHOLE PAGES.']);
    out.push(p);
  }
  // 3. Sparky ate it.
  {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, R('red'), 0, 2);
    for (let k = 0; k < 24; k++) {
      const ang = (k / 24) * Math.PI * 2;
      p.line(160, 80, 160 + Math.cos(ang) * 260, 80 + Math.sin(ang) * 260, k % 2 ? C('red', 3) : C('orange', 3));
    }
    scaleBlit(p, a.sparkyMad, 90, 20, 7);
    const r = rng(4);
    for (let i = 0; i < 9; i++) {
      const x = 20 + r() * 270;
      const y = 10 + r() * 120;
      scaleBlit(p, a.page, x, y, 2);
    }
    chrome(p, 10, 6, 'CHOMP!', 3, true);
    caption(p, ['THEN SPARKY 3000, THE ROBOT DOG,', 'ATE IT. EVERY PAGE. AND RAN OFF WITH', 'THE COVER IN HIS MOUTH. BAD DOG!']);
    out.push(p);
  }
  // 4. The Moon at 3:00.
  {
    const p = new Pixels(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, C('night', y < 100 ? 0 : 1));
    const r = rng(8);
    for (let i = 0; i < 120; i++) p.set(Math.floor(r() * W), Math.floor(r() * H), C('grey', 4 + Math.floor(r() * 4)));
    blob(p, 230, 80, 60, 60, R('moon'), 1, 5);
    for (const [x, y, s] of [
      [210, 60, 9],
      [250, 100, 12],
      [235, 40, 6],
    ])
      oval(p, x, y, s, s * 0.8, C('moon', 1));
    blob(p, 50, 150, 30, 30, R('sky'), 1, 5);
    blob(p, 44, 142, 10, 8, R('green'), 2, 4);
    // The school's clock: 3:00.
    oval(p, 110, 60, 34, 34, C('paper', 2));
    p.ring(110, 60, 34, C('chrome', 3));
    p.line(110, 60, 110, 34, C('grey', 0)).line(110, 60, 130, 60, C('grey', 0));
    for (let k = 0; k < 12; k++) p.set(110 + Math.cos((k * Math.PI) / 6) * 29, 60 + Math.sin((k * Math.PI) / 6) * 29, C('grey', 0));
    caption(p, ['AND THE SCIENCE FAIR IS TODAY... ON', 'THE MOON. AT 3:00. FIND EVERY PAGE,', 'CATCH SPARKY, AND GET THERE ON TIME!']);
    out.push(p);
  }
  return out;
}

// ------------------------------------------------------------------ level cards
export function levelCard(n: number, title: string, lines: string[], view: Pixels): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, H, R('night'), 0, 3);
  p.blit(view, 0, 46);
  p.rect(0, 45, W, 1, C('pink', 4)).rect(0, 46 + view.h, W, 1, C('pink', 4));
  chrome(p, 8, 6, `LEVEL ${n}`, 2, true);
  const tx = 8 + textWidth(`LEVEL ${n}`, 2) + 14;
  text(p, tx + 1, 13, title, C('grey', 0));
  text(p, tx, 12, title, C('teal', 5));
  p.rect(tx, 23, textWidth(title), 1, C('teal', 3));
  lines.forEach((s, i) => text(p, 10, 152 + i * 11, s, i === lines.length - 1 ? C('gold', 5) : C('grey', 7)));
  return p;
}

// ------------------------------------------------------------------ endings
export function wonScreen1(a: Art): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, 90, R('gold'), 1, 2);
  for (let y = 90; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, y % 10 === 0 ? C('wood', 2) : C('wood', 3));
  // Banner.
  p.rect(40, 6, 240, 18, C('denim', 2)).frame(40, 6, 240, 18, C('chrome', 6));
  centeredText(p, 11, 'MOON SCHOOL SCIENCE FAIR 2000', C('gold', 5), C('grey', 0));
  // The podium: Dex on the second step, first place goes to a robot that folds laundry.
  const step = (x: number, y: number, n: string) => {
    p.rect(x, y, 56, 170 - y, C('gold', 3))
      .rect(x, y, 56, 4, C('gold', 5))
      .frame(x, y, 56, 170 - y, C('gold', 1));
    micro(p, x + 24, y + 12, n, C('gold', 1), 2);
  };
  step(84, 124, '2');
  step(140, 104, '1');
  step(196, 134, '3');
  scaleBlit(p, a.dex, 82, 64, 3);
  // The robot: chrome box, red eyes, a folded shirt in each hand.
  p.rect(156, 54, 24, 50, C('chrome', 4)).rect(156, 54, 24, 3, C('chrome', 6)).frame(156, 54, 24, 50, C('chrome', 1));
  p.rect(158, 36, 20, 16, C('chrome', 5)).frame(158, 36, 20, 16, C('chrome', 1));
  p.rect(162, 42, 3, 3, C('red', 4)).rect(171, 42, 3, 3, C('red', 4));
  p.line(168, 36, 168, 28, C('chrome', 3)).set(168, 27, C('red', 4));
  p.rect(140, 70, 16, 4, C('chrome', 3)).rect(132, 66, 12, 8, C('pink', 3));
  p.rect(180, 70, 16, 4, C('chrome', 3)).rect(192, 66, 12, 8, C('teal', 4));
  // Dex's ribbon.
  oval(p, 104, 100, 6, 6, C('red', 3));
  p.rect(101, 105, 3, 8, C('red', 2)).rect(105, 105, 3, 8, C('red', 2));
  micro(p, 103, 98, '2', C('grey', 7));
  scaleBlit(p, a.sparky, 244, 124, 2, true);
  scaleBlit(p, a.cover, 276, 140, 1);
  // The judges' verdict.
  p.rect(4, 26, 84, 38, C('paper', 2)).frame(4, 26, 84, 38, C('grey', 0));
  p.line(70, 64, 86, 74, C('grey', 0));
  micro(p, 8, 30, 'A PHONE IN YOUR', C('denim', 1));
  micro(p, 8, 38, 'POCKET? WHO', C('denim', 1));
  micro(p, 8, 46, 'WOULD WANT THAT?', C('denim', 1));
  micro(p, 8, 55, 'SECOND PLACE!', C('red', 2));
  caption(
    p,
    ['YOU MADE IT! SECOND PLACE IN THE WHOLE', 'SOLAR SYSTEM. FIRST PLACE: A ROBOT THAT', 'FOLDS LAUNDRY. THE FUTURE IS AMAZING!'],
    C('grey', 7),
    C('night', 0),
  );
  return p;
}

export function wonScreen2(a: Art): Pixels {
  const p = new Pixels(W, H);
  sunsetSky(p, 150, 21);
  skyline(p, 150, 8);
  grid(p, 150);
  chromeCentered(p, 10, 'THE END', 4, true);
  const lines = [
    'NOBODY EVER BUILT A POCKET PHONE.',
    "WHY WOULD THEY? THERE'S A BOOTH",
    'ON EVERY CORNER, AND IT ONLY',
    'COSTS A QUARTER TO TELEPORT.',
    '',
    'SPARKY ATE THE TROPHY.',
  ];
  p.rect(30, 52, 260, lines.length * 11 + 10, C('night', 0));
  lines.forEach((s, i) => centeredText(p, 58 + i * 11, s, i === lines.length - 1 ? C('gold', 5) : C('grey', 7)));
  scaleBlit(p, a.dex, 34, 140, 2);
  scaleBlit(p, a.sparky, 262, 158, 2, true);
  centeredText(p, 188, 'THANKS FOR PLAYING!', C('teal', 5), C('grey', 0));
  return p;
}

export function lostScreen(a: Art): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, H, R('night'), 0, 3);
  // Living-room carpet and a TV showing the bad news.
  for (let y = 150; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, dither(x, y, 0.4) ? C('orange', 1) : C('orange', 0));
  consoleTv(p, 120, 70, 120, 72, C('sky', 4));
  gradient(p, 120, 70, 120, 72, R('sky'), 2, 4);
  micro(p, 126, 76, 'NEWS 2000', C('gold', 5));
  micro(p, 126, 90, 'SCIENCE FAIR', C('grey', 7));
  micro(p, 126, 98, 'WINNER: A ROBOT', C('grey', 7));
  micro(p, 126, 106, 'THAT FOLDS', C('grey', 7));
  micro(p, 126, 114, 'LAUNDRY', C('grey', 7));
  scaleBlit(p, a.dexUp, 40, 100, 3);
  scaleBlit(p, a.sparky, 10, 160, 1);
  chromeCentered(p, 8, 'GAME OVER', 4, true);
  caption(p, ['YOU MISSED THE SCIENCE FAIR. SPARKY', 'IS VERY SORRY. HE ATE THE TV GUIDE', 'TOO. TRY AGAIN - THE FUTURE CAN WAIT!']);
  return p;
}

export function hiscoreScreen(a: Art): Pixels {
  const p = new Pixels(W, H);
  // PLAYGAME writes 'Top Ten Scores' on rows 0-7 and 'Hit any key' on rows 192-199 in the
  // palette's nearest red, so both sit on plain dark bands with the frame kept between them.
  gradient(p, 0, 0, W, H, R('chrome'), 7, 5);
  p.rect(0, 0, W, 11, C('night', 0)).rect(0, 189, W, 11, C('night', 0));
  p.rect(0, 11, W, 1, C('pink', 3)).rect(0, 188, W, 1, C('pink', 3));
  p.frame(4, 14, W - 8, 172, C('pink', 3)).frame(6, 16, W - 12, 168, C('teal', 4));
  scaleBlit(p, a.quarter, 8, 18, 1);
  scaleBlit(p, a.quarter, 292, 18, 1);
  scaleBlit(p, a.page, 8, 163, 1);
  scaleBlit(p, a.pill, 292, 163, 1);
  return p;
}

export function filesScreen(heading: string, a: Art): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, H, R('purple'), 0, 2);
  p.rect(62, 34, 230, 148, C('paper', 2)).frame(62, 34, 230, 148, C('chrome', 6));
  for (let i = 0; i < 10; i++) p.rect(80, 47 + i * 14, 200, 1, C('sky', 6));
  chromeCentered(p, 6, heading, 2);
  scaleBlit(p, a.boothTop, 16, 120, 2);
  scaleBlit(p, a.booth, 16, 160, 2);
  return p;
}

export { microWidth, outlined };

export * from './paint';
export * from './animations';
