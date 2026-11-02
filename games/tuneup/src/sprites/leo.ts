// LEO.CBL's drawing: Doc Leo as Lewis Moten's hobo clown, two blocks tall. His own face paint
// (white patches round the eyes and the mouth), wire glasses, painted gray stubble, his own nose
// sunburned pink, a chewed gray fedora with pins in its band, a patched navy corduroy jacket
// over a purple shirt and green tie, navy trousers and red sneakers; for the tune-up, a red shop
// rag hangs from his jacket pocket. The pose shapes (stride, hop, climb from behind, crouch)
// follow the drawing CERTIFIED RAT TICKLER made of him (games/tickle/src/sprites/sprites.ts),
// without its lab coat.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/kit/pixels';
import { outline } from '@lewismoten/gamemaker-sandbox-tools/kit/blit';
import { blob } from '../../../snowbound/src/art/draw';
import { makeBook, T } from '../../../snowbound/src/sprites/kidArt';
import type { Pal } from '../art/palette';

interface LeoPose {
  /** Facing you, side on (walking right), or from behind (climbing). */
  view: 'front' | 'side' | 'rear';
  /** Walking stride (0..3) in side view. */
  stride?: number;
  arms?: 'down' | 'up' | 'press';
  face?: 'smile' | 'blink' | 'laugh' | 'ouch' | 'dazed' | 'grin';
  /** Pixels the whole body is lowered (crouching). */
  crouch?: number;
  /** Knees bent for a hop. */
  hop?: boolean;
  /** No hat: it has fallen off. */
  hatless?: boolean;
}

