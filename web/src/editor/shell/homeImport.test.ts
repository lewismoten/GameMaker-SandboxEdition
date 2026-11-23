// Import failures on the home page explain what went wrong, and closing the panel mid-save frees the library.
import { expect, it, vi } from 'vitest';
import { createZip } from '@lewismoten/gamemaker-sandbox-archives/zip';
import { newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-engine/formats/game';
import { FakeDoc } from '../../../test/fakeDom';
import { importRunning, openImportPanel } from './importPanel';
import { modal, toast } from '../core/ui';
import { Project } from '../core/project';
import { importPicked } from './homeImport';
import * as library from '../../imported/alreadyHave';
import * as chooser from './importChooser';

vi.mock('./homeCards', () => ({ playLink: vi.fn(), showNotice: vi.fn() }));
vi.mock('../core/ui', async (original) => ({
  ...(await original<typeof import('../core/ui')>()),
  toast: vi.fn(),
  modal: vi.fn().mockResolvedValue(undefined),
}));

it('names the damaged file in the import panel and leaves the project unsaved', async () => {
  const name = 'LEVEL.GAM';
  const zip = await createZip([{ name, data: new Uint8Array(32) }]);
  zip[30 + name.length] ^= 1;
  const file = new File([Uint8Array.from(zip)], 'disk.zip');
  const panel = {
    confirmGame: vi.fn(),
    beginSave: vi.fn(),
    stayInLibrary: false,
    step: vi.fn(async () => {}),
    fail: vi.fn(),
    end: vi.fn(),
    signal: new AbortController().signal,
  };
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
  const panel = {
    confirmGame: vi.fn(),
    beginSave: vi.fn(),
    stayInLibrary: false,
    signal: new AbortController().signal,
    step: vi.fn(),
    fail: vi.fn(),
    end: vi.fn(),
  };
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
    confirmGame: vi.fn(),
    beginSave: vi.fn(),
    stayInLibrary: false,
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

it.each([
  ['disk.zip', null],
  ['disk.zip', undefined],
  ['LEVEL.MAP', null],
] as const)('shows a dismissible save error for %s when saving rejects with %s', async (name, reason) => {
  const { modal: realModal } = await vi.importActual<typeof import('../core/ui')>('../core/ui');
  vi.mocked(modal).mockImplementationOnce(realModal);
  const doc = new FakeDoc();
  vi.stubGlobal('document', doc);
  const save = vi.spyOn(Project.prototype, 'saveNow').mockRejectedValueOnce(reason);
  const nav = { openProject: vi.fn() };
  try {
    const zip = await createZip([{ name: 'LEVEL.GAM', data: new Uint8Array(32) }]);
    const data = name === 'disk.zip' ? zip : new Uint8Array(32);
    await importPicked(nav, [new File([Uint8Array.from(data)], name)]);
    expect(save).toHaveBeenCalledOnce();
    expect(nav.openProject).not.toHaveBeenCalled();
    const dialog = doc.body.children.find((el) => el.tag === 'dialog')!;
    expect(dialog.open).toBe(true);
    const work = dialog.children.find((el) => el.className === 'ic-work')!;
    expect(work.children.some((el) => el.className === 'ic-line' && el.textContent.includes('Something went wrong while saving the game.'))).toBe(true);
    const [ok] = work.children.find((el) => el.className === 'buttons')!.children;
    expect(ok.children[0].textContent).toBe('OK');
    ok.fire('click');
    expect(dialog.open).toBe(false);
    expect(importRunning()).toBe(false);
  } finally {
    save.mockRestore();
    vi.unstubAllGlobals();
  }
});

it.each([
  ['Escape', 'disk.zip', 0],
  ['Close', 'disk.zip', 0],
  ['Escape', 'LEVEL.MAP', 0],
  ['Close', 'LEVEL.MAP', 0],
  ['Escape', 'disk.zip', 1],
  ['Close', 'disk.zip', 1],
] as const)('frees the library at once and refreshes it when %s is pressed while saving %s (%i missing)', async (action, name, missing) => {
  const { modal: realModal } = await vi.importActual<typeof import('../core/ui')>('../core/ui');
  vi.mocked(modal).mockImplementationOnce(realModal);
  vi.mocked(toast).mockClear();
  const doc = new FakeDoc();
  vi.stubGlobal('document', doc);
  const panel = openImportPanel(name)!;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const save = vi.spyOn(Project.prototype, 'saveNow').mockImplementation(() => pending);
  const nav = { openProject: vi.fn() };
  try {
    const game = newGame('Partial');
    if (missing) game.scenes[0].files = ['GONE.MAP'];
    const data = name === 'disk.zip' ? await createZip([{ name: 'LEVEL.GAM', data: serializeGame(game) }]) : new Uint8Array(32);
    const refresh = vi.fn();
    const work = importPicked(nav, [new File([Uint8Array.from(data)], name)], refresh, panel);
    await vi.waitFor(() => expect(save).toHaveBeenCalledOnce());
    const dialog = doc.body.children.find((el) => el.tag === 'dialog')!;
    if (action === 'Escape') dialog.fire('cancel');
    else dialog.children[0].children[1].fire('click');
    // the library is usable again while the save is still pending, but no second import starts
    expect(dialog.open).toBe(false);
    expect(dialog.isConnected).toBe(false);
    expect(panel.signal.aborted).toBe(false);
    expect(importRunning()).toBe(true);
    expect(openImportPanel('second.zip')).toBeUndefined();
    expect(refresh).not.toHaveBeenCalled();
    release();
    await work;
    expect(nav.openProject).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledOnce();
    expect(importRunning()).toBe(false);
    const said = vi.mocked(toast).mock.calls;
    expect(said.some(([message]) => message.startsWith('Opened'))).toBe(false);
    const warned = said.filter(([message, kind]) => kind === 'error' && message.includes('1 file that weren’t in what you gave'));
    expect(warned).toHaveLength(missing);
  } finally {
    release();
    panel.end();
    vi.unstubAllGlobals();
  }
});

it('tells a save failure in a toast after the panel was closed while saving', async () => {
  const { modal: realModal } = await vi.importActual<typeof import('../core/ui')>('../core/ui');
  vi.mocked(modal).mockImplementationOnce(realModal);
  vi.mocked(toast).mockClear();
  const doc = new FakeDoc();
  vi.stubGlobal('document', doc);
  const panel = openImportPanel('disk.zip')!;
  let reject!: (e: Error) => void;
  const pending = new Promise<void>((_, no) => {
    reject = no;
  });
  const save = vi.spyOn(Project.prototype, 'saveNow').mockImplementation(() => pending);
  const nav = { openProject: vi.fn() };
  try {
    const data = await createZip([{ name: 'LEVEL.GAM', data: new Uint8Array(32) }]);
    const refresh = vi.fn();
    const work = importPicked(nav, [new File([Uint8Array.from(data)], 'disk.zip')], refresh, panel);
    await vi.waitFor(() => expect(save).toHaveBeenCalledOnce());
    const dialog = doc.body.children.find((el) => el.tag === 'dialog')!;
    dialog.fire('cancel');
    expect(dialog.open).toBe(false);
    reject(new Error('The disk is full.'));
    await work;
    expect(toast).toHaveBeenLastCalledWith('The import stopped. The disk is full.', 'error');
    expect(refresh).not.toHaveBeenCalled();
    expect(nav.openProject).not.toHaveBeenCalled();
    expect(importRunning()).toBe(false);
  } finally {
    save.mockRestore();
    panel.end();
    vi.unstubAllGlobals();
  }
});

it('lists a failed duplicate without counting it as a copy after saving the next game', async () => {
  const doc = new FakeDoc();
  vi.stubGlobal('document', doc);
  const { modal: realModal } = await vi.importActual<typeof import('../core/ui')>('../core/ui');
  const held = vi.spyOn(library, 'alreadyHave').mockReturnValueOnce('existing-project').mockReturnValue(undefined);
  const choose = vi.spyOn(chooser, 'chooseGames').mockImplementation(async (report) => report.games);
  const save = vi.spyOn(Project.prototype, 'saveNow').mockRejectedValueOnce(null).mockResolvedValueOnce(undefined);
  const panel = {
    signal: new AbortController().signal,
    step: vi.fn(),
    fail: vi.fn(),
    end: vi.fn(),
    confirmGame: vi.fn(),
    beginSave: vi.fn(),
    stayInLibrary: false,
  };
  try {
    const files = await Promise.all(
      ['A', 'B'].map(async (name, i) => {
        const zip = await createZip([{ name: name + '.GAM', data: new Uint8Array(32).fill(i) }]);
        return new File([Uint8Array.from(zip)], name + '.zip');
      }),
    );
    vi.mocked(modal)
      .mockImplementationOnce(realModal)
      .mockImplementationOnce((title, build) => {
        const result = realModal(title, build);
        doc.body.children.at(-1)!.fire('cancel');
        return result;
      });
    await importPicked({ openProject: vi.fn() }, files, undefined, panel);
    expect(panel.fail).not.toHaveBeenCalled();
    expect(save).toHaveBeenCalledTimes(2);
    const summary = doc.body.children.at(-1)!;
    expect(summary.children.find((el) => el.tag === 'p')?.children[0].textContent).toBe('Imported 1 of 2 games. They are listed under Imported.');
    const details = summary.children.find((el) => el.tag === 'details')!;
    expect(details.children[0].children[0].textContent).toBe('Not imported (1)');
    expect(details.children[1].children[0].children[0].textContent).toBe('a.gam (Something went wrong while saving the game.)');
  } finally {
    held.mockRestore();
    choose.mockRestore();
    save.mockRestore();
    vi.unstubAllGlobals();
  }
});

it('uses generic cancellation while reading a blank HTML file', async () => {
  const { modal: realModal } = await vi.importActual<typeof import('../core/ui')>('../core/ui');
  vi.mocked(modal).mockImplementationOnce(realModal);
  const doc = new FakeDoc();
  vi.stubGlobal('document', doc);
  const file = new File([''], 'blank.html');
  const nav = { openProject: vi.fn() };
  try {
    const read = vi.spyOn(file, 'text').mockImplementation(async () => {
      const dialog = doc.body.children.find((el) => el.tag === 'dialog')!;
      const work = dialog.children.find((el) => el.className === 'ic-work')!;
      work.children.find((el) => el.className === 'buttons')!.children[0].fire('click');
      return '';
    });
    await importPicked(nav, [file]);
    expect(read).toHaveBeenCalledOnce();
    expect(toast).toHaveBeenLastCalledWith('Canceled');
    expect(nav.openProject).not.toHaveBeenCalled();
  } finally {
    vi.unstubAllGlobals();
  }
});

it('stops reading loose files when Cancel is pressed during the first read', async () => {
  const { modal: realModal } = await vi.importActual<typeof import('../core/ui')>('../core/ui');
  vi.mocked(modal).mockImplementationOnce(realModal);
  const doc = new FakeDoc();
  vi.stubGlobal('document', doc);
  const first = new File(['a'], 'FIRST.MAP');
  const second = new File(['b'], 'SECOND.MAP');
  const nextRead = vi.spyOn(second, 'arrayBuffer');
  const firstRead = vi.spyOn(first, 'arrayBuffer').mockImplementation(async () => {
    const dialog = doc.body.children.find((el) => el.tag === 'dialog')!;
    const work = dialog.children.find((el) => el.className === 'ic-work')!;
    work.children.find((el) => el.className === 'buttons')!.children[0].fire('click');
    return new ArrayBuffer(1);
  });
  const nav = { openProject: vi.fn() };
  const save = vi.spyOn(Project.prototype, 'saveNow');
  try {
    await importPicked(nav, [first, second]);
    expect(firstRead).toHaveBeenCalledOnce();
    expect(nextRead).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
    expect(nav.openProject).not.toHaveBeenCalled();
  } finally {
    save.mockRestore();
    vi.unstubAllGlobals();
  }
});
