// Exercise platform verification through the Generate dialog's area and dismissal controls.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc } from '../../../../../test/fakeDom';
import type { Project } from '../../../core/project';
import { generateDialog } from './generateDialog';
import { startPlatformBot } from './platformBotClient';

vi.mock('./platformBotClient', () => ({ startPlatformBot: vi.fn() }));

// Layout generation has its own tests. Supply successful offers for the requested area.
vi.mock('./place', async (original) => ({
  ...(await original<typeof import('./place')>()),
  offers: (...[blocks, , , , seed, rect]: Parameters<typeof import('./place').offers>) =>
    Array.from({ length: 4 }, (_, i) => ({
      blocks,
      seed: seed + i,
      check: { verified: true },
      outcome: { ok: true, result: { rect, entry: 0, exit: 1, locks: [], links: [], furniture: [], monsters: [], notes: [] } },
    })),
}));

function openPlatformDialog() {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.000017);
  vi.mocked(startPlatformBot).mockReturnValue({ done: Promise.resolve({ won: true, why: '', ticks: 1 }), cancel: vi.fn() });
  const elements: ReturnType<FakeDoc['createElement']>[] = [];
  class CanvasDoc extends FakeDoc {
    override createElement(tag: string) {
      const el = super.createElement(tag);
      elements.push(el);
      return Object.assign(el, { getContext: () => ({}) });
    }
  }
  vi.stubGlobal('document', new CanvasDoc());
  const project = {
    files: new Map(),
    extras: (_file: string, section: string) => (section === 'roles' ? { 0: { roles: ['sky'] }, 1: { roles: ['wall'] } } : []),
  } as unknown as Project;
  const done = generateDialog({
    project,
    bbl: 'SET.BBL',
    blockCount: 2,
    blocks: () => new Uint8Array(10000),
    images: () => [],
    selection: () => ({ x: 0, y: 0, w: 40, h: 20 }),
    blockSet: () => [],
    monsters: () => [],
    hero: { chr: 'HERO.CHR' },
    apply: vi.fn(),
  });
  return { done, elements };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it('plays fresh offers after switching from a top-left selection to the whole map', async () => {
  const { done, elements } = openPlatformDialog();
  await vi.dynamicImportSettled();
  await vi.runAllTimersAsync();
  const widths = () => vi.mocked(startPlatformBot).mock.calls.map(([job]) => job.result.rect.w);
  expect(widths()).toEqual([40, 40, 40, 40]);
  const where = elements.find((el) => el.attrs['aria-label'] === 'Where to draw')!;
  Object.assign(where, { value: 'whole' }).fire('change');
  await vi.dynamicImportSettled();
  await vi.runAllTimersAsync();
  expect(widths().slice(4)).toEqual([100, 100, 100, 100]);
  elements.find((el) => el.tag === 'dialog')!.fire('cancel');
  await done;
});
