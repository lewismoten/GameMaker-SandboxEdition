// Accessibility checks for the open dialog in a browser audit.
import type { Page } from 'playwright-core';

export async function axeOn(page: Page, axeSrc: string): Promise<string[]> {
  await page.addScriptTag({ content: axeSrc });
  return page.evaluate(async () => {
    // @ts-expect-error axe is a page global once injected
    const res = await axe.run(document.querySelector('dialog[open]') ?? document, { resultTypes: ['violations'] });
    return res.violations.filter((v: { impact?: string }) => v.impact !== 'minor').map((v: { id: string; nodes: unknown[] }) => `${v.id} x${v.nodes.length}`);
  });
}
