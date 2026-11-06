// Six loaded site surfaces, two widths and both stored themes; retain raw axe and layout evidence.
// Usage: npx vite-node scripts/pagesA11y.ts --out <private-dir> [--url http://127.0.0.1:5316]
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AxeResults } from 'axe-core';
import { arg, launch, target } from './perfLib';
import { forceTheme } from './forceTheme';

const out = resolve(arg('out') ?? '../.for-lewis/research/pages-a11y');
mkdirSync(out, { recursive: true });
const surfaces = [
  ['home', '#/', '.home .game-tile'],
  ['desk', '#/desk', '.desk-scene'],
  ['starters', '#/', '.home .game-tile'],
  ['library', '#/library', 'main.library'],
  ['cast', '#/cast', 'main.cast #cast-teddy'],
  ['guide', '#/help', '.guide article #help-start'],
] as const;
const expectedStarters = readdirSync(resolve('../games'), { withFileTypes: true }).filter((entry) => {
  if (!entry.isDirectory()) return false;
  try {
    const about = JSON.parse(readFileSync(resolve('../games', entry.name, 'about.json'), 'utf8')) as { series?: string; secret?: boolean };
    return about.series === 'starter' && !about.secret;
  } catch {
    return false;
  }
}).length;
const axeSrc = readFileSync(resolve('../node_modules/axe-core/axe.min.js'), 'utf8');
const srv = await target(5316);
const browser = await launch();
const results: Record<string, unknown>[] = [];
try {
  for (const [surface, route, selector] of surfaces) {
    for (const width of [1440, 390]) {
      for (const theme of ['light', 'dark'] as const) {
        const height = width === 390 ? 844 : 900;
        const id = `${surface}-${width}-${theme}`;
        const context = await browser.newContext({ viewport: { width, height }, colorScheme: theme, deviceScaleFactor: 1 });
        await forceTheme(context, theme);
        await context.addInitScript(() => localStorage.setItem('gm-ui', 'modern'));
        const page = await context.newPage();
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        try {
          await page.goto(srv.base + '/' + route);
          await page.waitForSelector(selector, { timeout: 90000 });
          if (surface === 'starters') {
            await page.locator('#lib-tab-starter').click();
            await page.waitForSelector('#lib-tab-starter[aria-selected="true"]');
            await page.waitForFunction(() => document.querySelector('#lib-panel')?.textContent?.includes('First Steps'));
          }
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(1200);
          const loaded = await page.evaluate(() => ({
            title: document.title,
            url: location.href,
            theme: document.documentElement.dataset.theme,
            selectedTab: document.querySelector('[role=tab][aria-selected=true]')?.id,
            text: document.querySelector('main, #content')?.textContent?.slice(0, 1600),
            cards: document.querySelectorAll('.game-tile').length,
          }));
          if (loaded.theme !== theme) throw new Error(`Theme mismatch: ${loaded.theme}`);
          if (surface === 'starters' && loaded.cards !== expectedStarters) throw new Error(`Incomplete Starters catalog: ${loaded.cards}/${expectedStarters}`);
          const layout = await page.evaluate((viewportWidth) => {
            const controls = [
              ...document.querySelectorAll<HTMLElement>('button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab]'),
            ].filter(
              (el) =>
                el.checkVisibility({ checkVisibilityCSS: true }) &&
                !el.closest('[inert]') &&
                !el.matches(':disabled') &&
                !el.closest('details:not([open]) > :not(summary)'),
            );
            const small = controls.flatMap((el) => {
              const r = el.getBoundingClientRect();
              if (r.width >= 24 && r.height >= 24) return [];
              const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline';
              // Some small drawn hardware buttons have a larger invisible ::before hit area.
              // Count that only when a real 24px square hits this control at all nine sample points.
              const pseudo = getComputedStyle(el, '::before');
              const sx = r.width / el.offsetWidth;
              const sy = r.height / el.offsetHeight;
              const hasHitArea = pseudo.content !== 'none' && pseudo.position === 'absolute' && pseudo.pointerEvents !== 'none';
              const hitWidth = hasHitArea ? parseFloat(pseudo.width) * sx : r.width;
              const hitHeight = hasHitArea ? parseFloat(pseudo.height) * sy : r.height;
              const x = hasHitArea ? r.left + (el.clientLeft + parseFloat(pseudo.left)) * sx + hitWidth / 2 : r.x + r.width / 2;
              const y = hasHitArea ? r.top + (el.clientTop + parseFloat(pseudo.top)) * sy + hitHeight / 2 : r.y + r.height / 2;
              const hit24 =
                hitWidth >= 24 &&
                hitHeight >= 24 &&
                [-11.9, 0, 11.9].every((dx) =>
                  [-11.9, 0, 11.9].every((dy) => {
                    const hit = document.elementFromPoint(x + dx, y + dy);
                    return hit !== null && (hit === el || el.contains(hit));
                  }),
                );
              return [{ html: el.outerHTML.slice(0, 600), width: r.width, height: r.height, inline, hit24, hitWidth, hitHeight }];
            });
            const overflow = [...document.querySelectorAll<HTMLElement>('body *')]
              .filter((el) => {
                const r = el.getBoundingClientRect();
                return el.checkVisibility({ checkVisibilityCSS: true }) && r.width > 0 && (r.right > viewportWidth + 1 || r.left < -1);
              })
              .slice(0, 40)
              .map((el) => ({ html: el.outerHTML.slice(0, 400), left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right }));
            return { overflowX: document.documentElement.scrollWidth - viewportWidth, small, overflow };
          }, width);
          await page.addScriptTag({ content: axeSrc });
          const axe = await page.evaluate(async () => {
            const w = window as unknown as { axe: { run: (node: Document, options: object) => Promise<AxeResults> } };
            return w.axe.run(document, { resultTypes: ['violations', 'incomplete', 'passes', 'inapplicable'] });
          });
          await page.screenshot({ path: `${out}/${id}.png`, fullPage: true });
          const status =
            axe.violations.length || layout.overflowX > 0 || layout.small.some((s) => !s.inline && !s.hit24) || errors.length ? 'failed' : 'passed';
          const result = { id, surface, width, height, theme, status, loaded, layout, errors, axe };
          writeFileSync(`${out}/${id}.json`, JSON.stringify(result, null, 2));
          results.push({
            id,
            status,
            violations: axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })),
            small: layout.small.length,
            standaloneSmall: layout.small.filter((s) => !s.inline && !s.hit24).length,
            overflowX: layout.overflowX,
            errors,
          });
        } catch (e) {
          const result = { id, status: 'blocked', error: String(e), errors };
          results.push(result);
          writeFileSync(`${out}/${id}.json`, JSON.stringify(result, null, 2));
          await page.screenshot({ path: `${out}/${id}-blocked.png` }).catch(() => undefined);
        } finally {
          await context.close();
        }
        writeFileSync(`${out}/summary.json`, JSON.stringify(results, null, 2));
        console.log(JSON.stringify(results.at(-1)));
      }
    }
  }
} finally {
  await browser.close();
  srv.stop();
}
console.log(
  JSON.stringify({
    planned: 24,
    executed: results.filter((r) => r.status !== 'blocked').length,
    passed: results.filter((r) => r.status === 'passed').length,
    failed: results.filter((r) => r.status === 'failed').length,
    blocked: results.filter((r) => r.status === 'blocked').length,
  }),
);
if (results.length !== 24 || results.some((r) => r.status !== 'passed')) process.exitCode = 1;
