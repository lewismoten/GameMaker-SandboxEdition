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
