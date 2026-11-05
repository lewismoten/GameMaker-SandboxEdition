// DAST shots of the 1994 desk (housekeeping 15b): the whole room at 1440x900 and 390x844 with every felt egg
// and the clock heart unlocked, plus a close-up of each direct child of the desk scene (the props).
// Usage: npm run desk:dast -- --base http://localhost:5191 --out <dir> [--theme dark|light]
// Needs a server you started (never port 5173). Headless Playwright Chromium, closed in a finally.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { arg, launch } from './perfLib';
import { assertTheme, forceTheme } from './forceTheme';

const base = arg('base') ?? 'http://localhost:5191';
const out = arg('out') ?? 'desk-dast';
const theme = (arg('theme') ?? 'dark') as 'dark' | 'light';
const EGG_GAMES = [
  'blaster',
  'brief',
  'depth',
  'logic',
  'maximus',
  'realm',
  'sandcast',
  'sleuth',
  'snowbound',
  'teddy',
  'teddy2',
  'teddy3',
  'tuneup',
  'year2000',
];
mkdirSync(out, { recursive: true });

const browser = await launch();
try {
  for (const [name, w, h] of [['wide', 1440, 900] as const, ['phone', 390, 844] as const]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: name === 'wide' ? 2 : 1 });
    await forceTheme(ctx, theme);
    await ctx.addInitScript(
      ([games]) => {
        try {
          localStorage.setItem('gm-eggs', JSON.stringify(Object.fromEntries(games.map((g: string) => [g, 'added']))));
          localStorage.setItem('gm-clock-heart', JSON.stringify({ found: new Date().toISOString() }));
        } catch {
          /* storage blocked */
        }
      },
      [EGG_GAMES],
    );
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: 'load' });
    await page.waitForSelector('.desk-scene', { timeout: 60000 });
    await page.waitForTimeout(4000);
    await assertTheme(page, theme);
    await page.screenshot({ path: join(out, `room-${theme}-${name}.png`) });
    // the room is wider than the window: pan it in window-wide steps
    const maxLeft = await page.evaluate(() => {
      const s = document.querySelector('.desk-scene') as HTMLElement;
      return s.scrollWidth - s.clientWidth;
    });
    for (let left = 0, n = 0; left <= maxLeft + 1; left += w - 100, n++) {
      await page.evaluate((x) => ((document.querySelector('.desk-scene') as HTMLElement).scrollLeft = x), left);
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(out, `pan-${theme}-${name}-${n}.png`) });
    }
    await page.evaluate(() => ((document.querySelector('.desk-scene') as HTMLElement).scrollLeft = 0));
    for (const sel of ['.game-shelf', '.egg-perch', '.room-door', '.wall-clock', '.chez-art', '.heart-trophy']) {
      const el = page.locator(sel).first();
      if ((await el.count()) && (await el.boundingBox())?.width) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        const box = (await el.boundingBox())!;
        await page.screenshot({
          path: join(out, `close-${theme}-${name}-${sel.replace(/\W/g, '')}.png`),
          clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: Math.min(w, box.width + 40), height: Math.min(h, box.height + 40) },
        });
      }
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
