// "Make it smaller": a dialog on the animation editor's Frames tab. It reports why the .FLI is the
// size it is, lets the author pick lossless or lossy steps, plays the original beside the real
// re-encoded result, and applies it (or, for a game open to look at only, makes a copy). The work
// runs in a Web Worker (shrinkClient.ts), restarted on each change, so typing never blocks.
import { decodeFliFrames, type FliFrames } from '@lewismoten/gamemaker-sandbox-engine/formats/fliFrames';
import { bandColor } from '@lewismoten/gamemaker-sandbox-tools/kit/fliShrink';
import type { FliReport } from '@lewismoten/gamemaker-sandbox-tools/kit/fliShrink';
import { paintIndexed } from '../../../core/draw';
import type { Project } from '../../../core/project';
import { clear, debounce, h, modal, toast } from '../../../core/ui';
import { startReport, startShrink } from './shrinkClient';
import type { ShrinkOutcome } from './shrinkRun';
import { DEFAULT_OPTIONS, GENTLE, describeSaved, describeVisibility, kb, stepsFor, type ShrinkOptions } from './shrinkOptions';

const RETRACE = 70;

/** Opens the dialog for one .FLI. `apply` writes the bytes in place as one undoable step. */
export async function openShrinkPanel(project: Project, file: string, apply: (bytes: Uint8Array) => void): Promise<void> {
  const original = project.files.get(file);
  if (!original) return;
  const locked = !!project.readOnly;
  const opts: ShrinkOptions = { ...DEFAULT_OPTIONS };
  let outcome: ShrinkOutcome | undefined;
  let running: { cancel(): void } | undefined;

  const reportBox = h('div', { class: 'shrink-report', 'aria-busy': 'true' }, 'Reading the file…');
  const stats = h('div', { class: 'shrink-stats', role: 'status', 'aria-live': 'polite' }, 'Working…');
  const origCanvas = h('canvas', { class: 'pixel', 'aria-label': 'Original' });
  const newCanvas = h('canvas', { class: 'pixel', 'aria-label': 'Smaller result' });
  const newCaption = h('figcaption', null, 'Smaller');
  const applyBtn = h('button', { class: 'primary', disabled: true }, locked ? 'Make a smaller copy' : 'Use the smaller file');

  // ---- the preview: both sides on one clock, looping, from the first moment (the original plays
  // while the result is made, and keeps playing while it is made again) ----
  const origFrames = decodeFliFrames(original);
  let next: FliFrames | undefined;
  let pos = 0; // ms into the animation
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let playing = !still;
  const wait = (a: FliFrames) => (Math.max(1, a.speed) * 1000) / RETRACE;
  const total = (a: FliFrames) => a.frames.length * wait(a);
  const frameAt = (a: FliFrames, t: number) => Math.max(0, Math.min(a.frames.length - 1, Math.floor((t % total(a)) / wait(a))));
  const playBtn = h('button', { type: 'button', class: 'shrink-play' });
  const scrub = h('input', { type: 'range', min: 0, max: Math.max(0, origFrames.frames.length - 1), value: 0, 'aria-label': 'Frame' });
  const counter = h('span', { class: 'shrink-counter' });
  const state = h('span', { class: 'shrink-state' });
  const paint = () => {
    const i = frameAt(origFrames, pos);
    const o = origFrames.frames[i];
    paintIndexed(origCanvas, o.pixels, origFrames.width, origFrames.height, o.palette);
    if (next) {
      const n = next.frames[frameAt(next, pos)];
      paintIndexed(newCanvas, n.pixels, next.width, next.height, n.palette);
    }
    scrub.value = String(i);
    counter.textContent = `Frame ${i + 1} of ${origFrames.frames.length}`;
  };
  const syncPlay = () => {
    playBtn.textContent = playing ? '⏸ Pause' : '▶ Play';
    state.textContent = playing ? 'Playing, looping' : 'Paused';
    state.classList.toggle('on', playing);
  };
  let raf = 0;
  let last = 0;
  const tick = (now: number) => {
    if (playing) {
      pos = (pos + Math.max(0, Math.min(250, now - (last || now)))) % total(origFrames);
      paint();
    }
    last = now;
    raf = requestAnimationFrame(tick);
  };
  const stopPlay = () => cancelAnimationFrame(raf);
  playBtn.addEventListener('click', () => {
    playing = !playing;
    syncPlay();
  });
  scrub.addEventListener('input', () => {
    playing = false;
    pos = Number(scrub.value) * wait(origFrames);
    syncPlay();
    paint();
  });
  syncPlay();
  paint();
  raf = requestAnimationFrame(tick);

  const showOutcome = (o: ShrinkOutcome) => {
    outcome = o;
    const v = describeVisibility(o.visibility);
    clear(
      stats,
      h('strong', null, describeSaved(o.before, o.bytes.length)),
      h('span', { class: `shrink-level shrink-${v.level}` }, o.lossless ? ' Lossless: every pixel and color is the same.' : ` ${v.words}`),
      h('small', null, 'Each step against re-encoding the one before it:'),
      h('ul', null, ...o.steps.map((s) => h('li', null, `${s.name}: ${s.savedBytes >= 0 ? 'saves' : 'adds'} ${kb(Math.abs(s.savedBytes))}`))),
    );
    applyBtn.disabled = o.bytes.length >= o.before;
    applyBtn.title = applyBtn.disabled ? 'The result is no smaller, so there is nothing to apply' : '';
    next = decodeFliFrames(o.bytes);
    newCaption.textContent = 'Smaller';
    paint();
  };

  const run = () => {
    running?.cancel();
    applyBtn.disabled = true;
    stats.setAttribute('aria-busy', 'true');
    newCaption.textContent = next ? 'Smaller (updating…)' : 'Smaller (working…)';
    const job = startShrink(original, stepsFor(opts));
    running = job;
    job.done.then(
      (o) => {
        if (running !== job) return;
        stats.removeAttribute('aria-busy');
        showOutcome(o);
      },
      (e: Error) => {
        if (e.name !== 'AbortError') clear(stats, `That didn’t work: ${e.message}`);
      },
    );
  };
  const later = debounce(run, 250);
  const set = (change: Partial<ShrinkOptions>) => {
    Object.assign(opts, change);
    syncControls();
    later();
  };

  // ---- Frame it: the bands drawn over the original, each edge draggable and keyboard operable ----
  type Edge = 'top' | 'bottom' | 'left' | 'right';
  const W = origFrames.width;
  const H = origFrames.height;
  const stage = h('div', { class: 'shrink-stage' }, origCanvas);
  const shades = Object.fromEntries(
    (['top', 'bottom', 'left', 'right'] as Edge[]).map((e) => [e, h('div', { class: `shrink-shade ${e}`, 'aria-hidden': 'true' })]),
  ) as unknown as Record<Edge, HTMLElement>;
  const handles = {} as Record<Edge, HTMLElement>;
  const limit = (e: Edge) =>
    (e === 'top' || e === 'bottom' ? H : W) - 1 - (e === 'top' ? opts.bottom : e === 'bottom' ? opts.top : e === 'left' ? opts.right : opts.left);
  const setEdge = (e: Edge, v: number) => set({ lossy: true, [e]: Math.max(0, Math.min(limit(e), Math.round(v))) });
  const names: Record<Edge, string> = { top: 'Top band', bottom: 'Bottom band', left: 'Left band', right: 'Right band' };
  for (const e of ['top', 'bottom', 'left', 'right'] as Edge[]) {
    const vertical = e === 'left' || e === 'right';
    const hd = h('div', {
      class: `shrink-handle ${e}`,
      role: 'slider',
      tabIndex: 0,
      'aria-label': `${names[e]} edge, in pixels`,
      'aria-orientation': vertical ? 'vertical' : 'horizontal',
      'aria-valuemin': '0',
      'aria-valuemax': String((vertical ? W : H) - 1),
    });
    hd.addEventListener('keydown', (ev) => {
      const step = ev.shiftKey ? 10 : 1;
      const grow = (vertical ? 'ArrowRight' : 'ArrowDown') === ev.key ? 1 : (vertical ? 'ArrowLeft' : 'ArrowUp') === ev.key ? -1 : 0;
      const dir = grow * (e === 'bottom' || e === 'right' ? -1 : 1);
      if (!grow) return;
      ev.preventDefault();
      setEdge(e, opts[e] + dir * step);
    });
    hd.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      hd.setPointerCapture(ev.pointerId);
      hd.focus();
      const move = (m: PointerEvent) => {
        const r = origCanvas.getBoundingClientRect();
        const px = vertical ? ((m.clientX - r.left) / r.width) * W : ((m.clientY - r.top) / r.height) * H;
        setEdge(e, e === 'top' || e === 'left' ? px : (vertical ? W : H) - px);
      };
      const up = () => {
        hd.removeEventListener('pointermove', move);
        hd.removeEventListener('pointerup', up);
      };
      hd.addEventListener('pointermove', move);
      hd.addEventListener('pointerup', up);
    });
    handles[e] = hd;
  }
  stage.append(...Object.values(shades), ...Object.values(handles));
  const placeEdges = () => {
    const pct = (v: number, of: number) => `${(v / of) * 100}%`;
    for (const e of ['top', 'bottom', 'left', 'right'] as Edge[]) {
      const vertical = e === 'left' || e === 'right';
      const size = pct(opts[e], vertical ? W : H);
      shades[e].style[vertical ? 'width' : 'height'] = size;
      handles[e].style[e] = `calc(${size} - 12px)`;
      handles[e].setAttribute('aria-valuenow', String(opts[e]));
      handles[e].setAttribute('aria-valuetext', `${opts[e]} pixels`);
    }
  };

  // ---- controls ----
  const lossyBox = h('input', { type: 'checkbox' });
  lossyBox.addEventListener('change', () => set({ lossy: lossyBox.checked }));
  const oneBox = h('input', { type: 'checkbox', 'aria-describedby': 'shrink-onePalette' });
  oneBox.addEventListener('change', () => set({ onePalette: oneBox.checked }));
  const dropBox = h('input', { type: 'checkbox' });
  dropBox.addEventListener('change', () => set({ dropFrames: dropBox.checked }));
  const num = (key: 'maxColors' | 'snapTolerance' | 'ditherTolerance' | 'holdTolerance', label: string, hint: string, max: number, on: number) => {
    const input = h('input', { type: 'number', min: 0, max, step: 1, value: '0', 'aria-describedby': `shrink-${key}` });
    input.addEventListener('change', () => {
      const v = Math.max(0, Math.min(max, Math.round(Number(input.value) || 0)));
      input.value = String(v);
      set({ [key]: v });
    });
    const label_ = h('label', { class: 'shrink-field' }, h('span', null, label), input, h('small', { id: `shrink-${key}` }, hint));
    return { label: label_, input, on };
  };
  const nums = [
    num('maxColors', 'Most colors', '0 = leave as is; else 2 to 255. Fewer colors, fewer changes.', 255, GENTLE.maxColors),
    num('snapTolerance', 'Snap near colors', '0 = off; else how close (of 255) two colors must be to merge.', 255, GENTLE.snapTolerance),
    num('ditherTolerance', 'Reduce dithering', '0 = off; else flatten speckle between shades this close.', 255, GENTLE.ditherTolerance),
    num('holdTolerance', 'Hold still areas', '0 = off; else a pixel that moves this little stays put.', 255, GENTLE.holdTolerance),
  ];
  const edgeInputs = (['top', 'bottom', 'left', 'right'] as const).map((e) => {
    const input = h('input', { type: 'number', min: 0, max: e === 'top' || e === 'bottom' ? H - 1 : W - 1, step: 1, value: '0' });
    input.addEventListener('change', () => setEdge(e, Number(input.value) || 0));
    return { e, input, label: h('label', { class: 'shrink-field' }, h('span', null, `${names[e]} (px)`), input, h('small', null, '')) };
  });
  const zoomIn = h('input', { type: 'range', min: 25, max: 400, step: 5, value: '100', 'aria-describedby': 'shrink-zoomnote' });
  const zoomOut = h('output', { class: 'shrink-zoomval', 'aria-live': 'off' }, '100%');
  zoomIn.addEventListener('input', () => set({ zoom: Number(zoomIn.value) / 100 }));
  const panFields = (['panX', 'panY'] as const).map((k) => {
    const input = h('input', { type: 'number', step: 1, value: '0' });
    input.addEventListener('change', () => set({ [k]: Math.round(Number(input.value) || 0) }));
    return {
      k,
      input,
      label: h(
        'label',
        { class: 'shrink-field' },
        h('span', null, k === 'panX' ? 'Move picture sideways (px)' : 'Move picture up/down (px)'),
        input,
        h('small', null, ''),
      ),
    };
  });
  const band = bandColor(origFrames.frames[0].palette);
  const frameBox = h(
    'fieldset',
    { class: 'shrink-frame' },
    h('legend', null, 'Frame it'),
    h(
      'small',
      { id: 'shrink-zoomnote', class: 'hint' },
      `The animation stays ${W}×${H}. Solid bands at the edges (drag them on the Original, use the arrow keys, or type pixels) never change after the first frame, so they cost almost nothing. ${band === 0 ? 'Bands use color 0, which is black here.' : `Color 0 is not black here, so the bands use color ${band}, the darkest.`} At 100% the bands just cover the picture's edges. Any other zoom centers the picture in the area between them, and “Fit to bands” sizes it to fill that area. Zoom scales the picture: smaller averages pixels into the nearest of its own colors; larger repeats pixels.`,
    ),
    ...edgeInputs.map((x) => x.label),
    h('label', { class: 'shrink-field shrink-zoom' }, h('span', null, 'Zoom'), zoomIn, zoomOut),
    h(
      'div',
      { class: 'toolbar' },
      h(
        'button',
        {
          type: 'button',
          title: 'Shrink the whole picture to fill the area between the bands',
          onclick: () =>
            set({
              lossy: true,
              zoom: Math.max(0.25, Math.min(1, Math.floor(Math.min((W - opts.left - opts.right) / W, (H - opts.top - opts.bottom) / H) * 20) / 20)),
            }),
        },
        'Fit to bands',
      ),
    ),
    ...panFields.map((x) => x.label),
  );
  function syncControls() {
    placeEdges();
    for (const x of edgeInputs) {
      x.input.value = String(opts[x.e]);
      x.input.disabled = !opts.lossy;
      handles[x.e].setAttribute('aria-disabled', String(!opts.lossy));
    }
    zoomIn.value = String(Math.round(opts.zoom * 100));
    zoomIn.disabled = !opts.lossy;
    zoomOut.textContent = `${Math.round(opts.zoom * 100)}%`;
    for (const x of panFields) {
      x.input.value = String(opts[x.k]);
      x.input.disabled = !opts.lossy;
    }
    lossyBox.checked = opts.lossy;
    dropBox.checked = opts.dropFrames;
    oneBox.checked = opts.onePalette;
    oneBox.disabled = !opts.lossy;
    dropBox.disabled = !opts.lossy;
    for (const n of nums) {
      const key = n.input.getAttribute('aria-describedby')!.slice(7) as keyof ShrinkOptions;
      n.input.value = String(opts[key]);
      n.input.disabled = !opts.lossy;
    }
  }
  const gentle = h(
    'button',
    {
      type: 'button',
      title: 'Turn on lossy changes with gentle strengths for every step',
      onclick: () =>
        set({
          lossy: true,
          maxColors: GENTLE.maxColors,
          snapTolerance: GENTLE.snapTolerance,
          ditherTolerance: GENTLE.ditherTolerance,
          holdTolerance: GENTLE.holdTolerance,
        }),
    },
    'Try gentle settings',
  );
  const lossless = h('button', { type: 'button', title: 'Back to the lossless step only', onclick: () => set({ ...DEFAULT_OPTIONS }) }, 'Lossless only');

  const result = await modal<boolean>('Make it smaller', (close) => {
    const finish = async () => {
      if (!outcome) return;
      applyBtn.disabled = true;
      try {
        if (locked) {
          const { makeOptimizedCopy } = await import('../../../disk/makeOptimizedCopy');
          const name = await makeOptimizedCopy(project, (files) => files.set(file, outcome!.bytes));
          toast(`Made “${name}” in My Games with the smaller ${file}. This game is unchanged.`);
        } else {
          apply(outcome.bytes);
          toast(`${file} is ${describeSaved(outcome.before, outcome.bytes.length).toLowerCase()} Undo brings the old one back.`);
        }
        close(true);
      } catch (e) {
        toast(`Could not apply it: ${(e as Error).message}`, 'error');
        applyBtn.disabled = false;
      }
    };
    applyBtn.addEventListener('click', () => void finish());
    syncControls();
    void startReport(original).done.then(
      (r) => (clear(reportBox, ...reportView(r)), reportBox.removeAttribute('aria-busy')),
      (e: Error) => clear(reportBox, `The report failed: ${e.message}`),
    );
    run();
    requestAnimationFrame(() => document.querySelector('.shrink-body')?.scrollTo(0, 0));
    return h(
      'div',
      { class: 'shrink' },
      h(
        'div',
        { class: 'shrink-body', dataset: { listArea: '' } },
        h(
          'section',
          { class: 'shrink-left' },
          h('h3', null, `${file} now`),
          reportBox,
          h('h3', null, 'Options'),
          h(
            'div',
            { class: 'shrink-options' },
            h('label', { class: 'check' }, lossyBox, h('span', null, 'Allow lossy changes (the pictures may differ a little)')),
            h('p', { class: 'hint' }, 'Lossless always runs: palette changes only for the colors a frame draws, with the same pictures.'),
            ...nums.map((n) => n.label),
            frameBox,
            h('label', { class: 'check' }, oneBox, h('span', null, 'One palette for the whole animation')),
            h(
              'small',
              { id: 'shrink-onePalette', class: 'hint' },
              'An .FLI changes its colors with palette chunks, as in a fade. This picks one palette (Most colors sets how many, up to 256) for every frame and drops those chunks, so fades become pixel changes. That can cost more bytes than it saves: the saving shown says which.',
            ),
            h('label', { class: 'check' }, dropBox, h('span', null, 'Keep every other frame (each shown twice as long, so it lasts the same time)')),
            h('div', { class: 'toolbar' }, gentle, lossless),
          ),
        ),
        h(
          'section',
          { class: 'shrink-right' },
          h('h3', null, 'Preview'),
          h('div', { class: 'shrink-transport' }, playBtn, scrub, counter, state),
          h(
            'div',
            { class: 'shrink-preview' },
            h('figure', null, stage, h('figcaption', null, 'Original (drag the edges to frame it)')),
            h('figure', null, newCanvas, newCaption),
          ),
          stats,
        ),
      ),
      h(
        'div',
        { class: 'toolbar shrink-actions' },
        applyBtn,
        h('button', { type: 'button', onclick: () => close(undefined) }, 'Cancel'),
        locked ? h('small', null, 'This game is open to look at only, so this saves a copy in My Games.') : '',
      ),
    );
  });
  running?.cancel();
  stopPlay();
  void result;
}

