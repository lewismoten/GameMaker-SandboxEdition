// Tests: a game's mug badge (desk/mug/gameBadge.ts): the medallion's crop stays inside the
// title screen, the picture is see-through outside the badge, the title's lettering is lifted
// off its background, and every game's title box finds its lettering on its real TITLE.GIF.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BADGE_CX, BADGE_CY, BADGE_H, BADGE_W, RING, composeBadge, cropCenterX, titleMask, trimSprite, type Indexed } from '../src/desk/mug/gameBadge';
import { GAME_MUGS } from '../src/desk/mug/gameMugArt';
import { decodeGif } from '../src/formats/gif';
import { paletteToRGBA } from '../src/formats/palette';

/** A 320 x 200 screen in color 1, a 40 x 16 block of "lettering" in color 2 at (140, 20) and a 2-pixel speck in color 2. */
function screen(): Indexed {
  const pixels = new Uint8Array(320 * 200).fill(1);
  for (let y = 20; y < 36; y++) pixels.fill(2, y * 320 + 140, y * 320 + 180);
  pixels[60 * 320 + 40] = pixels[60 * 320 + 41] = 2;
  const palette = new Uint8Array(768);
  palette.set([0, 0, 40, 63, 63, 0], 3); // 1 dark blue, 2 yellow
  return { width: 320, height: 200, pixels, palette };
}

describe('the medallion', () => {
  it('keeps its crop inside the screen', () => {
    expect(cropCenterX(320)).toBe(160);
    expect(cropCenterX(320, 0)).toBe(100);
    expect(cropCenterX(320, 400)).toBe(220);
    expect(cropCenterX(320, 205)).toBe(205);
  });

  it('is see-through outside the ring and the screen inside it', () => {
    const b = composeBadge(screen(), undefined, { background: '#102030', accent: '#ffcc00' }, { title: [120, 10, 200, 46] });
    expect([b.width, b.height]).toEqual([BADGE_W, BADGE_H]);
    for (const [x, y] of [
      [0, 0],
      [BADGE_W - 1, 0],
      [0, BADGE_H - 1],
      [BADGE_W - 1, BADGE_H - 1],
      [BADGE_CX, BADGE_CY - RING - 1],
      [BADGE_CX - RING - 1, BADGE_CY + 40],
    ])
      expect(b.data[y * BADGE_W + x], `${x},${y}`).toBe(0);
    // just inside the ring, at the middle's height: the screen's color 1
    const s = screen();
    expect(b.data[BADGE_CY * BADGE_W + BADGE_CX - RING + 20]).toBe(paletteToRGBA(s.palette)[1]);
  });

  it('puts the hero in front, past the ring', () => {
    const hero = { width: 4, height: 8, data: new Uint32Array(32).fill(0xff0000ff) };
    const b = composeBadge(screen(), hero, {}, { title: [120, 10, 200, 46] });
    // red pixels below the ring's bottom
    let below = 0;
    for (let y = BADGE_CY + RING + 1; y < BADGE_H; y++) for (let x = 0; x < BADGE_W; x++) if (b.data[y * BADGE_W + x] === 0xff0000ff) below++;
    expect(below).toBeGreaterThan(0);
  });
});

describe('the title’s lettering', () => {
  it('is what the background color does not reach, less specks', () => {
    const t = titleMask(screen(), [20, 10, 300, 70])!;
    expect([t.x, t.y, t.w, t.h]).toEqual([140, 20, 40, 16]);
    expect(t.mask.every((v) => v === 1)).toBe(true);
  });

  it('is nothing when the box holds only background', () => {
    expect(titleMask(screen(), [0, 100, 100, 200])).toBeUndefined();
  });
});

describe('a sprite trimmed', () => {
  it('keeps only its solid part', () => {
    const data = new Uint32Array(20 * 40);
    data[5 * 20 + 3] = data[30 * 20 + 9] = 0xffffffff;
    const t = trimSprite({ width: 20, height: 40, data })!;
    expect([t.width, t.height]).toEqual([7, 26]);
    expect(trimSprite({ width: 2, height: 2, data: new Uint32Array(4) })).toBeUndefined();
  });
});

describe('each game’s badge', () => {
  for (const m of GAME_MUGS)
    it(`${m.game}: its boxes are on the screen and its title box finds the lettering`, () => {
      const img = decodeGif(new Uint8Array(readFileSync(new URL(`../../games/${m.game}/disk/title.gif`, import.meta.url))));
      for (const [x0, y0, x1, y1] of [m.title, ...(m.hide ?? [])]) {
        expect(x0).toBeGreaterThanOrEqual(0);
        expect(y0).toBeGreaterThanOrEqual(0);
        expect(x1).toBeLessThanOrEqual(img.width);
        expect(y1).toBeLessThanOrEqual(img.height);
        expect(x1).toBeGreaterThan(x0);
        expect(y1).toBeGreaterThan(y0);
      }
      expect(cropCenterX(img.width, m.centerX)).toBe(m.centerX ?? img.width / 2);
      const t = titleMask(img, m.title)!;
      expect(t.w).toBeGreaterThan(150);
      expect(t.h).toBeGreaterThan(20);
      // the lettering fits across the badge between the ribbon's tails
      expect(t.w + 2).toBeLessThanOrEqual(BADGE_W - 32);
    });
});