/** Doc Leo, 20 x 40 (top block over bottom block). */
function leoArt(pal: Pal) {
  const c = pal.c;
  const ink = c('ink', 0);
  return (o: LeoPose): Pixels => {
    const p = new Pixels(20, 40, T);
    const side = o.view === 'side';
    const rear = o.view === 'rear';
    const dy = o.crouch ?? 0;
    // ---- legs and sneakers
    const shoe = (x: number, y: number, flip = false) => {
      p.rect(x, y, 5, 2, c('sneaker', 1)).rect(x + (flip ? 0 : 1), y, 3, 1, c('sneaker', 2));
      p.rect(x, y + 2, 5, 1, c('paint', 1));
    };
    if (!side) {
      const knee = o.hop ? 2 : 0;
      const legTop = 29 + dy;
      if (dy >= 4) {
        p.rect(4, legTop, 5, 37 - legTop, c('navy', 1)).rect(11, legTop, 5, 37 - legTop, c('navy', 1));
        shoe(3, 37, true);
        shoe(12, 37);
      } else {
        p.rect(6 - knee, legTop, 4, 37 - legTop, c('navy', 1))
          .rect(10 + knee, legTop, 4, 37 - legTop, c('navy', 1))
          .rect(9, legTop + 1, 2, 37 - legTop - 1, c('navy', 0));
        shoe(5 - knee, 37, true);
        shoe(10 + knee, 37);
      }
    } else {
      const s = o.stride ?? 0;
      const swing = [0, 3, 0, -3][s % 4];
      const lift = [0, 1, 0, 1][s % 4];
      if (o.hop) {
        p.line(9, 30, 6, 36, c('navy', 1)).line(10, 30, 7, 36, c('navy', 1)).line(11, 30, 13, 35, c('navy', 1)).line(12, 30, 14, 35, c('navy', 0));
        shoe(4, 36);
        shoe(12, 35);
      } else {
        p.line(10, 29, 10 - swing, 37, c('navy', 0)).line(11, 29, 11 - swing, 37, c('navy', 0));
        p.line(9, 29, 9 + swing, 37 - lift, c('navy', 1)).line(10, 29, 10 + swing, 37 - lift, c('navy', 1));
        shoe(8 - swing, 37);
        shoe(8 + swing, 37 - lift);
      }
    }
    // ---- the corduroy jacket, hip length
    const top = 19 + dy;
    const hem = (side ? 30 : 31) + dy;
    for (let y = top; y < hem; y++) {
      const half = side ? 4 + (y - top) * 0.1 : 5 + (y - top) * 0.12;
      for (let x = Math.round(10 - half); x <= 10 + half; x++) p.set(x, y, c('coat', x < 10 - half + 2 ? 1 : x > 10 + half - 1 ? 3 : 2));
    }
    p.rect(Math.round(side ? 6 : 5), hem - 1, side ? 9 : 11, 1, c('coat', 1));
    if (rear) {
      // the back seam, and a patch sewn on with big stitches
      p.line(10, top + 3, 10, hem - 2, c('coat', 1));
      p.rect(11, top + 4, 4, 4, c('purple', 2))
        .set(11, top + 4, c('paint', 2))
        .set(14, top + 7, c('paint', 2));
    } else if (!side) {
      // the shirt and tie in the open front
      for (let y = top; y < top + 9; y++) p.rect(8, y, 4, 1, c('purple', 1));
      for (let y = top; y < top + 8; y++) p.rect(9, y, 2, 1, c('tie', y < top + 2 ? 2 : 1));
      p.set(9, top + 8, c('tie', 1)).set(10, top + 8, c('tie', 0));
      p.line(7, top, 9, top + 8, c('coat', 0)).line(12, top, 10, top + 8, c('coat', 0));
      // a patch on the left hip, stitched
      p.rect(5, top + 6, 3, 3, c('tie', 2))
        .set(5, top + 6, c('paint', 2))
        .set(7, top + 8, c('paint', 2));
      // the right pocket, and the red shop rag hanging from it
      p.rect(12, top + 6, 3, 1, c('coat', 0))
        .rect(13, top + 5, 2, 6, c('sneaker', 2))
        .set(14, top + 10, c('sneaker', 1));
    } else {
      p.rect(12, top, 2, 6, c('purple', 1)).rect(13, top + 1, 1, 6, c('tie', 1));
      p.rect(7, top + 5, 3, 3, c('tie', 2)).set(7, top + 5, c('paint', 2));
      p.rect(6, top + 7, 2, 5, c('sneaker', 2));
    }
    // ---- arms: corduroy sleeves, a patch at each elbow seen from the front
    const sleeve = (x0: number, y0: number, x1: number, y1: number) => {
      p.line(x0, y0, x1, y1, c('coat', 2)).line(x0 + 1, y0, x1 + 1, y1, c('coat', 1));
      p.disc(x1 + 0.5, y1 + 1, 1.3, c('skin', 2));
    };
    const arms = o.arms ?? 'down';
    if (side) {
      const s = o.stride ?? 0;
      if (arms === 'up') sleeve(10, top + 2, 13, top - 6);
      else sleeve(10, top + 2, 10 + [2, 0, -2, 0][s % 4], top + 10);
    } else if (arms === 'down') {
      sleeve(4, top + 1, 3, top + 11);
      sleeve(15, top + 1, 15, top + 11);
    } else if (arms === 'up') {
      sleeve(4, top + 2, 1, top - 8);
      sleeve(15, top + 2, 17, top - 8);
    } else {
      sleeve(4, top + 1, 0, top + 12);
      sleeve(15, top + 1, 18, top + 12);
    }
    // ---- the head
    const hy = 8 + dy;
    const fx = side ? 11 : 10;
    const face = o.face ?? 'smile';
    p.rect(7, top - 1, 6, 1, rear ? c('coat', 2) : c('purple', 2));
    if (side) blob(p, fx, hy + 4.5, 4, 5, pal.r('skin'), 1, 3);
    else blob(p, fx, hy + 4.5, 5, 5, pal.r('skin'), 1, 3);
    if (rear) {
      for (let y = hy; y < hy + 6; y++)
        for (let x = fx - 5; x <= fx + 5; x++)
          if (p.get(x, y) !== T && !(y >= hy + 3 && y <= hy + 4 && Math.abs(x - fx) >= 4)) p.set(x, y, c('gray', y < hy + 2 ? 2 : 1));
    } else {
      // painted gray stubble over the jaw
      for (let y = hy + 5; y < hy + 10; y++)
        for (let x = fx - 5; x <= fx + 5; x++) if (p.get(x, y) !== T && (x + y) % 2 === 0 && (y > hy + 6 || Math.abs(x - fx) > 3)) p.set(x, y, c('gray', 1));
      // the white mouth patch, and the mouth
      const mx = side ? fx + 2 : fx;
      p.rect(mx - (side ? 1 : 2), hy + 6, side ? 3 : 5, 3, c('paint', 1));
      if (face === 'laugh') p.rect(mx - (side ? 0 : 1), hy + 6, side ? 2 : 3, 3, c('nose', 0)).set(mx, hy + 6, c('paint', 1));
      else if (face === 'ouch' || face === 'dazed') p.rect(mx - 1, hy + 8, 3, 1, ink).set(mx, hy + 7, ink);
      else if (face === 'grin')
        p.rect(mx - 2, hy + 7, 5, 1, ink)
          .set(mx - 2, hy + 6, ink)
          .set(mx + 2, hy + 6, ink);
      else
        p.set(mx - 1, hy + 7, ink)
          .set(mx, hy + 8, ink)
          .set(mx + 1, hy + 7, ink);
      // eyes in white patches, behind wire glasses
      const eyes = side ? [fx + 1] : [fx - 2, fx + 2];
      for (const ex of eyes) {
        p.rect(ex - 1, hy + 2, 2, 2, c('paint', 1));
        if (face === 'blink' || face === 'laugh') p.rect(ex - 1, hy + 3, 2, 1, ink);
        else if (face === 'dazed') p.set(ex - 1, hy + 2, ink).set(ex, hy + 3, ink);
        else p.set(ex, hy + 3, ink);
        p.rect(ex - 1, hy + 1, 2, 1, ink);
      }
      // the wire glasses: a bridge between the eyes and a rim at each side
      if (side) p.line(fx - 1, hy + 2, fx - 3, hy + 2, c('steel', 3)).set(fx + 2, hy + 3, c('steel', 3));
      else
        p.rect(fx - 1, hy + 2, 2, 1, c('steel', 3))
          .rect(fx - 4, hy + 2, 1, 2, c('steel', 3))
          .rect(fx + 3, hy + 2, 1, 2, c('steel', 3));
      // his own nose, sunburned pink
      p.disc(side ? fx + 4 : fx + 0.5, hy + 5, 1.3, c('pink', 1)).set(side ? fx + 4 : fx, hy + 4, c('pink', 2));
    }
    // ---- the fedora: chewed brim, dented crown, a few pins on the band
    if (!o.hatless) {
      const by = hy - 1;
      const bx0 = side ? 4 : 3;
      const bx1 = side ? 17 : 16;
      p.rect(bx0, by, bx1 - bx0 + 1, 1, c('hat', 1))
        .set(bx0 + 1, by, T)
        .set(bx1 - 2, by, T)
        .set(bx0 + 5, by, T);
      for (let y = by - 6; y < by; y++) {
        const w = y === by - 6 ? 3 : 4;
        p.rect(fx - w - (side ? 1 : 0), y, w * 2 + 1, 1, c('hat', y === by - 1 ? 0 : y === by - 6 ? 2 : 1));
      }
      p.set(fx, by - 6, c('hat', 0)).set(fx - 1, by - 5, c('hat', 2));
      for (const [x, k] of [
        [fx - 3, 'nose'],
        [fx - 1, 'cheese'],
        [fx + 2, 'spark'],
      ] as const)
        p.set(x, by - 1, c(k, 2));
    }
    return outline(p, ink);
  };
}

