// Exercise the audit scene with controlled catalog and print-shop responses.
import { expect, it } from 'vitest';
import { extraScenes } from './dialogsExtraScenes';
import { launch } from './perfLib';

it.each([
  { catalog: [], selected: 'gmbox', error: 'Disk labels fixture unavailable' },
  { catalog: [{ kind: 'shareware' }], selected: 'gmbox', error: 'Disk labels is not selected' },
  { catalog: [{ kind: 'shareware' }], selected: 'disklabels', error: '' },
])('checks the Disk labels fixture and selected piece ($catalog, $selected)', async ({ catalog, selected, error }) => {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.route('http://localhost/**', (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/') return route.fulfill({ contentType: 'text/html', body: '<div class="topbar">Home</div>' });
      const body = path.endsWith('/files.ts')
        ? `export const loadCatalogList = () => ${JSON.stringify(catalog)};`
        : `export const openPrintShop = () => document.body.insertAdjacentHTML('beforeend', '<div class="gmb" role="dialog"><ul class="gmb-tray-list"><li data-id="${selected}"><button aria-current="true">Piece</button></li></ul></div>');`;
      return route.fulfill({ contentType: 'text/javascript', body });
    });
    await page.goto('http://localhost/');
    const opened = extraScenes.find((s) => s.id === 'disk-labels')!.open(page);
    if (error) await expect(opened).rejects.toThrow(error);
    else await expect(opened).resolves.toBeUndefined();
  } finally {
    await browser.close();
  }
});
