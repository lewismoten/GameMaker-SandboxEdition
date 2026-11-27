// Navigating away during opening must preserve the dimensions of the last attached view.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('keeps the saved view when switching maps before the opening timer settles', async () => {
  const bundle = await build({
    entryPoints: ['src/editor/editors/map/mapViewMemory.ts'],
    bundle: true,
    write: false,
    globalName: 'memory',
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route('http://localhost/', (route) => route.fulfill({ contentType: 'text/html', body: '<body></body>' }));
    await page.goto('http://localhost/');
    await page.addScriptTag({ content: bundle.outputFiles[0].text });
    await page.clock.install();
    await page.evaluate(`window.openMap = function(file, zoom) {
      const scroller = document.createElement('div');
      scroller.style.cssText = 'width:320px;height:500px';
      document.body.replaceChildren(scroller);
      const view = memory.mapViewMemory({
        project: { id: 'p' }, file, zoom, host: scroller, scroller,
        viewport: { at: () => ({ x: 12, y: 8 }), setWrapped() {} },
        view: { num() {}, set() {} }, linkMarks: () => [], map: { monsters: [] }
      });
      view.restoreView();
      return view;
    };
    window.firstMap = openMap('A.MAP', 2);`);
    await page.clock.runFor(32);
    await page.evaluate(`firstMap.stopRestoring(); firstMap.dispose(); openMap('B.MAP', 3)`);
    await page.clock.runFor(1200);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gm-map-views')!));
    expect(saved.views).toContainEqual(['p/A.MAP', { z: 2, x: 12, y: 8, sx: 0, sy: 0, w: 320, h: 500 }]);
    expect(saved.last).toBe(3);
  } finally {
    await browser.close();
  }
});
