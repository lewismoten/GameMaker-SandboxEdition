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

it.each(['HTML read', 'ZIP extraction', 'Opening'])('cancels during %s before saving or navigating', async (phase) => {
  const controller = new AbortController();
  const panel = {
    signal: controller.signal,
    step: vi.fn(async (step: string) => {
      if ((phase === 'ZIP extraction' && step === 'Extracting') || (phase === 'Opening' && step === 'Opening')) controller.abort();
    }),
    fail: vi.fn(),
    end: vi.fn(),
  };
  const nav = { openProject: vi.fn() };
  const zip = await createZip(['LEVEL.GAM', 'FIRST.TXT', 'SECOND.TXT'].map((name) => ({ name, data: new Uint8Array(32) })));
  const file = phase === 'HTML read' ? new File([''], 'game.html') : new File([Uint8Array.from(zip)], 'game.zip');
  if (phase === 'HTML read')
    vi.spyOn(file, 'text').mockImplementation(async () => {
      controller.abort();
      return '<script type="application/json" id="gm-game">{"v":1,"id":"game","title":"Game","gam":"LEVEL.GAM","enc":"raw","files":[["LEVEL.GAM",1]],"data":"AA=="}</script>';
    });
  const save = vi.spyOn(Project.prototype, 'saveNow');
  try {
    await importPicked(nav, [file], undefined, panel);
    expect(controller.signal.aborted).toBe(true);
    expect(save).not.toHaveBeenCalled();
    expect(nav.openProject).not.toHaveBeenCalled();
    expect(panel.fail).not.toHaveBeenCalled();
    if (phase === 'ZIP extraction') expect(panel.step.mock.calls.filter(([step]) => step === 'Extracting')).toHaveLength(1);
  } finally {
    save.mockRestore();
  }
});
