// Plays tour chapters in real time in headless Chrome and audits each step: the bubble's distance
// from its speaker (and overlap with other hosts), whether its recorded voice clip played to the
// end, and whether its target sits under the caption bar.
//   npm run tour:audit -- [--chapter <id>[,<id>]] [--url <url>] [--sizes 1440x900,390x844] [--max 240]
// With no --url it starts its own Vite on a free port (never 5173) and stops it. Run it alone: two
// Chromes at once give false voice cuts. Clips are matched to steps by file name
// (tour/voice/<chapter>/<step>.ogg). A step with no clip file is not flagged; the pause that
// stopVoice causes when it clears src is ignored. A cut is a clip still mid-play (more than 0.35 s
// left) when the next clip starts or the tour ends. Not run in CI. Exits 1 on any flag.
import { existsSync, mkdtempSync } from 'node:fs';
import { createServer as netServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Page } from 'playwright-core';
import { createServer } from 'vite';
import { CHAPTERS } from '../src/tour/chapters/index';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Seen {
  text: string;
  t: number;
  bubble: Rect;
  ring: Rect | null;
  bar: Rect | null;
  hosts: (Rect & { id: string })[];
}
interface Clip {
  file: string;
  t: number;
  dur: number;
  endPos: number;
  ended: boolean;
  cutBy: string;
}

const arg = (k: string, d: string): string => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? (process.argv[i + 1] ?? d) : d;
};

async function freePort(): Promise<number> {
  for (let port = 5190; ; port++) {
    const ok = await new Promise<boolean>((done) => {
      const s = netServer();
      s.once('error', () => done(false));
      s.listen(port, '127.0.0.1', () => s.close(() => done(true)));
    });
    if (ok) return port;
  }
}

/** Runs in the page before it loads: logs the voice clips (by file) and each steady bubble. */
function instrument(): void {
  const w = window as unknown as { __clips: unknown[]; __steps: unknown[]; __cur?: Record<string, unknown> };
  w.__clips = [];
  w.__steps = [];
  const rect = (el: Element | null) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  };
  const file = (a: HTMLAudioElement) => /tour\/voice\/([^?]+)\.ogg/.exec(a.currentSrc || a.src || '')?.[1] ?? '';
  const open = new Map<HTMLAudioElement, { file: string; t: number; dur: number }>();
  const close = (a: HTMLAudioElement, cutBy: string, ended: boolean) => {
    const o = open.get(a);
    if (!o) return;
    open.delete(a);
    w.__clips.push({ ...o, endPos: a.currentTime, ended, cutBy });
  };
  const seen = new WeakSet<HTMLAudioElement>();
  // eslint-disable-next-line @typescript-eslint/unbound-method -- called with the element below
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (this: HTMLAudioElement, ...a: []) {
    if (!seen.has(this)) {
      seen.add(this);
      this.addEventListener('ended', () => close(this, '', true));
      // the pause stopVoice causes (src cleared, or sitting at 0) is not a clip being cut
    }
    const f = file(this);
    if (f) {
      // another clip starting while one is mid-play is a cut
      for (const [other] of open) if (other !== this) close(other, f, false);
      open.set(this, { file: f, t: performance.now(), dur: this.duration });
    }
    return play.apply(this, a);
  };
  (window as unknown as { __flush: () => void }).__flush = () => {
    for (const [a] of open) close(a, 'END', false);
  };
  let last = '';
  let since = 0;
  let done = false;
  setInterval(() => {
    const b = document.querySelector<HTMLElement>('.tour-bubble');
    const txt = b && !b.hidden ? (b.textContent ?? '') : '';
    const now = performance.now();
    if (txt !== last) {
      last = txt;
      since = now;
      done = false;
      return;
    }
    if (txt && !done && now - since > 700 && b) {
      done = true;
      const ring = document.querySelector<HTMLElement>('.tour-ring');
      w.__steps.push({
        text: txt,
        t: since,
        bubble: rect(b),
        ring: ring?.hidden ? null : rect(ring),
        bar: rect(document.querySelector('.tour-bar')),
        hosts: [...document.querySelectorAll<HTMLElement>('.tour-actor')].map((el) => ({ id: el.dataset.host ?? '', ...rect(el) })),
      });
    }
  }, 100);
}

const center = (r: Rect): [number, number] => [r.x + r.w / 2, r.y + r.h / 2];
const inter = (a: Rect, b: Rect): number =>
  Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

interface Row {
  chapter: string;
  size: string;
  step: string;
  speaker: string;
  dist: number | null;
  voice: string;
  flags: string[];
}

