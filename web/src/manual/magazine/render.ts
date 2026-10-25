// Draws the magazine's pages (types.ts) as HTML: each block as its printed piece (headlines,
// columns, boxed sidebars, beveled screenshots, order cards with a dotted cut line, ads), the
// running head and the folio. Links are real <a href>s (go.ts goHref) carrying their go: target
// in data-go, which the viewer runs (goRun.ts) when it opens something on top instead.
import { h } from '../../editor/core/ui';
import type { CatalogEntry } from '../../project/files';
import { decorateBbsName } from '../../retro/bbs/bbsName';
import { artElement } from './art';
import { calloutsFigure } from './callouts';
import { coverFan } from './coverFan';
import { discFigure } from './disc';
import { goHref, parseGo, type Where } from './go';
import { runs } from './inline';
import { MAG } from './masthead';
import { mugShelf } from './mugShelf';
import { shelfList } from './shelf';
import { replyMail } from './replyMail';
import type { Block, HalfAd, Inline, PlacedPage, ShotView } from './types';

export interface RenderEnv {
  where: Where;
  /** The catalog entry of a listed game, for its screenshots. */
  entry(id: string): CatalogEntry | undefined;
}

/** THE CHEZ is never split across lines (keepTogether.ts), nor is a phone number. */
const keep = (s: string) => s.replace(/THE CHEZ/g, 'THE\u00a0CHEZ').replace(/\b1-\d{3}-555-[\dA-Z]{4}\b/g, (n) => n.replace(/-/g, '\u2011'));

export function goLink(go: string, where: Where, ...children: (Node | string)[]): HTMLAnchorElement {
  const outside = parseGo(go)?.kind === 'url';
  return h(
    'a',
    { class: 'mag-go', href: goHref(go, where), dataset: { go }, target: outside ? '_blank' : undefined, rel: outside ? 'noopener' : undefined },
    ...children,
  );
}

function inline(text: Inline, where: Where): Node[] {
  const list = runs(text);
  return list.map((r) => {
    const t = keep(r.text);
    if (r.go) {
      const a = goLink(r.go, where, t);
      // a link on a line of its own is a target of its own: at least 24px tall
      if (list.length === 1) a.classList.add('mag-solo');
      return a;
    }
    if (r.b) return h('b', null, t);
    if (r.i) return h('i', null, t);
    return document.createTextNode(t);
  });
}

/** Screenshots, drawn once per game and view and kept as pictures (so they print). */
const shots = new Map<string, Promise<string | undefined>>();
function shotUrl(entry: CatalogEntry, view: ShotView): Promise<string | undefined> {
  const key = `${entry.id}:${view}`;
  let p = shots.get(key);
  if (!p && view !== 'title' && view !== 'level') {
    p = import('./toolShots').then(({ toolShot }) => toolShot(entry, view));
    shots.set(key, p);
  }
  if (!p) {
    p = import('../../gfx/gameShots').then(async ({ renderShot, renderTitle }) => {
      const c = document.createElement('canvas');
      const ok = view === 'title' ? await renderTitle(entry, c) : await renderShot(entry, c, 10, 6);
      // no title screen: the level instead
      if (!ok && view === 'title' && (await renderShot(entry, c, 10, 6))) return c.toDataURL();
      return ok ? c.toDataURL() : undefined;
    });
    shots.set(key, p);
  }
  return p;
}

/** A screenshot on its beveled frame, filled in once drawn (hidden when the game has none). */
function shotFigure(
  game: string,
  view: ShotView,
  alt: string,
  env: RenderEnv,
  pending: Promise<unknown>[],
  cls: string,
  caption?: Inline,
  tilt?: number,
): HTMLElement {
  const img = h('img', { alt, width: 320, height: 192 });
  const fig = h(
    'figure',
    { class: cls, style: tilt ? `--tilt:${tilt}deg` : undefined },
    h('span', { class: 'mag-bevel' }, img),
    caption ? h('figcaption', null, ...inline(caption, env.where)) : null,
  );
  const entry = env.entry(game);
  if (entry)
    pending.push(
      shotUrl(entry, view).then((url) => {
        if (url) img.src = url;
        else fig.classList.add('none');
      }),
    );
  else fig.classList.add('none');
  return fig;
}

