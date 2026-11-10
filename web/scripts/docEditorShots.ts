// Retakes the screenshots of docs/editor.md and the README from a running preview of the site.
// Builds nothing: start `vite preview` (a scratch production build) on a port of your own first.
//   npx vite-node scripts/docEditorShots.ts -- --url http://localhost:5191 [--only 07-hero,web-home-sandbox] [--out dir]
// Each run starts a fresh Chromium (dark theme, 1440x900, no eggs found), opens Snowbound with Look
// inside and makes a copy through "Edit a copy". Editor shots become lossless WebP (needs cwebp), the
// two web-*.png shots stay PNG. Without --only it retakes every shot listed below.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Page } from 'playwright-core';
import { arg, launch } from './perfLib';
import { forceTheme, assertTheme } from './forceTheme';

type Clip = { x: number; y: number; width: number; height: number };
const base = arg('url');
if (!base) throw new Error('Give --url of a running preview, e.g. --url http://localhost:5191');
const root = resolve(import.meta.dirname, '../../docs/screenshots');
const out = resolve(arg('out') ?? root);
const only = arg('only')?.split(',');
const want = (id: string) => !only || only.includes(id);
const main: Clip = { x: 240, y: 60, width: 1200, height: 760 };

/** The Assistant's chat endpoint is replaced by a scripted stand-in model, so the shot needs no
 *  real AI provider and always shows the same short answer (after one game_summary tool call). */
const ANSWER = [
  'LaVale Mall is the last of the four levels, so it is the natural one to make harder. Two ideas:',
  '',
  '1. A second shopping-cart monster on the long aisle would make the hero time the run.',
  '2. Snow piles closer to the exit would make the last few dollars take more shoveling.',
  '',
  'Tell me which you prefer. In "Ask before changing" you see each step first.',
].join('\n');
const sse = (events: unknown[]) => events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join('') + 'data: [DONE]\n\n';

mkdirSync(out, { recursive: true });
const browser = await launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await forceTheme(ctx, 'dark');
  const open = async (hash: string, wait: number) => {
    const p = await ctx.newPage();
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await p.goto(`${base}/#${hash}`);
    await p.waitForTimeout(wait);
    return p;
  };
  const page = await open('/p/look:snowbound/snowbnd.gam', 5000);
  await assertTheme(page, 'dark');
  await page.getByRole('button', { name: /Edit a copy/ }).click();
  await page.waitForTimeout(4000);
  const copy = page.url().split('#')[1].split('/')[2];
  const file = (name: string, wait = 3000) => open(`/p/${copy}/${name}`, wait);

  const shot = async (p: Page, id: string, clip?: Clip) => {
    await p.waitForTimeout(1200);
    if (id.startsWith('web-')) {
      await p.screenshot({ path: `${out}/${id}.png`, clip });
    } else {
      const png = `${out}/${id}.tmp.png`;
      await p.screenshot({ path: png, clip });
      execFileSync('cwebp', ['-quiet', '-lossless', '-z', '9', png, '-o', `${out}/editor/${id}.webp`]);
      rmSync(png);
    }
    console.log('shot', id);
  };
  mkdirSync(`${out}/editor`, { recursive: true });

  if (want('web-home-sandbox')) {
    const p = await open('/', 4000);
    if (await p.locator('dialog[open]').count()) console.log('dialog:', (await p.locator('dialog[open]').first().innerText()).slice(0, 120));
    await p.keyboard.press('Escape');
    await p.getByRole('tab', { name: /Sandbox/ }).click();
    await p.waitForTimeout(1500);
    await p.locator('button.tile-select', { hasText: /^Snowbound/ }).click();
    await p.getByRole('button', { name: /^Watch demo of Snowbound/ }).click();
    await p.mouse.move(1000, 820); // off the tiles, so no hover icons show
    await p.waitForTimeout(7000);
    await shot(p, 'web-home-sandbox');
  }
  if (want('web-editor-snowbound')) await shot(await file('lavale.map', 5000), 'web-editor-snowbound');
  if (want('07-hero')) {
    const p = await file('kid.chr');
    await p.getByRole('tab', { name: /Sequences/ }).click();
    await shot(p, '07-hero', { ...main, height: 800 });
  }
  if (want('09-music')) await shot(await file('title.cmf'), '09-music', { ...main, height: 850 });
  if (want('10-sound-set')) await shot(await file('snow.snd'), '10-sound-set', { ...main, height: 700 });
  if (want('12-fli')) await shot(await file('intro.fli', 4000), '12-fli', main);
  if (want('13-slides')) {
    const p = await file('title.lst');
    await p
      .locator('.sl-name', { hasText: /title\.gif/i })
      .first()
      .click({ force: true }); // a still slide, so the preview is not blank
    await p.waitForTimeout(2000);
    await shot(p, '13-slides', main);
  }
  if (want('14-text')) await shot(await file('howto.txt'), '14-text', main);
  if (want('23-assistant')) {
    // Stand-in model: the settings point at a made-up provider and the chat route is answered here.
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem(
          'gm-ai-settings',
          JSON.stringify({
            provider: 'openai',
            baseUrl: 'https://example.invalid/v1',
            model: 'example-model',
            apiKey: 'none',
            tools: 'all',
            images: 'off',
            contextTokens: 128000,
            think: false,
          }),
        );
      } catch {
        /* no storage */
      }
    });
    const m = await file('lavale.map', 5000);
    await m.route('**/chat/completions', async (route) => {
      const body = route.request().postDataJSON() as { messages: { role: string }[] };
      const events = body.messages.some((x) => x.role === 'tool')
        ? [{ choices: [{ delta: { content: ANSWER }, finish_reason: null }] }, { choices: [{ delta: {}, finish_reason: 'stop' }] }]
        : [
            {
              choices: [
                {
                  delta: { tool_calls: [{ index: 0, id: 'call_1', type: 'function', function: { name: 'game_summary', arguments: '{}' } }] },
                  finish_reason: null,
                },
              ],
            },
            { choices: [{ delta: {}, finish_reason: 'tool_calls' }] },
          ];
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse(events) });
    });
    await m.route('**/models', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'example-model' }] }) }));
    await m
      .getByRole('button', { name: /Assistant|AI/ })
      .first()
      .click();
    await m.waitForTimeout(1500);
    await m.getByPlaceholder(/Ask, or say what to change/).fill('Which level should I make harder?');
    await m.getByRole('button', { name: 'Send' }).click();
    await m.waitForTimeout(5000);
    await shot(m, '23-assistant', { x: 480, y: 52, width: 960, height: 848 });
  }
} finally {
  await browser.close();
}
