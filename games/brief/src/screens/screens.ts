// The 320x200 screens: the intro cartoon (The Dog House at night; its red door opens and the
// words pour out, falling by palette cycling), the title and menu, the page backgrounds
// PLAYGAME writes its text on, every book's cover page and story card, the picture of each
// story's twist, the thirty-third book, the endings, and the high score / load / save
// backdrops. Everything shares the game palette, so PLAYGAME's inks come out exact.
import { encodeGif } from '../../../../web/src/formats/gif';
import { encodeFliFadeOut } from '../../../kit/fadeOut';
import { serializeSlideList } from '../../../../web/src/formats/graphicScripts';
import { dosText } from '../../../kit/disk';
import { Pixels, rng } from '../../../kit/pixels';
import { SANDLOGO, sandLogoFli } from '../../../kit/sandlogo';
import { saveSlots } from '../../../kit/saveSlots';
import { CLEAR, bevel, blob, centered, gradient, micro, outlined, scaleBlit, text, textWidth } from '../art/draw';
import { bookwormEgg, corgi, docLeo, gwinn, shusher, wordSlip } from '../art/kit';
import { PAL, c, r } from '../art/pal';
import type { BlockSet } from '../blocks/sets';
import type { CompiledWing } from '../levels/wing';
import { story } from '../stories';
import { joinPages, storyPages } from './pages';
import { CREDITS, EGG, HELP, LOST, STORY, WON, book33Text, chapterDoneText, coverText } from './text';
import { CHAPTERS, chapterOf } from '../chapters';

const W = 320;
const H = 200;

export function gif(p: Pixels): Uint8Array {
  return encodeGif({ width: p.w, height: p.h, pixels: Uint8Array.from(p.px), palette: PAL.pal });
}

/**
 * A text page shown from a scene whose palette is dark.pal (all black): PLAYGAME writes its
 * MORE... in the entry nearest red in that palette, which is index 0, so this picture gets a
 * palette of its own with red at 0 and index 0's own pixels moved to a copy of its color.
 */
export function gifRedAtZero(p: Pixels): Uint8Array {
  const pal = PAL.pal.slice();
  const used = new Set(p.px);
  let spare = 255;
  while (used.has(spare)) spare--;
  pal.copyWithin(spare * 3, 0, 3);
  pal.set(pal.slice(PAL.ink.red * 3, PAL.ink.red * 3 + 3), 0);
  return encodeGif({ width: p.w, height: p.h, pixels: Uint8Array.from(p.px, (v) => (v === 0 ? spare : v)), palette: pal });
}

// ------------------------------------------------------------------ scenery

function nightSky(seed: number): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, H, r('night'), 0, 3);
  const R = rng(seed);
  for (let i = 0; i < 80; i++) p.set(Math.floor(R() * W), Math.floor(R() * 120), R() < 0.3 ? c('yellow', 3) : c('sky', 4));
  p.disc(40, 30, 10, c('paper', 4)).disc(45, 26, 9, c('night', 1));
  return p;
}

function grass(p: Pixels, y: number, seed: number): void {
  const R = rng(seed);
  for (let yy = y; yy < H; yy++) for (let x = 0; x < W; x++) p.set(x, yy, R() < 0.1 ? c('green', 2) : R() < 0.5 ? c('green', 0) : c('green', 1));
}

/**
 * The Dog House: a white library box on a dark post with an overhanging black roof, a
 * fire-engine red door with a plexi window, strap hinges, a dog-bone handle and a paw-print
 * knob; dog books inside; under it, a cubby grid of painted rocks.
 */
