// The Credits page's modem downloads: every one of the BBSes' pictures arriving at once, in
// place on the contact sheet, each at a 1990s modem's speed (each its own line, as if a row of
// modems were all receiving), drawn from the bytes received so far by the same decoders the
// BBS viewer uses (retro/bbs/gallery.ts decodePicture: an interlaced GIF's passes coarse to
// fine, a progressive JPEG's scans blurry to sharp, anything else top to bottom). One status
// box and one set of controls for them all: speed, Stop, Start over and Show them all now. It
// starts when the sheet scrolls into view; with reduced motion it waits to be started.
import { h } from '../editor/core/ui';
import { commas } from '../retro/dos/vfs';
import { decodePicture, galleryBytes, type GalleryFile, type ScreenPicture } from '../retro/bbs/gallery';

/** Modem speeds in bits per second; ten bits a byte on the wire (start, 8 data, stop), and these files don't compress further. */
const SPEEDS = [300, 1200, 2400, 14400] as const;
const DEFAULT_SPEED = 2400;
const TICK_MS = 100;
/** How often each picture is decoded again while it arrives. */
const REDRAW_MS = 400;

const clock = (s: number) => {
  const t = Math.max(0, Math.round(s));
  const hours = Math.floor(t / 3600);
  const mm = String(Math.floor((t % 3600) / 60)).padStart(hours ? 2 : 1, '0');
  return `${hours ? `${hours}:` : ''}${mm}:${String(t % 60).padStart(2, '0')}`;
};

/** How long a file takes at a speed, in words (for the speed choices). */
const lasts = (bytes: number, bps: number) => {
  const s = bytes / (bps / 10);
  return s < 90 ? `${Math.round(s)} seconds` : s < 5400 ? `${Math.round(s / 60)} minutes` : `${(s / 3600).toFixed(1)} hours`;
};

/** Draws as much of the picture as has arrived (palette indexes, 6-bit VGA colors) on the canvas. */
function paint(ctx: CanvasRenderingContext2D, pic: ScreenPicture): void {
  const img = ctx.createImageData(pic.width, pic.height);
  const rgb = pic.palette.map((v) => Math.round((v * 255) / 63));
  for (let i = 0; i < pic.pixels.length; i++) {
    const c = pic.pixels[i] * 3;
    img.data.set([rgb[c], rgb[c + 1], rgb[c + 2], 255], i * 4);
  }
  ctx.putImageData(img, 0, 0);
}

interface Line {
  f: GalleryFile;
  bytes?: Uint8Array;
  ctx: CanvasRenderingContext2D;
  meter: HTMLElement;
  tile: HTMLElement;
  shown: number;
  paintedAt: number;
}

