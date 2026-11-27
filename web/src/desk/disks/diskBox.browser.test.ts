// Exercise divider controls and disk selection in the real disk box.
import { expect, it } from 'vitest';
import { editorBrowser } from '../../../test/editorBrowser';

async function fixture() {
  const browser = await editorBrowser();
  const open = () =>
    browser.page.addScriptTag({
      type: 'module',
      content: `import { openDiskBox } from '/src/desk/disks/diskBox.ts';
      openDiskBox([{id:'blank', title:'Blank disk', kind:'blank', bytes:0}], undefined, () => {});`,
    });
  return { ...browser, open };
}

it('explains why the expanded divider cannot fold during search and restores its saved state', async () => {
  const { page, open, close } = await fixture();
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await open();
    const fold = page.locator('.divider-tab');
    await fold.click();
    const search = page.getByRole('searchbox');
    const explanation = page.getByText('Clear the search to fold a group.');
    expect(await explanation.isVisible()).toBe(false);
    await search.focus();
    await page.keyboard.type('blank');
    expect(await explanation.isVisible()).toBe(true);
    expect(await search.getAttribute('aria-describedby')).toBe(await explanation.getAttribute('id'));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await fold.getAttribute('aria-expanded')).toBe('true');
    expect(await fold.isDisabled()).toBe(true);
    expect(await fold.getAttribute('title')).toMatch(/clear.*search.*fold/i);
    await search.fill('');
    expect(await explanation.isVisible()).toBe(false);
    expect(await fold.isEnabled()).toBe(true);
    expect(await fold.getAttribute('aria-expanded')).toBe('false');
    expect(await fold.getAttribute('title')).toMatch(/^Open /);
  } finally {
    await close();
  }
});
