// The kinds of paper a game describes in its printables.json: maps and posters, hint books,
// letters, newspapers, journals, ID cards, charts and fold-out star charts.
import { h } from '../../editor/ui';
import { sheet, html, mapPicture, hashString, rng, portrait, type PrintContext, type Sheet } from './kit';
import { redCode } from './redFilm';
import { paginate } from './paginate';
import type { ChartItem, HintBookItem, IdCardItem, JournalItem, LetterItem, MapItem, MapPanel, NewspaperItem, PrintableItem, StarChartItem } from './types';

// ------------------------------------------------------------------ maps
async function mapPanel(ctx: PrintContext, p: MapPanel, start: number): Promise<HTMLElement> {
  const src = await ctx.shot(p);
  const marks = (p.marks ?? []).map((m, i) => {
    const n = m.kind === 'secret' ? '★' : m.kind === 'start' ? '▶' : String(start + i);
    return h(
      'span',
      { class: `mp-mark mk-${m.kind ?? 'note'}`, style: `left:${((m.x - p.x + 0.5) / p.w) * 100}%;top:${((m.y - p.y + 0.5) / p.h) * 100}%`, title: m.label },
      n,
    );
  });
  return h(
    'figure',
    { class: 'map-panel', style: `--ar:${(p.w / p.h).toFixed(4)}` },
    h('div', { class: 'map-pic' }, src ? h('img', { src, alt: p.caption ?? p.map, width: p.w * 20, height: p.h * 20 }) : null, ...marks),
    p.caption ? h('figcaption', null, p.caption) : null,
  );
}

async function mapItem(ctx: PrintContext, it: MapItem): Promise<Sheet[]> {
  let n = 1;
  const panels: HTMLElement[] = [];
  const key: HTMLElement[] = [];
  for (const p of it.panels) {
    const start = n;
    panels.push(await mapPanel(ctx, p, start));
    for (const m of p.marks ?? []) {
      const sym = m.kind === 'secret' ? '★' : m.kind === 'start' ? '▶' : String(n);
      key.push(h('li', { class: `mk-${m.kind ?? 'note'}` }, h('span', { class: 'mp-mark' }, sym), ' ', m.label));
      if (m.kind !== 'secret' && m.kind !== 'start') n++;
    }
  }
  const [w, hh] = it.landscape ? [11, 8.5] : [8.5, 11];
  return [
    sheet(
      w,
      hh,
      `map ${it.landscape ? 'land' : ''}`,
      h('header', { class: 'map-head' }, h('h2', null, it.heading ?? it.title), it.intro ? h('p', null, it.intro) : null),
      h('div', { class: `map-panels n${it.panels.length} c${it.columns ?? 2}` }, ...panels),
      key.length ? h('ol', { class: 'map-key' }, ...key) : null,
      it.legend?.length ? h('div', { class: 'map-legend' }, ...it.legend.map((l) => h('p', null, l))) : null,
      h('div', { class: 'map-compass', 'aria-hidden': 'true' }, 'N'),
    ),
  ];
}

// ------------------------------------------------------------------ hint book
async function hintBook(ctx: PrintContext, it: HintBookItem): Promise<Sheet[]> {
  void ctx;
  const cover = sheet(
    5.5,
    8.5,
    'hb hb-cover',
    h('div', { class: 'hb-band' }, 'OFFICIAL'),
    h('h2', null, it.title),
    h('p', { class: 'hb-sub' }, ctx.entry.title),
    h(
      'div',
      { class: 'hb-howto' },
      h('b', null, 'HOW TO USE THIS BOOK'),
      h('p', null, it.intro ?? 'Find your question, then lay the red film over the answer below it. Only read what you need!'),
      redCode('Like this: you found it!'),
    ),
    h('p', { class: 'hb-foot' }, 'SANDBOX SOFTWARE · RED FILM INCLUDED'),
  );
  // flow the questions onto pages, measured in a real hint book page off screen
  const blocks: HTMLElement[] = it.sections.flatMap((s) => [
    h('h3', null, s.head),
    ...s.hints.map((q) => h('div', { class: 'hb-q' }, h('p', null, h('b', null, 'Q. '), q.q), h('p', { class: 'hb-a' }, redCode(q.a)))),
  ]);
  const host = h('div', { class: 'gmb-measure' });
  document.body.append(host);
  const pages: Sheet[] = [cover];
  try {
    const flowed = paginate(blocks, () => {
      const flow = h('div', { class: 'mp-flow' });
      const page = sheet(5.5, 8.5, 'hb hb-page', flow);
      page.el.style.width = '550px';
      host.replaceChildren(page.el);
      const inner = page.el.firstElementChild as HTMLElement;
      const cs = getComputedStyle(inner);
      return { flow, limit: (inner.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) * 0.93 };
    });
    for (const els of flowed)
      pages.push(sheet(5.5, 8.5, 'hb hb-page', h('div', { class: 'mp-flow' }, ...els), h('div', { class: 'hb-folio' }, String(pages.length))));
  } finally {
    host.remove();
  }
  return pages;
}

