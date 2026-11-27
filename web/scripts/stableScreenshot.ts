// Capture consecutive frames for the desktop editor screenshot check.
import type { Page } from 'playwright-core';

export async function stableScreenshot(page: Pick<Page, 'screenshot' | 'waitForTimeout'>, route: string, scheme: string) {
  let last = await page.screenshot();
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    const now = await page.screenshot();
    if (now.equals(last)) return now;
    last = now;
  }
  throw new Error(`Editor screenshot did not stabilize for ${route} (${scheme}) after 21 frames.`);
}
