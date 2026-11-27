// Exercise overlapping summary reads through the desk buddy's button and game events.
import { expect, it, vi } from 'vitest';
import { FakeDoc, FakeEl, FakeWin } from '../../../test/fakeDom';
import { buddySummary } from './buddyStats';
import { deskBuddy } from './deskBuddy';
import { DESK_PLAY } from './deskPlay';

vi.mock('./buddyStats', () => ({ buddySummary: vi.fn() }));
vi.mock('./buddyStore', () => ({ loadBuddy: () => ({ quiet: true }), saveBuddy: vi.fn() }));
vi.mock('./courierCard', () => ({ courierCard: () => ({ el: document.createElement('div'), refresh: vi.fn(), dispose: vi.fn() }) }));
vi.mock('../../editor/shell/homeDone', () => ({ loadFinished: () => [] }));
vi.mock('../diploma/frameLevel', () => ({ frameLook: () => undefined }));

it('keeps the current game on the card when the previous summary finishes last', async () => {
  const doc = new FakeDoc();
  const win = new FakeWin();
  vi.useFakeTimers();
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', globalThis);
  vi.stubGlobal('addEventListener', win.addEventListener.bind(win));
  vi.stubGlobal('removeEventListener', win.removeEventListener.bind(win));
  const dispose = deskBuddy((el) => doc.body.append(el as unknown as FakeEl));
  try {
    const [, press, , card] = doc.body.children[0].children;
    Object.assign(card, { hidden: true });
    const older = { playing: 'First', played: 1, badges: 0, pose: 'idle' as const };
    let finish!: () => void;
    vi.mocked(buddySummary)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finish = () => resolve(older);
        }),
      )
      .mockResolvedValueOnce({ ...older, playing: 'Second' });
    win.fire(DESK_PLAY, { detail: { title: 'First' } });
    press.fire('click');
    win.fire(DESK_PLAY, { detail: { title: 'Second' } });
    const title = () => card.children.find((el) => el.tag === 'dl')?.children.at(-1)?.children[0].textContent;
    await Promise.resolve();
    expect(title()).toBe('Second');
    finish();
    await Promise.resolve();
    expect(title()).toBe('Second');
  } finally {
    dispose();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  }
});
