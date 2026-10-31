// Advisory check: which achievement badges look too alike (in gray, or to a color-blind eye), and
// which badges are so gray already that only the frame and lock say "not earned yet".
// Run from web/: npm run badges:similar [-- --threshold 0.27] [--top 12] [--out dir] [--strict]
// Writes an HTML report (default ../.for-lewis/badges-similar/index.html, git-ignored). Exit 0
// unless --strict and something was flagged. Metrics are in badgeSimilarMetrics.ts.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ACHIEVEMENTS } from '../src/achievements/catalog';
import blockArt from '../src/achievements/blockArt.json';
import { decodePng } from './badgePng';
import * as m from './badgeSimilarMetrics';
import { badgeReport, type Pair, type Plain } from './badgeSimilarReport';

const argv = process.argv.slice(2);
const opt = (name: string, d: string): string => (argv.includes(`--${name}`) ? (argv[argv.indexOf(`--${name}`) + 1] ?? d) : d);
/** Distance below which two badges count as too alike (0 identical, 1 nothing shared). */
const threshold = Number(opt('threshold', '0.27'));
/** Mean chroma below which a badge's art is nearly gray already. */
const grayCut = Number(opt('gray', '0.03'));
const outDir = resolve(opt('out', new URL('../../.for-lewis/badges-similar', import.meta.url).pathname));
const strict = argv.includes('--strict');
const SIZE = 40;
const COARSE = 0.3;

const t0 = Date.now();
const art = blockArt.badges as Record<string, { image: string }>;
const items = ACHIEVEMENTS.filter((a) => art[a.id]).map((a) => {
  const png = Buffer.from(art[a.id].image.split(',')[1], 'base64');
  const raw = m.flatten(m.resize(m.flatten(decodePng(png)), SIZE, SIZE));
  const small = Object.fromEntries(['none', ...m.FILTERS].map((f) => [f, m.downsample(f === 'none' ? raw : m.simulate(raw, f), 8, 8)]));
  const views = Object.fromEntries(['none', ...m.FILTERS].map((f) => [f, m.view(raw, f)]));
  return { id: a.id, title: a.hidden ? '(hidden)' : a.title, raw, small, views };
});

/** Tiers of one achievement (every-win-1, every-win-3...) are meant to look related. */
const family = (id: string): string => id.replace(/-\d+$/, '');

const pairs: Pair[] = [];
let refined = 0;
for (let i = 0; i < items.length; i++)
  for (let j = i + 1; j < items.length; j++) {
    const a = items[i],
      b = items[j];
    if (family(a.id) === family(b.id)) continue;
    // Coarse pass on 8x8: drop pairs that differ plainly in gray and in every filter.
    if (m.lumaDiff(m.gray(a.small.none), m.gray(b.small.none)) > COARSE && m.FILTERS.every((f) => m.colorDiff(a.small[f], b.small[f]) > COARSE)) continue;
    refined++;
    const gray = m.viewDistance(a.views.achromatopsia, b.views.achromatopsia);
    const normal = m.viewDistance(a.views.none, b.views.none);
    let kind: Pair['kind'] | undefined,
      filter = 'grayscale',
      score = gray;
    if (gray < threshold) kind = 'gray';
    else
      for (const f of m.FILTERS) {
        const d = m.viewDistance(a.views[f], b.views[f]);
        // Distinct to normal sight, alike through the filter.
        if (d < threshold && normal >= d + 0.15) [kind, filter, score] = ['cvd', f, d];
      }
    if (kind) pairs.push({ a: a.id, b: b.id, kind, filter, score, normal });
  }
pairs.sort((x, y) => x.score - y.score);

const plain: Plain[] = items
  .map((it) => ({ id: it.id, title: it.title, chroma: m.chroma(it.raw), diff: m.colorDiff(it.raw, m.unearned(it.raw)) }))
  .filter((p) => p.chroma < grayCut)
  .sort((x, y) => x.chroma - y.chroma);

const top = Number(opt('top', '0'));
const shown = top ? pairs.slice(0, top) : pairs;
mkdirSync(outDir, { recursive: true });
const rasters = new Map(items.map((i) => [i.id, i.raw]));
const titles = new Map(items.map((i) => [i.id, i.title]));
writeFileSync(resolve(outDir, 'index.html'), badgeReport({ pairs: shown, plain, rasters, titles, threshold, grayCut, total: items.length, refined }));

const pad = (s: string, n: number): string => s.padEnd(n);
console.log(`${items.length} badges, ${(items.length * (items.length - 1)) / 2} pairs, ${refined} refined, threshold ${threshold}`);
for (const p of shown) console.log(`${pad(p.kind === 'gray' ? 'gray' : p.filter, 14)}${p.score.toFixed(3)}  ${pad(p.a, 28)} ${p.b}`);
if (plain.length) console.log(`nearly gray art (chroma < ${grayCut}): ${plain.map((p) => p.id).join(', ')}`);
console.log(`${pairs.length} similar pairs, ${plain.length} nearly gray badges, ${Date.now() - t0} ms`);
console.log(`report: ${resolve(outDir, 'index.html')}`);
if (strict && (pairs.length || plain.length)) process.exitCode = 1;