async function run(page: Page, base: string, id: string, w: number, h: number, maxSec: number): Promise<{ rows: Row[]; planned: number }> {
  const chapter = CHAPTERS.find((c) => c.id === id)!;
  await page.goto(id === 'dos' ? `${base}/dos.html?tour=dos&cont` : `${base}/#/?tour=${id}&cont`);
  const t0 = Date.now();
  while (Date.now() - t0 < maxSec * 1000) {
    await page.waitForTimeout(1000);
    const bar = await page.evaluate(() => !!document.querySelector('.tour-bar')).catch(() => null);
    if (bar === null) break;
    if (!bar && Date.now() - t0 > 8000) break;
  }
  const got = await page
    .evaluate(() => {
      (window as unknown as { __flush: () => void }).__flush();
      const g = window as unknown as { __steps: unknown[]; __clips: unknown[] };
      return { steps: g.__steps, clips: g.__clips };
    })
    .catch(() => ({ steps: [], clips: [] }));
  const steps = got.steps as Seen[];
  const clips = got.clips as Clip[];
  const far = w > 600 ? 400 : 250;
  const rows: Row[] = [];
  for (const s of steps) {
    const def = chapter.steps.find((d) => d.say === s.text.trim() || s.text.startsWith(d.say.slice(0, 30)));
    if (!def) continue;
    const sp = def.speaker ?? chapter.speaker;
    const host = s.hosts.find((x) => x.id === sp);
    const flags: string[] = [];
    let dist: number | null = null;
    if (!host) flags.push('no-speaker-host');
    else {
      const a = center(host);
      const b = center(s.bubble);
      dist = Math.round(Math.hypot(a[0] - b[0], a[1] - b[1]));
      if (dist > far) flags.push(`far:${dist}`);
    }
    const over = s.hosts.filter((o) => inter(o, s.bubble) > 0).map((o) => o.id);
    if (over.length) flags.push(`overlaps:${over.join('+')}`);
    const file = `${id}/${def.id}`;
    const hasClip = existsSync(join(import.meta.dirname, '..', 'public/tour/voice', `${file}.ogg`));
    const clip = clips.find((c) => c.file === file);
    let voice = hasClip ? 'none' : 'no clip';
    if (clip) {
      const left = clip.dur - clip.endPos;
      voice = clip.ended ? 'full' : left > 0.35 ? `cut ${Math.round(clip.endPos * 1000)}/${Math.round(clip.dur * 1000)}ms by ${clip.cutBy}` : 'full';
      if (voice.startsWith('cut')) flags.push(`voice-${voice.replace(' by', ' by')}`);
    } else if (hasClip) flags.push('no-voice');
    // a target taller than the room the bar leaves cannot clear it: not a flag
    if (s.bar && s.ring && s.ring.h <= h - s.bar.h && inter(s.bar, s.ring) / (s.ring.w * s.ring.h) > 0.2)
      flags.push(`target-under-bar:${Math.round((inter(s.bar, s.ring) / (s.ring.w * s.ring.h)) * 100)}%`);
    rows.push({ chapter: id, size: '', step: def.id, speaker: sp, dist, voice, flags });
  }
  // a step never shown (the tour ended early, or it flashed by in under 0.7 s) is a flag too
  for (const d of chapter.steps)
    if (!d.optional && !d.pageOnly && !rows.some((r) => r.step === d.id))
      rows.push({ chapter: id, size: '', step: d.id, speaker: d.speaker ?? chapter.speaker, dist: null, voice: '-', flags: ['not-seen'] });
  return { rows, planned: chapter.steps.length };
}

async function main(): Promise<number> {
  const ids = arg('chapter', '') ? arg('chapter', '').split(',') : CHAPTERS.map((c) => c.id);
  const unknown = ids.filter((id) => !CHAPTERS.some((c) => c.id === id));
  if (unknown.length) {
    console.error(`No such chapter: ${unknown.join(', ')}. Chapters: ${CHAPTERS.map((c) => c.id).join(', ')}`);
    return 2;
  }
  const sizes = arg('sizes', '1440x900,390x844')
    .split(',')
    .map((s) => s.split('x').map(Number) as [number, number]);
  const maxSec = +arg('max', '240');
  let base = arg('url', '');
  const server = base
    ? null
    : await (async () => {
        const port = await freePort();
        base = `http://127.0.0.1:${port}`;
        const s = await createServer({
          cacheDir: mkdtempSync(join(tmpdir(), 'touraudit-')),
          server: { port, strictPort: true, host: '127.0.0.1' },
          logLevel: 'error',
        });
        await s.listen();
        return s;
      })();
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  let flagged = 0;
  try {
    for (const id of ids)
      for (const [w, h] of sizes) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h } });
        const page = await ctx.newPage();
        await page.addInitScript(instrument);
        await page.addInitScript(() => {
          try {
            localStorage.setItem('gm-ui', 'web');
          } catch {
            /* default */
          }
        });
        try {
          const { rows, planned } = await run(page, base, id, w, h, maxSec);
          const bad = rows.filter((r) => r.flags.length);
          flagged += bad.length;
          console.log(`${id} ${w}x${h}: ${rows.length}/${planned} steps seen, ${bad.length} flagged`);
          for (const r of bad) console.log(`  ${r.step} [${r.speaker}] ${r.flags.join(' ')} dist=${r.dist} voice=${r.voice}`);
        } catch (e) {
          flagged++;
          console.log(`${id} ${w}x${h}: ERROR ${String(e instanceof Error ? e.message : e).split('\n')[0]}`);
        }
        await ctx.close();
      }
  } finally {
    await browser.close();
    await server?.close();
  }
  console.log(flagged ? `FAIL: ${flagged} flag(s)` : 'ok');
  return flagged ? 1 : 0;
}

process.exit(await main());
