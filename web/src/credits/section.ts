// Small building blocks shared by the Credits page's sections.
import { h } from '../editor/core/ui';
import { REPO_URL } from '../seo/site';

type Body = Parameters<typeof h>[2];

/** A titled section the page's "On this page" list picks up, opening with a one-line intro. */
export const section = (id: string, title: string, intro: Body, ...body: Body[]) =>
  h('section', { 'aria-labelledby': id, class: 'credits-section' }, h('h2', { id }, title), h('p', { class: 'section-intro' }, intro), ...body);

/** A link that opens in a new tab. */
export const ext = (href: string, text: string) => h('a', { href, target: '_blank', rel: 'noopener' }, text);

/** A file in the repository, linked on GitHub. */
export const repoFile = (path: string) => ext(`${REPO_URL}/blob/master/${path}`, path);

/** A label's intro screen (public/credits/*.webp, 320×200), with where it comes from. */
export const banner = (src: string, alt: string, caption: Body) =>
  h(
    'figure',
    { class: 'credits-banner' },
    h('img', { src: `./credits/${src}`, alt, width: 320, height: 200, loading: 'lazy', decoding: 'async' }),
    h('figcaption', null, caption),
  );

/** A small picture with its name under it (a title screen or a cast member). */
export const thumb = (src: string, alt: string, caption: Body, href?: string, size: [number, number] = [160, 100]) => {
  const img = h('img', { src, alt, width: size[0], height: size[1], loading: 'lazy', decoding: 'async' });
  return h('figure', { class: 'credits-thumb' }, href ? h('a', { href }, img) : img, h('figcaption', null, caption));
};

/** A box of related facts or one tool's credit, titled one level under the heading it sits in. */
export const card = (level: 'h3' | 'h4', title: Body, ...body: Body[]) => h('div', { class: 'credits-card' }, h(level, null, title), ...body);

/**
 * Long reference material behind a disclosure: a one-line summary that says what is inside
 * (a native <details>, so screen readers announce it as collapsed or expanded).
 */
export const more = (summary: string, ...body: Body[]) =>
  h('details', { class: 'credits-more' }, h('summary', null, summary), h('div', { class: 'credits-more-body' }, ...body));
