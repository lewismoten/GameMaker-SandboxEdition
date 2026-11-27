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
  destination: string;
  /** Playwright selectors clicked in order. */
  clicks?: string[];
  /** Widths this screen is checked at (default all). */
  widths?: number[];
  /** Extra page work after load, before measuring. */
  setup?: (page: Page) => Promise<void>;
}

const P = '/#/p/look:blaster';
const screens: Screen[] = [
  { name: 'privacy', destination: '.privacy-page', route: '/#/privacy' },
  { name: 'programmers-guide', destination: '.pg-toc', route: '/#/programmers-guide' },
  { name: 'programmers-guide-chapter', destination: '.pg-page h1:has-text("The memory model")', route: '/#/programmers-guide/memory' },
  { name: 'map-breadcrumb', destination: '.crumb-here:has-text("bus3.map")', route: `${P}/bus3.map` },
  { name: 'scene-uses', destination: '.grator-panel :text-is("Level scene #3")', route: `${P}/blaster.gam?scene=3` },
  { name: 'recording-keys', destination: '.rec-raw[open] > div', route: `${P}/demo.rec`, clicks: ['.rec-raw summary'] },
  {
    name: 'integrator-lists',
    setup: async (page) => {
      const open = page.locator('.grator-side-open');
      if (await open.isVisible()) await open.click();
      await page.locator('#grator-tab-screens').click();
    },
    destination: '#grator-side-body[aria-labelledby="grator-tab-screens"]',
    route: `${P}/blaster.gam`,
  },
  {
    name: 'box-feelies',
    destination: '#feelies-about',
    route: '/#/desk',
    clicks: ['.shelf-box[aria-label="Final Curtain box"]', '.fl-about'],
  },
  {
    name: 'update-notice',
    destination: '.gm-update',
    route: '/#/',
    setup: async (page) => {
      await page.evaluate("import('/src/offline.ts').then((m) => m.offerUpdate(undefined))");
    },
  },
  { name: 'settings-update', destination: '.update-item:visible', route: '/#/', setup: openSettingsWithUpdate },
  { name: 'starters-tab', destination: '#lib-tab-starter[aria-selected="true"]', route: '/#/', clicks: ['.lib-cat:has-text("Starters")'] },
  { name: 'map-zoom', destination: '.mt-zoom-row select', route: `${P}/bus3.map`, clicks: ['.mt-zoom-row select, .mt-zoom-row button'] },
  {
    name: 'assets-compact',
    destination: '#asset-search',
    route: `${P}/blaster.gam`,
    widths: [375],
    clicks: ['.files-toggle', '.asset-home', '.asset-search-toggle'],
  },
];

async function openSettingsWithUpdate(page: Page): Promise<void> {
  await page.evaluate("import('/src/offline/updateState.ts').then((m) => m.setPendingUpdate(() => undefined))");
  // phones and tablets keep Settings in the ⋯ menu
  const gear = page.locator('button[aria-label="Settings"]');
  await ((await gear.isVisible()) ? gear : page.locator('.topbar-more summary')).click({ timeout: 8000 });
  await page.waitForTimeout(500);
}

const out = resolve(arg('out') ?? '../.for-lewis/research/theme-recheck');
const filter = arg('only') ?? (process.argv.includes('--only') ? '' : undefined);
const only = filter?.split(',').map((name) => name.trim());
const unknown = only?.filter((name) => !screens.some((screen) => screen.name === name));
if (unknown?.length) throw new Error('Unknown screen in --only: ' + unknown.map((name) => name || '(empty)').join(', '));
const selected = screens.filter((screen) => !only || only.includes(screen.name));
const themes = (arg('themes') ?? 'light,dark').split(',') as ('light' | 'dark')[];
const widths = (arg('widths') ?? '1440,390,375').split(',').map(Number);
if (!widths.some((width) => selected.some((screen) => !screen.widths || screen.widths.includes(width))))
  throw new Error('No theme audit cases match the selected screens and widths.');
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
      for (const s of selected) {
        if (s.widths && !s.widths.includes(width)) continue;
        const page = await ctx.newPage();
        try {
          await page.goto(srv.base + s.route);
          await page.waitForLoadState('networkidle').catch(() => undefined);
          await page.waitForTimeout(3500);
          await assertTheme(page, theme);
          for (const sel of s.clicks ?? []) {
            await page.click(sel, { timeout: 20000 });
            await page.waitForTimeout(800);
          }
          await s.setup?.(page);
          await page.waitForTimeout(500);
          await assertTheme(page, theme);
          await page.waitForSelector(s.destination, { state: 'visible', timeout: 8000 });
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
            `${bad ? 'FAIL' : 'ok  '} ${s.name} ${width} ${theme}: overflow=${overflow}, axe=${found.map((f) => `${f.id}x${f.count}`).join(', ') || 'none'}`,
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
