// Check the draggable film and its visible caption in Chromium's accessibility tree.
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import { expect, it } from 'vitest';

it('exposes one named image for the film and its visible drag caption', async () => {
  const script = await build({ entryPoints: ['src/manual/printables/redFilm.ts'], bundle: true, write: false, format: 'iife', globalName: 'redFilm' });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addStyleTag({ path: 'src/manual/printables/paper.css' });
    await page.addScriptTag({ content: script.outputFiles[0].text });
    await page.addScriptTag({ content: 'const film = new redFilm.RedFilm(); film.mount(document.body); film.show();' });
    const caption = page.getByText('RED FILM · drag me', { exact: true });
    expect(await caption.isVisible()).toBe(true);
    expect(await page.locator('.rf-film-caption').getAttribute('aria-hidden')).toBe('true');
    expect(await page.locator('body').ariaSnapshot()).toBe('- img "Red film (drag it over the answers)"');
  } finally {
    await browser.close();
  }
});

it('reveals the answer and drawing and moves the focused film without turning the page', async () => {
  const script = await build({
    stdin: {
      contents: `
      import { openBox } from './viewer';
      import { redCode, redSketch } from './redFilm';
      const answer = redCode('Use the gold key');
      const garden = redSketch({ rows: ['@>X'], labels: [{ x: 0, y: 0, text: 'Garden' }] });
      const pages = [
        { kind: 'cover', body: [answer, garden] },
        { kind: 'text', body: [document.createTextNode('Next hint page')] },
      ];
      const sheet = document.createElement('div');
      sheet.style.paddingTop = '150vh';
      sheet.append(redCode('Inspect the gate'));
      openBox('Test box', [], [
        { id: 'hints', title: 'Hints', icon: '', redFilm: true, pages: async () => pages, render: async () => [] },
        { id: 'card', title: 'Hint card', icon: '', redFilm: true, live: async () => sheet },
      ]);
    `,
      resolveDir: 'src/manual/printables',
    },
    bundle: true,
    write: false,
    format: 'iife',
    define: { 'import.meta.env': '{}' },
    loader: { '.css': 'empty' },
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.addStyleTag({ path: 'src/manual/printables/paper.css' });
    await page.addScriptTag({ content: script.outputFiles[0].text });
    const body = page.locator('body');
    const toggle = page.getByRole('button', { name: /Red film/ });
    await toggle.focus();
    expect(await body.ariaSnapshot()).not.toMatch(/Use the gold key|Garden/);
    await toggle.press('Enter');
    const revealed = await body.ariaSnapshot();
    expect(revealed).toContain('Use the gold key');
    expect(revealed).toContain('Drawing: Garden');
    expect(revealed).toContain('X marks row 1, column 3');
    const film = page.locator('.rf-film');
    expect(await film.evaluate((el) => el === document.activeElement)).toBe(true);
    const before = await film.boundingBox();
    await page.keyboard.press('ArrowRight');
    expect((await film.boundingBox())!.x).toBeGreaterThan(before!.x);
    expect(await body.ariaSnapshot()).toBe(revealed);
    await toggle.press('Enter');
    expect(await body.ariaSnapshot()).not.toMatch(/Use the gold key|Garden/);
    await page.getByRole('button', { name: 'Hint card' }).press('Enter');
    const stage = page.getByRole('region', { name: 'The piece shown' });
    await stage.press('PageDown');
    await page.waitForFunction(() => document.querySelector('.gmb-stage')!.scrollTop > 0);
    await toggle.press('Enter');
    expect(await stage.ariaSnapshot()).toContain('Inspect the gate');
  } finally {
    await browser.close();
  }
});

it('locates the Cold Cellar false wall even when only its cell moves', async () => {
  const script = await build({
    stdin: {
      contents: `
        import { redSketch } from './redFilm';
        import paper from '../../../../games/bakers/printables.json';
        const sketch = paper.items.find(item => item.kind === 'hintbook').sections
          .find(section => section.head === 'The Room Nobody Mentions').hints.find(hint => hint.sketch).sketch;
        const moved = sketch.rows.map(row => row === ':#########' ? '#########:' : row);
        document.body.append(redSketch(sketch), redSketch({ ...sketch, rows: moved }));
      `,
      resolveDir: 'src/manual/printables',
    },
    bundle: true,
    write: false,
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addScriptTag({ content: script.outputFiles[0].text });
    const names = page.locator('.rf-revealed-name');
    const original = await names.nth(0).getAttribute('aria-label');
    const moved = await names.nth(1).getAttribute('aria-label');
    expect(original).toContain('row above the bean at X');
    expect(original).toContain('False wall at row 3, column 1,');
    expect(moved).toContain('False wall at row 3, column 10,');
    for (const name of [original, moved]) expect(name).toContain('X marks row 4, column 1');
  } finally {
    await browser.close();
  }
});

it('steps the spyglass lens through all six labeled fingerprint cards', async () => {
  const script = await build({
    stdin: {
      contents: `
        import { openBox } from './viewer';
        import { printsSheets } from './sleuthPrints';
        import box from '../../../../games/sleuth/printables.json';
        const prints = box.items.find(item => item.kind === 'prints');
        openBox('Test box', [], [{id:'prints',title:'Evidence',icon:'',glass:true, render:() => printsSheets(prints)}]);
      `,
      resolveDir: 'src/manual/printables',
    },
    bundle: true,
    write: false,
    format: 'iife',
    define: { 'import.meta.env': '{}' },
    loader: { '.css': 'empty' },
  });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const name of ['paper', 'sleuthPrints']) await page.addStyleTag({ path: 'src/manual/printables/' + name + '.css' });
    // Keep both picture elements and their layout while skipping the procedural ink.
    await page.addScriptTag({ content: 'HTMLCanvasElement.prototype.getContext = () => null' });
    await page.addScriptTag({ content: script.outputFiles[0].text });
    await page.getByRole('button', { name: /Spyglass/ }).press('Enter');
    const glass = page.locator('.sg-glass');
    const labels = await page.locator('.sgp-cell figcaption b').allTextContents();
    expect(labels).toHaveLength(6);
    for (const label of labels) {
      expect(await glass.getAttribute('aria-valuetext')).toBe(label);
      const card = await page.locator('.sgp-cell').filter({ hasText: label }).locator('.rf-picture').boundingBox();
      const lens = await glass.locator('.sg-lens').boundingBox();
      expect(Math.abs(lens!.y + lens!.height / 2 - card!.y - card!.height / 2)).toBeLessThan(2);
      expect(Math.abs(lens!.x + lens!.width / 2 - card!.x - card!.width / 2)).toBeLessThan(2);
      await page.keyboard.press('ArrowRight');
    }
  } finally {
    await browser.close();
  }
});