function block(b: Block, env: RenderEnv, pending: Promise<unknown>[]): HTMLElement {
  const { where } = env;
  // a question and the answer after it stay together: never the question at a column's foot
  // and its answer at the top of the next
  const all = (list: Block[]) =>
    list.flatMap((x, i) => {
      const next = list[i + 1];
      if (x.t === 'qa' && x.who) {
        const prev = list[i - 1];
        if (prev?.t === 'qa' && !prev.who) return [];
      }
      if (x.t === 'qa' && !x.who && next?.t === 'qa' && next.who) return [h('div', { class: 'mag-qa' }, block(x, env, pending), block(next, env, pending))];
      return [block(x, env, pending)];
    });
  switch (b.t) {
    case 'head': {
      const tag: 'h1' | 'h2' | 'h3' = b.level === 1 ? 'h1' : b.level === 3 ? 'h3' : 'h2';
      return h(
        'div',
        { class: `mag-head size-${b.size ?? 'm'}` },
        b.kicker ? h('p', { class: 'mag-kicker' }, b.kicker) : null,
        h(tag, null, keep(b.text)),
        b.deck ? h('p', { class: 'mag-deck' }, ...inline(b.deck, where)) : null,
      );
    }
    case 'p':
      return h('p', { class: [b.drop ? 'mag-drop' : '', b.lead ? 'mag-lead' : ''].join(' ').trim() || undefined }, ...inline(b.text, where));
    case 'qa':
      return h('p', { class: b.who ? 'mag-a' : 'mag-q' }, b.who ? h('b', { class: 'mag-who' }, `${b.who}: `) : null, ...inline(b.text, where));
    case 'list':
      return h(b.ordered ? 'ol' : 'ul', { class: 'mag-list' }, ...b.items.map((it) => h('li', null, ...inline(it, where))));
    case 'cols':
      return h('div', { class: `mag-cols n${b.n}` }, ...all(b.blocks));
    case 'grid':
      return h('div', { class: 'mag-grid', style: `--min:${(b.min ?? 0.28) * 100}cqw` }, ...b.cells.map((c) => h('div', { class: 'mag-cell' }, ...all(c))));
    case 'side':
      return h(
        'aside',
        { class: `mag-side tone-${b.tone ?? 'yellow'}`, 'aria-label': b.title },
        h(b.level === 2 ? 'h2' : 'h3', null, keep(b.title)),
        ...all(b.blocks),
      );
    case 'pull':
      return h('blockquote', { class: 'mag-pull' }, h('p', null, ...inline(b.text, where)), b.by ? h('footer', null, `— ${b.by}`) : null);
    case 'shot':
      return shotFigure(b.game, b.view, b.alt, env, pending, b.float ? `mag-shot float-${b.float}` : 'mag-shot', b.caption, b.tilt);
    case 'art':
      return h('figure', { class: `mag-art art-${b.art}` }, artElement(b.art, b.alt), b.caption ? h('figcaption', null, ...inline(b.caption, where)) : null);
    case 'cast':
      return h(
        'figure',
        { class: 'mag-cast' },
        h(
          'span',
          { class: 'mag-cast-frame' },
          h('img', { src: `./cast/${b.id}.png`, alt: b.alt, width: b.w, height: b.h, style: `--w:${b.w * Math.max(1, Math.floor(120 / Math.max(b.w, b.h)))}` }),
        ),
        b.caption ? h('figcaption', null, ...inline(b.caption, where)) : null,
      );
    case 'piece': {
      // a link is named by its words (hidden text, so it is not at odds with the printed piece's); a picture by its label
      const frame = b.go ? goLink(b.go, where, h('span', { class: 'sr-only' }, b.alt)) : h('span', { role: 'img', 'aria-label': b.alt });
      frame.classList.add('mag-piece-frame');
      const fig = h('figure', { class: `mag-piece${b.float ? ` float-${b.float}` : ''}` }, frame);
      const entry = b.game ? env.entry(b.game) : undefined;
      if (!entry && b.piece !== 'ultimate') fig.classList.add('none');
      else
        pending.push(
          import('./piece')
            .then((m) => m.pieceSheet(entry, b.piece))
            .then((el) => {
              if (!el) return fig.classList.add('none');
              el.inert = true; // a picture of the piece: nothing in it to reach
              el.setAttribute('aria-hidden', 'true');
              frame.append(el);
            })
            .catch(() => fig.classList.add('none')),
        );
      return fig;
    }
    case 'big':
      return h(
        'p',
        { class: 'mag-big' },
        h('span', { class: 'mag-big-text' }, keep(b.text)),
        b.side ? h('span', { class: 'mag-big-side' }, ...inline(b.side, where)) : null,
      );
    case 'rows':
      return h(
        'ul',
        { class: 'mag-rows' },
        ...b.rows.map((r) =>
          h(
            'li',
            { class: r.shot ? 'has-shot' : undefined },
            r.shot ? shotFigure(r.shot.game, r.shot.view, r.shot.alt, env, pending, 'mag-row-shot') : null,
            h('span', { class: 'mag-row-title' }, r.go ? goLink(r.go, where, keep(r.title)) : keep(r.title)),
            r.price ? h('span', { class: 'mag-row-price' }, r.price) : null,
            r.by || r.kind ? h('span', { class: 'mag-row-by' }, [r.by, r.kind].filter(Boolean).join(' · ')) : null,
            r.blurb ? h('span', { class: 'mag-row-blurb' }, ...inline(r.blurb, where)) : null,
            r.more?.length ? h('span', { class: 'mag-row-more' }, ...r.more.map(([label, go]) => goLink(go, where, label))) : null,
          ),
        ),
      );
    case 'hint':
      return h(
        'div',
        { class: 'mag-hint' },
        h('p', { class: 'mag-hint-q' }, h('b', null, 'Q: '), ...inline(b.q, where)),
        h('p', { class: 'mag-hint-a', title: 'Turn the page over to read it' }, h('b', null, 'A: '), keep(b.a)),
      );
    case 'card':
      return h(
        'div',
        { class: `mag-card tone-${b.tone ?? 'white'}` },
        h('span', { class: 'mag-scissors', 'aria-hidden': 'true' }, '✂'),
        h('h3', null, keep(b.title)),
        ...b.lines.map((l) => h('p', null, ...inline(l, where))),
        ...(b.fields ?? []).map((f) => h('p', { class: 'mag-field' }, h('span', null, f), h('i', { 'aria-hidden': 'true' }))),
        b.go ? goLink(b.go, where, b.button ?? 'Send it') : null,
      );
    case 'adframe':
      return h(
        'div',
        { class: `mag-adframe tone-${b.tone ?? 'white'}` },
        b.burst ? h('span', { class: 'mag-burst' }, b.burst) : null,
        h('h2', null, keep(b.head)),
        b.sub ? h('p', { class: 'mag-ad-sub' }, ...inline(b.sub, where)) : null,
        ...all(b.blocks),
        b.small ? h('p', { class: 'mag-small' }, ...inline(b.small, where)) : null,
      );
    case 'button': {
      const a = goLink(b.go, where, keep(b.label));
      a.classList.add('mag-btn');
      return a;
    }
    case 'note':
      return h('p', { class: 'mag-note' }, ...inline(b.text, where));
    case 'masthead':
      return h(
        'header',
        { class: 'mag-masthead' },
        h('p', { class: 'mag-mast-issue' }, h('span', null, b.issue), h('span', null, b.price)),
        h('h1', null, b.name),
        h('p', { class: 'mag-mast-tag' }, b.tagline),
      );
    case 'disc':
      return discFigure(
        b,
        (go, ...kids) => goLink(go, where, ...kids),
        (text) => inline(text, where),
      );
    case 'callouts':
      return calloutsFigure(b, (text) => inline(text, where));
    case 'covers':
      return coverFan(b);
    case 'reply':
      return replyMail(b);
    case 'mugs':
      return mugShelf(b, pending);
    case 'shelf':
      return shelfList(b);
    case 'jump': {
      const n = b.folio === undefined ? '' : ` ${b.folio}`;
      if (b.dir === 'on') {
        const a = goLink(`go:mag/${b.page}`, where, `Continued on page${n} ▸`);
        a.classList.add('mag-solo');
        return h('p', { class: 'mag-jump on' }, a);
      }
      const a = goLink(`go:mag/${b.page}`, where, `▸ Continued from page${n}`);
      a.classList.add('mag-solo');
      return h('div', { class: 'mag-jump from' }, h('h2', null, keep(b.title ?? '')), h('p', null, a));
    }
    case 'halfad':
      return halfAdBox(b, env, pending);
    case 'beside':
      return h('div', { class: 'mag-beside' }, h('div', { class: 'mag-beside-main' }, ...all(b.blocks)), halfAdBox(b.ad, env, pending));
    case 'rule':
      return h('hr');
  }
}

