// Browser regressions against actual Vite modules; controlled workers/storage, not reader speech.
// Start your own Vite server, then: node web/test/announcements.mjs http://127.0.0.1:5318
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright-core';
import WebSocket from 'ws';

const base = process.argv[2];
if (!base) throw new Error('Pass the URL of your own Vite server.');
let browser;
let page;
before(async () => {
  // This dev server deliberately retains old modules until its Reload handshake. Apply only on our supplied server.
  await new Promise((resolve, reject) => {
    const ws = new WebSocket(base.replace(/^http/, 'ws'), 'vite-hmr');
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('Vite update handshake timed out'));
    }, 5000);
    ws.on('open', () => ws.send(JSON.stringify({ type: 'custom', event: 'gm:apply-updates' })));
    ws.on('error', reject);
    ws.on('message', (data) => {
      if (JSON.parse(data.toString()).event === 'gm:updates-applied') {
        clearTimeout(timer);
        ws.close();
        resolve();
      }
    });
  });
  browser = await chromium.launch({ headless: true });
});
after(async () => {
  await browser?.close();
});
async function reset() {
  await page?.close();
  page = await browser.newPage();
  await page.route('**/announcement-test.html', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><title>Announcement regression</title><body></body></html>' }),
  );
  await page.goto(`${base}/announcement-test.html`);
}
async function accessibleText() {
  const cdp = await page.context().newCDPSession(page);
  try {
    return (await cdp.send('Accessibility.getFullAXTree')).nodes
      .filter((n) => !n.ignored)
      .map((n) => n.name?.value)
      .join('\n');
  } finally {
    await cdp.detach();
  }
}

