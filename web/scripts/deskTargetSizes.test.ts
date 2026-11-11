// Browser regression for the desk controls' rendered target size, including desktop PC scaling.
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Browser } from 'playwright-core';
import { launch } from './perfLib';

vi.setConfig({ testTimeout: 30_000, hookTimeout: 60_000 }); // a browser launch is slow on a busy machine
let browser: Browser;
beforeAll(async () => {
  browser = await launch();
});
afterAll(async () => {
  await browser?.close();
});
const css =
  readFileSync(new URL('../src/desk/desk.css', import.meta.url), 'utf8') +
  '\n' +
  ['capture', 'blasterSwitch', 'tray'].map((name) => readFileSync(new URL(`../src/desk/pc/${name}.css`, import.meta.url), 'utf8')).join('\n');

describe('desk control target sizes', () => {
  for (const width of [1440, 390]) {
    it(`keeps the floppy hit area above its decorative slot at ${width}px`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      try {
        await page.setContent(`<style>${css}</style><div class="drive fdd" style="--mm:1px;position:absolute;left:100px;top:100px;width:100px;height:26px">
          <span class="slot"></span><button class="eject-btn flat" aria-label="Eject disk"></button><span class="bay-label">A:</span></div>`);
        expect(
          await page.locator('.eject-btn.flat').evaluate((el) => {
            const r = el.getBoundingClientRect();
            return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2 - 11.9) === el;
          }),
        ).toBe(true);
      } finally {
        await page.close();
      }
    });
    it(`keeps power and eject hit areas at least 24px at ${width}px`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      try {
        await page.setContent(`<style>${css}</style><div class="case" style="--mm:1px;position:relative">
          <button class="case-btn power">Power</button><button class="eject-btn wide">CD</button>
          <div class="drive fdd"><button class="eject-btn flat">Disk</button></div></div>`);
        const targets = await page.locator('button').evaluateAll((els) =>
          els.map((el) => {
            const hit = getComputedStyle(el, '::before');
            return { name: el.textContent, width: parseFloat(hit.width), height: parseFloat(hit.height) };
          }),
        );
        const scale = width === 1440 ? 0.963636 : 1;
        for (const target of targets) {
          expect(target.width * scale, `${target.name} hit width`).toBeGreaterThanOrEqual(24);
          expect(target.height * scale, `${target.name} hit height`).toBeGreaterThanOrEqual(24);
        }
      } finally {
        await page.close();
      }
    });
    it(`keeps capture, sound and tray controls at least 24px at ${width}px`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      try {
        await page.setContent(`<style>${css}</style>
          <div style="transform:scale(${width === 1440 ? 0.963636 : 1});transform-origin:top left">
            <div class="monitor" style="position:relative;width:100px;height:100px"><button class="enlarge" aria-label="Enlarge screen">⤢</button></div>
            <div class="desk-capture"><button class="cap-btn" aria-label="Screenshot">📷</button><button class="cap-btn cap-rec" aria-label="Record">⏺</button></div>
            <button class="sb-switch ${width === 390 ? 'sb-mobile-switch' : ''}" aria-label="Sound Boaster"><span class="sb-print">SOUND<br>BOASTER</span><span class="sb-track"></span></button>
            ${width === 1440 ? '<button class="tray-handle" aria-label="Keyboard tray"></button>' : ''}
          </div>`);
        const targets = await page
          .locator('button')
          .evaluateAll((els) =>
            els.map((el) => ({ name: el.getAttribute('aria-label'), width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })),
          );
        for (const target of targets) {
          expect(target.width, `${target.name} width`).toBeGreaterThanOrEqual(24);
          expect(target.height, `${target.name} height`).toBeGreaterThanOrEqual(24);
        }
      } finally {
        await page.close();
      }
    });
  }
});
