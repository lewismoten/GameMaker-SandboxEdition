// "Make it smaller": a dialog on the animation editor's Frames tab. It reports why the .FLI is the
// size it is, lets the author pick lossless or lossy steps, plays the original beside the real
// re-encoded result, and applies it (or, for a game open to look at only, makes a copy). The work
// runs in a Web Worker (shrinkClient.ts), restarted on each change, so typing never blocks.
import { decodeFliFrames, type FliFrames } from '@lewismoten/gamemaker-sandbox-engine/formats/fliFrames';
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
  let stopPlay = () => undefined as void;

  const reportBox = h('div', { class: 'shrink-report', 'aria-busy': 'true' }, 'Reading the file…');
  const stats = h('div', { class: 'shrink-stats', role: 'status', 'aria-live': 'polite' }, 'Working…');
  const origCanvas = h('canvas', { class: 'pixel', 'aria-label': 'Original, playing' });
  const newCanvas = h('canvas', { class: 'pixel', 'aria-label': 'Smaller result, playing' });
  const applyBtn = h('button', { class: 'primary', disabled: true }, locked ? 'Make a smaller copy' : 'Use the smaller file');

  const play = (orig: FliFrames, next: FliFrames) => {
    stopPlay();
    let raf = 0;
    const start = performance.now();
    const len = (a: FliFrames) => (a.frames.length * Math.max(1, a.speed) * 1000) / RETRACE;
    const at = (a: FliFrames, t: number) => Math.min(a.frames.length - 1, Math.floor(((t % len(a)) / 1000) * (RETRACE / Math.max(1, a.speed))));
    const tick = (now: number) => {
      const t = now - start;
      const o = orig.frames[at(orig, t)];
      const n = next.frames[at(next, t)];
      paintIndexed(origCanvas, o.pixels, orig.width, orig.height, o.palette);
      paintIndexed(newCanvas, n.pixels, next.width, next.height, n.palette);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    stopPlay = () => cancelAnimationFrame(raf);
  };

  const showOutcome = (o: ShrinkOutcome) => {
    outcome = o;
    const v = describeVisibility(o.visibility);
    clear(
      stats,
      h('strong', null, describeSaved(o.before, o.bytes.length)),
      h('span', { class: `shrink-level shrink-${v.level}` }, o.lossless ? ' Lossless: every pixel and color is the same.' : ` ${v.words}`),
      o.lossless ? '' : h('small', null, ' (an upper bound, from the steps added together)'),
      h('ul', null, ...o.steps.map((s) => h('li', null, `${s.name}: ${s.savedBytes >= 0 ? 'saves' : 'adds'} ${kb(Math.abs(s.savedBytes))}`))),
    );
    applyBtn.disabled = o.bytes.length >= o.before && o.lossless;
    applyBtn.title = applyBtn.disabled ? 'The result is no smaller, so there is nothing to apply' : '';
    play(decodeFliFrames(original), decodeFliFrames(o.bytes));
  };

  const run = () => {
    running?.cancel();
    applyBtn.disabled = true;
    stats.setAttribute('aria-busy', 'true');
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

  // ---- controls ----
  const lossyBox = h('input', { type: 'checkbox' });
  lossyBox.addEventListener('change', () => set({ lossy: lossyBox.checked }));
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
  function syncControls() {
    lossyBox.checked = opts.lossy;
    dropBox.checked = opts.dropFrames;
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
    return h(
      'div',
      { class: 'shrink' },
      h('h3', null, `${file} now`),
      reportBox,
      h('h3', null, 'Options'),
      h(
        'div',
        { class: 'shrink-options' },
        h('label', { class: 'check' }, lossyBox, h('span', null, 'Allow lossy changes (the pictures may differ a little)')),
        h('p', { class: 'hint' }, 'Lossless always runs: palette changes only for the colors a frame draws, with the same pictures.'),
        ...nums.map((n) => n.label),
        h('label', { class: 'check' }, dropBox, h('span', null, 'Keep every other frame (each shown twice as long, so it lasts the same time)')),
        h('div', { class: 'toolbar' }, gentle, lossless),
      ),
      h('h3', null, 'Preview'),
      h(
        'div',
        { class: 'shrink-preview' },
        h('figure', null, origCanvas, h('figcaption', null, 'Original')),
        h('figure', null, newCanvas, h('figcaption', null, 'Smaller')),
      ),
      stats,
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
