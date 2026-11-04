// The DAST tool (housekeeping 15b): renders everything a "what would a child point out?" pass has to look
// at, so the pass is just looking, and searches tiled art for swastika-like shapes.
//   npm run dast -- <id>... | --all [--out dir] [--no-search]   (from the root or web/; default dir
//   .for-lewis/research/dast/renders/). Reads each game's built games/<id>/disk/ and never builds.
// Per game, in <out>/<id>/: gif/ (every GIF at 1x and 3x), fli/ (a contact sheet of every frame, or 48 evenly
// spaced), sheets/ (block, monster and character sheets at 3x), map/ (every map whole at 1x), turned/ (for each
// picture one sheet: the picture and its silhouette, plain and turned 90 and 180 degrees), swastika/ (crops of
// candidates) and index.html, a contact page. <out>/index.html lists the games and the candidates.
import { mkdirSync, existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { decodeGif } from '@lewismoten/gamemaker-sandbox-engine/formats/gif';
import { applyFliFrame, newFliCanvas, parseFli } from '@lewismoten/gamemaker-sandbox-engine/formats/fli';
import { ADVTYPE, parseGame, type Game, type Scene } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { parseMap, MLEN } from '@lewismoten/gamemaker-sandbox-engine/formats/map';
import { BACKBL, BLEN, CHARBL, MONBL, TRANSPARENT, parseBlocks } from '@lewismoten/gamemaker-sandbox-engine/formats/blocks';
import { parsePalette } from '@lewismoten/gamemaker-sandbox-engine/formats/palette';
import { GameFiles } from '@lewismoten/gamemaker-sandbox-engine/core/gameFiles';
import { readDisk } from '@lewismoten/gamemaker-sandbox-tools/kit/gameSim';
import { scenePixels } from '../../web/src/gfx/levelPicture';
import { fromIndexed, grid, rotationSheet, silhouette, toPng, type Pix } from './dastImage';
import { findSwastikaLike, type Hit } from './dastSymmetry';

const here = dirname(fileURLToPath(import.meta.url));
const gamesDir = join(here, '..');
const MAGENTA = 0xff00ff;
const MAX_FLI_FRAMES = 48;

interface Candidate {
  game: string;
  kind: 'block' | 'tiled block' | 'map';
  where: string;
  count: number;
  rot: number;
  mirror: number;
  crop: string;
}

let images = 0;

async function save(path: string, p: Pix, scale = 1): Promise<void> {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, await toPng(p, scale));
  images++;
}

/** A sheet is shown big enough to see: up to 3x, but no wider than about 1800 px. */
const fit = (p: Pix) => Math.max(1, Math.min(3, Math.floor(1800 / (p.w * 3))));

/** Blocks as one Pix per block, transparent pixels magenta. */
function blockPix(bytes: Uint8Array, count: number, pal: Uint8Array): Pix[] {
  return parseBlocks(bytes, count).map((b) => {
    const p = fromIndexed(BLEN, BLEN, b.pixels, pal);
    for (let i = 0; i < b.pixels.length; i++) if (b.pixels[i] === TRANSPARENT) p.px[i] = MAGENTA;
    return p;
  });
}

/** A sheet of blocks, and its silhouette made block by block. */
function sheetOf(blocks: Pix[], cols: number): { pic: Pix; sil: Pix } {
  const pad = (b: Pix, fill: number, src: Pix): Pix => {
    const c = { w: b.w + 2, h: b.h + 2, px: new Uint32Array((b.w + 2) * (b.h + 2)).fill(fill) };
    for (let y = 0; y < b.h; y++) c.px.set(src.px.subarray(y * b.w, (y + 1) * b.w), (y + 1) * c.w + 1);
    return c;
  };
  const sils = blocks.map((b) => silhouette(b, b.px.includes(MAGENTA) ? MAGENTA : undefined));
  return {
    pic: grid(
      blocks.map((b) => pad(b, MAGENTA, b)),
      cols,
      0,
    ),
    sil: grid(
      blocks.map((b, k) => pad(b, 0xffffff, sils[k])),
      cols,
      0,
    ),
  };
}

