// Does each editor fit the viewport? For every editor route at several desktop and tablet sizes, in light and
// dark, prints whether the page itself scrolls (vertical: advice; sideways: exit 1) and which inner scroll panes
// are cut off, as visible/total heights. Optionally saves a screenshot each. Starts its own Vite (never 5173)
// through perfLib, or uses --dist / --url. The project is a tracked CD fixture, so no game build is needed.
// Usage: npm run editor:fit -- [--only map,music] [--sizes 1440x900,820x1180] [--themes dark,light] [--project look:blaster]
//        [--out dir (screenshots)] [--port 6140] [--dist dir] [--url u]
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { arg, launch, target } from './perfLib';
import { assertTheme, forceTheme } from './forceTheme';

/** Editor name -> the file the route opens in the fixture project (the overview is the project's own page). */
const FILES: Record<string, string> = {
  overview: '',
  map: 'bus2.map',
  blocks: 'b1.bbl',
  char: 'ship.chr',
  mon: 'bus2.mon',
  music: 'disk.cmf',
  snd: 'blaster.snd',
  text: 'help.txt',
  slides: 'help.lst',
  gam: 'blaster.gam',
  pal: 's1.pal',
  gif: 'bus2.gif',
  fli: 'bus2.fli',
  voc: 'bit.voc',
  rec: 'demo.rec',
};
const only = arg('only')?.split(',');
const sizes = (arg('sizes') ?? '1440x900,1280x720,1024x768,820x1180').split(',').map((s) => s.split('x').map(Number) as [number, number]);
const themes = (arg('themes') ?? 'dark,light').split(',') as ('dark' | 'light')[];
const project = arg('project') ?? 'look:blaster';
const out = arg('out') ? resolve(arg('out') as string) : undefined;
if (out) mkdirSync(out, { recursive: true });

let sideways = 0;
let rows = 0;
const srv = await target(6140);
const browser = await launch();
try {
  for (const [name, file] of Object.entries(FILES)) {
    if (only && !only.includes(name)) continue;
    const route = `/#/p/${project}${file ? `/${file}` : ''}`;
    for (const [w, h] of sizes)
      for (const scheme of themes) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
        await forceTheme(ctx, scheme);
        const page = await ctx.newPage();
        await page.goto(srv.base + route);
        await page.waitForSelector('main', { timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(2000);
        await assertTheme(page, scheme);
        const m = await page.evaluate(() => {
          const d = document.documentElement;
          const panes = [...document.querySelectorAll('main *')]
            .filter((e) => {
              const c = getComputedStyle(e);
              return (c.overflowY === 'auto' || c.overflowY === 'scroll') && e.scrollHeight > e.clientHeight + 2 && e.clientHeight > 60;
            })
            .slice(0, 4)
            .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} ${e.clientHeight}/${e.scrollHeight}`);
          return { v: d.scrollHeight - innerHeight, h: d.scrollWidth - innerWidth, panes };
        });
        rows++;
        if (m.h > 1) sideways++;
        console.log(
          `${name.padEnd(8)} ${w}x${h} ${scheme.padEnd(5)} ${m.v > 1 ? `VSCROLL +${m.v}px` : 'fits'}${m.h > 1 ? ` HSCROLL +${m.h}px` : ''}${m.panes.length ? ` | panes ${m.panes.join(', ')}` : ''}`,
        );
        if (out) await page.screenshot({ path: `${out}/${name}-${w}x${h}-${scheme}.png` });
        await ctx.close();
      }
  }
} finally {
  await browser.close();
  srv.stop();
}
console.log(`${rows} cases, ${sideways} with sideways overflow. Vertical scrolling and inner panes are advice: some editors are meant to scroll.`);
process.exit(sideways ? 1 : 0);
