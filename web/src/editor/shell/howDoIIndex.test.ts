// Deferred file reads must respect navigation and later question selections.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FakeDoc, type FakeEl } from '../../../test/fakeDom';
import { playHref } from './howDoIGo';
import { questionButtons } from './howDoIIndex';

vi.mock('./howDoIGo', () => ({ playHref: vi.fn(), seeHref: vi.fn() }));
vi.mock('../core/ui', async (load) => ({ ...(await load<typeof import('../core/ui')>()), toast: vi.fn() }));

beforeEach(() => {
  vi.stubGlobal('document', new FakeDoc());
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('location', { hash: '#guide' });
});
afterEach(() => vi.unstubAllGlobals());

function start() {
  let finish!: (href: string) => void;
  vi.mocked(playHref).mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
  const onGo = vi.fn();
  const buttons = questionButtons(
    { id: 'sample', title: 'Sample', kind: 'gameware', path: '', gam: null },
    { game: 'sample', gameTitle: 'Sample', id: 'door', q: 'Door?', level: 1, scene: 1, x: 0, y: 0 },
    onGo,
  ) as unknown as FakeEl;
  buttons.children[0].isConnected = true;
  buttons.children[0].fire('click');
  return { finish, onGo };
}

it('preserves navigation while a level is opening', async () => {
  const action = start();
  location.hash = '#home';
  action.finish('#old-level');
  await Promise.resolve();
  expect(location.hash).toBe('#home');
  expect(action.onGo).not.toHaveBeenCalled();
});

it('only opens the latest selected question', async () => {
  const first = start();
  const second = start();
  first.finish('#old-level');
  await Promise.resolve();
  expect(location.hash).toBe('#guide');
  second.finish('#new-level');
  await Promise.resolve();
  expect(location.hash).toBe('#new-level');
  expect(second.onGo).toHaveBeenCalledOnce();
});

it('discards a pending selection after leaving and returning to the Guide', async () => {
  const action = start();
  location.hash = '#home';
  window.dispatchEvent(new Event('hashchange'));
  location.hash = '#guide';
  action.finish('#old-level');
  await Promise.resolve();
  expect(location.hash).toBe('#guide');
  expect(action.onGo).not.toHaveBeenCalled();
});
