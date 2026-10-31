// Renders TURBO BUTTON's three old-web screenshots (oldWebPages.ts) to public/magazine/oldweb-*.webp,
// 640 x 480 each, with a headless Chrome (playwright-core) and cwebp. Run from web/:
//   npx vite-node scripts/oldWebShots.ts [outDir-for-PNG-copies]
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { OLD_PAGES, frame } from './oldWebPages';

const out = join(__dirname, '../public/magazine');
const keep = process.argv[2];
const tmp = join(process.env.TMPDIR ?? '/tmp', 'oldweb-render');
mkdirSync(tmp, { recursive: true });
if (keep) mkdirSync(keep, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 640, height: 480 }, deviceScaleFactor: 1 });
for (const p of OLD_PAGES) {
  await page.setContent(frame(p));
  const png = join(keep ?? tmp, `${p.file}.png`);
  await page.screenshot({ path: png });
  writeFileSync(join(tmp, `${p.file}.html`), frame(p));
  execFileSync('cwebp', ['-q', '80', '-m', '6', '-quiet', png, '-o', join(out, `${p.file}.webp`)]);
}
await browser.close();
rmSync(tmp, { recursive: true, force: true });