export function dogHouse(p: Pixels, x: number, y: number, s: number, open = 0): void {
  const R = (xx: number, yy: number, w: number, h: number, col: number) =>
    p.rect(Math.round(x + xx * s), Math.round(y + yy * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)), col);
  // post
  R(18, 40, 8, 40, c('brown', 0));
  R(19, 40, 2, 40, c('brown', 1));
  // rock cubby under the box
  R(6, 46, 32, 16, c('paper', 4));
  R(6, 46, 32, 2, c('red', 2));
  const rocks = ['red', 'yellow', 'blue', 'green', 'purple', 'orange'];
  for (let i = 0; i < 6; i++) {
    const cx = 8 + (i % 3) * 10;
    const cy = 49 + Math.floor(i / 3) * 6;
    R(cx, cy, 8, 5, c('grey', 2));
    R(cx + 2, cy + 1, 4, 3, c(rocks[i], 3));
  }
  // the box
  R(0, 6, 44, 34, c('paper', 4));
  R(0, 38, 44, 2, c('paper', 2));
  // roof
  for (let i = 0; i < 8; i++) R(-4 + i, 6 - i, 52 - i * 2, 1, c('ink', 1));
  R(-5, 6, 54, 2, c('ink', 0));
  // inside: shelves of dog books (seen through the door when it opens)
  R(4, 10, 36, 26, c('wood', 1));
  const books = ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'teal', 'pink'];
  for (let i = 0; i < 8; i++) (R(6 + i * 4, 14, 3, 9, c(books[i], 3)), R(6 + i * 4, 25, 3, 9, c(books[(i + 3) % 8], 2)));
  R(4, 23, 36, 1, c('wood', 3));
  R(4, 34, 36, 1, c('wood', 3));
  if (open < 1) {
    // the red door, swinging open to the left
    const w = Math.max(2, 36 * (1 - open));
    R(4, 10, w, 26, c('red', 3));
    R(4, 10, w, 2, c('red', 4));
    if (w > 10) {
      R(4 + 4 * (w / 36), 13, w - 8 * (w / 36), 18, c('sky', 1));
      R(4 + 5 * (w / 36), 14, (w - 8 * (w / 36)) * 0.4, 1, c('sky', 4));
      R(4, 14, 6 * (w / 36), 1.5, c('ink', 0));
      R(4, 30, 6 * (w / 36), 1.5, c('ink', 0));
      R(4 + w - 9 * (w / 36), 22, 5 * (w / 36), 2, c('ink', 0));
      R(4 + w - 4 * (w / 36), 26, 2, 2, c('paper', 4));
    }
  } else {
    // the door, open against the box's side
    R(-2, 10, 4, 26, c('red', 2));
  }
}

/** Big friendly letters with a drop shadow, outlined. */
function headline(p: Pixels, y: number, s: string, scale: number, fill: number, edge: number, cx = W / 2): void {
  const x = Math.round(cx - textWidth(s, scale) / 2);
  for (const [dx, dy] of [
    [2, 3],
    [3, 3],
  ])
    text(p, x + dx, y + dy, s, c('ink', 0), scale);
  outlined(p, x, y, s, fill, edge, scale);
}

function bigJoe(p: Pixels, joe: BlockSet, x: number, y: number, s: number, pose = 'down0', flip = false): void {
  scaleBlit(p, joe.pic(pose), x, y, s, flip);
}

// ------------------------------------------------------------------ title, menu, backdrops

export function titleScreen(joe: BlockSet): Pixels {
  const p = nightSky(3);
  grass(p, 178, 4);
  // light spilling out of the open red door
  for (let i = 0; i < 30; i++) p.line(42, 120, 10 + i * 2.4, 200, c('yellow', i % 3 ? 0 : 1));
  dogHouse(p, 12, 92, 1.6, 1);
  bigJoe(p, joe, 84, 138, 2);
  // word slips fluttering out of the door
  scaleBlit(p, wordSlip(20, 0), 70, 92, 2);
  scaleBlit(p, wordSlip(5, 1), 150, 100, 1);
  scaleBlit(p, wordSlip(1, 0), 118, 110, 1);
  headline(p, 12, 'KEEP IT', 3, c('paper', 4), c('red', 1), 204);
  headline(p, 40, 'BRIEF!', 4, c('yellow', 3), c('red', 1), 204);
  centered(p, 82, 'The Tiny Pockets Library', c('paper', 4), 1, c('ink', 0), 204);
  centered(p, 132, 'Thirty-two stories.', c('sky', 4), 1, c('ink', 0), 220);
  centered(p, 144, 'One hundred words each.', c('sky', 4), 1, c('ink', 0), 220);
  centered(p, 162, 'Not 99. Not 101.', c('yellow', 3), 1, c('ink', 0), 220);
  micro(p, 4, 4, 'SANDBOX SOFTWARE PRESENTS', c('sky', 4));
  return p;
}

