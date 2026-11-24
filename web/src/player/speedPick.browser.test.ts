// Exercise the player's canvas and toolbar with the window keyboard attached in Chromium.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('switches between DOS input and native toolbar navigation', async () => {
  const bundle = await build({
    stdin: {
      contents: `import { speedPick, toolbarKeyboard } from './src/player/speedPick';
        import { Keyboard } from '@lewismoten/gamemaker-sandbox-engine/input/keyboard';
        const canvas = document.querySelector('canvas');
        const corner = document.querySelector('.gm-corner');
        const keyboard = new Keyboard();
        keyboard.attach();
        toolbarKeyboard(canvas, corner, speedPick(corner, {}), () => keyboard.releaseAll());
        corner.querySelector('button').onclick = () => document.body.dataset.activated = 'yes';
        canvas.focus();
        export { keyboard };`,
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    outfile: 'picker.js',
    globalName: 'fixture',
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<canvas tabindex="0"></canvas><div class="gm-corner"><button>Keys</button></div>');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    const select = page.getByRole('combobox', { name: 'Run like a' });
    const typed = () => page.evaluate<string[]>('fixture.keyboard.typed.map(k => k.key)');
    await page.keyboard.press('Tab');
    expect(await page.locator('canvas:focus').count()).toBe(1);
    expect(await typed()).toEqual(['Tab']);
    await page.keyboard.press('Shift+F6');
    expect(await select.evaluate((el) => el === document.activeElement)).toBe(true);
    for (const preset of ['486', '386', '286']) {
      await page.keyboard.press('ArrowDown');
      expect(await select.inputValue()).toBe(preset);
      expect(await select.evaluate((el) => el === document.activeElement)).toBe(true);
    }
    await page.keyboard.press('Tab');
    expect(await page.getByRole('button', { name: 'Keys' }).evaluate((el) => el === document.activeElement)).toBe(true);
    await page.keyboard.press('Space');
    expect(await page.locator('body').getAttribute('data-activated')).toBe('yes');
    await page.keyboard.press('Shift+Tab');
    expect(await select.evaluate((el) => el === document.activeElement)).toBe(true);
    await page.keyboard.press('ArrowRight');
    expect(await select.inputValue()).toBe('ps1');
    expect(await select.evaluate((el) => el === document.activeElement)).toBe(true);
    await page.keyboard.press('Shift+Tab');
    expect(await page.locator('canvas:focus').count()).toBe(1);
    await page.keyboard.press('Shift+F6');
    await page.keyboard.press('Shift+F6');
    expect(await page.locator('canvas:focus').count()).toBe(1);
    await page.keyboard.press('Tab');
    expect(await typed()).toEqual(['Tab', 'Shift', 'Shift', 'Tab']);
    expect(await page.evaluate('fixture.keyboard.down.size')).toBe(0);
  } finally {
    await browser.close();
  }
});
