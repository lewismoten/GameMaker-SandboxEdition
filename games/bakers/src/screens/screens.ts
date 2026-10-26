// The 320x200 screens: the intro cartoon (THE CHEZ pulls the stand to the parade, Gwinn eats
// the card, the cellar door opens), the title and menu, the text page backdrops, a card for
// each room (in that room's own light, with a strip of its blocks), a page of the recipe card
// for each ingredient, the endings and the high score / load / save backdrops.
import { encodeGif } from '../../../../web/src/formats/gif';
import { encodeFliFadeOut } from '../../../kit/fadeOut';
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { dosText } from '../../../kit/disk';
import { loadScan, pastePhoto, polaroid, resample, sepia } from '../../../kit/photo';
import { Pixels, rng } from '../../../kit/pixels';
import { SANDLOGO, sandLogoFli } from '../../../kit/sandlogo';
import { corgi, docLeo, eggFaberge, eggRotten, gwinn, ingredient, mouse, redcoat } from '../art/kit';
import { arrivedWith, introName, outroName } from '../game';
import { reggie } from '../sprites/chicken';
import { stoveInFli, stoveOutFli } from './chicken';
import { EGG_SCENE } from '../ids';
import { PAL, buildPalette, c } from '../art/pal';
import type { TileSet } from '../blocks/tiles';
import type { Room } from '../levels/room';
import { RECIPE, ROOM_NAMES, THIRTEENTH } from '../recipe';
import { saveSlots } from '../../../kit/saveSlots';
import {
  H,
  W,
  bigLeo,
  blob,
  card,
  centered,
  chez,
  gradient,
  headline,
  kitchenWall,
  mainStreet,
  micro,
  mug,
  outlined,
  scaleBlit,
  stamp,
  stand,
  starCircle,
  bigTricorn,
  text,
} from './art';
import { wrap } from './pages';
import { CREDITS, HELP, LOST, STORY, WON } from './text';

function gif(p: Pixels, pal = PAL.pal): Uint8Array {
  return encodeGif({ width: p.w, height: p.h, pixels: Uint8Array.from(p.px), palette: pal });
}

const leo = (f: 'down' | 'up' | 'side' = 'down', step = 0, sq = false) => docLeo(f, step, sq);

// ------------------------------------------------------------------ title, menu, backdrops

function navy(p: Pixels): void {
  gradient(p, 0, 0, W, H, [c('night', 0), c('night', 1), c('night', 2), c('blue', 0)], 0, 3);
  const R = rng(9);
  for (let i = 0; i < 60; i++) p.set(Math.floor(R() * W), Math.floor(R() * H), R() < 0.3 ? c('yellow', 3) : c('sky', 4));
}

export function titleScreen(): Pixels {
  const p = new Pixels(W, H);
  navy(p);
  starCircle(p, 160, 104, 78, 7, c('brass', 3), 0, c('yellow', 3));
  mug(p, 122, 70, 2.5);
  bigTricorn(p, 132, 56, 1.9);
  headline(p, 8, "BAKER'S", 3, c('paper', 4), c('red', 2));
  headline(p, 36, 'DOZEN', 3, c('yellow', 3), c('red', 2));
  outlined(p, 72, 180, 'The Thirteenth Ingredient', c('paper', 4), c('ink', 0));
  bigLeo(p, 238, 84, 1.45, true);
  scaleBlit(p, corgi(0), 14, 140, 2);
  micro(p, 4, 4, 'SANDBOX SOFTWARE PRESENTS', c('sky', 4));
  micro(p, 222, 192, 'DO NOT TELL THE BRITISH', c('sky', 3));
  return p;
}

