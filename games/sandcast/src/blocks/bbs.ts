// THE -= S A N D B O X =- BBS, the room inside the computer: ANSI floor and shade-block
// walls, letter blocks that spell the board's name, the floppy and juice prizes (drawn over
// the ANSI floor), the SysOp's terminal and the NO CARRIER doorway out.
import { FONT8X8 } from '../../../../web/src/gfx/font8x8';
import { ANSI, GREY, STEEL } from '../art/palette';
import { CTR } from '../rules';
import { Pixels, art, bevel, rng, tile } from '../art/draw';
import { SOLID, bg } from './common';

export function addBbs(juiceArt: Pixels): void {
  // ---------------------------------------------------------------- THE -= S A N D B O X =- BBS
  {
    const p = tile(0);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if ((x + y * 2) % 10 === 0 && y % 4 === 1) p.set(x, y, ANSI[1]);
    p.set(4, 9, ANSI[8]).set(14, 17, ANSI[8]);
    bg.add('ansiFloor', p);
  }
  {
    // ANSI shade blocks: dark shade, medium shade, full block in blue/cyan.
    const p = tile(ANSI[1]);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const band = Math.floor(x / 7);
        const on = band === 0 ? (x + y) % 4 === 0 : band === 1 ? (x + y) % 2 === 0 : true;
        p.set(x, y, on ? ANSI[9] : ANSI[1]);
      }
    p.rect(0, 0, 20, 1, ANSI[11]);
    bg.add('ansiWall', p, { solid: SOLID });
  }
  const LETTER_COLORS = [ANSI[14], ANSI[11], ANSI[13], ANSI[10], ANSI[12], ANSI[15]];
  function letterBlock(text: string, color: number, shadow: number): Pixels {
    const p = tile(0);
    const n = text.length;
    const scale = n === 1 ? 2 : 1;
    const w = 8 * scale * n;
    const ox = Math.floor((20 - w) / 2);
    const oy = n === 1 ? 2 : 6;
    [...text].forEach((ch, i) => {
      const g = FONT8X8.subarray(ch.charCodeAt(0) * 8, ch.charCodeAt(0) * 8 + 8);
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++)
          if (g[y] & (1 << x)) {
            p.rect(ox + i * 8 * scale + x * scale + 1, oy + y * scale + 1, scale, scale, shadow);
            p.rect(ox + i * 8 * scale + x * scale, oy + y * scale, scale, scale, color);
          }
    });
    // A little dithered glow underneath, like an ANSI underline.
    for (let x = 1; x < 19; x++) if (x % 2) p.set(x, 19, ANSI[8]);
    return p;
  }
  ['T', 'H', 'E', 'S', 'A', 'N', 'D', 'B', 'O', 'X'].forEach((ch, i) =>
    bg.add(`ltr${ch}`, letterBlock(ch, LETTER_COLORS[i % LETTER_COLORS.length], ANSI[i % 2 ? 5 : 1]), { solid: SOLID }),
  );
  // one '=' block on both sides of SANDBOX (it was '-=' and '=-': the slot went to the ball can)
  bg.add('ltrEq', letterBlock('==', ANSI[12], ANSI[4]), { solid: SOLID });
  {
    // A 3.5" floppy disk, standing shutter down with its label up top: shareware! Points.
    const p = art(
      [
        '',
        '',
        '   kkkkkkkkkkkkkk',
        '   kBWWWWWWWWWWBk',
        '   kBWrrrrrrrrWBk',
        '   kBWWWWWWWWWWBk',
        '   kBWkkkkkkkkWBk',
        '   kBWWWWWWWWWWBk',
        '   kBWkkkkkWWWWBk',
        '   kBWWWWWWWWWWBk',
        '   kBBBBBBBBBBBBk',
        '   kBBBSSSSSSBBBk',
        '   kBBBSSSkkSBBBk',
        '   kBBBSSSkkSBBBk',
        '   kBBBSSSSSSBBBk',
        '   kkkkkkkkkkkkkk',
      ],
      { k: 0, B: ANSI[1], S: STEEL[5], W: STEEL[7], r: ANSI[12] },
    );
    const q = tile(0).blit(bg.pic('ansiFloor'), 0, 0).blit(p, 0, 0, 255);
    bg.add('floppy', q, { score: 300, touch: 'ansiFloor' });
    bg.add('juiceBBS', tile(0).blit(bg.pic('ansiFloor'), 0, 0).blit(juiceArt, 0, 0, 255), { effect: CTR.lives, eamt: 1, score: 200, touch: 'ansiFloor' });
  }
  {
    // The SysOp's terminal, glowing green.
    const p = tile(0).blit(bg.pic('ansiFloor'), 0, 0);
    bevel(p, 1, 2, 18, 14, GREY, 3, 1);
    p.rect(3, 4, 14, 9, 0);
    for (let y = 5; y < 12; y += 2) p.rect(4, y, 4 + ((y * 5) % 9), 1, ANSI[10]);
    p.rect(4, 11, 2, 1, ANSI[15]);
    p.rect(3, 16, 14, 3, GREY[2]).rect(4, 17, 12, 1, GREY[4]);
    bg.add('terminal', p, { solid: SOLID });
  }
  {
    // The way out: a doorway of static.
    const p = tile(0);
    const r = rng(191);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, r() > 0.5 ? ANSI[r() > 0.5 ? 13 : 5] : ANSI[r() > 0.7 ? 15 : 0]);
    p.frame(0, 0, 20, 20, ANSI[14]);
    bg.add('noCarrier', p);
  }
}
