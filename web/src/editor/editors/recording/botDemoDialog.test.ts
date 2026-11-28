// A worker can report every 250 ms. Only sampled progress belongs in the dialog's live region.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc } from '../../../../test/fakeDom';
import { GameFiles } from '../../../project/files';
import { Project } from '../../core/project';
import { startBotDemo } from './botDemoClient';
import type { BotDemo } from './botDemo';
import { botDemoDialog } from './botDemoDialog';

vi.mock('./botDemoClient', () => ({ startBotDemo: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());

it.each(['done', 'error', 'stop'])('updates the visible line on every tick and announces %s immediately', async (outcome) => {
  const doc = new FakeDoc();
  vi.stubGlobal('document', doc);
  let now = 0;
  vi.stubGlobal('performance', { now: () => now });
  let finish!: (demo: BotDemo) => void;
  let fail!: (error: Error) => void;
  const done = new Promise<BotDemo>((resolve, reject) => {
    finish = resolve;
    fail = reject;
  });
  vi.mocked(startBotDemo).mockReturnValue({ done, cancel: () => fail(new DOMException('Stopped', 'AbortError')) });
  const elements = vi.spyOn(doc, 'createElement');
  const dialog = botDemoDialog(Project.fromFiles(new GameFiles(), 'Demo', 'demo'));
  const nodes = elements.mock.results.map((r) => r.value);
  const status = nodes.find((el) => el.attrs.role === 'status')!;
  const line = nodes.find((el) => el.className.includes('rec-bot-status'))!;
  const button = nodes.find((el) => el.textContent.includes('Let it play'))!;
  button.fire('click');
  const progress = vi.mocked(startBotDemo).mock.lastCall![2]!;
  for (let i = 1; i <= 9; i++) {
    now += 250;
    progress(`Tried ${i}`);
    expect(line.textContent).toBe(`Tried ${i}`);
    expect(status.textContent).toBe(i < 8 ? 'Starting the bot…' : 'Tried 8');
  }
  if (outcome === 'done') finish({ rec: new Uint8Array(1), ticks: 1, shown: 1, sceneAt: 0, keys: 1, truncated: false, message: 'Finished.' });
  else if (outcome === 'error') fail(new Error('Worker failed.'));
  else button.fire('click');
  await Promise.resolve();
  expect(status.textContent).toBe(outcome === 'done' ? 'Made a demo: Finished.' : outcome === 'error' ? 'The bot failed: Worker failed.' : 'Stopped.');
  expect(line.textContent).toBe(status.textContent);
  doc.body.children[0].fire('cancel');
  await dialog;
});