export function menuScreen(): Pixels {
  const p = new Pixels(W, H);
  kitchenWall(p, 176);
  headline(p, 10, "BAKER'S DOZEN", 2, c('yellow', 3), c('red', 2));
  centered(p, 36, 'The Thirteenth Ingredient', c('ink', 0), 1);
  // PLAYGAME writes the game's name at (96,104) and the menu at (80,120..167) in blue
  card(p, 62, 92, 196, 84);
  p.rect(64, 100, 192, 72, c('paper', 4));
  bigLeo(p, 6, 86, 1.25);
  scaleBlit(p, gwinn(0, true), 266, 132, 2);
  mug(p, 270, 62, 1);
  micro(p, 72, 190, 'ARROWS TO CHOOSE, ENTER TO GO', c('paper', 4));
  return p;
}

/** Backdrop for text pages: PLAYGAME writes 31 columns at x=40, y=40..167 (purple). */
function pageScreen(title: string, seed: number, who: Pixels = leo()): Pixels {
  const p = new Pixels(W, H);
  kitchenWall(p, 186);
  p.rect(0, 0, W, 28, c('wood', 1));
  headline(p, 7, title, 2, c('yellow', 3), c('red', 2));
  // PLAYGAME writes from y 40 to 175 (MORE... at the bottom right): the card's red rule sits
  // above the first line, and no ring stain on these
  card(p, 28, 30, 264, 150, 0, { rule: 6, stain: null });
  scaleBlit(p, who, 296, 162, 1);
  micro(p, 4, 192, 'BAKER FAMILY EYES ONLY', c('paper', 3));
  void seed;
  return p;
}

function scoresScreen(): Pixels {
  const p = new Pixels(W, H);
  kitchenWall(p, 190);
  // the ring stain goes right of the rows (x 20..285), below the last full one
  card(p, 10, 0, 300, 200, 0, { stain: [296, 186] });
  return p;
}

function slotsScreen(): Pixels {
  const p = new Pixels(W, H);
  kitchenWall(p, 176);
  // the names are written in yellow: each gets a dark strip, the blue message the card
  // (kit/saveSlots.ts); the card is wide enough for the message from x 40
  card(p, 30, 4, 262, 192, 0, { stain: [266, 20] });
  saveSlots(p, c('ink', 0), c('paper', 4), c('rootbeer', 2));
  scaleBlit(p, leo('down'), 4, 160, 1);
  scaleBlit(p, corgi(0, true), 296, 176, 1);
  return p;
}

// ------------------------------------------------------------------ room cards and recipe pages

/** A room's level card, in the room's own palette, with a strip of its blocks along the bottom. */
export function roomCard(room: Room, set: TileSet): { px: Pixels; pal: Uint8Array } {
  const pal = buildPalette(room.spec.theme);
  const p = new Pixels(W, H, c('dark', 0));
  const tiles = set.tiles;
  const strip = [
    'wallFace',
    'floor',
    'floor2',
    'prop0',
    'door_e',
    'belt_e',
    'panel_a0',
    'spout_e',
    'hot2',
    'latch',
    'prop1',
    'prop3',
    'riser2',
    'opener0',
    'prop2',
    'wallFace',
  ];
  // the room's floor all over, darkened round a card
  for (let by = 0; by < 10; by++) for (let bx = 0; bx < 16; bx++) p.blit(tiles.pic(by === 0 || by === 9 ? 'wallFace' : 'floor'), bx * 20, by * 20);
  strip.forEach((n, i) => p.blit(tiles.pic(n), i * 20, 180));
  const lvl = room.spec.level;
  card(p, 40, 22, 240, 146, 0);
  centered(p, 28, room.spec.interlude ? `BETWEEN ROOMS ${lvl} AND ${lvl + 1}` : lvl ? `ROOM ${lvl} OF 13` : 'ROOM ? OF 13', c('red', 2));
  const name = room.spec.name.toUpperCase();
  centered(p, 46, name, c('ink', 0), name.length > 14 ? 1 : 2);
  room.spec.card.forEach((l, i) => centered(p, 78 + i * 11, l, c('blue', 1)));
  const n = room.spec.ingredient;
  scaleBlit(p, ingredient(n, 0), 56, 120, 2);
  text(p, 100, 128, 'FIND:', c('ink', 1));
  text(p, 100, 140, RECIPE[n - 1]?.name ?? '???', c('red', 2));
  // the first room says how to keep your place
  if (lvl === 1 && !room.spec.interlude) centered(p, 156, 'F5 SAVES  F6 LOADS', c('red', 2));
  if (room.spec.hero === 'chick') scaleBlit(p, reggie('down'), 234, 118, 2);
  else bigLeo(p, 236, 116, 0.75);
  return { px: p, pal: pal.pal };
}

