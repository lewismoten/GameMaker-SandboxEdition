// Read-only games keep preview choices local to the download dialog.
import { expect, it, vi } from 'vitest';
import { chooseDownload } from './download';
import { Workspace } from './workspace';

vi.mock('./released', () => ({ readOnlyBar: vi.fn() }));
vi.mock('./download', () => ({ chooseDownload: vi.fn() }));

it.each([true, false])('only offers preference persistence for editable projects (readOnly=%s)', async (readOnly) => {
  const setExportPreviews = vi.fn();
  const workspace = Object.assign(Object.create(Workspace.prototype) as Workspace, {
    project: { readOnly, game: () => ({ scenes: [] }), setExportPreviews },
  });
  await workspace['chooseDownload']();
  const [game] = vi.mocked(chooseDownload).mock.lastCall!;
  game.setPreviews?.(false);
  expect(setExportPreviews.mock.calls).toEqual(readOnly ? [] : [[false]]);
});