/** A box drawn around a hit in a crop, in red. */
function boxed(crop: Pix, hit: Hit, scale: number): Pix {
  const w = crop.w * scale;
  const h = crop.h * scale;
  const px = new Uint32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px[y * w + x] = crop.px[Math.floor(y / scale) * crop.w + Math.floor(x / scale)];
  const x0 = Math.max(0, (hit.x - 1) * scale);
  const y0 = Math.max(0, (hit.y - 1) * scale);
  const x1 = Math.min(w - 1, (hit.x + hit.w + 1) * scale - 1);
  const y1 = Math.min(h - 1, (hit.y + hit.h + 1) * scale - 1);
  for (let x = x0; x <= x1; x++) ((px[y0 * w + x] = 0xff0000), (px[y1 * w + x] = 0xff0000));
  for (let y = y0; y <= y1; y++) ((px[y * w + x0] = 0xff0000), (px[y * w + x1] = 0xff0000));
  return { w, h, px };
}

function cut(p: Pix, x: number, y: number, w: number, h: number): Pix {
  const px = new Uint32Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px[j * w + i] = p.px[(y + j) * p.w + x + i];
  return { w, h, px };
}

/** The shape's look with the colors numbered in order of appearance, so a palette swap is the same shape. */
function shapeKey(p: Pix, h: Hit): string {
  const ids = new Map<number, number>();
  const c = cut(p, h.x, h.y, h.w, h.h);
  const canon = Uint8Array.from(c.px, (v) => ids.get(v) ?? (ids.set(v, ids.size), ids.size - 1));
  return createHash('md5').update(canon).digest('hex').slice(0, 12);
}

/** Keeps one candidate per distinct shape (with how many times it turns up). */
class Collector {
  readonly list: Candidate[] = [];
  private readonly seen = new Map<string, Candidate>();
  constructor(
    private readonly game: string,
    private readonly dir: string,
  ) {}
  async add(kind: Candidate['kind'], where: string, region: Pix, hit: Hit, scale: number): Promise<void> {
    const key = `${kind}:${shapeKey(region, hit)}`;
    const old = this.seen.get(key);
    if (old) return void old.count++;
    const crop = `swastika/${this.list.length + 1}-${kind.replace(' ', '-')}.png`;
    await save(join(this.dir, crop), boxed(region, hit, scale));
    const c: Candidate = { game: this.game, kind, where, count: 1, rot: +hit.rot.toFixed(2), mirror: +hit.mirror.toFixed(2), crop };
    this.seen.set(key, c);
    this.list.push(c);
  }
}

/** The best of several hits on the same shape (one per mask) is enough. */
function distinct(hits: Hit[]): Hit[] {
  const out: Hit[] = [];
  for (const h of hits.sort((a, b) => b.rot - b.mirror - (a.rot - a.mirror)))
    if (!out.some((o) => Math.abs(o.x - h.x) < 3 && Math.abs(o.y - h.y) < 3 && Math.abs(o.w - h.w) < 3)) out.push(h);
  return out;
}

/**
 * The map's background blocks laid out as the level draws them (so every 2x2 and 3x3 neighborhood of blocks is in
 * it), searched whole for swastika-like shapes. Each hit's crop has 20 pixels of its surroundings around it.
 */
async function searchMap(blocks: Pix[], cells: Uint8Array, ext: number[], where: string, col: Collector): Promise<void> {
  const [x0, y0, x1, y1] = ext;
  const w = x1 - x0 + 1;
  const h = y1 - y0 + 1;
  const px = new Uint32Array(w * BLEN * h * BLEN);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const b = blocks[cells[(y0 + j) * MLEN + x0 + i]] ?? blocks[0];
      for (let y = 0; y < BLEN; y++) px.set(b.px.subarray(y * BLEN, (y + 1) * BLEN), (j * BLEN + y) * w * BLEN + i * BLEN);
    }
  const pic: Pix = { w: w * BLEN, h: h * BLEN, px };
  for (const hit of distinct(findSwastikaLike(pic))) {
    const [cx, cy] = [Math.max(0, hit.x - 20), Math.max(0, hit.y - 20)];
    const crop = cut(pic, cx, cy, Math.min(pic.w, hit.x + hit.w + 20) - cx, Math.min(pic.h, hit.y + hit.h + 20) - cy);
    const at = `column ${x0 + Math.floor(hit.x / BLEN)}, row ${y0 + Math.floor(hit.y / BLEN)}`;
    await col.add('map', `${where}, ${at}`, crop, { ...hit, x: hit.x - cx, y: hit.y - cy }, 8);
  }
}

