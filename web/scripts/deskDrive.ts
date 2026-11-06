// Drives the 1994 desk headless: power the PC on, open the Game-Maker box, put the CD in, answer
// the registration word (read from the page each run, it changes on reload), then run steps.
// Steps (repeat --step, in order): plain text is typed as a DOS command and Enter pressed;
// `key:Escape` presses a key; `shot:name` saves name.png (the PC screen); `shotfull:name` the page;
// `wait:ms` is a plain pause (last resort). Waits are on page state: an element showing, or the
// screen settling (two identical screenshots in a row).
// Usage: npm run desk:drive -- --base <url> [--out dir] [--step "D:\\" --step shot:root ...]
// Needs a server you started (never port 5173 unless it is yours to use: this starts nothing).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from 'playwright-core';
import { arg, launch } from './perfLib';

type Clip = { x: number; y: number; width: number; height: number };
const SCREEN: Clip = { x: 420, y: 60, width: 600, height: 440 };

/** Waits until the clip stops changing (two identical screenshots a beat apart). */
export async function settle(page: Page, clip: Clip = SCREEN, timeout = 15000): Promise<void> {
  const end = Date.now() + timeout;
  let last = '';
  while (Date.now() < end) {
    const now = (await page.screenshot({ clip })).toString('base64');
    if (now === last) return;
    last = now;
    await page.waitForTimeout(250);
  }
}

/** Loads the desk, boots, and gets to the Game-Maker menu with the CD in. */
export async function bootGameMaker(page: Page, base: string): Promise<void> {
  await page.goto(`${base.replace(/\/$/, '')}/#/desk`);
  await page.click('.case-btn.power', { timeout: 30000 });
  await page.waitForSelector('.gm-box', { timeout: 60000 });
  await settle(page, { x: 0, y: 0, width: 1440, height: 900 }, 30000);
  await page.click('.gm-box');
  await page.click('button.primary:has-text("Put the CD in")', { timeout: 60000 });
  const word = ((await page.locator('mark.rs-word').first().textContent({ timeout: 30000 })) ?? '').replace(/[^A-Za-z0-9]/g, '');
  await page.keyboard.type(word, { delay: 120 });
  await page.keyboard.press('Enter');
  await page
    .locator('mark.rs-word')
    .first()
    .waitFor({ state: 'detached', timeout: 30000 })
    .catch(() => {});
  await settle(page);
}

/** Runs one --step. */
export async function runStep(page: Page, step: string, out: string): Promise<void> {
  const m = /^(key|shot|shotfull|wait):(.*)$/.exec(step);
  if (!m) {
    for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
    await page.keyboard.type(step, { delay: 80 });
    await page.keyboard.press('Enter');
    await settle(page);
  } else if (m[1] === 'key') {
    await page.keyboard.press(m[2]);
    await settle(page);
  } else if (m[1] === 'wait') await page.waitForTimeout(Number(m[2]));
  else await page.screenshot({ path: join(out, `${m[2]}.png`), ...(m[1] === 'shot' ? { clip: SCREEN } : {}) });
}

async function main(): Promise<void> {
  const base = arg('base');
  if (!base) throw new Error('Pass --base <url> of your own dev server (this starts none).');
  if (/:5173\b/.test(base)) console.log('Note: 5173 is the maintainer’s server; fine to read from, but nothing here reloads it.');
  const out = arg('out') ?? 'desk-drive';
  mkdirSync(out, { recursive: true });
  const steps = process.argv.flatMap((a, i) => (a === '--step' ? [process.argv[i + 1]] : []));
  const browser = await launch();
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
    await bootGameMaker(page, base);
    await page.screenshot({ path: join(out, 'menu.png'), clip: SCREEN });
    console.log('Game-Maker is up; saved menu.png');
    for (const s of steps) {
      await runStep(page, s, out);
      console.log('step done:', s);
    }
    console.log(`Screenshots in ${out}`);
  } finally {
    await browser.close();
  }
}
main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
