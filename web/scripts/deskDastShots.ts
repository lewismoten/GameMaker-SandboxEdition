// Capture the scaled desk at two sizes, with hearts and trophies on display.
// The populated egg perch is rendered alone in a separate browser context.
// Usage: npm run desk:dast -- --base http://localhost:5191 --out <dir> [--theme dark|light]
// Needs a server you started (never port 5173). Headless Playwright Chromium, closed in a finally.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { deskShotClip } from './deskShotClip';
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
  // the ids of the games that hold a tin heart, as the hunt itself lists them
  const probe = await (await browser.newContext()).newPage();
  await probe.goto(`${base}/`, { waitUntil: 'load' });
  const heartIds = await probe.evaluate<string[]>(`(async () => {
    const m = await import('/src/tinHearts/tinHearts.ts');
    return (await m.huntStates()).map((s) => s.id);
  })()`);
  await probe.close();
  console.log(`${heartIds.length} hearts in the hunt`);

  for (const [name, w, h] of [['wide', 1440, 900] as const, ['phone', 390, 844] as const]) {
    const options = { viewport: { width: w, height: h }, deviceScaleFactor: name === 'wide' ? 2 : 1 };
    const ctx = await browser.newContext(options);
    await forceTheme(ctx, theme);
    await ctx.addInitScript((hearts) => {
      try {
        localStorage.setItem('gm-tin-hearts', JSON.stringify(Object.fromEntries(hearts.map((g: string) => [g, 'added']))));
        localStorage.setItem('gm-clock-heart', JSON.stringify({ found: new Date().toISOString() }));
        localStorage.setItem('gm-score-trophies', JSON.stringify({ best: 5, total: 5 }));
      } catch {
        /* storage blocked */
      }
    }, heartIds);
    const page = await ctx.newPage();
    await page.goto(`${base}/`, { waitUntil: 'load' });
    await page.waitForSelector('.desk-scene', { timeout: 60000 });
    await page.waitForTimeout(5000);
    await assertTheme(page, theme);
    await page.screenshot({ path: join(out, `room-${theme}-${name}.png`) });
    for (const sel of ['.game-shelf', '.heart-trophy', '.score-trophy-best', '.score-trophy-total', '.room-door', '.wall-clock']) {
      const el = page.locator(sel).first();
      const box = (await el.count()) ? await el.boundingBox() : null;
      if (box?.width) {
        const clip = deskShotClip(box, w, h);
        if (!clip) continue;
        await page.screenshot({ path: join(out, `close-${theme}-${name}-${sel.replace(/\W/g, '')}.png`), clip });
        console.log(`${name} ${sel} ${Math.round(box.width)}x${Math.round(box.height)}`);
      }
    }
    await ctx.close();

    const fixture = await browser.newContext(options);
    await forceTheme(fixture, theme);
    await fixture.addInitScript((eggs) => {
      localStorage.setItem('gm-eggs', JSON.stringify(Object.fromEntries(eggs.map((id) => [id, 'added']))));
    }, EGG_GAMES);
    const eggPage = await fixture.newPage();
    const fixtureUrl = new URL('/egg-perch-fixture', base).href;
    await eggPage.route(fixtureUrl, (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><meta name="viewport" content="width=device-width"><body style="display:grid;place-items:center;min-height:95vh">',
      }),
    );
    await eggPage.goto(fixtureUrl);
    await eggPage.evaluate(`(async () => {
      const { eggDisplay } = await import('/src/eggs/eggDisplay.ts');
      eggDisplay(el => document.body.append(el));
    })()`);
    await eggPage.locator('.egg-perch').screenshot({ path: join(out, `close-${theme}-${name}-eggperch.png`) });
    await fixture.close();
  }
} finally {
  await browser.close();
}
