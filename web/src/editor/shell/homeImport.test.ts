// A damaged game picked on the home page must fail before a project is saved.
import { expect, it, vi } from 'vitest';
import { createZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { Project } from '../core/project';
import { importPicked } from './homeImport';

vi.mock('./homeCards', () => ({}));

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
