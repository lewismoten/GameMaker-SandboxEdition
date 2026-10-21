// Sound Blaster samples (.VOC): see the sound as a waveform, select part of it and trim,
// cut, fade, change its volume or speed, reverse it, give it a period effect or record
// over it. Each change is saved as an 8-bit PCM .VOC at the sample's own rate, the kind
// the Sound Blaster (and PLAYGAME) plays; the original bytes are kept until you change it.
import './sample.css';
import { registerEditor } from '../registry';
import { h, clear, download, toast } from '../../core/ui';
import { encodeWav, toPcm8 } from '../../../media/wav';
import { decodeVoc, encodeVoc } from '../../../formats/voc';
import { audio } from '../../widgets/mediaShared';
import { drawWave } from '../../widgets/waveform';
import { startRecording } from '../../tools/vocMaker';
import {
  applyEffect,
  cut,
  EFFECTS,
  fadeIn,
  fadeOut,
  gain,
  inSpan,
  normalize,
  resample,
  reverse,
  silence,
  splice,
  spanOf,
  trim,
  type Effect,
  type Span,
} from '../../../audio/sampleEdit';
import { classifySound, SOUND_GROUPS } from '../../../audio/soundProfile';

registerEditor(['voc'], (host, project, file) => {
  const original = decodeVoc(project.files.get(file)!);
  const rate = original.sampleRate;
  let samples = original.samples;
  const undo: Float32Array[] = [];
  const redo: Float32Array[] = [];
  let sel: Span | undefined;
  let cursor = 0;
  let playing: { src: AudioBufferSourceNode; from: number; started: number } | undefined;
  let raf = 0;
  let speed = 100;
  let volume = 100;

  const wave = h('canvas', { class: 'voc-edit-wave', tabIndex: 0, 'aria-label': 'Waveform: drag to select part of the sound' });
  const info = h('div', { class: 'voc-edit-info' });
  const selInfo = h('span', { class: 'voc-edit-sel' });
  const undoBtn = h('button', { title: 'Undo (Ctrl+Z)', onclick: () => history(undo, redo) }, '↶ Undo');
  const redoBtn = h('button', { title: 'Redo (Ctrl+Y)', onclick: () => history(redo, undo) }, '↷ Redo');
  const playBtn = h('button', { class: 'primary voc-edit-play', title: 'Play the selection, or all of it (Space)', onclick: () => togglePlay() }, '▶ Play');

  const secs = (n: number) => `${(n / rate).toFixed(2)} s`;
  const span = () => (sel && sel.end > sel.start ? sel : undefined);

  const draw = () => {
    const box = wave.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(200, Math.round((box.width || 640) * dpr));
    const hh = Math.round((box.height || 180) * dpr);
    if (wave.width !== w) wave.width = w;
    if (wave.height !== hh) wave.height = hh;
    const marks = [{ at: cursor, color: '#6cf28a' }];
    if (playing && audio.context) marks.push({ at: playing.from + (audio.context.currentTime - playing.started) * rate, color: '#ffffff' });
    drawWave(wave, samples, { selection: span(), marks, tick: Math.round(rate / 10) });
  };

  const refresh = () => {
    const group = samples.length ? SOUND_GROUPS.find((g) => g.id === classifySound(samples, rate)) : undefined;
    clear(
      info,
      h('strong', null, secs(samples.length)),
      ` · ${rate.toLocaleString()} Hz · ${(project.files.get(file)?.length ?? 0).toLocaleString()} bytes · sound sets call it “${file.replace(/\.voc$/, '').toUpperCase()}”`,
      group ? h('span', { class: 'voc-group', title: `Sounds like: ${group.hint}` }, `${group.icon} ${group.label}`) : null,
    );
    const s = span();
    selInfo.textContent = s
      ? `Selected ${secs(s.start)} – ${secs(s.end)} (${secs(s.end - s.start)})`
      : `Cursor at ${secs(cursor)} · nothing selected: tools change the whole sound`;
    undoBtn.disabled = !undo.length;
    redoBtn.disabled = !redo.length;
    draw();
  };

  /** Replaces the sound (remembering the old one for undo) and saves it. */
  const commit = (next: Float32Array, nextSel?: Span) => {
    stop();
    if (!next.length) {
      toast('That would leave no sound at all.', 'error');
      return;
    }
    undo.push(samples);
    if (undo.length > 50) undo.shift();
    redo.length = 0;
    samples = next;
    sel = nextSel;
    cursor = Math.min(cursor, samples.length);
    project.files.set(file, encodeVoc(samples, rate));
    refresh();
  };

  const history = (from: Float32Array[], to: Float32Array[]) => {
    const prev = from.pop();
    if (!prev) return;
    stop();
    to.push(samples);
    samples = prev;
    sel = undefined;
    cursor = Math.min(cursor, samples.length);
    project.files.set(file, encodeVoc(samples, rate));
    refresh();
  };

  /** Applies fn to the selection (or the whole sound) and keeps the changed part selected. */
  const onSpan = (fn: (part: Float32Array) => Float32Array) => {
    const s = spanOf(samples, span());
    let len = 0;
    const next = inSpan(samples, s, (p) => {
      const out = fn(p);
      len = out.length;
      return out;
    });
    commit(next, span() ? { start: s.start, end: s.start + len } : undefined);
  };

  // ---- playing -------------------------------------------------------------------
  const stop = () => {
    if (playing) {
      playing.src.onended = null;
      try {
        playing.src.stop();
      } catch {
        /* already stopped */
      }
    }
    playing = undefined;
    cancelAnimationFrame(raf);
    playBtn.textContent = '▶ Play';
    draw();
  };

  const togglePlay = async () => {
    if (playing) return stop();
    await audio.resume();
    const ctx = audio.context;
    if (!ctx || !samples.length) return;
    audio.stopVoc();
    const s = span() ?? { start: cursor < samples.length - rate * 0.05 ? cursor : 0, end: samples.length };
    const part = samples.subarray(s.start, s.end);
    const buf = ctx.createBuffer(1, Math.max(1, part.length), rate);
    buf.copyToChannel(part.slice() as Float32Array<ArrayBuffer>, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = () => stop();
    src.start();
    playing = { src, from: s.start, started: ctx.currentTime };
    playBtn.textContent = '⏹ Stop';
    const tick = () => {
      draw();
      if (playing) raf = requestAnimationFrame(tick);
    };
    tick();
  };

  // ---- selecting -----------------------------------------------------------------
  const at = (e: PointerEvent) => {
    const r = wave.getBoundingClientRect();
    return Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * samples.length);
  };
  let anchor: number | undefined;
  wave.addEventListener('pointerdown', (e) => {
    wave.setPointerCapture(e.pointerId);
    const p = at(e);
    anchor = e.shiftKey && span() ? (Math.abs(p - sel!.start) > Math.abs(p - sel!.end) ? sel!.start : sel!.end) : p;
    sel = { start: Math.min(anchor, p), end: Math.max(anchor, p) };
    cursor = p;
    refresh();
  });
  wave.addEventListener('pointermove', (e) => {
    if (anchor === undefined) return;
    const p = at(e);
    sel = { start: Math.min(anchor, p), end: Math.max(anchor, p) };
    refresh();
  });
  wave.addEventListener('pointerup', () => {
    anchor = undefined;
    if (sel && sel.end - sel.start < rate * 0.005) sel = undefined; // a click places the cursor
    refresh();
  });
  const keys = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.tagName === 'INPUT') return;
    if (e.key === ' ' && t === wave) {
      e.preventDefault();
      void togglePlay();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) history(redo, undo);
      else history(undo, redo);
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      history(redo, undo);
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
      e.preventDefault();
      sel = { start: 0, end: samples.length };
      refresh();
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && span()) {
      e.preventDefault();
      commit(cut(samples, span()!), undefined);
    } else if (e.key === 'Escape' && span()) {
      e.stopPropagation();
      sel = undefined;
      refresh();
    }
  };

  // ---- recording over ------------------------------------------------------------
  let recording: { stop: () => Promise<Float32Array> } | undefined;
  const recBtn = h('button', { class: 'voc-rec', title: 'Record from the microphone: replaces the selection, or goes in at the cursor' }, '⏺ Record over');
  recBtn.addEventListener('click', async () => {
    if (recording) {
      const r = recording;
      recording = undefined;
      recBtn.textContent = '⏺ Record over';
      recBtn.classList.remove('on');
      try {
        const voice = await r.stop();
        if (!voice.length) return;
        const s = span();
        const start = s ? s.start : cursor;
        commit(splice(samples, start, voice, s ? s.end - s.start : 0), { start, end: start + voice.length });
      } catch {
        toast('That recording could not be read.', 'error');
      }
      return;
    }
    try {
      stop();
      recording = await startRecording(rate);
      recBtn.textContent = '⏹ Stop recording';
      recBtn.classList.add('on');
    } catch {
      toast('The microphone is not available (check the browser’s permission).', 'error');
    }
  });

  // ---- tools ---------------------------------------------------------------------
  const tool = (label: string, title: string, fn: () => void, cls = '') => h('button', { class: cls, title, onclick: fn }, label);
  const needSel = (fn: (s: Span) => void) => () => {
    const s = span();
    if (!s) toast('Drag across the waveform to select part of the sound first.');
    else fn(s);
  };
  const speedOut = h('output', null, '100%');
  const speedInput = h('input', { type: 'range', min: 50, max: 200, step: 5, value: 100, 'aria-label': 'Speed' });
  speedInput.addEventListener('input', () => {
    speed = Number(speedInput.value);
    speedOut.textContent = `${speed}%`;
  });
  const volOut = h('output', null, '100%');
  const volInput = h('input', { type: 'range', min: 10, max: 300, step: 10, value: 100, 'aria-label': 'Volume' });
  volInput.addEventListener('input', () => {
    volume = Number(volInput.value);
    volOut.textContent = `${volume}%`;
  });

  const group = (title: string, ...items: HTMLElement[]) =>
    h('div', { class: 'voc-tools-group' }, h('span', { class: 'voc-tools-title' }, title), h('div', { class: 'voc-tools-row' }, ...items));

  clear(
    host,
    h(
      'div',
      { class: 'voc-edit', onkeydown: keys },
      info,
      h('div', { class: 'voc-edit-scope' }, wave),
      h(
        'div',
        { class: 'toolbar voc-edit-transport' },
        playBtn,
        h('button', { title: 'Select all (Ctrl+A)', onclick: () => ((sel = { start: 0, end: samples.length }), refresh()) }, 'Select all'),
        h('button', { title: 'Select nothing (Esc)', onclick: () => ((sel = undefined), refresh()) }, 'Clear'),
        selInfo,
        h('span', { class: 'spacer' }),
        undoBtn,
        redoBtn,
        h('button', { title: 'Back to the sound as it was when you opened it', onclick: () => commit(original.samples.slice()) }, 'Revert'),
        h(
          'button',
          {
            title: `Download the sound as a WAV file (8-bit mono at ${rate} Hz, exactly as the Sound Blaster plays it)`,
            onclick: () => download(`${file.replace(/\.voc$/i, '')}.wav`, encodeWav(toPcm8(samples), rate), 'audio/wav'),
          },
          '⬇ WAV',
        ),
      ),
      h(
        'div',
        { class: 'voc-tools' },
        group(
          'Cut',
          tool(
            '✂ Trim',
            'Keep only the selection',
            needSel((s) => commit(trim(samples, s), { start: 0, end: s.end - s.start })),
          ),
          tool(
            'Cut',
            'Remove the selection (Delete)',
            needSel((s) => commit(cut(samples, s))),
          ),
          tool(
            'Silence',
            'Make the selection quiet',
            needSel(() => onSpan((p) => new Float32Array(p.length))),
          ),
          tool('+ Pause', 'Insert a quarter second of silence at the cursor', () => commit(splice(samples, cursor, silence(0.25, rate)))),
        ),
        group(
          'Shape',
          tool('◢ Fade in', 'Rise from silence', () => onSpan(fadeIn)),
          tool('◣ Fade out', 'Die away to silence', () => onSpan(fadeOut)),
          tool('⇆ Reverse', 'Play it backwards', () => onSpan(reverse)),
          tool('Normalize', 'Make the loudest point 90% loud', () => onSpan((p) => normalize(p))),
        ),
        group(
          'Volume',
          h('label', { class: 'voc-slider' }, volInput, volOut),
          tool('Apply', 'Change the volume', () => onSpan((p) => gain(p, volume / 100))),
        ),
        group(
          'Speed & pitch',
          h('label', { class: 'voc-slider' }, speedInput, speedOut),
          tool('Apply', 'Faster is shorter and higher; slower is longer and deeper', () => onSpan((p) => resample(p, speed / 100))),
        ),
        group(
          'Effects',
          ...EFFECTS.filter(([e]) => e !== 'none').map(([e, label]) =>
            tool(label, `The ${label.toLowerCase()} effect`, () => onSpan((p) => applyEffect(p, e as Effect, rate))),
          ),
        ),
        group('Microphone', recBtn),
      ),
      h(
        'p',
        { class: 'hint' },
        'Drag across the waveform to select; click to place the cursor; Shift+click extends. Tools change the selection, or the whole sound when nothing is selected. Changes are saved as 8-bit PCM, the way the Sound Blaster plays them.',
      ),
    ),
  );
  const ro = new ResizeObserver(() => draw());
  ro.observe(wave);
  refresh();
  return () => {
    stop();
    ro.disconnect();
    if (recording) void recording.stop().catch(() => undefined);
    audio.stopVoc();
  };
});
