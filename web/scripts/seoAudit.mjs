// Audits a built site folder: every HTML page's title, description, canonical, og tags and h1;
// the sitemap against the files; internal links and anchors that point nowhere; and the
// downloads page against the Starters. Usage: node web/scripts/seoAudit.mjs <dist> [starterIdsFile]
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
const dist = resolve(process.argv[2]);
const BASE = 'https://lewismoten.github.io/GameMaker-SandboxEdition/';
const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? (f === 'assets' ? [] : walk(p)) : [p];
  });
const pages = walk(dist).filter((p) => p.endsWith('.html'));
const rel = (p) => p.slice(dist.length + 1);
const problems = [];
const titles = new Map(),
  descs = new Map();
const attr = (h, re) => (h.match(re) || [])[1];
for (const p of pages) {
  const h = readFileSync(p, 'utf8');
  const n = rel(p);
  const title = attr(h, /<title>([^<]*)<\/title>/);
  const desc = attr(h, /<meta\s+name="description"\s+content="([^"]*)"/);
  const canon = attr(h, /<link rel="canonical" href="([^"]*)"/);
  const ogt = attr(h, /<meta property="og:title" content="([^"]*)"/);
  const ogi = attr(h, /<meta property="og:image" content="([^"]*)"/);
  const noindex = /name="robots"[^>]*noindex/.test(h);
  if (n.startsWith('google')) continue;
  if (!title) problems.push(`${n}: no title`);
  else titles.set(title, [...(titles.get(title) || []), n]);
  if (!desc) problems.push(`${n}: no meta description`);
  else {
    descs.set(desc, [...(descs.get(desc) || []), n]);
    if (desc.length < 50 || desc.length > 320) problems.push(`${n}: description length ${desc.length}`);
  }
  if (!noindex) {
    if (!canon) problems.push(`${n}: no canonical`);
    else if (!canon.startsWith(BASE)) problems.push(`${n}: canonical ${canon}`);
    else if (canon !== BASE + (n === 'index.html' ? '' : n) && !/play\.html|help-/.test(n)) problems.push(`${n}: canonical differs ${canon}`);
  }
  if (!ogt) problems.push(`${n}: no og:title`);
  if (!ogi) problems.push(`${n}: no og:image`);
  else if (ogi.startsWith(BASE) && !existsSync(join(dist, ogi.slice(BASE.length)))) problems.push(`${n}: og:image missing ${ogi}`);
  if (!/<h1[ >]/.test(h)) problems.push(`${n}: no h1`);
  // internal links
  for (const m of h.matchAll(/<a\s[^>]*href="([^"#?][^"]*)"/g)) {
    let href = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(href) && !href.startsWith(BASE)) continue;
    href = href.startsWith(BASE) ? href.slice(BASE.length) : href;
    const file = href.split(/[?#]/)[0] || 'index.html';
    const target = join(file.startsWith('/') ? dist : dirname(p), file.startsWith('/') ? file.slice(1) : file);
    if (!existsSync(target) || (statSync(target).isDirectory() && !existsSync(join(target, 'index.html')))) problems.push(`${n}: broken link ${m[1]}`);
  }
  for (const m of h.matchAll(/<img\s[^>]*>/g)) if (!/\balt=/.test(m[0])) problems.push(`${n}: img without alt`);
}
for (const [t, l] of titles) if (l.length > 1) problems.push(`duplicate title "${t}": ${l.slice(0, 4).join(', ')}${l.length > 4 ? ` (+${l.length - 4})` : ''}`);
for (const [, l] of descs) if (l.length > 1) problems.push(`duplicate description (${l.length}): ${l.slice(0, 3).join(', ')}`);
// sitemap
const sm = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
for (const l of locs) {
  if (!l.startsWith(BASE)) {
    problems.push(`sitemap: foreign ${l}`);
    continue;
  }
  const f = l.slice(BASE.length).split(/[?#]/)[0] || 'index.html';
  if (!existsSync(join(dist, f))) problems.push(`sitemap: missing file ${l}`);
}
const inMap = new Set(locs.map((l) => l.slice(BASE.length).split(/[?#]/)[0] || 'index.html'));
for (const p of pages) {
  const n = rel(p);
  if (!inMap.has(n) && !n.startsWith('google') && !/noindex/.test(readFileSync(p, 'utf8').slice(0, 4000))) problems.push(`not in sitemap: ${n}`);
}
if (process.argv[3]) {
  const ids = readFileSync(process.argv[3], 'utf8').split(/\s+/).filter(Boolean);
  const dl = existsSync(join(dist, 'downloads.html')) ? readFileSync(join(dist, 'downloads.html'), 'utf8') : '';
  let play = 0;
  for (const id of ids) {
    if (existsSync(join(dist, `play-${id}.html`))) play++;
    if (new RegExp(`downloads/[^"]*${id}[^"/]*\\.zip|[?&/]${id}[."&]`).test(dl)) problems.push(`downloads.html mentions Starter ${id}`);
  }
  console.log(`starters: ${ids.length}, with play page: ${play}, in sitemap: ${ids.filter((i) => inMap.has(`play-${i}.html`)).length}`);
}
console.log(`pages ${pages.length}, sitemap urls ${locs.length}, problems ${problems.length}`);
console.log(problems.join('\n'));
