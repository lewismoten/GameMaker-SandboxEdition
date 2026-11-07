// Booklet folios must include measured contents and continuation pages; physical layout needs a browser.
import { afterEach, expect, it, vi } from 'vitest';
import { techRefItem } from './techRef';

const layout = vi.hoisted(() => ({ contentsPages: 1, removed: vi.fn() }));
vi.mock('../../editor/core/ui', () => ({
  h: (tag: string, _attrs: unknown, ...children: (HTMLElement | string)[]) => ({
    tagName: tag.toUpperCase(),
    children: children.filter((c) => typeof c !== 'string'),
    textContent: children.map((c) => (typeof c === 'string' ? c : c.textContent)).join(''),
    remove: layout.removed,
  }),
}));
vi.mock('./manualPages', () => ({ measurer: () => () => ({}) }));
vi.mock('./kit', () => ({ sheet: vi.fn() }));
vi.mock('./techRefDiagrams', () => ({ TECHREF_DIAGRAMS: {} }));
vi.mock('./markdownBlocks', async (original) => ({
  ...(await original<typeof import('./markdownBlocks')>()),
  elementWith: () => () => ({ tagName: 'P', children: [], textContent: '' }),
}));
vi.mock('./paginate', () => ({
  paginate: (blocks: HTMLElement[]) => {
    if (blocks[0].textContent === 'Contents') return [blocks, ...Array.from({ length: layout.contentsPages - 1 }, () => [])];
    // The opening chapter takes two measured pages, so subsequent starts cannot use chapter indexes.
    return blocks[0].textContent === 'Before you begin' ? [blocks, []] : [blocks];
  },
}));
afterEach(() => vi.unstubAllGlobals());

it.each([1, 2])('matches every contents folio after %s measured contents pages', async (count) => {
  layout.contentsPages = count;
  layout.removed.mockClear();
  vi.stubGlobal('document', { body: { append: vi.fn() } });
  const pages = await techRefItem().pages!();
  expect(pages[0].kind).toBe('cover');
  expect(pages.at(-1)?.kind).toBe('back');
  expect(pages.length % 4).toBe(0);
  expect(pages.filter((p) => p.head?.[1] === 'Contents')).toHaveLength(count);
  const table = pages[1].body[1];
  const rows = [...table.children[1].children];
  expect(rows).toHaveLength(31);
  for (const row of rows) {
    const [title, folio] = [...row.children].map((cell) => cell.textContent);
    expect(pages[Number(folio)].body[0].textContent).toBe(title);
  }
  expect(layout.removed).toHaveBeenCalledOnce();
});