/** The ingredient's page of the recipe card, with its footnote and the stamp. */
export function recipePage(n: number): Pixels {
  const line = RECIPE[n - 1];
  const p = new Pixels(W, H);
  kitchenWall(p, 170);
  card(p, 20, 12, 280, 176, 2);
  text(p, 30, 16, 'BAKER FAMILY ROOT BEER', c('ink', 0));
  micro(p, 222, 19, `NO. ${n} OF 12`, c('red', 2));
  scaleBlit(p, ingredient(n, 0), 34, 34, 3);
  outlined(p, 104, 44, line.name.toUpperCase(), c('ink', 0), c('paper', 4));
  const body = wrap(line.line, 23);
  body.forEach((l, i) => text(p, 104, 62 + i * 11, l, c('blue', 1)));
  const foot = wrap(`* ${line.note}`, 32);
  foot.forEach((l, i) => text(p, 32, 132 + i * 11, l, c('ink', 1)));
  text(p, 104 + 8 * body[body.length - 1].length, 58 + (body.length - 1) * 11, '*', c('red', 2));
  stamp(p, 214, 100, 'CLASSIFIED', 2, -0.1);
  micro(p, 30, 178, `KEPT IN ${line.room.toUpperCase()}`, c('rootbeer', 1));
  return p;
}

// ------------------------------------------------------------------ the intro cartoon

function introFli(): Uint8Array {
  const frames: Pixels[] = [];
  const say = (p: Pixels, lines: string[]) => {
    p.rect(0, 170, W, 30, c('ink', 0));
    lines.forEach((l, i) => centered(p, 174 + i * 11, l, c('paper', 4)));
  };
  // 1. THE CHEZ pulls the stand down Main Street
  for (let t = 0; t < 30; t++) {
    const p = new Pixels(W, H);
    mainStreet(p, 3);
    const x = -150 + t * 8;
    stand(p, x, 100, 1, "LEO'S");
    p.rect(x + 70, 146, 14, 2, c('ink', 0));
    chez(p, x + 84, 122, 1.1, t);
    say(p, ['July the Fourth.', "Doc Leo's root beer stand rolls in."]);
    frames.push(p);
  }
  // 2. the recipe card on the counter, Gwinn's nose, CHOMP
  const counter = () => {
    const p = new Pixels(W, H);
    mainStreet(p, 3);
    p.rect(0, 100, W, 70, c('wood', 3));
    p.rect(0, 100, W, 4, c('wood', 5));
    card(p, 110, 60, 100, 60, 0);
    text(p, 116, 64, 'ROOT BEER', c('ink', 0));
    for (let i = 0; i < 4; i++) micro(p, 118, 84 + i * 8, `${i + 1}. ...........`, c('blue', 1));
    return p;
  };
  for (let t = 0; t < 14; t++) {
    const p = counter();
    scaleBlit(p, gwinn(t % 2), 230 - t * 4, 100 - Math.min(t, 6) * 3, 3, true);
    say(p, ['The family recipe. Twelve ingredients.', '(Gwinn is very interested.)']);
    frames.push(p);
  }
  for (let t = 0; t < 12; t++) {
    const p = counter();
    p.rect(110, 56, 110, 70, c('wood', 3));
    // a torn corner left behind
    p.rect(110, 108, 8, 8, c('paper', 4));
    scaleBlit(p, gwinn(t % 2), 160 + t * 6, 82, 3, t < 4);
    if (t < 6) headline(p, 30, 'CHOMP', 3, c('yellow', 3), c('red', 2));
    say(p, ['Gwinn ate the card.', 'All twelve ingredients. And the corner.']);
    frames.push(p);
  }
  // 3. Doc Leo takes it in
  for (let t = 0; t < 16; t++) {
    const p = new Pixels(W, H);
    kitchenWall(p, 170);
    bigLeo(p, 120, 14, 2.4, t > 8);
    if (t > 8) outlined(p, 236, 30, '!', c('red', 3), c('ink', 0), 3);
    say(p, ['There is one other copy.', "Ebenezer Baker's kitchen. Downstairs."]);
    frames.push(p);
  }
  // 4. the cellar door opens on the dark, and thirteen stars come out one by one
  for (let t = 0; t < 26; t++) {
    const p = new Pixels(W, H, c('ink', 0));
    const open = Math.min(1, t / 8);
    p.rect(100, 20, 120, 150, c('wood', 1));
    p.rect(106, 26, 108, 144, c('night', 0));
    p.rect(106, 26, Math.round(108 * (1 - open)), 144, c('wood', 2));
    if (t >= 8) starCircle(p, 160, 94, 40, 4, c('night', 1), Math.min(12, t - 9), c('yellow', 3));
    if (t >= 8)
      for (let k = 0; k <= Math.min(12, t - 9); k++) {
        const a = -Math.PI / 2 + (k * 2 * Math.PI) / 13;
        const sx = 160 + Math.cos(a) * 40;
        const sy = 94 + Math.sin(a) * 36;
        p.disc(sx, sy, 2.5, c('yellow', 3));
      }
    say(p, ['Built in 1777 to keep out the Redcoats.', t > 16 ? 'It still works. Much too well.' : '']);
    frames.push(p);
  }
  // a second on the last line (the hold the title list used to give), then a fade to black
  for (let t = 0; t < 12; t++) frames.push(frames[frames.length - 1]);
  return encodeFliFadeOut(
    frames.map((f) => Uint8Array.from(f.px)),
    PAL.pal,
    { speed: 6 },
  );
}

