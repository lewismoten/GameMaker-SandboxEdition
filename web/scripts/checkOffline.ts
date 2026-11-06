// Does the offline copy really work? In a headless browser it uses ⚙ Settings › Play offline to
// download the whole site, switches the network off, and checks that the web home, a Starter, the
// 1994 desk, the wall phone (recorded clips, never the browser's own voice) and the guided tour
// (its voice clips) all still work, and that no request fails. Prints PASS/FAIL per check; exits 1
// on a FAIL. About 3 to 6 minutes (it downloads about 75 MB into a throwaway browser profile).
//
// Needs a PRODUCTION build, because the service worker is only in one: build to a scratch folder
// (`npx vite build --outDir <tmp>/dist`, through `npm run heavy --`), then
//   npm run check:offline -- --dist <tmp>/dist [--port 5193]
// (it previews that folder on --port, never 5173), or point it at a server you started yourself:
//   npm run check:offline -- --url http://localhost:5193/
import { target, launch, arg } from './perfLib';
import { forceTheme } from './forceTheme';

interface Row {
  name: string;
  ok: boolean;
  note: string;
}
const rows: Row[] = [];
const check = (name: string, ok: boolean, note = '') => {
  rows.push({ name, ok, note });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${note ? `: ${note}` : ''}`);
};

if (!arg('dist') && !arg('url')) {
  console.error(
    'Usage: npm run check:offline -- --dist <scratch production build folder> [--port 5193]\n   or: npm run check:offline -- --url <a server of a production build>',
  );
  process.exit(2);
}

const srv = await target(5193);
const base = srv.base.replace(/\/?$/, '/');
const browser = await launch();
let phase = 'online';
const failed: string[] = [];
const clips: string[] = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'allow' });
  await forceTheme(ctx, 'light');
  // counts every call of the browser's own speech
  await ctx.addInitScript(() => {
    (window as unknown as { __speak: number }).__speak = 0;
    try {
      const s = window.speechSynthesis;
      const orig = s.speak.bind(s);
      s.speak = (u: SpeechSynthesisUtterance) => {
        (window as unknown as { __speak: number }).__speak++;
        return orig(u);
      };
    } catch {
      /* no speech in this browser */
    }
  });
  const page = await ctx.newPage();
  const spoken = () => page.evaluate(() => (window as unknown as { __speak: number }).__speak);
  page.on('pageerror', (e) => failed.push(`${phase} page error: ${e.message.slice(0, 120)}`));
  page.on('requestfailed', (r) => failed.push(`${phase} ${r.url().replace(base, '')} ${r.failure()?.errorText}`));
  page.on('response', (r) => {
    if (phase !== 'offline') return;
    const url = r.url().replace(base, '');
    if (/\.ogg$/.test(url) && r.status() === 200) clips.push(url);
    else if (r.status() >= 400) failed.push(`offline ${r.status()} ${url}`);
  });

  // 1. the offline copy
  await page.goto(base);
  await page.getByText('Web', { exact: true }).first().click();
  await page.waitForTimeout(1500);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page
    .getByRole('button', { name: /Settings/i })
    .first()
    .click();
  await page
    .getByText(/Play offline|Make available offline/)
    .first()
    .click();
  const go = page.locator('dialog[open] button.primary');
  await go.waitFor({ timeout: 30000 });
  await go.click();
  await page.getByText(/Ready offline/).waitFor({ timeout: 900000 });
  const ready = (await page.locator('dialog[open]').innerText()).replace(/\s+/g, ' ');
  check(
    'the offline copy finishes',
    true,
    ready.match(/All \d+ games.*?\(([\d.]+ \w+)\)/)?.[0].replace(/ the 1994 desk, the editors, the manuals and the boxes are kept in this browser/, '') ?? '',
  );
  await page.keyboard.press('Escape');

  // 2. no network from here on
  await ctx.setOffline(true);
  phase = 'offline';
  await page.goto(base);
  await page.waitForTimeout(3000);
  check('the web home loads offline', (await page.locator('.lib-cats').count()) > 0 || (await page.getByText('Web', { exact: true }).count()) > 0);

  // 3. a Starter
  await page
    .getByText('Web', { exact: true })
    .first()
    .click()
    .catch(() => undefined);
  await page.waitForTimeout(800);
  await page.getByRole('tab', { name: /Starters/ }).click();
  await page.waitForTimeout(800);
  const tiles = await page.locator('.lib-tiles .game-tile').count();
  check('the Starters are listed', tiles > 0, `${tiles} tiles`);
  if (tiles) {
    await page.locator('.lib-tiles .game-tile .tile-select').first().click();
    await page.waitForTimeout(500);
    await page.locator('.showcase .sc-play, .showcase .sc-actions .primary').first().click();
    await page.waitForTimeout(8000);
    const bypass = page.getByRole('button', { name: 'Bypass setup' });
    if (await bypass.count()) await bypass.click();
    await page.waitForTimeout(5000);
    const playing = /play-.*\.html/.test(page.url()) && (await page.locator('canvas').count()) > 0;
    check('a Starter plays', playing, page.url().replace(base, ''));
  }

  // 4. the desk and its phone
  await page.goto(`${base}#/desk`);
  await page.waitForTimeout(4000);
  check('the desk loads offline', (await page.locator('.desk-scene').count()) > 0);
  const before = await spoken();
  const mark = clips.length;
  await page.locator('.desk-scene .prop-cover[aria-label^="Wall telephone"]').first().click();
  await page.waitForTimeout(1200);
  for (const k of '5550123') {
    await page.keyboard.press(k);
    await page.waitForTimeout(150);
  }
  // Grandma rings a while, then talks: wait for her first clips
  for (let i = 0; i < 20 && clips.slice(mark).filter((c) => c.includes('phone/voice/')).length < 3; i++) await page.waitForTimeout(5000);
  const phoneClips = clips.slice(mark).filter((c) => c.includes('phone/voice/')).length;
  await page.keyboard.press('Escape');
  check('the phone plays recorded clips', phoneClips >= 3, `${phoneClips} clips`);
  check('the phone does not use the browser’s voice', (await spoken()) === before, `${(await spoken()) - before} speech calls`);

  // 5. the tour
  await page.goto(`${base}#/?tour=home`);
  await page.waitForTimeout(12000);
  const tourClips = clips.filter((c) => c.includes('tour/voice/')).length;
  check('the tour plays its voice clips', tourClips >= 1, `${tourClips} clips`);
  check('nothing used the browser’s voice', (await spoken()) === 0, `${await spoken()} speech calls in all`);

  // 6. no request failed once offline
  const offlineFailures = failed.filter((f) => f.startsWith('offline'));
  check('no request failed offline', offlineFailures.length === 0, offlineFailures.slice(0, 8).join(' ; '));
} finally {
  await browser.close();
  srv.stop();
}
const bad = rows.filter((r) => !r.ok).length;
console.log(`\n${bad ? `${bad} FAILED` : 'All passed'} (${rows.length} checks)`);
process.exit(bad ? 1 : 0);
