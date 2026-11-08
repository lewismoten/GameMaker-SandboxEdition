// Compare a screenshot pixel on a real, uncovered neutral app surface with editor.css's two palettes.
// Never add a swatch or repaint the page just to make a theme assertion pass.
import type { Page } from 'playwright-core';
import { decodePng } from './badgePng';

const COLORS = {
  light: [
    [213, 217, 226],
    [233, 236, 242],
    [223, 227, 235],
  ],
  dark: [
    [17, 19, 26],
    [27, 30, 40],
    [35, 39, 54],
  ],
};

export async function assertRenderedTheme(page: Page, theme: 'light' | 'dark') {
  const point = await page.evaluate(() => {
    // A modal's backdrop dims the page: sample the modal itself first, then editor/home surfaces.
    const selectors = ['dialog[open]', '[role="dialog"]', '.editor', '.sidebar', '.panel', '.card', 'main', '.guide', '[role="main"]', 'body'];
    for (const selector of selectors)
      for (const el of document.querySelectorAll<HTMLElement>(selector)) {
        const css = getComputedStyle(el);
        if (css.visibility !== 'visible' || css.backgroundImage !== 'none') continue;
        // Main and editor padding can be transparent: the screenshot still measures the real ancestor background.
        let surface: Element | null = el;
        while (surface && getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)' && getComputedStyle(surface).backgroundImage === 'none')
          surface = surface.parentElement;
        if (!surface || !/^rgb\(/.test(getComputedStyle(surface).backgroundColor)) continue;
        const r = el.getBoundingClientRect();
        const left = Math.max(0, r.left),
          right = Math.min(innerWidth, r.right);
        const top = Math.max(0, r.top),
          bottom = Math.min(innerHeight, r.bottom);
        // Blank padding, away from rounded corners/borders, text and child controls.
        for (const y of [Math.ceil(top + 8), Math.floor((top + bottom) / 2), Math.floor(bottom - 8)])
          for (const x of [Math.ceil(left + 8), Math.floor((left + right) / 2), Math.floor(right - 8)]) {
            if (x < left + 6 || x > right - 6 || y < top + 6 || y > bottom - 6) continue;
            if (document.elementFromPoint(x, y) === el) return { selector, x, y, background: css.backgroundColor };
          }
      }
    return null;
  });
  if (!point) throw new Error('Rendered theme: no uncovered representative app surface; cannot certify this screenshot.');
  const image = decodePng(await page.screenshot({ type: 'png', scale: 'css', clip: { x: point.x, y: point.y, width: 1, height: 1 } }));
  const pixel = [...image.data.slice(0, 3)];
  const distance = (colors: number[][]) => Math.min(...colors.map((c) => Math.max(...c.map((v, i) => Math.abs(v - pixel[i])))));
  const expectedDistance = distance(COLORS[theme]);
  const oppositeDistance = distance(COLORS[theme === 'light' ? 'dark' : 'light']);
  const evidence = { theme, ...point, pixel, expectedDistance, oppositeDistance };
  if (expectedDistance > 8 || oppositeDistance < 80) throw new Error(`Rendered theme pixel mismatch: ${JSON.stringify(evidence)}`);
  console.log(`[theme] ${JSON.stringify(evidence)}`);
  return evidence;
}
