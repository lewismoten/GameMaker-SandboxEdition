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
  // A fresh user attempt may need the identical error even within the burst window.
  await page.evaluate(() => window.ui.toast('Choose a background block set first.', 'error', { repeat: true }));
  assert.equal(await page.locator('dialog').last().locator('.toast').count(), 2);
  await page.waitForTimeout(1100);
  await page.evaluate(() => window.ui.toast('Choose a background block set first.', 'error'));
  assert.equal(await page.locator('dialog').last().locator('.toast').count(), 3);
  await page.getByRole('button', { name: 'Close', exact: true }).last().click();
  await page.evaluate(() => window.ui.toast('Outer retry', 'error'));
  await page.waitForFunction(() => document.querySelector('[role=status]')?.textContent === 'Outer retry');
  assert.match(await accessibleText(), /Outer retry/);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.evaluate(() => window.ui.toast('Page result'));
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
    window.fileReject(new Error('Controlled download refusal'));
    await window.dp;
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
    void walkDialog(window.project);
  });
  await page.getByRole('button', { name: '🤖 Make it', exact: true }).click();
  const result = await page.evaluate(async () => {
    const region = [...document.querySelectorAll('.wd [role=status]')].at(-1);
    const messages = [];
    const observer = new MutationObserver(() => messages.push(region.textContent));
    observer.observe(region, { childList: true });
    for (let i = 0; i < 8; i++) {
      window.worker.onmessage({ data: { kind: 'progress', what: `Scene 1: search, ${i} places tried` } });
      await new Promise((r) => setTimeout(r, 10));
    }
    const visual = document.querySelector('.wd-progress')?.textContent;
    const progress = [...messages];
    window.worker.onmessage({ data: { kind: 'error', message: 'Controlled bot failure' } });
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
      window.worker.onmessage({ data: { kind: 'error', message: 'Controlled check failure' } });
      await tick();
      const failed = status.textContent;
      button.click();
      button.click();
      await tick();
      const stopped = status.textContent;
      button.click();
      window.worker.onmessage({ data: { kind: 'done', report: { runs: [], findings: [], ms: 50 } } });
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
test('offline failure, cancel and success use the same attached live region', async () => {
  for (const outcome of ['failure', 'cancel', 'success', 'cache-error']) {
    await reset();
    await page.route('**/offline.json', (r) => r.fulfill({ json: { version: 'fixture', shell: [], files: [['fixture-payload.bin', 20, 20]] } }));
    await page.route('**/games/catalog.json', (r) => r.fulfill({ json: [] }));
    await page.route('**/fixture-payload.bin', async (r) => {
      if (outcome === 'cancel') await new Promise((resolve) => setTimeout(resolve, 200));
      await r.fulfill({ status: outcome === 'failure' ? 503 : 200, body: 'Controlled fixture payload' }).catch(() => {});
    });
    await page.evaluate(async () => {
      await caches.delete('gm-site');
      localStorage.removeItem('gm-offline');
      const { openOfflineDialog } = await import('/src/offline/offlineDialog.ts');
      void openOfflineDialog();
    });
    await page.getByRole('button', { name: /^Download / }).waitFor();
    await page.evaluate(() => {
      window.originalStatus = document.querySelector('.offline-status');
      window.detaches = 0;
      new MutationObserver((ms) => {
        for (const m of ms) if ([...m.removedNodes].includes(window.originalStatus)) window.detaches++;
      }).observe(window.originalStatus.parentElement, { childList: true });
    });
    if (outcome === 'cache-error')
      await page.evaluate(() => {
        caches.open = async () => {
          throw new Error('Controlled cache failure');
        };
      });
    await page.getByRole('button', { name: /^Download / }).click();
    if (outcome === 'cancel') await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    const expected =
      outcome === 'success' ? /Ready offline/ : outcome === 'cancel' ? /Stopped/ : outcome === 'cache-error' ? /Controlled cache failure/ : /download failed/;
    await page.waitForFunction((pattern) => new RegExp(pattern).test(document.querySelector('.offline-status')?.textContent), expected.source, {
      timeout: 5000,
    });
    assert.equal(await page.evaluate(() => window.detaches), 0);
    assert.match(await accessibleText(), expected);
  }
});
test('transcripts are browsable documents, not a live payload; loading errors can retry', async () => {
  await reset();
  let attempt = 0;
  await page.route('**/0riemzdF8gc.transcript.json', async (r) => {
    if (++attempt === 1) await r.fulfill({ status: 503, body: 'Controlled failure' });
    else await r.continue();
  });
  await page.evaluate(async () => {
    const { openVideo } = await import('/src/library/videoDialog.ts');
    void openVideo('0riemzdF8gc', 'Fixture video');
  });
  await page.getByText('Transcript', { exact: true }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('[role=status]')].some((e) => e.textContent.includes('could not be loaded')));
  await page.getByText('Transcript', { exact: true }).click();
  await page.getByText('Transcript', { exact: true }).click();
  await page.locator('.lib-video-transcript p').first().waitFor();
  const result = await page
    .locator('.lib-video-transcript')
    .evaluate((el) => ({ paragraphs: el.children.length, live: !!el.closest('[role=status], [aria-live=polite], [aria-live=assertive]') }));
  assert.ok(result.paragraphs > 1);
  assert.equal(result.live, false);
  assert.match(await page.locator('.lib-video-transcript-status').textContent(), /Transcript loaded/);
});
test('Saves & scores announces a consumed read failure in its local footer', async () => {
  await reset();
  await page.evaluate(async () => {
    const { openSaves } = await import('/src/saves/savesPanel.ts');
    void openSaves({
      title: 'Fixture',
      saveId: 'fixture',
      gam: 'fixture.gam',
      files: async () => ({
        get() {
          throw new Error('Controlled saved-data refusal');
        },
      }),
    });
  });
  await page.waitForFunction(() => document.querySelector('.sv-main')?.textContent.includes('Could not read the saves'));
  assert.match(await page.locator('.sv-say').textContent(), /Could not read the saves.*Controlled saved-data refusal/);
  assert.match(await accessibleText(), /Could not read the saves/);
});
test('MP4 progress keeps visual updates quiet and always announces completion/error/cancel', async () => {
  await reset();
  // Only the encoder is controlled; use the actual player UI/runtime and a private new project.
  await page.route('**/src/walkthrough/exportVideo.ts*', (r) =>
    r.fulfill({
      contentType: 'text/javascript',
      body: `
    export const canExport = async () => true;
    export const exportWalkthrough = opts => new Promise((resolve, reject) => {
      window.encoding = opts; window.encodeResolve = resolve; window.encodeReject = reject;
      opts.signal.addEventListener('abort', () => reject(new DOMException('Stopped', 'AbortError')));
    });`,
    }),
  );
  await page.evaluate(async () => {
    const { Project } = await import('/src/editor/core/project.ts');
    const project = Project.create('Video fixture');
    const { watchWalkthrough } = await import('/src/walkthrough/player.ts');
    void watchWalkthrough({ id: 'project:fixture', title: 'Fixture', gam: project.gam }, async () => project.files, undefined, {
      version: 1,
      game: 'fixture',
      rand: { seed: 1, per: 'game' },
      segments: [],
      chapters: [],
      timeline: { fps: 60, frames: 600, chapters: [] },
    });
  });
  await page.getByRole('button', { name: /Download MP4/ }).click();
  await page.waitForFunction(() => !!window.encoding);
  const progress = await page.evaluate(async () => {
    const status = document.querySelector('.wt-status');
    const messages = [];
    const observer = new MutationObserver(() => messages.push(status.textContent));
    observer.observe(status, { childList: true });
    for (let i = 1; i <= 8; i++) {
      window.encoding.onProgress(i * 30, 600);
      await new Promise((r) => setTimeout(r, 10));
    }
    observer.disconnect();
    return { messages, visual: document.querySelector('.wt-export-line')?.textContent, bar: document.querySelector('.wt-export-progress').value };
  });
  assert.ok(progress.messages.length <= 1);
  assert.match(progress.visual, /40%/);
  assert.equal(progress.bar, 0.4);
  await page.evaluate(() => window.encodeReject(new Error('Controlled encoder refusal')));
  await page.waitForFunction(() => document.querySelector('.wt-status').textContent.includes('Controlled encoder refusal'));
  await page.getByRole('button', { name: /Download MP4/ }).click();
  await page.getByRole('button', { name: /Cancel MP4/ }).click();
  await page.waitForFunction(() => document.querySelector('.wt-status').textContent === 'Video canceled.');
  await page.getByRole('button', { name: /Download MP4/ }).click();
  await page.waitForFunction(() => document.querySelector('.wt-export-progress').hidden === false);
  await page.evaluate(() => window.encodeResolve({ blob: new Blob(['fixture-not-a-real-video']), frames: 600, audio: 'none' }));
  await page.waitForFunction(() => document.querySelector('.wt-status').textContent.startsWith('Saved '));
});
test('archive helper samples file progress and announces one final outcome', async () => {
  await reset();
  let release;
  await page.route('**/archive.json', async (r) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    await r.fulfill({ json: { shell: [], files: Array.from({ length: 20 }, (_, i) => [`fixture-${i}.bin`, 1, 1]) } });
  });
  await page.route('**/games/catalog.json', (r) => r.fulfill({ json: [] }));
  await page.route('**/games/index.json', (r) => r.fulfill({ json: [] }));
  await page.route('**/fixture-*.bin', (r) => r.fulfill({ status: r.request().url().includes('fixture-19.') ? 503 : 200, body: 'fixture' }));
  await page.goto(`${base}/archive.html`);
  await page.evaluate(() => {
    window.progressMessages = [];
    const status = document.querySelector('#status');
    new MutationObserver(() => window.progressMessages.push(status.textContent)).observe(status, { childList: true });
  });
  release();
  await page.waitForFunction(() => document.querySelector('#done').hidden === false);
  assert.equal(await page.locator('[role=status]').count(), 1);
  const messages = await page.evaluate(() => window.progressMessages);
  assert.ok(messages.filter((t) => !t.startsWith('Done')).length <= 1);
  assert.match(messages.at(-1), /^Done\. 1 of 22 files could not be fetched/);
});
test('success toasts survive the modal that their action closes synchronously', async () => {
  await reset();
  await page.evaluate(async () => {
    const ui = await import('/src/editor/core/ui.ts');
    void ui.modal('Closing action', (close) =>
      ui.h(
        'button',
        {
          onclick: () => {
            ui.toast('Saved final outcome', 'info', { repeat: true });
            close();
          },
        },
        'Finish',
      ),
    );
  });
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await page.waitForTimeout(30);
  assert.equal(await page.locator('dialog').count(), 0);
  assert.match(await accessibleText(), /Saved final outcome/);
});
