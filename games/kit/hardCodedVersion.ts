// Finds a game's own version typed by hand in its src/ (v1.2, Version 1.2, VER 1.2). The one
// place a game's version is written is about.json; text and art read it from there.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const VERSION = /(?<![\w.])v\d+\.\d+\b|\bVersion \d+\.\d+|\bVER(?:SION)? \d+\.\d+/;

/**
 * Lines that name a version that is not the game's: a prop on screen, or a format or program
 * version. Matched as "<game>/<file under src>: <text of the line, trimmed>" containing the
 * entry. Engine and format versions ("Game-Maker 3.0", "MS-DOS 5.0", CMF, VOC) are not
 * matched by the pattern at all.
 */
export const ALLOWED: readonly string[] = [
  "snowbound/src/screens/screens.ts: micro(p, x + 4 * s, y + 40 * s, 'VER 2.0'", // a software box in a scene picture
];

function* tsFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* tsFiles(p);
    else if (name.endsWith('.ts')) yield p;
  }
}

/** One message per hard-coded version in `<gamesDir>/<id>/src`. */
export function hardCodedVersions(gamesDir: string, ids: string[]): string[] {
  const out: string[] = [];
  for (const id of ids) {
    const src = join(gamesDir, id, 'src');
    if (!existsSync(src)) continue;
    for (const file of tsFiles(src)) {
      const rel = `${id}/src${file.slice(src.length)}`;
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          const t = line.trim();
          if (!VERSION.test(t) || t.includes('about.version')) return;
          if (ALLOWED.some((a) => `${rel}: ${t}`.includes(a))) return;
          out.push(`${rel}:${i + 1} types a version by hand (use about.version from about.json): ${t.slice(0, 80)}`);
        });
    }
  }
  return out;
}
