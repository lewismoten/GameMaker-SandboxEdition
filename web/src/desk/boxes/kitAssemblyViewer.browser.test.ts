// Compare the rendered kit after reversing the camera at its lowest angle.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('tilts the kit on the first reverse arrow press or drag after reaching the pitch limit', async () => {
  const script = await build({
    stdin: {
      contents: `import { kitAssemblyViewer } from './kitAssemblyViewer';
        document.body.append(kitAssemblyViewer({ title: 'Kit', assembly: 'plowed-street' }).root);`,
      resolveDir: 'src/desk/boxes',
    },
    bundle: true,
    write: false,
    loader: { '.css': 'empty' },
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addStyleTag({ content: 'canvas { width: 320px; height: 320px; }' });
    await page.addScriptTag({ content: script.outputFiles[0].text });
    const canvas = page.locator('canvas');
    const picture = () => canvas.evaluate((c: HTMLCanvasElement) => new Promise<string>((resolve) => requestAnimationFrame(() => resolve(c.toDataURL()))));
    const home = await picture();
    await canvas.evaluate((c) => {
      for (let i = 0; i < 9; i++) c.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    });
    const lowest = await picture();
    expect(lowest === home).toBe(false);
    await canvas.press('ArrowDown');
    expect.soft((await picture()) !== lowest, 'one reverse arrow press tilts the kit').toBe(true);

    await canvas.press('Home');
    const box = (await canvas.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - 130);
    expect((await picture()) === lowest, 'drag reaches the same lowest view').toBe(true);
    await page.mouse.move(x, y - 128);
    await page.mouse.up();
    expect((await picture()) !== lowest, 'two pixels of reverse drag tilt the kit').toBe(true);
  } finally {
    await browser.close();
  }
});
