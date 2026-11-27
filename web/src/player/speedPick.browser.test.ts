// Exercise the player's canvas and toolbar with the window keyboard attached in Chromium.
import { costsFor } from '@lewismoten/gamemaker-sandbox-engine/engine/slowPc';
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
        import { costsFor } from '@lewismoten/gamemaker-sandbox-engine/engine/slowPc';
        const speed = { slowPc: { ...costsFor('286') } };
        keyboard.attach();
        toolbarKeyboard(canvas, corner, speedPick(corner, speed), () => keyboard.releaseAll());
        corner.querySelector('button').onclick = () => document.body.dataset.activated = 'yes';
        canvas.focus();
        export { keyboard, speed, speedPick };`,
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
    expect(await select.inputValue()).toBe('286');
    await page.keyboard.press('Home');
    expect(await select.inputValue()).toBe('today');
    expect(await page.evaluate('fixture.speed.slowPc')).toBeUndefined();
    for (const preset of ['486', '386', '286'] as const) {
      await page.keyboard.press('ArrowDown');
      expect(await select.inputValue()).toBe(preset);
      expect(await page.evaluate('fixture.speed.slowPc')).toEqual(costsFor(preset));
      expect(await select.evaluate((el) => el === document.activeElement)).toBe(true);
    }
    await page.keyboard.press('Tab');
    expect(await page.getByRole('button', { name: 'Keys' }).evaluate((el) => el === document.activeElement)).toBe(true);
    await page.keyboard.press('Space');
    expect(await page.locator('body').getAttribute('data-activated')).toBe('yes');
    await page.keyboard.press('Shift+Tab');
    expect(await select.evaluate((el) => el === document.activeElement)).toBe(true);
    await page.keyboard.press('ArrowRight');
    expect(await page.evaluate('fixture.speed.slowPc')).toEqual(costsFor('ps1'));
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
    const custom = await page.evaluate(`(() => {
      const costs = { ...fixture.speed.slowPc, tickMs: 6 };
      const speed = { slowPc: costs };
      const picker = fixture.speedPick(document.body, speed);
      const label = picker.selectedOptions[0].text;
      picker.value = 'today';
      picker.dispatchEvent(new Event('change'));
      picker.value = 'custom';
      picker.dispatchEvent(new Event('change'));
      return { label, restored: speed.slowPc === costs };
    })()`);
    expect(custom).toEqual({ label: 'Custom speed', restored: true });
  } finally {
    await browser.close();
  }
});
