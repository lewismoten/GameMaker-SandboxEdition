// A long Blocks picker scrolls the side column while its tab buttons remain clickable.
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('keeps desktop map tabs clickable at the last block', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    await page.setContent(
      `<div class="stack mt-side-col" style="width:260px;--side-col-room:400px"><div></div><div class="panel-tabs"><div class="panel-tabs-list"><button>Blocks</button><button>Monsters</button></div><div class="stack"><div class="block-picker">${'<button>Tile</button>'.repeat(200)}</div></div></div></div>`,
    );
    for (const file of ['shell/editor.css', 'widgets/panelTabs.css', 'editors/map/tools/mapTools.css'])
      await page.addStyleTag({ content: readFileSync('src/editor/' + file, 'utf8') });
    const column = page.locator('.mt-side-col');
    expect(
      await column.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
        return el.scrollTop;
      }),
    ).toBeGreaterThan(0);
    const button = page.getByRole('button', { name: 'Monsters' });
    expect(
      await button.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2) === el;
      }),
    ).toBe(true);
    await button.click();
  } finally {
    await browser.close();
  }
});
