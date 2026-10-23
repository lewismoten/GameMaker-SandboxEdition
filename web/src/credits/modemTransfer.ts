// The Credits page's modem download: one of the BBSes' pictures arriving at a 1990s modem's
// speed, drawn from the bytes received so far by the same decoders the BBS viewer uses
// (retro/bbs/gallery.ts decodePicture: an interlaced GIF's passes coarse to fine, a
// progressive JPEG's scans blurry to sharp, anything else top to bottom), beside a Zmodem
// status box: bytes, cps, elapsed time and time left. Stop, Skip and a speed change work
// mid-transfer; a live region announces each quarter; with reduced motion it waits to be started.
import { h, modal } from '../editor/core/ui';
import { commas } from '../retro/dos/vfs';
import { decodePicture, formatLabel, galleryBytes, type GalleryFile, type ScreenPicture } from '../retro/bbs/gallery';

/** Modem speeds in bits per second; ten bits a byte on the wire (start, 8 data, stop), and these files don't compress further. */
const SPEEDS = [300, 1200, 2400, 14400] as const;
const DEFAULT_SPEED = 2400;
const TICK_MS = 100;

const clock = (s: number) => {
  const t = Math.max(0, Math.round(s));
  const hours = Math.floor(t / 3600);
  const mm = String(Math.floor((t % 3600) / 60)).padStart(hours ? 2 : 1, '0');
  return `${hours ? `${hours}:` : ''}${mm}:${String(t % 60).padStart(2, '0')}`;
};

/** How long a whole file takes at a speed, in words (for the speed choices). */
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

/** Opens the transfer screen for a picture. */
export function downloadPicture(f: GalleryFile, alt: string): void {
  void modal<void>(`Downloading ${f.name}`, () => transferView(f, alt));
}

