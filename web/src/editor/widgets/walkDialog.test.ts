// Failures reading or playing a selected walkthrough stay in the file section of the dialog.
import { afterEach, expect, inject, it, vi } from 'vitest';
import type { Page } from 'playwright-core';
import { launch } from '../../../scripts/perfLib';
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

async function filePicker() {
  const doc = new FakeDoc();
  vi.stubGlobal('document', doc);
  const project = Project.fromFiles(new GameFiles(), 'Walk', 'walk');
  const dialog = walkDialog(project);
  await vi.dynamicImportSettled();
  const modal = doc.body.children[0];
  const openSection = modal.children[1].children.find((section) => section.attrs['aria-labelledby'] === 'wd-open-h')!;
  const [, , toolbar, status] = openSection.children;
  const input = toolbar.children.find((el) => el.attrs.type === 'file')!;
  function select(name: string, text: () => Promise<string>) {
    Object.assign(input, { files: [{ name, text }] });
    (input as unknown as HTMLInputElement).onchange!(new Event('change'));
  }
  return { doc, dialog, modal, status, select };
}

const valid = { version: 1, game: 'game', segments: [], rand: { seed: 1, per: 'scene' }, chapters: [], timeline: { fps: 60, frames: 10, chapters: [] } };

it.each(['read', 'play'])('announces a %s failure beside the selected file', async (stage) => {
  const { dialog, modal, status, select } = await filePicker();
  const text = vi.fn<() => Promise<string>>();
  const error = new Error(stage === 'read' ? 'File unavailable.' : 'Playback failed.');
  if (stage === 'read') text.mockRejectedValue(error);
  else {
    text.mockResolvedValue(JSON.stringify(valid));
    vi.mocked(watchWalkthrough).mockRejectedValue(error);
  }
  select('sample.json', text);
  await vi.dynamicImportSettled();
  expect(status.attrs.role).toBe('status');
  expect(status.textContent).toBe(`Could not open walkthrough “sample.json”. ${error.message}`);
  expect(watchWalkthrough).toHaveBeenCalledTimes(stage === 'play' ? 1 : 0);
  modal.fire('cancel');
  await dialog;
});

it('keeps the newer format error when the older file read rejects', async () => {
  const { select, status, modal, dialog } = await filePicker();
  let reject!: (e: Error) => void;
  select('slow-old.json', () => new Promise((_resolve, fail) => (reject = fail)));
  select('new.json', async () => '{}');
  await vi.dynamicImportSettled();
  const message = 'That file is not a walkthrough (no segments or timeline).';
  expect(status.textContent).toBe(message);
  reject(new DOMException('Read failed', 'NotReadableError'));
  await vi.dynamicImportSettled();
  expect(status.textContent).toBe(message);
  expect(watchWalkthrough).not.toHaveBeenCalled();
  modal.fire('cancel');
  await dialog;
});

it('ignores a valid read that finishes after Escape closes the dialog', async () => {
  const { select, modal, doc, dialog, status } = await filePicker();
  let finish!: (text: string) => void;
  select('slow.json', () => new Promise((resolve) => (finish = resolve)));
  modal.fire('cancel');
  await dialog;
  expect(doc.body.children.filter((el) => el.open)).toHaveLength(0);
  finish(JSON.stringify(valid));
  await vi.dynamicImportSettled();
  expect(status.textContent).toBe('');
  expect(watchWalkthrough).not.toHaveBeenCalled();
});

// Load the production dialog and player modules into Chromium with a fresh project.
async function openBrowserPicker(page: Page) {
  await page.route('**/walk-test', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><html data-theme="auto"><meta name="viewport" content="width=device-width,initial-scale=1"><body></body>',
    }),
  );
  await page.goto(inject('appBase') + '/walk-test');
  await page.addScriptTag({
    type: 'module',
    content: `
    import '/src/editor/shell/editor.css';
    import '/src/editor/shell/dialogsPhone.css';
    import { walkDialog } from '/src/editor/widgets/walkDialog.ts';
    import { Project } from '/src/editor/core/project.ts';
    import { GameFiles } from '/src/project/files.ts';
    void walkDialog(Project.fromFiles(new GameFiles(), 'Review', 'review'));
  `,
  });
  const dialog = page.getByRole('dialog', { name: 'Make a walkthrough' });
  await dialog.waitFor();
  return { dialog, input: dialog.locator('input[type=file]'), status: dialog.locator('section[aria-labelledby="wd-open-h"]').getByRole('status') };
}

it('explains missing timeline chapters in the real player flow', async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    const { input, status } = await openBrowserPicker(page);
    const fixture = { version: 1, game: 'game', segments: [], timeline: { frames: 10 } };
    await input.setInputFiles({ name: 'sample.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture)) });
    await status.filter({ hasText: 'This walkthrough file is missing its timeline chapters.' }).waitFor();
    expect(await page.getByRole('dialog').count()).toBe(1);
    await input.setInputFiles({ name: 'valid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(valid)) });
    await page.getByRole('dialog', { name: 'Review: walkthrough' }).waitFor();
  } finally {
    await browser.close();
  }
}, 30000);

it.each([320, 390])(
  'wraps an unreadable filename inside the dialog at %i px',
  async (width) => {
    const browser = await launch();
    try {
      const page = await browser.newPage({ viewport: { width, height: 812 }, isMobile: true, hasTouch: true });
      const { dialog, input, status } = await openBrowserPicker(page);
      const name = 'w'.repeat(205) + '.json';
      await input.evaluate(async (node: HTMLInputElement, name) => {
        const directory = await navigator.storage.getDirectory();
        const handle = await directory.getFileHandle(name, { create: true });
        const writer = await handle.createWritable();
        await writer.write('{}');
        await writer.close();
        const selection = new DataTransfer();
        selection.items.add(await handle.getFile());
        await directory.removeEntry(name);
        node.files = selection.files;
        node.dispatchEvent(new Event('change'));
      }, name);
      await status.filter({ hasText: `Could not open walkthrough “${name}”.` }).waitFor();
      for (const colorScheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme });
        expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(colorScheme);
        expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
        const bounds = (await status.boundingBox())!;
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      }
    } finally {
      await browser.close();
    }
  },
  30000,
);