/** Shelves of books, the wallpaper of every screen. */
function shelves(seed: number): Pixels {
  const p = new Pixels(W, H, c('wood', 1));
  const R = rng(seed);
  const cols = ['red', 'green', 'blue', 'brown', 'purple', 'teal', 'orange'];
  for (let top = 0; top < H; top += 25) {
    let x = 0;
    while (x < W) {
      const w = 3 + Math.floor(R() * 5);
      const h = 14 + Math.floor(R() * 8);
      const col = cols[Math.floor(R() * cols.length)];
      p.rect(x, top + 22 - h, w, h, c(col, 1 + Math.floor(R() * 2)));
      p.rect(x, top + 22 - h + 2, w, 1, c('brass', 2));
      if (w > 4) p.rect(x + w - 1, top + 22 - h, 1, h, c(col, 0));
      x += w;
    }
    p.rect(0, top + 22, W, 3, c('wood', 3));
  }
  return p;
}

/** A paper panel where PLAYGAME writes words. */
function panel(p: Pixels, x: number, y: number, w: number, h: number, ruled = true): void {
  p.rect(x + 4, y + 4, w, h, c('ink', 0));
  p.rect(x, y, w, h, c('paper', 4));
  p.frame(x, y, w, h, c('paper', 1));
  if (!ruled) return;
  for (let yy = y + 11; yy < y + h - 2; yy += 8) p.rect(x + 3, yy, w - 6, 1, c('sky', 4));
  p.rect(x + 8, y + 2, 1, h - 4, c('red', 4));
}

export function menuScreen(joe: BlockSet): Pixels {
  const p = shelves(11);
  headline(p, 10, 'KEEP IT BRIEF!', 2, c('yellow', 3), c('red', 1));
  centered(p, 38, 'The Tiny Pockets Library', c('paper', 4), 1, c('ink', 0));
  // PLAYGAME writes the game's name at (96,104) and the menu at (80,120..167) in blue
  panel(p, 62, 96, 196, 80, false);
  bigJoe(p, joe, 10, 112, 2);
  scaleBlit(p, shusher(1), 262, 112, 2);
  outlined(p, 44, 186, 'Arrows to choose, Enter to go', c('paper', 4), c('ink', 0));
  return p;
}

/** Backdrop for text pages: PLAYGAME writes 31 columns at x=40, y=40..167 (purple). */
export function pageScreen(joe: BlockSet, title: string, seed: number, pose = 'down0'): Pixels {
  const p = shelves(seed);
  p.rect(0, 0, W, 28, c('wood', 0));
  headline(p, 7, title, 2, c('yellow', 3), c('red', 1));
  panel(p, 28, 32, 264, 146);
  bigJoe(p, joe, 296, 160, 1, pose);
  micro(p, 4, 192, 'THE TINY POCKETS LIBRARY', c('paper', 3));
  return p;
}

