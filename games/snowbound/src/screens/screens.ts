// The 320x200 pictures: title, menu, the newspaper storyline, level cards, the notepad
// behind text pages, and the endings. All drawn in code with the same ramps as the blocks.
import { encodeFli } from '../../../../web/src/formats/fli';
import { matchColor } from '../../../../web/src/formats/palette';
import { Pixels, rng } from '../../../kit/pixels';
import { loadScan, pastePhoto, resample, sepia } from '../../../kit/photo';
import { blob, gradient, shadeAt } from '../art/draw';
import { centered, micro, microWidth, outlined, text, textWidth } from '../art/font';
import { buildScreenPalette, type Pal } from '../art/pal';
import { feltEgg } from '../blocks/woods';
import { H, W, gif, scaleBlit, sky, snowTitle, snowfall, town } from './scenery';

export type Spr = Map<string, Pixels>;

export function buildScreens(
  spr: Spr,
  extras: { cards: { name: string; map: Pixels; pal: Pal; title: string; time: string; lines: string[] }[]; shot: Pixels; shotPal: Pal },
): Record<string, Uint8Array> {
  const pal = buildScreenPalette();
  const c = pal.c;
  const files: Record<string, Uint8Array> = {};
  const save = (name: string, p: Pixels, palette = pal.pal) => (files[name] = gif(p, palette));
  const kid = spr.get('down0')!;

  // ---------------- title
  const title = new Pixels(W, H);
  sky(title, pal, false, 3);
  town(title, pal, 150, 7, false);
  snowfall(title, pal, 11);
  snowTitle(title, pal, 22, 'SNOWBOUND', 4, 'siding');
  outlined(title, 160 - textWidth('The $89 Shovel', 2) / 2, 66, 'The $89 Shovel', c('gold', 3), c('ink', 0), 2);
  scaleBlit(title, kid, 20, 128, 3);
  // a big pile of snow and a tin can of money
  blob(title, 106, 192, 26, 10, pal.r('snow'), 2, 6);
  title.rect(92, 168, 14, 16, c('grey', 3)).rect(92, 168, 14, 2, c('grey', 4)).rect(94, 172, 10, 6, c('money', 2));
  micro(title, 95, 173, '$', c('money', 0));
  title.rect(0, 188, W, 12, c('ink', 0));
  centered(title, 190, 'Sandbox Software  (c) 1995', c('snow', 6));
  save('title.gif', title);

  // ---------------- menu: a painted shop sign holds the menu
  const menu = new Pixels(W, H);
  sky(menu, pal, true, 5);
  town(menu, pal, 120, 17, true);
  snowfall(menu, pal, 13, 120);
  snowTitle(menu, pal, 10, 'SNOWBOUND', 3, 'siding');
  menu.rect(56, 92, 208, 90, c('wood', 0)).rect(58, 94, 204, 86, c('wood', 2));
  menu.rect(62, 98, 196, 78, c('paper', 4)).frame(62, 98, 196, 78, c('wood', 1));
  for (let x = 58; x < 262; x++) menu.set(x, 92 + ((x * 3) % 4 === 0 ? 1 : 0), c('snow', 6)).set(x, 91, c('snow', 5));
  menu.rect(80, 182, 4, 18, c('wood', 1)).rect(236, 182, 4, 18, c('wood', 1));
  scaleBlit(menu, kid, 266, 146, 2);
  scaleBlit(menu, spr.get('dog0')!, 8, 162, 2);
  save('menu.gif', menu);

  // ---------------- the newspaper
  const paper = (masthead: string, date: string) => {
    const p = new Pixels(W, H, c('paper', 3));
    const r = rng(masthead.length);
    for (let k = 0; k < 900; k++) p.set(Math.floor(r() * W), Math.floor(r() * H), c('paper', r() < 0.5 ? 2 : 4));
    centered(p, 6, masthead, c('newsink', 0), 2);
    p.rect(8, 24, 304, 1, c('newsink', 0)).rect(8, 36, 304, 1, c('newsink', 0));
    micro(p, 10, 28, date, c('newsink', 0));
    micro(p, 310 - 4 * 'FIFTY CENTS'.length, 28, 'FIFTY CENTS', c('newsink', 0));
    return p;
  };
  const body = (p: Pixels, x: number, y: number, w: number, lines: string[]) => {
    lines.forEach((l, i) => micro(p, x, y + i * 7, l.slice(0, Math.floor(w / 4)), c('newsink', 1)));
  };
  const n1 = paper('MINERAL COURIER', 'FORT ASHBY  W.VA.   FRIDAY  DECEMBER 11  1992');
  centered(n1, 40, 'SNOWBOUND!', c('newsink', 0), 3);
  centered(n1, 66, 'Mineral County buried; schools closed', c('newsink', 0));
  scaleBlit(n1, extras.shot, 10, 84, 1);
  n1.frame(9, 83, 162, 82, c('newsink', 0));
  micro(n1, 10, 168, 'GALE ST AT DUNN DR  THIS MORNING', c('newsink', 1));
  body(n1, 180, 84, 130, [
    'FORT ASHBY - THE STORM THAT',
    'CAME IN OVERNIGHT LEFT A FOOT',
    'AND A HALF OF SNOW ACROSS',
    'ALL OF MINERAL COUNTY.',
    '',
    'PLOWS ARE OUT ON GALE STREET',
    'AND BOWDEN DRIVE. DRIVERS:',
    'WATCH FOR SLEDS ON JAMIE ST.',
    '',
    'FRONT WALKS NEED DIGGING TOO:',
    'THE PAPER STILL HAS TO REACH',
    'THE DOOR MAT. KIDS WITH',
    'SHOVELS - NAME YOUR PRICE!',
  ]);
  save('news1.gif', n1);

  const n2 = paper('MINERAL COURIER', 'MINERAL COUNTY  PAGE 6  CLASSIFIEDS');
  n2.rect(10, 42, 196, 148, c('paper', 4)).frame(10, 42, 196, 148, c('newsink', 0)).frame(12, 44, 192, 144, c('newsink', 0));
  text(n2, 22, 52, 'DESIGN YOUR', c('newsink', 0), 2);
  text(n2, 22, 70, 'OWN GAMES!', c('newsink', 0), 2);
  // the pink box
  const box = (p: Pixels, x: number, y: number, s: number) => {
    p.rect(x, y, 40 * s, 52 * s, c('pink', 3))
      .rect(x, y, 40 * s, 3 * s, c('pink', 4))
      .rect(x + 40 * s, y + 2 * s, 5 * s, 52 * s, c('pink', 1));
    p.rect(x + 3 * s, y + 8 * s, 34 * s, 14 * s, c('ink', 0));
    micro(p, x + 5 * s, y + 10 * s, 'GAME', c('gold', 3), s);
    micro(p, x + 5 * s, y + 16 * s, 'MAKER', c('gold', 3), s);
    for (let k = 0; k < 4; k++) p.rect(x + (4 + k * 8) * s, y + 28 * s, 6 * s, 6 * s, c(['coat', 'siding', 'money', 'gold'][k], 3));
    micro(p, x + 4 * s, y + 40 * s, 'VER 3.0', c('pink', 0), s);
  };
  box(n2, 26, 92, 1);
  body(n2, 80, 96, 120, [
    'DESIGN WORLDS, MONSTERS,',
    'CHARACTERS, MUSIC AND',
    'SOUND. NO PROGRAMMING!',
    '',
    'VGA  SOUND BLASTER',
    'MOUSE  JOYSTICK',
    '',
    'BITS & BYTES SOFTWARE',
    'LAVALE MALL',
  ]);
  outlined(n2, 72, 162, 'ONLY $89', c('coat', 3), c('newsink', 0), 2);
  n2.rect(212, 42, 98, 74, c('paper', 4)).frame(212, 42, 98, 74, c('newsink', 0));
  body(n2, 216, 46, 92, [
    'FOR SALE: SLED,',
    'RED, FAST. ASK',
    'ON LEOTA ST.',
    '',
    'LOST: ONE MITTEN,',
    'BLUE. JAMIE ST.',
    '',
    'BLEEPS ARCADE,',
    'LAVALE MALL:',
    'NEW GAMES IN!',
  ]);
  n2.rect(212, 122, 98, 68, c('paper', 4)).frame(212, 122, 98, 68, c('coat', 2));
  body(n2, 216, 126, 92, ['NOTICE:', 'THE PRICE OF', 'GAME-MAKER GOES', 'UP TO $129 IN', 'JANUARY.', '', 'BUY BEFORE', 'CHRISTMAS!']);
  save('news2.gif', n2);

  const n3 = paper('MINERAL COURIER', 'MINERAL COUNTY  PAGE 2  LOCAL NEWS');
  centered(n3, 40, 'KID SHOVELS FOR', c('newsink', 0), 2);
  centered(n3, 56, 'GAME-MAKER', c('newsink', 0), 2);
  centered(n3, 72, '"Moten Snow-to-Software Operations"', c('newsink', 0));
  scaleBlit(n3, kid, 16, 88, 4);
  n3.frame(12, 86, 88, 86, c('newsink', 0));
  micro(n3, 14, 176, 'OUR FOUNDER', c('newsink', 1));
  body(n3, 110, 88, 200, [
    'A FORT ASHBY TEEN HAS A PLAN FOR ALL',
    'THIS SNOW. HE WILL SHOVEL ANY DRIVEWAY',
    'OR WALK AROUND FOR ONE DOLLAR A SCOOP -',
    'AND EVERY DOLLAR GOES INTO A COFFEE',
    'CAN UNTIL IT HOLDS $89.',
    '',
    '"THAT IS WHAT GAME-MAKER COSTS AT THE',
    'MALL," HE TOLD THE COURIER. "EACH',
    'DRIVEWAY IS LIKE ONE PIXEL OF THE GAME',
    'I AM GOING TO MAKE."',
    '',
    'HE STARTS AT HOME ON GALE STREET AT',
    '7 AM, SLEDS DOWN JAMIE STREET TO',
    'BOWDEN DRIVE, AND HOPES TO REACH',
    'LAVALE MALL BY NIGHT. WATCH OUT, PLOWS!',
  ]);
  save('news3.gif', n3);

  // ---------------- the route card: the regular carrier's notes on every customer, left
  // for the substitute (the founder sat in on the News-Tribune route 1992-94), on the desk
  // next to the canvas bag and a rolled paper.
  {
    const p = new Pixels(W, H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) p.set(x, y, shadeAt(pal.r('wood'), 1, 3, 0.55 + Math.sin(x / 9 + Math.sin(y / 23) * 3) * 0.25, x, y));
    // the card, a little shadow under it
    p.rect(16, 10, 292, 160, c('wood', 0));
    p.rect(12, 6, 292, 160, c('paper', 4));
    p.rect(12, 32, 292, 1, c('coat', 2));
    for (let y = 42; y < 164; y += 9) p.rect(12, y, 292, 1, c('siding', 4));
    text(p, 20, 10, 'ROUTE 12', c('newsink', 0));
    micro(p, 20, 22, 'MINERAL DAILY NEWS-TRIBUNE', c('newsink', 1));
    micro(p, 296 - microWidth('SUBSTITUTE: L. MOTEN'), 12, 'SUBSTITUTE: L. MOTEN', c('menublue', 1));
    micro(p, 296 - microWidth('GALE ST & LEOTA ST'), 22, 'GALE ST & LEOTA ST', c('newsink', 1));
    const notes: [string, string][] = [
      ['GALE ST', ''],
      ['BLUE HOUSE', 'BISCUIT CARRIES IT IN FOR THEM. ALREADY CHEWED.'],
      ['YELLOW HOUSE', 'FOLDED, NOT ROLLED. DO NOT ASK WHY.'],
      ['MRS. HAINES', 'PORCH, NOT THE BUSHES. TIPS $5 AT CHRISTMAS.'],
      ['END HOUSE', 'READS THE COMICS FIRST. THEN COMPLAINS.'],
      ['LEOTA ST', ''],
      ['BLUE HOUSE', 'BY 7 AM. "7 MEANS 6:59."'],
      ['YELLOW HOUSE', 'PAYS IN QUARTERS. (SAVE THEM FOR BLEEPS.)'],
      ['', ''],
      ['NO PAPER', 'BIG PETE, BOWDEN DR. HE THROWS IT BACK.'],
      ['SNOW DAY', 'PAPERS FIRST. THEN SHOVELS. - R.'],
    ];
    notes.forEach(([who, what], i) => {
      const y = 36 + i * 9;
      if (!what) micro(p, 20, y, who, c('coat', 1));
      else {
        micro(p, 26, y, who, c('newsink', 0));
        micro(p, 82, y, what, c('menublue', 0));
      }
    });
    // the founder's pencil: the math in the margin, and a check mark by every customer
    micro(p, 26, 153, '$89 IS 89 SCOOPS, OR ONE PINK BOX. SAME THING.', c('newsink', 1));
    p.rect(26, 159, 11, 1, c('coat', 2)).rect(26, 161, 11, 1, c('coat', 2));
    for (const i of [1, 2, 3, 4, 6, 7]) p.line(296, 38 + i * 9, 298, 40 + i * 9, c('newsink', 1)).line(298, 40 + i * 9, 302, 34 + i * 9, c('newsink', 1));
    // a rolled paper with a red rubber band, and the canvas carrier bag
    p.rect(26, 176, 60, 14, c('paper', 4)).rect(26, 186, 60, 4, c('paper', 2)).rect(24, 176, 3, 14, c('paper', 1)).rect(85, 176, 3, 14, c('paper', 2));
    for (let x = 32; x < 80; x += 6) p.rect(x, 180, 4, 1, c('newsink', 2));
    p.rect(52, 175, 3, 16, c('coat', 3)).rect(55, 175, 1, 16, c('coat', 1));
    p.rect(196, 168, 100, 30, c('orange', 2)).rect(196, 168, 100, 4, c('orange', 3)).rect(196, 194, 100, 4, c('orange', 0));
    p.rect(206, 160, 6, 10, c('orange', 1)).rect(280, 160, 6, 10, c('orange', 1));
    micro(p, 246 - Math.floor(microWidth('NEWS-TRIBUNE', 2) / 2), 177, 'NEWS-TRIBUNE', c('ink', 0), 2);
    save('route.gif', p);
  }

  // ---------------- the notepad behind text pages (instructions, credits, load/save)
  const pad = (heading: string) => {
    const p = new Pixels(W, H);
    gradient(p, 0, 0, W, H, pal.r('nightsky'), 2, 6);
    snowfall(p, pal, 21, 90);
    p.rect(24, 6, 272, 190, c('paper', 4)).frame(24, 6, 272, 190, c('paper', 1));
    p.rect(34, 8, 1, 186, c('coat', 3));
    for (let y = 14; y < 196; y += 18) p.rect(27, y, 4, 4, c('nightsky', 3));
    centered(p, 14, heading, c('menublue', 1), 2);
    return p;
  };
  save('howto.gif', pad('HOW TO PLAY'));
  save('credits.gif', pad('CREDITS'));
  // Load and save: PLAYGAME writes the names in yellow (x 80, y 40 + 14i), which vanishes on
  // paper, so every slot is a strip of dark label tape.
  const slots = (heading: string) => {
    const p = pad(heading);
    for (let i = 0; i < 10; i++) p.rect(75, 37 + i * 14, 170, 13, c('nightsky', 1)).rect(75, 49 + i * 14, 170, 1, c('nightsky', 0));
    return p;
  };
  save('loadgame.gif', slots('LOAD GAME'));
  save('savegame.gif', slots('SAVE GAME'));
  save('storybg.gif', pad('THE STORY'));
  // found in the pines: the felted egg, four times life size, beside the text
  const woods = pad('IN THE PINES');
  blob(woods, 262, 134, 24, 4, pal.r('snow'), 2, 4);
  scaleBlit(woods, feltEgg(c), 222, 58, 4);
  // The Pines loads dark.pal (all black), where PLAYGAME's "MORE..." red matches index 0;
  // this page doesn't paint index 0, so its palette makes that entry red.
  if (woods.px.includes(0)) throw new Error('woods.gif paints palette index 0');
  const woodsPal = pal.pal.slice();
  const red = matchColor(pal.pal, 63, 10, 10);
  woodsPal.set(pal.pal.subarray(red * 3, red * 3 + 3), 0);
  save('woods.gif', woods, woodsPal);
  // the high scores: PLAYGAME prints "Top Ten Scores" in red at y 0, the rows from y 27 and
  // "Hit any key" at y 192 (HISCOREL.C), so the page runs off the top and bottom of the
  // screen for all of that to sit on paper, and the title is small, between the red line and the first row
  const hs = new Pixels(W, H);
  gradient(hs, 0, 0, W, H, pal.r('nightsky'), 2, 6);
  snowfall(hs, pal, 21, 90);
  // (the rows start at x 20, so the page is wider here: holes and the red line left of them)
  hs.rect(4, 0, 308, H, c('paper', 4)).rect(4, 0, 1, H, c('paper', 1)).rect(311, 0, 1, H, c('paper', 1));
  hs.rect(15, 0, 1, H, c('coat', 3));
  for (let y = 14; y < 196; y += 18) hs.rect(7, y, 4, 4, c('nightsky', 3));
  centered(hs, 11, 'THE COFFEE CAN', c('menublue', 1));
  const rule = textWidth('THE COFFEE CAN', 1) + 16;
  hs.rect(160 - rule / 2, 21, rule, 1, c('menublue', 2));
  save('hiscore.gif', hs);

  // ---------------- endings
  const won1 = new Pixels(W, H);
  gradient(won1, 0, 0, W, 120, pal.r('wall'), 3, 1);
  // shelves of software boxes
  for (let s = 0; s < 3; s++) {
    won1.rect(0, 20 + s * 32, W, 3, c('wood', 1));
    for (let x = 6; x < W; x += 13) won1.rect(x, 4 + s * 32, 10, 16, c(['siding', 'coat', 'money', 'butter', 'pink', 'gold'][(x + s) % 6], 2 + ((x >> 2) % 2)));
  }
  won1.rect(0, 112, W, 88, c('wood', 2)).rect(0, 112, W, 4, c('wood', 4));
  box(won1, 120, 58, 1);
  // the register
  won1.rect(206, 74, 70, 38, c('grey', 2)).rect(212, 78, 58, 14, c('ink', 0));
  text(won1, 214, 81, '$89.00', c('money', 2));
  for (let k = 0; k < 12; k++) won1.rect(214 + (k % 6) * 9, 96 + Math.floor(k / 6) * 7, 7, 5, c('grey', 4));
  // a coffee can full of crumpled dollars
  won1.rect(70, 82, 26, 30, c('grey', 3)).rect(70, 82, 26, 3, c('grey', 4));
  for (let k = 0; k < 9; k++) blob(won1, 74 + (k % 3) * 9, 80 - Math.floor(k / 3) * 3, 4, 3, pal.r('money'), 0, 2);
  scaleBlit(won1, kid, 14, 106, 3);
  won1.rect(0, 166, W, 34, c('ink', 0));
  outlined(won1, 160 - textWidth('SOLD!', 4) / 2, 130, 'SOLD!', c('gold', 3), c('ink', 0), 4);
  centered(won1, 172, 'LaVale Mall: one GAME-MAKER, $89', c('snow', 6));
  centered(won1, 184, 'in ones, still a little damp.', c('snow', 6));
  save('won1.gif', won1);

  // ---------------- Bleeps: the change from the mall lot, in quarters
  const arc = new Pixels(W, H, c('ink', 0));
  gradient(arc, 0, 0, W, 40, pal.r('nightsky'), 0, 2);
  // the marquee
  arc.rect(70, 6, 180, 30, c('ink', 1)).frame(70, 6, 180, 30, c('gold', 2));
  for (let x = 72; x < 248; x += 4) arc.set(x, 8, pal.r('bulbs')[(x >> 2) % 4]).set(x + 2, 33, pal.r('bulbs')[((x >> 2) + 2) % 4]);
  outlined(arc, 160 - textWidth('BLEEPS', 2) / 2, 13, 'BLEEPS', c('orange', 3), c('coat', 0), 2);
  // a row of cabinets, screens glowing
  for (let k = 0; k < 5; k++) {
    const x = 14 + k * 62;
    const hue = ['siding', 'coat', 'money', 'pink', 'butter'][k];
    arc
      .rect(x, 48, 44, 112, c(hue, 1))
      .rect(x, 48, 44, 10, c(hue, 3))
      .rect(x + 2, 50, 40, 6, c('ink', 0));
    for (let i = 0; i < 6; i++) arc.set(x + 6 + i * 6, 52, c('gold', (i + k) % 4));
    arc.rect(x + 5, 62, 34, 28, c('ink', 0));
    gradient(arc, x + 7, 64, 30, 24, pal.r(hue), 0, 3);
    const rr = rng(k + 40);
    for (let i = 0; i < 8; i++) arc.rect(x + 8 + Math.floor(rr() * 26), 66 + Math.floor(rr() * 18), 2, 2, c(['gold', 'snow', 'coat'][i % 3], 3));
    arc
      .rect(x + 2, 94, 40, 14, c('grey', 1))
      .rect(x + 10, 98, 2, 6, c('ink', 0))
      .rect(x + 9, 96, 4, 3, c('coat', 3));
    arc.rect(x + 24, 99, 4, 4, c('gold', 3)).rect(x + 31, 99, 4, 4, c('siding', 3));
    arc.rect(x + 16, 118, 12, 14, c('grey', 2)).rect(x + 21, 121, 2, 6, c('ink', 0));
    micro(arc, x + 17, 134, '25', c('gold', 3));
  }
  arc.rect(0, 160, W, 40, c('wall', 0));
  for (let x = 0; x < W; x += 16) arc.rect(x, 160, 8, 4, c('wall', 1));
  scaleBlit(arc, spr.get('up0')!, 140, 110, 3);
  arc.rect(0, 170, W, 30, c('ink', 0));
  centered(arc, 175, 'The change from the lot went to', c('snow', 6));
  centered(arc, 186, 'Bleeps, one quarter at a time.', c('snow', 6));
  save('arcade.gif', arc);

  const won2 = new Pixels(W, H);
  gradient(won2, 0, 0, W, 140, pal.r('wall'), 1, 0);
  // window with snow falling
  won2.rect(220, 16, 80, 64, c('wood', 3));
  gradient(won2, 224, 20, 72, 56, pal.r('nightsky'), 0, 4);
  snowfall(won2, pal, 31, 0);
  const rw = rng(4);
  for (let k = 0; k < 40; k++) won2.set(224 + Math.floor(rw() * 72), 20 + Math.floor(rw() * 56), c('snow', 6));
  won2.rect(258, 20, 3, 56, c('wood', 3)).rect(224, 46, 72, 3, c('wood', 3));
  // desk, PC and monitor showing the game you're about to make
  won2.rect(0, 140, W, 60, c('wood', 1)).rect(0, 140, W, 4, c('wood', 3));
  won2.rect(40, 30, 150, 112, c('concrete', 3)).rect(48, 38, 134, 92, c('ink', 0));
  scaleBlit(won2, extras.shot.crop(20, 0, 128, 84), 51, 41, 1);
  won2.rect(60, 142, 110, 14, c('concrete', 2)).rect(150, 146, 14, 3, c('money', 2));
  box(won2, 196, 98, 1);
  scaleBlit(won2, spr.get('up0')!, 92, 112, 3);
  won2.rect(0, 164, W, 36, c('ink', 0));
  centered(won2, 167, 'That night, at Gale St & Dunn Dr,', c('snow', 6));
  centered(won2, 177, 'Moten Snow-to-Software Operations', c('snow', 6));
  centered(won2, 187, 'became a game company.', c('snow', 6));
  save('won2.gif', won2);

  const won3 = paper('MOUNTAIN COURIER', 'MONDAY  JANUARY 4  1993');
  centered(won3, 44, 'GAME-MAKER NOW $129', c('newsink', 0), 2);
  centered(won3, 64, 'Local kid: "Glad I shoveled fast."', c('newsink', 0));
  box(won3, 30, 77, 1);
  body(won3, 90, 76, 220, [
    'THE PRICE OF THE POPULAR GAME DESIGN',
    'KIT JUMPED FORTY DOLLARS THIS WEEK.',
    '',
    'ONE FORT ASHBY STUDENT BOUGHT',
    'HIS COPY IN DECEMBER AT LAVALE MALL',
    'WITH MONEY FROM SHOVELING GALE, DUNN,',
    'LEOTA, LEON, JAMIE AND BOWDEN.',
    'HIS FIRST GAME IS ABOUT, OF COURSE,',
    'SHOVELING SNOW.',
  ]);
  won3.rect(8, 141, 304, 1, c('newsink', 0));
  // the other story on the page, with a real photo run through the paper's halftone: the
  // History Fair volunteer from the mall, beside General Washington
  const rgb8 = (i: number) => [0, 1, 2].map((k) => pal.pal[i * 3 + k] * 4 + 2) as [number, number, number];
  const fair = sepia(resample(loadScan('colonial'), 80), rgb8(c('newsink', 0)), rgb8(c('paper', 4)), 1.15);
  won3.frame(9, 144, fair.w + 2, fair.h + 2, c('newsink', 0));
  text(won3, 98, 148, 'HISTORY FAIR AT THE MALL', c('newsink', 0));
  body(won3, 98, 160, 212, ['A VOLUNTEER IN COLONIAL DRESS GREETS', 'SHOPPERS BESIDE GENERAL WASHINGTON AT', "LAVALE MALL'S HISTORY FAIR."]);
  micro(won3, 238, 189, 'THANKS FOR PLAYING!', c('newsink', 0));
  const { pal: won3pal } = pastePhoto(won3, pal.pal, fair, 10, 145, { colors: 24 });
  save('won3.gif', won3, won3pal);

  const lost = new Pixels(W, H);
  gradient(lost, 0, 0, W, 130, pal.r('wall'), 1, 0);
  lost.rect(0, 130, W, 16, c('wood', 2));
  lost.rect(30, 20, 90, 70, c('wood', 3));
  gradient(lost, 34, 24, 82, 62, pal.r('nightsky'), 0, 3);
  const rl = rng(8);
  for (let k = 0; k < 70; k++) lost.set(34 + Math.floor(rl() * 82), 24 + Math.floor(rl() * 62), c('snow', 6));
  blob(lost, 75, 86, 41, 8, pal.r('snow'), 4, 6);
  // bed, quilt, a kid with a thermometer
  lost.rect(130, 96, 170, 50, c('wood', 1)).rect(140, 80, 30, 30, c('snow', 6));
  for (let y = 100; y < 140; y++) for (let x = 150; x < 296; x++) lost.set(x, y, ((x >> 3) + (y >> 3)) % 2 ? c('coat', 2) : c('butter', 3));
  lost.rect(150, 84, 16, 14, c('skin', 2)).rect(148, 80, 20, 6, c('coat', 3)).set(155, 90, c('ink', 0)).set(161, 90, c('ink', 0));
  lost.rect(164, 94, 12, 2, c('grey', 5)).rect(175, 94, 2, 2, c('coat', 3));
  lost.rect(0, 146, W, 54, c('wood', 0));
  outlined(lost, 160 - textWidth('SNOWED OUT', 3) / 2, 150, 'SNOWED OUT', c('snow', 6), c('ink', 0), 3);
  centered(lost, 178, 'A cold, a quilt, and a coffee can', c('snow', 6));
  centered(lost, 188, 'that is not full yet. Next winter!', c('snow', 6));
  save('lost.gif', lost);

  // ---------------- intro.fli: dawn at the corner of Gale Street and Dunn Drive. Snow
  // falls on the street sign and piles up on its blades, the porch light of home comes
  // on, and the date types itself out.
  {
    const frames: Uint8Array[] = [];
    const N = 64;
    const rf = rng(77);
    const flakes = Array.from({ length: 140 }, () => ({ x: rf() * W, y: rf() * H, v: 1.5 + rf() * 2.5, d: rf() * 6, big: rf() < 0.3 }));
    const caption1 = 'DECEMBER 11, 1992  7:00 AM';
    const caption2 = 'FORT ASHBY, W. VA.';
    for (let f = 0; f < N; f++) {
      const p = new Pixels(W, H);
      gradient(p, 0, 0, W, 150, pal.r('dusksky'), 0, 15);
      // home: the corner house, Christmas lights on, the porch light coming on at f 20
      const hx = 150;
      const base = 150;
      p.rect(hx, base - 46, 150, 46, c('brick', 2)).rect(hx, base - 46, 4, 46, c('brick', 3));
      for (let y = 0; y < 30; y++) {
        const inset = Math.round(((30 - y) / 30) * 78);
        for (let x = hx - 6 + inset; x < hx + 156 - inset; x++) p.set(x, base - 76 + y, y < 27 ? c('snow', x < hx + 75 ? 6 : 4) : c('ink', 0));
      }
      p.rect(hx + 104, base - 84, 12, 14, c('brick', 1)).rect(hx + 104, base - 86, 12, 3, c('snow', 6));
      for (let k = 0; k < 4; k++) blob(p, hx + 110 + k * 3 + Math.sin((f + k * 5) / 4) * 2, base - 92 - k * 8 - (f % 8), 3 + k, 3, pal.r('grey'), 3, 5);
      for (const wx of [hx + 14, hx + 44, hx + 104])
        p.rect(wx, base - 36, 22, 18, c('wood', 4))
          .rect(wx + 2, base - 34, 18, 14, c('glow', f > 8 ? 3 : 1))
          .rect(wx + 10, base - 34, 2, 14, c('wood', 4));
      p.rect(hx + 72, base - 38, 18, 38, c('siding', 1)).rect(hx + 85, base - 20, 2, 2, c('gold', 3));
      if (f >= 20) blob(p, hx + 66, base - 40, 4, 4, pal.r('glow'), 2, 3);
      const bulbs = pal.r('bulbs');
      for (let x = hx; x < hx + 150; x += 5) p.set(x, base - 46, bulbs[(Math.floor(x / 5) + (f >> 2)) % 4]);
      // the snowy ground and the plowed edge of Dunn Drive
      const ground = 150 - Math.min(6, Math.floor(f / 10));
      for (let y = ground; y < H; y++)
        for (let x = 0; x < W; x++) p.set(x, y, shadeAt(pal.r('snow'), 3, 6, 0.4 + (y - ground) / 50 + Math.sin(x / 17 + y / 9) * 0.08, x, y));
      p.rect(0, 176, W, 24, c('asphalt', 1)).rect(0, 176, W, 2, c('snow', 4));
      for (let x = (f * 3) % 24; x < W; x += 24) p.rect(x, 188, 12, 2, c('gold', 2));
      // the sign: two green blades on a post
      const sx = 70;
      p.rect(sx - 2, 38, 5, 140, c('grey', 3)).rect(sx - 2, 38, 2, 140, c('grey', 4));
      const pile = Math.min(5, Math.floor(f / 9));
      const blade = (y: number, label: string, dx: number) => {
        const w = textWidth(label, 2) + 12;
        const x = sx - Math.floor(w / 2) + dx;
        p.rect(x, y, w, 22, c('pine', 3))
          .frame(x + 2, y + 2, w - 4, 18, c('snow', 6))
          .rect(x, y + 22, w, 2, c('ink', 0));
        text(p, x + 6, y + 4, label, c('snow', 6), 2);
        for (let xx = x; xx < x + w; xx++) {
          const h = pile - ((xx * 5) % 3 === 0 ? 1 : 0);
          for (let k = 0; k < h; k++) p.set(xx, y - 1 - k, c('snow', k === h - 1 ? 5 : 6));
        }
      };
      blade(40, 'GALE ST', 6);
      blade(72, 'DUNN DR', -6);
      // the morning paper: thrown from off screen, it tumbles over the yard and lands on
      // the porch with a puff of snow (the carrier this morning is the founder)
      const paperAt = (x: number, y: number, flat: boolean) => {
        if (flat) {
          p.rect(x - 9, y - 4, 19, 6, c('snow', 6))
            .rect(x - 9, y + 1, 19, 1, c('grey', 3))
            .rect(x - 10, y - 4, 1, 6, c('grey', 4));
          for (let k = -6; k < 8; k += 3) p.rect(x + k, y - 2, 2, 1, c('grey', 4));
          p.rect(x - 1, y - 4, 3, 6, c('coat', 3));
        } else {
          for (let i = -6; i <= 6; i++) p.rect(x + i, y + i, 4, 4, c('snow', 6)).set(x + i + 3, y + i + 3, c('grey', 3));
          p.rect(x - 1, y - 1, 4, 4, c('coat', 3));
        }
      };
      const land = ground + 6;
      if (f >= 24 && f < 38) {
        const t = (f - 24) / 14;
        const px = -10 + t * (hx + 82 + 10);
        const py = 118 + (land - 118) * t - Math.sin(t * Math.PI) * 50;
        if (f % 2) paperAt(Math.round(px), Math.round(py), true);
        else paperAt(Math.round(px), Math.round(py), false);
      } else if (f >= 38) {
        paperAt(hx + 82, land, true);
        if (f < 44) for (let k = 0; k < 3; k++) blob(p, hx + 74 + k * 8, land - 2 - (f - 38) - k, 2 + (f - 38) * 0.5, 1.5, pal.r('snow'), 4, 6);
      }
      // falling snow
      for (const fl of flakes) {
        const y = (fl.y + f * fl.v) % H;
        const x = (fl.x + Math.sin((f + fl.d * 10) / 6) * 3 + W) % W;
        p.set(x | 0, y | 0, c('snow', 6));
        if (fl.big) p.set((x | 0) + 1, y | 0, c('snow', 5)).set(x | 0, (y | 0) + 1, c('snow', 5));
      }
      // the date types itself out
      const t1 = Math.max(0, Math.min(caption1.length, (f - 16) * 2));
      const t2 = Math.max(0, Math.min(caption2.length, (f - 16) * 2 - caption1.length - 4));
      if (t1) outlined(p, 160 - textWidth(caption1) / 2, 8, caption1.slice(0, t1), c('snow', 6), c('ink', 0));
      if (t2) outlined(p, 160 - textWidth(caption2) / 2, 20, caption2.slice(0, t2), c('gold', 3), c('ink', 0));
      frames.push(Uint8Array.from(p.px));
    }
    for (let k = 0; k < 12; k++) frames.push(frames[frames.length - 1]);
    files['intro.fli'] = encodeFli(frames, pal.pal, { speed: 6 });
  }

  // ---------------- level cards (in each level's own palette)
  for (const card of extras.cards) {
    const p = new Pixels(W, H, card.pal.c('ink', 0));
    p.blit(card.map, 0, 0);
    p.rect(0, 118, W, 2, card.pal.c('gold', 3));
    outlined(p, 12, 128, card.title, card.pal.c('snow', 6), card.pal.c('ink', 1), 2);
    text(p, 12, 148, card.time, card.pal.c('gold', 3));
    card.lines.forEach((l, i) => text(p, 12, 162 + i * 10, l, card.pal.c('snow', 5)));
    files[`${card.name}.gif`] = gif(p, card.pal.pal);
  }
  return files;
}
