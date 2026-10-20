// Every backdrop on the Game-Maker CD must open its picture the way PLAYGAME's drawbkd does:
// the name after the two coordinates, up to a newline, found case-insensitively, cut to 8.3,
// or under the underscore name the CD's ISO 9660 copy gave it (see cdName).
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { GameFiles } from '../src/project/files';
import { parseBackdrop } from '../src/formats/graphicScripts';
import { isGif } from '../src/formats/gif';

const CD = resolve(__dirname, '../../cd');

/** Backdrops whose picture is not on the CD at all. */
const KNOWN_MISSING: Record<string, string> = {
  // An unused second "you won" backdrop: Barracuda's slide show shows BWON.GIF directly.
  'gameware/bcuda/bwon1.bkd': 'BWON1.gif',
};

function gameDirs(): string[] {
  const out: string[] = [];
  for (const kind of ['gameware', 'sharware']) {
    const root = join(CD, kind);
    if (!existsSync(root)) continue;
    for (const d of readdirSync(root, { withFileTypes: true })) if (d.isDirectory()) out.push(`${kind}/${d.name}`);
  }
  return out;
}

describe('CD backdrops', () => {
  const dirs = gameDirs();
  it.skipIf(!dirs.length)('each .bkd names a GIF that is in its game', () => {
    let checked = 0;
    for (const dir of dirs) {
      const path = join(CD, dir);
      const files = new GameFiles(readdirSync(path).map((f) => [f, new Uint8Array(readFileSync(join(path, f)))]));
      for (const bkd of files.byExtension('bkd')) {
        const { gif } = parseBackdrop(files.get(bkd)!);
        const key = `${dir}/${bkd}`;
        checked++;
        if (KNOWN_MISSING[key]) {
          expect(gif, key).toBe(KNOWN_MISSING[key]);
          expect(files.has(gif), key).toBe(false);
          continue;
        }
        expect(gif, key).toMatch(/^[^\s\0]+\.gif$/i);
        expect(files.resolve(gif), `${key} -> ${gif}`).toBeDefined();
        expect(isGif(files.get(gif)!), `${key} -> ${gif}`).toBe(true);
      }
    }
    expect(checked).toBeGreaterThan(30);
  });
});