/** A small ad on an editorial page: labelled ADVERTISEMENT over its own frame, set apart from the story. */
function halfAdBox(b: HalfAd, env: RenderEnv, pending: Promise<unknown>[]): HTMLElement {
  const { where } = env;
  return h(
    'aside',
    { class: 'mag-halfad', 'aria-label': `Advertisement: ${b.advertiser}` },
    h('p', { class: 'mag-halfad-label', 'aria-hidden': 'true' }, 'ADVERTISEMENT'),
    h(
      'div',
      { class: `mag-halfad-frame tone-${b.tone ?? 'white'}` },
      b.burst ? h('span', { class: 'mag-burst' }, b.burst) : null,
      h('h3', null, keep(b.head)),
      b.sub ? h('p', { class: 'mag-ad-sub' }, ...inline(b.sub, where)) : null,
      ...b.blocks.map((x) => block(x, env, pending)),
      b.small ? h('p', { class: 'mag-small' }, ...inline(b.small, where)) : null,
    ),
  );
}

/** A page, and a promise that its screenshots are in (for printing). */
export function renderPage(pg: PlacedPage, env: RenderEnv): { el: HTMLElement; ready: Promise<unknown> } {
  const pending: Promise<unknown>[] = [];
  const body = pg.blocks.map((b) => block(b, env, pending));
  const plainPage = pg.kind === 'cover' || pg.kind === 'back';
  const el = h(
    'article',
    {
      class: `mag-page kind-${pg.kind} tone-${pg.tone ?? 'white'}${pg.look ? ` look-${pg.look}` : ''}${pg.stub ? ' stub' : ''}`,
      'aria-label': pg.folio === 1 ? 'Front cover' : pg.kind === 'back' ? 'Back cover' : `Page ${pg.folio}`,
      dataset: { page: pg.id },
    },
    h(
      'div',
      { class: 'mag-in' },
      pg.head ? h('div', { class: 'mag-runhead', 'aria-hidden': 'true' }, h('span', null, MAG.name), h('span', null, pg.head)) : null,
      pg.kind === 'ad' ? h('div', { class: 'mag-adlabel', 'aria-hidden': 'true' }, 'ADVERTISEMENT') : null,
      h('div', { class: 'mag-body' }, ...body),
      pg.stub ? h('div', { class: 'mag-stamp', 'aria-hidden': 'true' }, 'IN THE NEXT DRAFT') : null,
      plainPage
        ? null
        : h('div', { class: 'mag-folio', 'aria-hidden': 'true' }, h('span', null, String(pg.folio)), h('span', null, `${MAG.name} · ${MAG.issue}`)),
    ),
  );
  decorateBbsName(el);
  return { el, ready: Promise.all(pending) };
}
