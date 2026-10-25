// gold.fli, the finale's turn (in the middle of Watt's talk, after "the light coming out of the
// hatch is gold"): in Watt's workshop, Watt rolls up to Joe, reaches up and opens the little
// hatch on his chest, and gold light pours out of the tally counter, rays and all, until the
// whole room has turned gold (the lamplit palette turning to the gold one).
import { Pixels } from '../../../../kit/pixels';
import { Reel } from '../../../../kit/reel';
import { wattCameo } from '../../../../kit/cameos';
import { gradient, scaleBlit } from '../../art/draw';
import { PAL, c, r } from '../../art/pal';
import { joe } from '../../sprites/joe';
import { H, W, blend, caption, close, lit } from './common';

/** Joe, at scale 6, and his chest: the hatch over the tally counter. */
const JOE = { x: 110, y: 40, s: 6 };
const HATCH = { x: JOE.x + 6 * 6, y: JOE.y + 10 * 6 + 3, w: 8 * 6, h: 5 * 6 - 3 };
const CORE = { x: HATCH.x + HATCH.w / 2, y: HATCH.y + HATCH.h / 2 };

function workshop(): Pixels {
  const p = new Pixels(W, H);
  gradient(p, 0, 0, W, 160, r('wood'), 1, 3);
  for (let x = 0; x < W; x += 20) p.rect(x, 0, 1, 160, c('wood', 0));
  // the pegboard of tools
  p.rect(14, 22, 80, 54, c('wood', 4));
  for (let y = 26; y < 74; y += 6) for (let x = 18; x < 92; x += 6) p.set(x, y, c('wood', 2));
  p.rect(22, 30, 3, 26, c('stone', 3)).rect(19, 28, 9, 4, c('stone', 2));
  p.rect(36, 30, 2, 22, c('red', 2)).rect(34, 52, 6, 10, c('red', 1));
  p.rect(52, 32, 18, 3, c('stone', 3)).rect(66, 30, 4, 8, c('stone', 3));
  p.disc(82, 44, 7, c('brass', 2)).disc(82, 44, 4, c('wood', 4));
  // the charging socket by the floor, with its little green light
  p.rect(270, 120, 26, 34, c('stone', 2)).frame(270, 120, 26, 34, c('ink', 0));
  p.rect(277, 130, 3, 8, c('ink', 0)).rect(286, 130, 3, 8, c('ink', 0)).disc(283, 146, 2, c('green', 3));
  // the floor
  p.rect(0, 160, W, 40, c('stone', 2));
  for (let x = 0; x < W; x += 32) p.rect(x, 160, 1, 40, c('stone', 1));
  p.rect(0, 160, W, 2, c('stone', 4));
  return p;
}

/** The hatch, open `open` of the way, and the counter behind it (glowing `glow` 0..1). */
function hatch(p: Pixels, open: number, glow: number): void {
  const { x, y, w, h } = HATCH;
  p.rect(x, y, w, h, c('ink', 0));
  p.rect(x + 6, y + 6, w - 12, h - 12, glow > 0 ? c('gold', Math.min(5, 2 + Math.round(glow * 3))) : c('brass', 1));
  for (let i = 0; i < 4; i++) p.rect(x + 10 + i * 8, y + 10, 5, h - 20, glow > 0.4 ? c('gold', 5) : c('brass', 3));
  const dw = Math.max(4, Math.round(w * (1 - open)));
  p.rect(x, y, dw, h, c('tin', 4)).frame(x, y, dw, h, c('tin', 1));
  if (dw > 16)
    for (const [rx, ry] of [
      [x + 3, y + 3],
      [x + dw - 5, y + 3],
      [x + 3, y + h - 5],
      [x + dw - 5, y + h - 5],
    ])
      p.rect(rx, ry, 2, 2, c('brass', 3));
}

/** Gold light pouring out round Joe: rays `len` long (drawn behind him). */
function rays(p: Pixels, len: number, turn: number): void {
  for (let i = 0; i < 14; i++) {
    const a = turn + (i * Math.PI * 2) / 14;
    for (let d = 20; d < len; d++) {
      const x = CORE.x + Math.cos(a) * d;
      const y = CORE.y + Math.sin(a) * d * 0.85;
      const wide = 1 + d / 40;
      for (let o = -wide; o <= wide; o++) {
        const px = Math.round(x - Math.sin(a) * o);
        const py = Math.round(y + Math.cos(a) * o);
        if ((px + py) % 2 === 0 || Math.abs(o) < 1) p.set(px, py, c('gold', Math.abs(o) < 1 ? 5 : 3));
      }
    }
  }
}

export function goldFli(): Uint8Array {
  const bg = workshop();
  const lamp = lit('lamp');
  const gold = lit('gold');
  const reel = new Reel(lamp);
  const wattAt = (p: Pixels, x: number, k: number) => scaleBlit(p, wattCameo(PAL.pal, 'side', k % 2, k % 9 === 4 ? 'blink' : 'ok'), x, 100, 3, true);
  const joeIs = (p: Pixels, look: 'open' | 'blink' | 'glad') => scaleBlit(p, joe('down', 0, look), JOE.x, JOE.y, JOE.s);
  for (let k = 1; k <= 8; k++) reel.frame(bg, (p) => (joeIs(p, 'open'), hatch(p, 0, 0)), 1, k / 8);
  // Watt rolls up on his treads: "Beep?"
  for (let k = 0; k < 14; k++)
    reel.frame(bg, (p) => {
      joeIs(p, k === 10 ? 'blink' : 'open');
      hatch(p, 0, 0);
      wattAt(p, -60 + k * 7, k);
      caption(p, 'BEEP?');
    });
  // he reaches up and opens the little hatch
  for (let k = 0; k <= 8; k++)
    reel.frame(bg, (p) => {
      joeIs(p, 'open');
      hatch(p, Math.min(1, k / 6), 0);
      wattAt(p, 38, k < 4 ? 0 : 1);
      caption(p, 'WATT OPENS THE LITTLE HATCH...');
    });
  // and the light coming out of it is gold
  for (let k = 0; k < 30; k++)
    reel.frame(
      bg,
      (p) => {
        rays(p, Math.min(220, 12 + k * 9), 0.1);
        joeIs(p, k < 18 ? 'open' : 'glad');
        hatch(p, 1, Math.min(1, (k + 1) / 8));
        wattAt(p, 38, 0);
        caption(p, 'THE LIGHT COMING OUT IS GOLD.');
      },
      1,
      1,
      blend(lamp, gold, Math.min(1, k / 16)),
    );
  return close(reel);
}
