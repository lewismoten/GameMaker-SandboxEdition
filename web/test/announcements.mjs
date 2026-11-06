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