// ------------------------------------------------------------------ endings

const rgb8 = (pal: Uint8Array, i: number) => [0, 1, 2].map((k) => pal[i * 3 + k] * 4 + 2) as [number, number, number];

/** The thirteenth line: the back of the card, and a sepia portrait of the man himself. */
export function thirteenthScreen(): { px: Pixels; pal: Uint8Array } {
  const p = new Pixels(W, H);
  kitchenWall(p, 170);
  card(p, 12, 10, 190, 180, -2);
  text(p, 20, 14, 'THE OTHER SIDE', c('ink', 0));
  micro(p, 150, 17, 'NO. 13 OF 12', c('red', 2));
  scaleBlit(p, ingredient(13, 0), 22, 30, 2);
  wrap(THIRTEENTH.line, 21).forEach((l, i) => text(p, 22, 74 + i * 11, l, c('blue', 1)));
  stamp(p, 106, 160, 'DECLASSIFIED', 1, -0.12);
  const pf = { paper: c('paper', 4), edge: c('paper', 2), shadow: c('dark', 0), tape: c('yellow', 4) };
  const photo = sepia(resample(loadScan('colonial'), 84), rgb8(PAL.pal, c('rootbeer', 0)), rgb8(PAL.pal, c('paper', 4)), 1.1);
  const { cx, cy } = polaroid(p, 216, 30, photo.w, photo.h, pf, 26);
  micro(p, cx - 40, cy - 6, 'CPL. EBENEZER BAKER', c('ink', 0));
  micro(p, cx - 34, cy + 2, '1776 (WE THINK)', c('ink', 0));
  const { pal } = pastePhoto(p, PAL.pal, photo, 216, 30, { colors: 40 });
  return { px: p, pal };
}

