// Catch Doc Leo's glance by keyboard with reduced motion enabled throughout the visit.
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('offers a stationary glance cue and the usual grace period', async () => {
  const script = await build({
    entryPoints: ['src/desk/props/blacklight.ts'],
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'poster',
    define: { 'import.meta.env.DEV': 'false', 'import.meta.url': 'document.baseURI' },
    loader: { '.css': 'empty' },
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    await page.setContent('<main class="desk"><div class="desk-scene"></div></main>');
    await page.addStyleTag({ content: readFileSync('src/desk/props/props.css', 'utf8') });
    await page.clock.install({ time: new Date('2000-01-01T12:00:00Z') });
    await page.clock.pauseAt(new Date('2000-01-01T12:01:00Z'));
    await page.addScriptTag({ content: script.outputFiles[0].text });
    await page.addScriptTag({
      content: `Math.random = () => 0;
      window.addEventListener('gm-achievement', e => {
        if (e.detail.id === 'desk-glance') document.body.dataset.caught = 'yes';
      });
      poster.blackLight(document.querySelector('main'));`,
    });
    const button = page.getByRole('button', { name: /Black-light poster/ });
    await button.press('Enter');
    const caught = () => page.locator('body').getAttribute('data-caught');
    expect(await caught()).toBeNull();
    await page.clock.runFor(90_050);
    expect(await page.getByRole('status').textContent()).toContain('glances');
    const bubble = page.locator('.prop-bubble');
    expect(await bubble.isVisible()).toBe(true);
    expect(await bubble.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    expect(await page.locator('.bl-print.day').getAttribute('src')).toBe('./desk/docleo-blacklight-day.webp');
    await page.clock.runFor(21_500);
    expect(await caught()).toBeNull();
    await button.press('Enter');
    expect(await caught()).toBe('yes');
  } finally {
    await browser.close();
  }
});
