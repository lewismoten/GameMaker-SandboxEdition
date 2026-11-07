// Contact sheets of the known games (knownGamesSources.ts), for curating their tags by eye
// (src/imported/knownGames.curated.json): per game, its title picture and three level views
// (the first two levels it reaches and a late one, 16 x 10 blocks around where the hero
// arrives) drawn as the engine draws them (gfx/levelPicture.ts, gfx/titlePicture.ts), with its
// name, level count and whether the archive walk bot finished it. Copies of one game (the same
// zip slug or folder name) share a tile. Writes sheet-NN.png and index.tsv to <out dir>.
// Run (from web/): npx vite-node scripts/knownGamesSheets.ts <out dir> [--per 12] [--reference <dir>] [--archive <dir>]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { parseGame, ADVTYPE, NOSCENE, type Game, type Point } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { encodePng, base64 } from '@lewismoten/gamemaker-sandbox-tools/image/png';
import { levelPixels, firstLevels, type LevelPicture } from '../src/gfx/levelPicture';
import { titlePixels } from '../src/gfx/titlePicture';
import { contentFingerprint } from '../src/imported/contentFingerprint';
import { tagFacts } from '../src/imported/gameTags';
import { knownSources, slugOf, botWins } from './knownGamesSources';

const argv = process.argv.slice(2);
const outDir = argv[0];
if (!outDir) throw new Error('Usage: knownGamesSheets.ts <out dir> [--per 12]');
const perArg = argv.indexOf('--per');
const per = perArg > 0 ? Number(argv[perArg + 1]) : 12;
mkdirSync(outDir, { recursive: true });

/** Every level scene a link arrives in, with the first place it arrives. */
function arrivals(game: Game): Map<number, Point> {
  const at = new Map<number, Point>();
  for (const s of game.scenes)
    for (const l of s.links ?? [])
      if (l.toScene !== NOSCENE && game.scenes[l.toScene]?.gametype === ADVTYPE && !at.has(l.toScene)) at.set(l.toScene, l.to);
  return at;
}

function views(game: Game, get: (n: string) => Uint8Array | undefined): (LevelPicture | undefined)[] {
  const files = { get };
  const first = [...firstLevels(game, 2)].slice(0, 2);
  const all = [...arrivals(game)].filter(([i]) => !first.some(([j]) => j === i));
  const late = all.at(-1);
  const pick = [...first, ...(late ? [late] : [])];
  return pick.map(([i, p]) => levelPixels(files, game.scenes[i], p, 16, 10));
}

async function png(pic: LevelPicture | undefined): Promise<string> {
  if (!pic) return '';
  return 'data:image/png;base64,' + base64(await encodePng({ width: pic.width, height: pic.height, pixels: pic.pixels, palette: pic.palette }));
}

interface Tile {
  slug: string;
  labels: string[];
  levels: number;
  bot?: boolean;
  /** What the tag rules read, short. */
  facts: string;
  pics: string[];
}

const won = botWins(argv);
const tiles = new Map<string, Tile>();
const seen = new Set<string>();
for await (const src of knownSources(argv)) {
  const fp = await contentFingerprint(src.gam, src.get);
  if (!fp || seen.has(fp)) continue;
  seen.add(fp);
  const slug = slugOf(src.label);
  const bot = won.get(slug);
  const tile = tiles.get(slug);
  if (tile) {
    tile.labels.push(src.label);
    if (bot !== undefined) tile.bot = tile.bot || bot;
    continue;
  }
  const game = parseGame(src.gam);
  let title: LevelPicture | undefined;
  try {
    title = titlePixels({ get: src.get }, game);
  } catch {
    /* no title */
  }
  const f = tagFacts(src.gam, src.get);
  const facts = f ? [`gravity ${f.gravScenes}/${f.scenes}`, f.jump && 'jump', f.shoots && 'fires', f.facing && 'faces up/down', `${f.monsters} monsters`].filter(Boolean).join(', ') : '';
  const pics = await Promise.all([title, ...views(game, src.get)].map(png));
  tiles.set(slug, { slug, labels: [src.label], levels: game.scenes.filter((s) => s.gametype === ADVTYPE).length, bot, facts, pics });
}

const list = [...tiles.values()];
const index = ['sheet\ttile\tslug\tlevels\tbot\tlabels'];
const esc = (s: string) => s.replace(/[<&]/g, (c) => (c === '<' ? '&lt;' : '&amp;'));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1000 } });
  for (let s = 0; s * per < list.length; s++) {
    const part = list.slice(s * per, (s + 1) * per);
    part.forEach((t, i) => index.push(`${s + 1}\t${i + 1}\t${t.slug}\t${t.levels}\t${t.bot ?? ''}\t${t.labels.join(' ')}`));
    const cell = (src: string) => (src ? `<img src="${src}">` : `<div class=none>none</div>`);
    await page.setContent(
      `<style>body{margin:0;background:#222;color:#fff;font:bold 18px sans-serif;display:grid;grid-template-columns:repeat(3,636px);gap:6px}
      .t{background:#000}.g{display:grid;grid-template-columns:repeat(2,318px)}img,.none{width:318px;height:199px;image-rendering:pixelated;display:block}
      .none{color:#666;display:grid;place-items:center}.n{padding:3px 6px;background:#333;color:#ff0}</style>` +
        part
          .map(
            (t, i) =>
              `<div class=t><div class=n>${s + 1}.${i + 1} ${esc(t.slug)} · ${t.levels} levels${t.bot === undefined ? '' : t.bot ? ' · bot won' : ' · bot stuck'}${t.labels.length > 1 ? ` · ${t.labels.length} copies` : ''}<br><small>${t.facts}</small></div><div class=g>${t.pics.map(cell).join('')}</div></div>`,
          )
          .join(''),
    );
    await page.screenshot({ path: join(outDir, `sheet-${String(s + 1).padStart(2, '0')}.png`), fullPage: true });
  }
} finally {
  await browser.close();
}
writeFileSync(join(outDir, 'index.tsv'), index.join('\n') + '\n');
console.log(`${list.length} games from ${seen.size} fingerprints on ${Math.ceil(list.length / per)} sheets in ${outDir}`);
