// Keep keyboard focus visible when switching between the ends of a narrow category strip.
import { expect, it } from 'vitest';
import { editorBrowser } from '../../test/editorBrowser';

it('keeps the focused achievement tab inside the strip after End and Home at 320px', async () => {
  const fixture = await editorBrowser();
  const { page } = fixture;
  try {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.evaluate("import('/src/achievements/page.ts').then(m => m.renderAchievements(document.querySelector('#host')))");
    await page.getByRole('tab', { name: /Making games/ }).focus();
    for (const [key, title] of [
      ['End', 'Found it'],
      ['Home', 'Making games'],
    ]) {
      await page.keyboard.press(key);
      const focused = page.locator('[role="tab"]:focus');
      expect(await focused.textContent()).toContain(title);
      const tab = await focused.boundingBox();
      const strip = await page.getByRole('tablist').boundingBox();
      // Scroll offsets round to pixels while layout bounds can be fractional.
      expect(Math.round(tab!.x)).toBeGreaterThanOrEqual(Math.round(strip!.x));
      expect(Math.round(tab!.x + tab!.width)).toBeLessThanOrEqual(Math.round(strip!.x + strip!.width));
    }
  } finally {
    await fixture.close();
  }
}, 30_000);
