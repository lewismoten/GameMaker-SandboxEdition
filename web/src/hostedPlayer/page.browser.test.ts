// A failed save download replaces the previous success in the hosted player's live status.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it.each([
  ['Export all (.zip)', 'every game’s saves'],
  ['Export the saves of Nebula', 'the saves of Nebula'],
])('replaces success after a failed retry of %s', async (buttonName, description) => {
  const bundle = await build({
    stdin: {
      contents: `import { renderFront } from './page';
        import { writeSave } from './saves';
        export const save = value => writeSave('nebula', 'game0.sav', new Uint8Array([value]));
        export const show = () => renderFront(document.body, { games: [{ id: 'nebula', title: 'Nebula' }] }, null);`,
      resolveDir: 'src/hostedPlayer',
    },
    bundle: true,
    write: false,
    globalName: 'fixture',
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.evaluate('fixture.save(1).then(fixture.show)');
    const button = page.getByRole('button', { name: buttonName, exact: true });
    const status = page.getByRole('status');
    await button.click();
    await expect.poll(() => status.innerText()).toBe(`Exported ${description}.`);
    await page.evaluate('fixture.save(2)');
    await page.evaluate(() => {
      URL.createObjectURL = () => {
        throw new Error('Download refused');
      };
    });
    await button.click();
    await expect.poll(() => status.innerText()).toBe(`Could not export ${description}. Try again.`);
  } finally {
    await browser.close();
  }
});
