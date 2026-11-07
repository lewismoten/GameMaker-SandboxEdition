// Headless check of the home page's deeper search (editor/shell/homeDeepSearch.ts) against a dev
// server of its own: finds a word that is only inside one game's text file, shows the result
// widening with its "found in" hint, the live announcement, axe at 1440 and 390 in light and dark,
// no horizontal scroll, and the slowest key event while typing during indexing. Usage:
//   npx vite-node scripts/deepSearchCheck.ts <port> <out-dir>
import { launch } from './perfLib';
import { spawn } from 'node:child_process';
import { readdirSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { join } from 'node:path';
import { forceTheme, assertTheme } from './forceTheme';

const port = Number(process.argv[2] ?? 5600);
const out = process.argv[3] ?? '.';
mkdirSync(out, { recursive: true });
const axeSrc = readFileSync(resolve('../node_modules/axe-core/axe.min.js'), 'utf8');
const root = join(process.cwd(), '..', 'games');

/** A long word found in exactly one non-secret game's .TXT file, and not in any listing. */
function pickWord(): { word: string; game: string; file: string } {
  const seen = new Map<string, Set<string>>();
  const where = new Map<string, string>();
  let listing = '';
  for (const g of readdirSync(root)) if (existsSync(join(root, g, 'about.json'))) listing += readFileSync(join(root, g, 'about.json'), 'utf8').toLowerCase();
  for (const g of readdirSync(root)) {
    const about = join(root, g, 'about.json');
    if (!existsSync(about) || JSON.parse(readFileSync(about, 'utf8')).secret) continue;
    const disk = join(root, g, 'disk');
    if (!existsSync(disk)) continue;
    for (const f of readdirSync(disk).filter((n) => /\.txt$/i.test(n))) {
      for (const w of readFileSync(join(disk, f), 'latin1')
        .toLowerCase()
        .match(/[a-z]{8,12}/g) ?? []) {
        (seen.get(w) ?? seen.set(w, new Set()).get(w)!).add(g);
        where.set(w, `${g}|${f}`);
      }
    }
  }
  for (const [w, games] of seen) {
    if (games.size === 1 && !listing.includes(w)) {
      const [game, file] = where.get(w)!.split('|');
      return { word: w, game, file };
    }
  }
  throw new Error('no unique word');
}

async function main() {
  const { word, game, file } = pickWord();
  console.log('word', word, 'in', game, file);
  const server = spawn('npx', ['vite', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { stdio: 'pipe' });
  await new Promise<void>((res, rej) => {
    const t = setTimeout(() => rej(new Error('dev server did not start')), 240000);
    server.stdout.on('data', (d: Buffer) => /Local:/.test(String(d)) && (clearTimeout(t), res()));
  });
  const browser = await launch();
  let failed = false;
  try {
    for (const theme of ['light', 'dark'] as const) {
      for (const width of [1440, 390]) {
        const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, colorScheme: theme });
        await forceTheme(ctx, theme);
        const page = await ctx.newPage();
        const requests: string[] = [];
        page.on('request', (r) => requests.push(r.url()));
        await page.goto(`http://127.0.0.1:${port}/#/`, { waitUntil: 'load', timeout: 240000 });
        const input = page.locator('input.lib-search');
        await input.waitFor({ timeout: 120000 });
        await assertTheme(page, theme);
        const before = requests.length;
        // no deep reads before the box is used
        const early = requests.filter((u) => /deepIndex|deepExtract/.test(u)).length;
        await page.evaluate(() => {
          (window as unknown as { __ev: number[] }).__ev = [];
          new PerformanceObserver((l) => l.getEntries().forEach((e) => (window as unknown as { __ev: number[] }).__ev.push(e.duration))).observe({
            type: 'event',
            durationThreshold: 16,
            buffered: true,
          } as PerformanceObserverInit);
        });
        await input.focus();
        await input.pressSequentially(word, { delay: 70 });
        const tag = `${theme}-${width}`;
        const t0 = Date.now();
        let found = false;
        // the search is on the current collection; the "elsewhere" buttons or tiles show the widening
        while (Date.now() - t0 < 180000 && !found) {
          found = (await page.locator('.tile-hint:visible').count()) > 0 || (await page.locator('.lib-elsewhere').count()) > 0;
          if (!found) await page.waitForTimeout(1000);
        }
        const hint = await page
          .locator('.tile-hint')
          .first()
          .textContent()
          .catch(() => null);
        const live = await page
          .locator('p.vh[role=status]')
          .first()
          .textContent()
          .catch(() => null);
        const elsewhere = await page.locator('.lib-elsewhere').allTextContents();
        const slowest = await page.evaluate(() => Math.max(0, ...(window as unknown as { __ev: number[] }).__ev));
        const scrollX = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        await page.addScriptTag({ content: axeSrc });
        const axeResult = await page.evaluate(async () => {
          // @ts-expect-error axe is a page global once injected
          const res = await axe.run(document, { resultTypes: ['violations'] });
          return { violations: res.violations.map((v: { id: string; nodes: unknown[] }) => ({ id: `${v.id} x${v.nodes.length}` })) };
        });
        console.log(tag, {
          found,
          hint,
          live,
          elsewhere,
          slowestKeyEventMs: Math.round(slowest),
          hScroll: scrollX,
          earlyDeepRequests: early,
          requestsAtLoad: before,
          axe: axeResult.violations.map((v: { id: string }) => v.id),
        });
        if (!found || scrollX || axeResult.violations.length) failed = true;
        await page.screenshot({ path: join(out, `search-${tag}.png`) });
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
    server.kill();
  }
  process.exit(failed ? 1 : 0);
}
void main();
