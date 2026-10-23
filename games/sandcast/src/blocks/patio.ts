// The patio where Gwinn naps: flagstones, garden bricks, her water bowl (refills the bucket,
// never runs dry), the path beside her that her snores blow down,
// her toy box (a block that gives birth to a flying rope toy now and then), the Crown of the
// Sandbox, and Gwinn herself: one 120x80 picture cut into 6 x 4 blocks. She blinks by a
// next/ntime chain (the eye block becomes 'catBlink' after 70 ticks, and back after 6), and
// her mouth block gives birth to slobbery tennis balls.
import { GRASS, GREY, OCHRE, PINK, RED, SAND, STEEL, WATER, WOOD, YELLOW } from '../art/palette';
import { MON, SEQ } from '../rules';
import { Pixels, art, ball, bevel, dither, rng, shade, tile } from '../art/draw';
import { DOWN, SOLID, bg, onSand, sprite20 } from './common';

export function addPatio(): void {
  // ---------------------------------------------------------------- the patio, where Gwinn naps
  function flagstone(seed: number): Pixels {
    const p = tile(GREY[0]);
    const r = rng(seed);
    const stones = [
      [0, 0, 11, 8],
      [12, 0, 8, 11],
      [0, 9, 7, 11],
      [8, 9, 4, 11],
      [12, 12, 8, 8],
    ];
    for (const [x, y, w, h] of stones) {
      // dark slate (1-2 of the grey ramp), so Teddy's tan coat stands out against it at dusk
      const s = 1 + Math.floor(r() * 2);
      p.rect(x + 1, y + 1, w - 1, h - 1, shade(GREY, s));
      p.rect(x + 1, y + 1, w - 1, 1, shade(GREY, s + 1));
      p.rect(x + 1, y + h - 1, w - 1, 1, shade(GREY, s - 1));
      for (let k = 0; k < 3; k++) p.set(x + 2 + Math.floor(r() * (w - 3)), y + 2 + Math.floor(r() * (h - 3)), shade(GREY, s - 1));
    }
    return p;
  }
  bg.add('patio', flagstone(171));
  {
    // Old garden bricks, weathered and mossy.
    const p = tile(GREY[1]);
    const r = rng(176);
    for (let row = 0; row < 5; row++) {
      const off = row % 2 ? 5 : 0;
      for (let bx = -1; bx < 3; bx++) {
        const x = bx * 10 + off;
        const c = r() > 0.5 ? WOOD : OCHRE;
        p.rect(x + 1, row * 4 + 1, 9, 3, c[2 + ((row + bx) & 1)]);
        p.rect(x + 1, row * 4 + 1, 9, 1, c[4]);
        if (r() > 0.75) p.rect(x + 2 + Math.floor(r() * 5), row * 4 + 3, 3, 1, GRASS[2]);
      }
    }
    bg.add('brick', p, { solid: SOLID });
  }
  {
    // Gwinn's water bowl (her name in red on the side): each push into it fills your bucket
    // three splashes' worth, and it never runs dry, so you can't run out of water by her paws.
    const mk = (full: boolean) => {
      const p = sprite20();
      ball(p, 10, 10, 9, STEEL, 4);
      p.disc(10, 10, 6.5, full ? WATER[5] : STEEL[2]);
      if (full) p.disc(8, 8, 2, WATER[7]).set(7, 7, WATER[9]);
      p.rect(5, 1, 10, 2, RED[4]);
      for (const x of [6, 9, 12]) p.rect(x, 1, 1, 2, STEEL[7]);
      return onSand(173, p).map((_x, _y, c) => (SAND.includes(c) ? GREY[1] : c));
    };
    bg.add('bowl', mk(true), { solid: SOLID, effect: SEQ.splash, eamt: 3 });
  }
  {
    // Gwinn's snores blow down the narrow path beside her: the path's blocks change all at
    // once on a timer (a next/ntime chain). Quiet for a while, then the tell (dust stirs and
    // a Z drifts up), then the gust itself, a downward current that pushes Teddy back to the
    // patio (it never hurts). Walk up between gusts.
    const calm = flagstone(177);
    bg.add('snore', calm, { next: 'snoreTell', ntime: 66 });
    const tell = flagstone(177);
    const r = rng(178);
    for (let k = 0; k < 9; k++)
      tell.set(2 + Math.floor(r() * 16), 2 + Math.floor(r() * 16), SAND[7]).set(3 + Math.floor(r() * 14), 3 + Math.floor(r() * 14), SAND[5]);
    art(['', '', '   WWWW', '     W', '    W', '   WWWW', '', '          WWW', '            W', '           W', '          WWW'], { W: STEEL[7] }, tell);
    bg.add('snoreTell', tell, { next: 'snoreGust', ntime: 16 });
    // the gust: pale streaks and chevrons blowing down, like the hose currents but dusty
    const gust = flagstone(177);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const ph = (59 - y) % 10; // counted from the bottom, so the chevrons point down
        const chevron = Math.abs(x - 9.5) / 2 + 1;
        if (Math.abs(ph - chevron) < 0.8 && x > 3 && x < 16) gust.set(x, y, STEEL[7]);
        else if (Math.abs(ph - chevron - 1) < 0.8 && x > 3 && x < 16) gust.set(x, y, SAND[6]);
        else if ((x * 5 + y * 3) % 11 === 0) gust.set(x, y, SAND[5]);
      }
    bg.add('snoreGust', gust, { next: 'snore', ntime: 26, grav: DOWN });
  }
  {
    // Gwinn's toy box, overflowing: every so often a rope toy comes flying out.
    const p = tile(GREY[3]);
    p.blit(flagstone(174), 0, 0);
    bevel(p, 2, 6, 16, 12, WOOD, 3, 1);
    p.rect(3, 10, 14, 1, WOOD[1]);
    ball(p, 6, 6, 3, YELLOW, 3);
    p.line(9, 7, 15, 3, RED[4]).line(10, 7, 16, 3, STEEL[7]);
    ball(p, 15, 6, 2.5, PINK, 2);
    p.rect(8, 13, 4, 2, YELLOW[3]);
    bg.add('post2', p, { solid: SOLID, birthMon: MON.rope, birthTime: 160 });
  }
  {
    // The Crown of the Sandbox, in a puddle of light.
    const p = flagstone(175);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (dither(x, y, 1 - Math.hypot(x - 10, y - 11) / 10)) p.set(x, y, YELLOW[4]);
    art(
      [
        '',
        '',
        '',
        '    k   kk   k',
        '   kRk kWWk kRk',
        '   kYk kYYk kYk',
        '   kYYkYYYYkYYk',
        '   kYYYYYYYYYYk',
        '   kYyYYBBYYyYk',
        '   kYYYYBBYYYYk',
        '   kyyyyyyyyyyk',
        '   kkkkkkkkkkkk',
      ],
      { k: YELLOW[0], Y: YELLOW[4], y: YELLOW[2], R: RED[4], W: STEEL[7], B: WATER[5] },
      p,
    );
    bg.add('crown', p, { score: 5000 });
  }
  // Gwinn herself, asleep across the top of the patio on Teddy's crown: 6 x 4 blocks of
  // brown pit-lab. Her eye opens now and then; slobbery tennis balls roll out of her mouth.
  const CAT_W = 6;
  const CAT_H = 4;
  function drawCat(eyes: 'open' | 'shut'): Pixels {
    // (Named for the slot it fills: this is Gwinn, a brown pit-lab mix, sprawled asleep.)
    const c = new Pixels(CAT_W * 20, CAT_H * 20, 255);
    const body = (x: number, y: number) => {
      const bx = (x - 76) / 42;
      const by = (y - 46) / 28;
      return bx * bx + by * by;
    };
    const head = (x: number, y: number) => {
      // A broad pit-bull head with a lab's soft muzzle.
      const hx = (x - 30) / 26;
      const hy = (y - 44) / 22;
      return hx * hx + hy * hy;
    };
    for (let y = 0; y < c.h; y++)
      for (let x = 0; x < c.w; x++) {
        const b = body(x, y);
        const h = head(x, y);
        if (b <= 1) {
          const lit = (46 - y) / 28 - b * 0.6;
          const sheen = Math.sin(x / 7 + y / 11) > 0.85 ? 0.6 : 0;
          c.set(x, y, shade(WOOD, 3.3 + lit * 1.6 + sheen));
        }
        if (h <= 1) {
          const lit = (44 - y) / 22 - h * 0.5;
          c.set(x, y, shade(WOOD, 3.5 + lit * 1.5));
        }
      }
    // Floppy ears, folded down beside her face.
    for (const [ex, dir] of [
      [9, -1],
      [51, 1],
    ] as const)
      for (let y = 0; y < 22; y++)
        for (let x = -7; x <= 7; x++) {
          const w = 7 - Math.abs(y - 9) * 0.45;
          if (Math.abs(x) <= w) c.set(ex + x + dir * y * 0.15, 26 + y, shade(WOOD, 1.6 + (Math.abs(x) < w - 2 ? 0.8 : 0) - y / 30));
        }
    // White blaze: a stripe up her forehead and a big white chest under her chin.
    for (let y = 26; y < 50; y++) for (let x = 27; x < 34; x++) if (Math.abs(x - 30.5) < 1.2 + (y - 26) / 14) c.set(x, y, y > 46 ? STEEL[6] : STEEL[7]);
    for (let y = 58; y < 80; y++)
      for (let x = 44; x < 80; x++) {
        const dx = (x - 62) / 18;
        const dy = (y - 70) / 10;
        if (dx * dx + dy * dy < 1 && body(x, y) <= 1) c.set(x, y, shade(STEEL, 7 - dy));
      }
    // Muzzle, nose, and a pink tongue hanging out in her sleep.
    for (let y = 48; y < 66; y++)
      for (let x = 18; x < 43; x++) {
        const dx = (x - 30.5) / 12;
        const dy = (y - 56) / 9;
        if (dx * dx + dy * dy < 1) c.set(x, y, shade(WOOD, 4.6 - dy * 0.8));
      }
    c.rect(26, 50, 9, 5, STEEL[1]).rect(27, 50, 3, 1, STEEL[4]);
    c.line(30, 55, 30, 59, WOOD[0]).line(30, 59, 24, 62, WOOD[0]).line(30, 59, 37, 62, WOOD[0]);
    c.rect(30, 61, 5, 9, PINK[2]).rect(31, 62, 1, 6, PINK[1]).rect(30, 69, 5, 1, PINK[1]);
    // Eyes (both inside the blinking block, x 20..39, y 40..59: an eye reaching x 40 would stay
    // open in the next block while this one blinks).
    for (const ex of [25, 36]) {
      if (eyes === 'open') {
        c.disc(ex, 43, 3.4, STEEL[7]).disc(ex, 43, 2.4, WOOD[1]).disc(ex, 43, 1.4, 0);
        c.set(ex - 1, 42, STEEL[7]);
      } else {
        for (let x = -3; x <= 3; x++) c.set(ex + x, 43 + Math.round((x * x) / 6), WOOD[0]);
      }
    }
    // Red collar with a gold tag.
    for (let x = 12; x < 50; x++) {
      const y = 66 + Math.round(Math.sin((x - 12) / 12) * 2);
      c.rect(x, y, 1, 3, RED[4]);
    }
    c.disc(44, 72, 2.5, YELLOW[3]).set(43, 71, YELLOW[4]);
    // Hind leg tucked along the bottom right.
    for (let y = 60; y < 78; y++)
      for (let x = 88; x < 118; x++) {
        const dx = (x - 103) / 15;
        const dy = (y - 70) / 8;
        if (dx * dx + dy * dy < 1) c.set(x, y, shade(WOOD, 3 - dy));
      }
    return c;
  }
  {
    const open = drawCat('open');
    const shut = drawCat('shut');
    for (let by = 0; by < CAT_H; by++)
      for (let bx = 0; bx < CAT_W; bx++) {
        const p = flagstone(180 + bx + by * CAT_W).blit(open.crop(bx * 20, by * 20, 20, 20), 0, 0, 255);
        const name = `cat${bx}${by}`;
        const eyeBlock = bx === 1 && by === 2;
        const mouth = bx === 1 && by === 3;
        bg.add(name, p, {
          solid: SOLID,
          hp: -3,
          ...(eyeBlock ? { next: 'catBlink', ntime: 70 } : {}),
          ...(mouth ? { birthMon: MON.slobber, birthTime: 64 } : {}),
        });
        if (eyeBlock)
          bg.add('catBlink', flagstone(180 + bx + by * CAT_W).blit(shut.crop(bx * 20, by * 20, 20, 20), 0, 0, 255), {
            solid: SOLID,
            hp: -3,
            next: name,
            ntime: 6,
          });
      }
  }
}