/** A book's cover page: leather with gold tooling around a paper label. */
export function coverScreen(tint: string, title: string): Pixels {
  const p = new Pixels(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.set(x, y, (x * 7 + y * 13) % 17 === 0 ? c(tint, 1) : c(tint, 2));
  p.frame(6, 6, W - 12, H - 12, c('brass', 3)).frame(9, 9, W - 18, H - 18, c('brass', 2));
  for (const [x, y] of [
    [12, 12],
    [W - 13, 12],
    [12, H - 13],
    [W - 13, H - 13],
  ])
    p.disc(x, y, 3, c('brass', 4));
  const t = title.length > 34 ? `${title.slice(0, 33)}.` : title;
  centered(p, 18, t.toUpperCase(), c('brass', 4), 1, c('ink', 0));
  panel(p, 28, 34, 264, 140);
  micro(p, 120, 184, 'EXACTLY 100 WORDS', c('brass', 4));
  return p;
}

/** High scores: PLAYGAME writes the table from the top (x=20..300), "Hit any key" at y=192. */
export function scoresScreen(): Pixels {
  const p = shelves(21);
  // the paper runs off the top and bottom so its edges stay clear of the title and Hit any key
  panel(p, 10, -4, 300, 208, false);
  return p;
}

/** Load and save: "Load Game" at (124,10) and ten slots from y=40, 14 apart, x=73... */
export function slotsScreen(joe: BlockSet): Pixels {
  // the names are written in yellow: each gets a dark strip, the blue message the paper
  // (kit/saveSlots.ts); the paper is wide enough for the message from x 40
  const p = shelves(31);
  panel(p, 30, 4, 262, 192, false);
  saveSlots(p, c('ink', 0), c('paper', 4), c('wood', 1));
  bigJoe(p, joe, 2, 150, 1);
  scaleBlit(p, corgi(0), 296, 176, 1);
  return p;
}

// ------------------------------------------------------------------ the twist pictures

/**
 * A story's picture: the twist, acted out by the book's own blocks and monsters at twice
 * their size, framed like a plate in an old book, with Joe's caption.
 */
export function twistScreen(w: CompiledWing, k: number): Pixels {
  const b = w.books[k];
  const s = story(b.spec.n);
  const p = new Pixels(W, H, c('paper', 4));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((x * 31 + y * 17) % 23 === 0) p.set(x, y, c('paper', 3));
  p.frame(4, 4, W - 8, H - 8, c('paper', 1));
  const title = s.title.length > 36 ? `${s.title.slice(0, 35)}.` : s.title;
  centered(p, 10, title, c('ink', 0));
  const grid = b.spec.twist.grid;
  const cols = Math.max(...grid.map((row) => row.length));
  const sc = cols * 40 <= 280 && grid.length * 40 <= 120 ? 2 : 1;
  const gw = cols * 20 * sc;
  const gh = grid.length * 20 * sc;
  const gx = Math.round((W - gw) / 2);
  const gy = 24 + Math.round((128 - gh) / 2);
  // the plate: the book's floor, then its blocks and monsters
  const floor = w.area.tiles.pic(b.spec.floor);
  p.rect(gx - 5, gy - 5, gw + 10, gh + 10, c('ink', 0));
  p.rect(gx - 3, gy - 3, gw + 6, gh + 6, c('brass', 3));
  grid.forEach((row, y) =>
    row.forEach((_, x) => {
      void _;
      scaleBlit(p, floor, gx + x * 20 * sc, gy + y * 20 * sc, sc);
    }),
  );
  for (let y = 0; y < grid.length; y++)
    for (let x = 0; x < cols; x++) {
      const name = grid[y][x];
      if (!name) continue;
      const pic = name.startsWith('m:') ? w.area.mb.pic(name.slice(2)) : w.area.tiles.pic(name);
      scaleBlit(p, pic, gx + x * 20 * sc, gy + y * 20 * sc, sc);
    }
  b.spec.twist.caption.forEach((line, i) => {
    if (line.length > 38) throw new Error(`Caption too long: ${line}`);
    centered(p, 160 + i * 11, line, c('ink', 1));
  });
  micro(p, W - 60, 188, '100 / 100', c('red', 2));
  micro(p, 10, 188, 'WORD COUNTER: FILED', c('green', 0));
  return p;
}

/** The felt egg, big, on the Lost and Found's shelf, before its page. */
export function eggScreen(): Pixels {
  const p = shelves(71);
  p.rect(0, 0, W, 28, c('wood', 0));
  headline(p, 7, 'LOST AND FOUND', 2, c('yellow', 3), c('red', 1));
  p.rect(100, 40, 120, 130, c('ink', 0)).rect(104, 44, 112, 122, c('night', 2));
  scaleBlit(p, bookwormEgg(), 110, 50, 5);
  centered(p, 178, 'The Bookworm Egg', c('paper', 4), 1, c('ink', 0));
  scaleBlit(p, gwinn(0, true), 30, 140, 2);
  scaleBlit(p, docLeo(0), 248, 130, 2, true);
  return p;
}

// ------------------------------------------------------------------ the intro cartoon

/**
 * Palette cycling: the falling words are drawn once, in eight spare palette entries by
 * height, and each frame turns the eight colors one step, so the words stream down out of
 * the door while the picture itself never changes (each frame stores just its palette).
 */
const CYCLE = 8;

function freeEntries(n: number): number[] {
  if (PAL.used + n > 255) throw new Error('No spare palette entries for the cycle');
  return Array.from({ length: n }, (_, i) => PAL.used + i);
}

function cyclePalette(slots: number[], frame: number): Uint8Array {
  const pal = Uint8Array.from(PAL.pal);
  slots.forEach((slot, k) => {
    const d = (k - frame + CYCLE * 100) % CYCLE;
    const lit = d === 0 ? [63, 63, 58] : d === 1 ? [52, 50, 40] : d === 2 ? [36, 34, 30] : [6, 6, 16];
    pal.set(lit, slot * 3);
  });
  return pal;
}

export function introFli(joe: BlockSet): Uint8Array {
  const frames: Pixels[] = [];
  const palettes: Uint8Array[] = [];
  const base = (open: number) => {
    const p = nightSky(7);
    grass(p, 160, 8);
    dogHouse(p, 110, 36, 2.2, open);
    return p;
  };
  const say = (p: Pixels, lines: string[]) => lines.forEach((l, i) => centered(p, 172 + i * 11, l, c('paper', 4), 1, c('ink', 0)));
  for (let t = 0; t < 14; t++) {
    const p = base(0);
    say(p, ['The Dog House.', 'A little lending library on a post.']);
    frames.push(p);
    palettes.push(PAL.pal);
  }
  for (let t = 0; t <= 6; t++) {
    const p = base(t / 6);
    say(p, ['Last night, the Word Counter jammed.', '']);
    frames.push(p);
    palettes.push(PAL.pal);
  }
  // the words pour out: drawn once in the cycle's colors, by height
  const slots = freeEntries(CYCLE);
  const pour = base(1);
  // streams of words arcing out of the open door, left and right, each word colored by how far
  // along its stream it is, so turning the colors sends them flying along the arcs
  const R = rng(5);
  const words = ['the', 'and', 'a', 'of', 'Doc', 'hmm', 'yes', 'pod', 'shh', 'tea', 'X', 'Bob', 'owl', 'vase'];
  const door = { x: 150, y: 76 };
  for (let s = 0; s < 10; s++) {
    const dir = s % 2 ? 1 : -1;
    const vx = dir * (1.6 + R() * 2.6);
    const vy = -(2.2 + R() * 2.4);
    for (let k = 0; k < 26; k++) {
      const t = k * 2.2;
      const x = door.x + vx * t * 1.7;
      const y = door.y + vy * t + 0.09 * t * t;
      if (y > 158 || x < 2 || x > 300 || (x > 104 && x < 210 && y > 40 && y < 172)) continue;
      micro(pour, Math.round(x), Math.round(y), words[Math.floor(R() * words.length)], slots[k % CYCLE]);
    }
  }
  for (let t = 0; t < 32; t++) {
    const p = new Pixels(W, H);
    p.px.set(pour.px);
    say(p, t < 16 ? ['It said 99. Then 101. Then STOP.', ''] : ['...and every word fell out', 'of every book.']);
    frames.push(p);
    palettes.push(cyclePalette(slots, t));
  }
  // Joe steps out of the door, tally counter clicking
  for (let t = 0; t < 18; t++) {
    const p = base(1);
    p.rect(0, 166, W, 34, c('green', 0));
    const y = Math.min(118, 80 + t * 4);
    bigJoe(p, joe, 136, y, 2, t % 2 ? 'down1' : 'down0');
    say(p, ['Mystery Robot Joe, night librarian.', t > 8 ? '"I will need a bigger box."' : '']);
    frames.push(p);
    palettes.push(PAL.pal);
  }
  // a second on his line (the hold the list used to give), then a fade to black before the title
  for (let t = 0; t < 10; t++) {
    frames.push(frames[frames.length - 1]);
    palettes.push(PAL.pal);
  }
  return encodeFliFadeOut(
    frames.map((f) => Uint8Array.from(f.px)),
    PAL.pal,
    { speed: 7, palettes },
  );
}

// ------------------------------------------------------------------ all files

export function buildScreens(joe: BlockSet, wings: CompiledWing[]): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  out[SANDLOGO] = sandLogoFli();
  out['intro.fli'] = introFli(joe);
  out['title.gif'] = gif(titleScreen(joe));
  out['title.lst'] = serializeSlideList([
    { name: SANDLOGO, pause: 0 },
    { name: 'intro.fli', pause: 0 },
    { name: 'title.gif', pause: 12 },
  ]);
  out['menu.gif'] = gif(menuScreen(joe));
  out['story.gif'] = gif(pageScreen(joe, 'THE STORY', 51));
  out['story.txt'] = dosText(STORY);
  out['story.lst'] = serializeSlideList([{ name: 'intro.fli', pause: 0 }, { name: 'story.gif', pause: 0 }, { name: 'story.txt' }]);
  out['help.gif'] = gif(pageScreen(joe, 'HOW TO PLAY', 52, 'up0'));
  out['help.txt'] = dosText(HELP);
  out['help.lst'] = serializeSlideList([{ name: 'help.gif', pause: 0 }, { name: 'help.txt' }]);
  out['credits.gif'] = gif(pageScreen(joe, 'CREDITS', 53, 'blink'));
  out['credits.txt'] = dosText(CREDITS);
  out['credits.lst'] = serializeSlideList([{ name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]);
  out['scores.gif'] = gif(scoresScreen());
  out['loadgame.gif'] = gif(slotsScreen(joe));
  out['savegame.gif'] = gif(slotsScreen(joe));
  out['won.gif'] = gif(pageScreen(joe, 'EXACTLY ONE HUNDRED', 54, 'shh'));
  out['won.txt'] = dosText(WON);
  out['won.lst'] = serializeSlideList([{ name: 'won.gif', pause: 0 }, { name: 'won.txt' }, { name: 'credits.gif', pause: 0 }, { name: 'credits.txt' }]);
  out['lost.gif'] = gif(pageScreen(joe, 'OVERDUE', 55, 'blink'));
  out['lost.txt'] = dosText(LOST);
  out['lost.lst'] = serializeSlideList([{ name: 'lost.gif', pause: 0 }, { name: 'lost.txt' }]);
  // the story pages share one backdrop, the covers one per wing
  out['page.gif'] = gif(pageScreen(joe, 'RESTORED', 60, 'shh'));
  let index = 0;
  for (const w of wings) {
    const cover = `cover${w.index}.gif`;
    out[cover] = gif(coverScreen(w.spec.tint, w.spec.wing.name));
    w.books.forEach((b, k) => {
      const s = story(b.spec.n);
      const ch = chapterOf(w.index);
      const inChapter = ch.wings.indexOf(w.index) * 4 + k + 1;
      out[`c${s.n}.txt`] = dosText(coverText(s, w.spec.wing.name, k, b.spec.note, index++, ch, inChapter));
      out[`c${s.n}.lst`] = serializeSlideList([{ name: cover, pause: 0 }, { name: `c${s.n}.txt` }]);
      out[`s${s.n}.txt`] = dosText(joinPages(storyPages(s)));
      out[`t${s.n}.gif`] = gif(twistScreen(w, k));
      out[`s${s.n}.lst`] = serializeSlideList([{ name: 'page.gif', pause: 0 }, { name: `s${s.n}.txt` }, { name: `t${s.n}.gif`, pause: 20 }]);
    });
  }
  // the felt egg
  out['eggpic.gif'] = gif(eggScreen());
  out['egg.gif'] = gif(pageScreen(joe, 'THE FELT EGG', 62, 'shh'));
  out['egg.txt'] = dosText(EGG);
  out['egg.lst'] = serializeSlideList([{ name: 'eggpic.gif', pause: 8 }, { name: 'egg.gif', pause: 0 }, { name: 'egg.txt' }]);
  // the chapter-done pages (shown from dark.pal scenes, like the thirty-third book's)
  const names = (ch: (typeof CHAPTERS)[number]) => ch.wings.map((i) => wings[i].spec.wing.name);
  CHAPTERS.slice(0, -1).forEach((ch, k) => {
    const so = CHAPTERS.slice(0, k + 1).reduce((n, c) => n + c.wings.length * 4, 0);
    out[`ch${ch.n}.gif`] = gifRedAtZero(pageScreen(joe, `CHAPTER ${ch.n} DONE`, 63 + k, 'shh'));
    out[`ch${ch.n}.txt`] = dosText(chapterDoneText(ch, names(ch), CHAPTERS[k + 1], names(CHAPTERS[k + 1]), so, wings.length * 4));
    out[`ch${ch.n}.lst`] = serializeSlideList([{ name: `ch${ch.n}.gif`, pause: 0 }, { name: `ch${ch.n}.txt` }]);
  });
  // the thirty-third book
  out['b33.gif'] = gifRedAtZero(pageScreen(joe, 'BOOK 33', 61, 'blink'));
  out['b33.txt'] = dosText(book33Text());
  out['b33.lst'] = serializeSlideList([{ name: 'b33.gif', pause: 0 }, { name: 'b33.txt' }]);
  return out;
}

void CLEAR;
void bevel;
void blob;
void docLeo;
void gwinn;
