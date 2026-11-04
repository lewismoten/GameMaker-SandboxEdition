// Renders an SVG to a PNG with Playwright's bundled Chromium (headless, closed afterwards).
// usage: node svg2png.mjs in.svg out.png [height_px]   (needs the web/ workspace installed: playwright is resolved from web/)
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const web = process.env.WEB_DIR || fileURLToPath(new URL('../../../../package.json', import.meta.url));
const { chromium } = createRequire(web)('playwright-core');
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , inp, out, h = '2400'] = process.argv;
const svg = readFileSync(resolve(inp), 'utf8');
const m = svg.match(/viewBox="([\d.\-\s]+)"/);
const [, , vw, vh] = m ? m[1].trim().split(/\s+/).map(Number) : [0, 0, 100, 100];
const H = Number(h);
const W = Math.round((H * vw) / vh);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.setContent(
    `<body style="margin:0;background:#1d4a2c"><img style="width:${W}px;height:${H}px" src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}"></body>`,
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: resolve(out) });
} finally {
  await browser.close();
}
console.log(`${out}: ${W}x${H}`);