// ------------------------------------------------------------------ letter
async function letter(it: LetterItem): Promise<Sheet[]> {
  return [
    sheet(
      8.5,
      11,
      `let let-${it.style ?? 'print'}`,
      it.letterhead ? h('header', { class: 'let-head' }, h('b', null, it.letterhead), it.address ? h('span', null, it.address) : null) : null,
      it.date ? h('p', { class: 'let-date' }, it.date) : null,
      it.to ? h('p', { class: 'let-to' }, it.to) : null,
      html('div', 'let-body', it.body),
      h('p', { class: 'let-sign' }, it.signature),
    ),
  ];
}

// ------------------------------------------------------------------ newspaper
async function newspaper(ctx: PrintContext, it: NewspaperItem): Promise<Sheet[]> {
  const photo = it.photo ? await mapPicture(ctx, it.photo, 'np-photo') : null;
  return [
    sheet(
      8.5,
      11,
      'np',
      h(
        'header',
        { class: 'np-mast' },
        h('div', { class: 'np-name' }, it.masthead),
        h('div', { class: 'np-line' }, h('span', null, it.date), h('span', null, it.price ?? '25¢')),
      ),
      h('h2', { class: 'np-headline' }, it.headline),
      it.deck ? h('p', { class: 'np-deck' }, it.deck) : null,
      photo,
      h('div', { class: 'np-cols' }, ...it.columns.map((c) => html('div', 'np-col', c))),
      it.briefs?.length ? h('div', { class: 'np-briefs' }, ...it.briefs.map(([hd, t]) => h('div', null, h('b', null, hd), h('p', null, t)))) : null,
      h('p', { class: 'np-novelty' }, 'A novelty newspaper from the world of the game. Every name and event in it is made up.'),
    ),
  ];
}

// ------------------------------------------------------------------ journal
async function journal(it: JournalItem): Promise<Sheet[]> {
  return [
    sheet(
      5.5,
      8.5,
      'jr',
      it.heading ? h('h2', null, it.heading) : null,
      ...it.entries.map((e) => h('div', { class: 'jr-entry' }, h('p', { class: 'jr-date' }, e.date), html('div', 'jr-text', e.html))),
    ),
  ];
}

