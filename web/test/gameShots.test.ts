import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { inflateSync } from 'node:zlib';
import { encodeIndexedPng, gameShots } from '../scripts/gameShots';
import { builtMapShotPath, builtMapViews, builtShotPath } from '../src/gfx/levelPicture';

const disk = resolve(__dirname, '../../games/teddy/disk');

describe("the build's game pictures", () => {
  it('writes a palette PNG of only the colors used', () => {
    const palette = new Uint8Array(768);
    palette.set([63, 0, 0], 5 * 3); // index 5: red
    const png = encodeIndexedPng({ width: 2, height: 1, pixels: Uint8Array.from([5, 0]), palette });
    expect([...png.subarray(1, 4)].map((c) => String.fromCharCode(c)).join('')).toBe('PNG');
    const text = new TextDecoder('latin1').decode(png);
    const plte = text.indexOf('PLTE');
    expect(new DataView(png.buffer).getUint32(plte - 4)).toBe(6); // two colors
    expect([...png.subarray(plte + 4, plte + 10)]).toEqual([0, 0, 0, 255, 0, 0]);
    const idat = text.indexOf('IDAT');
    const len = new DataView(png.buffer).getUint32(idat - 4);
    expect([...inflateSync(png.subarray(idat + 4, idat + 4 + len))]).toEqual([0, 1, 0]); // filter 0, then the remapped pixels
  });

  it.runIf(existsSync(disk))('draws a game its tile and screen pictures', () => {
    const files = new Map(readdirSync(disk).map((n) => [n.toLowerCase(), join(disk, n)] as [string, string]));
    const gam = [...files.keys()].find((n) => n.endsWith('.gam'))!;
    const about = JSON.parse(readFileSync(resolve(disk, '../about.json'), 'utf8')) as { box: { shots: [string, number, number][] } };
    const shots = gameShots('teddy', gam, files, about.box.shots);
    const views = builtMapViews(about.box.shots);
    expect(views.at(-1)?.slice(3)).toEqual([12, 4]); // the disk label's strip
    expect([...shots.keys()]).toEqual([builtShotPath('teddy', 8, 5), builtShotPath('teddy', 16, 10), ...views.map((v) => builtMapShotPath('teddy', v))]);
    for (const png of shots.values()) expect(png.length).toBeLessThan(16_000);
  });
});
