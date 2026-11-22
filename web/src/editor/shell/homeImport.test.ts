// Empty ZIP uploads finish in the editor's notice dialog before a project is made.
import { expect, it, vi } from 'vitest';
import { createZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { modal } from '../core/ui';
import { Project } from '../core/project';
import { importPicked } from './homeImport';

vi.mock('./homeCards', () => ({ playLink: vi.fn(), showNotice: vi.fn() }));
vi.mock('../core/ui', async (original) => ({ ...(await original<typeof import('../core/ui')>()), modal: vi.fn().mockResolvedValue(undefined) }));

it('explains an empty ZIP upload without creating a project', async () => {
  const create = vi.spyOn(Project, 'fromFiles');
  const openProject = vi.fn();
  const panel = { signal: new AbortController().signal, step: vi.fn(), fail: vi.fn(), end: vi.fn() };
  const file = new File([Uint8Array.from(await createZip([]))], 'empty.zip');
  await importPicked({ openProject }, [file], undefined, panel);
  expect(modal).toHaveBeenCalledWith('This archive is empty', expect.any(Function));
  expect(panel.fail).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
  expect(openProject).not.toHaveBeenCalled();
});
