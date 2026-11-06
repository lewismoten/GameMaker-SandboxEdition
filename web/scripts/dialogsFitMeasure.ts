// What dialogsFit.ts and dialogsSweep.ts measure in an open dialog: the box against the visual viewport, scrolling inside, reachable buttons.
import type { Page } from 'playwright-core';

export interface Measure {
  open: boolean;
  problems: string[];
}

/** Measured in the page: the topmost open dialog against the visual viewport. */
export async function measure(page: Page): Promise<Measure> {
  return page.evaluate(() => {
    const dlgs = [...document.querySelectorAll<HTMLElement>('dialog[open], [role="dialog"]')].filter((d) => d.offsetWidth > 0);
    const dlg = dlgs[dlgs.length - 1];
    if (!dlg) return { open: false, problems: ['no dialog opened'] };
    const vv = window.visualViewport;
    const vw = vv?.width ?? innerWidth;
    const vh = vv?.height ?? innerHeight;
    const problems: string[] = [];
    const b = dlg.getBoundingClientRect();
    const over = (n: number) => Math.round(n);
    if (b.top < -1 || b.left < -1 || b.bottom > vh + 1 || b.right > vw + 1)
      problems.push(`box ${over(b.width)}x${over(b.height)} at ${over(b.left)},${over(b.top)} leaves ${over(vw)}x${over(vh)}`);
    // internal scroll: the dialog itself, then any descendant that scrolls
    const scrolls = (el: HTMLElement) => {
      const cs = getComputedStyle(el);
      const y = /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1;
      const x = /(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1;
      return y || x;
    };
    const name = (el: HTMLElement) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}`;
    if (scrolls(dlg)) problems.push(`dialog scrolls (${dlg.scrollHeight}x${dlg.scrollWidth} in ${dlg.clientHeight}x${dlg.clientWidth})`);
    for (const el of dlg.querySelectorAll<HTMLElement>('*'))
      if (el.offsetWidth > 0 && scrolls(el) && el.tagName !== 'TEXTAREA' && el.tagName !== 'PRE')
        problems.push(
          `${name(el)} scrolls (${el.scrollHeight}x${el.scrollWidth} in ${el.clientHeight}x${el.clientWidth})${el.dataset.listArea !== undefined ? ' [allowed list]' : ''}`,
        );
    const de = document.documentElement;
    if (de.scrollWidth > vw + 1) problems.push(`page scrolls sideways (${de.scrollWidth} in ${Math.round(vw)})`);
    // the close and primary buttons are visible and not covered
    const visible = (el: HTMLElement, what: string) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return problems.push(`${what} has no box`);
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (cx < 0 || cy < 0 || cx > vw || cy > vh) return problems.push(`${what} is off screen`);
      const hit = document.elementFromPoint(cx, cy);
      if (!hit || !(el === hit || el.contains(hit) || hit.contains(el))) problems.push(`${what} is covered or scrolled out of view`);
    };
    const close = dlg.querySelector<HTMLElement>('.modal-close, [aria-label="Close"], button[aria-label^="Close"]');
    if (close) visible(close, 'close button');
    else {
      const any = [...dlg.querySelectorAll<HTMLElement>('button')].find((x) => /^(close|done|ok|cancel|got it|back)/i.test((x.textContent ?? '').trim()));
      if (any) visible(any, `"${any.textContent?.trim()}" button`);
      else problems.push('no close button found');
    }
    const shown = (q: string) => [...dlg.querySelectorAll<HTMLElement>(q)].filter((x) => x.offsetWidth > 0 && getComputedStyle(x).visibility !== 'hidden');
    const prim = shown('button[type="submit"], button.primary, button.go')[0] ?? shown('.buttons button').pop() ?? null;
    if (prim && prim !== close) visible(prim, `primary button "${(prim.textContent ?? '').trim().slice(0, 20)}"`);
    return { open: true, problems };
  });
}
