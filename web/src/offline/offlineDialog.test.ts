// A partial prepared copy can be removed even when another download cannot fit.
import { afterEach, expect, inject, it, onTestFinished, vi } from 'vitest';
import { launch } from '../../scripts/perfLib';
import { FakeDoc, type FakeEl } from '../../test/fakeDom';
import { openOfflineDialog } from './offlineDialog';
import { hasRoom, makeOffline, offlineStatus, removeOffline, type OfflineStatus } from './offlineCopy';
vi.mock('./replay', () => ({ inArchiveReplay: () => false }));
vi.mock('./offlineCopy', () => ({ offlineStatus: vi.fn(), removeOffline: vi.fn(), makeOffline: vi.fn(), hasRoom: vi.fn(() => false), sizeText: () => '1 KB' }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
function captureDialogElements() {
  const doc = new FakeDoc();
  const elements: FakeEl[] = [];
  const create = doc.createElement.bind(doc);
  doc.createElement = (tag) => {
    const el = create(tag);
    elements.push(el);
    return el;
  };
  vi.stubGlobal('document', doc);
  return elements;
}
async function openTestDialog() {
  const dialog = openOfflineDialog();
  const modal = (document as unknown as FakeDoc).body.children[0];
  onTestFinished(async () => {
    modal.fire('cancel');
    await dialog;
  });
  await Promise.resolve();
}
it.each(['unfinished', 'outdated'] as const)('offers Remove for a %s copy with ready=false and no room', async (copy) => {
  const elements = captureDialogElements();
  vi.mocked(offlineStatus).mockResolvedValue({
    supported: true,
    ready: false,
    copy,
    removable: true,
    tiers: ['core'],
    tierFiles: [],
    storedMissing: 10,
    wireMissing: 10,
  } as unknown as OfflineStatus);
  await openTestDialog();
  const remove = elements.find((el) => el.tag === 'button' && el.children.some((c) => c.textContent === 'Remove offline copies'))!;
  expect(elements.some((el) => el.children.includes(remove))).toBe(true);
  remove.fire('click');
  await Promise.resolve();
  expect(removeOffline).toHaveBeenCalledOnce();
});

it('renders saved choices while verification is pending without claiming readiness', async () => {
  const elements = captureDialogElements();
  let finish!: (status: OfflineStatus) => void;
  vi.mocked(offlineStatus).mockImplementation((_selection, onSelection) => {
    onSelection?.({
      supported: true,
      ready: false,
      copy: 'unfinished',
      removable: true,
      tiers: ['core', 'cd'],
      tierFiles: [],
      storedMissing: 10,
      wireMissing: 10,
    } as unknown as OfflineStatus);
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  await openTestDialog();
  const inputs = elements.filter((el) => el.tag === 'input');
  expect(inputs).toHaveLength(9);
  expect(inputs.every((el) => el.hasAttribute('disabled'))).toBe(true);
  expect(inputs.filter((el) => el.hasAttribute('checked'))).toHaveLength(2);
  expect(elements.some((el) => el.textContent === 'Checking saved files…')).toBe(true);
  expect(elements.some((el) => el.textContent.includes('Ready offline'))).toBe(false);
  expect(elements.some((el) => el.tag === 'button' && el.children.some((c) => c.textContent === 'Close'))).toBe(true);
  finish({ supported: true, ready: true, tiers: ['core', 'cd'], tierFiles: [], storedMissing: 0, wireMissing: 0 } as unknown as OfflineStatus);
  await Promise.resolve();
  const verifiedInputs = elements.filter((el) => el.tag === 'input').slice(9);
  expect(verifiedInputs).toHaveLength(9);
  expect(verifiedInputs.filter((el) => el.hasAttribute('disabled'))).toHaveLength(1);
  expect(elements.some((el) => el.textContent.includes('Ready offline'))).toBe(true);
});

it('samples verified counts during a long download and announces the terminal outcome immediately', async () => {
  const elements = captureDialogElements();
  let now = 0;
  vi.stubGlobal('performance', { now: () => now });
  vi.mocked(hasRoom).mockReturnValueOnce(true);
  vi.mocked(offlineStatus).mockResolvedValue({
    supported: true,
    ready: false,
    tiers: ['core'],
    tierFiles: [],
    storedMissing: 10,
    wireMissing: 10,
  } as unknown as OfflineStatus);
  vi.mocked(makeOffline).mockImplementation(async (_selection, progress) => {
    for (let done = 1; done <= 42; done++) {
      now += 250;
      progress({ done, total: 50, bytes: done, totalBytes: 50 });
    }
    return { ok: false, reason: 'canceled', message: 'Download canceled.' };
  });
  await openTestDialog();
  const status = elements.find((el) => el.attrs.role === 'status')!;
  const writes: string[] = [];
  Object.defineProperty(status, 'textContent', { get: () => writes.at(-1), set: (text: string) => writes.push(text) });
  elements.find((el) => el.tag === 'button' && el.children.some((c) => c.textContent.startsWith('Download ')))!.fire('click');
  expect(elements.some((el) => el.textContent?.startsWith('42 of 50 files verified'))).toBe(true);
  await vi.waitFor(() => expect(writes).toContain('Download canceled.'));
  expect(writes).toEqual(['Preparing the offline copy…', '20 of 50 files verified', '40 of 50 files verified', 'Download canceled.']);
});

it.each(['unavailable', 'rejected'])('shows Stopped before the inventory refresh and keeps it when the refresh is %s', async (failure) => {
  const elements = captureDialogElements();
  const sizes = [1, 1, 1, 1, 996];
  const selection = {
    supported: true,
    ready: false,
    tiers: ['core'],
    tierFiles: [],
    wireTotal: 1000,
    storedMissing: 1000,
    wireMissing: 1000,
  } as unknown as OfflineStatus;
  let refresh!: () => void;
  vi.mocked(offlineStatus)
    .mockResolvedValueOnce(selection)
    .mockImplementationOnce(
      () =>
        new Promise((resolve, reject) => {
          refresh = () =>
            failure === 'unavailable'
              ? resolve({ ...selection, supported: false, reason: 'Offline copies are made on the published site.' })
              : reject(new Error('Could not read inventory.'));
        }),
    );
  vi.mocked(hasRoom).mockReturnValueOnce(true);
  const message = 'Stopped. Any previous complete offline copy is still kept. Try again to resume the verified files.';
  vi.mocked(makeOffline).mockImplementation(
    (_selection, progress, signal) =>
      new Promise((resolve) => {
        const verified = sizes.slice(0, 4);
        progress({ done: verified.length, total: sizes.length, bytes: verified.reduce((a, b) => a + b), totalBytes: 1000 });
        signal.addEventListener('abort', () => resolve({ ok: false, reason: 'canceled', message }));
      }),
  );
  await openTestDialog();
  const status = elements.find((el) => el.attrs.role === 'status')!;
  elements.find((el) => el.tag === 'button' && el.children.some((c) => c.textContent.startsWith('Download ')))!.fire('click');
  const bar = elements.find((el) => el.tag === 'progress')!;
  const content = elements.find((el) => el.children.includes(bar))!;
  expect(bar.attrs['aria-label']).toBe('Verified bytes');
  expect([Number(bar.attrs.max), (bar as unknown as HTMLProgressElement).value]).toEqual([1000, 4]);
  expect(content.children[1].textContent).toContain('4 of 5 files verified');
  const cancel = content.children.find((el) => el.children.some((c) => c.textContent === 'Cancel'))!;
  cancel.fire('click');
  await Promise.resolve();
  expect(refresh).toBeTypeOf('function');
  expect(status.textContent).toBe(message);
  expect(status.className).toBe('');
  expect(content.children).not.toContain(bar);
  expect(content.children).not.toContain(cancel);
  refresh();
  await vi.dynamicImportSettled();
  expect(status.textContent).toBe(message);
});

it('stops a queued download while another tab still holds the offline lock', async () => {
  const browser = await launch();
  try {
    const context = await browser.newContext();
    const base = inject('appBase') + '/';
    const key = 'gm-offline:' + base;
    await context.route('**/lock-test', (route) => route.fulfill({ contentType: 'text/html', body: '<body></body>' }));
    const owner = await context.newPage();
    await owner.goto(base + 'lock-test');
    await owner.evaluate((key) => {
      void navigator.locks.request(key, () => new Promise<void>(() => {}));
    }, key);
    await expect.poll(() => owner.evaluate(async () => (await navigator.locks.query()).held?.map((l) => l.name))).toContain(key);
    const page = await context.newPage();
    const files = [{ path: 'file.txt', tier: 'core', sha256: '0'.repeat(64), wire: 1, stored: 1 }];
    await page.route('**/offline.json', (route) => route.fulfill({ json: { files, shell: [], version: 'one' } }));
    const fileRequest = vi.fn();
    page.on('request', (request) => {
      if (request.url() === base + 'file.txt') fileRequest();
    });
    await page.goto(base + 'lock-test');
    await page.addScriptTag({ type: 'module', content: "import { openOfflineDialog } from '/src/offline/offlineDialog.ts'; void openOfflineDialog();" });
    await page.getByRole('button', { name: /^Download / }).click();
    const pending = () => page.evaluate(async () => (await navigator.locks.query()).pending?.map((l) => l.name));
    await expect.poll(pending).toContain(key);
    await page.getByRole('button', { name: 'Cancel' }).press('Enter');
    await page
      .getByRole('status')
      .filter({ hasText: /Stopped.*resume/ })
      .waitFor();
    expect(await pending()).not.toContain(key);
    expect(await owner.evaluate(async () => (await navigator.locks.query()).held?.map((l) => l.name))).toContain(key);
    expect(fileRequest).not.toHaveBeenCalled();
  } finally {
    await browser.close();
  }
}, 30000);
