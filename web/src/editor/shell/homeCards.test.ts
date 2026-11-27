// Home tiles offer the printed manual only for games with a retail box.
import { expect, it, vi } from 'vitest';
import { FakeDoc, type FakeEl } from '../../../test/fakeDom';

vi.mock('./homeIcons', () => ({ icon: () => document.createElement('span') }));

it('keeps the manual button exclusive to retail game tiles', async () => {
  vi.stubGlobal('document', new FakeDoc());
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
    },
  );
  try {
    const { gameTile } = await import('./homeCards');
    const { catalogGame } = await import('./homeGames');
    const original = {
      manual: { title: 'Lessons', pages: [] },
      box: { background: '', accent: '', ink: '', tagline: '', back: '', features: [] },
    };
    for (const series of ['sandbox', 'starter'] as const) {
      const game = catalogGame({ id: 'sample', title: 'Sample', path: 'sample/', gam: 'sample.gam', files: [], kind: 'gameware', series, original }, series);
      const tile = gameTile(game, { onSelect: vi.fn() }) as unknown as FakeEl;
      const buttons = tile.children[0].children[1].children.map((el) => el.dataset.tip);
      expect(buttons).toContain('Keys: what each key does');
      expect(buttons.includes('Read the manual')).toBe(series === 'sandbox');
    }
  } finally {
    vi.unstubAllGlobals();
  }
});
