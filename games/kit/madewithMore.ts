// Three more "Made with Game-Maker: Sandbox Edition" openings the web editor offers a new game
// beside madewith.ts's falling letters, drawn flat in the site's colors (madewithArt.ts) as
// Reel cartoons: each opens on black, runs about four seconds and fades to black.
//   mwblocks.fli  Block by block: GAME-MAKER is stacked up from little gold blocks, one column
//                 at a time, under the navy sky; a shine runs across it and a star glints.
//   mwwipe.fli    Wipe: a wall of the site's glossy blue blocks turns over block by block in a
//                 diagonal wave, showing the card behind it; then the shine and the glint.
//   mwtype.fli    Typewriter: a DOS prompt runs GM, the screen clears, and MADE WITH,
//                 GAME-MAKER (a letter at a time, with a gold cursor) and SANDBOX EDITION type in.
//
//   cd web && npx vite-node ../games/kit/madewithMore.ts    writes them to web/public/opening/
//   PREVIEW=<folder>                                       also writes frame PNGs there
// The web app never imports this file; it copies the chosen file into a new game.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BLACK,
  EDITION,
  GOLD,
  GRAY,
  H,
  LOGO,
  MADE,
  W,
  WHITE,
  blockWall,
  blueBlock,
  drawLogo,
  glint,
  goldBlock,
  goldDepth,
  lettering,
  logoBox,
  logoDots,
  madeWith,
  madeWithPalette,
  restCard,
  sandboxEdition,
  sky,
  type Dot,
} from './madewithArt';
import { Pixels } from './pixels';
import { writePng } from './png';
import { Reel } from './reel';

const SPEED = 5; // 1/70 s a frame: 14 frames a second
const FADE = 7;

/** A frame drawn from scratch. */
const draw = (bg: () => Pixels, fn: (p: Pixels) => void): Pixels => {
  const p = bg();
  fn(p);
  return p;
};

/** The shine over the logo at step k of n: a slanted band of light crossing it left to right. */
function shine(k: number, n: number): (d: Dot) => number {
  const [x0, , x1] = logoBox();
  const band = x0 - 20 + ((x1 - x0 + 40) * k) / (n - 1);
  return (d) => (Math.abs(d.x + d.row * 3 - band) < 10 ? GOLD.shine : GOLD.face);
}

/** The glint's place: the top right of the logo's last letter. */
function glintAt(): [number, number] {
  const last = logoDots().filter((d) => d.letter === LOGO.length - 1);
  return [Math.max(...last.map((d) => d.x)) + 2, Math.min(...last.map((d) => d.y)) + 1];
}

/** The ending the block and wipe intros share: the shine, a glint, a hold and the fade. */
function shineAndFade(r: Reel, base: () => Pixels): Reel {
  const n = 8;
  const [gx, gy] = glintAt();
  for (let k = 0; k < n; k++)
    r.add(
      draw(base, (p) => {
        drawLogo(p, shine(k, n));
        if (k >= n - 3) glint(p, gx, gy, [3, 6, 4][k - (n - 3)]);
      }),
    );
  r.add(draw(base, (p) => (drawLogo(p), glint(p, gx, gy, 2))));
  r.add(draw(base, drawLogo), 7);
  return r.fadeOut(FADE);
}

/** Block by block: the letters stacked up from gold blocks, column by column, bottom first. */
function blocks(): Reel {
  const r = new Reel(madeWithPalette()).fadeIn(sky(), 4);
  const order = [...logoDots()].sort((a, b) => a.letter - b.letter || a.col - b.col || b.row - a.row);
  const SPREAD = 24; // the frames over which blocks start falling
  const FALL = 3;
  const start = (i: number) => 2 + (i * SPREAD) / order.length;
  const landed = 2 + SPREAD + FALL;
  for (let f = 0; f < landed; f++)
    r.add(
      draw(sky, (p) => {
        madeWith(p, f + 1);
        const down = order.filter((_, i) => f >= start(i) + FALL);
        for (const d of down) goldDepth(p, d.x, d.y);
        for (const d of down) goldBlock(p, d.x, d.y);
        order.forEach((d, i) => {
          const t = (f - start(i)) / FALL;
          if (t >= 0 && t < 1) goldBlock(p, d.x, Math.round(d.y - 36 * (1 - t) ** 2), GOLD.lit);
        });
      }),
    );
  const card = (shown: number) => () => draw(sky, (p) => (madeWith(p), sandboxEdition(p, shown)));
  for (let k = 1; k <= Math.ceil(EDITION.length / 2); k++) r.add(draw(card(k * 2), drawLogo));
  return shineAndFade(r, card(EDITION.length));
}

