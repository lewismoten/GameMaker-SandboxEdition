// Audits indexable HTML metadata, social tags, language, headings, JSON-LD, crawler files,
// secret-game leaks and internal links. Utility pages marked noindex need no search tags.
// Also checks the downloads page against the Starters. Usage: node web/scripts/seoAudit.mjs <dist> [starterIdsFile]
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
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
const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
const gamesRoot = fileURLToPath(new URL('../../games/', import.meta.url));
const secrets = readdirSync(gamesRoot).flatMap((id) => {
  const about = join(gamesRoot, id, 'about.json');
  if (!existsSync(about)) return [];
  const game = JSON.parse(readFileSync(about, 'utf8'));
  return game.secret === true ? [{ id, title: game.title }] : [];
});
const titles = new Map(),
  descs = new Map();
const attr = (h, re) => (h.match(re) || [])[1];
for (const p of pages) {
  const h = readFileSync(p, 'utf8');
  const head = h.split('</head>')[0].replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  const markup = h.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  const n = rel(p);
  const title = attr(head, /<title>([^<]*)<\/title>/);
  const desc = attr(head, /<meta\s+name="description"\s+content="([^"]*)"/);
  const canon = attr(head, /<link rel="canonical" href="([^"]*)"/);
  const ogt = attr(head, /<meta property="og:title" content="([^"]*)"/);
  const ogi = attr(head, /<meta property="og:image" content="([^"]*)"/);
  const noindex = /name="robots"[^>]*noindex/.test(head);
  if (n.startsWith('google')) continue;
  if (!/<html\b[^>]*\blang="en(?:-[^"]+)?"/.test(h)) problems.push(`${n}: missing English lang`);
  if (secrets.some((g) => decode(h).toLowerCase().includes(g.title.toLowerCase()) || h.includes(`play-${g.id}.html`) || h.includes(`originals/${g.id}/`)))
    problems.push(`${n}: secret game exposed`);
  if (!title && !/data-gm-template/.test(head)) problems.push(`${n}: no title`);
  if (title) titles.set(title, [...(titles.get(title) || []), n]);
  if (!noindex && !desc) problems.push(`${n}: no meta description`);
  else if (desc) {
    descs.set(desc, [...(descs.get(desc) || []), n]);
    if (decode(desc).length < 50 || decode(desc).length > 160) problems.push(`${n}: description length ${decode(desc).length}`);
  }
  if (!noindex) {
    if (!canon) problems.push(`${n}: no canonical`);
    else if (!canon.startsWith(BASE)) problems.push(`${n}: canonical ${canon}`);
    else if (canon !== BASE + (n === 'index.html' ? '' : n)) problems.push(`${n}: canonical differs ${canon}`);
  }
  if (!noindex && !ogt) problems.push(`${n}: no og:title`);
  if (!noindex && !ogi) problems.push(`${n}: no og:image`);
  else if (ogi && ogi.startsWith(BASE) && !existsSync(join(dist, ogi.slice(BASE.length)))) problems.push(`${n}: og:image missing ${ogi}`);
  if (!noindex) {
    for (const [key, expected] of [
      ['og:title', title],
      ['twitter:title', title],
      ['og:description', desc],
      ['twitter:description', desc],
      ['og:url', canon],
      ['twitter:image', ogi],
    ]) {
      const value = attr(head, new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`));
      if (!value || value !== expected) problems.push(`${n}: missing or inconsistent ${key}`);
    }
    for (const key of ['og:type', 'og:image:alt', 'twitter:card', 'twitter:image:alt'])
      if (!attr(head, new RegExp(`<meta (?:name|property)="${key}" content="([^"]+)"`))) problems.push(`${n}: missing ${key}`);
    if ((head.match(/<link rel="canonical"/g) || []).length !== 1) problems.push(`${n}: expected one canonical`);
    if ((markup.match(/<h1[ >]/g) || []).length !== 1) problems.push(`${n}: expected one h1`);
  }
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(m[1]);
      if (data['@context'] !== 'https://schema.org') problems.push(`${n}: unexpected JSON-LD context`);
    } catch {
      problems.push(`${n}: invalid JSON-LD`);
    }
  }
  if (!noindex && !/<h1[ >]/.test(markup)) problems.push(`${n}: no h1`);
  // internal links
  for (const m of markup.matchAll(/<a\s[^>]*href="([^"#?][^"]*)"/g)) {
    let href = m[1].replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(href) && !href.startsWith(BASE)) continue;
    const absolute = href.startsWith(BASE);
    href = absolute ? href.slice(BASE.length) : href;
    const file = href.split(/[?#]/)[0] || 'index.html';
    const target = join(absolute || file.startsWith('/') ? dist : dirname(p), file.startsWith('/') ? file.slice(1) : file);
    if (!existsSync(target) || (statSync(target).isDirectory() && !existsSync(join(target, 'index.html')))) problems.push(`${n}: broken link ${m[1]}`);
  }
  for (const m of markup.matchAll(/<img\s[^>]*>/g)) if (!/\balt=/.test(m[0])) problems.push(`${n}: img without alt`);
}
for (const [t, l] of titles) if (l.length > 1) problems.push(`duplicate title "${t}": ${l.slice(0, 4).join(', ')}${l.length > 4 ? ` (+${l.length - 4})` : ''}`);
for (const [, l] of descs) if (l.length > 1) problems.push(`duplicate description (${l.length}): ${l.slice(0, 3).join(', ')}`);
// sitemap and robots
const robots = readFileSync(join(dist, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${BASE}sitemap.xml`)) problems.push('robots.txt: missing sitemap');
const sm = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
const locs = [...sm.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
for (const l of locs) {
  if (!l.startsWith(BASE)) {
    problems.push(`sitemap: foreign ${l}`);
    continue;
  }
  const f = l.slice(BASE.length).split(/[?#]/)[0] || 'index.html';
  if (!existsSync(join(dist, f))) problems.push(`sitemap: missing file ${l}`);
  else if (/<meta name="robots"[^>]*noindex/.test(readFileSync(join(dist, f), 'utf8'))) problems.push(`sitemap: noindex page ${l}`);
}
if (new Set(locs).size !== locs.length) problems.push('sitemap: duplicate URLs');
const discoverability = sm + robots + readFileSync(join(dist, 'llms.txt'), 'utf8');
if (secrets.some((g) => discoverability.toLowerCase().includes(g.title.toLowerCase()) || discoverability.includes(`play-${g.id}.html`)))
  problems.push('crawler files: secret game exposed');
const inMap = new Set(locs.map((l) => l.slice(BASE.length).split(/[?#]/)[0] || 'index.html'));
for (const p of pages) {
  const n = rel(p);
  if (!inMap.has(n) && !n.startsWith('google') && !/<meta name="robots"[^>]*noindex/.test(readFileSync(p, 'utf8').split('</head>')[0]))
    problems.push(`not in sitemap: ${n}`);
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

process.exitCode = problems.length ? 1 : 0;
