// Checks selectable per-file tiers, a Core-only cold start, then the five game groups and narration offline.
// Never run against the maintainer's dev server.
//
// Needs a PRODUCTION build, because the service worker is only in one: build to a scratch folder
// (`npx vite build --outDir <tmp>/dist`, through `npm run heavy --`), then
//   npm run check:offline -- --dist <tmp>/dist [--port 5193]
// (it previews that folder on --port, never 5173), or point it at a server you started yourself:
//   npm run check:offline -- --url http://localhost:5193/
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { target, launch, arg } from './perfLib';
import { forceTheme } from './forceTheme';
import { measure } from './dialogsFitMeasure';

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
  // vite preview sends a .gz copy with Content-Encoding (the browser unpacks it); GitHub Pages sends
  // it as application/gzip bytes, which the manifest hashes. Serve them the Pages way.
  const dist = arg('dist');
  if (dist)
    await ctx.route(/\.gz(\?|$)/, async (route) => {
      const path = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/+/, '');
      try {
        await route.fulfill({ status: 200, contentType: 'application/gzip', body: readFileSync(resolve(dist, path)) });
      } catch {
        await route.fulfill({ status: 404, body: '' });
      }
    });
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
  // Failed requests and page errors, printed when the offline copy fails.
  const failures: string[] = [];
  ctx.on('requestfailed', (r) => failures.push(`failed ${r.url()} ${r.failure()?.errorText ?? ''}`));
  ctx.on('response', (r) => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') failures.push(`console ${m.type()}: ${m.text().slice(0, 300)}`);
  });
  page.on('pageerror', (e) => failures.push(`pageerror: ${e.message}`));
  // Waits for the copy, printing the dialog's progress every 20 s so a stall shows where it stopped.
  const waitReady = async () => {
    const deadline = Date.now() + 900000;
    while (!(await page.getByText(/Ready offline/).isVisible())) {
      if (Date.now() > deadline) throw new Error('The offline copy did not finish in 15 minutes.');
      if (await page.getByText(/could not finish/).isVisible()) throw new Error(`The offline copy failed:\n${failures.slice(-20).join('\n')}`);
      const progress = await page
        .locator('dialog[open]')
        .innerText()
        .catch(() => '(no dialog)');
      console.log(`  … ${progress.replace(/\s+/g, ' ').slice(0, 200)}`);
      await page.waitForTimeout(20000);
    }
  };
  const zipRequests: string[] = [];
  page.on('request', (r) => {
    if (/\/offline\.[^/]+\.zip(?:[?#]|$)/.test(r.url())) zipRequests.push(r.url());
  });
  const spoken = () => page.evaluate(() => (window as unknown as { __speak: number }).__speak);
  page.on('pageerror', (e) => failed.push(`${phase} page error: ${e.message.slice(0, 120)}`));
  ctx.on('requestfailed', (r) => {
    let from: string;
    try {
      from = r.serviceWorker() ? 'service worker' : r.frame().url().replace(base, '');
    } catch {
      from = 'a worker';
    }
    failed.push(`${phase} ${r.url().replace(base, '')} ${r.failure()?.errorText} (from ${from || '/'}, ${r.resourceType()})`);
  });
  ctx.on('response', (r) => {
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
  const manifestResponse = await ctx.request.get(`${base}offline.json`);
  if (!manifestResponse.ok()) throw new Error('Could not read the production offline manifest.');
  const manifest = (await manifestResponse.json()) as { files: { path: string; sha256: string; tier: string }[] };
  check(
    'per-file manifest has integrity metadata',
    manifest.files.every((f) => /^[a-f0-9]{64}$/.test(f.sha256)),
  );
  check(
    'Core is always selected',
    (await page.getByRole('checkbox', { name: /^Core/ }).isChecked()) && (await page.getByRole('checkbox', { name: /^Core/ }).isDisabled()),
  );
  // Measure the real production picker, including all tier names and their sizes.
  for (const [width, height] of [
    [375, 812],
    [390, 844],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    const fit = await measure(page);
    check(`tier picker fits ${width}x${height}`, fit.open && fit.problems.length === 0, fit.problems.join('; '));
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  check('Specials has its own public choice', (await page.getByRole('checkbox', { name: /^Specials/ }).count()) === 1);
  {
    await page.locator('dialog[open] button.primary').click();
    await waitReady();
    check('Core-only copy finishes without a ZIP', zipRequests.length === 0);
    await page.keyboard.press('Escape');
    await ctx.setOffline(true);
    phase = 'offline';
    await page.goto(base);
    await page.waitForTimeout(2500);
    check('Core cold start loads offline', (await page.getByText('Web', { exact: true }).count()) > 0 || (await page.locator('.lib-cats').count()) > 0);
    await page
      .getByText('Web', { exact: true })
      .first()
      .click()
      .catch(() => undefined);
    await page.getByRole('tab', { name: /Starters/ }).click();
    await page.locator('.lib-tiles .game-tile .tile-select').first().click();
    await page
      .getByText(/Not in your offline copy/)
      .first()
      .waitFor();
    check('Core-only game actions explain absent packs', true);
    await ctx.setOffline(false);
    phase = 'online';
    await page
      .getByRole('button', { name: /Settings/i })
      .first()
      .click();
    await page
      .getByText(/Play offline|Make available offline/)
      .first()
      .click();
    for (const name of [/^Starters/, /^Sandbox/, /^Specials/, /^Bizarre/, /^CD/, /^Feelies/, /^Spoken/, /^Hardware/]) {
      await page.getByRole('checkbox', { name }).check();
      await page.getByText(/Checking selected files/).waitFor({ state: 'hidden', timeout: 120000 });
    }
    const go = page.locator('dialog[open] button.primary');
    await go.waitFor({ timeout: 30000 });
    await go.click();
    await waitReady();
    const ready = (await page.locator('dialog[open]').innerText()).replace(/\s+/g, ' ');
    check('the offline copy finishes', true, ready);
    await page.keyboard.press('Escape');

    check('no offline ZIP was requested', zipRequests.length === 0);
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
  }
} finally {
  await browser.close();
  srv.stop();
}
const bad = rows.filter((r) => !r.ok).length;
console.log(`\n${bad ? `${bad} FAILED` : 'All passed'} (${rows.length} checks)`);
process.exit(bad ? 1 : 0);
