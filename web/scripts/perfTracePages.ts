// Routes and content readiness for cold page-load traces. No browser or server is started here.
import type { Page } from 'playwright-core';

export const TRACE_PAGES: [name: string, path: string, ready?: string][] = [
  ['home', '/#/'],
  ['editor overview', '/#/p/look:carl/menu.cmf'],
  ['editor map', '/#/p/look:blaster/bus2.map', 'main.editor [aria-label="The map (scroll with the arrow keys)"] .mt-stack canvas:not([aria-hidden])'],
  ['editor blocks', '/#/p/look:blaster/b1.bbl'],
  ['guide', '/#/help'],
  ['library', '/#/library'],
  ['achievements', '/#/achievements'],
  ['cast', '/#/cast'],
  ['credits', '/#/credits'],
  ['mac', '/#/mac'],
  ['desk', '/#/desk'],
  ['magazine', '/#/magazine'],
  ['dos.html', '/dos.html'],
  ['play.html', '/play.html'],
];

/** The map is built and drawn synchronously after its game files load; shell tabs are too early. */
export async function waitForTraceContent(page: Pick<Page, 'locator'>, ready?: string): Promise<void> {
  if (ready) await page.locator(ready).waitFor({ state: 'visible', timeout: 40_000 });
}