/** Wipe: the wall of blue blocks turns over in a diagonal wave, showing the card behind it. */
function wipe(): Reel {
  const wall = blockWall();
  const r = new Reel(madeWithPalette()).fadeIn(wall, 4).add(wall, 3);
  const begin = (bx: number, by: number) => (bx + by * 0.6) * 1.3;
  const rows = [20, 14, 6]; // a block lights up, then turns over edge on
  const end = begin(W / 20 - 1, H / 20 - 1) + rows.length;
  const card = restCard();
  const bare = () => draw(sky, (p) => (madeWith(p), sandboxEdition(p)));
  for (let f = 0; f < end; f++) {
    const p = new Pixels(W, H);
    p.px.set(card.px);
    for (let by = 0; by < H / 20; by++)
      for (let bx = 0; bx < W / 20; bx++) {
        const k = Math.floor(f - begin(bx, by));
        if (k < 0) blueBlock(p, bx * 20, by * 20);
        else if (k < rows.length) blueBlock(p, bx * 20, by * 20, rows[k], k === 0);
      }
    r.add(p);
  }
  return shineAndFade(r, bare);
}

/** Each letter's left and right edge in GAME-MAKER. */
function letterSpans(): [number, number][] {
  return [...LOGO].map((_, i) => {
    const xs = logoDots()
      .filter((d) => d.letter === i)
      .map((d) => d.x);
    return [Math.min(...xs), Math.max(...xs) + 4];
  });
}

/** Typewriter: a DOS prompt, then the card typed in with a cursor. */
function typewriter(): Reel {
  const r = new Reel(madeWithPalette());
  const black = () => new Pixels(W, H, BLACK);
  const prompt = (typed: string, cursor: boolean) => (p: Pixels) => {
    lettering(p, `C:\\GM>${typed}`, { x: 8 }, 12, 1, () => GRAY, undefined, false);
    if (cursor) p.rect(8 + (6 + typed.length) * 8, 19, 8, 1, GRAY);
  };
  // the prompt, GM typed, Enter
  for (const [typed, cursor] of [
    ['', true],
    ['', true],
    ['', false],
    ['G', true],
    ['GM', true],
    ['GM', false],
  ] as [string, boolean][])
    r.add(draw(black, prompt(typed, cursor)));
  r.add(black(), 2);
  const madeY = 40 + 14;
  for (let k = 1; k <= MADE.length; k++) r.add(draw(black, (p) => (madeWith(p, k), p.rect(160 - MADE.length * 8 + k * 16, madeY, 14, 2, WHITE))));
  const spans = letterSpans();
  const [, , right, bottom] = logoBox();
  const goldCursor = (p: Pixels, i: number) => {
    const [x0, x1] = spans[i] ?? [right + 2, right + 22];
    for (let x = x0; x < x1; x += 4) goldBlock(p, x, bottom - 4);
  };
  for (let i = 0; i <= LOGO.length; i++)
    r.add(
      draw(black, (p) => {
        madeWith(p);
        drawLogo(p, undefined, (d) => d.letter < i);
        goldCursor(p, i);
      }),
      i === 0 ? 1 : 2,
    );
  const typed = (shown: number) => () => draw(black, (p) => (madeWith(p), drawLogo(p), sandboxEdition(p, shown)));
  for (let k = 1; k <= Math.ceil(EDITION.length / 2); k++) r.add(typed(k * 2)());
  const edEnd = 160 + EDITION.length * 8;
  for (let blink = 0; blink < 6; blink++)
    r.add(
      draw(typed(EDITION.length), (p) => {
        if (blink % 2 === 0) p.rect(edEnd + 2, 136 + 14, 14, 2, WHITE);
      }),
      2,
    );
  return r.fadeOut(FADE);
}

const INTROS: [file: string, reel: () => Reel][] = [
  ['mwblocks.fli', blocks],
  ['mwwipe.fli', wipe],
  ['mwtype.fli', typewriter],
];

{
  const out = join(import.meta.dirname, '../../web/public/opening');
  mkdirSync(out, { recursive: true });
  const preview = process.env.PREVIEW;
  for (const [file, make] of INTROS) {
    const reel = make();
    const fli = reel.fli(SPEED);
    writeFileSync(join(out, file), fli);
    console.log(`${file} ${fli.length} bytes, ${reel.frames.length} frames (${reel.seconds(SPEED).toFixed(1)} s)`);
    if (preview) {
      mkdirSync(preview, { recursive: true });
      reel.frames.forEach((px, f) => {
        if (f % 4) return;
        const p = new Pixels(W, H);
        p.px.set(px);
        writePng(join(preview, `${file.replace('.fli', '')}-${String(f).padStart(2, '0')}.png`), p, reel.palettes[f], 2);
      });
    }
  }
}
