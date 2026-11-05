// Checks the Pocket Player's between-level cards (hardware/pocket-player/src/gmcards.h) against the engine: for each
// packed game, the pictures and text pages of every scene slot (intro, exit, won, lost) are drawn on the engine's
// Screen the way ShowGraphic and Display_File do, and the board code's pixels, palette and wait times must match,
// page by page. FLI animations (left out of the packing) are skipped on both sides. One line per game; exit 1 on a difference.
//   cd web && npx vite-node scripts/pocketCardsCheck.ts [id ...] [--data <dir with <id>.cfg, cards.pak and the files>]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Screen } from '@lewismoten/gamemaker-sandbox-engine/gfx/screen';
import { applyFliFrame, newFliCanvas, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { parseGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseBackdrop, parseSlideList, textLines } from '@lewismoten/gamemaker-sandbox-engine/formats/graphicScripts';

const here = new URL('../../hardware/pocket-player/', import.meta.url).pathname;
const dataDir = process.argv.includes('--data') ? process.argv[process.argv.indexOf('--data') + 1] : here + 'data';
const games = new URL('../../games/', import.meta.url).pathname;
let ids = process.argv.slice(2).filter((a, i, all) => a !== '--data' && all[i - 1] !== '--data');
if (!ids.length)
  ids = readFileSync(here + 'data/games.txt', 'utf8')
    .trim()
    .split('\n')
    .map((l) => l.split('|')[0]);

const canvas = { width: 0, height: 0, getContext: () => ({ createImageData: () => ({ data: new Uint8ClampedArray(320 * 200 * 4) }) }) };
const fnv = (b: ArrayLike<number>, n = b.length): number => {
  let h = 2166136261;
  for (let i = 0; i < n; i++) h = Math.imul(h ^ b[i], 16777619) >>> 0;
  return h;
};
const exe = join(mkdtempSync(join(tmpdir(), 'pocket-cards-')), 'cardstest');
execFileSync('c++', ['-std=c++17', '-O1', '-Wall', '-I', here + 'src', here + 'host/cardstest.cpp', '-o', exe, '-lz'], { stdio: 'inherit' });

/** What the engine draws for one scene slot: a line per picture or text page, as the board code prints them. */
function expected(disk: string, dir: string[], where: string, name: string): string[] {
  const out: string[] = [];
  const screen = new Screen(canvas as unknown as HTMLCanvasElement);
  const find = (n: string) => dir.find((d) => d.toLowerCase() === n.toLowerCase());
  const file = (n: string) => new Uint8Array(readFileSync(disk + find(n)!));
  let cols: Uint8Array = new Uint8Array(768);
  const show = (fname: string, pause: number | undefined, dflt: number) => {
    if (!find(fname)) return;
    const e = fname.split('.').pop()!.toLowerCase();
    if (e === 'lst') {
      for (const x of parseSlideList(file(fname))) show(x.name, x.pause ?? 0xffff, 0xffff);
    } else if (e === 'gif') {
      const im = decodeGif(file(fname));
      screen.drawImage(im.pixels, im.width, im.height, 0, 0);
      cols = im.palette;
      out.push(`C ${where} g 0 ${fnv(screen.pixels)} ${fnv(cols)} ${pause ?? dflt}`);
    } else if (e === 'bkd') {
      const b = parseBackdrop(file(fname));
      if (!find(b.gif)) return;
      const im = decodeGif(file(b.gif));
      screen.drawImage(im.pixels, im.width, im.height, b.x, b.y);
      cols = im.palette;
      out.push(`C ${where} g 0 ${fnv(screen.pixels)} ${fnv(cols)} ${pause ?? 20}`);
    } else if (e === 'fli') {
      // FLI::View on an empty canvas: the board starts from black, and these animations open with a full frame.
      const anim = parseFli(file(fname));
      const canvas2 = newFliCanvas(anim);
      for (let i = 0; i < anim.frameCount; i++) {
        applyFliFrame(anim, i, canvas2);
        out.push(`C ${where} f ${i} ${fnv(canvas2.pixels)} ${fnv(canvas2.palette)} ${anim.speed}`);
      }
    } else if (e === 'txt') {
      // Display_File: 16 lines a page (rows 5 to 20), "MORE..." when a seventeenth line comes.
      const saved = screen.snapshot();
      const pickIdx = (r: number, g: number, b: number) => {
        let best = 0;
        let bd = Infinity;
        for (let i = 0; i < 256; i++) {
          const d = (cols[i * 3] - r) ** 2 + (cols[i * 3 + 1] - g) ** 2 + (cols[i * 3 + 2] - b) ** 2;
          if (d < bd) ((bd = d), (best = i));
        }
        return best;
      };
      const col = pickIdx(50, 10, 50);
      const red = pickIdx(63, 10, 10);
      let vert = 5;
      let page = 0;
      for (const line of textLines(file(fname))) {
        if (vert > 20) {
          screen.write(224, 168, red, 'MORE...');
          out.push(`C ${where} t ${page++} ${fnv(screen.pixels)} ${fnv(cols)} ${pause ?? 90}`);
          vert = 5;
          screen.restore(saved);
        }
        screen.write(5 * 8, vert * 8, col, line);
        vert++;
      }
      out.push(`C ${where} t ${page} ${fnv(screen.pixels)} ${fnv(cols)} ${pause ?? 90}`);
      screen.restore(saved);
    }
  };
  show(name, undefined, 15);
  return out;
}

let bad = 0;
for (const id of ids) {
  const disk = `${games}${id}/disk/`;
  const dir = readdirSync(disk);
  const game = parseGame(new Uint8Array(readFileSync(disk + dir.find((d) => d.toLowerCase().endsWith('.gam'))!)));
  const play = game.scenes.map((s, i) => ({ s, i })).filter(({ s }) => s.gametype === 10);
  const want: string[] = [];
  play.forEach(({ s }, n) => {
    if (s.files[9]) want.push(...expected(disk, dir, `i${n}`, s.files[9]));
    if (s.files[10]) want.push(...expected(disk, dir, `x${n}`, s.files[10]));
  });
  if (game.scenes[1]?.files[0]) want.push(...expected(disk, dir, 'w', game.scenes[1].files[0]));
  if (game.scenes[1]?.files[2]) want.push(...expected(disk, dir, 'l', game.scenes[1].files[2]));
  const got = execFileSync(exe, [dataDir, id], { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(Boolean);
  // the board code lists i*, then x*, then w, l; the engine order above is by level: sort both the same way
  const key = (l: string) => l.split(' ')[1];
  const order = (a: string[]) => [...a].sort((x, y) => key(x).localeCompare(key(y), 'en', { numeric: true }));
  const a = order(got);
  const b = order(want);
  const same = a.length === b.length && a.every((l, i) => l === b[i]);
  if (!same) {
    bad++;
    const i = a.findIndex((l, k) => l !== b[k]);
    console.log(`${id.padEnd(24)} DIFFERS (${a.length} vs ${b.length}) first: ${a[i]} | ${b[i]}`);
  } else console.log(`${id.padEnd(24)} ok ${a.length} cards/pages`);
}
console.log(bad ? `${bad} games differ` : 'all match');
process.exit(bad ? 1 : 0);