test('shared errors stay in the top modal; bursts coalesce but later retries survive', async () => {
  await reset();
  await page.evaluate(async () => {
    const ui = await import('/src/editor/core/ui.ts');
    window.ui = ui;
    void ui.modal('Outer', () => ui.h('p', null, 'Outer body'));
    void ui.modal('Inner', () => ui.h('p', null, 'Inner body'));
    for (let i = 0; i < 5; i++) ui.toast('Choose a background block set first.', 'error');
  });
  await page.waitForTimeout(50);
  assert.match(await accessibleText(), /Choose a background block set first/);
  assert.equal(await page.locator('dialog').last().locator('.toast').count(), 1);
  assert.equal(await page.locator('.toast-close[role=status], [role=status] .toast-close').count(), 0);
  await page.waitForTimeout(1100);
  await page.evaluate(() => ui.toast('Choose a background block set first.', 'error'));
  assert.equal(await page.locator('dialog').last().locator('.toast').count(), 2);
  await page.getByRole('button', { name: 'Close', exact: true }).last().click();
  await page.evaluate(() => ui.toast('Outer retry', 'error'));
  await page.waitForFunction(() => document.querySelector('[role=status]')?.textContent === 'Outer retry');
  assert.match(await accessibleText(), /Outer retry/);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.evaluate(() => ui.toast('Page result'));
  await page.waitForFunction(() => document.querySelector('[role=status]')?.textContent === 'Page result');
  assert.match(await accessibleText(), /Page result/);
});
test('pending downloads remain visible beyond 30 seconds and settle on failure/success', async () => {
  await reset();
  await page.clock.install();
  await page.evaluate(async () => {
    const { chooseDownload } = await import('/src/editor/shell/download.ts');
    window.dp = chooseDownload({
      title: 'Fixture',
      gam: 'fixture.gam',
      project: true,
      files: () =>
        new Promise((resolve, reject) => {
          window.fileResolve = resolve;
          window.fileReject = reject;
        }),
    });
  });
  await page.locator('#dl-files').check();
  await page.getByRole('button', { name: 'Download .zip', exact: true }).click();
  await page.clock.fastForward(31000);
  assert.match(
    await page
      .locator('.toast')
      .allTextContents()
      .then((a) => a.join(' ')),
    /Building/,
  );
  await page.evaluate(async () => {
    fileReject(new Error('Controlled download refusal'));
    await dp;
  });
  await page.clock.runFor(20);
  assert.doesNotMatch(
    await page
      .locator('.toast')
      .allTextContents()
      .then((a) => a.join(' ')),
    /Building/,
  );
  assert.match(await accessibleText(), /Controlled download refusal/);
  await page.evaluate(async () => {
    const { Project } = await import('/src/editor/core/project.ts');
    const project = Project.create('Download fixture');
    const { chooseDownload } = await import('/src/editor/shell/download.ts');
    void chooseDownload({ title: 'Fixture', gam: project.gam, project: true, files: async () => project.files });
  });
  await page.locator('#dl-files').check();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .zip', exact: true }).click();
  assert.match((await downloaded).suggestedFilename(), /\.zip$/);
  await page.clock.runFor(20);
  assert.match(await accessibleText(), /Saved.*\.zip/);
  assert.doesNotMatch(
    await page
      .locator('.toast')
      .allTextContents()
      .then((a) => a.join(' ')),
    /Building/,
  );
});
test('autosave failures outrank debounce, recovery is explicit, and Ctrl+S has one voice', async () => {
  await reset();
  const result = await page.evaluate(async () => {
    const { saveNote } = await import('/src/editor/shell/saveNote.ts');
    let listen;
    let failExplicit = false;
    const project = {
      onSaveState(fn) {
        listen = fn;
        return () => {};
      },
      async saveNow() {
        if (failExplicit) {
          listen('failed', new Error('Quota'));
          throw new Error('Quota');
        }
        listen('saved');
      },
    };
    const note = saveNote(project);
    document.body.append(note.el);
    const region = document.querySelector('p.sr-only[role=status]');
    const messages = [];
    const observer = new MutationObserver(() => messages.push(region.textContent));
    observer.observe(region, { childList: true });
    const tick = () => new Promise((r) => setTimeout(r, 10));
    listen('failed', new Error('Quota'));
    await tick();
    for (let i = 0; i < 5; i++) {
      listen('failed', new Error('Quota'));
      await tick();
    }
    const failures = [...messages];
    listen('saved');
    await tick();
    const recovery = [...messages];
    messages.length = 0;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
    await new Promise((r) => setTimeout(r, 1700));
    const shortcut = [...messages];
    messages.length = 0;
    failExplicit = true;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));
    await new Promise((r) => setTimeout(r, 1700));
    const explicitFailure = [...messages];
    const toasts = document.querySelectorAll('.toast').length;
    listen('saved');
    note.dispose();
    await new Promise((r) => setTimeout(r, 1700));
    observer.disconnect();
    return { failures, recovery, shortcut, explicitFailure, toasts, disposed: region.isConnected };
  });
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0], /Not saved.*Quota.*Download a \.zip/);
  assert.match(result.recovery.at(-1), /Saved.*again|Saved.*after/i);
  assert.equal(result.shortcut.length, 1);
  assert.match(result.shortcut[0], /Saved in this browser/);
  assert.equal(result.explicitFailure.length, 1);
  assert.match(result.explicitFailure[0], /Not saved.*Quota.*Download/);
  assert.equal(result.toasts, 0);
  assert.equal(result.disposed, false);
});
test('import failure has one durable channel and ignores late progress', async () => {
  await reset();
  const result = await page.evaluate(async () => {
    const { openImportPanel } = await import('/src/editor/shell/importPanel.ts');
    const panel = openImportPanel('fixture.zip');
    await panel.step('Unpacking', 'asset', 10, 20);
    panel.fail('Archive is damaged');
    await panel.step('Opening', 'late progress');
    const status = document.querySelector('.ic-status');
    return { text: status.textContent, alerts: document.querySelectorAll('[role=alert]').length };
  });
  assert.match(result.text, /import stopped.*Archive is damaged/);
  assert.equal(result.alerts, 0);
});
test('walkthrough progress stays visual but speech is bounded and failures persist', async () => {
  await reset();
  await page.evaluate(async () => {
    const { Project } = await import('/src/editor/core/project.ts');
    window.project = Project.create('Walk fixture');
    window.Worker = class {
      constructor() {
        window.worker = this;
      }
      postMessage() {}
      terminate() {}
    };
    const { walkDialog } = await import('/src/editor/widgets/walkDialog.ts');
    void walkDialog(project);
  });
  await page.getByRole('button', { name: '🤖 Make it', exact: true }).click();
  const result = await page.evaluate(async () => {
    const region = [...document.querySelectorAll('.wd [role=status]')].at(-1);
    const messages = [];
    const observer = new MutationObserver(() => messages.push(region.textContent));
    observer.observe(region, { childList: true });
    for (let i = 0; i < 8; i++) {
      worker.onmessage({ data: { kind: 'progress', what: `Scene 1: search, ${i} places tried` } });
      await new Promise((r) => setTimeout(r, 10));
    }
    const visual = document.querySelector('.wd-progress')?.textContent;
    const progress = [...messages];
    worker.onmessage({ data: { kind: 'error', message: 'Controlled bot failure' } });
    await new Promise((r) => setTimeout(r, 10));
    observer.disconnect();
    return { progress, visual, final: region.textContent, toasts: document.querySelectorAll('.toast').length };
  });
  assert.ok(result.progress.length <= 1);
  assert.match(result.visual, /7 places tried/);
  assert.match(result.final, /walkthrough bot failed.*Controlled bot failure/);
  assert.equal(result.toasts, 0);
  await page.getByRole('button', { name: '🤖 Make it', exact: true }).click();
  await page.getByRole('button', { name: '■ Stop', exact: true }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('.wd [role=status]')].at(-1).textContent.startsWith('Stopped'));
});
test('level checks retain failed/stopped outcomes with or without previous results and reset on success', async () => {
  await reset();
  const results = await page.evaluate(async () => {
    const { Project } = await import('/src/editor/core/project.ts');
    const { checkPanel } = await import('/src/editor/editors/map/check/checkPanel.ts');
    window.Worker = class {
      constructor() {
        window.worker = this;
      }
      postMessage() {}
      terminate() {}
    };
    const results = [];
    const tick = () => new Promise((r) => setTimeout(r, 10));
    for (const previous of [false, true]) {
      const project = Project.create('Check fixture');
      if (previous)
        project.setExtras('audit.map', 'levelCheck', {
          when: '2026-11-05T12:00:00Z',
          budget: 15,
          heat: '0'.repeat(10000),
          soon: '0'.repeat(10000),
          stuck: [],
          deaths: [],
          findings: [],
          places: 3,
          complete: true,
          ms: 100,
        });
      const panel = checkPanel({ project, file: 'audit.map', scene: undefined, overlay: {}, redraw() {}, goTo() {}, reload() {}, selection() {}, paint() {} });
      document.body.append(panel.el);
      panel.toggle(true);
      const button = panel.el.querySelector('button.primary');
      const status = panel.el.querySelector('[role=status]');
      button.click();
      worker.onmessage({ data: { kind: 'error', message: 'Controlled check failure' } });
      await tick();
      const failed = status.textContent;
      button.click();
      button.click();
      await tick();
      const stopped = status.textContent;
      button.click();
      worker.onmessage({ data: { kind: 'done', report: { runs: [], findings: [], ms: 50 } } });
      await tick();
      results.push({ previous, failed, stopped, success: status.textContent });
      panel.el.remove();
    }
    return results;
  });
  for (const result of results) {
    assert.match(result.failed, /level check failed.*Controlled check failure/);
    assert.match(result.stopped, /^Stopped/);
    if (result.previous) {
      assert.match(result.failed, /previous result/);
      assert.match(result.stopped, /previous result/);
    }
    assert.match(result.success, /^Checked/);
  }
});
