// Screenshots of the map editor's Generate dialog and generated layouts on a real game's blocks:
// opens a look: project, marks roles in the block editor's Uses tab, then opens the map and generates.
// Starts no server: pass --url of your own dev server (never 5173).
// Usage: vite-node scripts/levelGenShots.ts --url http://localhost:5191 --out <dir> --kind dungeon|forest --roles "3=Wall,25=Floor" [--project look:overhead] [--bbl over.bbl] [--map one.map] [--theme light|dark] [--phone]
// (--roles is block=Role label pairs, as the chips are named in the Uses tab)
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { arg, launch } from './perfLib';
import { assertTheme, forceTheme } from './forceTheme';

const base = arg('url') ?? 'http://localhost:5191';
if (base.includes(':5173')) throw new Error('Port 5173 is the maintainer’s dev server.');
const out = resolve(arg('out') ?? 'level-gen-shots');
const project = arg('project') ?? 'look:overhead';
const bbl = arg('bbl') ?? 'over.bbl';
const map = arg('map') ?? 'one.map';
const theme = (arg('theme') ?? 'light') as 'light' | 'dark';
const phone = process.argv.includes('--phone');
const axeSrc = process.argv.includes('--axe') ? readFileSync(resolve('../node_modules/axe-core/axe.min.js'), 'utf8') : undefined;
const kind = arg('kind') ?? 'dungeon';
const roles = (arg('roles') ?? '')
  .split(',')
  .filter(Boolean)
  .map((p) => p.split('=') as [string, string]);
mkdirSync(out, { recursive: true });

const browser = await launch();
try {
  const ctx = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
  await forceTheme(ctx, theme);
  const page = await ctx.newPage();
  if (process.argv.includes('--console')) page.on('console', (m) => console.log('PAGE', m.text()));
  await page.goto(`${base}/#/p/${project}/${bbl}?tab=uses`);
  await page.waitForSelector('.blk-roles', { timeout: 60000 });
  await assertTheme(page, theme);
  await page.getByRole('button', { name: /Edit a copy/ }).click();
  await page.waitForTimeout(2500);
  await page.getByRole('tab', { name: 'Uses' }).click();
  await page.waitForSelector('.blk-roles');
  for (const [n, role] of roles) {
    await page.locator('.blk-picker .block-picker button').nth(Number(n)).click();
    await page
      .locator('.blk-role-chip')
      .filter({ hasText: new RegExp(`^${role}(,|$)`) })
      .click();
  }
  const copy = page.url().split('#')[1].split('/')[2];
  await page.goto(`${base}/#/p/${copy}/${map}`);
  await page.waitForSelector('.block-picker');
  await page.waitForTimeout(1500);
  const shot = async (name: string, el = page) => el.screenshot({ path: `${out}/${name}.png` });
  await shot('map-before');
  await page.getByRole('button', { name: /Generate/ }).click();
  await page.waitForSelector('.gen-offers');
  await page.waitForTimeout(500);
  await assertTheme(page, theme);
  await page.locator('dialog select[aria-label="Kind of layout"]').selectOption(kind);
  await page.waitForTimeout(500);
  await shot(`dialog-${kind}`);
  const axe = async (what: string, scope: string) => {
    if (!axeSrc) return;
    await page.addScriptTag({ content: axeSrc });
    const v = await page.evaluate(async (sel) => {
      // @ts-expect-error axe is a page global once injected
      const res = await axe.run(document.querySelector(sel) ?? document, { resultTypes: ['violations'] });
      return res.violations.map((x: { id: string; nodes: { html: string }[] }) => `${x.id}: ${x.nodes[0]?.html.slice(0, 120)}`);
    }, scope);
    console.log(`axe ${what} ${theme}${phone ? ' phone' : ''}: ${v.length ? v.join(' | ') : 'clean'}`);
  };
  await axe('dialog', 'dialog[open]');
  await page.locator('dialog .gen-offer').first().click();
  await page.getByRole('button', { name: 'Use this layout' }).click();
  await page.waitForTimeout(800);
  for (let i = 0; i < Number(arg('zoom-out') ?? 3); i++) await page.getByRole('button', { name: 'Zoom out' }).click();
  await page.waitForTimeout(600);
  await shot(`map-${kind}`);
  await axe('map page', 'body');
} finally {
  await browser.close();
}