/** The report in plain words: size, bytes by kind, the biggest frames, and suggestions. */
function reportView(r: FliReport): HTMLElement[] {
  const total = r.totalBytes || 1;
  const chunks = Object.entries(r.byChunk).sort((a, b) => b[1] - a[1]);
  const biggest = [...r.frames].sort((a, b) => b.bytes - a.bytes).slice(0, 5);
  return [
    h('p', null, h('strong', null, `${kb(r.totalBytes)}`), ` (${r.totalBytes.toLocaleString()} bytes) in ${r.frames.length} frames.`),
    h('p', null, 'By kind: ', chunks.map(([k, b]) => `${k} ${kb(b)} (${Math.round((b / total) * 100)}%)`).join(', '), '.'),
    h('p', null, 'Biggest frames: ', biggest.map((f) => `${f.frame + 1} (${kb(f.bytes)}, ${f.changedPixels.toLocaleString()} pixels changed)`).join('; '), '.'),
    r.findings.length ? h('ul', { class: 'shrink-findings' }, ...r.findings.map((f) => h('li', null, f))) : h('p', null, 'Nothing stands out as wasteful.'),
    h(
      'p',
      { class: 'hint' },
      'These are suggestions you can ignore. The tool counts bytes and pixels; it can’t tell which colors or motion matter to your picture, so use the preview to judge.',
    ),
  ];
}
