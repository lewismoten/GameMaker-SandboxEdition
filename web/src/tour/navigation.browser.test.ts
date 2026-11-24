// Drive the tour controls over the actual BBS steps with the desk in each call state.
import { build } from 'esbuild';
import { chromium, type Browser, type Page } from 'playwright-core';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { bbsChapter } from './chapters/bbs';
import { captionOf } from './steps';

let browser: Browser;
let script: string;

beforeAll(async () => {
  const bundle = await build({
    stdin: {
      contents: `import { Tour } from './tourEngine';
        import { bbsChapter } from './chapters/bbs';
        export function start(previous) {
          const intro = { ...bbsChapter, id: 'intro', steps: [
            { id: 'one', action: 'say', say: 'First stop.' },
            { id: 'two', action: 'say', say: 'Second stop.' },
            { id: 'absent', action: 'point', optional: true, target: { css: '.absent' }, say: 'Absent.' }
          ] };
          return new Tour(previous ? [intro, bbsChapter] : [bbsChapter]).start();
        }`,
      resolveDir: 'src/tour',
    },
    define: { 'import.meta.url': 'location.href', 'import.meta.env.DEV': 'false' },
    loader: { '.css': 'empty' },
    bundle: true,
    write: false,
    globalName: 'fixture',
  });
  script = bundle.outputFiles[0].text;
  browser = await chromium.launch();
});
afterAll(async () => browser?.close());

async function start(page: Page, owned: boolean, previous = false) {
  await page.route('http://localhost/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<main class="desk" data-pc-busy><section class="desk-scene"><button class="modem">Modem</button><div class="crt">Screen</div></section></main>',
    }),
  );
  await page.goto('http://localhost/#/desk');
  if (owned) await page.locator('.desk').evaluate((el) => el.setAttribute('data-tour-bbs', 'on'));
  await page.addScriptTag({ content: script });
  await page.evaluate(`fixture.start(${previous})`);
  await page.locator('.tour-pause').click();
}

const caption = (page: Page, text: string) => page.locator('.tour-caption').filter({ hasText: text }).waitFor();
const bbs = (page: Page, id: string) =>
  caption(
    page,
    captionOf(
      bbsChapter,
      bbsChapter.steps.find((s) => s.id === id)!,
    ),
  );

it('disables Back at the first playable busy warning and ignores Left Arrow', async () => {
  const page = await browser.newPage();
  try {
    await start(page, false);
    await bbs(page, 'bbs-busy');
    expect(await page.locator('.tour-back').isDisabled()).toBe(true);
    // Replaying the warning would hide the ring and set the caption again.
    await page.evaluate(() => {
      const caption = document.querySelector<HTMLElement>('.tour-caption')!;
      new MutationObserver(() => {
        caption.dataset.replayed = 'true';
      }).observe(caption, { childList: true });
    });
    await page.keyboard.press('ArrowLeft');
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    expect(await page.locator('.tour-caption').getAttribute('data-replayed')).toBeNull();
    await page.locator('.tour-next').click();
    await page.locator('.tour-bar').waitFor({ state: 'detached' });
  } finally {
    await page.close();
  }
});

it('returns from the busy warning to the preceding chapter’s last playable step', async () => {
  const page = await browser.newPage();
  try {
    await start(page, false, true);
    await caption(page, 'First stop.');
    await page.locator('.tour-next').click();
    await caption(page, 'Second stop.');
    await page.locator('.tour-next').click();
    await bbs(page, 'bbs-busy');
    await page.locator('.tour-back').click();
    await caption(page, 'Second stop.');
    await page.keyboard.press('ArrowLeft');
    await caption(page, 'First stop.');
  } finally {
    await page.close();
  }
}, 20000);

it('skips the busy warning in both directions between Dial and Login on an owned call', async () => {
  const page = await browser.newPage();
  try {
    await start(page, true);
    for (const id of ['bbs-hello', 'bbs-sysop', 'bbs-dial']) {
      await bbs(page, id);
      await page.locator('.tour-next').click();
    }
    await bbs(page, 'bbs-login');
    await page.keyboard.press('ArrowLeft');
    await bbs(page, 'bbs-dial');
    await page.locator('.tour-next').click();
    await bbs(page, 'bbs-login');
    await page.locator('.tour-next').click();
    await bbs(page, 'bbs-ratio');
    // Login's optional screen is gone by the time the visitor presses Back.
    await page.locator('.crt').evaluate((el) => el.remove());
    await page.locator('.tour-back').click();
    await bbs(page, 'bbs-dial');
  } finally {
    await page.close();
  }
});
