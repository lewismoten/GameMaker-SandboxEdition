// Does the page create its AudioContext inside an input handler, and is it running after the first
// tap? Hooks AudioContext, loads the page, logs each context's state and creation time before and
// after the first tap or click. PASS when no context is created inside an input event handler (the desk; the home page may make its own on the first tap) and
// every context is running after the tap. Headless WebKit does not enforce iOS's gesture rule, so
// a pass here is not proof for a real iPhone. Starts its own Vite (never 5173) via perfLib.
// Usage: npm run check:audio-unlock -- [--engines webkit,chromium] [--page desk,home] [--port 5293] [--dist dir] [--url u]
import { chromium, devices, webkit, type BrowserType } from 'playwright-core';
import { arg, headlessShell, target } from './perfLib';

const engines = (arg('engines') ?? 'webkit,chromium').split(',');
const pages = (arg('page') ?? 'desk,home').split(',');
const PAGES: Record<string, { hash: string; ready: string; tap: string; eager: boolean }> = {
  desk: { hash: '#/desk', ready: '[aria-label="The 1994 desk"]', tap: '[aria-label="The 1994 desk"] [aria-label="Virus Blaster box"]', eager: true },
  home: { hash: '#/', ready: 'body', tap: 'body', eager: false },
};
const types: Record<string, BrowserType> = { webkit, chromium };

interface Made {
  at: number;
  state: string;
  inInput: boolean;
  now: string;
}
type Hooked = { c: AudioContext; at: number; state: string; inInput: boolean };

const hook = () => {
  const w = window as unknown as { __made: Hooked[]; webkitAudioContext?: typeof AudioContext };
  const A = window.AudioContext || w.webkitAudioContext!;
  const made: Hooked[] = [];
  let depth = 0;
  w.__made = made;
  // count how deep we are inside any input-event listener, so a context made there is caught
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const add = EventTarget.prototype.addEventListener;
  const kinds = /^(pointer|mouse|touch|click|key)/;
  EventTarget.prototype.addEventListener = function (
    this: EventTarget,
    type: string,
    fn: EventListenerOrEventListenerObject | null,
    o?: boolean | AddEventListenerOptions,
  ) {
    if (fn && kinds.test(type)) {
      const orig = fn;
      const wrapped = function (this: unknown, e: Event) {
        depth++;
        try {
          return typeof orig === 'function' ? orig.call(this, e) : orig.handleEvent(e);
        } finally {
          depth--;
        }
      };
      return add.call(this, type, wrapped, o);
    }
    return add.call(this, type, fn, o);
  };
  const W = function (this: unknown, ...a: ConstructorParameters<typeof AudioContext>) {
    const c = new A(...a);
    made.push({ c, at: Math.round(performance.now()), state: c.state, inInput: depth > 0 });
    return c;
  } as unknown as typeof AudioContext;
  W.prototype = A.prototype;
  window.AudioContext = W;
  w.webkitAudioContext = W;
};
const read = () => (window as unknown as { __made: Hooked[] }).__made.map((x) => ({ at: x.at, state: x.state, inInput: x.inInput, now: x.c.state }));

const srv = await target(5293);
const rows: string[] = [];
let failed = 0;
try {
  for (const eng of engines)
    for (const profile of ['desktop', 'iphone'])
      for (const name of pages) {
        const spec = PAGES[name];
        if (!spec || !types[eng]) throw new Error(`Unknown --engines or --page value: ${eng} ${name}`);
        const b = await types[eng].launch(eng === 'chromium' ? { executablePath: headlessShell() } : {});
        try {
          const ctx = await b.newContext(profile === 'iphone' ? { ...devices['iPhone 13'] } : { viewport: { width: 1440, height: 900 } });
          const page = await ctx.newPage();
          await page.addInitScript(hook);
          await page.goto(`${srv.base}/${spec.hash}`);
          await page.locator(spec.ready).first().waitFor({ timeout: 30000 });
          await page.waitForTimeout(4000);
          const before = (await page.evaluate(read)) as Made[];
          if (profile === 'iphone') await page.touchscreen.tap(200, 400);
          else
            await page
              .locator(spec.tap)
              .first()
              .click({ force: true })
              .catch(() => page.mouse.click(700, 450));
          await page.waitForTimeout(1500);
          const after = (await page.evaluate(read)) as Made[];
          const inInput = spec.eager ? after.filter((x) => x.inInput).length : 0; // the home page makes its context on the first tap, which is the right pattern there
          const notRunning = after.filter((x) => x.now !== 'running').length;
          const bad = [
            inInput ? `${inInput} made inside an input handler` : '',
            notRunning ? `${notRunning} not running after the tap` : '',
            after.length || !spec.eager ? '' : 'no AudioContext made',
          ].filter(Boolean);
          if (bad.length) failed++;
          rows.push(
            `${bad.length ? 'FAIL' : 'PASS'}  ${eng.padEnd(8)} ${profile.padEnd(7)} ${name.padEnd(5)} contexts ${after.length}  before tap ${before.map((x) => `${x.state}@${x.at}ms>${x.now}`).join(',') || 'none'}  after tap ${after.map((x) => x.now).join(',') || 'none'}${bad.length ? `  (${bad.join('; ')})` : ''}`,
          );
        } finally {
          await b.close();
        }
      }
} finally {
  srv.stop();
}
console.log(rows.join('\n'));
console.log('\nNote: headless WebKit does not enforce iOS’s gesture rule for audio, so a pass here is not proof for a real iPhone.');
console.log(failed ? `${failed} case(s) FAILED.` : 'All cases passed.');
process.exit(failed ? 1 : 0);