// ------------------------------------------------------------------ ID card
async function idCard(ctx: PrintContext, it: IdCardItem): Promise<Sheet[]> {
  const photo = it.photo ? await ctx.shot(it.photo) : undefined;
  const face = it.portrait ? await portrait(ctx.entry, it.portrait) : undefined;
  const style = `--card:${it.color ?? '#2b4f8c'};--card-ink:${it.ink ?? '#fff'}`;
  const r = rng(hashString(it.name));
  const front = sheet(
    3.375,
    2.125,
    'id',
    h('div', { class: 'id-band', style }, it.org),
    h(
      'div',
      { class: 'id-body' },
      h(
        'div',
        { class: 'id-photo', style: photo ? `background-image:url(${photo})` : '' },
        face ? h('img', { src: face, alt: it.name, class: 'id-face' }) : null,
        !photo && !face ? h('span', null, 'PHOTO ON FILE') : null,
      ),
      h(
        'div',
        { class: 'id-fields' },
        h('b', { class: 'id-name' }, it.name),
        h('span', { class: 'id-role' }, it.role),
        ...it.fields.map(([k, v]) => h('span', { class: 'id-field' }, h('small', null, k), ' ', v)),
      ),
    ),
    h('div', { class: 'id-holo', style: `--hx:${Math.round(r() * 60)}%`, 'aria-hidden': 'true' }),
  );
  front.el.setAttribute('style', `${front.el.getAttribute('style')};${style}`);
  const back = sheet(
    3.375,
    2.125,
    'id id-back',
    h('div', { class: 'id-stripe', 'aria-hidden': 'true' }),
    h('p', null, it.back ?? 'If found, please return to the issuing office.'),
    h('div', { class: 'id-sig' }, h('small', null, 'Signature'), h('i', null, it.name)),
  );
  back.el.setAttribute('style', `${back.el.getAttribute('style')};${style}`);
  return [front, back];
}

// ------------------------------------------------------------------ chart (tables)
async function chart(it: ChartItem): Promise<Sheet[]> {
  return [
    sheet(
      8.5,
      11,
      'ch',
      h('h2', null, it.heading ?? it.title),
      it.intro ? h('p', { class: 'ch-intro' }, it.intro) : null,
      h(
        'div',
        { class: 'ch-tables' },
        ...it.tables.map((t) =>
          h(
            'section',
            null,
            h('h3', null, t.head),
            t.note ? h('p', { class: 'ch-note' }, t.note) : null,
            h('table', null, h('tr', null, ...t.columns.map((c) => h('th', null, c))), ...t.rows.map((r) => h('tr', null, ...r.map((c) => h('td', null, c))))),
          ),
        ),
      ),
    ),
  ];
}

// ------------------------------------------------------------------ star chart
const SECTOR_COLORS = ['#3fae5a', '#e0572a', '#2f8fd8', '#9a6be0', '#5b6b8a', '#d6a228'];

