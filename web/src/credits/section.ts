// Small building blocks shared by the Credits page's sections.
import { h } from '../editor/core/ui';
import { REPO_URL } from '../seo/site';

type Body = Parameters<typeof h>[2];

/** A titled section the page's "On this page" list picks up. */
export const section = (id: string, title: string, ...body: Body[]) => h('section', { 'aria-labelledby': id }, h('h2', { id }, title), ...body);

/** A link that opens in a new tab. */
export const ext = (href: string, text: string) => h('a', { href, target: '_blank', rel: 'noopener' }, text);

/** A file in the repository, linked on GitHub. */
export const repoFile = (path: string) => ext(`${REPO_URL}/blob/master/${path}`, path);
