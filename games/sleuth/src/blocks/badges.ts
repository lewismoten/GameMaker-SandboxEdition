// Eighteen small scenery blocks for the site's achievement badges (art by Claude Sonnet 5.5): a rotary dial, a
// number card with three crossed-out lines, two friendly masks, a ribbon in an open book, a folded leaflet, a
// registration form and pencil, a clipboard of badges, a blank sheet with a folded corner, a film strip jumping a gap,
// a clapperboard, a magnifier over a grid, a face peeking round the curtain, a ringing phone, a handset beside a
// sleeping modem, a heat map with footprints, a desk speaker, a merit medal and a wreath of tin hearts. They are
// plain scenery (no solid, score or touch) set on the green room's rug, the stage boards or the curtain; they sit
// in GREEN.BBL after every earlier block, so no block moves.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { c } from '../art/pal';
import { microC } from '../art/draw';
import type { BlockDef } from './blockset';
import { clone } from './painters';

/** The floors and curtain the scenery sits on (the same blocks the rooms use). */
export interface Floors {
  rug: Pixels;
  stage: Pixels;
  curtain: (seed: number) => Pixels;
}

/** A filled ellipse. */
function oval(p: Pixels, cx: number, cy: number, rx: number, ry: number, col: number): void {
  for (let y = -ry; y <= ry; y++) {
    const h = Math.round(rx * Math.sqrt(1 - (y / ry) ** 2));
    p.rect(cx - h, cy + y, h * 2 + 1, 1, col);
  }
}

