// Theme recheck: opens a list of screens in the real light and dark themes (forceTheme + assertTheme) at 1440, 390 and 375,
// runs axe and measures sideways overflow on each, and saves a screenshot per screen. Exit 1 on any axe violation or overflow.
// Usage: npm run theme:recheck -- [--out dir] [--only name,name] [--themes light,dark] [--widths 1440,390,375] [--port 5293] [--url u] [--dist dir]
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from 'playwright-core';
import { arg, launch, target } from './perfLib';
import { assertTheme, forceTheme } from './forceTheme';

interface Screen {
  name: string;
  route: string;
  /** Playwright selectors clicked in order (a missing one is reported, not fatal). */
  clicks?: string[];
  /** Widths this screen is checked at (default all). */
  widths?: number[];
  /** Extra page work after load, before measuring. */
  setup?: (page: Page) => Promise<void>;
}

const P = '/#/p/look:blaster';
const screens: Screen[] = [
  { name: 'privacy', route: '/#/privacy' },
  { name: 'programmers-guide', route: '/#/programmers-guide' },
  { name: 'programmers-guide-chapter', route: '/#/programmers-guide/memory' },
  { name: 'map-breadcrumb', route: `${P}/bus3.map`, clicks: ['.crumb-back, .crumbs'] },
  { name: 'scene-uses', route: `${P}/blaster.gam?scene=3` },
  { name: 'recording-keys', route: `${P}/demo.rec`, clicks: ['.rec-raw summary'] },
  { name: 'integrator-lists', route: `${P}/blaster.gam` },
  {
    name: 'box-feelies',
    route: '/#/desk',
    clicks: ['.shelf-box[aria-label="Final Curtain box"]', '.fl-about'],
  },
  {
    name: 'update-notice',
    route: '/#/',
    setup: async (page) => {
      await page.evaluate("import('/src/offline.ts').then((m) => m.offerUpdate(undefined))");
      await page.waitForSelector('.gm-update', { timeout: 5000 });
    },
  },
  { name: 'settings-update', route: '/#/', setup: openSettingsWithUpdate },
  { name: 'starters-tab', route: '/#/', clicks: ['.lib-cat:has-text("Starters")'] },
  { name: 'map-zoom', route: `${P}/bus3.map`, clicks: ['.mt-zoom-row select, .mt-zoom-row button'] },
  { name: 'assets-compact', route: `${P}/blaster.gam`, widths: [375], clicks: ['.files-toggle', '.asset-home', '.asset-search-toggle'] },
];

async function openSettingsWithUpdate(page: Page): Promise<void> {
  await page.evaluate("import('/src/offline/updateState.ts').then((m) => m.setPendingUpdate(() => undefined))");
  // phones and tablets keep Settings in the ⋯ menu
  const gear = page.locator('button[aria-label="Settings"]');
  await ((await gear.isVisible()) ? gear : page.locator('.topbar-more summary')).click({ timeout: 8000 });
  await page.waitForTimeout(500);
}

const out = resolve(arg('out') ?? '../.for-lewis/research/theme-recheck');
const only = arg('only')?.split(',');
const themes = (arg('themes') ?? 'light,dark').split(',') as ('light' | 'dark')[];
const widths = (arg('widths') ?? '1440,390,375').split(',').map(Number);
mkdirSync(out, { recursive: true });
const axeSrc = readFileSync(resolve('../node_modules/axe-core/axe.min.js'), 'utf8');

let failed = 0;
const srv = await target(5293);
const browser = await launch();
try {
  for (const theme of themes)
    for (const width of widths) {
      const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 812 : 900 }, colorScheme: theme });
      await ctx.addInitScript(() => localStorage.setItem('gm-ui', 'web'));
      await forceTheme(ctx, theme);
      for (const s of screens) {
        if (only && !only.includes(s.name)) continue;
        if (s.widths && !s.widths.includes(width)) continue;
        const page = await ctx.newPage();
        const notes: string[] = [];
        try {
          await page.goto(srv.base + s.route);
          await page.waitForLoadState('networkidle').catch(() => undefined);
          await page.waitForTimeout(3500);
          await assertTheme(page, theme);
          for (const sel of s.clicks ?? []) {
            await page.click(sel, { timeout: 6000 }).catch(async () => {
              // off-screen or still drawing (the desk's shelf draws box by box): wait for it, then click it in the page
              await page
                .locator(sel)
                .first()
                .evaluate((el) => (el as HTMLElement).click(), undefined, { timeout: 20000 })
                .catch(() => notes.push(`no click: ${sel}`));
            });
            await page.waitForTimeout(800);
          }
          await s.setup?.(page);
          await page.waitForTimeout(500);
          await assertTheme(page, theme);
          const overflow = await page.evaluate((w) => document.documentElement.scrollWidth - w, width);
          await page.addScriptTag({ content: axeSrc });
          const found: { id: string; impact: string; nodes: string[]; count: number }[] = await page.evaluate(async () => {
            // @ts-expect-error axe is a page global once injected
            const res = await axe.run(document, { resultTypes: ['violations'] });
            return res.violations.map((v: { id: string; impact: string; nodes: { target: string[]; any: { data?: unknown; message: string }[] }[] }) => ({
              id: v.id,
              impact: v.impact,
              nodes: v.nodes.slice(0, 4).map((n) => `${n.target.join(' ')} :: ${n.any[0]?.message ?? ''}`),
              count: v.nodes.length,
            }));
          });
          await page.screenshot({ path: `${out}/${s.name}-${width}-${theme}.png` });
          const bad = found.length > 0 || overflow > 0;
          if (bad) failed++;
          console.log(
            `${bad ? 'FAIL' : 'ok  '} ${s.name} ${width} ${theme}: overflow=${overflow}, axe=${found.map((f) => `${f.id}x${f.count}`).join(', ') || 'none'}${notes.length ? ' [' + notes.join('; ') + ']' : ''}`,
          );
          for (const f of found) for (const n of f.nodes) console.log(`      ${f.id}: ${n}`);
        } catch (e) {
          failed++;
          console.log(`ERR  ${s.name} ${width} ${theme}: ${String(e instanceof Error ? e.message : e).split('\n')[0]}`);
        }
        await page.close();
      }
      await ctx.close();
    }
} finally {
  await browser.close();
  srv.stop();
}
if (failed) process.exitCode = 1;
