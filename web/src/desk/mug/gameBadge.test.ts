// The game badges: see-through outside the medallion, and the title's ribbon shows only lettering
// and the ribbon (no title-screen background caught between the letters), on Teddy's own title.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { paletteToRGBA } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { BADGE_CX, BADGE_CY, BADGE_H, BADGE_W, OUTLINE, composeBadge, cropCenterX, rgb, titleMask } from './gameBadge';
import { inkMask } from './badgeInk';
import { letteringImage } from './badgeLettering';
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

describe('centerY', () => {
  const at = (b: { data: Uint32Array }, x: number, y: number) => b.data[y * BADGE_W + x];
  const plain = composeBadge(screen, undefined, box, { ...teddy, strip: false });
  const lowered = composeBadge(screen, undefined, box, { ...teddy, strip: false, centerY: 90 });

  it('moves the picture down 10 pixels', () => {
    // the sky/ground below the ribbon, in the middle column, is the plain badge's 10 rows up
    for (const y of [150, 170, 190]) expect(at(lowered, BADGE_CX, y)).toBe(at(plain, BADGE_CX, y - 10));
  });

  it('keeps the title where it was', () => {
    for (let x = 60; x < BADGE_W - 60; x += 7) expect(at(lowered, x, 30)).toBe(at(plain, x, 30));
  });

  it('puts the screen top row on above the screen', () => {
    const low = composeBadge(screen, undefined, box, { ...teddy, centerY: 60 });
    expect(low.data.some((v) => v >>> 24)).toBe(true);
  });
});

describe('lettering', () => {
  const base = { title: [56, 40, 264, 112] as [number, number, number, number], centerX: 160 };
  const depth = decodeGif(new Uint8Array(readFileSync(new URL('disk/title.gif', game('depth')))));
  const lettering = { lines: ['DEPTH', 'PERCEPTION'], scales: [6, 3], fill: ['#ffffff', '#7fc4ff'] as [string, string], centerY: 80 };
  const ribbon = composeBadge(depth, undefined, {}, base);
  const fresh = composeBadge(depth, undefined, {}, { ...base, lettering });

  it('sets fresh light lettering with a dark outline, and no ribbon', () => {
    const white = (b: typeof ribbon) => b.data.filter((v) => v === 0xffffffff).length;
    expect(white(fresh)).toBeGreaterThan(white(ribbon) + 100);
    expect(fresh.data.filter((v) => v === 0xff1a0f12).length).toBeGreaterThan(300);
  });

  it('reaches over the ring: lettering wider than the medallion', () => {
    const row = 80 + 24;
    const xs = Array.from({ length: BADGE_W }, (_, x) => x).filter((x) => fresh.data[row * BADGE_W + x] >>> 24);
    expect(xs[xs.length - 1] - xs[0]).toBeGreaterThan(2 * 109);
  });

  it('makes the first line bigger than the second', () => {
    const same = letteringImage({ ...lettering, scales: [3, 3] }, 0xff000000, (h) => parseInt(h.slice(1), 16) | 0xff000000);
    const big = letteringImage(lettering, 0xff000000, (h) => parseInt(h.slice(1), 16) | 0xff000000);
    expect(big.height - same.height).toBe(3 * 8);
  });
});

describe('mend', () => {
  it('tiles the columns beside a box over it, row by row', () => {
    const base = { title: [6, 10, 312, 86] as [number, number, number, number], centerX: 160 };
    const flat = { width: 320, height: 200, pixels: new Uint8Array(320 * 200), palette: screen.palette };
    for (let y = 0; y < 200; y++) flat.pixels[y * 320 + 100] = 5;
    const a = composeBadge(flat, undefined, {}, base);
    const b = composeBadge(flat, undefined, {}, { ...base, mend: [{ box: [90, 150, 130, 160], from: [0, 10] }] });
    expect(a.data.some((v, i) => v !== b.data[i])).toBe(true);
  });
});

describe('ink: a solid ribbon behind the lettering', () => {
  it('takes only the named colors, less specks', () => {
    const px = new Uint8Array(20 * 10).fill(7);
    for (let y = 2; y < 6; y++) for (let x = 3; x < 9; x++) px[y * 20 + x] = 1;
    px[8 * 20 + 15] = 1; // a speck
    const m = inkMask({ width: 20, height: 10, pixels: px }, [0, 0, 20, 10], [1])!;
    expect([m.x, m.y, m.w, m.h]).toEqual([3, 2, 6, 4]);
    expect(m.mask.every((v) => v === 1)).toBe(true);
  });

  it('shows no picture between or inside the letters of any badge that names its ink', () => {
    for (const mug of GAME_MUGS.filter((m) => m.ink)) {
      const scr = decodeGif(new Uint8Array(readFileSync(new URL('disk/title.gif', game(mug.game)))));
      const about = JSON.parse(readFileSync(new URL('about.json', game(mug.game)), 'utf8')).box ?? {};
      const lut = paletteToRGBA(scr.palette);
      const b = composeBadge(scr, undefined, about, mug);
      const m = inkMask(scr, mug.title, mug.ink!)!;
      const ok = new Set<number>([
        ...mug.ink!.map((i) => lut[i] >>> 0),
        OUTLINE >>> 0,
        rgb(about.background ?? '#000000') >>> 0,
        rgb(about.accent ?? '#ffd23f') >>> 0,
      ]);
      const sy = Math.round(scr.height / 2);
      const top = BADGE_CY - (sy - m.y) - 1;
      const left = Math.round(BADGE_CX - (m.w + 2) / 2);
      for (let y = top; y < top + m.h + 2; y++)
        for (let x = left; x < left + m.w + 2; x++) expect(ok.has(b.data[y * BADGE_W + x] >>> 0), `${mug.game} ${x},${y}`).toBe(true);
    }
  });
});
