// Checkpoint choices follow changes to a block name even when the game files stay identical.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc } from '../../../test/fakeDom';
import { getCheckpoints, makeCheckpoint, withStamp } from '../../project/checkpoint';
import { emptyCompanion } from '../../project/companion';
import { GameFiles } from '../../project/files';
import { Project } from '../core/project';
import { checkpointPanel } from './checkpointPanel';

vi.mock('../../project/checkpoint', async (original) => ({
  ...(await original<typeof import('../../project/checkpoint')>()),
  getCheckpoints: vi.fn(),
  makeCheckpoint: vi.fn(),
}));

afterEach(() => vi.unstubAllGlobals());

it('enables Restore and saves a requested checkpoint after only a block name changes', async () => {
  const doc = new FakeDoc();
  vi.stubGlobal('document', doc);
  const create = vi.spyOn(doc, 'createElement');
  const companion = emptyCompanion();
  const names = { 1: 'Wall' };
  companion.files['room.bbl'] = { blockNames: names };
  const files = new GameFiles([['room.bbl', Uint8Array.of(1)]]);
  const project = new Project('game', 'Game', 'game.gam', files, companion);
  vi.spyOn(project, 'saveNow').mockResolvedValue();
  const list = withStamp([], { id: 'first', name: 'First', made: 1 }, files, companion);
  vi.mocked(getCheckpoints).mockResolvedValue(list);
  vi.mocked(makeCheckpoint).mockImplementation(async (_, name) => withStamp(list, { id: 'second', name, made: 2 }, files, companion));
  const panel = checkpointPanel(project, vi.fn(), vi.fn());
  await Promise.resolve();
  const elements = () => create.mock.results.map((r) => r.value);
  Object.assign(
    elements().find((el) => el.tag === 'input'),
    { checked: true },
  );
  names[1] = 'Door';
  panel.refresh();
  const restore = elements()
    .filter((el) => el.attrs['aria-label'] === 'Restore First')
    .pop()!;
  expect.soft(restore.hasAttribute('disabled')).toBe(false);
  await panel.ensure('Second');
  await panel.ensure('Duplicate');
  expect(makeCheckpoint).toHaveBeenCalledExactlyOnceWith(project.id, 'Second', files, companion, undefined);
});
