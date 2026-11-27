// Waits for a stable view of the desk before the driver continues.
import type { Page } from 'playwright-core';

type Clip = { x: number; y: number; width: number; height: number };
export const SCREEN: Clip = { x: 420, y: 60, width: 600, height: 440 };

/** Waits until the clip stops changing (two identical screenshots a beat apart). */
export async function settle(page: Pick<Page, 'screenshot' | 'waitForTimeout'>, clip: Clip = SCREEN, timeout = 15000): Promise<void> {
  const end = Date.now() + timeout;
  let last = '';
  while (Date.now() < end) {
    const now = (await page.screenshot({ clip })).toString('base64');
    if (now === last) return;
    last = now;
    await page.waitForTimeout(250);
  }
  throw new Error(`Desk screen did not settle within ${timeout} ms.`);
}
