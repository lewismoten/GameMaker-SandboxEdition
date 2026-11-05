// Finds dialogs by clicking: in a new game, every visible button on each tab and in each file's editor is clicked once; a dialog
// that opens is measured at 375x812 (dialogsFitMeasure.ts) and closed with Escape. Prints a line per dialog that fails.
// Usage: npm run check:dialogs:sweep [-- --port 5593] [--theme light|dark] [--out dir] [--only substring-of-location]
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from 'playwright-core';
import { arg, launch, target } from './perfLib';
import { assertTheme, forceTheme } from './forceTheme';
import { measure } from './dialogsFitMeasure';

const theme = (arg('theme') ?? 'light') as 'light' | 'dark';
const out = arg('out') ? resolve(arg('out') as string) : undefined;
if (out) mkdirSync(out, { recursive: true });
const onlyLoc = arg('only');

const srv = await target(5593);
const browser = await launch();
const seen = new Set<string>();
let bad = 0;
let found = 0;

/** Visible buttons outside any dialog, with a label for each. */
const buttons = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('main button, .editor button, #app button, button')]
      .filter(
        (b, i, all) =>
          all.indexOf(b) === i && b.offsetWidth > 0 && !b.closest('dialog, [role="dialog"], nav, header, .topbar') && !(b as HTMLButtonElement).disabled,
      )
      .map((b, i) => ({ i, label: (b.getAttribute('aria-label') || b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) })),
  );

try {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  await forceTheme(ctx, theme);
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.open = () => null;
  });
  await page.goto(srv.base + '/#/');
  await page.reload();
  await page
    .getByText('Too retro')
    .click({ timeout: 8000 })
    .catch(() => undefined);
  await page.waitForSelector('text=New game');
  await page.getByText('+ New game').first().click();
  await page.getByText('Ready to play').click();
  await page.waitForSelector('text=Optimize', { timeout: 30000 });
  const home = page.url();
  await assertTheme(page, theme);

  const gotoTab = async (tab: string) => {
    await page.goto(home);
    await page.reload();
    await page.waitForSelector('[role="tab"]', { timeout: 20000 });
    await page
      .getByRole('tab', { name: tab })
      .click({ timeout: 6000 })
      .catch(() => undefined);
    await page.waitForTimeout(250);
  };
  // category cards in the Files tab, then the first few files of each
  await gotoTab('Files');
  const cats: string[] = await page.evaluate(() => [...document.querySelectorAll('.asset-category')].map((e) => e.getAttribute('data-category') ?? ''));
  console.log(`categories: ${cats.join(',')}`);
  const openCat = async (c: string) => {
    await gotoTab('Files');
    await page.locator(`.asset-category[data-category="${c}"]`).click({ timeout: 5000 });
    await page.waitForTimeout(500);
  };
  const locations: [string, () => Promise<void>][] = [];
  for (const t of ['Files', 'Controls', 'DOS player', 'Tools']) locations.push([`tab ${t}`, () => gotoTab(t)]);
  for (const c of cats) {
    locations.push([`cat ${c}`, () => openCat(c)]);
    for (const k of [0, 1])
      locations.push([
        `file ${c}#${k}`,
        async () => {
          await openCat(c);
          await page.locator('.asset-open').nth(k).click({ timeout: 4000 });
          await page.waitForTimeout(900);
        },
      ]);
  }

  // whole pages outside a project: home, a game's page, the library, achievements, the cast
  for (const r of ['/#/', '/#/game/cd:nebula', '/#/library', '/#/achievements', '/#/cast', '/#/help', '/#/credits'])
    locations.push([
      `page ${r}`,
      async () => {
        await page.goto(srv.base + r);
        await page.reload();
        await page
          .getByText('Too retro')
          .click({ timeout: 3000 })
          .catch(() => undefined);
        await page.waitForTimeout(1500);
      },
    ]);

  for (const [loc, go] of locations) {
    if (onlyLoc && !loc.includes(onlyLoc)) continue;
    try {
      await go();
    } catch {
      console.log(`[skip] ${loc}: could not open (${page.url().slice(-30)}, dialogs ${await page.locator('dialog[open]').count()})`);
      if (out) await page.screenshot({ path: `${out}/skip-${loc.replace(/[^a-z0-9]+/gi, '_')}.png` });
      continue;
    }
    const list = await buttons(page);
    const url0 = page.url();
    for (const b of list) {
      const key = `${loc}|${b.label.replace(/\d+/g, '#')}`; // Color 1 .. Color 255 are one button
      if (seen.has(key)) continue;
      seen.add(key);
      try {
        const clicked = await page.evaluate((label) => {
          const all = [...document.querySelectorAll<HTMLElement>('button')].filter(
            (x, k, a) =>
              a.indexOf(x) === k && x.offsetWidth > 0 && !x.closest('dialog, [role="dialog"], nav, header, .topbar') && !(x as HTMLButtonElement).disabled,
          );
          const el = all.find((x) => (x.getAttribute('aria-label') || x.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) === label);
          el?.click();
          return !!el;
        }, b.label);
        if (!clicked) continue;
        await page.addStyleTag({ content: '.ach-toasts, .toasts { display: none !important; }' });
        await page.waitForTimeout(300);
        const m = await measure(page);
        if (!m.open) {
          if (page.url() !== url0) await go();
          continue;
        }
        found++;
        const title = await page.evaluate(() =>
          (document.querySelector('dialog[open] h2, dialog[open] .modal-title, [role="dialog"] h2')?.textContent ?? '?').trim().slice(0, 40),
        );
        const hard = m.problems.filter((x) => !x.includes('[allowed list]'));
        if (hard.length) bad++;
        console.log(`${hard.length ? 'FAIL' : 'ok  '} ${loc} > ${b.label} => "${title}"${hard.length ? ': ' + hard.slice(0, 3).join('; ') : ''}`);
        if (out) await page.screenshot({ path: `${out}/${(loc + '-' + b.label).replace(/[^a-z0-9]+/gi, '_')}.png` });
        await page.keyboard.press('Escape');
        await page.waitForTimeout(150);
        if ((await page.locator('dialog[open]').count()) || page.url() !== url0) await go();
      } catch (e) {
        console.log(`[err] ${key}: ${(e as Error).message.split('\n')[0].slice(0, 80)}`);
        await go().catch(() => undefined);
      }
    }
  }
  console.log(`\n${found} dialog(s) found, ${bad} failing at 375x812 ${theme}.`);
} finally {
  await browser.close();
  srv.stop();
}