/** Doc Leo's poses, as top and bottom blocks (identical halves are shared). */
export function buildLeoBlocks(pal: Pal) {
  const book = makeBook('cbl');
  const draw = leoArt(pal);
  const seen = new Map<string, string>();
  const poses = new Map<string, [string, string]>();
  const add = (name: string, o: LeoPose) => {
    const pic = draw(o);
    const names: string[] = [];
    for (const [k, y] of [
      ['top', 0],
      ['bot', 20],
    ] as const) {
      const h = pic.crop(0, y, 20, 20);
      const key = Array.from(h.px).join(',');
      let n = seen.get(key);
      if (!n) {
        n = `${name}.${k}`;
        book.add(n, h);
        seen.set(key, n);
      }
      names.push(n);
    }
    poses.set(name, names as [string, string]);
    book.pics.set(`pose.${name}`, pic);
  };
  add('front', { view: 'front' });
  add('blink', { view: 'front', face: 'blink' });
  add('grin', { view: 'front', face: 'grin' });
  for (let s = 0; s < 4; s++) add(`walk${s}`, { view: 'side', stride: s });
  add('hop', { view: 'front', arms: 'up', hop: true, face: 'grin' });
  add('climb', { view: 'rear', arms: 'up', hop: true });
  add('hopSide', { view: 'side', arms: 'up', hop: true, face: 'grin' });
  add('hurt', { view: 'front', face: 'ouch', arms: 'up' });
  add('twist', { view: 'front', face: 'grin', arms: 'press' });
  add('die0', { view: 'front', face: 'dazed', crouch: 4, arms: 'press' });
  add('die1', { view: 'front', face: 'dazed', crouch: 8, arms: 'press', hatless: true });
  return { ...book, poses };
}
