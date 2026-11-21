// Measure the actual shareware start screen, including its optional notice and touch controls.
import type { Page } from 'playwright-core';

export async function playerStartProblems(page: Page, portrait: boolean): Promise<string[]> {
  const player = page.locator('.gm-player.touch-' + (portrait ? 'portrait' : 'landscape'));
  await player.locator('.gm-notice-link').waitFor();
  await page.evaluate(() => document.fonts.ready);
  return player.evaluate((root, upright) => {
    const problems: string[] = [];
    const rect = (selector: string) => root.querySelector(selector)!.getBoundingClientRect();
    const poster = rect('.gm-start');
    for (const selector of ['.gm-corner', '.gm-hardware-launch', '.gm-notice-link', '.gm-pad', '.gm-actions', '.gm-sys']) {
      const box = rect(selector);
      if (upright && box.top < poster.bottom - 1) problems.push(selector + ' overlaps the start poster');
    }
    for (const el of root.querySelectorAll<HTMLElement>(
      '.gm-start > *, .gm-corner :is(a,button,select), .gm-hardware-launch :is(label,button), .gm-notice-link, .gm-sys button, .gm-pad, .gm-actions button',
    )) {
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      const control = el.closest('button,a,label,select') ?? el;
      if (!control.contains(hit)) problems.push((el.textContent?.trim() || el.className) + ' is covered');
    }
    return problems;
  }, portrait);
}
