// Workspace imports preserve a dirty project until the author accepts the whole batch.
import { afterEach, expect, it, vi } from 'vitest';
import { FakeDoc } from '../../../test/fakeDom';
import { emptyCompanion, serializeCompanion } from '../../project/companion';
import { GameFiles } from '../../project/files';
import { Project } from '../core/project';
import { importWorkspaceFiles } from './importWorkspaceFiles';

vi.mock('../../achievements', () => ({ editedFile: vi.fn() }));
vi.mock('../../project/storage', () => ({ saveProject: vi.fn() }));

function fixture() {
  vi.useFakeTimers();
  const doc = new FakeDoc();
  vi.stubGlobal('document', doc);
  const project = new Project('id', 'Test', 'game.gam', new GameFiles([['a.map', Uint8Array.of(1)]]));
  const files = new GameFiles([
    ['a.map', Uint8Array.of(2)],
    ['b.map', Uint8Array.of(3)],
  ]);
  return { doc, project, files };
}

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it.each(['Cancel', 'Import'])('offers %s before changing any project file', async (choice) => {
  const { doc, project, files } = fixture();
  project.files.set('a.map', Uint8Array.of(4));
  project.setExtras('a.map', 'wrap', false);
  files.set('game.gmx', serializeCompanion({ ...emptyCompanion(), files: { 'a.map': { wrap: true } } }));
  const result = importWorkspaceFiles(project, files);
  const dialog = doc.body.children.find((el) => el.tag === 'dialog' && el.open)!;
  expect(dialog.children[1].children[0].textContent).toBe('Importing will replace your current unsaved changes.');
  expect(project.files.has('b.map')).toBe(false);
  dialog.children[2].children.find((button) => button.children[0].textContent === choice)!.fire('click');
  expect(await result).toBe(choice === 'Import');
  expect(project.files.get('a.map')).toEqual(Uint8Array.of(choice === 'Import' ? 2 : 4));
  expect(project.files.has('b.map')).toBe(choice === 'Import');
  expect(project.extras('a.map', 'wrap', false)).toBe(choice === 'Import');
});

it('imports immediately after edits have been saved', async () => {
  const { doc, project, files } = fixture();
  project.files.set('a.map', Uint8Array.of(4));
  await project.saveNow();
  expect(await importWorkspaceFiles(project, files)).toBe(true);
  expect(doc.body.children).toHaveLength(0);
  expect(project.files.get('a.map')).toEqual(Uint8Array.of(2));
});