async function starChart(ctx: PrintContext, it: StarChartItem): Promise<Sheet[]> {
  const W = 1100;
  const H = 850;
  const cx = W / 2;
  const cy = H / 2 + 10;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'sc-svg');
  const add = (tag: string, attrs: Record<string, string | number>, text?: string) => {
    const el = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
    if (text) el.textContent = text;
    svg.append(el);
    return el;
  };
  const r = rng(hashString(it.heading));
  // background stars
  for (let i = 0; i < 260; i++) add('circle', { cx: r() * W, cy: r() * H, r: r() * 1.4 + 0.2, fill: '#fff', opacity: 0.3 + r() * 0.6 });
  // spiral arms
  for (let a = 0; a < 2; a++) {
    let d = '';
    for (let t = 0; t < 1; t += 0.01) {
      const ang = a * Math.PI + t * Math.PI * 2.2;
      const rad = 40 + t * 380;
      d += `${t ? 'L' : 'M'}${cx + Math.cos(ang) * rad * 1.15},${cy + Math.sin(ang) * rad * 0.82}`;
    }
    add('path', { d, stroke: '#6a7ad8', 'stroke-width': 26, fill: 'none', opacity: 0.12, 'stroke-linecap': 'round' });
  }
  // the hub
  add('circle', { cx, cy, r: 46, fill: '#1b1b28', stroke: '#f0a020', 'stroke-width': 3, 'stroke-dasharray': '6 5' });
  add('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', class: 'sc-hub' }, it.hub.name);
  if (it.hub.note) add('text', { x: cx, y: cy + 20, 'text-anchor': 'middle', class: 'sc-small' }, it.hub.note);
  // sectors around it
  it.sectors.forEach((s, k) => {
    const ang = -Math.PI / 2 + (k / it.sectors.length) * Math.PI * 2;
    const sx = cx + Math.cos(ang) * 300;
    const sy = cy + Math.sin(ang) * 255;
    const color = s.color ?? SECTOR_COLORS[k % SECTOR_COLORS.length];
    add('line', {
      x1: cx + Math.cos(ang) * 50,
      y1: cy + Math.sin(ang) * 50,
      x2: sx,
      y2: sy,
      stroke: color,
      'stroke-width': 2,
      'stroke-dasharray': '2 6',
      opacity: 0.8,
    });
    add('circle', { cx: sx, cy: sy, r: 92, fill: color, opacity: 0.12 });
    add('circle', { cx: sx, cy: sy, r: 92, fill: 'none', stroke: color, 'stroke-width': 2 });
    add('text', { x: sx, y: sy - 100, 'text-anchor': 'middle', class: 'sc-sector', fill: color }, `${k + 1}. ${s.name}`);
    if (s.gate) add('text', { x: sx, y: sy + 112, 'text-anchor': 'middle', class: 'sc-gate' }, `Gate: ${s.gate}`);
    s.worlds.forEach((w, i) => {
      const a2 = (i / s.worlds.length) * Math.PI * 2;
      const wx = sx + Math.cos(a2) * 66;
      const wy = sy + Math.sin(a2) * 66;
      const holds = !!w.holds;
      add('circle', { cx: wx, cy: wy, r: holds ? 6 : 4, fill: holds ? '#f6d04d' : color, stroke: holds ? '#fff' : 'none', 'stroke-width': 1.2 });
      add(
        'text',
        { x: wx + (Math.cos(a2) >= 0 ? 8 : -8), y: wy + 3, 'text-anchor': Math.cos(a2) >= 0 ? 'start' : 'end', class: `sc-world ${holds ? 'holds' : ''}` },
        w.name,
      );
    });
  });
  const inset = it.inset ? await mapPicture(ctx, it.inset, 'sc-inset') : null;
  const legend = h(
    'div',
    { class: 'sc-legend' },
    h('b', null, 'LEGEND'),
    h('span', null, h('i', { class: 'dot gold' }), ' shard or module vault'),
    h('span', null, h('i', { class: 'dot' }), ' world'),
    ...(it.notes ?? []).map((n) => h('span', null, n)),
  );
  return [
    sheet(
      11,
      8.5,
      'sc',
      h('header', { class: 'sc-head' }, h('b', null, it.heading), h('span', null, 'FOLD-OUT GALAXY CHART · COURIER ISSUE')),
      svg as unknown as HTMLElement,
      inset,
      legend,
      h('div', { class: 'sc-folds', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
    ),
  ];
}

/** On screen, the star chart comes folded in four and opens with a flourish. */
export function foldOut(sheets: Sheet[]): HTMLElement {
  const s = sheets[0];
  const panels = 4;
  const holder = h('div', { class: 'pp-fo' });
  const folded = h('div', { class: 'fo-folded' });
  for (let i = 0; i < panels; i++) {
    const clone = s.el.cloneNode(true) as HTMLElement;
    const win = h('div', { class: 'fo-panel', style: `--i:${i};--n:${panels}` }, clone);
    folded.append(win);
  }
  const btn = h('button', { class: 'fo-btn', onclick: () => unfold() }, 'Unfold the chart');
  const unfold = () => {
    holder.classList.add('open');
    btn.remove();
    setTimeout(() => {
      folded.replaceWith(s.el);
      holder.classList.add('done');
    }, 1300);
  };
  holder.append(folded, btn);
  // the sheet's width is set by the viewer; the folded copy follows it
  const sync = new ResizeObserver(() => holder.style.setProperty('--sw', `${s.el.style.width || '900px'}`));
  sync.observe(holder);
  holder.style.setProperty('--sw', s.el.style.width || '900px');
  return holder;
}

export function renderItem(ctx: PrintContext, it: PrintableItem): Promise<Sheet[]> {
  switch (it.kind) {
    case 'map':
      return mapItem(ctx, it);
    case 'hintbook':
      return hintBook(ctx, it);
    case 'letter':
      return letter(it);
    case 'newspaper':
      return newspaper(ctx, it);
    case 'journal':
      return journal(it);
    case 'idcard':
      return idCard(ctx, it);
    case 'chart':
      return chart(it);
    case 'starchart':
      return starChart(ctx, it);
  }
}
