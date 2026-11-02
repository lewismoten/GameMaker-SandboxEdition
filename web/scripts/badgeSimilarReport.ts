// The HTML report for badgeSimilar.ts: each flagged pair side by side in color, gray and the filter
// that flagged it, at 4x with pixelated rendering. No scripts, no network.
import { encodeRgbaPng } from './badgeSimilarPng';
import * as m from './badgeSimilarMetrics';

export interface Pair {
  a: string;
  b: string;
  kind: 'gray' | 'cvd';
  filter: string;
  score: number;
  normal: number;
}
export interface Plain {
  id: string;
  title: string;
  chroma: number;
  diff: number;
}
interface Input {
  pairs: Pair[];
  plain: Plain[];
  rasters: Map<string, m.Raster>;
  titles: Map<string, string>;
  threshold: number;
  grayCut: number;
  total: number;
  refined: number;
}

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const img = (r: m.Raster): string =>
  `<img src="data:image/png;base64,${Buffer.from(encodeRgbaPng(m.resize(r, 20, 20))).toString('base64')}" width="80" height="80" alt="">`;
const cell = (label: string, r: m.Raster): string => `<figure>${img(r)}<figcaption>${label}</figcaption></figure>`;

export function badgeReport(i: Input): string {
  const row = (p: Pair): string => {
    const look = p.kind === 'gray' ? 'grayscale' : p.filter;
    const views = (id: string): string => {
      const r = i.rasters.get(id)!;
      return cell('color', r) + cell('gray', m.gray(r)) + (p.kind === 'cvd' ? cell(look, m.simulate(r, p.filter)) : '');
    };
    return `<section><h3>${esc(p.kind === 'gray' ? 'Alike in gray' : `Alike to ${p.filter}`)} <small>distance ${p.score.toFixed(3)}${p.kind === 'cvd' ? `, ${p.normal.toFixed(3)} in color` : ''}</small></h3>
<div class="pair">${[p.a, p.b].map((id) => `<div><div class="views">${views(id)}</div><p><code>${esc(id)}</code> ${esc(i.titles.get(id) ?? '')}</p></div>`).join('')}</div></section>`;
  };
  const plain = i.plain
    .map(
      (p) =>
        `<div class="one">${cell('earned', i.rasters.get(p.id)!)}${cell('unearned', m.unearned(i.rasters.get(p.id)!))}<p><code>${esc(p.id)}</code> ${esc(p.title)}<br>chroma ${p.chroma.toFixed(3)}, earned vs unearned ${p.diff.toFixed(3)}</p></div>`,
    )
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Badges that look alike</title>
<style>:root{color-scheme:light dark;--bg:#fff;--fg:#222;--line:#bbb}@media(prefers-color-scheme:dark){:root{--bg:#1b1b1f;--fg:#eee;--line:#555}}
body{background:var(--bg);color:var(--fg);font:15px/1.4 system-ui,sans-serif;margin:0 auto;max-width:1000px;padding:16px}
img{image-rendering:pixelated;border:1px solid var(--line);display:block}figure{margin:0}figcaption{font-size:12px}
section,.one{border:1px solid var(--line);border-radius:6px;padding:8px 12px;margin:12px 0}.pair{display:flex;flex-wrap:wrap;gap:24px}.views{display:flex;gap:8px;flex-wrap:wrap}
.plain{display:flex;flex-wrap:wrap;gap:12px}.one{display:flex;flex-wrap:wrap;gap:8px;margin:0}h3{margin:4px 0}small{font-weight:400}p{margin:4px 0}</style></head><body>
<h1>Badges that look alike</h1>
<p>Advisory: ${i.total} badges, ${i.refined} pairs compared in full after the coarse 8x8 pass. Distance runs from 0 (the same) to 1 (nothing shared); a pair is flagged below ${i.threshold}. An author can dismiss any of these: the check sees only pixels, not meaning or the frame around a badge. Color-vision filters: Machado et al. 2009.</p>
<h2>Similar pairs (${i.pairs.length})</h2>${i.pairs.map(row).join('') || '<p>None.</p>'}
<h2>Nearly gray art (${i.plain.length})</h2><p>Mean chroma under ${i.grayCut}: when unearned, only the dashed frame and lock set these apart.</p><div class="plain">${plain || 'None.'}</div>
</body></html>`;
}