function transferView(f: GalleryFile, alt: string): HTMLElement {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let bps: number = DEFAULT_SPEED;
  let bytes: Uint8Array | undefined;
  let got = 0;
  let shown = -1;
  /** Bytes and time when the transfer (re)started or changed speed. */
  let from = 0;
  let since = 0;
  let began = 0;
  let timer = 0;
  let announced = 0;
  let state: 'ready' | 'running' | 'stopped' | 'done' = 'ready';

  const canvas = h('canvas', { width: f.width, height: f.height, role: 'img', 'aria-label': alt, class: 'bbs-xfer-picture' });
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, f.width, f.height);

  const field = (label: string) => {
    const dd = h('dd', null, '');
    return { row: [h('dt', null, label), dd], dd };
  };
  const rate = field('Speed');
  const done = field('Bytes');
  const cps = field('CPS');
  const elapsed = field('Elapsed');
  const left = field('Time left');
  const meter = h('progress', { max: f.bytes, value: 0, 'aria-label': `${f.name} received` });
  const bar = h('div', { class: 'bbs-xfer-bar', 'aria-hidden': 'true' });
  const live = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
  const note = h('p', { class: 'bbs-xfer-note' });

  const start = h('button', { type: 'button', class: 'primary', onclick: () => void run() }, 'Start download');
  const stop = h('button', { type: 'button', onclick: () => halt() }, 'Stop');
  const skip = h('button', { type: 'button', onclick: () => void finish(true) }, reduced ? 'Show the picture now' : 'Skip to the end');

  const speeds = h(
    'fieldset',
    { class: 'bbs-xfer-speeds' },
    h('legend', null, 'Modem speed'),
    ...SPEEDS.map((s) =>
      h(
        'label',
        null,
        h('input', {
          type: 'radio',
          name: 'bbs-xfer-speed',
          value: String(s),
          checked: s === bps,
          onchange: () => setSpeed(s),
        }),
        ` ${commas(s)} bps `,
        h('span', { class: 'muted' }, `(${lasts(f.bytes, s)})`),
      ),
    ),
  );

  const say = (text: string) => {
    live.textContent = text;
  };

  function update(): void {
    const now = performance.now();
    if (state === 'running') got = Math.min(f.bytes, from + Math.floor(((now - since) / 1000) * (bps / 10)));
    const secs = state === 'ready' ? 0 : ((state === 'running' ? now : since) - began) / 1000;
    rate.dd.textContent = `${commas(bps)} bps (${commas(bps / 10)} characters a second)`;
    done.dd.textContent = `${commas(got)} of ${commas(f.bytes)} (${Math.floor((got / f.bytes) * 100)}%)`;
    cps.dd.textContent = state === 'running' ? commas(bps / 10) : '0';
    elapsed.dd.textContent = clock(secs);
    left.dd.textContent = state === 'done' ? '0:00' : clock((f.bytes - got) / (bps / 10));
    meter.value = got;
    bar.textContent = '█'.repeat(Math.round((got / f.bytes) * 30)).padEnd(30, '░');
    if (bytes && got !== shown) {
      shown = got;
      const pic = decodePicture(bytes.subarray(0, Math.min(got, bytes.length)));
      if (pic) paint(ctx, pic);
    }
    const quarter = Math.floor((got / f.bytes) * 4);
    if (state === 'running' && quarter > announced && quarter < 4) {
      announced = quarter;
      say(`${quarter * 25}% received, ${clock((f.bytes - got) / (bps / 10))} left.`);
    }
    if (state === 'running' && got >= f.bytes) void finish(false);
    start.hidden = state === 'running';
    start.textContent = state === 'ready' ? 'Start download' : 'Download again';
    stop.disabled = state !== 'running';
    skip.disabled = state === 'done';
  }

  async function run(): Promise<void> {
    try {
      bytes ??= await galleryBytes(f.name);
    } catch {
      note.textContent = 'The file is not on line right now. Try again later.';
      say(note.textContent);
      return;
    }
    if (state !== 'running') {
      if (state === 'done' || state === 'stopped') {
        got = 0;
        announced = 0;
        ctx.fillRect(0, 0, f.width, f.height);
      }
      state = 'running';
      from = got;
      since = began = performance.now();
      note.textContent = 'Zmodem: receiving. The picture fills in as the bytes arrive, the way the BBS’s viewer drew it.';
      say(`Downloading ${f.name}, ${commas(f.bytes)} bytes at ${commas(bps)} bps: about ${lasts(f.bytes, bps)}.`);
      tick();
    }
  }

  function tick(): void {
    clearTimeout(timer);
    update();
    if (state === 'running' && canvas.isConnected) timer = window.setTimeout(tick, TICK_MS);
  }

  function setSpeed(s: number): void {
    if (state === 'running') {
      update();
      from = got;
      since = performance.now();
    }
    bps = s;
    if (state === 'running') say(`Now at ${commas(s)} bps.`);
    update();
  }

  function halt(): void {
    if (state !== 'running') return;
    update();
    state = 'stopped';
    since = performance.now();
    clearTimeout(timer);
    note.textContent = 'Transfer aborted.';
    say(`Transfer stopped at ${Math.floor((got / f.bytes) * 100)}%.`);
    update();
  }

  async function finish(skipped: boolean): Promise<void> {
    try {
      bytes ??= await galleryBytes(f.name);
    } catch {
      note.textContent = 'The file is not on line right now. Try again later.';
      return;
    }
    if (state === 'ready') began = performance.now();
    got = f.bytes;
    state = 'done';
    since = performance.now();
    clearTimeout(timer);
    note.textContent = skipped ? 'Skipped to the end: the whole picture.' : 'Transfer complete.';
    say(skipped ? `${f.name} shown in full.` : `Transfer complete: ${f.name}, ${commas(f.bytes)} bytes.`);
    update();
  }

  const view = h(
    'div',
    { class: 'bbs-xfer' },
    h('p', { class: 'bbs-xfer-file' }, `${f.name} · ${commas(f.bytes)} bytes · ${f.width}x${f.height} ${formatLabel(f)}`),
    h('div', { class: 'bbs-xfer-screen' }, canvas),
    h(
      'div',
      { class: 'bbs-xfer-status' },
      h('p', { class: 'bbs-xfer-title', 'aria-hidden': 'true' }, 'ZMODEM DOWNLOAD'),
      h('dl', null, ...rate.row, ...done.row, ...cps.row, ...elapsed.row, ...left.row),
      meter,
      bar,
    ),
    speeds,
    note,
    live,
    h('div', { class: 'buttons' }, start, stop, skip),
  );

  if (reduced) note.textContent = 'Reduced motion is on, so the transfer waits for you: start it, or show the picture now.';
  update();
  // the modal gives the dialog no name: it takes the picture's
  queueMicrotask(() => {
    const dlg = view.closest('dialog');
    if (!dlg) return;
    dlg.classList.add('bbs-xfer-dialog');
    dlg.setAttribute('aria-label', `Downloading ${f.name}`);
    dlg.addEventListener('close', () => {
      state = 'stopped';
      clearTimeout(timer);
    });
  });
  if (!reduced) void run();
  return view;
}