/** The parade: the stand, THE CHEZ, Teddy ringing the bell, fireworks. */
export function paradeScreen(): { px: Pixels; pal: Uint8Array } {
  const p = new Pixels(W, H);
  mainStreet(p, 5);
  const R = rng(13);
  for (let k = 0; k < 4; k++) {
    const fx = 40 + k * 80 + R() * 20;
    const fy = 20 + R() * 30;
    const col = c(['red', 'paper', 'sky', 'yellow'][k], 3);
    for (let a = 0; a < 13; a++) p.line(fx, fy, fx + Math.cos(a / 2.07) * 16, fy + Math.sin(a / 2.07) * 16, col);
  }
  stand(p, 20, 96, 1, "LEO'S");
  p.rect(90, 142, 14, 2, c('ink', 0));
  chez(p, 104, 118, 1.1);
  scaleBlit(p, corgi(0), 180, 150, 2);
  bigLeo(p, 232, 112, 1.1, true);
  headline(p, 74, 'BEST BATCH IN 250 YEARS', 1, c('yellow', 3), c('ink', 0), 124);
  const pf = { paper: c('paper', 4), edge: c('paper', 2), shadow: c('dark', 0), tape: c('yellow', 4) };
  const photo = resample(loadScan('chez'), 64);
  const { cx, cy } = polaroid(p, 248, 12, photo.w, photo.h, pf, 12);
  micro(p, cx - 20, cy - 2, 'THE CHEZ', c('ink', 0));
  const { pal } = pastePhoto(p, PAL.pal, photo, 248, 12, { colors: 48 });
  return { px: p, pal };
}

function lostScreen(): Pixels {
  const p = new Pixels(W, H);
  kitchenWall(p, 140);
  scaleBlit(p, docLeo('down'), 120, 60, 1);
  // Doc Leo playing dead, scaled
  const dead = new Pixels(20, 20, 255);
  dead
    .rect(1, 9, 18, 7, c('ink', 0))
    .rect(2, 10, 6, 5, c('gray', 2))
    .rect(8, 10, 5, 5, c('skin', 2))
    .rect(13, 10, 5, 5, c('blue', 1))
    .rect(14, 7, 4, 3, c('yellow', 3));
  p.rect(100, 40, 120, 80, c('paper', 4));
  scaleBlit(p, dead, 110, 60, 5);
  scaleBlit(p, redcoat(0), 240, 120, 3);
  scaleBlit(p, mouse(0), 30, 150, 2);
  headline(p, 8, 'THE REDCOATS WIN', 2, c('paper', 4), c('red', 2));
  return p;
}

// ------------------------------------------------------------------ the eggs

/** An egg's own page: the egg big, what it is, and its credits. */
export function eggScreen(rotten: boolean): Pixels {
  const p = new Pixels(W, H);
  kitchenWall(p, 176);
  card(p, 16, 10, 288, 180, 0);
  scaleBlit(p, rotten ? eggRotten() : eggFaberge(0), 24, 40, 3);
  const lines = rotten
    ? [
        'THE ROTTEN EGG',
        '',
        'Best before 1776. It has',
        'been keeping ever since.',
        'The smell got out of the',
        'crock before you did.',
        '',
        'Ebenezer kept it to throw',
        'at Redcoats. He never had',
        'to: they smelled it coming.',
        '',
        'Found by Doc Leo, who',
        'wishes he had not.',
      ]
    : [
        'THE TRUE EASTER EGG',
        '',
        'Choux pastry, glazed and',
        'banded in edible gold leaf,',
        'on a stand of spun sugar.',
        'On top a tiny baker turns',
        'to a music box.',
        '',
        'For Lewis "Lewie" Moten',
        'III, Teddy and Gwinn (two',
        "n's), from Claude Opus 5.5.",
        '',
        'The thirteenth egg.',
      ];
  for (const l of lines) if (l.length > 27) throw new Error(`Egg page line too long: ${l}`);
  lines.forEach((l, i) => text(p, 92, 18 + i * 12, l, i === 0 ? c('red', 2) : c('ink', 0)));
  stamp(p, 64, 160, rotten ? 'PHEW' : 'HAPPY EASTER', 1, -0.15);
  return p;
}

// ------------------------------------------------------------------ all files

