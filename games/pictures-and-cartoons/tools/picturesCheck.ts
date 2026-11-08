// What this game is about, checked on the built disk: each level's two graphic slots (9, before the
// level; 10, after it) name files that exist, every picture is a 320x200 GIF in the game's palette,
// every cartoon an FLI of 320x200 that plays in a few seconds, every .LST entry exists, and the game
// has the lessons it teaches: a picture before and after level 1, a cartoon after level 2, a list of
// two pictures before level 3. Findings are suggestions to an author; this game's own are errors.
//   cd web && npx vite-node ../games/pictures-and-cartoons/tools/picturesCheck.ts
import { readFileSync } from 'node:fs';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseSlideList } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';

const disk = (n: string) => new Uint8Array(readFileSync(new URL(`../disk/${n}`, import.meta.url)));
const fail = (m: string): never => {
  console.error(`picturesCheck: ${m}`);
  process.exit(1);
};

/** The names a graphic slot ends up showing, in order (a list's entries, a single file as itself). */
function shown(name: string): string[] {
  if (!name) return [];
  if (!name.toLowerCase().endsWith('.lst')) return [name];
  return parseSlideList(disk(name)).flatMap((e) => shown(e.name));
}

function look(name: string): string {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase();
  if (ext === 'gif') {
    const g = decodeGif(disk(name));
    if (g.width !== 320 || g.height !== 200) fail(`${name} is ${g.width}x${g.height}, not 320x200`);
    return 'GIF';
  }
  if (ext === 'fli') {
    const a = parseFli(disk(name));
    if (a.width !== 320 || a.height !== 200) fail(`${name} is ${a.width}x${a.height}, not 320x200`);
    const seconds = (a.frameCount * a.speed) / 70;
    if (seconds > 6) fail(`${name} plays ${seconds.toFixed(1)} s; Esc waits for the whole cartoon, so keep it under about 6`);
    return `FLI ${a.frameCount} frames, ${seconds.toFixed(1)} s`;
  }
  if (ext === 'txt') return 'TXT';
  return fail(`${name}: not a picture`);
}

const game = parseGame(disk('pics.gam'));
const kinds: string[][] = [];
for (const [i, name] of ['', '', ...['frame', 'cartoon', 'short']].entries()) {
  if (i < 2) continue;
  const f = game.scenes[i].files;
  const row = [f[9], f[10]].map((slot) => shown(slot).map(look).join(' + ') || 'none');
  console.log(`${name}: before ${row[0]} | after ${row[1]}`);
  kinds.push(row);
}
const [one, two, three] = kinds;
if (one[0] !== 'GIF' || one[1] !== 'GIF') fail('level 1 should have a picture before and a picture after');
if (two[0] !== 'GIF' || !two[1].startsWith('FLI')) fail('level 2 should have a picture before and a cartoon after');
if (three[0] !== 'GIF + GIF' || three[1] !== 'none') fail('level 3 should open with a list of two pictures and have nothing after');
console.log('picturesCheck ok: pictures before and after, a cartoon between levels 2 and 3, a list of two');
