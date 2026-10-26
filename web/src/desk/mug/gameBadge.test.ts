// The game badges: see-through outside the medallion, and the title's ribbon shows only lettering
// and the ribbon (no title-screen background caught between the letters), on Teddy's own title.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodeGif } from '../../formats/gif';
import { paletteToRGBA } from '../../formats/palette';
import { BADGE_CX, BADGE_CY, BADGE_H, BADGE_W, composeBadge, cropCenterX, titleMask } from './gameBadge';
import { GAME_MUGS } from './gameMugArt';

const game = (id: string) => new URL(`../../../../games/${id}/`, import.meta.url);
const teddy = GAME_MUGS.find((m) => m.game === 'teddy')!;
const screen = decodeGif(new Uint8Array(readFileSync(new URL('disk/title.gif', game('teddy')))));
const box = JSON.parse(readFileSync(new URL('about.json', game('teddy')), 'utf8')).box;

describe('composeBadge', () => {
  const badge = composeBadge(screen, undefined, box, teddy);

  it('is see-through at the corners', () => {
    expect(badge.width).toBe(BADGE_W);
    expect(badge.height).toBe(BADGE_H);
    for (const [x, y] of [
      [0, 0],
      [BADGE_W - 1, 0],
      [0, BADGE_H - 1],
      [BADGE_W - 1, BADGE_H - 1],
    ])
      expect(badge.data[y * BADGE_W + x] >>> 24).toBe(0);
  });

  it("Teddy's title ribbon has no sky or cloud between the letters", () => {
    const t = titleMask(screen, teddy.title)!;
    const lut = paletteToRGBA(screen.palette);
    const at = (x: number, y: number) => screen.pixels[y * screen.width + x];
    // the colors round the title's box (sky, clouds), less any the letters are drawn in
    const [x0, y0, x1, y1] = teddy.title;
    const background = new Set<number>();
    for (let x = x0; x < x1; x++) background.add(at(x, y0)).add(at(x, y1 - 1));
    for (let y = y0; y < y1; y++) background.add(at(x0, y)).add(at(x1 - 1, y));
    for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) if (t.mask[y * t.w + x] === 1) background.delete(at(t.x + x, t.y + y));
    const sky = new Set([...background].map((i) => lut[i] >>> 0));
    expect(sky.size).toBeGreaterThan(0);
    // every pixel over the lettering's rows, across its width, as the badge places it
    const sy = Math.round(screen.height / 2);
    const top = BADGE_CY - (sy - t.y) - 1;
    const left = Math.round(BADGE_CX - (t.w + 2) / 2);
    let seen = 0;
    for (let y = top; y < top + t.h + 2; y++)
      for (let x = left; x < left + t.w + 2; x++) {
        seen++;
        expect(sky.has(badge.data[y * BADGE_W + x] >>> 0)).toBe(false);
      }
    expect(seen).toBeGreaterThan(1000);
  });

  it('keeps the medallion inside the title screen', () => {
    expect(cropCenterX(320, teddy.centerX)).toBe(teddy.centerX);
  });
});