/** The status box and controls, and a tile for each picture to put on the boards' sheets. */
export function modemSheet(files: GalleryFile[], altOf: (f: GalleryFile) => string): { controls: HTMLElement; tile(f: GalleryFile): HTMLElement } {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const largest = Math.max(...files.map((f) => f.bytes));
  const total = files.reduce((n, f) => n + f.bytes, 0);
  let bps: number = DEFAULT_SPEED;
  /** Bytes each line had received when the transfer (re)started or changed speed, and when. */
  let base = 0;
  let since = 0;
  let elapsedBase = 0;
  let timer = 0;
  let announced = 0;
  let state: 'ready' | 'running' | 'stopped' | 'done' = 'ready';
  const lines = new Map<string, Line>();

  const delivered = () => (state === 'running' ? base + ((performance.now() - since) / 1000) * (bps / 10) : base);
  const gotOf = (l: Line, d = delivered()) => Math.min(l.f.bytes, Math.floor(d));

  const field = (label: string) => {
    const dd = h('dd', null, '');
    return { row: [h('dt', null, label), dd], dd };
  };
  const rate = field('Speed');
  const done = field('Received');
  const pics = field('Pictures');
  const elapsed = field('Elapsed');
  const left = field('Time left');
  const meter = h('progress', { max: total, value: 0, 'aria-label': 'All pictures received' });
  const bar = h('div', { class: 'bbs-xfer-bar', 'aria-hidden': 'true' });
  const live = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
  const note = h('p', { class: 'bbs-xfer-note' });

  const start = h('button', { type: 'button', class: 'primary', onclick: () => void run(false) }, 'Start downloads');
  const stop = h('button', { type: 'button', onclick: () => halt() }, 'Stop');
  const again = h('button', { type: 'button', onclick: () => void run(true) }, 'Start over');
  const skip = h('button', { type: 'button', onclick: () => void finish() }, 'Show them all now');

  const speeds = h(
    'fieldset',
    { class: 'bbs-xfer-speeds' },
    h('legend', null, 'Modem speed (time for the largest picture)'),
    ...SPEEDS.map((s) =>
      h(
        'label',
        null,
        h('input', { type: 'radio', name: 'bbs-xfer-speed', value: String(s), checked: s === bps, onchange: () => setSpeed(s) }),
        ` ${commas(s)} bps `,
        h('span', { class: 'muted' }, `(${lasts(largest, s)})`),
      ),
    ),
  );

  const say = (text: string) => {
    live.textContent = text;
  };

  function update(): void {
    const now = performance.now();
    const d = delivered();
    let got = 0;
    let complete = 0;
    for (const l of lines.values()) {
      const g = gotOf(l, d);
      got += g;
      if (g >= l.f.bytes) complete++;
      l.meter.style.setProperty('--got', String(g / l.f.bytes));
      l.tile.classList.toggle('arrived', g >= l.f.bytes);
      if (l.bytes && g !== l.shown && (g >= l.f.bytes || now - l.paintedAt >= REDRAW_MS)) {
        l.shown = g;
        l.paintedAt = now;
        const pic = g ? decodePicture(l.bytes.subarray(0, Math.min(g, l.bytes.length))) : undefined;
        if (pic) paint(l.ctx, pic);
        else l.ctx.fillRect(0, 0, l.f.width, l.f.height);
      }
    }
    const secs = (elapsedBase + (state === 'running' ? now - since : 0)) / 1000;
    rate.dd.textContent = `${commas(bps)} bps on each line (${commas(bps / 10)} characters a second)`;
    done.dd.textContent = `${commas(got)} of ${commas(total)} bytes (${Math.floor((got / total) * 100)}%)`;
    pics.dd.textContent = `${complete} of ${lines.size} complete`;
    elapsed.dd.textContent = clock(secs);
    left.dd.textContent = clock(Math.max(0, largest - d) / (bps / 10));
    meter.value = got;
    bar.textContent = '█'.repeat(Math.round((got / total) * 30)).padEnd(30, '░');
    const quarter = Math.floor((got / total) * 4);
    if (state === 'running' && quarter > announced && quarter < 4) {
      announced = quarter;
      say(`${quarter * 25}% received, ${complete} of ${lines.size} pictures complete, ${left.dd.textContent} left.`);
    }
    if (state === 'running' && d >= largest) {
      state = 'done';
      note.textContent = 'All transfers complete.';
      say(`All ${lines.size} pictures received.`);
    }
    start.hidden = state === 'running' || state === 'done';
    start.textContent = state === 'stopped' ? 'Resume downloads' : 'Start downloads';
    stop.hidden = state !== 'running';
    again.hidden = state === 'ready';
    skip.disabled = state === 'done';
  }

  /** Every file's bytes, fetched once, all together. */
  async function fetchAll(): Promise<boolean> {
    try {
      await Promise.all([...lines.values()].map(async (l) => (l.bytes ??= await galleryBytes(l.f.name))));
      return true;
    } catch {
      note.textContent = 'The files are not on line right now. Try again later.';
      say(note.textContent);
      return false;
    }
  }

  async function run(over: boolean): Promise<void> {
    if (!(await fetchAll())) return;
    if (over || state === 'done') {
      base = 0;
      elapsedBase = 0;
      announced = 0;
      for (const l of lines.values()) l.shown = -1;
    }
    if (state === 'running' && !over) return;
    state = 'running';
    since = performance.now();
    note.textContent = 'Zmodem: receiving on every line at once. Each picture fills in as its bytes arrive, the way the BBS’s viewer drew it.';
    say(`Downloading ${lines.size} pictures at once, ${commas(bps)} bps each: about ${lasts(Math.max(0, largest - base), bps)}.`);
    tick();
  }

  function tick(): void {
    clearTimeout(timer);
    update();
    if (state === 'running' && start.isConnected) timer = window.setTimeout(tick, TICK_MS);
  }

  function rebase(): void {
    base = delivered();
    elapsedBase += performance.now() - since;
    since = performance.now();
  }

  function setSpeed(s: number): void {
    if (state === 'running') rebase();
    bps = s;
    if (state === 'running') say(`Now at ${commas(s)} bps.`);
    update();
  }

  function halt(): void {
    if (state !== 'running') return;
    rebase();
    state = 'stopped';
    clearTimeout(timer);
    note.textContent = 'Transfers aborted.';
    say(`Stopped at ${Math.floor((meter.value / total) * 100)}%.`);
    update();
  }

  async function finish(): Promise<void> {
    if (!(await fetchAll())) return;
    if (state === 'running') rebase();
    base = largest;
    state = 'done';
    clearTimeout(timer);
    note.textContent = 'Skipped to the end: every picture in full.';
    say(`All ${lines.size} pictures shown in full.`);
    update();
  }

  const controls = h(
    'div',
    { class: 'bbs-xfer' },
    h(
      'div',
      { class: 'bbs-xfer-status' },
      h('p', { class: 'bbs-xfer-title', 'aria-hidden': 'true' }, 'ZMODEM DOWNLOADS'),
      h('dl', null, ...rate.row, ...done.row, ...pics.row, ...elapsed.row, ...left.row),
      meter,
      bar,
    ),
    h('div', { class: 'bbs-xfer-side' }, speeds, h('div', { class: 'buttons' }, start, stop, again, skip), note),
    live,
  );

  // starts the first time the sheet comes into view
  if (reduced) note.textContent = 'Reduced motion is on, so the downloads wait for you: start them, or show them all now.';
  else {
    const seen = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      seen.disconnect();
      if (state === 'ready') void run(false);
    });
    queueMicrotask(() => seen.observe(controls));
  }

  return {
    controls,
    tile(f: GalleryFile): HTMLElement {
      const canvas = h('canvas', { width: f.width, height: f.height, role: 'img', 'aria-label': altOf(f), class: 'bbs-sheet-canvas' });
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, f.width, f.height);
      const meterEl = h('span', { class: 'bbs-sheet-meter', 'aria-hidden': 'true' });
      const tile = h(
        'li',
        { class: 'bbs-sheet-pic' },
        h('span', { class: 'bbs-sheet-screen' }, canvas),
        meterEl,
        h('span', { class: 'bbs-sheet-name' }, f.name),
      );
      lines.set(f.name, { f, ctx, meter: meterEl, tile, shown: -1, paintedAt: 0 });
      update();
      return tile;
    },
  };
}
