// Accessibility checks for the open dialog in a browser audit.
import type { Page } from 'playwright-core';

export async function axeOn(page: Page, axeSrc: string): Promise<string[]> {
  await page.addScriptTag({ content: axeSrc });
  return page.evaluate(async () => {
    // The last open dialog is the top one, the same one measure() checks.
    const top = [...document.querySelectorAll('dialog[open]')].pop() ?? document;
    // @ts-expect-error axe is a page global once injected
    const res = await axe.run(top, { resultTypes: ['violations'] });
    return res.violations.filter((v: { impact?: string }) => v.impact !== 'minor').map((v: { id: string; nodes: unknown[] }) => `${v.id} x${v.nodes.length}`);
  });
}