async function renderGame(id: string, out: string, search: boolean): Promise<{ page: string; cands: Candidate[]; counts: Record<string, number> }> {
  const dir = join(out, id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const disk = readDisk(join(gamesDir, id, 'disk'));
  const files = new GameFiles(disk);
  const col = new Collector(id, dir);
  const sections: Record<string, string[]> = { gif: [], fli: [], sheets: [], map: [] };
  const counts: Record<string, number> = { gif: 0, fli: 0, sheets: 0, map: 0 };
  const note = (kind: string, rel: string, label: string, turned?: string, extra = '') => {
    counts[kind]++;
    sections[kind].push(
      `<figure><a href="${rel}"><img loading="lazy" src="${rel}" alt="${label}"></a><figcaption>${label}${extra}${turned ? ` · <a href="${turned}">turned</a>` : ''}</figcaption></figure>`,
    );
  };
  const turnedSheet = async (name: string, p: Pix, bg?: number | Pix): Promise<string> => {
    const sheet = rotationSheet(p, bg);
    const rel = `turned/${name}.png`;
    await save(join(dir, rel), sheet, fit(sheet));
    return rel;
  };

  for (const name of [...disk.keys()].sort()) {
    const bytes = disk.get(name)!;
    try {
      if (name.endsWith('.gif')) {
        const g = decodeGif(bytes);
        const p = fromIndexed(g.width, g.height, g.pixels, g.palette);
        await save(join(dir, 'gif', `${name}.png`), p);
        await save(join(dir, 'gif', `${name}@3x.png`), p, 3);
        note('gif', `gif/${name}@3x.png`, name, await turnedSheet(`gif-${name}`, p));
      } else if (name.endsWith('.fli')) {
        const anim = parseFli(bytes);
        const canvas = newFliCanvas(anim);
        const want = new Set(
          Array.from({ length: Math.min(anim.frameCount, MAX_FLI_FRAMES) }, (_, k) =>
            anim.frameCount <= MAX_FLI_FRAMES ? k : Math.round((k * (anim.frameCount - 1)) / (MAX_FLI_FRAMES - 1)),
          ),
        );
        const shots: Pix[] = [];
        for (let f = 0; f < anim.frameCount; f++) {
          applyFliFrame(anim, f, canvas);
          if (want.has(f)) shots.push(fromIndexed(anim.width, anim.height, canvas.pixels, canvas.palette));
        }
        if (!shots.length) continue;
        const sheet = grid(shots, Math.max(1, Math.min(8, Math.floor(1600 / (anim.width + 2)))));
        await save(join(dir, 'fli', `${name}.png`), sheet);
        note(
          'fli',
          `fli/${name}.png`,
          name,
          await turnedSheet(`fli-${name}`, shots[Math.floor(shots.length / 2)]),
          ` (${anim.frameCount} frames, ${shots.length} shown)`,
        );
      }
    } catch (e) {
      console.log(`${id}/${name}: ${(e as Error).message}`);
    }
  }

  // block, monster and character sheets
  const game = parseGame(files.get(files.byExtension('gam')[0])!) as Game;
  const pal0 = game.scenes.find((s) => s.files[0])?.files[0] ?? '';
  const sets: [string, string, number, string][] = [];
  for (const s of game.scenes) {
    if (s.files[2]) sets.push([s.files[2], s.files[0], BACKBL, 'blocks']);
    if (s.files[4]) sets.push([s.files[4], s.files[0], MONBL, 'monsters']);
  }
  for (const f of files.byExtension('cbl')) sets.push([f, pal0, CHARBL, 'characters']);
  const done = new Set<string>();
  const bblPix = new Map<string, Pix[]>();
  const searched = new Set<string>();
  for (const [bf, pf, count, what] of sets) {
    const bb = files.get(bf);
    const pb = files.get(pf);
    if (!bb || !pb) continue;
    const key = `${bf}/${pf}`;
    if (done.has(key)) continue;
    done.add(key);
    const blocks = blockPix(bb, count, parsePalette(pb));
    const sum = `${count}:${createHash('md5').update(bb).digest('hex')}`;
    const fresh = !searched.has(sum);
    searched.add(sum);
    if (count === BACKBL) bblPix.set(key, blocks);
    const { pic, sil } = sheetOf(blocks, count === BACKBL ? 15 : 20);
    const stem = `${what}-${bf}-${pf}`;
    await save(join(dir, 'sheets', `${stem}.png`), pic, 3);
    note('sheets', `sheets/${stem}.png`, `${what}: ${bf} in ${pf}`, await turnedSheet(`sheet-${stem}`, pic, sil));
    if (search && fresh) {
      for (const [k, b] of blocks.entries()) {
        for (const h of distinct(findSwastikaLike(b, true))) await col.add('block', `${what} ${bf} (palette ${pf}), block ${k}`, b, h, 12);
        const tiled = grid([b, b, b, b, b, b, b, b, b], 3, 0);
        if (count === BACKBL)
          for (const h of distinct(findSwastikaLike(tiled))) await col.add('tiled block', `${bf} (palette ${pf}), block ${k} repeated 3x3`, tiled, h, 8);
      }
    }
  }

  // maps, whole
  const mapDone = new Set<string>();
  for (const [i, s] of game.scenes.entries() as IterableIterator<[number, Scene]>) {
    if (s.gametype !== ADVTYPE || !s.files[1]) continue;
    const key = s.files.slice(0, 5).join('/');
    if (mapDone.has(key)) continue;
    mapDone.add(key);
    const mapB = files.get(s.files[1]);
    if (!mapB) continue;
    const map = parseMap(mapB);
    const bg = map.blocks[MLEN * MLEN - 1];
    let [x0, y0, x1, y1] = [MLEN, MLEN, 0, 0];
    for (let c = 0; c < MLEN * MLEN; c++) {
      const placed = map.monsters[map.mons[c]];
      if (map.blocks[c] !== bg || (placed && placed.monnum < 64)) {
        const x = c % MLEN;
        const y = (c / MLEN) | 0;
        [x0, x1, y0, y1] = [Math.min(x0, x), Math.max(x1, x), Math.min(y0, y), Math.max(y1, y)];
      }
    }
    if (x1 < x0) [x0, y0, x1, y1] = [0, 0, 15, 9];
    const pic = scenePixels(files, s, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    if (!pic) continue;
    const p = fromIndexed(pic.width, pic.height, pic.pixels, pic.palette);
    const stem = `scene${i}-${s.files[1]}`;
    await save(join(dir, 'map', `${stem}.png`), p);
    note('map', `map/${stem}.png`, `scene ${i}: ${s.files[1]} (columns ${x0}-${x1}, rows ${y0}-${y1})`, await turnedSheet(`map-${stem}`, p));
    const blocks = bblPix.get(`${s.files[2]}/${s.files[0]}`);
    if (search && blocks) await searchMap(blocks, map.blocks, [x0, y0, x1, y1], `scene ${i} ${s.files[1]}`, col);
  }

  const cands = col.list;
  writeFileSync(join(dir, 'swastika.json'), JSON.stringify(cands, null, 1));
  const head = {
    gif: 'GIFs (3x; the link turns them)',
    fli: 'FLIs (every frame, or 48)',
    sheets: 'Block, monster and character sheets (3x)',
    map: 'Maps (1x)',
  } as const;
  const body = (Object.keys(head) as (keyof typeof head)[])
    .map((k) => `<h2>${head[k]} <small>${counts[k]}</small></h2><div class="g">${sections[k].join('')}</div>`)
    .join('\n');
  const candHtml = cands.length
    ? `<h2>Swastika-like candidates <small>${cands.length}</small></h2><div class="g">${cands.map((c) => `<figure><img src="${c.crop}" alt=""><figcaption>${c.kind}: ${c.where} (x${c.count}; turn ${c.rot}, mirror ${c.mirror})</figcaption></figure>`).join('')}</div>`
    : '<h2>Swastika-like candidates <small>0</small></h2>';
  const page = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DAST: ${id}</title>
<style>:root{color-scheme:light dark}body{font:14px system-ui;margin:16px;background:Canvas;color:CanvasText}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px}figure{margin:0}img{max-width:100%;image-rendering:pixelated;border:1px solid #888}small{opacity:.6}figcaption{word-break:break-all}</style>
<h1>DAST: ${id}</h1><p><a href="../index.html">all games</a></p>${candHtml}${body}</html>`;
  writeFileSync(join(dir, 'index.html'), page);
  return { page: `${id}/index.html`, cands, counts };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outAt = args.indexOf('--out');
  const out = resolve(outAt >= 0 ? args[outAt + 1] : join(gamesDir, '..', '.for-lewis', 'research', 'dast', 'renders'));
  const search = !args.includes('--no-search');
  const rest = args.filter((a, i) => !a.startsWith('--') && i !== outAt + 1);
  const ids = args.includes('--all')
    ? readdirSync(gamesDir).filter((id) => existsSync(join(gamesDir, id, 'about.json')) && existsSync(join(gamesDir, id, 'disk')))
    : rest;
  if (!ids.length) {
    console.log('usage: npm run dast -- <id>... | --all [--out dir] [--no-search]');
    process.exit(1);
  }
  mkdirSync(out, { recursive: true });
  const t0 = Date.now();
  const rows: string[] = [];
  const all: Candidate[] = [];
  for (const id of ids) {
    if (!existsSync(join(gamesDir, id, 'disk')) || !existsSync(join(gamesDir, id, 'about.json'))) {
      console.log(`${id}: no disk/ (build it first)`);
      continue;
    }
    const t = Date.now();
    const r = await renderGame(id, out, search);
    all.push(...r.cands);
    rows.push(`<tr><td><a href="${r.page}">${id}</a><td>${r.counts.gif}<td>${r.counts.fli}<td>${r.counts.sheets}<td>${r.counts.map}<td>${r.cands.length}`);
    console.log(
      `${id}: ${r.counts.gif} gif, ${r.counts.fli} fli, ${r.counts.sheets} sheets, ${r.counts.map} maps, ${r.cands.length} candidates (${((Date.now() - t) / 1000).toFixed(1)}s)`,
    );
  }
  const cand = all
    .map(
      (c) =>
        `<figure><a href="${c.game}/index.html"><img src="${c.game}/${c.crop}" alt=""></a><figcaption>${c.game}: ${c.kind}, ${c.where} (x${c.count}; turn ${c.rot}, mirror ${c.mirror})</figcaption></figure>`,
    )
    .join('');
  writeFileSync(join(out, 'candidates.json'), JSON.stringify(all, null, 1));
  writeFileSync(
    join(out, 'index.html'),
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DAST renders</title>
<style>:root{color-scheme:light dark}body{font:14px system-ui;margin:16px;background:Canvas;color:CanvasText}td,th{padding:2px 10px;text-align:left}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}img{max-width:100%;image-rendering:pixelated;border:1px solid #888}</style>
<h1>DAST renders</h1><table><tr><th>game<th>GIFs<th>FLIs<th>sheets<th>maps<th>candidates${rows.join('')}</table>
<h2>Swastika-like candidates (${all.length})</h2><div class="g">${cand}</div></html>`,
  );
  images++;
  console.log(`${ids.length} games, ${images} images, ${all.length} swastika-like candidates, ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${out}`);
}

await main();
