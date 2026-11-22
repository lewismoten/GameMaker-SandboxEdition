// A damaged game picked on the home page must fail before a project is saved.
import { expect, it, vi } from 'vitest';
import { createZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { modal } from '../core/ui';
import { Project } from '../core/project';
import { importPicked } from './homeImport';

vi.mock('./homeCards', () => ({ playLink: vi.fn(), showNotice: vi.fn() }));
vi.mock('../core/ui', async (original) => ({ ...(await original<typeof import('../core/ui')>()), modal: vi.fn().mockResolvedValue(undefined) }));

it('names the damaged file in the import panel and leaves the project unsaved', async () => {
  const name = 'LEVEL.GAM';
  const zip = await createZip([{ name, data: new Uint8Array(32) }]);
  zip[30 + name.length] ^= 1;
  const file = new File([Uint8Array.from(zip)], 'disk.zip');
  const panel = { step: vi.fn(async () => {}), fail: vi.fn(), end: vi.fn(), signal: new AbortController().signal };
  const nav = { openProject: vi.fn() };
  const create = vi.spyOn(Project, 'fromFiles');
  const save = vi.spyOn(Project.prototype, 'saveNow');
  try {
    await importPicked(nav, [file], undefined, panel);
    expect(panel.fail).toHaveBeenCalledWith('The ZIP entry LEVEL.GAM is damaged (CRC-32 mismatch)');
    expect(create).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(nav.openProject).not.toHaveBeenCalled();
  } finally {
    save.mockRestore();
    create.mockRestore();
  }
});

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
