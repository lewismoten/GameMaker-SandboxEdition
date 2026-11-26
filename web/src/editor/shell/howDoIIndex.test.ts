// Starter question dialog dismissal and result announcements.
import type { CatalogEntry } from '../../project/files';
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc, FakeEl } from '../../../test/fakeDom';
import { howDoIIndex } from './howDoIIndex';
import { loadQuestions } from '../../project/howDoI';
import { playHref } from './howDoIGo';
import { toast } from '../core/ui';

vi.mock('../../project/howDoI', async (original) => ({ ...(await original<typeof import('../../project/howDoI')>()), loadQuestions: vi.fn() }));
vi.mock('./howDoIGo', () => ({ playHref: vi.fn(), seeHref: vi.fn() }));
vi.mock('../core/ui', async (original) => ({ ...(await original<typeof import('../core/ui')>()), toast: vi.fn() }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const entry: CatalogEntry = { id: 'demo', title: 'Demo', path: 'demo', kind: 'gameware', gam: null };
const catalog = {
  entries: new Map([[entry.id, entry]]),
  questions: [{ id: 'door', q: 'Door?', game: entry.id, gameTitle: entry.title, level: 1, scene: 1, x: 0, y: 0 }],
};

async function openDialog() {
  const doc = new FakeDoc();
  const create = doc.createElement.bind(doc);
  doc.createElement = (tag) => Object.assign(create(tag), tag === 'input' ? { value: '' } : {});
  vi.stubGlobal('document', doc);
  vi.stubGlobal('requestAnimationFrame', vi.fn());
  const opener = howDoIIndex({ compact: true }) as unknown as FakeEl;
  opener.fire('click');
  await Promise.resolve();
  return doc.body.children[0];
}

it.each(['success', 'missing', 'error'])('ignores a late %s after Escape', async (outcome) => {
  vi.stubGlobal('location', { hash: '#starters' });
  vi.mocked(loadQuestions).mockResolvedValue(catalog);
  let finish!: () => void;
  vi.mocked(playHref).mockReturnValue(
    new Promise((resolve, reject) => {
      finish = () => (outcome === 'error' ? reject(new Error('read failed')) : resolve(outcome === 'success' ? '#level' : undefined));
    }),
  );
  const dialog = await openDialog();
  const list = dialog.children[1].children[1];
  const play = list.children[0].children[2].children[0];
  Object.defineProperty(play, 'isConnected', { get: () => dialog.isConnected });
  play.fire('click');
  expect(playHref).toHaveBeenCalledOnce();
  dialog.fire('cancel');
  finish();
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(location.hash).toBe('#starters');
  expect(toast).not.toHaveBeenCalled();
});

it('announces an empty catalog without suggesting another search', async () => {
  vi.mocked(loadQuestions).mockResolvedValue({ entries: new Map(), questions: [] });
  const dialog = await openDialog();
  const [head, list] = dialog.children[1].children;
  expect(head.children[2].textContent).toBe('No Starter questions are available.');
  expect(list.children).toHaveLength(0);
});

it('suggests scrolling only when the displayed results overflow', async () => {
  vi.mocked(loadQuestions).mockResolvedValue(catalog);
  const dialog = await openDialog();
  const [head, list] = dialog.children[1].children;
  const [, search, status] = head.children;
  Object.assign(list, { clientHeight: 100, scrollHeight: 100 });
  search.fire('input');
  expect(status.textContent).not.toContain('scroll');
  Object.assign(list, { scrollHeight: 101 });
  search.fire('input');
  expect(status.textContent).toContain('scroll');
  Object.assign(search, { value: 'missing' });
  search.fire('input');
  expect(status.textContent).toBe('0 of 1 question');
  expect(list.children[0].children[0].textContent).toContain('No question matches');
});