export function buildScreens(rooms: Room[], sets: Record<string, TileSet>): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  out[SANDLOGO] = sandLogoFli();
  out['intro.fli'] = introFli();
  out['title.gif'] = gif(titleScreen());
  out['title.lst'] = serializeSlideList([
    { name: SANDLOGO, pause: 0 },
    { name: 'intro.fli', pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]);
  out['menu.gif'] = gif(menuScreen());
  out['story.gif'] = gif(pageScreen('THE STORY', 1));
  out['story.txt'] = dosText(STORY);
  out['story.lst'] = serializeSlideList([{ name: 'intro.fli', pause: 0 }, { name: 'story.gif', pause: 0 }, { name: 'story.txt' }]);
  out['help.gif'] = gif(pageScreen('HOW TO PLAY', 2, leo('down', 0, true)));
  out['help.txt'] = dosText(HELP);
  out['help.lst'] = serializeSlideList([{ name: 'help.gif', pause: 0 }, { name: 'help.txt' }]);
  out['credits.gif'] = gif(pageScreen('CREDITS', 3, corgi(0, true)));
  out['credits.txt'] = dosText(CREDITS);
  out['credits.lst'] = serializeSlideList([{ name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]);
  out['scores.gif'] = gif(scoresScreen());
  out['loadgame.gif'] = gif(slotsScreen());
  out['savegame.gif'] = gif(slotsScreen());
  const t13 = thirteenthScreen();
  out['back13.gif'] = gif(t13.px, t13.pal);
  const parade = paradeScreen();
  out['parade.gif'] = gif(parade.px, parade.pal);
  out['won.gif'] = gif(pageScreen('THE THIRTEENTH', 4, leo('down', 0, true)));
  out['won.txt'] = dosText(WON);
  out['won.lst'] = serializeSlideList([
    { name: 'won.gif', pause: 0 },
    { name: 'won.txt' },
    { name: 'back13.gif', pause: 30 },
    { name: 'parade.gif', pause: 30 },
    { name: 'credits.gif', pause: 0 },
    { name: 'credits.txt' },
  ]);
  out['lost.gif'] = gif(lostScreen());
  out['lostpg.gif'] = gif(pageScreen('PLAYING DEAD', 5));
  out['lost.txt'] = dosText(LOST);
  out['lost.lst'] = serializeSlideList([{ name: 'lost.gif', pause: 6 }, { name: 'lostpg.gif', pause: 0 }, { name: 'lost.txt' }]);
  for (const line of RECIPE) out[`rcp${String(line.n).padStart(2, '0')}.gif`] = gif(recipePage(line.n));
  for (const room of rooms) {
    if (room.spec.cupboard) {
      const rotten = room.spec.cupboard.scene === EGG_SCENE.rotten;
      const name = `egg${room.spec.cupboard.scene}.gif`;
      out[name] = gif(eggScreen(rotten));
      out[introName(room)] = serializeSlideList([{ name, pause: 30 }]);
      continue;
    }
    if (room.spec.interlude) {
      const f = room.spec.file;
      const { px, pal } = roomCard(room, sets[room.spec.style]);
      out[`card${f.slice(0, 4)}.gif`] = gif(px, pal);
      out[`${f}in.fli`] = stoveInFli();
      out[`${f}out.fli`] = stoveOutFli();
      out[introName(room)] = serializeSlideList([
        { name: `${f}in.fli`, pause: 1 },
        { name: `card${f.slice(0, 4)}.gif`, pause: 5 },
      ]);
      out[outroName(room)] = serializeSlideList([{ name: `${f}out.fli`, pause: 1 }]);
      continue;
    }
    const n = String(room.spec.level).padStart(2, '0');
    const { px, pal } = roomCard(room, sets[room.spec.style]);
    out[`card${n}.gif`] = gif(px, pal);
    const came = arrivedWith(room.spec.level);
    out[introName(room)] = serializeSlideList([
      ...(came ? [{ name: `rcp${String(came).padStart(2, '0')}.gif`, pause: 20 }] : []),
      { name: `card${n}.gif`, pause: 5 },
    ]);
  }
  void ROOM_NAMES;
  void blob;
  return out;
}