export function addBadgeBlocks(add: (name: string, p: Pixels, d?: BlockDef) => number, fl: Floors): void {
  const K = c('black', 0);
  const on = (bg: Pixels, draw: (p: Pixels) => void): Pixels => {
    const p = clone(bg);
    draw(p);
    return p;
  };

  // a rotary dial, the last finger hole lit
  add(
    'rotaryDial',
    on(fl.rug, (p) => {
      p.disc(10, 10, 9, K).disc(10, 10, 8, c('gray', 6)).ring(10, 10, 8, c('gray', 7));
      p.disc(10, 10, 3, K).disc(10, 10, 2, c('paper', 5)).set(10, 10, K);
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI * 2 * (0.62 + i * 0.077)) % (Math.PI * 2);
        const x = Math.round(10 + Math.cos(a) * 5.6);
        const y = Math.round(10 + Math.sin(a) * 5.6);
        p.disc(x, y, 1, i === 9 ? c('glow', 1) : K);
        if (i === 9) p.ring(x, y, 2, c('gold', 5));
      }
      p.rect(15, 16, 3, 2, K).rect(15, 16, 2, 1, c('gray', 3));
    }),
  );

  // a number card, three lines each struck out in red
  add(
    'numberCard',
    on(fl.rug, (p) => {
      p.rect(2, 3, 16, 14, K).rect(3, 4, 14, 12, c('paper', 5)).rect(3, 4, 14, 1, c('paper', 3));
      for (const y of [6, 10, 14]) {
        for (const x of [4, 7, 10, 13]) p.rect(x, y, 2, 2, c('black', 1));
        p.line(3, y + 2, 16, y - 1, c('velvet', 5)).line(3, y + 1, 16, y - 2, c('velvet', 4));
      }
    }),
  );

  // two friendly masks, one gold and one pale, both smiling
  add(
    'maskPair',
    on(fl.stage, (p) => {
      const face = (cx: number, cy: number, col: number, edge: number) => {
        oval(p, cx, cy, 6, 7, K);
        oval(p, cx, cy, 5, 6, col);
        p.line(cx - 4, cy - 5, cx + 4, cy - 5, edge);
        oval(p, cx - 2, cy - 1, 1, 1, K);
        oval(p, cx + 2, cy - 1, 1, 1, K);
        p.line(cx - 3, cy + 2, cx - 2, cy + 3, K)
          .line(cx - 2, cy + 3, cx + 2, cy + 3, K)
          .line(cx + 2, cy + 3, cx + 3, cy + 2, K);
      };
      face(7, 8, c('gold', 4), c('gold', 5));
      face(13, 12, c('paper', 5), c('paper', 3));
      p.line(1, 3, 3, 1, c('velvet', 4)).line(18, 17, 16, 19, c('velvet', 4));
    }),
  );

  // an open book with a ribbon marker hanging from the spine
  add(
    'ribbonBook',
    on(fl.rug, (p) => {
      p.rect(1, 3, 18, 13, K).rect(2, 4, 8, 11, c('paper', 5)).rect(10, 4, 8, 11, c('paper', 4)).rect(9, 4, 2, 11, c('paper', 2));
      p.rect(1, 14, 18, 2, c('wood', 2));
      for (let i = 0; i < 4; i++) p.rect(3, 6 + i * 2, 5, 1, c('gray', 3)).rect(12, 6 + i * 2, 5, 1, c('gray', 3));
      p.rect(9, 3, 2, 15, c('velvet', 4)).rect(9, 3, 1, 15, c('velvet', 5)).set(9, 18, c('velvet', 4)).set(10, 19, c('velvet', 2)).set(9, 19, c('velvet', 4));
      p.set(10, 18, K);
    }),
  );

  // a folded instruction leaflet in three panels
  add(
    'leaflet',
    on(fl.rug, (p) => {
      const panel = (x: number, top: number, bot: number, col: number) => {
        p.rect(x - 1, top - 1, 8, bot - top + 3, K).rect(x, top, 6, bot - top + 1, col);
      };
      panel(1, 4, 15, c('paper', 4));
      panel(7, 3, 16, c('paper', 5));
      panel(13, 4, 15, c('paper', 3));
      microC(p, 10, 5, '?', c('navy', 1), 2);
      for (const x of [2, 14]) p.rect(x, 7, 4, 1, c('gray', 3)).rect(x, 9, 4, 1, c('gray', 3)).rect(x, 11, 3, 1, c('gray', 3));
      p.rect(8, 12, 4, 1, c('gray', 3));
    }),
  );

  // a registration form with a pencil across it
  add(
    'regForm',
    on(fl.rug, (p) => {
      p.rect(2, 2, 13, 17, K).rect(3, 3, 11, 15, c('paper', 5)).rect(4, 4, 9, 2, c('navy', 2));
      for (const y of [8, 11]) p.frame(4, y, 9, 2, c('gray', 3));
      p.frame(4, 14, 3, 3, c('gray', 3)).set(5, 15, K).line(8, 16, 12, 16, c('gray', 3));
      p.line(9, 18, 18, 8, K).line(10, 18, 19, 8, K).line(8, 17, 17, 7, c('gold', 4)).line(9, 17, 18, 7, c('gold', 3));
      p.set(7, 18, K).set(8, 18, c('tan', 2)).set(18, 5, c('velvet', 5)).set(19, 6, c('velvet', 4));
    }),
  );

  // a clipboard full of tiny round badges
  add(
    'badgeClip',
    on(fl.rug, (p) => {
      p.rect(3, 2, 14, 17, K).rect(4, 3, 12, 15, c('wood', 3)).rect(5, 5, 10, 12, c('paper', 5));
      p.rect(7, 1, 6, 3, c('gray', 5)).rect(7, 1, 6, 1, c('gray', 7)).rect(9, 2, 2, 1, K);
      const cols = ['gold', 'velvet', 'teal', 'green', 'plum', 'glow'];
      cols.forEach((n, i) => {
        const x = 7 + (i % 3) * 3;
        const y = 7 + Math.floor(i / 3) * 4;
        p.disc(x, y, 1, c(n, 3)).set(x - 1, y - 1, c(n, 5));
      });
      p.rect(6, 15, 8, 1, c('gray', 3));
    }),
  );

  // a blank sheet with its corner folded
  add(
    'blankSheet',
    on(fl.rug, (p) => {
      p.rect(3, 2, 14, 17, K).rect(4, 3, 12, 15, c('paper', 5));
      const bg = fl.rug;
      for (let y = 13; y <= 19; y++)
        for (let x = 11; x <= 17; x++) {
          if (x + y > 29) p.set(x, y, bg.get(x, y));
          else if (x >= 11 && y >= 13) p.set(x, y, x + y === 29 || x === 11 || y === 13 ? K : c('gray', 3));
        }
      p.rect(5, 5, 6, 1, c('paper', 3)).rect(5, 7, 4, 1, c('paper', 3));
    }),
  );

  // a film strip jumping a small gap
  add(
    'filmJump',
    on(fl.stage, (p) => {
      const strip = (x: number, y: number, w: number) => {
        p.rect(x, y, w, 8, K)
          .rect(x + 1, y + 2, w - 2, 4, c('gray', 2))
          .rect(x + 2, y + 3, w - 4, 2, c('navy', 2));
        for (let i = 1; i < w - 1; i += 3) p.set(x + i, y + 1, c('paper', 5)).set(x + i, y + 6, c('paper', 5));
      };
      strip(0, 11, 8);
      strip(12, 6, 8);
      p.line(5, 9, 8, 4, c('gold', 4)).line(8, 4, 12, 3, c('gold', 4)).line(6, 9, 9, 5, c('gold', 3));
      p.set(13, 3, c('gold', 5)).set(12, 2, c('gold', 5)).set(12, 4, c('gold', 5));
    }),
  );

  // a clapperboard with a bright star
  add(
    'clapper',
    on(fl.stage, (p) => {
      p.rect(2, 8, 16, 10, K).rect(3, 9, 14, 8, c('black', 1));
      p.draw(6, 10, ['...#...', '...#...', '#######', '.#####.', '..###..', '.##.##.', '.#...#.'], { '#': c('gold', 5) });
      p.rect(2, 3, 16, 4, K);
      for (let i = 0; i < 4; i++) p.rect(3 + i * 4, 4, 2, 2, c('paper', 5)).rect(5 + i * 4, 4, 2, 2, c('black', 1));
      p.line(2, 6, 14, 1, K).line(2, 5, 14, 0, K).rect(14, 0, 3, 2, K);
    }),
  );

  // a magnifier over a tidy grid
  add(
    'loupeGrid',
    on(fl.rug, (p) => {
      p.rect(1, 2, 14, 14, K).rect(2, 3, 12, 12, c('paper', 5));
      for (let i = 0; i < 4; i++) p.rect(2, 6 + i * 3, 12, 1, c('gray', 3)).rect(5 + i * 3, 3, 1, 12, c('gray', 3));
      p.disc(11, 9, 6, K).disc(11, 9, 5, c('gold', 4)).disc(11, 9, 4, c('teal', 1)).disc(11, 9, 3, c('teal', 2));
      p.set(9, 7, c('ghost', 3)).set(10, 7, c('ghost', 3)).set(9, 8, c('ghost', 3));
      p.line(15, 14, 19, 18, K).line(16, 14, 19, 17, c('wood', 4)).line(15, 15, 18, 18, c('wood', 3));
    }),
  );

  // a face peeking round the curtain
  add(
    'peekCurtain',
    on(fl.curtain(0), (p) => {
      p.rect(9, 0, 11, 20, c('black', 1));
      p.rect(9, 0, 11, 1, c('gold', 3));
      oval(p, 14, 10, 5, 6, K);
      oval(p, 14, 10, 4, 5, c('skin', 4));
      p.rect(10, 4, 9, 2, c('auburn', 1)).rect(11, 3, 6, 1, c('auburn', 1));
      p.rect(11, 9, 3, 2, c('paper', 5)).set(11, 10, K).set(12, 10, K).rect(15, 9, 3, 2, c('paper', 5)).set(15, 10, K).set(16, 10, K);
      p.line(12, 13, 13, 14, K).line(13, 14, 16, 14, K).line(16, 14, 17, 13, K);
      for (let y = 0; y < 20; y++) {
        const edge = 10 + Math.round(Math.sin(y * 0.6) * 1.2);
        p.rect(0, y, edge, 1, c('velvet', [1, 3, 5, 6, 5, 3, 2][(y + 2) % 7]));
        p.set(edge, y, K);
      }
      p.rect(6, 0, 4, 2, c('gold', 3));
    }),
  );

  // a ringing telephone
  add(
    'deskPhone',
    on(fl.rug, (p) => {
      p.rect(3, 10, 14, 9, K).rect(4, 11, 12, 7, c('velvet', 3)).rect(4, 11, 12, 1, c('velvet', 5));
      p.disc(10, 15, 3, K).disc(10, 15, 2, c('paper', 4));
      for (const [x, y] of [
        [10, 13],
        [8, 15],
        [12, 15],
        [10, 17],
      ])
        p.set(x, y, K);
      p.rect(2, 6, 16, 4, K).rect(3, 7, 14, 2, c('black', 2)).rect(3, 7, 14, 1, c('gray', 5));
      p.rect(2, 8, 3, 3, K).rect(15, 8, 3, 3, K).rect(3, 9, 1, 1, c('gray', 4)).rect(16, 9, 1, 1, c('gray', 4));
      p.line(0, 3, 1, 5, c('gold', 5)).line(0, 8, 1, 7, c('gold', 5)).line(19, 3, 18, 5, c('gold', 5)).line(19, 8, 18, 7, c('gold', 5));
      p.line(4, 2, 5, 4, c('gold', 4)).line(15, 2, 14, 4, c('gold', 4));
    }),
  );

  // a handset off its hook beside a sleeping modem
  add(
    'busyLine',
    on(fl.rug, (p) => {
      p.rect(1, 3, 3, 9, K).rect(2, 3, 1, 9, c('black', 2)).rect(1, 11, 8, 3, K).rect(2, 12, 6, 1, c('black', 2));
      p.rect(1, 3, 6, 3, K).rect(2, 4, 4, 1, c('black', 2));
      p.line(4, 14, 5, 17, c('gray', 4)).line(5, 17, 9, 18, c('gray', 4));
      p.rect(8, 8, 11, 8, K).rect(9, 9, 9, 6, c('tan', 2)).rect(9, 9, 9, 1, c('tan', 4));
      for (let i = 0; i < 4; i++) p.set(10 + i * 2, 13, c('gray', 2));
      p.set(16, 11, c('velvet', 1));
      microC(p, 15, 2, 'Z', c('ghost', 2));
      microC(p, 18, 0, 'z', c('ghost', 1));
    }),
  );

  // a heat map with warm footprints
  add(
    'heatMap',
    on(fl.rug, (p) => {
      p.rect(1, 2, 18, 16, K).rect(2, 3, 16, 14, c('paper', 4));
      oval(p, 12, 9, 7, 5, c('glow', 0));
      oval(p, 12, 9, 5, 4, c('neon', 2));
      oval(p, 12, 9, 3, 2, c('glow', 3));
      for (const [x, y] of [
        [4, 14],
        [7, 10],
        [10, 6],
      ]) {
        oval(p, x, y + 1, 1, 2, K);
        p.set(x - 1, y - 2, K)
          .set(x, y - 3, K)
          .set(x + 1, y - 2, K);
      }
      p.line(4, 5, 7, 5, c('gray', 3));
    }),
  );

  // a small desk speaker, its sound shaking the air
  add(
    'deskSpeaker',
    on(fl.rug, (p) => {
      p.rect(5, 2, 10, 16, K).rect(6, 3, 8, 14, c('black', 1));
      p.disc(10, 7, 3, K).disc(10, 7, 2, c('gray', 3)).disc(10, 7, 1, c('gray', 6));
      p.disc(10, 13, 2, K).disc(10, 13, 1, c('gray', 3));
      p.line(3, 5, 2, 8, c('gold', 5)).line(2, 8, 3, 11, c('gold', 5)).line(1, 4, 0, 8, c('gold', 3)).line(0, 8, 1, 12, c('gold', 3));
      p.line(16, 5, 17, 8, c('gold', 5)).line(17, 8, 16, 11, c('gold', 5)).line(18, 4, 19, 8, c('gold', 3)).line(19, 8, 18, 12, c('gold', 3));
    }),
  );

  // a merit medal: a star on a ribbon
  add(
    'meritMedal',
    on(fl.stage, (p) => {
      p.line(5, 0, 9, 8, K).line(6, 0, 10, 8, c('navy', 3)).line(14, 0, 10, 8, K).line(13, 0, 9, 8, c('velvet', 4));
      p.disc(10, 13, 6, K).disc(10, 13, 5, c('gold', 3));
      p.draw(6, 10, ['....#....', '....#....', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.'], { '#': c('gold', 5) });
    }),
  );

  // a wreath of tiny tin hearts
  add(
    'heartWreath',
    on(fl.rug, (p) => {
      const heart = ['.#.#.', '#####', '.###.', '..#..'];
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
        const cx = Math.round(10 + Math.cos(a) * 7) - 2;
        const cy = Math.round(10 + Math.sin(a) * 7) - 2;
        for (const [dx, dy] of [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ])
          p.draw(cx + dx, cy + dy, heart, { '#': K });
        p.draw(cx, cy, heart, { '#': c('gray', 5) });
        p.set(cx + 1, cy + 1, c('gray', 7));
      }
    }),
  );
}
