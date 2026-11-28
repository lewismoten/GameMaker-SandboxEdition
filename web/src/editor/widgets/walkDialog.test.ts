// Failures reading or playing a selected walkthrough stay in the file section of the dialog.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc } from '../../../test/fakeDom';
import { GameFiles } from '../../project/files';
import { watchWalkthrough } from '../../walkthrough/player';
import { Project } from '../core/project';
import { walkDialog } from './walkDialog';

vi.mock('./devLocalWalk', () => ({ localWalk: async () => undefined }));
vi.mock('../../walkthrough/player', () => ({ watchWalkthrough: vi.fn() }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it.each(['read', 'play'])('announces a %s failure beside the selected file', async (stage) => {
  const doc = new FakeDoc();
  vi.stubGlobal('document', doc);
  const project = Project.fromFiles(new GameFiles(), 'Walk', 'walk');
  const dialog = walkDialog(project);
  await vi.dynamicImportSettled();
  const modal = doc.body.children[0];
  const openSection = modal.children[1].children.find((section) => section.attrs['aria-labelledby'] === 'wd-open-h')!;
  const [, , toolbar, status] = openSection.children;
  const input = toolbar.children.find((el) => el.attrs.type === 'file')!;
  const text = vi.fn<() => Promise<string>>();
  const error = new Error(stage === 'read' ? 'File unavailable.' : 'Playback failed.');
  if (stage === 'read') text.mockRejectedValue(error);
  else {
    text.mockResolvedValue(JSON.stringify({ version: 1, game: 'game', segments: [], timeline: { frames: 10 } }));
    vi.mocked(watchWalkthrough).mockRejectedValue(error);
  }
  Object.assign(input, { files: [{ name: 'sample.json', text }] });
  (input as unknown as HTMLInputElement).onchange!(new Event('change'));
  await vi.dynamicImportSettled();
  expect(status.attrs.role).toBe('status');
  expect(status.textContent).toBe(`Could not open walkthrough “sample.json”. ${error.message}`);
  expect(watchWalkthrough).toHaveBeenCalledTimes(stage === 'play' ? 1 : 0);
  modal.fire('cancel');
  await dialog;
});
