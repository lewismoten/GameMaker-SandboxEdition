// The toolbar uses the same vertical spacing on touch and desktop.
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('uses the base toolbar row gap on touch screens', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ hasTouch: true });
    await page.setContent('<div class="snd-top"></div>');
    await page.addStyleTag({ path: 'src/editor/editors/sounds/sounds.css' });
    const gaps = await page.locator('.snd-top').evaluate((toolbar) => {
      const initial = getComputedStyle(toolbar).rowGap;
      // Vary the base gap to detect a touch override even when the values currently agree.
      const base = Array.from(document.styleSheets[0].cssRules).find(
        (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && rule.selectorText === '.snd-top',
      );
      base!.style.rowGap = '12px';
      return [initial, getComputedStyle(toolbar).rowGap];
    });
    expect(gaps).toEqual(['8px', '12px']);
  } finally {
    await browser.close();
  }
});
